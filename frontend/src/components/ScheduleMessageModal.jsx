import { useState } from 'react';
import { format } from 'date-fns';
import { FiClock, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';

const ScheduleMessageModal = ({ isOpen, onClose, onSchedule, initialContent = '' }) => {
    const [scheduledDate, setScheduledDate] = useState('');
    const [scheduledTime, setScheduledTime] = useState('');

    const getMinDateTime = () => {
        const now = new Date();
        now.setMinutes(now.getMinutes() + 1);
        return now;
    };

    const getMinDate = () => {
        return format(new Date(), 'yyyy-MM-dd');
    };

    const getMinTime = () => {
        const now = new Date();
        if (scheduledDate === getMinDate()) {
            return format(now, 'HH:mm');
        }
        return '00:00';
    };

    const handleSchedule = () => {
        if (!scheduledDate || !scheduledTime) {
            toast.error('Please select date and time');
            return;
        }

        const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
        const now = new Date();

        if (scheduledDateTime <= now) {
            toast.error('Scheduled time must be in the future');
            return;
        }

        onSchedule(scheduledDateTime.toISOString());
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-full mx-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <FiClock className="text-blue-500" size={24} />
                        <h2 className="text-xl font-semibold dark:text-white">Schedule Message</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        <FiX size={24} />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Date
                        </label>
                        <input
                            type="date"
                            value={scheduledDate}
                            onChange={(e) => setScheduledDate(e.target.value)}
                            min={getMinDate()}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Time
                        </label>
                        <input
                            type="time"
                            value={scheduledTime}
                            onChange={(e) => setScheduledTime(e.target.value)}
                            min={getMinTime()}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                    </div>

                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        {scheduledDate && scheduledTime && (
                            <p>
                                Message will be sent on{' '}
                                <span className="font-medium">
                                    {format(new Date(`${scheduledDate}T${scheduledTime}`), 'PPpp')}
                                </span>
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSchedule}
                        className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                        Schedule
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ScheduleMessageModal;
