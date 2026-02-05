import React, { useEffect, useRef, useState } from "react";
import useThemeStore from "../../store/themeStore";
import useUserStore from "../../store/useUserStore";
import { useChatStore } from "../../store/chatStore";
import {isToday,isYesterday,format} from "date-fns";
import EmojiPicker from "emoji-picker-react";
import { FaArrowLeft, FaEllipsisH, FaEllipsisV, FaFile, FaImage, FaLock, FaPaperclip, FaPaperPlane, FaSmile, FaTimes, FaVideo, FaSearch, FaBan, FaTrash, FaVolumeMute, FaUserCircle } from "react-icons/fa";
import whatsappImage from "../../images/whatsapp_image.png";
import { object } from "yup";
import MessageBubble from "./MessageBubble";
import ContactInfo from "./ContactInfo";
import { toast } from "react-toastify";
import VideoCallManager from "../videoCall/VideoCallManager";
import { getSocket, clearChat } from "../../services/chat.service";
import useVideoCallStore from "../../store/videoCallStore";
import useOutsideclick from "../../hooks/useOutSideClick";
const isValidate = (date) => {
  return date instanceof Date && !isNaN(date);
};

function ChatWindow({selectedContact, setSelectedContact}) {
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filePreview, setFilePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const typingTimeOutRef = useRef(null);
  const messagesEndRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const fileInputRef = useRef(null);
  const chatMenuRef = useRef(null);

  const { theme } = useThemeStore();
  const { user } = useUserStore();



  const {
    messages,
    loading,
    sendMessage,
    receiveMessage,
    fetchMessages,
    fetchConversations,
    conversations,
    isUserTyping,
    startTyping,
    stopTyping,
    getUserLastSeen,
    currentConversation,
    isUserOnline,
    cleanup,
    deleteMessage,
    addReactions
    
  } = useChatStore();

  const socket = getSocket();

  // get online status and last seen time
  const onlineStatus = isUserOnline(selectedContact?._id);
  const lastSeen = getUserLastSeen(selectedContact?._id);
  const isTyping = isUserTyping(selectedContact?._id);

  console.log("LastSeen : ", lastSeen);
  
useEffect(() => {
  if (!selectedContact?._id || !conversations?.length) return;

  const conversation = conversations.find(conv =>
    conv.participants.some(p => p._id === selectedContact._id)
  );

  if (conversation?._id) {
    fetchMessages(conversation._id);
  }
}, [selectedContact, conversations]);


  useEffect( () => {
    fetchConversations();
  },[]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(()=>{
    scrollToBottom();
  },[messages]);

  useOutsideclick(chatMenuRef, () => {
    if(showChatMenu) setShowChatMenu(false);
  });

  useEffect(()=>{
    if(message && selectedContact){
      startTyping(selectedContact?._id);
    }

    if(typingTimeOutRef.current){
      clearTimeout(typingTimeOutRef.current);
    }

    typingTimeOutRef.current = setTimeout(() => {
      stopTyping(selectedContact?._id);
    }, 2000);

    return () => {
      if(typingTimeOutRef.current){
        clearTimeout(typingTimeOutRef.current);
      }
    }

  },[message,selectedContact,startTyping,stopTyping])

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setShowFileMenu(false);
      if(file.type.startsWith("image/") || file.type.startsWith("video/")) {
        setFilePreview(URL.createObjectURL(file));
      }
    }
  };

