import {create} from "zustand";
import { getSocket } from "../services/chat.service";
import { axiosInstance } from "../services/url.service";

const useStatusStore = create((set,get)=>({

    // state
    statuses:[],
    loading: false,
    error: null,

    // active
    setStatuses : (statuses) => set({statuses}),
    setLoading : (loading) => set({loading}),
    setError : (error) => set({error}),
    
    //  initialize  socket listeners
    initializeSocket: ()=>{
        const socket = getSocket();
        if(!socket) return;

        // realtime status events
        socket.on("new_status",(newStatus)=>{
            set((state) => ({
                statuses: state.statuses.some((s) => s._id === newStatus._id)
                ? state.statuses : [newStatus,...state.statuses]
            }))
        }),
        socket.on("status_deleted",(statusId)=>{
            set((state) => ({
                statuses: state.statuses.filter((s) => s._id !== statusId)
            }))
        }),
        socket.on("status_viewed",(statusId,viewers)=>{
            set((state)=>{
                statuses: state.statuses.map((status) =>{
                    status._id === statusId ? {...status,viewers} :status
                })
            })
        })

    },
    // clean up 
    cleanupSocket : ()=>{
        const socket = getSocket();
        if(socket){
            socket.off("new_status")
            socket.off("status_deleted")
            socket.off("status_viewed")
        }
    },

    fetchStatuses: async ()=>{
        set({loading: true, error:null})
        try {
            const {data} = await axiosInstance.get("status");
            set({statuses: data.data || [], loading: false})
        } catch (error) {
            console.error("Error fetching status : ",error);
            set({error: error.message, loading:false})
        }
    },

    

}))