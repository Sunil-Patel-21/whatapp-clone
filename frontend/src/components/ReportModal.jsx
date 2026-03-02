import { useState } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { axiosInstance } from '../services/url.service';

const ReportModal = ({ isOpen, onClose, reportType, reportedUserId, reportedMessageId, reportedUserName }) => {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const reportReasons = [
    'Spam',
    'Harassment or Bullying',
    'Inappropriate Content',
    'Hate Speech',
    'Violence or Threats',
    'Scam or Fraud',
    'Impersonation',
    'Other'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!reason) {
      toast.error('Please select a reason');
      return;
    }

    setLoading(true);
    try {
      await axiosInstance.post('/reports/create', {
        reportedUserId,
        reportedMessageId,
        reason,
        description
      });

      toast.success('Report submitted successfully');
      onClose();
      setReason('');
      setDescription('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
        <div className="flex justify-between items-center px-6 py-5 border-b">
          <h2 className="text-2xl font-semibold text-gray-900">
            Report {reportType === 'message' ? 'Message' : 'User'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5">
          {reportedUserName && (
            <p className="text-sm text-gray-600 mb-6">
              Reporting: <span className="font-semibold text-gray-900">{reportedUserName}</span>
            </p>
          )}

          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Reason for reporting *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 bg-white"
              required
            >
              <option value="">Select a reason</option>
              {reportReasons.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Additional details (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 resize-none"
              rows="4"
              placeholder="Provide more context..."
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportModal;
