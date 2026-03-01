import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import useAdminStore from '../../store/useAdminStore';
import { FaHome, FaUsers, FaFlag, FaChartBar, FaSignOutAlt } from 'react-icons/fa';

function AdminLayout() {
  const { clearAdmin } = useAdminStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAdmin();
    navigate('/admin/login');
  };

  const menuItems = [
    { path: '/admin/dashboard', icon: FaHome, label: 'Dashboard' },
    { path: '/admin/users', icon: FaUsers, label: 'Users' },
    { path: '/admin/reports', icon: FaFlag, label: 'Reports' },
    { path: '/admin/analytics', icon: FaChartBar, label: 'Analytics' }
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-gray-800 text-white">
        <div className="p-6">
          <h1 className="text-2xl font-bold">Admin Panel</h1>
        </div>
        <nav className="mt-6">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="flex items-center gap-3 px-6 py-3 hover:bg-gray-700 transition"
            >
              <item.icon />
              <span>{item.label}</span>
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-6 py-3 hover:bg-gray-700 transition w-full text-left mt-4"
          >
            <FaSignOutAlt />
            <span>Logout</span>
          </button>
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;
