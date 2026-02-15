const handleVideoCallEvents = (socket,io,onlineUsers) => {
    

    // initiate call
    socket.on("initiate_call",({callerId,receiverId,callType,callerInfo}) => {
        console.log(`📞 Call initiated: ${callerId} -> ${receiverId} (${callType})`);
        
        const receiverSocketId = onlineUsers.get(receiverId);

        if(receiverSocketId){
            const callId = `${callerId}-${receiverId}-${Date.now()}`;// unique call id
            io.to(receiverSocketId).emit("incoming_call", {
                callerId,
                callerName:callerInfo.username,
                callerAvatar:callerInfo.profilePicture,
                callType,
                callId
            });
            console.log(`✅ Call notification sent to ${receiverId}`);
        }else{
            console.log(`❌ Receiver ${receiverId} not online`);
            socket.emit("call_failed", {reason:"Receiver is not online"});
        }
    });

    // accept call
    socket.on("accept_call",({callId,callerId,receiverInfo}) => {
        const callerSocketId = onlineUsers.get(callerId);
        if(callerSocketId){
            io.to(callerSocketId).emit("call_accepted", {
                callId,
                receiverName:receiverInfo.username,
                receiverAvatar:receiverInfo.profilePicture
            });
            console.log(`Call accepted by ${receiverInfo.username}, notifying caller ${callerId}`);
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
        console.log(`📞 Call ended: ${callId}`);
        const participantSocketId = onlineUsers.get(participantId);
        if(participantSocketId){
            io.to(participantSocketId).emit("call_ended", {callId, reason: "Call ended by peer"});
            console.log(`✅ End call notification sent to ${participantId}`);
        }else{
            console.log(`❌ Participant ${participantId} not online`);
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
        console.log("connecting ice candidate");
        
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