import React, { useState } from "react";
import useThemeStore from "../../store/themeStore";
import Layout from "../../components/Layout";
import { FaArrowLeft, FaChevronDown, FaLock, FaVideo, FaImage, FaBell, FaUserShield, FaComments } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

function Help() {
  const [isThemeDialogOpen, setIsThemeDialogOpen] = useState(false);
  const [expandedItem, setExpandedItem] = useState(null);
  const { theme } = useThemeStore();
  const navigate = useNavigate();

  const toggleThemeDialog = () => {
    setIsThemeDialogOpen(!isThemeDialogOpen);
  };

  const toggleExpand = (sectionIndex, itemIndex) => {
    const key = `${sectionIndex}-${itemIndex}`;
    setExpandedItem(expandedItem === key ? null : key);
  };

  const helpSections = [
    {
      title: "Getting Started",
      icon: FaComments,
      color: "text-blue-500",
      items: [
        {
          question: "How do I create an account?",
          answer: "Creating your account is simple and secure. Navigate to the login page and click 'Sign Up'. Enter your email address, create a strong password (minimum 8 characters with letters and numbers), and choose a unique username. You'll receive a verification email - click the link to activate your account. Once verified, set up your profile with a photo and status message to let your contacts know it's you!"
        },
        {
          question: "How do I set up my profile?",
          answer: "Your profile is your digital identity. Go to Settings > Account to customize it. Upload a clear profile picture (recommended: 500x500px), write a creative status message that reflects your personality, and add your name. You can also set your privacy preferences to control who sees your information. Remember, a complete profile helps your friends find and recognize you easily!"
        },
        {
          question: "How can I add and manage contacts?",
          answer: "Building your network is easy! Click the 'New Chat' button and search for users by their username or email address. You can also sync your phone contacts if you've granted permission. To manage contacts, long-press on any chat to access options like mute, archive, or block. Keep your contact list organized by pinning important conversations to the top!"
        }
      ]
    },
    {
      title: "Messaging Features",
      icon: FaComments,
      color: "text-green-500",
      items: [
        {
          question: "How do I send messages and media?",
          answer: "Express yourself in multiple ways! Type text messages in the chat box and hit Enter to send. Click the paperclip icon to share photos, videos, or documents. You can add captions to media files before sending. Pro tip: Drag and drop files directly into the chat window for faster sharing. All media is automatically compressed for optimal delivery without losing quality!"
        },
        {
          question: "What do message status indicators mean?",
          answer: "Stay informed about your message delivery: Single gray checkmark (✓) means your message was sent to our servers. Double gray checkmarks (✓✓) indicate the message was delivered to the recipient's device. Double blue checkmarks (✓✓) confirm the recipient has read your message. If you see a clock icon, your message is still being sent - check your internet connection."
        },
        {
          question: "How do emoji reactions work?",
          answer: "React instantly to messages! Hover over any message and click the smile icon. Choose from 6 quick reactions (👍❤️😂😮😢🙏) or click the plus button to access the full emoji picker. Your reaction appears below the message, and you can change it anytime. It's a fun, quick way to respond without typing a full message!"
        },
        {
          question: "Can I delete or edit messages?",
          answer: "Made a mistake? No problem! Hover over your sent message and click the three-dot menu, then select 'Delete'. The message will be removed from the conversation. Important: You can only delete your own messages, and this action is permanent. Currently, message editing is not available, so double-check before sending important information!"
        }
      ]
    },
    {
      title: "Status & Stories",
      icon: FaImage,
      color: "text-purple-500",
      items: [
        {
          question: "How do I create and share status updates?",
          answer: "Share your moments with Status! Navigate to the Status tab and click 'My Status' or the camera icon. Choose to upload a photo/video from your gallery or create a text status with colorful backgrounds. Add text, emojis, or drawings to personalize it. Your status disappears after 24 hours automatically. Perfect for sharing daily highlights, announcements, or just what's on your mind!"
        },
        {
          question: "How can I view and interact with others' status?",
          answer: "Stay connected with your contacts' updates! Go to the Status tab to see all available status updates. Tap on a contact's status to view it in full screen. Swipe left/right or use arrow buttons to navigate between multiple status updates from the same person. You can see who viewed your status by tapping on your own status and checking the viewer list."
        },
        {
          question: "How do I control who sees my status?",
          answer: "Your privacy matters! Go to Settings > Privacy > Status Privacy to customize your audience. Choose 'My Contacts' to share with everyone, 'My Contacts Except...' to exclude specific people, or 'Only Share With...' to select specific contacts. This gives you complete control over who can see your personal moments and updates."
        }
      ]
    },
    {
      title: "Video Calling",
      icon: FaVideo,
      color: "text-red-500",
      items: [
        {
          question: "How do I make video calls?",
          answer: "Connect face-to-face instantly! Open any chat and click the video camera icon in the top-right corner. The recipient will receive a call notification. Ensure you have a stable internet connection (WiFi recommended) and that camera/microphone permissions are enabled in your browser settings. For the best experience, use headphones to avoid echo and find a well-lit area."
        },
        {
          question: "What controls are available during calls?",
          answer: "Full control at your fingertips! During a video call, you'll see controls at the bottom: microphone icon to mute/unmute audio, camera icon to turn video on/off, flip icon to switch between front/rear cameras, and red phone icon to end the call. You can also minimize the call window to multitask while staying connected."
        },
        {
          question: "Why is my call quality poor?",
          answer: "Optimize your call experience! Poor quality usually stems from slow internet - try switching to WiFi or moving closer to your router. Close bandwidth-heavy apps running in the background. Ensure your camera lens is clean and you're in a well-lit area. If issues persist, try restarting the app or updating to the latest version. Minimum recommended speed: 1 Mbps for video calls."
        }
      ]
    },
    {
      title: "Privacy & Security",
      icon: FaUserShield,
      color: "text-yellow-500",
      items: [
        {
          question: "How secure are my messages?",
          answer: "Your privacy is our top priority! All messages are protected with end-to-end encryption, meaning only you and your recipient can read them - not even we can access your conversations. Look for the lock icon in chats to confirm encryption is active. Your messages, calls, photos, and videos are all encrypted by default. We never store your message content on our servers."
        },
        {
          question: "How do I manage my privacy settings?",
          answer: "Take control of your privacy! Navigate to Settings > Privacy to customize: who can see your profile photo, about info, and last seen status; who can add you to groups; and who can see your status updates. You can choose 'Everyone', 'My Contacts', or 'Nobody' for each setting. Review these settings regularly to ensure they match your comfort level."
        },
        {
          question: "How do I block or report users?",
          answer: "Stay safe from unwanted contacts! To block someone, open their chat, click the three-dot menu, and select 'Block'. Blocked users can't send you messages, call you, or see your online status and profile updates. To report abusive behavior, use the 'Report' option in the same menu. You can view and manage blocked contacts in Settings > Privacy > Blocked Contacts."
        },
        {
          question: "How can I secure my account?",
          answer: "Protect your account with these best practices: Use a strong, unique password (mix of uppercase, lowercase, numbers, and symbols). Never share your password or verification codes with anyone. Log out from devices you no longer use (check Settings > Linked Devices). Enable two-factor authentication if available. Be cautious of phishing attempts - we'll never ask for your password via email or chat."
        }
      ]
    },
    {
      title: "Settings & Customization",
      icon: FaBell,
      color: "text-indigo-500",
      items: [
        {
          question: "How do I change the app theme?",
          answer: "Personalize your experience! Go to Settings and click on 'Theme'. Choose between Light mode (perfect for daytime use with better visibility) or Dark mode (easier on the eyes in low-light conditions and saves battery on OLED screens). Your theme preference is saved automatically and syncs across all your devices. Switch anytime based on your environment or mood!"
        },
        {
          question: "How do I manage notifications?",
          answer: "Stay informed without being overwhelmed! Navigate to Settings > Notifications to customize alerts. You can enable/disable message notifications, choose notification sounds, control vibration patterns, and set quiet hours for uninterrupted sleep. Customize notification previews to show message content or just sender names. You can also mute specific chats for 8 hours, 1 week, or forever."
        },
        {
          question: "Can I backup my chat history?",
          answer: "Never lose your conversations! While automatic cloud backup is in development, you can currently export important chats. Open any chat, click the three-dot menu, and select 'Export Chat'. Choose whether to include media files. The chat will be saved as a text file to your device. For complete data safety, regularly export your most important conversations."
        },
        {
          question: "How do I manage storage and data usage?",
          answer: "Keep your app running smoothly! Go to Settings > Storage to see how much space the app is using. You can clear cache to free up space without deleting messages. To manage data usage, enable 'Low Data Mode' in Settings > Data Usage - this reduces media quality when on mobile data. You can also set media to download only on WiFi to save your mobile data plan."
        }
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
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold mb-3">Welcome to WhatsApp Clone Help Center</h2>
              <p className={`text-lg ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                Everything you need to know about using WhatsApp Clone
              </p>
            </div>

            <div className={`mb-8 p-6 rounded-xl ${theme === "dark" ? "bg-gradient-to-r from-green-900/30 to-blue-900/30" : "bg-gradient-to-r from-green-50 to-blue-50"} border ${theme === "dark" ? "border-green-800" : "border-green-200"}`}>
              <div className="flex items-center gap-3 mb-3">
                <FaLock className="text-green-500 text-2xl" />
                <h3 className="text-xl font-semibold">Your Privacy Matters</h3>
              </div>
              <p className={`${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                All your messages are protected with end-to-end encryption. Your personal conversations stay between you and who you're talking to - not even we can read them.
              </p>
            </div>

            <div className="space-y-6">
              {helpSections.map((section, index) => {
                const IconComponent = section.icon;
                return (
                  <div key={index} className={`rounded-xl ${theme === "dark" ? "bg-[#202c33]" : "bg-gray-50"} p-5 border ${theme === "dark" ? "border-gray-700" : "border-gray-200"} shadow-sm`}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-3 rounded-full ${theme === "dark" ? "bg-[#2a3942]" : "bg-white"}`}>
                        <IconComponent className={`text-xl ${section.color}`} />
                      </div>
                      <h3 className="text-xl font-bold">{section.title}</h3>
                    </div>
                    <div className="space-y-3">
                      {section.items.map((item, itemIndex) => {
                        const itemKey = `${index}-${itemIndex}`;
                        const isExpanded = expandedItem === itemKey;
                        return (
                          <div key={itemIndex} className={`rounded-lg overflow-hidden ${theme === "dark" ? "bg-[#1a252d]" : "bg-white"} border ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}>
                            <div
                              onClick={() => toggleExpand(index, itemIndex)}
                              className={`flex items-center justify-between p-4 cursor-pointer transition-colors ${theme === "dark" ? "hover:bg-[#2a3942]" : "hover:bg-gray-50"}`}
                            >
                              <span className="font-medium">{item.question}</span>
                              <FaChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                            </div>
                            {isExpanded && (
                              <div className={`px-4 pb-4 border-t ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}>
                                <p className={`${theme === "dark" ? "text-gray-300" : "text-gray-700"} leading-relaxed pt-3`}>
                                  {item.answer}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className={`mt-8 p-6 rounded-xl ${theme === "dark" ? "bg-gradient-to-r from-blue-900/30 to-purple-900/30" : "bg-gradient-to-r from-blue-50 to-purple-50"} border ${theme === "dark" ? "border-blue-800" : "border-blue-200"}`}>
              <h3 className="text-xl font-bold mb-2">Still Need Help?</h3>
              <p className={`mb-4 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                Can't find what you're looking for? Our support team is here to help you 24/7.
              </p>
              <div className="flex gap-3">
                <button className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors font-medium shadow-lg">
                  Contact Support
                </button>
                <button className={`px-6 py-3 rounded-lg font-medium transition-colors ${theme === "dark" ? "bg-[#202c33] hover:bg-[#2a3942] text-white" : "bg-white hover:bg-gray-100 text-gray-800 border border-gray-300"}`}>
                  Community Forum
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Help;
