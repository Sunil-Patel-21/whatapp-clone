import React, { useEffect, useMemo, useRef } from "react";
import useVideoCallStore from "../../store/videoCallStore";
import useThemeStore from "../../store/themeStore";
import useUserStore from "../../store/useUserStore";
import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaPhoneSlash,
  FaTimes,
  FaVideo,
  FaVideoSlash,
  FaExclamationCircle,
} from "react-icons/fa";

function VideoCallModal({ socket }) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const isProcessingOfferRef = useRef(false);
  const isProcessingAnswerRef = useRef(false);
  const callStartTimeRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 3;

  const {
    currentCall,
    incomingCall,
    isCallActive,
    callType,
    localStream,
    isVideoEnabled,
    remoteStream,
    isAudioEnabled,
    peerConnection,
    iceCandidatesQueue,
    isCallModalOpen,
    callStatus,
    failureReason,
    setIncomingCall,
    setCurrentCall,
    setCallType,
    setCallModalOpen,
    setCallStatus,
    endCall,
    setIsCallActive,
    setLocalStream,
    setRemoteStream,
    setPeerConnection,
    addIceCandidate,
    processQueuedIceCandidates,
    toggleVideo,
    toggleAudio,
    clearIncomingCall,
  } = useVideoCallStore();

  const { theme } = useThemeStore();
  const { user } = useUserStore();

  const rtcConfiguration = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      {
        urls: "turn:openrelay.metered.ca:80",
        username: "openrelayproject",
        credential: "openrelayproject"
      },
      {
        urls: "turn:openrelay.metered.ca:443",
        username: "openrelayproject",
        credential: "openrelayproject"
      }
    ],
    iceCandidatePoolSize: 10
  };

  // memorized display
  const displayInfo = useMemo(() => {
    if (incomingCall && !isCallActive) {
      return {
        name: incomingCall.callerName,
        avatar: incomingCall.callerAvatar,
      };
    } else if (currentCall) {
      return {
        name: currentCall.participantName,
        avatar: currentCall.participantAvatar,
      };
    }
    return null;
  }, [incomingCall, currentCall, isCallActive]);

  // connection detection
  useEffect(() => {
    if (peerConnection && remoteStream) {
      if (!callStartTimeRef.current) {
        callStartTimeRef.current = Date.now();
        console.log(`⏱️ Call started at ${new Date().toLocaleTimeString()}`);
      }
      
      setCallStatus("connected");
      setIsCallActive(true);

      const interval = setInterval(() => {
        const duration = Math.floor((Date.now() - callStartTimeRef.current) / 1000);
        console.log(`🔴 Call active: ${duration}s`);
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [peerConnection, remoteStream, setCallStatus, setIsCallActive]);

  // setup local video stream when local stream change
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // setup remote video stream when remote stream change
  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Cleanup media on call failure
  useEffect(() => {
    if (callStatus === "failed" || callStatus === "rejected" || callStatus === "ended") {
      const cleanup = setTimeout(() => {
        if (localStream) {
          localStream.getTracks().forEach((track) => {
            track.stop();
            console.log(`Stopped ${track.kind} track`);
          });
          setLocalStream(null);
        }
      }, 100);
      return () => clearTimeout(cleanup);
    }
  }, [callStatus, localStream, setLocalStream]);

  // initialize media stream
  const initialiZeMedia = async (isVideo = true) => {
    try {
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: isVideo ? {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user"
        } : false
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      return stream;
    } catch (error) {
      console.error("Media error", error);
      setCallStatus("failed");
      
      // Cleanup on media error
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      
      setTimeout(handleEndCall, 2000);
      throw error;
    }
  };

  // create peer connection
  const createPeerConnection = (stream, role) => {
    if (peerConnectionRef.current) {
      console.log(`⚠️ ${role}: Closing existing peer connection`);
      peerConnectionRef.current.close();
    }

    const pc = new RTCPeerConnection(rtcConfiguration);
    peerConnectionRef.current = pc;
    let disconnectTimer = null;

    console.log(`🔧 ${role}: Created new RTCPeerConnection`);

    // add local tracks
    if (stream) {
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });
    }

    // handle ice candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        const participantId =
          currentCall?.participantId || incomingCall?.callerId;
        const callId = currentCall?.callId || incomingCall?.callId;
        if (participantId && callId) {
          socket.emit("webrtc_ice_candidate", {
            candidate: event.candidate,
            receiverId: participantId,
            callId: callId,
          });
        }
      }
    };

    // handle remote stream
    pc.ontrack = (event) => {
      console.log(`${role}: Received remote track`, event.track.kind);
      if (event.streams && event.streams[0]) {
        console.log(`${role}: Setting remote stream with ${event.streams[0].getTracks().length} tracks`);
        setRemoteStream(event.streams[0]);
      } else {
        console.log(`${role}: Creating new MediaStream for track`);
        const stream = new MediaStream([event.track]);
        setRemoteStream(stream);
      }
    };

    // handle connection state
    pc.onconnectionstatechange = () => {
      console.log(`${role}: Connection state:`, pc.connectionState);
      
      if (disconnectTimer) {
        clearTimeout(disconnectTimer);
        disconnectTimer = null;
      }

      if (pc.connectionState === "connected") {
        console.log(`✅ ${role}: Call connected successfully`);
        setCallStatus("connected");
        setIsCallActive(true);
      } else if (pc.connectionState === "failed") {
        console.log(`❌ ${role}: Connection failed`);
        setCallStatus("failed");
        setTimeout(handleEndCall, 2000);
      } else if (pc.connectionState === "disconnected") {
        console.log(`⚠️ ${role}: Disconnected, waiting 10s for reconnection...`);
        disconnectTimer = setTimeout(() => {
          if (pc.connectionState === "disconnected") {
            console.log(`❌ ${role}: Reconnection failed after 10s`);
            setCallStatus("failed");
            handleEndCall();
          }
        }, 10000);
      }
    };

    // handle ICE connection state with reconnection
    pc.oniceconnectionstatechange = async () => {
      console.log(`${role}: ICE state:`, pc.iceConnectionState);
      
      if (pc.iceConnectionState === 'disconnected') {
        console.log(`⚠️ ${role}: ICE disconnected, attempting reconnection...`);
        setCallStatus('reconnecting');
        
        if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts.current++;
          console.log(`🔄 Reconnect attempt ${reconnectAttempts.current}/${MAX_RECONNECT_ATTEMPTS}`);
          
          // Wait 2 seconds before restart
          setTimeout(async () => {
            if (pc.iceConnectionState === 'disconnected' && pc.signalingState === 'stable') {
              try {
                const offer = await pc.createOffer({ iceRestart: true });
                await pc.setLocalDescription(offer);
                
                const participantId = currentCall?.participantId || incomingCall?.callerId;
                const callId = currentCall?.callId || incomingCall?.callId;
                
                if (socket && participantId && callId) {
                  socket.emit('webrtc_offer', {
                    offer,
                    receiverId: participantId,
                    callId
                  });
                  console.log('📤 ICE restart offer sent');
                }
              } catch (error) {
                console.error('ICE restart failed:', error);
              }
            }
          }, 2000);
        } else {
          console.log('❌ Max reconnection attempts reached');
          setCallStatus('failed');
          setTimeout(handleEndCall, 2000);
        }
      } else if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        reconnectAttempts.current = 0;
        setCallStatus('connected');
      } else if (pc.iceConnectionState === 'failed') {
        console.log('❌ ICE connection failed permanently');
        setCallStatus('failed');
        setTimeout(handleEndCall, 2000);
      }
    };

    setPeerConnection(pc);
    
    // Log ICE gathering state
    pc.onicegatheringstatechange = () => {
      console.log(`${role}: ICE gathering state:`, pc.iceGatheringState);
    };

    return pc;
  };

  // caller : Initialize call after acceptance
  const initializeCallerCall = async () => {
    try {
      setCallStatus("connecting");

      const stream = await initialiZeMedia(callType === "video");
      console.log(`📹 CALLER: Got local stream with ${stream.getTracks().length} tracks`);
      
      const pc = createPeerConnection(stream, "CALLER");

      // Verify tracks are added
      const senders = pc.getSenders();
      console.log(`📤 CALLER: Added ${senders.length} tracks to peer connection`);

      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: callType === "video",
      });

      await pc.setLocalDescription(offer);
      console.log("📤 CALLER: Sending offer");
      
      socket.emit("webrtc_offer", {
        offer,
        receiverId: currentCall?.participantId,
        callId: currentCall?.callId,
      });
    } catch (error) {
      console.error("❌ Caller error:", error);
      setCallStatus("failed");
      setTimeout(handleEndCall, 2000);
    }
  };

  // receiver answer the call
  const handleAnswerCall = async () => {
    try {
      setCallStatus("connecting");

      // get media first
      const stream = await initialiZeMedia(callType === "video");
      console.log(`📹 RECEIVER: Got local stream with ${stream.getTracks().length} tracks`);

      // create peer connection
      const pc = createPeerConnection(stream, "RECEIVER");
      
      // Verify tracks are added
      const senders = pc.getSenders();
      console.log(`📤 RECEIVER: Added ${senders.length} tracks to peer connection`);
      
      // Wait a bit for peer connection to stabilize
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // notify caller that call is accepted
      socket.emit("accept_call", {
        callerId: incomingCall?.callerId,
        callId: incomingCall?.callId,
        receiverInfo: {
          username: user?.username,
          profilePicture: user?.profilePicture,
        },
      });

      // update current call state
      setCurrentCall({
        callId: incomingCall?.callId,
        participantId: incomingCall?.callerId,
        participantName: incomingCall?.callerName,
        participantAvatar: incomingCall?.callerAvatar,
      });

      clearIncomingCall();
    } catch (error) {
      console.error("Receiver error:", error);
      handleEndCall();
    }
  };

  const handleRejectCall = () => {
    if (incomingCall) {
      socket.emit("reject_call", {
        callerId: incomingCall?.callerId,
        callId: incomingCall?.callId,
      });
    }
    
    // Cleanup peer connection if exists
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    endCall();
  };

  const handleEndCall = () => {
    const participantId = currentCall?.participantId || incomingCall?.callerId;
    const callId = currentCall?.callId || incomingCall?.callId;

    console.log(`🔴 handleEndCall called - callId: ${callId}`);

    if (participantId && callId && socket) {
      socket.emit("end_call", {
        callId: callId,
        participantId: participantId,
      });
    }

    // Cleanup peer connection properly
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Cleanup local video ref
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }

    // Cleanup remote video ref
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    // Reset all refs
    callStartTimeRef.current = null;
    reconnectAttempts.current = 0;
    isProcessingOfferRef.current = false;
    isProcessingAnswerRef.current = false;

    endCall();
  };

  // socket event listeners - CRITICAL: Must be registered early
  useEffect(() => {
    if (!socket) return;

    // handle call accepted by receiver
    const handleCallAccepted = ({ receiverName }) => {
      console.log(`✅ Call accepted by: ${receiverName}`);
      if (currentCall) {
        setTimeout(() => {
          console.log("📤 Initializing caller call...");
          initializeCallerCall();
        }, 300);
      }
    };

    const handleCallRejected = () => {
      console.log("Call rejected");
      setCallStatus("rejected");
      setTimeout(handleEndCall, 2000);
    };

    const handleCallEnded = () => {
      console.log("📞 Call ended by peer");
      endCall();
    };

    // RECEIVER: Handle incoming offer from caller
    const handleWebRTCOffer = async ({ offer, senderId, callId }) => {
      console.log(`📥 RECEIVER: Got offer from ${senderId}`);
      
      const pc = peerConnectionRef.current;
      if (!pc) {
        console.error("❌ RECEIVER: No peer connection available");
        return;
      }

      if (isProcessingOfferRef.current) {
        console.log("⚠️ RECEIVER: Already processing offer, ignoring duplicate");
        return;
      }

      if (pc.signalingState !== "stable" && pc.signalingState !== "have-local-offer") {
        console.log(`⚠️ RECEIVER: Invalid state ${pc.signalingState}, ignoring`);
        return;
      }

      isProcessingOfferRef.current = true;

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        console.log("✅ RECEIVER: Remote description set");

        await processQueuedIceCandidates();

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        console.log("📤 RECEIVER: Sending answer");

        socket.emit("webrtc_answer", {
          answer,
          receiverId: senderId,
          callId,
        });
      } catch (error) {
        console.error("❌ RECEIVER: Offer handling error:", error);
        setCallStatus("failed");
        setTimeout(handleEndCall, 2000);
      } finally {
        isProcessingOfferRef.current = false;
      }
    };

    // CALLER: Handle answer from receiver
    const handleWebRTCAnswer = async ({ answer, senderId, callId }) => {
      console.log(`📥 CALLER: Got answer from ${senderId}`);
      
      const pc = peerConnectionRef.current;
      if (!pc) {
        console.error("❌ CALLER: No peer connection");
        return;
      }

      if (pc.signalingState === "closed" || pc.signalingState === "stable") {
        console.log(`⚠️ CALLER: Connection in ${pc.signalingState} state, ignoring answer`);
        return;
      }

      if (isProcessingAnswerRef.current) {
        console.log("⚠️ CALLER: Already processing answer, ignoring duplicate");
        return;
      }

      isProcessingAnswerRef.current = true;

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        console.log("✅ CALLER: Remote description set");
        await processQueuedIceCandidates();
      } catch (error) {
        console.error("❌ CALLER: Answer handling error:", error);
        setCallStatus("failed");
        setTimeout(handleEndCall, 2000);
      } finally {
        isProcessingAnswerRef.current = false;
      }
    };

    // Handle ICE candidates from peer
    const handleWebRTCICECandidate = async ({ candidate, senderId }) => {
      const pc = peerConnectionRef.current;
      
      if (!pc || pc.signalingState === "closed") {
        addIceCandidate(candidate);
        return;
      }

      if (pc.remoteDescription) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
          console.log(`✅ ICE candidate added from ${senderId}`);
        } catch (error) {
          console.error("❌ ICE candidate error:", error);
        }
      } else {
        addIceCandidate(candidate);
      }
    };

    // Handle peer disconnect during call
    const handlePeerDisconnected = ({ userId }) => {
      const participantId = currentCall?.participantId || incomingCall?.callerId;
      if (userId === participantId) {
        console.log(`📞 Peer ${userId} disconnected during call`);
        setCallStatus('ended');
        setTimeout(handleEndCall, 1500);
      }
    };

    // Register all listeners
    socket.on("call_accepted", handleCallAccepted);
    socket.on("call_rejected", handleCallRejected);
    socket.on("call_ended", handleCallEnded);
    socket.on("peer_disconnected_during_call", handlePeerDisconnected);
    socket.on("webrtc_offer", handleWebRTCOffer);
    socket.on("webrtc_answer", handleWebRTCAnswer);
    socket.on("webrtc_ice_candidate", handleWebRTCICECandidate);

    console.log("✅ Socket listeners registered");

    return () => {
      socket.off("call_accepted", handleCallAccepted);
      socket.off("call_rejected", handleCallRejected);
      socket.off("call_ended", handleCallEnded);
      socket.off("peer_disconnected_during_call", handlePeerDisconnected);
      socket.off("webrtc_offer", handleWebRTCOffer);
      socket.off("webrtc_answer", handleWebRTCAnswer);
      socket.off("webrtc_ice_candidate", handleWebRTCICECandidate);
      console.log("🔴 Socket listeners cleaned up");
    };
  }, [socket, currentCall, user, callType, incomingCall]);

  if (!isCallModalOpen) return null;

  const shouldShowActiveCall =
    isCallActive || callStatus === "calling" || callStatus === "connecting";

  const shouldShowFailureUI = 
    callStatus === "failed" || callStatus === "rejected" || callStatus === "ended";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div
        className={`relative w-full h-full max-w-4xl max-h-3xl rounded-lg overflow-hidden ${theme === "dark" ? "bg-gray-900 " : "bg-white"}`}
      >
        {/* Call Failed UI - Production Grade */}
        {callStatus === "failed" && (
          <div className="flex items-center flex-col justify-center h-full p-8 animate-fadeIn">
            <div className="text-center max-w-sm">
              {/* Failed Call Icon with Pulse Animation */}
              <div className="relative w-28 h-28 mx-auto mb-8">
                <div className="absolute inset-0 rounded-full bg-red-500 opacity-10 animate-ping"></div>
                <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-red-500/20 to-red-600/20 backdrop-blur-sm flex items-center justify-center border border-red-500/30">
                  <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                    <FaPhoneSlash className="w-8 h-8 text-red-500" />
                  </div>
                </div>
              </div>

              {/* User Avatar with Border */}
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-700/50 shadow-xl">
                  <img
                    src={displayInfo?.avatar}
                    alt={displayInfo?.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = "/placeholder.svg";
                    }}
                  />
                </div>
              </div>

              {/* Text Hierarchy */}
              <h2
                className={`text-2xl font-semibold mb-3 tracking-tight ${theme === "dark" ? "text-white" : "text-gray-900"}`}
              >
                Call Unavailable
              </h2>

              <p
                className={`text-base font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}
              >
                {displayInfo?.name} is offline
              </p>

              <p
                className={`text-sm leading-relaxed ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}
              >
                {failureReason || "Unable to connect. Try again when they're online."}
              </p>
            </div>

            {/* Action Button */}
            <button
              onClick={handleEndCall}
              className={`mt-8 px-8 py-3.5 rounded-full font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg ${
                theme === "dark"
                  ? "bg-gray-700 hover:bg-gray-600 text-white"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-900"
              }`}
            >
              Back to Chat
            </button>

            {/* Auto-close indicator */}
            <p className={`mt-4 text-xs ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`}>
              Closing automatically...
            </p>
          </div>
        )}

        {/* Call Rejected UI - Production Grade */}
        {callStatus === "rejected" && (
          <div className="flex items-center flex-col justify-center h-full p-8 animate-fadeIn">
            <div className="text-center max-w-sm">
              {/* Rejected Icon */}
              <div className="relative w-28 h-28 mx-auto mb-8">
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-orange-500/20 to-red-500/20 backdrop-blur-sm flex items-center justify-center border border-orange-500/30">
                  <div className="w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center">
                    <FaPhoneSlash className="w-8 h-8 text-orange-500" />
                  </div>
                </div>
              </div>

              {/* User Avatar */}
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-700/50 shadow-xl">
                  <img
                    src={displayInfo?.avatar}
                    alt={displayInfo?.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = "/placeholder.svg";
                    }}
                  />
                </div>
              </div>

              <h2
                className={`text-2xl font-semibold mb-3 tracking-tight ${theme === "dark" ? "text-white" : "text-gray-900"}`}
              >
                Call Declined
              </h2>

              <p
                className={`text-base ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}
              >
                {displayInfo?.name} is busy right now
              </p>
            </div>
          </div>
        )}

        {/* Call Ended UI - Production Grade */}
        {callStatus === "ended" && (
          <div className="flex items-center flex-col justify-center h-full p-8 animate-fadeIn">
            <div className="text-center max-w-sm">
              {/* User Avatar */}
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-700/50 shadow-xl">
                  <img
                    src={displayInfo?.avatar}
                    alt={displayInfo?.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = "/placeholder.svg";
                    }}
                  />
                </div>
              </div>

              <h2
                className={`text-xl font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}
              >
                Call Ended
              </h2>
            </div>
          </div>
        )}

        {/* incoming call ui  */}
        {incomingCall && !isCallActive && !shouldShowFailureUI && (
          <div className="flex items-center flex-col justify-center h-full p-8 ">
            <div className="text-center mb-8">
              <div className="w-32 h-32 rounded-full bg-gray-300 mx-auto mb-4 overflow-hidden">
                <img
                  src={displayInfo?.avatar}
                  alt={displayInfo?.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = "/placeholder.svg"
                  }}
                />
              </div>

              <h2
                className={`text-2xl font-semibold mb-2 ${theme === "dark" ? "text-white " : "text-gray-900"}`}
              >
                {displayInfo.name}
              </h2>

              <p
                className={`text-lg ${theme === "dark" ? "text-gray-300 " : "text-gray-600"}`}
              >
                Incoming ${callType} call ...
              </p>
            </div>

            <div className="flex space-x-6">
              <button
                onClick={handleRejectCall}
                className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-colors"
              >
                <FaPhoneSlash className="w-6 h-6 " />
              </button>

              <button
                onClick={handleAnswerCall}
                className="w-16 h-16 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center text-white transition-colors"
              >
                <FaVideo className="w-6 h-6 " />
              </button>
            </div>
          </div>
        )}

        {/* active call ui  */}
        {shouldShowActiveCall && (
          <div className="relative w-full h-full">
            {/* Remote video - show for both audio and video calls when stream exists */}
            {remoteStream && callType === "video" && (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover bg-gray-800"
              />
            )}

            {/* avatar ans status display  */}
            {(!remoteStream || callType !== "video") && (
              <div className="w-full h-full bg-gray-800 flex items-center justify-center ">
                <div className="text-center ">
                  <div className="w-32 h-32 rounded-full bg-gray-600 mx-auto mb-4 overflow-hidden">
                    <img
                      src={displayInfo.avatar}
                      alt={displayInfo.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = "/placeholder.svg"
                      }}
                    />
                  </div>

                  <p className="text-white text-xl">
                    {callStatus === "calling"
                      ? `Calling ${displayInfo.name}... `
                      : callStatus === "connecting"
                        ? "connecting..."
                        : callStatus === "connected"
                          ? displayInfo?.name
                          : callStatus === "failed"
                            ? "connecting failed"
                            : displayInfo?.name}
                  </p>
                </div>
              </div>
            )}

            {/* local video  */}
            {callType === "video" && localStream && (
              <div className="absolute top-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden border-2 border-white">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* call status  */}
            <div className="absolute top-4 left-4">
              <div
                className={`px-4 py-2 rounded-full ${theme === "dark" ? "bg-gray-800" : "bg-white"} bg-opacity-75`}
              >
                <p
                  className={`text-sm ${theme === "dark" ? "text-white " : "text-gray-900"}`}
                >
                  {callStatus === "connected" ? "Connected" : callStatus}
                </p>
              </div>
            </div>

            {/* call control  */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
              <div className="flex space-x-4 ">
                {callType === "video" && (
                  <button
                    onClick={toggleVideo}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isVideoEnabled ? "bg-gray-600 hover:bg-gray-700 text-white" : "bg-red-500 hover:bg-red-600 text-white"} `}
                  >
                    {isVideoEnabled ? <FaVideo className="h-5 w-5" /> : <FaVideoSlash className="h-5 w-5" />}
                  </button>
                )}

                <button
                  onClick={toggleAudio}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isAudioEnabled ? "bg-gray-600 hover:bg-gray-700 text-white" : "bg-red-500 hover:bg-red-600 text-white"} `}
                >
                  {isAudioEnabled ? <FaMicrophone className="h-5 w-5" /> : <FaMicrophoneSlash className="h-5 w-5" />}
                </button>

                <button
                  onClick={handleEndCall}
                  className="w-12 h-12 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-colors"
                >
                  <FaPhoneSlash className="w-5 h-5 " />
                </button>
              </div>
            </div>
          </div>
        )}

        {callStatus === "calling" && (
          <button
            onClick={handleEndCall}
            className=" absolute top-4 right-4 w-8 h-8 bg-gray-500 hover:bg-gray-600 rounded-full flex items-center justify-center text-white transition-colors"
          >
            <FaTimes className="w-5 h-5 " />
          </button>
        )}
      </div>
    </div>
  );
}

export default VideoCallModal;
