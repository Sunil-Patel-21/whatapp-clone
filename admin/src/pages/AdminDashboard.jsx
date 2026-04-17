import React, { useEffect, useState } from 'react';
import { getDashboardStats } from '../services/admin.service';
import { FaUsers, FaComments, FaUserCheck, FaExclamationTriangle, FaArrowUp, FaArrowDown, FaChartLine } from 'react-icons/fa';

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
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  const cards = [
    { 
      title: 'Total Users', 
      value: stats?.totalUsers, 
      icon: FaUsers, 
      gradient: 'from-blue-500 to-blue-600',
      bgLight: 'bg-blue-50',
      textColor: 'text-blue-600',
      change: '+12%',
      isPositive: true
    },
    { 
      title: 'Active Users', 
      value: stats?.activeUsers, 
      icon: FaUserCheck, 
      gradient: 'from-green-500 to-green-600',
      bgLight: 'bg-green-50',
      textColor: 'text-green-600',
      change: '+8%',
      isPositive: true
    },
    { 
      title: 'Total Messages', 
      value: stats?.totalMessages, 
      icon: FaComments, 
      gradient: 'from-purple-500 to-purple-600',
      bgLight: 'bg-purple-50',
      textColor: 'text-purple-600',
      change: '+23%',
      isPositive: true
    },
    { 
      title: 'Pending Reports', 
      value: stats?.pendingReports, 
      icon: FaExclamationTriangle, 
      gradient: 'from-red-500 to-red-600',
      bgLight: 'bg-red-50',
      textColor: 'text-red-600',
      change: '-5%',
      isPositive: false
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50">
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Dashboard Overview</h1>
          <p className="text-gray-600">Welcome back! Here's what's happening with your platform today.</p>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {cards.map((card, index) => (
            <div key={index} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`${card.bgLight} p-3 rounded-xl group-hover:scale-110 transition-transform duration-300`}>
                    <card.icon className={`w-6 h-6 ${card.textColor}`} />
                  </div>
                  <div className={`flex items-center gap-1 text-sm font-semibold ${
                    card.isPositive ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {card.isPositive ? <FaArrowUp className="w-3 h-3" /> : <FaArrowDown className="w-3 h-3" />}
                    {card.change}
                  </div>
                </div>
                <div>
                  <p className="text-gray-500 text-sm font-medium mb-1">{card.title}</p>
                  <p className="text-3xl font-bold text-gray-800">{card.value || 0}</p>
                </div>
              </div>
              <div className={`h-1 bg-gradient-to-r ${card.gradient}`}></div>
            </div>
          ))}
        </div>

        {/* Activity & Stats Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Today's Activity */}
          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-3 rounded-xl">
                <FaChartLine className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">Today's Activity</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-transparent rounded-xl">
                <span className="text-gray-600 font-medium">New Users</span>
                <span className="text-2xl font-bold text-orange-600">{stats?.todayUsers || 0}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-transparent rounded-xl">
                <span className="text-gray-600 font-medium">Messages Sent</span>
                <span className="text-2xl font-bold text-blue-600">{stats?.todayMessages || 0}</span>
              </div>
            </div>
          </div>

          {/* System Stats */}
          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-3 rounded-xl">
                <FaComments className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">System Stats</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-transparent rounded-xl">
                <span className="text-gray-600 font-medium">Total Conversations</span>
                <span className="text-2xl font-bold text-indigo-600">{stats?.totalConversations || 0}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-transparent rounded-xl">
                <span className="text-gray-600 font-medium">Active Statuses</span>
                <span className="text-2xl font-bold text-purple-600">{stats?.totalStatuses || 0}</span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-lg p-6 text-white hover:shadow-xl transition-shadow duration-300">
            <h2 className="text-xl font-bold mb-6">Quick Overview</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-white/10 backdrop-blur-sm rounded-xl">
                <span className="font-medium">User Growth</span>
                <span className="text-xl font-bold">+{stats?.todayUsers || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/10 backdrop-blur-sm rounded-xl">
                <span className="font-medium">Engagement Rate</span>
                <span className="text-xl font-bold">87%</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/10 backdrop-blur-sm rounded-xl">
                <span className="font-medium">Response Time</span>
                <span className="text-xl font-bold">2.3s</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
