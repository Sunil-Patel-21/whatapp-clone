import React, { useState } from 'react';
import { FaClock, FaEye, FaTimes } from 'react-icons/fa';

const OneTimeMediaModal = ({ theme, onConfirm, onClose }) => {
  const [viewLimit, setViewLimit] = useState('1');
  const [timeLimit, setTimeLimit] = useState('600000'); // 10 min
  const [customMinutes, setCustomMinutes] = useState('');

  const viewOptions = [
    { label: '1 View', value: '1' },
    { label: '2 Views', value: '2' }
  ];

  const timeOptions = [
    { label: '10 Minutes', value: 600000 },
    { label: '1 Hour', value: 3600000 },
    { label: '24 Hours', value: 86400000 },
    { label: 'Custom', value: 'custom' }
  ];

  const handleConfirm = () => {
    const finalTime = timeLimit === 'custom' 
      ? parseInt(customMinutes) * 60000 
      : parseInt(timeLimit);
    
    if (timeLimit === 'custom' && (!customMinutes || customMinutes <= 0)) {
      alert('Enter valid minutes');
      return;
    }
    
    onConfirm({ viewLimit: parseInt(viewLimit), mediaExpiryDuration: finalTime });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`w-full max-w-md rounded-lg p-6 ${theme === 'dark' ? 'bg-[#2a3942] text-white' : 'bg-white text-gray-800'}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FaClock className="text-blue-500 h-6 w-6" />
            <h2 className="text-xl font-semibold">One-Time View Plus</h2>
          </div>
          <button onClick={onClose}>
            <FaTimes className="h-5 w-5" />
          </button>
        </div>

        <p className={`mb-4 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
          Media will be deleted after view limit or time expires.
        </p>

        <div className="mb-4">
          <label className="block mb-2 font-semibold flex items-center gap-2">
            <FaEye /> View Limit
          </label>
          {viewOptions.map((opt) => (
            <label key={opt.value} className={`flex items-center p-3 rounded-lg cursor-pointer mb-2 ${theme === 'dark' ? 'hover:bg-[#202c33]' : 'hover:bg-gray-100'} ${viewLimit === opt.value ? 'bg-blue-500 bg-opacity-20' : ''}`}>
              <input type="radio" name="viewLimit" value={opt.value} checked={viewLimit === opt.value} onChange={(e) => setViewLimit(e.target.value)} className="mr-3" />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>

        <div className="mb-4">
          <label className="block mb-2 font-semibold flex items-center gap-2">
            <FaClock /> Time Limit
          </label>
          {timeOptions.map((opt) => (
            <label key={opt.value} className={`flex items-center p-3 rounded-lg cursor-pointer mb-2 ${theme === 'dark' ? 'hover:bg-[#202c33]' : 'hover:bg-gray-100'} ${timeLimit === opt.value.toString() ? 'bg-blue-500 bg-opacity-20' : ''}`}>
              <input type="radio" name="timeLimit" value={opt.value} checked={timeLimit === opt.value.toString()} onChange={(e) => setTimeLimit(e.target.value)} className="mr-3" />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>

        {timeLimit === 'custom' && (
          <input type="number" placeholder="Enter minutes" value={customMinutes} onChange={(e) => setCustomMinutes(e.target.value)} className={`w-full p-3 rounded-lg mb-4 ${theme === 'dark' ? 'bg-[#202c33] text-white' : 'bg-gray-100 text-black'}`} min="1" />
        )}

        <div className="flex gap-3">
          <button onClick={onClose} className={`flex-1 py-2 rounded-lg ${theme === 'dark' ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'}`}>
            Cancel
          </button>
          <button onClick={handleConfirm} className="flex-1 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white">
            Enable
          </button>
        </div>
      </div>
    </div>
  );
};

export default OneTimeMediaModal;
