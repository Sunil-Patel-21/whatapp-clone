import React, { useEffect } from "react";
import useThemeStore from "../../store/themeStore";
import useUserStore from "../../store/useUserStore";
import useStatusStore from "../../store/useStatusStore";
import Layout from "../../components/Layout";
import StatusPreview from "./StatusPreview";
import { motion } from "framer-motion";
import { RxCross2 } from "react-icons/rx";
import { FaCamera, FaEllipsisH, FaPlus, FaStreetView } from "react-icons/fa";
import formatTimestamp from "../../utils/FormatTime";
import StatusList from "./StatusList";

function Status() {
  const [previewContact, setPreviewContact] = React.useState(null);
  const [currentStatusIndex, setCurrentStatusIndex] = React.useState(0);
  const [showOptions, setShowOptions] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState(null);
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [newStatus, setNewStatus] = React.useState("");
  const [filePreview, setFilePreview] = React.useState(null);

  const { theme } = useThemeStore();
  const { user } = useUserStore();

  // status store
  const {
    statuses,
    loading,
    error,
    fetchStatuses,
    createStatus,
    viewStatus,
    deleteStatus,
    getStatusViewers,
    getUserStatuses,
    getOthersStatuses,
    clearError,
    reset,
    cleanupSocket,
    initializeSocket,
  } = useStatusStore();

  const userStatuses = getUserStatuses(user?._id);
  const otherStatuses = getOthersStatuses(user?._id);

  useEffect(() => {
    fetchStatuses();
    initializeSocket();
    return () => {
      cleanupSocket();
    };
  }, [user?._id]);

  // clear error when page is unmount
  useEffect(() => {
    return () => {
      clearError();
    };
  }, []);

  // handle file change
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
        setFilePreview(URL.createObjectURL(file));
      }
    }
  };

  const handleCreateStatus = async () => {
    if (!newStatus.trim() && !selectedFile) return;
    try {
      await createStatus({ content: newStatus, file: selectedFile });
      setNewStatus("");
      setSelectedFile(null);
      setFilePreview(null);
      setShowCreateModal(false);
    } catch (error) {
      console.error("Error while creating status : ", error);
    }
  };

  const handleViewStatus = async (statusId) => {
    try {
      await viewStatus(statusId);
    } catch (error) {
      console.error("Error while viewing status : ", error);
    }
  };

  const handleDeleteStatus = async (statusId) => {
    try {
      await deleteStatus(statusId);
      setShowOptions(false);
      handlePreviewClose();
    } catch (error) {
      console.error("Error while deleting status : ", error);
    }
  };

  const handlePreviewClose = () => {
    setPreviewContact(null);
    setCurrentStatusIndex(0);
  };

  const handlePreviewNext = () => {
    if (currentStatusIndex < previewContact.statuses.length - 1) {
      setCurrentStatusIndex((previewContact) => previewContact + 1);
    } else {
      handlePreviewClose();
    }
  };
  const handlePreviewPrev = () => {
    setCurrentStatusIndex((previewContact) => Math.max(previewContact - 1, 0));
  };

  const handleStatusPreview = (contact, statusIndex = 0) => {
    setPreviewContact(contact);
    setCurrentStatusIndex(statusIndex);

    if (contact.statuses[statusIndex]) {
      handleViewStatus(contact.statuses[statusIndex].id);
    }
  };

  return (
    <Layout
      isStatusPreviewOpen={!!previewContact}
      StatusPreviewContent={
        previewContact && (
          <StatusPreview
            contact={previewContact}
            currentIndex={currentStatusIndex}
            onClose={handlePreviewClose}
            onNext={handlePreviewNext}
            onPrev={handlePreviewPrev}
            onDelete={handleDeleteStatus}
            loading={loading}
            theme={theme}
            currentUser={user}
          />
        )
      }
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={`flex-1 h-screen border-r ${theme === "dark" ? "bg-[rgb(12,19,24)] text-white border-gray-600" : "bg-gray-100 text-black"}`}
      >
        <div
          className={`flex p-4 justify-between items-center shadow-md ${theme === "dark" ? "bg-[rgb(17,27,33)]  " : "bg-gray-100 "}`}
        >
          <h2 className="text-2xl font-bold">Status</h2>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mx-4 mt-2">
            <span className="block sm:inline">{error}</span>
            <button
              className="float-right text-red-500 hover:text-red-700"
              onClick={clearError}
            >
              <RxCross2 className="h-5 w-5 " />
            </button>
          </div>
        )}

        <div className="overflow-y-auto h-[cal(100vh - 64px)] ">
          <div
            className={`flex p-3 space-x-4 shadow-md ${theme === "dark" ? "bg-[rgb(17,27,33)]  " : "bg-gray-100 "}`}
          >
            <div
              className="relative cursor-pointer"
              onClick={() => {
                userStatuses
                  ? handleStatusPreview(userStatuses)
                  : setShowCreateModal(true);
              }}
            >
              <img
                src={user.profilePicture}
                alt="Profile"
                className={`w-12 h-12 rounded-full object-cover ${
                  userStatuses ? 'ring-2 ring-green-500 ring-offset-2' : ''
                }`}
              />
              <button
                className="absolute bottom-0 right-0 bg-green-500 text-white p-1 rounded-full"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCreateModal(true);
                }}
              >
                <FaPlus className="h-2 w-2" />
              </button>
            </div>

            <div className="flex flex-col items-start flex-1">
              <p className="font-semibold">My Status</p>
              <p
                className={`text-sm  ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}
              >
                {userStatuses
                  ? `${userStatuses.statuses.length} Status${userStatuses?.statuses.length > 1 ? "es" : ""} • ${formatTimestamp(userStatuses?.statuses[userStatuses.statuses.length - 1].createdAt || userStatuses?.statuses[userStatuses.statuses.length - 1].timestamp)}`
                  : "Tab to add status"}
              </p>
            </div>
            {userStatuses && (
              <button
                className="ml-auto"
                onClick={() => setShowOptions(!showOptions)}
              >
                <FaEllipsisH
                  className={`h-5 w-5   ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}
                />
              </button>
            )}
          </div>

          {/* options menu  */}
          {showOptions && userStatuses && (
            <div
              className={`p-2 shadow-md ${theme === "dark" ? "bg-[rgb(17,27,33)]  " : "bg-gray-100 "}`}
            >
              <button
                className="w-full text-left text-green-500 py-2 hover:bg-gray-400 px-2 rounded flex items-center "
                onClick={() => {
                  setShowCreateModal(true);
                  setShowOptions(false);
                }}
              >
                <FaCamera className="inline mr-2" /> Add New Status
              </button>

              <button
                className="w-full text-left text-blue-500 py-2 hover:bg-gray-400 px-2 rounded "
                onClick={() => {
                  handleStatusPreview(userStatuses);
                  setShowOptions(false);
                }}
              >
                <FaStreetView className="inline mr-2" /> View Status
              </button>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center p-8 ">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
            </div>
          )}

          {/* recent update from other users */}
          {!loading && otherStatuses.length > 0 && (
            <div
              className={` p-4 space-y-4 shadow-md  mt-4 ${theme === "dark" ? "bg-[rgb(17,27,33)]  " : "bg-gray-100 "}`}
            >
              <h3
                className={`font-semibold ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}
              >
                Recent Updates
              </h3>
              {otherStatuses.map((contact, index) => (
                <React.Fragment key={contact._id}>
                  <StatusList
                    contact={contact}
                    onPreview={() => handleStatusPreview(contact)}
                    theme={theme}
                  />
                  {index < otherStatuses.length - 1 && (
                    <hr
                      className={`${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          )}

          {/* empty state  */}
          {!loading && statuses.length === 0 && (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <div
                className={`text-6xl mb-4 ${theme === "dark" ? "text-gray-600" : "text-gray-300"}`}
              >
                📱
              </div>
              <h3
                className={`text-xl mb-2 font-semibold ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}
              >
                No Status
              </h3>
              <p
                className={`text-sm  ${theme === "dark" ? "text-gray-500" : "text-gray-600"}`}
              >
                Be the first to share your status
              </p>
            </div>
          )}
        </div>

        {/* create status  */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div
              className={`p-6 rounded-lg max-w-md w-full mx-4 ${theme === "dark" ? "bg-gray-800" : "bg-white"}`}
            >
              <h3
                className={`text-lg mb-4 font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}
              >
                Create Status
              </h3>
              
              {filePreview && (
                <div className="mb-4">
                  {selectedFile?.type.startsWith("video/") ? (
                    <video
                      src={filePreview}
                      controls
                      className="w-full h-32 object-cover rounded"
                    />
                  ) : (
                    <img
                      src={filePreview}
                      alt="Preview"
                      className="w-full h-32 object-cover rounded"
                    />
                  )}
                </div>
              )}

              <textarea
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                placeholder="What's on your mind?"
                className={`w-full p-3 rounded-lg mb-4 border ${theme === "dark" ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-100 text-black border-gray-300"}`}
                rows={3}
              />

              <input 
                type="file" 
                accept="image/*,video/*"
                onChange={handleFileChange}
                className={`w-full mb-4 ${theme === "dark" ? "text-white" : "text-black"}`}
              />

              <div className="flex justify-end space-x-3">
                <button 
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewStatus("");
                    setSelectedFile(null);
                    setFilePreview(null);
                  }}
                  disabled={loading}
                  className={`px-4 py-2 rounded ${theme === "dark" ? "text-gray-300 hover:text-white" : "text-gray-500 hover:text-gray-700"}`}
                >
                  Cancel
                </button>

                <button 
                  onClick={handleCreateStatus}
                  disabled={loading || (!newStatus.trim() && !selectedFile)}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                >
                  {loading ? "Creating..." : "Create"}
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </Layout>
  );
}

export default Status;
