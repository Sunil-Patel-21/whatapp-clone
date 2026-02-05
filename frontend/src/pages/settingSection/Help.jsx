import React, { useState } from "react";
import useThemeStore from "../../store/themeStore";
import Layout from "../../components/Layout";
import { FaArrowLeft, FaChevronRight } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

function Help() {
  const [isThemeDialogOpen, setIsThemeDialogOpen] = useState(false);
  const { theme } = useThemeStore();
  const navigate = useNavigate();

  const toggleThemeDialog = () => {
    setIsThemeDialogOpen(!isThemeDialogOpen);
  };

  const helpSections = [
    {
      title: "Getting Started",
      items: [
        "How to create an account",
        "Setting up your profile",
        "Adding contacts",
        "Starting your first chat"
      ]
    },
    {
      title: "Messaging",
      items: [
        "Sending text messages",
        "Sharing photos and videos",
        "Using emoji reactions",
        "Deleting messages",
        "Message status indicators"
      ]
    },
    {
      title: "Status Updates",
      items: [
        "Creating a status",
        "Viewing others' status",
        "Deleting your status",
        "Status privacy settings"
      ]
    },
    {
      title: "Video Calls",
      items: [
        "Starting a video call",
        "Managing call settings",
        "Troubleshooting call issues"
      ]
    },
    {
      title: "Privacy & Security",
      items: [
        "Account security",
        "Privacy settings",
        "Blocking contacts",
        "End-to-end encryption"
      ]
    },
    {
      title: "Settings",
      items: [
        "Changing theme",
        "Notification settings",
        "Account management",
        "Language preferences"
      ]
    }
  ];

  return (
    <Layout
      isThemeDialogOpen={isThemeDialogOpen}
      toggleThemeDialog={toggleThemeDialog}
    >
      <div className={`flex h-screen ${theme === "dark" ? "bg-[rgb(17,27,33)] text-white" : "bg-white text-black"}`}>
        <div className={`w-full max-w-4xl mx-auto border-r ${theme === "dark" ? "border-gray-600" : "border-gray-200"}`}>
          <div className={`p-4 border-b ${theme === "dark" ? "border-gray-600" : "border-gray-200"} flex items-center gap-4`}>
            <button onClick={() => navigate("/setting")} className="focus:outline-none">
              <FaArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-semibold">Help Center</h1>
          </div>

          <div className="p-6 overflow-y-auto h-[calc(100vh-80px)]">
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-2">How can we help you?</h2>
              <p className={`${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                Find answers to common questions and learn how to use WhatsApp Clone
              </p>
            </div>

            <div className="space-y-6">
              {helpSections.map((section, index) => (
                <div key={index} className={`rounded-lg ${theme === "dark" ? "bg-[#202c33]" : "bg-gray-50"} p-4`}>
                  <h3 className="text-lg font-semibold mb-3">{section.title}</h3>
                  <div className="space-y-2">
                    {section.items.map((item, itemIndex) => (
                      <div
                        key={itemIndex}
                        className={`flex items-center justify-between p-3 rounded cursor-pointer ${theme === "dark" ? "hover:bg-[#2a3942]" : "hover:bg-gray-100"}`}
                      >
                        <span>{item}</span>
                        <FaChevronRight className="h-4 w-4 text-gray-400" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className={`mt-8 p-6 rounded-lg ${theme === "dark" ? "bg-[#202c33]" : "bg-gray-50"}`}>
              <h3 className="text-lg font-semibold mb-2">Still need help?</h3>
              <p className={`mb-4 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                Contact our support team for personalized assistance
              </p>
              <button className="bg-green-500 text-white px-6 py-2 rounded-full hover:bg-green-600 transition-colors">
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Help;
