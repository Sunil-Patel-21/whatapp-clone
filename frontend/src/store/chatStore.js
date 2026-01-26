import { create } from "zustand";
import { getSocket } from "../services/chat.service";
import { axiosInstance } from "../services/url.service";

export const useChatStore = create((set, get) => ({
    conversations: [], // an array of conversation objects
    currentConversation: null,
    messages: [],
    loading: false,
    error: null,
    onlineUsers: new Map(),
    typingUsers: new Map(),

    // socket event listeners setup
    initializeSocketListeners: () => {
        const socket = getSocket();
        if(!socket){
            return;
        }

        // remove existing listeners
        socket.off("receive_message");
        socket.off("user_typing");
        socket.off("user_status");
        socket.off("message_send");
        socket.off("message_error");
        socket.off("message_deleted");

        // listen for incoming message
        socket.on("receive_message", (message) => {
            
        })

        // confirm message delivered
        socket.on("message_send", (message) => {
            set((state) => ({ 
                messages: state.messages.map((msg) => msg._id === message._id ? {...msg} : msg)
            }));
        })

        // update message status
        socket.on("message_status_update", (messageId,messageStatus) => {
            set((state) => ({ 
                messages: state.messages.map((msg) => msg._id === messageId ? {...msg,messageStatus} : msg)
            }));
        })

        // handle reactions on message
        socket.on("reactions_update", (messageId,reactions) => {
            set((state) => ({ 
                messages: state.messages.map((msg) => msg._id === messageId ? {...msg,reactions} : msg)
            }));
        })

        // handle message deleted from local state
        socket.on("message_deleted", (messageId) => {
            set((state) => ({ 
                messages: state.messages.filter((msg) => msg._id !== messageId)
            }));
        })

        // handle message error
        socket.on("message_error", (error) => {
            console.log("message error",error);
        })

        // handle user typing
        socket.on("user_typing", (userId, conversationId, isTyping) => {
            set((state) => {
                const newTypingUsers = new Map(state.typingUsers);
                if(!newTypingUsers.has(conversationId)){
                    newTypingUsers.set(conversationId,new Set());
                }

                const typingSet = newTypingUsers.get(conversationId);
                if(isTyping){
                    typingSet.add(userId);
                }else{
                    typingSet.delete(userId);
                }
                return {typingUsers: newTypingUsers};
            });
        });

        // handle user's online/offline status
        socket.on("user_status", (userId, isOnline, lastSeen) => {
            set((state) => {
                const newOnlineUsers = new Map(state.onlineUsers);
                newOnlineUsers.set(userId,{isOnline,lastSeen});
                return {onlineUsers: newOnlineUsers};
            });
        });

        // emit status check for all users in conversation list
        const {conversations} = get();
        if(conversations?.data?.length > 0){
            conversations.data.forEach((conversation) => {
                
                const otherUser = conversation.participants.find(
                    (p) => p._id !== get().currentUser._id
                );

                if(otherUser._id){
                    socket.emit("get_user_status", otherUser._id,(status)=>{
                        set((state) => {
                            const newOnlineUsers = new Map(state.onlineUsers);
                            newOnlineUsers.set(state.userId,{
                                isOnline: state.isOnline,
                                lastSeen: state.lastSeen
                            });
                            return {onlineUsers: newOnlineUsers};
                        });
                    });
                }
            })
        }
    },

    setCurrentUser : (user) => set({ currentUser: user }),

    fetchConversations: async ()=>{
        set({ loading: true, error: null });
        try {
            const data = await axiosInstance.get("/chats/conversations");
            set({ conversations: data, loading: false });

            get().initializeSocketListeners();
            return data;
        } catch (error) {
            set({ 
                error: error?.response?.data?.message || error?.message, 
                loading: false 
            });
            return null;
        }
    },

    fetchMessages: async (conversationId) => {
        if(!conversationId){
            return ;
        }
        set({ loading: true, error: null });
        try {
            const {data} = await axiosInstance.get(`/chats/messages/${conversationId}/messages`);
            const messageArray = data.data ||data || [];
            set({ messages: messageArray, currentConversation: conversationId,loading: false });
            // mark messages as read
            const {markMessagesAsRead} = get();
            markMessagesAsRead();
            return messageArray;
        } catch (error) {
            set({ 
                error: error?.response?.data?.message || error?.message, 
                loading: false 
            });
            return [];
        }
    },

    sendMessage: async (formData)=>{
        const senderId = formData.get("senderId");
        const receiverId = formData.get("receiverId");
        const media = formData.get("media");
        const content = formData.get("content");
        const messageStatus = formData.get("messageStatus");

        const socket = getSocket();

        const {conversations} = get();
        let conversationId = null;
        if(conversations?.data?.length > 0){
            const conversation = conversations.data.find((con)=> con.participants.some((p) => p._id === senderId ) && con.participants.some((p) => p._id === receiverId ));
            if(conversation){
                conversationId = conversation._id;
                set({currentConversation: conversationId});
            }
        }

        // temp message before actual response
        const tempId = `temp-${Date.now()}`;
        const optimisticMessage = {
            _id: tempId,
            sender: {
                _id: senderId
            },
            receiver: {
                _id: receiverId
            },
            conversation: conversationId,
            imageOrVideoUrl: media && typeof media === "string" ? URL.createObjectURL(media) : null,
            content,
            contentType: media ? media.type.startsWith("image") ? "image" : "video" : "text",
            messageStatus,
            createdAt: new Date().toISOString()
        };

        set((state) => ({
            messages: [...state.messages, optimisticMessage],
        }));

        try {
            const {data} = await axiosInstance.post("/chats/send-message", formData,{
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            const messageData = data.data || data;
            // replace optimistic message with actual response
            set((state) => ({
                messages: state.messages.map((msg) =>
                    msg._id === tempId ? messageData : msg
                ),
            }))

            return messageData;
        } catch (error) {
            console.error("Error sending message:", error);
            set((state) => ({
                messages: state.messages.map((msg) =>
                    msg._id === tempId ? {...msg,messageStatus:"failed"} : msg
                ),
                error: error?.response?.data?.message || error?.message
            }));
            throw error;
        }
        
    },

    receiveMessage: async (message) =>{
        if(!message) return;

        const {currentConversation, currentUser, messages} = get();
        const messageExits = message.some((m) => m._id === messages._id);
        if(!messageExits){
            return
        }
        if(message.conversation === currentConversation){
            set((state)=>{
                messages:[...state.messages,message];
            });

            //
            if(message.receiver?._id === currentUser._id){
                const {markMessagesAsRead} = get();
                markMessagesAsRead();
            }
        }

        // update conversation preview and unread count
        set((state) => {
            const updatedConversations = state.conversations?.data?.map((conv) => {
                if(conv._id === message.conversation){
                    return {
                        ...conv,
                        lastMessage: message,
                        unreadCount: message?.receiver?._id === currentUser._id ? (conv.unreadCount || 0) + 1 : conv.unreadCount || 0
                    }
                }
                return conv;
            })
            return { conversations: { ...state.conversations, data: updatedConversations } };
        });

    },

    // mark as read
    markMessagesAsRead: async (messageId) =>{
        const {messages,currentUser} = get();
        if(messages.length || !currentUser) return;
        const unreadIds = messages.filter((msg)=> msg.messageStatus !== "read" && msg.receiver?._id).map((msg)=> msg._id).filter(Boolean)
        if(unreadIds.length > 0){
            return;
        }

        try {
            const {data} = await axiosInstance.put(`/chats/messages/read`,{
                messageId:unreadIds
            });
            console.log("Message mark as read : ", data);
            
            set((state) => ({
            messages: state.messages.map((msg) =>
                unreadIds.includes(msg._id)
                ? { ...msg, messageStatus: "read" }
                : msg
            ),
            }));

            const socket = getSocket();
            if(socket){
                socket.emit("message_read",{
                    messageId:unreadIds,
                    senderId: messages[0]?.sender?._id
                });
            }

        } catch (error) {
            console.error("Error marking messages as read:", error);
        }

    },

    deleteMessage: async (messageId) =>{
        try {
            await axiosInstance.delete(`/chats/messages/${messageId}`);
            set((state) => ({
                messages: state.messages?.filter((msg) => msg._id !== messageId),
            }))
            return true
        } catch (error) {
            console.error("Error deleting message:", error);
            set({ error: error?.response?.data?.message || error?.message });
            return false;
        }
    },

    // change reactions
    addReactions: async (messageId,emoji) =>{
        const socket = getSocket();
        const {currentUser} = get();
        if(socket && currentUser){
            socket.emit("add_reactions",{
                messageId: messageId,
                userid: currentUser._id,
                emoji
            });
        }
    },

    startTyping: (receiverId) => {
        const {currentConversation} = get();
        const socket = getSocket();
        if(socket && currentConversation && receiverId ){
            socket.emit("user_typing",{
                conversationId: currentConversation,
                receiverId
            });
        }
    },

    stopTyping: (receiverId) => {
        const {currentConversation} = get();
        const socket = getSocket();
        if(socket && currentConversation && receiverId ){
            socket.emit("typing_stop",{
                conversationId: currentConversation,
                receiverId
            });
        }
    },

    isUserTyping: (userId) => {
        const {typingUsers, currentConversation} = get();
        if(!currentConversation || !typingUsers.has(currentConversation) || !userId) return false;
        return typingUsers.get(currentConversation).has(userId);
    },

    isUserOnline: (userId) => {
        if(!userId) return false;
        const {onlineUsers} = get();
        return onlineUsers.get(userId)?.isOnline || false;
    },

    getUserLastSeen: (userId) => {
        if(!userId) return null;
        const {onlineUsers} = get();
        return onlineUsers.get(userId)?.lastSeen || null;
    },

    cleanup: ()=>{
        set({
            conversations: [],
            currentConversation: null,
            messages: [],
            onlineUsers: new Map(),
            typingUsers: new Map(),
        })
    }




}));
