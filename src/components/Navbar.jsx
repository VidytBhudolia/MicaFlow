import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell, Database } from 'lucide-react';

const Navbar = () => {
  const location = useLocation();

  const navigationItems = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Raw Material Purchase', path: '/raw-material-purchase' },
    { name: 'Daily Processing', path: '/daily-processing' },
    { name: 'Daily Analytics', path: '/daily-analytics' },
    { name: 'Inventory', path: '/inventory' },
    { name: 'Reports', path: '/reports' },
    { name: 'Management', path: '/management' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
      <div className="w-full px-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo Section */}
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-8 h-8 bg-primary rounded">
                <Database className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-secondary">MicaFlow</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? 'bg-primary text-white'
                    : 'text-gray-700 hover:text-primary hover:bg-gray-100'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <button className="relative p-2 text-gray-600 hover:text-primary transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* User Avatar */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-600">U</span>
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-900">User Name</p>
                <p className="text-xs text-gray-500">Admin</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <div className="md:hidden">
        <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t">
          {navigationItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                isActive(item.path)
                  ? 'bg-primary text-white'
                  : 'text-gray-700 hover:text-primary hover:bg-gray-100'
              }`}
            >
              {item.name}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
