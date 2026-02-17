const { uploadFileToCloudinary } = require("../config/cloudinaryConfig");
const Conversation = require("../models/conversation.model");
const ScheduledMessage = require("../models/scheduledMessage.model");
const response = require("../utils/responseHandler");

exports.createScheduledMessage = async (req, res) => {
    try {
        const { senderId, receiverId, content, scheduledTime, isOneTimeMedia, viewLimit, mediaExpiryDuration } = req.body;
        const file = req.file;

        if (!senderId || !receiverId) {
            return response(res, 400, "Sender and receiver IDs are required");
        }

        if (senderId === receiverId) {
            return response(res, 400, "Cannot send message to yourself");
        }

        const scheduledDate = new Date(scheduledTime);
        if (scheduledDate <= new Date()) {
            return response(res, 400, "Scheduled time must be in the future");
        }

        const participants = [senderId, receiverId].sort();

        let conversation = await Conversation.findOne({ participants });

        if (!conversation) {
            conversation = new Conversation({ participants });
            await conversation.save();
        }

        let imageOrVideoUrl = null;
        let contentType = null;

        if (file) {
            const uploadFile = await uploadFileToCloudinary(file);
            if (!uploadFile?.secure_url) {
                return response(res, 400, "Failed to upload media file");
            }
            imageOrVideoUrl = uploadFile.secure_url;
            contentType = file.mimetype.startsWith("image") ? "image" : file.mimetype.startsWith("video") ? "video" : null;
            if (!contentType) {
                return response(res, 400, "Unsupported file type");
            }
        } else if (content?.trim()) {
            contentType = "text";
        } else {
            return response(res, 400, "Message content is required");
        }

        let oneTimeConfig = {};
        if (isOneTimeMedia === 'true' && (contentType === 'image' || contentType === 'video')) {
            oneTimeConfig = {
                isOneTimeMedia: true,
                viewLimit: parseInt(viewLimit) || 1,
                mediaExpiryDuration: mediaExpiryDuration ? parseInt(mediaExpiryDuration) : null
            };
        }

        const scheduledMessage = new ScheduledMessage({
            conversation: conversation._id,
            sender: senderId,
            receiver: receiverId,
            content: content || "",
            imageOrVideoUrl,
            contentType,
            scheduledTime: scheduledDate,
            ...oneTimeConfig
        });

        await scheduledMessage.save();

        const populatedMessage = await ScheduledMessage.findById(scheduledMessage._id)
            .populate("sender", "username profilePicture")
            .populate("receiver", "username profilePicture");

        if (req.io && req.socketUserMap) {
            const senderSocketId = req.socketUserMap.get(senderId);
            if (senderSocketId) {
                req.io.to(senderSocketId).emit("scheduled_message_created", populatedMessage);
            }
        }

        return response(res, 201, "Scheduled message created successfully", populatedMessage);
    } catch (error) {
        console.error("Create scheduled message error:", error);
        return response(res, 500, "Internal server error");
    }
};

exports.updateScheduledMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { content, scheduledTime } = req.body;
        const userId = req.user.userId;

        const scheduledMessage = await ScheduledMessage.findById(messageId);

        if (!scheduledMessage) {
            return response(res, 404, "Scheduled message not found");
        }

        if (scheduledMessage.sender.toString() !== userId) {
            return response(res, 403, "Unauthorized to update this message");
        }

        if (scheduledMessage.status !== 'pending') {
            return response(res, 400, "Cannot update message that is not pending");
        }

        if (content !== undefined) {
            scheduledMessage.content = content;
        }

        if (scheduledTime) {
            const newScheduledDate = new Date(scheduledTime);
            if (newScheduledDate <= new Date()) {
                return response(res, 400, "Scheduled time must be in the future");
            }
            scheduledMessage.scheduledTime = newScheduledDate;
        }

        await scheduledMessage.save();

        const populatedMessage = await ScheduledMessage.findById(scheduledMessage._id)
            .populate("sender", "username profilePicture")
            .populate("receiver", "username profilePicture");

        if (req.io && req.socketUserMap) {
            const senderSocketId = req.socketUserMap.get(userId);
            if (senderSocketId) {
                req.io.to(senderSocketId).emit("scheduled_message_updated", populatedMessage);
            }
        }

        return response(res, 200, "Scheduled message updated successfully", populatedMessage);
    } catch (error) {
        console.error("Update scheduled message error:", error);
        return response(res, 500, "Internal server error");
    }
};

exports.cancelScheduledMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user.userId;

        const scheduledMessage = await ScheduledMessage.findById(messageId);

        if (!scheduledMessage) {
            return response(res, 404, "Scheduled message not found");
        }

        if (scheduledMessage.sender.toString() !== userId) {
            return response(res, 403, "Unauthorized to cancel this message");
        }

        if (scheduledMessage.status !== 'pending') {
            return response(res, 400, "Cannot cancel message that is not pending");
        }

        scheduledMessage.status = 'cancelled';
        await scheduledMessage.save();

        if (req.io && req.socketUserMap) {
            const senderSocketId = req.socketUserMap.get(userId);
            if (senderSocketId) {
                req.io.to(senderSocketId).emit("scheduled_message_cancelled", messageId);
            }
        }

        return response(res, 200, "Scheduled message cancelled successfully");
    } catch (error) {
        console.error("Cancel scheduled message error:", error);
        return response(res, 500, "Internal server error");
    }
};

exports.getScheduledMessages = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { conversationId } = req.query;

        const query = {
            sender: userId,
            status: 'pending'
        };

        if (conversationId) {
            query.conversation = conversationId;
        }

        const scheduledMessages = await ScheduledMessage.find(query)
            .populate("sender", "username profilePicture")
            .populate("receiver", "username profilePicture")
            .sort({ scheduledTime: 1 });

        return response(res, 200, "Scheduled messages retrieved successfully", scheduledMessages);
    } catch (error) {
        console.error("Get scheduled messages error:", error);
        return response(res, 500, "Internal server error");
    }
};