const handleSendMessage = async () => {
  if (!selectedContact) return;

  // 🔧 FIX: allow text OR file
  if (!message.trim() && !selectedFile) return;

  try {
    const formData = new FormData();
    formData.append("senderId", user?._id);
    formData.append("receiverId", selectedContact?._id);

    const status = onlineStatus ? "delivered" : "send";
    formData.append("messageStatus", status);

    if (message.trim()) {
      formData.append("content", message.trim());
    }

    if (selectedFile) {
      formData.append("media", selectedFile, selectedFile.name);
    }

    await sendMessage(formData);

    // reset
    setMessage("");
    setSelectedFile(null);
    setFilePreview(null);
    setShowFileMenu(false);
  } catch (error) {
    console.error("Error sending message:", error);
  }
};


  const renderDateSeparator = (date)=>{
      if(!isValidate(date)) return null;

      let dateString;
      if(isToday(date)){
        dateString = "Today";
      }else if(isYesterday(date)){
        dateString = "Yesterday";
      }else{
        dateString = format(date,"EEEE, MMM d");

      }
      return <div className={`flex justify-center my-4`}>
        <span 
          className={`px-4 py-2 rounded-full text-sm ${theme === "dark" ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-600"}`}
        >
          {dateString}
        </span>
      </div>
  }

  // grouping message
