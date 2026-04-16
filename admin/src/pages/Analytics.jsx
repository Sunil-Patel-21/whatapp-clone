import { useState, useEffect } from 'react';
import { getAnalytics } from '../services/admin.service';
import { toast } from 'react-toastify';
import { TrendingUp, Users, MessageSquare } from 'lucide-react';

const Analytics = () => {
  const [analytics, setAnalytics] = useState({ userGrowth: [], messageVolume: [] });
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7');

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await getAnalytics(period);
      setAnalytics(response.data || { userGrowth: [], messageVolume: [] });
    } catch (error) {
      toast.error('Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-black">Analytics</h1>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
        >
          <option value="7">Last 7 Days</option>
          <option value="30">Last 30 Days</option>
          <option value="90">Last 90 Days</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : (
        <div className="space-y-6">
          {/* User Growth */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center gap-3 mb-4">
              <Users className="text-blue-600" size={24} />
              <h2 className="text-xl font-semibold text-black">User Growth</h2>
            </div>
            {analytics.userGrowth?.length > 0 ? (
              <div className="space-y-2">
                {analytics.userGrowth.map((item) => (
                  <div key={item._id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="text-black">{item._id}</span>
                    <span className="font-semibold text-blue-600">{item.count} users</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No data available</p>
            )}
          </div>

          {/* Message Volume */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center gap-3 mb-4">
              <MessageSquare className="text-green-600" size={24} />
              <h2 className="text-xl font-semibold text-black">Message Volume</h2>
            </div>
            {analytics.messageVolume?.length > 0 ? (
              <div className="space-y-2">
                {analytics.messageVolume.map((item) => (
                  <div key={item._id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="text-black">{item._id}</span>
                    <span className="font-semibold text-green-600">{item.count} messages</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No data available</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
