import React, { useState, useMemo } from "react";
import useLayoutStore from "../../store/layoutStore";
import useThemeStore from "../../store/themeStore";
import useUserStore from "../../store/useUserStore";
import { FaPlusCircle, FaSearch } from "react-icons/fa";
import { motion } from "framer-motion";
import formatTimestamp from "../../utils/FormatTime";

function ChatList({ contact }) {
  const setSelectedContact = useLayoutStore((state) => state.setSelectedContact);
  const selectedContact = useLayoutStore((state) => state.selectedContact);
  console.log("Selected contact : " , selectedContact);
  
  const { theme } = useThemeStore();
  const { user } = useUserStore();

  const [searchTerms, setSearchTerms] = useState("");

  // 🔧 CHANGE: memoized filtering for performance + safety
  const filteredContacts = useMemo(() => {
    if (!Array.isArray(contact)) return [];
    return contact.filter((c) =>
      c.username?.toLowerCase().includes(searchTerms.toLowerCase())
    );
  }, [contact, searchTerms]);

  return (
    <div
      className={`w-full h-screen border-r flex flex-col
      ${
        theme === "dark"
          ? "bg-[#111B21] border-gray-700 text-white"
          : "bg-white border-gray-200 text-gray-800"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 sticky top-0 z-10">
        <h2 className="text-xl font-semibold">Chats</h2>
        <button>
          <FaPlusCircle
            size={22}
            className="text-green-500 hover:text-green-600 transition"
          />
        </button>
      </div>

      {/* Search */}
      <div className="px-4 pb-3">
        <div className="relative">
          <FaSearch
            className={`absolute left-3 top-1/2 -translate-y-1/2
            ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}
          />
          <input
            type="text"
            placeholder="Search or start new chat"
            value={searchTerms}
            onChange={(e) => setSearchTerms(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 rounded-lg border text-sm
            focus:outline-none focus:ring-2 focus:ring-green-500
            ${
              theme === "dark"
                ? "bg-[#202C33] border-gray-700 text-white placeholder-gray-400"
                : "bg-gray-100 border-gray-200 text-black placeholder-gray-500"
            }`}
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {filteredContacts.length === 0 && (
          // 🔧 CHANGE: empty state
          <p className="text-center text-sm text-gray-500 mt-6">
            No chats found
          </p>
        )}

        {filteredContacts.map((contact) => {
          const isSelected = selectedContact?._id === contact._id;
          console.log("isSelected : " , isSelected);
          

          // 🔧 CHANGE: safe unread logic
          const unreadCount = contact?.conversation?.unreadCount || 0;
          const lastReceiver =
            contact?.conversation?.lastMessage?.receiver;

          return (
            <motion.div
              key={contact._id}
              whileHover={{ scale: 1.01 }}
              // 🔧 CHANGE: prevent unnecessary re-select
              onClick={() => {
                if (selectedContact?._id !== contact._id) {
                  setSelectedContact(contact);
                }
              }}
              className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all
              ${
                theme === "dark"
                  ? isSelected
                    ? "bg-[#202C33]"
                    : "hover:bg-[#202C33]/70"
                  : isSelected
                  ? "bg-gray-200"
                  : "hover:bg-gray-100"
              }`}
            >
              {/* Avatar */}
              <img
                // 🔧 CHANGE: fallback avatar
                src={contact?.profilePicture || "/default-avatar.png"}
                alt={contact?.username}
                className="w-12 h-12 rounded-full object-cover bg-gray-300"
              />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <h2 className="font-semibold truncate">
                    {contact?.username}
                  </h2>

                  {contact?.conversation?.lastMessage?.createdAt && (
                    <span
                      className={`text-xs whitespace-nowrap
                      ${
                        theme === "dark"
                          ? "text-gray-400"
                          : "text-gray-500"
                      }`}
                    >
                      {formatTimestamp(
                        contact.conversation.lastMessage.createdAt
                      )}
                    </span>
                  )}
                </div>

                <div className="flex justify-between items-center mt-1">
                  <p
                    className={`text-sm truncate
                    ${
                      theme === "dark"
                        ? "text-gray-400"
                        : "text-gray-500"
                    }`}
                  >
                    {contact?.conversation?.lastMessage?.content ||
                      "No messages yet"}
                  </p>

                  {/* 🔧 CHANGE: correct unread badge logic */}
                  {unreadCount > 0 && lastReceiver === user?._id && (
                    <span className="ml-2 min-w-[20px] h-5 px-2 text-xs font-semibold flex items-center justify-center rounded-full bg-green-500 text-white">
                      {unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export default ChatList;
