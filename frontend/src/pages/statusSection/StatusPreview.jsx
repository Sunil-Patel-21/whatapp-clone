import React, { useEffect } from "react";
import { motion } from "framer-motion";
import formatTimestamp from "../../utils/FormatTime";
import { FaTimes, FaTrash, FaChevronLeft, FaChevronRight } from "react-icons/fa";

function StatusPreview({
  contact,
  currentIndex,
  onPrev,
  onNext,
  currentUser,
  theme,
  onClose,
  onDelete,
  loading,
}) {
  const [progress, setProgress] = React.useState(0);
  const [showViewers, setShowViewers] = React.useState(false);

  const currentStatus = contact?.statuses[currentIndex];
  const isOwnerStatus = currentUser?._id === contact._id;
  useEffect(() => {
    setProgress(0);
    let current = 0;

    const interval = setInterval(() => {
      current += 1;
      setProgress(current);

      if (current >= 100) {
        clearInterval(interval);
        if (currentIndex < contact.statuses.length - 1) {
          onNext();
        } else {
          onClose();
        }
      }
    }, 50);

    return () => clearInterval(interval);
  }, [currentIndex, onNext, onClose, contact.statuses.length]);

  const handleViewersToggle = () => {
    setShowViewers(!showViewers);
  };

  const handleDeleteStatus = (e) => {
    e.stopPropagation();
    if (onDelete && currentStatus?._id) {
      onDelete(currentStatus._id);
    }

    if (contact.statuses.length === 1) {
      onClose();
    } else {
      onNext();
    }
  };

  if (!currentStatus) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 w-full h-full bg-black z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md h-full mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full h-full bg-black relative overflow-hidden">
          {/* Progress bars */}
          <div className="absolute top-0 left-0 right-0 flex gap-1 p-4 z-20">
            {contact?.statuses.map((_, index) => (
              <div
                className="h-1 bg-gray-600 flex-1 rounded overflow-hidden"
                key={index}
              >
                <div
                  className="h-full bg-white transition-all duration-100 ease-linear"
                  style={{
                    width:
                      index < currentIndex
                        ? "100%"
                        : index === currentIndex
                          ? `${progress}%`
                          : "0%",
                  }}
                />
              </div>
            ))}
          </div>

          {/* Header */}
          <div className="absolute top-12 left-0 right-0 z-20 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img
                  src={contact?.avatar}
                  alt={contact?.name}
                  className="w-10 h-10 rounded-full object-cover border-2 border-white"
                />
                <div>
                  <p className="text-white font-semibold">{contact?.name}</p>
                  <p className="text-gray-300 text-sm">
                    {formatTimestamp(currentStatus?.createdAt || currentStatus?.timestamp || currentStatus?.uploadedAt)}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {isOwnerStatus && (
                  <button
                    onClick={handleDeleteStatus}
                    className="text-white bg-red-500 bg-opacity-70 rounded-full p-2 hover:bg-opacity-90 transition-all"
                  >
                    <FaTrash className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75 transition-all"
                >
                  <FaTimes className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Status Content */}
          <div className="w-full h-full flex items-center justify-center pt-20 pb-4">
            {currentStatus.contentType === "text" ? (
              <div className="text-white text-center p-8 max-w-sm">
                <p className="text-xl font-medium leading-relaxed">{currentStatus.content || currentStatus.media}</p>
              </div>
            ) : currentStatus.contentType === "image" ? (
              <img
                src={currentStatus.media}
                alt="Status"
                className="max-w-full max-h-full object-contain"
              />
            ) : currentStatus.contentType === "video" ? (
              <video
                src={currentStatus.media}
                controls
                muted
                autoPlay
                className="max-w-full max-h-full object-contain"
              />
            ) : null}
          </div>

          {/* Navigation buttons */}
          {currentIndex > 0 && (
            <button
              onClick={onPrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-black bg-opacity-50 rounded-full p-3 hover:bg-opacity-75 transition-all z-10"
            >
              <FaChevronLeft className="h-5 w-5" />
            </button>
          )}

          {currentIndex < contact.statuses.length - 1 && (
            <button
              onClick={onNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-black bg-opacity-50 rounded-full p-3 hover:bg-opacity-75 transition-all z-10"
            >
              <FaChevronRight className="h-5 w-5" />
            </button>
          )}


        </div>
      </div>
    </motion.div>
  );
}

export default StatusPreview;
