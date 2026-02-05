import {io} from "socket.io-client";
import useUserStore from "../store/useUserStore";
import { axiosInstance } from "./url.service";

let socket = null;


export const initializeSocket = () => {
    if(socket) return socket;

    const user = useUserStore.getState().user;

    const BACKEND_URL = import.meta.env.VITE_API_URL;

    socket = io(BACKEND_URL, {
        withCredentials: true,
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
    });

    // connection events
    socket.on("connect", () => {
        console.log("socket connected", socket.id);
        socket.emit("user_connected", user._id);
    });

    socket.on("connect_error", (error) => {
        console.log("socket connection error", error.message);
    });

    // disconnect 
    socket.on("disconnect", (reason) => {
        console.log("socket disconnected", reason);
    });

    return socket;
};

export const getSocket = ()=>{
    if(!socket){
        return initializeSocket();
    }

    return socket;
}

export const disconnectSocket = () => {
    if(socket){
        socket.disconnect();
        socket = null;
    }
}

export const clearChat = async (conversationId) => {
    try {
        const response = await axiosInstance.delete(`/chats/conversations/${conversationId}/clear`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

