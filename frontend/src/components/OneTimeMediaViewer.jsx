import React, { useState, useEffect } from 'react';
import { FaTimes, FaEye, FaClock, FaExclamationTriangle } from 'react-icons/fa';
import { axiosInstance } from '../services/url.service';
import { toast } from 'react-toastify';

const OneTimeMediaViewer = ({ message, theme, onClose, onViewRecorded }) => {
  const [mediaUrl, setMediaUrl] = useState(null);
  const [viewsLeft, setViewsLeft] = useState(message.viewsLeft);
  const [loading, setLoading] = useState(false);
  const [showWarning, setShowWarning] = useState(true);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && mediaUrl) {
        toast.warning('⚠️ Tab switched - Media still visible');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [mediaUrl]);

  const handleView = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const { data } = await axiosInstance.post(`/chats/messages/${message._id}/view`);
      setMediaUrl(data.data.mediaUrl);
      setViewsLeft(data.data.viewsLeft);
      setShowWarning(false);
      onViewRecorded(message._id, data.data.viewsLeft);
      
      if (data.data.viewsLeft === 0) {
        setTimeout(() => {
          toast.info('Media expired - no views remaining');
          onClose();
        }, 3000);
      }
    } catch (error) {
      if (error.response?.status === 410) {
        toast.error('Media has expired');
        onClose();
      } else {
        toast.error('Failed to load media');
      }
    } finally {
      setLoading(false);
    }
  };

  const getTimeRemaining = () => {
    if (!message.mediaExpiresAt) return null;
    const remaining = new Date(message.mediaExpiresAt) - new Date();
    if (remaining <= 0) return 'Expired';
    
    const minutes = Math.floor(remaining / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50">
      <button onClick={onClose} className="absolute top-4 right-4 text-white hover:text-gray-300">
        <FaTimes className="h-8 w-8" />
      </button>

      <div className="max-w-4xl w-full p-4">
        <div className="bg-black bg-opacity-50 rounded-lg p-4 mb-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <FaEye className="text-blue-400" />
                <span>{viewsLeft} view{viewsLeft !== 1 ? 's' : ''} left</span>
              </div>
              {message.mediaExpiresAt && (
                <div className="flex items-center gap-2">
                  <FaClock className="text-yellow-400" />
                  <span>{getTimeRemaining()}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {showWarning && !mediaUrl && (
          <div className="bg-yellow-900 bg-opacity-50 rounded-lg p-6 mb-4 text-center">
            <FaExclamationTriangle className="h-12 w-12 text-yellow-400 mx-auto mb-3" />
            <h3 className="text-xl font-semibold text-white mb-2">One-Time Media</h3>
            <p className="text-gray-300 mb-4">
              This media can only be viewed {message.viewLimit} time{message.viewLimit !== 1 ? 's' : ''}.
              Screenshots are discouraged but cannot be blocked in browsers.
            </p>
            <button
              onClick={handleView}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'View Media'}
            </button>
          </div>
        )}

        {mediaUrl && (
          <div className="flex items-center justify-center">
            {message.contentType === 'image' ? (
              <img
                src={mediaUrl}
                alt="One-time media"
                className="max-w-full max-h-[70vh] rounded-lg"
                onContextMenu={(e) => e.preventDefault()}
              />
            ) : (
              <video
                src={mediaUrl}
                controls
                controlsList="nodownload"
                className="max-w-full max-h-[70vh] rounded-lg"
                onContextMenu={(e) => e.preventDefault()}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OneTimeMediaViewer;
