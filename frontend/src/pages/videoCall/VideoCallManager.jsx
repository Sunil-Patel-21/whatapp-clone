import React, { useCallback, useEffect } from 'react'
import useVideoCallStore from '../../store/videoCallStore';
import useUserStore from '../../store/useUserStore';
import VideoCallModal from './VideoCallModal';

function VideoCallManager({socket}) {
    const {
        setIncomingCall,
        setCurrentCall,
        setCallType,
        setCallModalOpen,
        setCallStatus,
        endCall

    } = useVideoCallStore();

    const {user} = useUserStore();

    useEffect(()=>{
        if(!socket) return;

        // handle incoming call
        const handleIncomingCall = ({callerId,callerName,callerAvatar,callType,callId}) => {
            console.log("📞 Incoming call from:", callerName);
            setIncomingCall({callerId,callerName,callerAvatar,callId});
            setCallType(callType);
            setCallModalOpen(true);
            setCallStatus("ringing");
        }

        const handleCallEnded = ({reason}) => {
            console.log("Call ended:", reason);
            setCallStatus("ended");
            setTimeout(()=>{
                endCall();
            },1500);
        }

        const handleCallFailed = ({reason}) => {
            console.log("Call failed:", reason);
            setCallStatus("failed");
            setTimeout(()=>{
                endCall();
            },2000);
        }

        socket.on("incoming_call",handleIncomingCall);
        socket.on("call_ended",handleCallEnded);
        socket.on("call_failed",handleCallFailed);

        console.log("✅ VideoCallManager listeners registered");

        return () => {
            socket.off("incoming_call",handleIncomingCall);
            socket.off("call_ended",handleCallEnded);
            socket.off("call_failed",handleCallFailed);
            console.log("🔴 VideoCallManager listeners cleaned");
        }
    },[socket,setIncomingCall,setCallType,setCallModalOpen,setCallStatus,endCall])

    // memorized function to initial call
    const initiateCall = useCallback((receiverId,receiverName,receiverAvatar,callType="video")=>{
        const callId = `${user?._id}-${receiverId}-${Date.now()}`;// unique call id
        const callData = {
            callId,
            participantId:receiverId,
            participantName:receiverName,
            participantAvatar:receiverAvatar,
        }

        setCurrentCall(callData);
        setCallType(callType);
        setCallModalOpen(true);
        setCallStatus("calling");

        socket.emit("initiate_call",{
            callerId:user?._id,
            receiverId,
            callType,
            callerInfo:{username:user?.username,profilePicture:user?.profilePicture}
        });
    },[user,socket,setCurrentCall,setCallType,setCallModalOpen,setCallStatus])

    // expose the function to store data
    useEffect(()=>{
        useUserStore.getState().initiateCall = initiateCall;
    },[initiateCall])

    return <VideoCallModal socket={socket}/>
}

export default VideoCallManager;
