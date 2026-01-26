const { uploadFileToCloudinary } = require("../config/cloudinaryConfig");
const Conversation = require("../models/conversation.model");
const Message = require("../models/message.model");
const response = require("../utils/responseHandler");

exports.sendMessage = async (req, res) => {
    try {
        const { senderId, receiverId, messageStatus,content } = req.body;
        const file = req.files;
        const participants = [senderId, receiverId].sort();

        // check if conversation all ready exists.
        let conversation = await Conversation.findOne({
            participants: participants
        })

        if (!conversation) {
            conversation = new Conversation({
                participants,
            })
        }
        await conversation.save();
        let imageOrVideoUrl = null;
        let contentType = null; 

        // handle file upload
        if(file){
            const uploadFile = await uploadFileToCloudinary(file);
            if(!uploadFile?.secure_url){
                return response(res,400,"failed to upload media file");
            }
            imageOrVideoUrl = uploadFile.secure_url;
            if(file.mimetype.startsWith("image")){
                contentType = "image";
            }else if (file.mimetype.startsWith("video")) {
                contentType = "video";
            }else{
                return response(res,400,"unsupported file type");
            }
        }else if(content?.trim()){
            contentType = "text";
        }else{
            return response(res,400,"message content is required");
        }

        const message = new Message({
            conversation: conversation._id,
            sender: senderId,
            receiver: receiverId,
            content,
            imageOrVideoUrl,
            contentType,
            messageStatus
        });
        await message.save();
        if(message?.content){
            conversation.lastMessage = message?._id;
        }
        conversation.unreadCount = conversation?.unreadCount + 1;
        await conversation.save();

        const populatedMessage = await Message.findById(message._id)
        .populate("sender","username profilePicture")
        .populate("receiver","username profilePicture");

        // emit socket event 
        if(req.io && req.socketUserMap){
            // broadcast to all connecting users except the sender
            const receiverSocketId = req.socketUserMap.get(receiverId);
            if(receiverSocketId){
                req.io.to(receiverSocketId).emit("receive_message",populatedMessage);
                message.messageStatus = "delivered";
                await message.save();
            }
        }

        return response(res,200,"message sent successfully",populatedMessage);
    } catch (error) {
        console.error(error);
        return response(res,500,"Internal server error");
    }
}

// get all conversation
exports.getConversation = async (req,res)=>{
    const userId = req.user.userId;
    try {
        const conversations = await Conversation.find({ 
        participants: userId })
        .populate("participants","username profilePicture isOnline lastSeen ")
        .populate({
            path:"lastMessage",
            populate:{
                path:"sender",
                select:"username profilePicture"
            }
        }).sort({updatedAt:-1})
        return response(res,201,"conversations retrieved successfully",conversations);
    } catch (error) {
        console.error(error);
        return response(res,500,"Internal server error");
    }
}

// get message of specific conversation

exports.getMessages = async (req,res)=>{
    const {conversationId} = req.params;
    const userId = req.user.userId;
    try {
        const conversation = await Conversation.findById(conversationId);
        if(!conversation){
            return response(res,404,"conversation not found");
        }
        if(!conversation.participants.includes(userId)){
            return response(res,403,"unauthorized user");
        }
        const messages = await Message.find({conversation:conversationId})
        .populate("sender","username profilePicture")
        .populate("receiver","username profilePicture")
        .sort("createdAt");

        await Message.updateMany({
            conversation:conversationId,
            receiver:userId,
            messageStatus:{$in:["send","delivered"]}
        },{
            $set:{messageStatus:"read"}
        })
        conversation.unreadCount = 0;
        await conversation.save();
        return response(res,200,"messages retrieved successfully",messages);
    } catch (error) {
        console.error(error);
        return response(res,500,"Internal server error");
    }
}

// mark as read
exports.markAsRead = async (req,res)=>{
    const {messageId} = req.body;
    const userId = req.user.userId;
    try {
        let messages = await Message.find({
            _id:{$in:messageId},
            receiver:userId,
        });
        await Message.updateMany({
            _id:{$in:messageId},
            receiver:userId,
        },{
            $set:{messageStatus:"read"}
        })

        // emit socket event  => notify to original sender
        if(req.io && req.socketUserMap){
            for(const message of messages){
                const senderSocketId = req.socketUserMap.get(message.sender.toString());
                if(senderSocketId){
                    const updatedMessage = {
                        _id:message._id,
                        messageStatus: "read"
                    }
                    req.io.to(senderSocketId).emit("message_read",updatedMessage);
                    await message.save();
                }
            }
        }

        return response(res,200,"messages marked as read successfully",messages);
    } catch (error) {
        console.error(error);
        return response(res,500,"Internal server error");
    }
}

// delete message
exports.deleteMessage = async (req,res)=>{
    const {messageId} = req.body;
    const userId = req.user.userId;
    try {
        let messages = await Message.findById(messageId);
        if(!messages){
            return response(res,404,"message not found");
        }
        if(messages.sender.toString() !== userId){
            return response(res,403,"unauthorized user to delete this message");
        }
        await Message.findByIdAndDelete(messageId);


        // emit socket event 
        if(req.io && req.socketUserMap){
            const receiverSocketId = req.socketUserMap.get(messages.receiver.toString());
            if(receiverSocketId){
                req.io.to(receiverSocketId).emit("message_deleted",messageId);
            }
        }

        return response(res,200,"messages deleted successfully",messages);
    } catch (error) {
        console.error(error);
        return response(res,500,"Internal server error");
    }
}
