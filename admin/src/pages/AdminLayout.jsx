import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import useAdminStore from '../store/useAdminStore';
import { FaHome, FaUsers, FaFlag, FaChartBar, FaSignOutAlt, FaWhatsapp } from 'react-icons/fa';

function AdminLayout() {
  const { clearAdmin } = useAdminStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    clearAdmin();
    navigate('/login');
  };

  const menuItems = [
    { path: '/dashboard', icon: FaHome, label: 'Dashboard' },
    { path: '/users', icon: FaUsers, label: 'Users' },
    { path: '/reports', icon: FaFlag, label: 'Reports' },
    { path: '/analytics', icon: FaChartBar, label: 'Analytics' }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-72 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white shadow-2xl">
        {/* Logo Section */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-green-400 to-green-600 p-3 rounded-xl shadow-lg">
              <FaWhatsapp className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">Admin Panel</h1>
              <p className="text-xs text-gray-400">WhatsApp Clone</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-4">
          <div className="space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group ${
                  isActive(item.path)
                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 shadow-lg shadow-blue-500/50 scale-105'
                    : 'hover:bg-gray-700/50 hover:translate-x-1'
                }`}
              >
                <item.icon className={`w-5 h-5 transition-transform duration-300 ${
                  isActive(item.path) ? 'scale-110' : 'group-hover:scale-110'
                }`} />
                <span className="font-medium">{item.label}</span>
                {isActive(item.path) && (
                  <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse"></div>
                )}
              </Link>
            ))}
          </div>
        </nav>

        {/* Logout Button */}
        <div className="absolute bottom-0 left-0 w-72 p-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="flex items-center gap-4 px-4 py-3 rounded-xl w-full text-left hover:bg-red-600/20 transition-all duration-300 group border border-transparent hover:border-red-500/50"
          >
            <FaSignOutAlt className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;