const groupedMessages = Array.isArray(messages)
  ? messages.reduce((acc, message) => {
      const rawDate = message.createdAt || message.updatedAt;
      if (!rawDate) return acc;

      const date = new Date(rawDate);
      if (!isValidate(date)) return acc;

      const dateString = format(date, "yyyy-MM-dd");
      if (!acc[dateString]) acc[dateString] = [];
      acc[dateString].push(message);

      return acc;
    }, {})
  : {};


  const handleReaction = (messageId,emoji)=>{
    console.log("Messageid : " , messageId);
    console.log(" emoji : " , emoji);
    addReactions(messageId,emoji);
  }

  const handleClearChat = async () => {
    if (window.confirm('Clear all messages in this chat?')) {
      try {
        const conversation = conversations.find(conv =>
          conv.participants.some(p => p._id === selectedContact._id)
        );
        if (conversation?._id) {
          await clearChat(conversation._id);
          await fetchMessages(conversation._id);
          toast.success('Chat cleared');
        }
      } catch (error) {
        toast.error('Failed to clear chat');
      }
      setShowChatMenu(false);
    }
  };

  const handleBlockContact = () => {
    if (window.confirm(`Block ${selectedContact?.username}?`)) {
      toast.info('Block feature coming soon');
      setShowChatMenu(false);
    }
  };

  const filteredMessages = searchQuery
    ? Object.entries(groupedMessages).reduce((acc, [date, msgs]) => {
        const filtered = msgs.filter(msg =>
          msg.content?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        if (filtered.length > 0) acc[date] = filtered;
        return acc;
      }, {})
    : groupedMessages;

  const handleVideoCall = ()=>{
    if(selectedContact){
      // Use the user store to get the initiateCall function that was set by VideoCallManager
      const initiateCall = useUserStore.getState().initiateCall;
      
      if(initiateCall){
        const avatar = selectedContact?.profilePicture;
        initiateCall(
          selectedContact?._id,
          selectedContact?.username,
          avatar,
          "video"
        )
      } else {
        console.error("initiateCall function not available");
      }
    }
  }

  console.log("Selected contact : ", selectedContact);
  

  if(!selectedContact) {
    return <div className="flex flex-col items-center justify-center mx-auto h-screen text-center">
      <div className="max-w-md">
        <img src={whatsappImage} alt="whatsapp"  className="w-full h-auto"/>
        <h2 className={`text-3xl font-semibold mb-4 ${theme === "dark" ? "text-white" : "text-gray-800"}`}>
          Select a chat to start messaging
        </h2>
        <p className={`mb-6 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
          Choose a contact from the list on the left to start a conversation
        </p>
        <p className={` text-sm mt-8 flex items-center justify-center gap-2 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
          <FaLock className="h-4 w-4"/>You personal message are end-to-end encrypted
        </p>


      </div>
    </div>
  }

  return   <>
  {showContactInfo ? (
    <ContactInfo contact={selectedContact} theme={theme} onClose={() => setShowContactInfo(false)} />
  ) : (
  <div className="flex-1 h-screen w-full flex flex-col">

    <div className={`p-4 flex items-center ${theme === "dark" ? "bg-[#303430 text-white" :"bg-[rgb(239,242,245)] text-gray-600"}`}>
      <button className="mr-2 focus:outline-none cursor-pointer"
        onClick={()=> setSelectedContact(null)}
      >
        <FaArrowLeft className="h-6 w-6"/>
      </button>

    <img 
      src={selectedContact?.profilePicture} 
      alt={selectedContact?.username} 
      className="w-10 h-10 rounded-full bg-amber-400"
    />

    <div className="ml-3 flex-grow ">

      <h2 className="font-semibold text-start">
        {selectedContact?.username}
      </h2>
      {
        isTyping ? (
          <div>Typing...</div>
        ) :(
          <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
            {onlineStatus ? "Online" : lastSeen ? `Last seen ${format(new Date(lastSeen),"HH:mm" )}`:"Offline"}
          </p>
        )
      }

    </div>

    <div className={`flex items-center space-x-4 relative`}>
      <button className="focus:outline-none" onClick={handleVideoCall} title="Start video call">
        <FaVideo className="h-5 w-5 text-green-500 hover:text-green-600" />
      </button>

      <button className="focus:outline-none" onClick={() => setShowChatMenu(!showChatMenu)}>
        <FaEllipsisV className="h-5 w-5" />
      </button>

      {showChatMenu && (
        <div ref={chatMenuRef} className={`absolute top-10 right-0 w-56 rounded-lg shadow-lg py-2 z-50 ${theme === "dark" ? "bg-[#2a3942] text-white" : "bg-white text-gray-800"}`}>
          <button
            onClick={() => {
              setShowContactInfo(true);
              setShowChatMenu(false);
            }}
            className={`flex items-center w-full px-4 py-3 gap-3 ${theme === "dark" ? "hover:bg-[#202c33]" : "hover:bg-gray-100"}`}
          >
            <FaUserCircle className="h-4 w-4" />
            <span>Contact Info</span>
          </button>
          <button
            onClick={() => {
              setShowSearch(!showSearch);
              setShowChatMenu(false);
            }}
            className={`flex items-center w-full px-4 py-3 gap-3 ${theme === "dark" ? "hover:bg-[#202c33]" : "hover:bg-gray-100"}`}
          >
            <FaSearch className="h-4 w-4" />
            <span>Search</span>
          </button>
          <button
            onClick={() => {
              toast.info('Mute feature coming soon');
              setShowChatMenu(false);
            }}
            className={`flex items-center w-full px-4 py-3 gap-3 ${theme === "dark" ? "hover:bg-[#202c33]" : "hover:bg-gray-100"}`}
          >
            <FaVolumeMute className="h-4 w-4" />
            <span>Mute Notifications</span>
          </button>
          <div className={`border-t ${theme === "dark" ? "border-gray-700" : "border-gray-200"} my-1`}></div>
          <button
            onClick={handleClearChat}
            className={`flex items-center w-full px-4 py-3 gap-3 ${theme === "dark" ? "hover:bg-[#202c33]" : "hover:bg-gray-100"}`}
          >
            <FaTrash className="h-4 w-4" />
            <span>Clear Chat</span>
          </button>
          <button
            onClick={handleBlockContact}
            className={`flex items-center w-full px-4 py-3 gap-3 text-red-500 ${theme === "dark" ? "hover:bg-[#202c33]" : "hover:bg-gray-100"}`}
          >
            <FaBan className="h-4 w-4" />
            <span>Block Contact</span>
          </button>
        </div>
      )}

    </div>

    {showSearch && (
      <div className={`p-3 border-b ${theme === "dark" ? "border-gray-600 bg-[#202c33]" : "border-gray-200 bg-white"}`}>
        <div className="relative">
          <FaSearch className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-10 pr-10 py-2 rounded-lg focus:outline-none ${theme === "dark" ? "bg-[#2a3942] text-white" : "bg-gray-100 text-black"}`}
          />
          <button
            onClick={() => {
              setShowSearch(false);
              setSearchQuery("");
            }}
            className="absolute right-3 top-3"
          >
            <FaTimes className="h-4 w-4 text-gray-400" />
          </button>
        </div>
      </div>
    )}

    </div>

    <div className={`flex-1 p-4 overflow-y-auto ${theme === "dark" ? "bg-[#191a1a]" : "bg-[rgb(241,236,229)]"} `}>
      {Object.entries(filteredMessages).map(([date, msgs]) => (
        <React.Fragment key={date}>
          {renderDateSeparator(new Date(date))}
                {msgs.map((msg) => (
            <MessageBubble
              key={msg._id || msg.tempId}
              message={msg}
              theme={theme}
              currentUser={user}
              onReact={handleReaction}
              deleteMessage={deleteMessage}
            />
          ))}

        </React.Fragment>
      ))}


      <div ref={messagesEndRef} />
    </div>

    {filePreview && (
      <div className="relative p-2">
        {selectedFile?.type.startsWith("video/") ? (
          <video src={filePreview} controls className="w-80 object-cover rounded shadow-lg mx-auto" />
        ):(
        <img src={filePreview} alt="file-previews" className="w-80 object-cover rounded shadow-lg mx-auto"/>

        )}
        <button
          onClick={()=>{
            setFilePreview(null);
            setSelectedFile(null);
          }}
          className="absolute top-1 right-1 hover:bg-red-600 text-white rounded-full p-1"
        >
          <FaTimes className={"h-4 w-4"} />
        </button>
      </div>
    )}

    <div className={`p-4 ${theme === "dark" ? "bg-[#303430]" : "bg-white"} flex items-center space-x-2 relative`}>
      <button 
        onClick={()=> setShowEmojiPicker(!showEmojiPicker)}
        className="focus:outline-none"
      >
        <FaSmile className={`h-6 w-6 ${theme === "dark"?"text-gray-400" : "text-gray-500"}`}/>
      </button>

      {showEmojiPicker && (
        <div ref={emojiPickerRef} className="absolute  left-0 bottom-16 z-50">
          <EmojiPicker 
            onEmojiClick={(emojiObject) =>{
              setMessage((prevMessage) => prevMessage + emojiObject.emoji);
              setShowEmojiPicker(false);
            }}
            theme={theme}
          />
        </div>
      )}

      <div className="relative">
        <button 
          className="focus:outline-none"
          onClick={()=>showFileMenu(!showFileMenu)}
        >
          <FaPaperclip className={`h-6 w-6 ${theme === "dark"?"text-gray-400" : "text-gray-500"} mt-2`}/>
        </button>

        {showFileMenu && (
          <div className={ `absolute bottom-full left-0 mb-2 ${theme === "dark" ? "bg-gray-700" : "bg-white"} p-2 rounded-lg shadow-lg}`}>
            <input 
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*,video/*"
              type="file" 
              className="hidden"
            />
            <button onClick={() => fileInputRef.current.click()} 
              className={`flex items-center px-4 py-2 w-full transition-colors  ${theme === "dark" ? "hover:bg-gray-500" : "hover:bg-gray-100"}`}
            >
              <FaImage className={`mr-2`}/> Image/Video
            </button>

            <button onClick={() => fileInputRef.current.click()} 
              className={`flex items-center px-4 py-2 w-full transition-colors  ${theme === "dark" ? "hover:bg-gray-500" : "hover:bg-gray-100"}`}
            >
              <FaFile className={`mr-2`}/> Documents
            </button>
          </div>
        )}

      </div>

      <input type="text" 
        className={`flex-grow px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 ${theme === "dark" ? "bg-gray-700 text-white border-gray-600" : "bgwhite border-gray-300 text-black"}`}
        value={message}
        onChange={(e)=> setMessage(e.target.value)}
        onKeyPress={(e) => {
          if(e.key === "Enter"){
            handleSendMessage();
          }
        }}
        placeholder="Type your message"
      />

      <button onClick={handleSendMessage} className="focus:outline-none">
        <FaPaperPlane className={`h-6 w-6 text-green-500`} onClick={handleSendMessage}/>
      </button>

    </div>

  </div>
  )}
  <VideoCallManager socket={socket}/> 

  </>
}

export default ChatWindow;
