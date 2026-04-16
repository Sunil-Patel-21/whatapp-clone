import { useState, useEffect } from 'react';

import { toast } from 'react-toastify';
import { Search, Eye, CheckCircle, XCircle, Ban } from "lucide-react";
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
      pending: 'bg-yellow-100 text-yellow-800',
      resolved: 'bg-green-100 text-green-800',
      dismissed: 'bg-gray-100 text-gray-800'
    };
    return styles[status] || styles.pending;
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-black">Reports Management</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-gray-600 text-sm">Total Reports</p>
          <p className="text-2xl font-bold text-black">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-gray-600 text-sm">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-gray-600 text-sm">Resolved</p>
          <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : filteredReports.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No reports found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reporter</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reported User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredReports.map((report) => (
                  <tr key={report._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <img
                          src={report.reportedBy?.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${report.reportedBy?._id}`}
                          alt=""
                          className="w-8 h-8 rounded-full mr-3"
                        />
                        <span className="text-sm text-black">{report.reportedBy?.username || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <img
                          src={report.reportedUser?.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${report.reportedUser?._id}`}
                          alt=""
                          className="w-8 h-8 rounded-full mr-3"
                        />
                        <span className="text-sm text-black">{report.reportedUser?.username || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-black">{report.reason}</p>
                        {report.description && (
                          <p className="text-xs text-gray-500 mt-1">{report.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(report.status)}`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-black">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      {report.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleResolve(report._id, 'resolved')}
                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                            title="Resolve"
                          >
                            <CheckCircle size={18} />
                          </button>
                          <button
                            onClick={() => handleResolve(report._id, 'dismissed')}
                            className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                            title="Dismiss"
                          >
                            <XCircle size={18} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsManagement;
