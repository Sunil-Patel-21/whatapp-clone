import { useState, useEffect } from 'react';
import { getAnalytics } from '../services/admin.service';
import { toast } from 'react-toastify';
import { TrendingUp, Users, MessageSquare, Calendar } from 'lucide-react';

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

  const totalUsers = analytics.userGrowth?.reduce((sum, item) => sum + item.count, 0) || 0;
  const totalMessages = analytics.messageVolume?.reduce((sum, item) => sum + item.count, 0) || 0;
  const avgUsersPerDay = analytics.userGrowth?.length > 0 ? Math.round(totalUsers / analytics.userGrowth.length) : 0;
  const avgMessagesPerDay = analytics.messageVolume?.length > 0 ? Math.round(totalMessages / analytics.messageVolume.length) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Analytics Dashboard</h1>
          <p className="text-gray-600">Track your platform's growth and engagement metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <Calendar className="text-gray-400" size={20} />
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-6 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 font-medium bg-white shadow-lg cursor-pointer transition-all duration-300 hover:shadow-xl"
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading Analytics...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <Users size={32} className="opacity-80" />
                <TrendingUp size={20} />
              </div>
              <p className="text-sm opacity-90 mb-1">Total New Users</p>
              <p className="text-3xl font-bold">{totalUsers}</p>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <MessageSquare size={32} className="opacity-80" />
                <TrendingUp size={20} />
              </div>
              <p className="text-sm opacity-90 mb-1">Total Messages</p>
              <p className="text-3xl font-bold">{totalMessages}</p>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <Users size={32} className="opacity-80" />
                <TrendingUp size={20} />
              </div>
              <p className="text-sm opacity-90 mb-1">Avg Users/Day</p>
              <p className="text-3xl font-bold">{avgUsersPerDay}</p>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <MessageSquare size={32} className="opacity-80" />
                <TrendingUp size={20} />
              </div>
              <p className="text-sm opacity-90 mb-1">Avg Messages/Day</p>
              <p className="text-3xl font-bold">{avgMessagesPerDay}</p>
            </div>
          </div>

          {/* User Growth Chart */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-blue-100 p-3 rounded-xl">
                <Users className="text-blue-600" size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">User Growth</h2>
                <p className="text-sm text-gray-500">Daily new user registrations</p>
              </div>
            </div>
            {analytics.userGrowth?.length > 0 ? (
              <div className="space-y-3">
                {analytics.userGrowth.map((item, index) => {
                  const maxCount = Math.max(...analytics.userGrowth.map(i => i.count));
                  const percentage = (item.count / maxCount) * 100;
                  return (
                    <div key={item._id} className="group">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">{item._id}</span>
                        <span className="text-lg font-bold text-blue-600">{item.count} users</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="mx-auto text-gray-300 mb-4" size={48} />
                <p className="text-gray-500">No user growth data available</p>
              </div>
            )}
          </div>

          {/* Message Volume Chart */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-green-100 p-3 rounded-xl">
                <MessageSquare className="text-green-600" size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Message Volume</h2>
                <p className="text-sm text-gray-500">Daily message activity</p>
              </div>
            </div>
            {analytics.messageVolume?.length > 0 ? (
              <div className="space-y-3">
                {analytics.messageVolume.map((item, index) => {
                  const maxCount = Math.max(...analytics.messageVolume.map(i => i.count));
                  const percentage = (item.count / maxCount) * 100;
                  return (
                    <div key={item._id} className="group">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">{item._id}</span>
                        <span className="text-lg font-bold text-green-600">{item.count} messages</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <MessageSquare className="mx-auto text-gray-300 mb-4" size={48} />
                <p className="text-gray-500">No message volume data available</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
