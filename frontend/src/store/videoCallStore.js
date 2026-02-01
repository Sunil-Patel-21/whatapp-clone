import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

const useVideoCallStore = create(
        subscribeWithSelector((set, get) => ({
            // call state
            currentCall: null,
            incomingCall: null,
            isCallActive: false,
            callType: null,

            // media state
            localStream: null,
            remoteStream: null,
            isVideoEnabled: true,
            isAudioEnabled: true,

            // webRTC 
            peerConnection: null,
            iceCandidatesQueue: [],

            isCallModalOpen: false,
            callStatus:"idle",

            // actions
            setCurrentCall: (call)=>{
                set({currentCall: call});   
            },

            setIncomingCall: (call)=>{
                set({incomingCall: call});
            },

            setIsCallActive: (isCallActive)=>{
                set({isCallActive});
            },

            setCallType: (callType)=>{
                set({callType});
            },

            setLocalStream: (localStream)=>{
                set({localStream});
            },

            setRemoteStream: (remoteStream)=>{
                set({remoteStream});
            },

            setPeerConnection: (peerConnection)=>{
                set({peerConnection});
            },

            setCallModalOpen: (isCallModalOpen)=>{
                set({isCallModalOpen});
            },

            setCallStatus: (callStatus)=>{
                set({callStatus});
            },

            addIceCandidate: (iceCandidate)=>{
                const {iceCandidatesQueue} = get();
                set({iceCandidatesQueue: [...iceCandidatesQueue, iceCandidate]});
            },

            processQueuedIceCandidates: async ()=>{

                const {peerConnection,iceCandidatesQueue} = get();

                if(peerConnection && peerConnection.remoteDescription &&iceCandidatesQueue.length > 0){
                    for (const candidate of iceCandidatesQueue) {
                        try {
                            await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
                        } catch (error) {
                            console.error("Error adding ice candidate:", error);
                        }
                    }
                    set({iceCandidatesQueue: []});
                }
            },

            toggleVideo: ()=>{
                const {isVideoEnabled,localStream} = get();
                if(localStream ){
                    const videoTrack = localStream.getVideoTracks()[0];
                    if(videoTrack){
                        videoTrack.enabled = !isVideoEnabled;
                        set({isVideoEnabled: !isVideoEnabled});
                    }
                }
            },

            toggleAudio: ()=>{
                const {isAudioEnabled,localStream} = get();
                if(localStream ){
                    const audioTrack = localStream.getAudioTracks()[0];
                    if(audioTrack){
                        audioTrack.enabled = !isAudioEnabled;
                        set({isAudioEnabled: !isAudioEnabled});
                    }
                }
            },

            endCall: ()=>{
                const {peerConnection,localStream} = get();
                if(localStream){
                    localStream.getTracks().forEach((track) => track.stop());
                }

                if(peerConnection){
                    peerConnection.close();
                }

                set({
                    currentCall: null,
                    incomingCall: null,
                    isCallActive: false,
                    callType: null,
                    localStream: null,
                    remoteStream: null,
                    isVideoEnabled: true,
                    isAudioEnabled: true,
                    peerConnection: null,
                    iceCandidatesQueue: [],
                    isCallModalOpen: false,
                    callStatus:"idle"
                });
            },

            clearIncomingCall: ()=>{
                set({
                    incomingCall: null,
                });
            }

        }
    ))
)

export default useVideoCallStore;