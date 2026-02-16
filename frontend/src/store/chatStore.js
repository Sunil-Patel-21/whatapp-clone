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

            // remove existing listeners to prevent duplicates
            socket.off("receive_message");
            socket.off("user_typing");
            socket.off("user_status");
            socket.off("message_send");
            socket.off("message_error");
            socket.off("message_deleted");
            socket.off("reaction_updated");
            socket.off("message_status_update");

            // listen for incoming message
            socket.on("receive_message", (message) => {
                if (!message) return;
                get().receiveMessage(message);
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
            socket.on("reaction_updated", ({ messageId, reactions }) => {
            set((state) => ({
                messages: state.messages.map((msg) =>
                msg._id === messageId
                    ? { ...msg, reactions }
                    : msg
                ),
            }));
            });


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
            socket.on("user_typing", ({ userId, conversationId, isTyping }) => {
                set((state) => {
                    const newTypingUsers = new Map(state.typingUsers);

                    if (!newTypingUsers.has(conversationId)) {
                        newTypingUsers.set(conversationId, new Set());
                    }

                    const typingSet = newTypingUsers.get(conversationId);

                    if (isTyping) {
                        typingSet.add(userId);
                    } else {
                        typingSet.delete(userId);
                    }

                    return { typingUsers: newTypingUsers };
                });
            });

            // handle user's online/offline status
            socket.on("user_status", ({userId, isOnline, lastSeen}) => {
                set((state) => {
                    const newOnlineUsers = new Map(state.onlineUsers);
                    newOnlineUsers.set(userId,{isOnline,lastSeen});
                    return {onlineUsers: newOnlineUsers};
                });
            });

            // handle temporary mode changes
            socket.on("temporary_mode_changed", ({ conversationId, isTemporaryMode, temporaryDuration }) => {
                set((state) => ({
                    conversations: state.conversations.map(conv =>
                        conv._id === conversationId
                            ? { ...conv, isTemporaryMode, temporaryDuration }
                            : conv
                    )
                }));
            });

            // handle expired messages
            socket.on("message_expired", (messageId) => {
                set((state) => ({
                    messages: state.messages.filter(msg => msg._id !== messageId)
                }));
            });

            // emit status check for all users in conversation list
            const {conversations} = get();
            if(conversations?.length > 0){
                conversations.forEach((conversation) => {
                    
                    const otherUser = conversation.participants.find(
                        (p) => p._id !== get().currentUser._id
                    );

                    if(otherUser?._id){
                        socket.emit("get_user_status", otherUser._id,(status)=>{
                            set((state) => {
                                const newOnlineUsers = new Map(state.onlineUsers);
                                newOnlineUsers.set(status.userId,{
                                    isOnline: status.isOnline,
                                    lastSeen: status.lastSeen
                                });
                                return {onlineUsers: newOnlineUsers};
                            });
                        });
                    }
                })
            }
        },

        setCurrentUser : (user) => set({ currentUser: user }),

        fetchConversations: async () => {
        set({ loading: true, error: null });
        try {
            const res = await axiosInstance.get("/chats/conversations");

            set({
            conversations: res.data.data, // ✅ store array only
            loading: false
            });

            get().initializeSocketListeners();
            return res.data.data;
        } catch (error) {
            set({
            error: error?.response?.data?.message || error?.message,
            loading: false
            });
            return [];
        }
        },


        fetchMessages: async (conversationId) => {
            console.log("🟡 fetchMessages called with:", conversationId);
            if(!conversationId){
                return ;
            }
            set({ loading: true, error: null });
            try {
                const  res  = await axiosInstance.get(
                `/chats/conversations/${conversationId}/messages`
                );
                console.log("🟢 RAW API RESPONSE:", res);
                console.log("🟢 res.data:", res.data);
                console.log("🟢 res.data.data (messages):", res.data?.data);
                const messageArray = res.data?.data ?? [];

                set({
                messages: messageArray,
                currentConversation: conversationId,
                loading: false
                });

                console.log(
                    "🟢 Zustand messages AFTER set:",
                    get().messages
                    );
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

        sendMessage: async (formData) => {
            const senderId = formData.get("senderId");
            const receiverId = formData.get("receiverId");
            const media = formData.get("media");
            const content = formData.get("content");
            const messageStatus = formData.get("messageStatus");

            const { conversations } = get();
            let conversationId = null;
            if (Array.isArray(conversations) && conversations.length > 0) {
                const conversation = conversations.find((con) =>
                    con.participants.some((p) => p._id === senderId) &&
                    con.participants.some((p) => p._id === receiverId)
                );
                if (conversation) {
                    conversationId = conversation._id;
                    set({ currentConversation: conversationId });
                }
            }

            // Create optimistic message
            const tempId = `temp-${Date.now()}`;
            const optimisticMessage = {
                _id: tempId,
                sender: { _id: senderId },
                receiver: { _id: receiverId },
                conversation: conversationId,
                imageOrVideoUrl: media && media instanceof File ? URL.createObjectURL(media) : null,
                content: content || "",
                contentType: media ? (media.type.startsWith("image") ? "image" : "video") : "text",
                messageStatus,
                createdAt: new Date().toISOString()
            };

            // Add optimistic message
            set((state) => ({
                messages: [...state.messages, optimisticMessage],
            }));

            try {
                const { data } = await axiosInstance.post("/chats/send-message", formData);
                const messageData = data.data || data;

                // Replace optimistic message with server response
                set((state) => ({
                    messages: state.messages.map((msg) =>
                        msg._id === tempId ? messageData : msg
                    ),
                }));

                return messageData;
            } catch (error) {
                console.error("Error sending message:", error);
                // Mark message as failed
                set((state) => ({
                    messages: state.messages.map((msg) =>
                        msg._id === tempId ? { ...msg, messageStatus: "failed" } : msg
                    ),
                    error: error?.response?.data?.message || error?.message
                }));
                throw error;
            }
        },

        receiveMessage: (message) => {
            if (!message) return;

            const { messages, currentUser } = get();
            
            // Don't add if it's our own message (already added optimistically)
            if (message.sender._id === currentUser?._id) return;

            // Check if message already exists
            const exists = messages.some((m) => m._id === message._id);
            if (exists) return;

            set((state) => ({
                messages: [...state.messages, message],
            }));
        },

        // mark as read
        markMessagesAsRead: async () =>{
            const {messages,currentUser} = get();
            if(!messages.length || !currentUser) return;
            const unreadIds = messages.filter((msg)=> msg.messageStatus !== "read" && msg.receiver?._id).map((msg)=> msg._id).filter(Boolean)
            if(unreadIds.length === 0){
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
                        messageIds:unreadIds,
                        senderId: messages[0]?.sender?._id
                    });
                }

            } catch (error) {
                console.error("Error marking messages as read:", error);
            }

        },

        deleteMessage: async (messageId) =>{
            if (typeof messageId === "string" && messageId.startsWith("temp-")) {
                set((state) => ({
                    messages: state.messages?.filter((msg) => msg._id !== messageId),
                }))
                return true;
            }
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
        addReactions: (messageId, emoji) => {
            const socket = getSocket();
            const { currentUser } = get();
            if (!socket || !currentUser) return;

            socket.emit("add_reaction", {
            messageId,
            userId: currentUser._id,
            emoji,
            });
        },

        startTyping: (receiverId) => {
            const { currentConversation, currentUser } = get();
            const socket = getSocket();

            if (!socket || !currentConversation || !receiverId || !currentUser) return;

            socket.emit("typing_start", {
                userId: currentUser._id,
                conversationId: currentConversation,
                receiverId
            });
        },

        stopTyping: (receiverId) => {
            const { currentConversation, currentUser } = get();
            const socket = getSocket();

            if (!socket || !currentConversation || !receiverId || !currentUser) return;

            socket.emit("typing_stop", {
                userId: currentUser._id,
                conversationId: currentConversation,
                receiverId
            });
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

        getCurrentConversation: () => {
            const { conversations, currentConversation } = get();
            return conversations.find(c => c._id === currentConversation);
        },

        updateConversationTemporaryMode: (conversationId, isTemporaryMode, temporaryDuration) => {
            set((state) => ({
                conversations: state.conversations.map(conv =>
                    conv._id === conversationId
                        ? { ...conv, isTemporaryMode, temporaryDuration }
                        : conv
                )
            }));
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
