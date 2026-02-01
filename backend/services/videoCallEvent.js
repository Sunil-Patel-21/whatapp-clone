const handleVideoCallEvents = (socket,io,onlineUsers) => {
    

    // initiate call
    socket.on("initiate_call",({callerId,receiverId,callType,callerInfo}) => {

        const receiverSocketId = onlineUsers.get(receiverId);

        if(receiverSocketId){
            const callId = `${callerId}-${receiverId}-${Date.now()}`;// unique call id
            io.to(receiverSocketId).emit("incoming_call", {
                callerId,
                callerName:callerInfo.name,
                callerAvatar:callerInfo.profilePicture,
                callType,
                callId
            });
        }else{
            console.log("receiver not online");
            socket.emit("call_failed", {reason:"receiver not online"});
        }
    });

    // accept call
    socket.on("accept_call",({callId,callerId,receiverInfo}) => {
        const callerSocketId = onlineUsers.get(callerId);
        if(callerSocketId){
            io.to(callerSocketId).emit("call_accepted", {
                callId,
                receiverName:receiverInfo.name,
                receiverAvatar:receiverInfo.profilePicture,
                callId
            });
        }else{
            console.log("caller not online");
        }
    });

    // reject call 
    socket.on("reject_call",({callId,callerId}) => {
        const callerSocketId = onlineUsers.get(callerId);
        if(callerSocketId){
            io.to(callerSocketId).emit("call_rejected", {callId});
        }else{
            console.log("caller not online");
        }
    });

    // end call
    socket.on("end_call",({callId,participantId}) => {
        const participantSocketId = onlineUsers.get(participantId);
        if(callerSocketId){
            io.to(participantSocketId).emit("call_ended", {participantId});
        }else{
            console.log("caller not online");
        }
    });

    // webRTC signaling events
    socket.on("webrtc_offer",({offer,callId,receiverId}) => {
        const receiverSocketId = onlineUsers.get(receiverId);
        if(receiverSocketId){
            io.to(receiverSocketId).emit("webrtc_offer", {
                offer,
                callId,
                senderId:socket.userId
            });
            console.log(`server offer forward to ${receiverId} `);
        }else{
            console.log(`server offer forward to ${receiverId} failed`);
        }
    });

    // webRTC signaling events answer 
    socket.on("webrtc_answer",({answer,callId,receiverId}) => {
        const receiverSocketId = onlineUsers.get(receiverId);
        if(receiverSocketId){
            io.to(receiverSocketId).emit("webrtc_answer", {
                answer,
                callId,
                senderId:socket.userId
            });
            console.log(`server answer forward to ${receiverId} `);
        }else{
            console.log(`server answer forward to ${receiverId} failed`);
        }
    });

    // webRTC signaling events ice candidate
    socket.on("webrtc_ice_candidate",({candidate,callId,receiverId}) => {
        const receiverSocketId = onlineUsers.get(receiverId);
        if(receiverSocketId){
            io.to(receiverSocketId).emit("webrtc_ice_candidate", {
                candidate,
                callId,
                senderId:socket.userId
            });
            console.log(`server ice candidate forward to ${receiverId} `);
        }else{
            console.log(`server ice candidate forward to ${receiverId} failed`);
        }
    });

}

module.exports = handleVideoCallEvents