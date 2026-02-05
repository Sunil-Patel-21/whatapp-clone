import React from "react";
import { FaTimes, FaPhone, FaVideo, FaBan } from "react-icons/fa";
import { format } from "date-fns";
import useUserStore from "../../store/useUserStore";

function ContactInfo({ contact, theme, onClose }) {
  const handleAudioCall = () => {
    const initiateCall = useUserStore.getState().initiateCall;
    if (initiateCall) {
      initiateCall(contact?._id, contact?.username, contact?.profilePicture, "audio");
      onClose();
    }
  };

  const handleVideoCall = () => {
    const initiateCall = useUserStore.getState().initiateCall;
    if (initiateCall) {
      initiateCall(contact?._id, contact?.username, contact?.profilePicture, "video");
      onClose();
    }
  };
  return (
    <div className={`w-full h-full ${theme === "dark" ? "bg-[#111b21] text-white" : "bg-white text-black"} overflow-y-auto`}>
      <div className={`p-4 flex items-center gap-4 ${theme === "dark" ? "bg-[#202c33]" : "bg-gray-100"}`}>
        <button onClick={onClose} className="focus:outline-none">
          <FaTimes className="h-6 w-6" />
        </button>
        <h2 className="text-lg font-semibold">Contact Info</h2>
      </div>

      <div className="flex flex-col items-center p-6">
        <img
          src={contact?.profilePicture}
          alt={contact?.username}
          className="w-32 h-32 rounded-full object-cover mb-4"
        />
        <h3 className="text-2xl font-semibold mb-1">{contact?.username}</h3>
        <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
          {contact?.email}
        </p>
      </div>

      <div className={`p-4 ${theme === "dark" ? "bg-[#202c33]" : "bg-gray-50"} mb-2`}>
        <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"} mb-1`}>About</p>
        <p>{contact?.about || "Hey there! I am using WhatsApp Clone"}</p>
      </div>

      <div className={`p-4 ${theme === "dark" ? "bg-[#202c33]" : "bg-gray-50"}`}>
        <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"} mb-3`}>Actions</p>
        <button onClick={handleAudioCall} className={`flex items-center gap-3 w-full p-3 rounded ${theme === "dark" ? "hover:bg-[#2a3942]" : "hover:bg-gray-100"}`}>
          <FaPhone className="text-green-500" />
          <span>Audio Call</span>
        </button>
        <button onClick={handleVideoCall} className={`flex items-center gap-3 w-full p-3 rounded ${theme === "dark" ? "hover:bg-[#2a3942]" : "hover:bg-gray-100"}`}>
          <FaVideo className="text-green-500" />
          <span>Video Call</span>
        </button>
        <button className={`flex items-center gap-3 w-full p-3 rounded text-red-500 ${theme === "dark" ? "hover:bg-[#2a3942]" : "hover:bg-gray-100"}`}>
          <FaBan />
          <span>Block Contact</span>
        </button>
      </div>
    </div>
  );
}

export default ContactInfo;
