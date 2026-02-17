const cron = require('node-cron');
const ScheduledMessage = require('../models/scheduledMessage.model');
const Message = require('../models/message.model');
const Conversation = require('../models/conversation.model');
const User = require('../models/user.model');

let io = null;
let socketUserMap = null;

const MAX_RETRIES = 3;
const RETRY_DELAY = 60000; // 1 minute

const processScheduledMessages = async () => {
    try {
        const now = new Date();
        
        const dueMessages = await ScheduledMessage.find({
            status: 'pending',
            scheduledTime: { $lte: now }
        })
        .populate('sender', 'username profilePicture')
        .populate('receiver', 'username profilePicture')
        .populate('conversation');

        for (const scheduledMsg of dueMessages) {
            await deliverScheduledMessage(scheduledMsg);
        }
    } catch (error) {
        console.error('Error processing scheduled messages:', error);
    }
};

const deliverScheduledMessage = async (scheduledMsg) => {
    try {
        // Edge case: Check if conversation still exists
        const conversation = await Conversation.findById(scheduledMsg.conversation);
        if (!conversation) {
            scheduledMsg.status = 'failed';
            scheduledMsg.failureReason = 'Conversation deleted';
            await scheduledMsg.save();
            return;
        }

        // Edge case: Check if sender still exists
        const sender = await User.findById(scheduledMsg.sender);
        if (!sender) {
            scheduledMsg.status = 'failed';
            scheduledMsg.failureReason = 'Sender account deleted';
            await scheduledMsg.save();
            return;
        }

        // Edge case: Check if receiver still exists
        const receiver = await User.findById(scheduledMsg.receiver);
        if (!receiver) {
            scheduledMsg.status = 'failed';
            scheduledMsg.failureReason = 'Receiver account deleted';
            await scheduledMsg.save();
            return;
        }

        // Edge case: Check if sender is still participant
        if (!conversation.participants.includes(scheduledMsg.sender._id)) {
            scheduledMsg.status = 'failed';
            scheduledMsg.failureReason = 'Sender left conversation';
            await scheduledMsg.save();
            return;
        }

        // Handle temporary mode
        let isTemporary = false;
        let expiresAt = null;
        if (conversation.isTemporaryMode && conversation.temporaryDuration) {
            isTemporary = true;
            expiresAt = new Date(Date.now() + conversation.temporaryDuration);
        }

        // Handle one-time media
        let oneTimeConfig = {};
        if (scheduledMsg.isOneTimeMedia && (scheduledMsg.contentType === 'image' || scheduledMsg.contentType === 'video')) {
            oneTimeConfig = {
                isOneTimeMedia: true,
                viewLimit: scheduledMsg.viewLimit || 1,
                viewsLeft: scheduledMsg.viewLimit || 1,
                mediaExpiresAt: scheduledMsg.mediaExpiryDuration 
                    ? new Date(Date.now() + scheduledMsg.mediaExpiryDuration) 
                    : null
            };
        }

        // Create actual message
        const message = new Message({
            conversation: scheduledMsg.conversation,
            sender: scheduledMsg.sender._id,
            receiver: scheduledMsg.receiver._id,
            content: scheduledMsg.content,
            imageOrVideoUrl: scheduledMsg.imageOrVideoUrl,
            contentType: scheduledMsg.contentType,
            messageStatus: 'send',
            isTemporary,
            expiresAt,
            ...oneTimeConfig
        });

        await message.save();

        // Update conversation
        conversation.lastMessage = message._id;
        conversation.unreadCount = (conversation.unreadCount || 0) + 1;
        await conversation.save();

        const populatedMessage = await Message.findById(message._id)
            .populate('sender', 'username profilePicture')
            .populate('receiver', 'username profilePicture');

        // Emit socket event to receiver
        if (io && socketUserMap) {
            const receiverSocketId = socketUserMap.get(scheduledMsg.receiver._id.toString());
            if (receiverSocketId) {
                io.to(receiverSocketId).emit('receive_message', populatedMessage);
            }

            // Notify sender that scheduled message was sent
            const senderSocketId = socketUserMap.get(scheduledMsg.sender._id.toString());
            if (senderSocketId) {
                io.to(senderSocketId).emit('scheduled_message_sent', {
                    scheduledMessageId: scheduledMsg._id,
                    message: populatedMessage
                });
            }
        }

        // Mark scheduled message as sent
        scheduledMsg.status = 'sent';
        scheduledMsg.sentAt = new Date();
        await scheduledMsg.save();

        console.log(`✅ Scheduled message ${scheduledMsg._id} delivered successfully`);
    } catch (error) {
        console.error(`❌ Error delivering scheduled message ${scheduledMsg._id}:`, error);

        // Retry logic
        if (scheduledMsg.retryCount < MAX_RETRIES) {
            scheduledMsg.retryCount += 1;
            scheduledMsg.scheduledTime = new Date(Date.now() + RETRY_DELAY);
            await scheduledMsg.save();
            console.log(`🔄 Retry ${scheduledMsg.retryCount}/${MAX_RETRIES} scheduled for message ${scheduledMsg._id}`);
        } else {
            scheduledMsg.status = 'failed';
            scheduledMsg.failureReason = error.message;
            await scheduledMsg.save();

            // Notify sender of failure
            if (io && socketUserMap) {
                const senderSocketId = socketUserMap.get(scheduledMsg.sender._id.toString());
                if (senderSocketId) {
                    io.to(senderSocketId).emit('scheduled_message_failed', {
                        scheduledMessageId: scheduledMsg._id,
                        reason: error.message
                    });
                }
            }
        }
    }
};

const initializeScheduledMessageService = (ioInstance, userMap) => {
    io = ioInstance;
    socketUserMap = userMap;

    // Run every minute
    cron.schedule('* * * * *', () => {
        processScheduledMessages();
    });

    console.log('📅 Scheduled message delivery service initialized');
};

module.exports = { initializeScheduledMessageService };
