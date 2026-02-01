
const dotenv = require("dotenv").config();
const {Server} = require("socket.io");
const User = require("../models/user.model");
const Message = require("../models/message.model");
const handleVideoCallEvents = require("./videoCallEvent");

// map to store online users -> userId , socketId
const onlineUsers = new Map();

// Map to track typing status => userId 
const typingUsers = new Map();

const initializeSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL,
            credentials: true,
            methods: ["GET","POST","PUT","DELETE","OPTIONS"]
        },
        pingTimeout: 60000 // after 60 seconds user is considered offline
    });

    // new socket connection 
    io.on("connection", (socket) => {
        console.log("new user connected", socket.id);
        let userId = null;

        // handle user connection and mark them as online in db
        socket.on("user_connected", async (connectingUserId) => {
            try {
                userId = connectingUserId
                socket.userId = userId;
                onlineUsers.set(userId, socket.id);
                socket.join(userId);  // join personal room

                // update user status in db
                await User.findByIdAndUpdate(userId, {
                isOnline: true,
                lastSeen: new Date()
                }, {new: true});

                // notify all user that this user is online
                io.emit("user_status", {userId,isOnline: true});
            } catch (error) {
                console.error(error);
            }
        })

        // return online status of requested user

        socket.on("get_user_status", async (requestedUserId,callback) => {
            const isOnline = onlineUsers.has(requestedUserId);
            callback({
                userId: requestedUserId,
                isOnline,
                lastSeen: isOnline ? new Date () : null
            });
        })

        // forward message to receiver if online
        socket.on("send_message", async (message) => {
            try {
                const receiverSocketId = onlineUsers.get(message.receiver?._id);
                if(receiverSocketId){
                    io.to(receiverSocketId).emit("receive_message", message);
                }
            } catch (error) {
                console.error("Error sending message : ",error.message);
                socket.emit("message_error", {error:"Failed to send error"});
            }
        })

        // update message as read and notify sender
        socket.on("message_read",async({messageIds, senderId}) => {
            try {
                await Message.updateMany({_id:{$in:messageIds}},{$set:{messageStatus:"read"}});
                const senderSocketId = onlineUsers.get(senderId);
                if(senderSocketId){
                    messageIds.forEach(messageId => io.to(senderSocketId).emit("message_status_updated", {messageId,messageStatus:"read"}));
                }
            } catch (error) {
                console.error("Error updating message status : ",error);
            }
        })

        // handle  Typing start event auto stop after 3s
        socket.on("typing_start",async ({userId,conversationId,receiverId}) => {
            if(!userId || !conversationId || !receiverId) return ;
            if(!typingUsers.has(userId)) typingUsers.set(userId,{});

            const userTyping = typingUsers.get(userId);
            userTyping[conversationId] = true;

            // clear any existing time out
            if(userTyping[`${conversationId}_timeout`]){
                clearTimeout(userTyping[`${conversationId}_timeout`]);

            }

            // auto stop after 3s
            userTyping[`${conversationId}_timeout`] = setTimeout(() => {
                userTyping[conversationId] = false;
                socket.to(receiverId).emit("user_typing", {userId,conversationId,isTyping:false});
            },3000)

            // notify receiver that user is typing
            socket.to(receiverId).emit("user_typing", {userId,conversationId,isTyping:true});
        })

        // handle typing stop event
        socket.on("typing_stop",async ({userId,conversationId,receiverId}) => {
            if(!userId || !conversationId || !receiverId) return ;
            if(typingUsers.has(userId)){
                const userTyping = typingUsers.get(userId);
                userTyping[conversationId] = false;

                if(userTyping[`${conversationId}_timeout`]){
                    clearTimeout(userTyping[`${conversationId}_timeout`])
                    delete userTyping[`${conversationId}_timeout`];
                }
            }

            socket.to(receiverId).emit("user_typing", {userId,conversationId,isTyping:false});
        });

        // add or update reaction on message

        socket.on("add_reaction",async ({messageId,userId:reactionUserId,emoji}) => {
            try {
                    const message = await Message.findById(messageId);
                    if(!message) return;
                    const exitingIndex = message.reactions.findIndex(reaction => reaction.user.toString() === reactionUserId);
                    if(exitingIndex > -1){
                        const exiting = message.reactions[exitingIndex];
                        if(exiting.emoji === emoji){
                            // remove same reaction
                            message.reactions.splice(exitingIndex,1);
                        }else{
                            // update reaction
                            message.reactions[exitingIndex] = {emoji, user:reactionUserId}
                        }
                    }else{
                        // add new reaction
                        message.reactions.push({emoji, user:reactionUserId})
                    } 
                    await message.save();
                    const populatedMessage = await Message.findById(messageId)
                    .populate("sender","username profilePicture")
                    .populate("receiver","username profilePicture")
                    .populate("reactions.user","username");

                    const reactionUpdated = {
                        messageId,
                        reactions:populatedMessage.reactions
                    }

                    const senderSocket = onlineUsers.get(populatedMessage.sender._id.toString());
                    const receiverSocket = onlineUsers.get(populatedMessage.receiver._id.toString());
                    if(senderSocket){
                        io.to(senderSocket).emit("reaction_updated", reactionUpdated);
                    }
                    if(receiverSocket){
                        io.to(receiverSocket).emit("reaction_updated", reactionUpdated);
                    }
            } catch (error) {
                console.error("Error  : ",error.message);
            }
        })

        // handle videoCallEvents
        handleVideoCallEvents(socket,io,onlineUsers);

        // handle disconnection
        const handleDisconnected = async()=>{
            if(!userId) return ;
            try {
                onlineUsers.delete(userId);
                // clear all typing timeouts
                    if(typingUsers.has(userId)){
                        const userTyping = typingUsers.get(userId);
                        Object.keys(userTyping).forEach((key) => {
                        if(key.endsWith("_timeout")){
                            clearTimeout(userTyping[key]);
                        }
                    })
                typingUsers.delete(userId);
                }

                await User.findByIdAndUpdate(userId,{isOnline:false,lastSeen:Date.now()});
                io.emit("user_status", {
                    userId,
                    isOnline:false,
                    lastSeen:Date.now()
                });

                socket.leave(userId);
                console.log(`User ${userId} disconnected`);
            } catch (error) {
                console.error("Error : ",error.message);
            }
        }

        // disconnect event
        socket.on("disconnect",handleDisconnected);
    })
    io.socketUserMap = onlineUsers;

    return io;
}

module.exports = initializeSocket;
