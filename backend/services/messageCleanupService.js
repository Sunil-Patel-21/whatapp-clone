const cron = require('node-cron');
const Message = require('../models/message.model');

let io = null;
let socketUserMap = null;

const initializeCleanupService = (socketIo, userMap) => {
    io = socketIo;
    socketUserMap = userMap;

    // Run every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
        try {
            await cleanupExpiredMessages();
        } catch (error) {
            console.error('Message cleanup error:', error);
        }
    });

    console.log('✅ Message cleanup scheduler initialized');
};

const cleanupExpiredMessages = async () => {
    try {
        const expiredMessages = await Message.find({
            isTemporary: true,
            expiresAt: { $lte: new Date() }
        }).select('_id conversation sender receiver');

        // Find expired one-time media
        const expiredMedia = await Message.find({
            isOneTimeMedia: true,
            $or: [
                { viewsLeft: { $lte: 0 } },
                { mediaExpiresAt: { $lte: new Date() } }
            ]
        }).select('_id conversation sender receiver');

        const allExpired = [...expiredMessages, ...expiredMedia];
        if (allExpired.length === 0) return;

        const messageIds = allExpired.map(m => m._id);
        
        // Delete expired messages
        await Message.deleteMany({ _id: { $in: messageIds } });

        // Notify connected users via socket
        if (io && socketUserMap) {
            allExpired.forEach(msg => {
                const senderSocketId = socketUserMap.get(msg.sender.toString());
                const receiverSocketId = socketUserMap.get(msg.receiver.toString());

                const eventName = expiredMedia.some(m => m._id.equals(msg._id)) ? 'media_expired' : 'message_expired';

                if (senderSocketId) {
                    io.to(senderSocketId).emit(eventName, msg._id);
                }
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit(eventName, msg._id);
                }
            });
        }

        console.log(`🗑️ Cleaned up ${allExpired.length} expired messages/media`);
    } catch (error) {
        console.error('Cleanup error:', error);
    }
};

module.exports = { initializeCleanupService };
