import React, { useEffect, useState } from 'react';
import { getDashboardStats } from '../../services/admin.service';
import { FaUsers, FaComments, FaUserCheck, FaExclamationTriangle } from 'react-icons/fa';

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const result = await getDashboardStats();
      setStats(result.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  const cards = [
    { title: 'Total Users', value: stats?.totalUsers, icon: FaUsers, color: 'bg-blue-500' },
    { title: 'Active Users', value: stats?.activeUsers, icon: FaUserCheck, color: 'bg-green-500' },
    { title: 'Total Messages', value: stats?.totalMessages, icon: FaComments, color: 'bg-purple-500' },
    { title: 'Pending Reports', value: stats?.pendingReports, icon: FaExclamationTriangle, color: 'bg-red-500' }
  ];

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-8 text-black">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {cards.map((card, index) => (
          <div key={index} className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">{card.title}</p>
                <p className="text-3xl font-bold mt-2 text-black">{card.value || 0}</p>
              </div>
              <div className={`${card.color} p-4 rounded-full`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-black">Today's Activity</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">New Users</span>
              <span className="font-semibold text-black">{stats?.todayUsers || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Messages Sent</span>
              <span className="font-semibold text-black">{stats?.todayMessages || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-black">System Stats</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Conversations</span>
              <span className="font-semibold text-black">{stats?.totalConversations || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Active Statuses</span>
              <span className="font-semibold text-black">{stats?.totalStatuses || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
