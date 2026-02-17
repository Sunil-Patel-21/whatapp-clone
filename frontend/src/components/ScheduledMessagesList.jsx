import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { FiClock, FiEdit2, FiX, FiAlertCircle } from 'react-icons/fi';
import { useChatStore } from '../store/chatStore';
import { toast } from 'react-toastify';

const ScheduledMessagesList = ({ conversationId, onClose }) => {
    const { scheduledMessages, fetchScheduledMessages, cancelScheduledMessage, updateScheduledMessage } = useChatStore();
    const [editingId, setEditingId] = useState(null);
    const [editContent, setEditContent] = useState('');
    const [editDate, setEditDate] = useState('');
    const [editTime, setEditTime] = useState('');

    useEffect(() => {
        if (conversationId) {
            fetchScheduledMessages(conversationId);
        }
    }, [conversationId]);

    const handleCancel = async (messageId) => {
        try {
            await cancelScheduledMessage(messageId);
            toast.success('Scheduled message cancelled');
        } catch (error) {
            toast.error('Failed to cancel message');
        }
    };

    const handleEdit = (msg) => {
        setEditingId(msg._id);
        setEditContent(msg.content);
        const date = new Date(msg.scheduledTime);
        setEditDate(format(date, 'yyyy-MM-dd'));
        setEditTime(format(date, 'HH:mm'));
    };

    const handleUpdate = async (messageId) => {
        try {
            const scheduledDateTime = new Date(`${editDate}T${editTime}`);
            if (scheduledDateTime <= new Date()) {
                toast.error('Scheduled time must be in the future');
                return;
            }

            await updateScheduledMessage(messageId, {
                content: editContent,
                scheduledTime: scheduledDateTime.toISOString()
            });
            toast.success('Scheduled message updated');
            setEditingId(null);
        } catch (error) {
            toast.error('Failed to update message');
        }
    };

    const filteredMessages = conversationId
        ? scheduledMessages.filter(msg => msg.conversation === conversationId)
        : scheduledMessages;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-[600px] max-w-full mx-4 max-h-[80vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <FiClock className="text-blue-500" size={24} />
                        <h2 className="text-xl font-semibold dark:text-white">Scheduled Messages</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        <FiX size={24} />
                    </button>
                </div>

                {filteredMessages.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        No scheduled messages
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredMessages.map((msg) => (
                            <div
                                key={msg._id}
                                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                            >
                                {editingId === msg._id ? (
                                    <div className="space-y-3">
                                        <textarea
                                            value={editContent}
                                            onChange={(e) => setEditContent(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                            rows={3}
                                        />
                                        <div className="flex gap-2">
                                            <input
                                                type="date"
                                                value={editDate}
                                                onChange={(e) => setEditDate(e.target.value)}
                                                min={format(new Date(), 'yyyy-MM-dd')}
                                                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                            />
                                            <input
                                                type="time"
                                                value={editTime}
                                                onChange={(e) => setEditTime(e.target.value)}
                                                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleUpdate(msg._id)}
                                                className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                                            >
                                                Save
                                            </button>
                                            <button
                                                onClick={() => setEditingId(null)}
                                                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex-1">
                                                <p className="text-gray-800 dark:text-gray-200 mb-1">
                                                    {msg.content || '[Media]'}
                                                </p>
                                                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                                    <FiClock size={14} />
                                                    <span>
                                                        {format(new Date(msg.scheduledTime), 'PPpp')}
                                                    </span>
                                                </div>
                                                {msg.status === 'failed' && (
                                                    <div className="flex items-center gap-1 text-sm text-red-500 mt-1">
                                                        <FiAlertCircle size={14} />
                                                        <span>Failed: {msg.failureReason}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleEdit(msg)}
                                                    className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-gray-700 rounded"
                                                    title="Edit"
                                                >
                                                    <FiEdit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleCancel(msg._id)}
                                                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-gray-700 rounded"
                                                    title="Cancel"
                                                >
                                                    <FiX size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ScheduledMessagesList;
