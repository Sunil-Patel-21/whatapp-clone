import React, { useState } from 'react';
import { FaShieldAlt, FaTimes } from 'react-icons/fa';

const TemporaryModeModal = ({ theme, onConfirm, onClose, currentMode }) => {
  const [duration, setDuration] = useState('3600000'); // 1 hour default
  const [customHours, setCustomHours] = useState('');

  const durations = [
    { label: '1 Hour', value: 3600000 },
    { label: '24 Hours', value: 86400000 },
    { label: '7 Days', value: 604800000 },
    { label: 'Custom', value: 'custom' }
  ];

  const handleConfirm = () => {
    const finalDuration = duration === 'custom' 
      ? parseInt(customHours) * 3600000 
      : parseInt(duration);
    
    if (duration === 'custom' && (!customHours || customHours <= 0)) {
      alert('Please enter valid hours');
      return;
    }
    
    onConfirm(finalDuration);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`w-full max-w-md rounded-lg p-6 ${theme === 'dark' ? 'bg-[#2a3942] text-white' : 'bg-white text-gray-800'}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FaShieldAlt className="text-green-500 h-6 w-6" />
            <h2 className="text-xl font-semibold">Temporary Chat Mode</h2>
          </div>
          <button onClick={onClose} className="focus:outline-none">
            <FaTimes className="h-5 w-5" />
          </button>
        </div>

        <p className={`mb-4 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
          Messages will auto-delete after the selected duration. Forwarding and copying will be disabled.
        </p>

        <div className="space-y-3 mb-6">
          {durations.map((d) => (
            <label
              key={d.value}
              className={`flex items-center p-3 rounded-lg cursor-pointer ${
                theme === 'dark' ? 'hover:bg-[#202c33]' : 'hover:bg-gray-100'
              } ${duration === d.value.toString() ? 'bg-green-500 bg-opacity-20' : ''}`}
            >
              <input
                type="radio"
                name="duration"
                value={d.value}
                checked={duration === d.value.toString()}
                onChange={(e) => setDuration(e.target.value)}
                className="mr-3"
              />
              <span>{d.label}</span>
            </label>
          ))}
        </div>

        {duration === 'custom' && (
          <input
            type="number"
            placeholder="Enter hours"
            value={customHours}
            onChange={(e) => setCustomHours(e.target.value)}
            className={`w-full p-3 rounded-lg mb-4 focus:outline-none ${
              theme === 'dark' ? 'bg-[#202c33] text-white' : 'bg-gray-100 text-black'
            }`}
            min="1"
          />
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className={`flex-1 py-2 rounded-lg ${
              theme === 'dark' ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white"
          >
            Enable
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemporaryModeModal;
