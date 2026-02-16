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

        if (expiredMessages.length === 0) return;

        const messageIds = expiredMessages.map(m => m._id);
        
        // Delete expired messages
        await Message.deleteMany({ _id: { $in: messageIds } });

        // Notify connected users via socket
        if (io && socketUserMap) {
            expiredMessages.forEach(msg => {
                const senderSocketId = socketUserMap.get(msg.sender.toString());
                const receiverSocketId = socketUserMap.get(msg.receiver.toString());

                if (senderSocketId) {
                    io.to(senderSocketId).emit('message_expired', msg._id);
                }
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit('message_expired', msg._id);
                }
            });
        }

        console.log(`🗑️ Cleaned up ${expiredMessages.length} expired messages`);
    } catch (error) {
        console.error('Cleanup error:', error);
    }
};

module.exports = { initializeCleanupService };
