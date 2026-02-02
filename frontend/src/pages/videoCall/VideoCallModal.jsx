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
} from "react-icons/fa";

function VideoCallModal({ socket }) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

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
      {
        urls: "stun:stun.l.google.com:19302",
      },
      {
        urls: "stun:stun1.l.google.com:19302",
      },
      {
        urls: "stun:stun2.l.google.com:19302",
      },
    ],
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
      setCallStatus("connected");
      setIsCallActive(true);
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

  // initialize media stream
  const initialiZeMedia = async (video = true) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: video ? { width: 640, height: 480 } : false,
        audio: true,
      });
      setLocalStream(stream);
      return stream;
    } catch (error) {
      console.error("Media error", error);
      throw error;
    }
  };

  // create peer connection
  const createPeerConnection = (stream, role) => {
    const pc = new RTCPeerConnection(rtcConfiguration);

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
          currentCall.participantId || incomingCall?.callerId;
        const callId = currentCall?.callId || incomingCall.callId;
        if (participantId && callId) {
          socket.emit("webrtc_ice_candidate", {
            candidate: event.candidate,
            receiverId: participantId,
            callId: callId,
          });
        }
      }
    };

    // handle remote
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      } else {
        const stream = new MediaStream([event.track]);
        setRemoteStream(stream);
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed") {
        setCallStatus("failed");
        setTimeout(handleEndCall, 2000);
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`${role} : ICE state , ${pc.iceConnectionState}`);
    };

    setPeerConnection(pc);

    return pc;
  };

  // caller : Initialize call after acceptance
  const initializeCallerCall = async () => {
    try {
      setCallStatus("connecting");

      // get media
      const stream = await initialiZeMedia(callType === "video");

      // create peer connnection with offer
      const pc = createPeerConnection(stream, "CALLER");

      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: callType === "video",
      });

      await pc.setLocalDescription(offer);
      socket.emit("webrtc_offer", {
        offer,
        receiverId: currentCall?.participantId,
        callId: currentCall?.callId,
      });
    } catch (error) {
      console.error("caller error ", error);
      setCallStatus("failed");
      setTimeout(handleEndCall, 2000);
    }
  };

  // receiver answer the call
  const handleAnswerCall = async () => {
    try {
      setCallStatus("connecting");

      // get media
      const stream = await initialiZeMedia(callType === "video");

      // create peer connnection with offer
      createPeerConnection(stream, "RECEIVER");
      socket.emit("accept_call", {
        callerId: incomingCall?.callerId,
        callId: incomingCall.callId,
        receiverInfo: {
          username: user.username,
          profilePicture: user?.profilePicture,
        },
      });

      setCurrentCall({
        callId: incomingCall?.callId,
        participantId: incomingCall?.callerId,
        participantName: incomingCall?.callerName,
        participantAvatar: incomingCall?.callerAvatar,
      });

      clearIncomingCall();
    } catch (error) {
      console.error("receiver error : ", error);
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
    endCall();
  };

  const handleEndCall = () => {
    const participantId = currentCall.participantId || incomingCall?.callerId;
    const callId = currentCall?.callId || incomingCall.callId;

    if (participantId && callId) {
      socket.emit("end_call", {
        callId: callId,
        participantId: participantId,
      });
    }

    endCall();
  };

  // socket event listeners
  useEffect(() => {
    if (!socket) {
      return;
    }

    // accept call
    const handleCallAccepted = ({ receiverName }) => {
      if (currentCall) {
        setTimeout(() => {
          initializeCallerCall();
        }, 500);
      }
    };

    const handleCallRejected = () => {
      setCallStatus("rejected");
      setTimeout(handleEndCall, 2000);
    };

    const handleCallEnded = () => {
      endCall();
    };

    const handleWebRTCOffer = async ({ offer, senderId, callId }) => {
      if (!peerConnection) {
        return;
      }
      try {
        await peerConnection.setLocalDescription(
          new RTCSessionDescription(offer),
        );
        console.log();
        // process queued
        await processQueuedIceCandidates();

        // create answer
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        socket.emit("webrtc_answer", {
          answer,
          receiverId: senderId,
          callId,
        });
      } catch (error) {
        console.error("receiver offer error : ", error);
      }
    };

    // receiver anser to caller
    const handleWebRTCAnswer = async ({ answer, senderId, callId }) => {
      if (!peerConnection) return;

      if (peerConnection.signalingState === "closed") {
        return;
      }

      try {
        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(answer),
        );

        await processQueuedIceCandidates();

        // check receiver
        const receivers = peerConnection.getReceivers();
        console.log("receiver : ", receivers);
      } catch (error) {
        console.error("receiver answer error : ", error);
      }
    };

    // receiver ice candidate
    const handleWebRTCICECandidate = async ({ candidate, senderId }) => {
      if (peerConnection && peerConnection.signalingState !== "closed") {
        if (peerConnection.remoteDescription) {
          try {
            await peerConnection.addIceCandidate(
              new RTCIceCandidate(candidate),
            );
            console.log("ice candidate added");
          } catch (error) {
            console.error("ICE candidate error : ", error);
          }
        } else {
          console.log("queue ice candidates");
          addIceCandidate(candidate);
        }
      }
    };
    // register event listeners
    socket.on("call_accepted", handleAnswerCall);
    socket.on("call_rejected", handleCallRejected);
    socket.on("call_ended", handleCallEnded);
    socket.on("webrtc_offer", handleWebRTCOffer);
    socket.on("webrtc_answer", handleWebRTCAnswer);
    socket.on("webrtc_ice_candidate", handleWebRTCICECandidate);

    console.log("socket listeners register");

    return () => {
      socket.off("call_accepted", handleAnswerCall);
      socket.off("call_rejected", handleCallRejected);
      socket.off("call_ended", handleCallEnded);
      socket.off("webrtc_offer", handleWebRTCOffer);
      socket.off("webrtc_answer", handleWebRTCAnswer);
      socket.off("webrtc_ice_candidate", handleWebRTCICECandidate);
    };
  }, [socket, peerConnection, currentCall, incomingCall, user]);

  if (isCallModalOpen && incomingCall) return;

  const shouldShowActiveCall =
    isCallActive || callStatus === "calling" || callStatus === "connecting";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div
        className={`relative w-full h-full max-w-4xl max-h-3xl rounded-lg overflow-hidden ${theme === "dark" ? "bg-gray-900 " : "bg-white"}`}
      >
        {/* incoming call ui  */}
        {incomingCall && !isCallActive && (
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
            {callType === "video" && (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className={`w-full h-full object-cover bg-gray-800 ${remoteStream ? "block" : "hidden"}`}
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
                    {isVideoEnabled} ? <FaVideo className="h-5 w-5" /> :{" "}
                    <FaVideoSlash className="h-5 w-5" />
                  </button>
                )}

                <button
                  onClick={toggleAudio}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isAudioEnabled ? "bg-gray-600 hover:bg-gray-700 text-white" : "bg-red-500 hover:bg-red-600 text-white"} `}
                >
                  {isAudioEnabled} ? <FaMicrophone className="h-5 w-5" /> :{" "}
                  <FaMicrophoneSlash className="h-5 w-5" />
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
