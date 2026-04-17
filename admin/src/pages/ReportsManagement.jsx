import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Search, Eye, CheckCircle, XCircle, Ban, AlertTriangle, Clock, CheckSquare } from "lucide-react";
import { getReports, resolveReport } from '../services/admin.service';

const ReportsManagement = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({ total: 0, pending: 0, resolved: 0 });

  useEffect(() => {
    fetchReports();
  }, [statusFilter]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await getReports(statusFilter === 'all' ? '' : statusFilter);
      const reportsData = response.data?.reports || [];
      setReports(reportsData);
      
      const total = reportsData.length;
      const pending = reportsData.filter(r => r.status === 'pending').length;
      const resolved = reportsData.filter(r => r.status === 'resolved').length;
      setStats({ total, pending, resolved });
    } catch (error) {
      toast.error('Failed to fetch reports');
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (reportId, action) => {
    try {
      await resolveReport(reportId, action, action);
      toast.success(`Report ${action}`);
      fetchReports();
    } catch (error) {
      toast.error('Failed to resolve report');
    }
  };

  const filteredReports = (reports || []).filter(report => {
    const searchLower = searchTerm.toLowerCase();
    return (
      report.reportedUser?.username?.toLowerCase().includes(searchLower) ||
      report.reportedBy?.username?.toLowerCase().includes(searchLower) ||
      report.reason?.toLowerCase().includes(searchLower)
    );
  });

  const getStatusBadge = (status) => {
    const styles = {
      pending: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', icon: Clock },
      resolved: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', icon: CheckSquare },
      dismissed: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', icon: XCircle }
    };
    return styles[status] || styles.pending;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Reports Management</h1>
        <p className="text-gray-600">Monitor and manage user reports</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-50 p-3 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <AlertTriangle className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">Total Reports</p>
              <p className="text-3xl font-bold text-gray-800">{stats.total}</p>
            </div>
          </div>
          <div className="h-1 bg-gradient-to-r from-blue-500 to-blue-600"></div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-yellow-50 p-3 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">Pending</p>
              <p className="text-3xl font-bold text-gray-800">{stats.pending}</p>
            </div>
          </div>
          <div className="h-1 bg-gradient-to-r from-yellow-500 to-yellow-600"></div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-50 p-3 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <CheckSquare className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">Resolved</p>
              <p className="text-3xl font-bold text-gray-800">{stats.resolved}</p>
            </div>
          </div>
          <div className="h-1 bg-gradient-to-r from-green-500 to-green-600"></div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by username or reason..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 text-gray-800 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 outline-none"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-6 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 font-medium bg-white cursor-pointer transition-all duration-300 outline-none"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Loading Reports...</p>
            </div>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="text-center py-20">
            <AlertTriangle className="mx-auto text-gray-300 mb-4" size={64} />
            <p className="text-gray-500 text-lg font-medium">No reports found</p>
            <p className="text-gray-400 text-sm mt-2">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Reporter</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Reported User</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Reason</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredReports.map((report) => {
                  const statusStyle = getStatusBadge(report.status);
                  const StatusIcon = statusStyle.icon;
                  return (
                    <tr key={report._id} className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={report.reportedBy?.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${report.reportedBy?._id}`}
                            alt=""
                            className="w-10 h-10 rounded-full ring-2 ring-gray-200 object-cover"
                          />
                          <div>
                            <p className="font-semibold text-gray-800">{report.reportedBy?.username || 'Unknown'}</p>
                            <p className="text-xs text-gray-500">{report.reportedBy?.email || 'N/A'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={report.reportedUser?.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${report.reportedUser?._id}`}
                            alt=""
                            className="w-10 h-10 rounded-full ring-2 ring-red-200 object-cover"
                          />
                          <div>
                            <p className="font-semibold text-gray-800">{report.reportedUser?.username || 'Unknown'}</p>
                            <p className="text-xs text-gray-500">{report.reportedUser?.email || 'N/A'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          <p className="text-sm font-semibold text-gray-800 mb-1">{report.reason}</p>
                          {report.description && (
                            <p className="text-xs text-gray-500 line-clamp-2">{report.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-full border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                          <StatusIcon size={14} />
                          {report.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-700">
                          {new Date(report.createdAt).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(report.createdAt).toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        {report.status === 'pending' ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleResolve(report._id, 'resolved')}
                              className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-all duration-300 hover:scale-110"
                              title="Resolve"
                            >
                              <CheckCircle size={18} />
                            </button>
                            <button
                              onClick={() => handleResolve(report._id, 'dismissed')}
                              className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-all duration-300 hover:scale-110"
                              title="Dismiss"
                            >
                              <XCircle size={18} />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">No actions</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsManagement;
