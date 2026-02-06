const { uploadFileToCloudinary } = require("../config/cloudinaryConfig");
const Status = require("../models/status.model");
const Message = require("../models/message.model");
const response = require("../utils/responseHandler");

exports.createStatus = async (req, res) => {
    try {
        const { content } = req.body;
        const userId = req.user.userId;
        const file = req.file;

        if (!userId) {
            return response(res, 401, "Unauthorized");
        }

        let mediaUrl = null;
        let finalContentType = "text";

        // handle file upload
        if(file){
            // Validate file size (max 50MB)
            if (file.size > 50 * 1024 * 1024) {
                return response(res, 400, "File size exceeds 50MB limit");
            }
            
            const uploadFile = await uploadFileToCloudinary(file);
            if(!uploadFile?.secure_url){
                return response(res,400,"failed to upload media file");
            }
            mediaUrl = uploadFile.secure_url;
            if(file.mimetype.startsWith("image")){
                finalContentType = "image";
            }else if (file.mimetype.startsWith("video")) {
                finalContentType = "video";
            }else{
                return response(res,400,"unsupported file type");
            }
        }else if(content?.trim()){
            // Validate text content length
            if (content.trim().length > 500) {
                return response(res, 400, "Status text exceeds 500 characters");
            }
            finalContentType = "text";
        }else{
            return response(res,400,"status content is required");
        }

        const expireAt = new Date();
        expireAt.setHours(expireAt.getHours() + 24);

        const status = new Status({
            user: userId,
            content:mediaUrl || content,
            contentType:finalContentType,
            expiredAt:expireAt
        });
        await status.save();

        const populatedStatus = await Status.findById(status?._id)
        .populate("user","username profilePicture")
        .populate("viewers","username profilePicture");

        if (!populatedStatus) {
            return response(res, 500, "Failed to create status");
        }

         // emit socket event 
        if(req.io && req.socketUserMap){
            try {
                // broadcast to all connecting users except the creator
                for(const [connectedUserId, socketId] of req.socketUserMap){
                    if(connectedUserId !== userId){
                        req.io.to(socketId).emit("new_status",populatedStatus);
                    }
                }
            } catch (socketError) {
                console.error("Socket broadcast error:", socketError);
                // Don't fail the request if socket fails
            }
        }

        return response(res,200,"status created successfully",populatedStatus);
    } catch (error) {
        console.error(error);
        return response(res,500,"Internal server error");
    }
}

exports.getStatuses = async (req, res) => {
    try {
        const statuses = await Status.find({
            expiredAt:{$gt:new Date()}
        })
        .populate("user","username profilePicture")
        .populate("viewers","username profilePicture")
        .sort({createdAt:-1});
        return response(res,200,"statuses retrieved successfully",statuses);
    } catch (error) {
        console.error(error);
        return response(res,500,"Internal server error");
    }
}

exports.viewStatus = async (req, res) => {
    const {statusId} = req.params;
    const userId = req.user.userId;
    try {
        const status = await Status.findById(statusId);
        if(!status){
            return response(res,404,"status not found");
        }
        
        const statusOwnerId = status.user.toString();
        
        // check if user has already viewed the status
        if(!status.viewers.includes(userId)){
            status.viewers.push(userId);
            await status.save();

            const updatedStatus = await Status.findById(statusId)
            .populate("user","username profilePicture")
            .populate("viewers","username profilePicture");

            // emit socket event 
            if(req.io && req.socketUserMap){
                try {
                    // broadcast to status owner
                    const statusOwnerSocketId = req.socketUserMap.get(statusOwnerId);
                    if(statusOwnerSocketId){
                        req.io.to(statusOwnerSocketId).emit("status_viewed", statusId, updatedStatus.viewers);
                    } else {
                        console.log("Status owner not connected");
                    }
                } catch (socketError) {
                    console.error("Socket broadcast error:", socketError);
                }
            }
        }else{
            console.log("user already viewed the status");
        }
        return response(res,200,"status viewed successfully",status);
    } catch (error) {
        console.error(error);
        return response(res,500,"Internal server error");
    }
}

exports.deleteStatus = async (req, res) => {
    const {statusId} = req.params;
    const userId = req.user.userId;
    try {
        const status = await Status.findById(statusId);
        if(!status){
            return response(res,404,"status not found");
        }
        // check if user is the owner of the status
        if(status.user.toString() !== userId){
            return response(res,403,"unauthorized user to delete this status");
        }
        await Status.findByIdAndDelete(statusId);

        // emit socket event 
        if(req.io && req.socketUserMap){
            // broadcast to all connecting users including the creator
            for(const [connectedUserId, socketId] of req.socketUserMap){
                req.io.to(socketId).emit("status_deleted",statusId);
            }
        }

        return response(res,200,"status deleted successfully");
    } catch (error) {
        console.error(error);
        return response(res,500,"Internal server error");
    }
}