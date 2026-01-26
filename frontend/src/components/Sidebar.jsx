import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import useThemeStore from "../store/themeStore";
import useUserStore from "../store/useUserStore";
import useLayoutStore from "../store/layoutStore";
import { FaWhatsapp } from "react-icons/fa";
import { MdRadioButtonChecked } from "react-icons/md";
import { FaCog, FaUserCircle } from "react-icons/fa";
import { motion } from "framer-motion";

function Sidebar() {
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const { theme } = useThemeStore();
  const { user } = useUserStore();
  const { activeTab, setActiveTab, selectedContact } = useLayoutStore();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (location.pathname === "/") setActiveTab("chats");
    else if (location.pathname === "/status") setActiveTab("status");
    else if (location.pathname === "/user-profile") setActiveTab("profile");
    else if (location.pathname === "/setting") setActiveTab("setting");
  }, [location, setActiveTab]);

  if (isMobile && selectedContact) return null;

  const iconBase = "h-6 w-6 transition-colors duration-200";

  const iconColor = (tab) =>
    activeTab === tab
      ? "text-green-500"
      : theme === "dark"
        ? "text-gray-400"
        : "text-gray-700";

  const activeBg = activeTab ? "bg-gray-700 shadow-md" : "";

  const SidebarContent = (
    <>
      <Link
        to="/"
        className={`  mt-5 flex items-center justify-center p-2 rounded-full
        ${activeTab === "chats" ? "bg-gray-700" : ""}
        ${!isMobile ? "mb-8" : ""}`}
      >
        <FaWhatsapp className={`${iconBase} ${iconColor("chats")}`} />
      </Link>

      <Link
        to="/status"
        className={`flex items-center justify-center p-3 rounded-full
        ${activeTab === "status" ? "bg-gray-700" : ""}
        ${!isMobile ? "mb-8" : ""}`}
      >
        <MdRadioButtonChecked
          className={`${iconBase} ${iconColor("status")}`}
        />
      </Link>

      {!isMobile && <div className="flex-grow" />}

      <Link
        to="/user-profile"
        className={`flex items-center justify-center p-3 rounded-full
        ${activeTab === "profile" ? "bg-gray-700" : ""}
        ${!isMobile ? "mb-8" : ""}`}
      >
        {user?.profilePicture ? (
          <img
            src={user.profilePicture}
            alt="user"
            className="h-6 w-6 rounded-full"
          />
        ) : (
          <FaUserCircle className={`${iconBase} ${iconColor("profile")}`} />
        )}
      </Link>

      <Link
        to="/setting"
        className={`flex items-center justify-center p-2 rounded-full
        ${activeTab === "setting" ? "bg-gray-700" : ""}
        ${!isMobile ? "mb-8" : ""}`}
      >
        <FaCog className={`${iconBase} ${iconColor("setting")}`} />
      </Link>
    </>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={`
        ${
          isMobile
            ? "fixed bottom-0 left-0 right-0 h-16 flex flex-row justify-around"
            : "w-16 h-screen flex flex-col items-center"
        }
        ${
          theme === "dark"
            ? "bg-gray-800 border-gray-700"
            : "bg-white border-gray-300"
        }
        border-r shadow-lg opacity-95 z-50
      `}
    >
      {SidebarContent}
    </motion.div>
  );
}

export default Sidebar;
