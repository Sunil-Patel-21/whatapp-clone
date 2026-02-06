import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import formatTimestamp from "../../utils/FormatTime";
import { FaTimes, FaTrash, FaChevronLeft, FaChevronRight, FaEllipsisV } from "react-icons/fa";

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
  const [progress, setProgress] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  const currentStatus = contact?.statuses[currentIndex];
  const isOwnerStatus = currentUser?._id === contact.id;

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

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const handleDeleteStatus = (e) => {
    e.stopPropagation();
    if (window.confirm('Delete this status?')) {
      if (onDelete && currentStatus?.id) {
        onDelete(currentStatus.id);
      }
    }
    setShowMenu(false);
  };

  if (!currentStatus) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-black z-50"
        onClick={onClose}
      >
        <div
          className="relative w-full h-full flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Progress bars */}
          <div className="absolute top-2 left-2 right-2 flex gap-1 z-30">
            {contact?.statuses.map((_, index) => (
              <div
                className="h-0.5 bg-white/30 flex-1 rounded-full overflow-hidden"
                key={index}
              >
                <motion.div
                  className="h-full bg-white rounded-full"
                  initial={{ width: 0 }}
                  animate={{
                    width:
                      index < currentIndex
                        ? "100%"
                        : index === currentIndex
                          ? `${progress}%`
                          : "0%",
                  }}
                  transition={{ duration: 0.1, ease: "linear" }}
                />
              </div>
            ))}
          </div>

          {/* Header */}
          <div className="absolute top-5 left-2 right-2 z-30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={contact?.avatar}
                  alt={contact?.name}
                  className="w-10 h-10 rounded-full object-cover border-2 border-white/80"
                />
                <div>
                  <p className="text-white font-semibold text-sm drop-shadow-lg">
                    {contact?.name}
                  </p>
                  <p className="text-white/80 text-xs drop-shadow-lg">
                    {formatTimestamp(currentStatus?.createdAt || currentStatus?.timeStamp)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isOwnerStatus && (
                  <div className="relative" ref={menuRef}>
                    <button
                      onClick={() => setShowMenu(!showMenu)}
                      className="text-white p-2 hover:bg-white/10 rounded-full transition-all"
                    >
                      <FaEllipsisV className="h-4 w-4 drop-shadow-lg" />
                    </button>

                    {showMenu && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-xl overflow-hidden"
                      >
                        <button
                          onClick={handleDeleteStatus}
                          className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors text-sm font-medium"
                        >
                          <FaTrash className="h-3.5 w-3.5" />
                          Delete Status
                        </button>
                      </motion.div>
                    )}
                  </div>
                )}

                <button
                  onClick={onClose}
                  className="text-white p-2 hover:bg-white/10 rounded-full transition-all"
                >
                  <FaTimes className="h-5 w-5 drop-shadow-lg" />
                </button>
              </div>
            </div>
          </div>

          {/* Status Content - Takes remaining height */}
          <div className="flex-1 flex items-center justify-center pt-20 pb-4 px-2">
            {currentStatus.contentType === "text" ? (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-teal-600 to-blue-600 rounded-2xl px-8">
                <p className="text-white text-2xl font-medium leading-relaxed break-words text-center max-w-md">
                  {currentStatus.content || currentStatus.media}
                </p>
              </div>
            ) : currentStatus.contentType === "image" ? (
              <img
                src={currentStatus.media}
                alt="Status"
                className="max-w-full max-h-full w-auto h-auto object-contain"
              />
            ) : currentStatus.contentType === "video" ? (
              <video
                src={currentStatus.media}
                controls
                autoPlay
                muted
                className="max-w-full max-h-full w-auto h-auto object-contain"
              />
            ) : null}
          </div>

          {/* Navigation buttons */}
          {currentIndex > 0 && (
            <button
              onClick={onPrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full p-3 transition-all z-20"
            >
              <FaChevronLeft className="h-5 w-5" />
            </button>
          )}

          {currentIndex < contact.statuses.length - 1 && (
            <button
              onClick={onNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full p-3 transition-all z-20"
            >
              <FaChevronRight className="h-5 w-5" />
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default StatusPreview;
