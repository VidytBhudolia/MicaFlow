import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell, Database } from 'lucide-react';

const Header = () => {
  const location = useLocation();

  const navItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Inventory', path: '/inventory' },
    { label: 'Production', path: '/production' },
    { label: 'Orders', path: '/orders' },
    { label: 'Suppliers', path: '/suppliers' },
    { label: 'Analytics', path: '/analytics' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <header className="flex items-center justify-between whitespace-nowrap border-b border-light-border bg-white-bg px-10 py-3 shadow-sm">
      {/* Logo and Brand */}
      <div className="flex items-center gap-4 text-secondary-blue">
        <div className="w-8 h-8">
          <Database className="w-full h-full" />
        </div>
        <h2 className="text-secondary-blue text-lg font-bold leading-tight tracking-[-0.015em]">
          MicaFlow
        </h2>
      </div>

      {/* Navigation and Profile */}
      <div className="flex flex-1 justify-end gap-8">
        {/* Navigation Links */}
        <nav className="flex items-center gap-9">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`text-sm font-medium leading-normal transition-colors ${
                isActive(item.path)
                  ? 'text-primary-orange font-semibold'
                  : 'text-secondary-blue hover:text-primary-orange'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Notifications and Profile */}
        <div className="flex items-center gap-4">
          {/* Notification Button */}
          <button className="flex items-center justify-center w-10 h-10 rounded-full bg-light-gray-bg text-secondary-blue hover:bg-tertiary-gold hover:text-white transition-colors duration-200">
            <Bell className="w-5 h-5" />
          </button>

          {/* Profile Avatar */}
          <div
            className="bg-center bg-no-repeat aspect-square bg-cover rounded-full w-10 h-10 border-2 border-light-border hover:border-primary-orange transition-colors cursor-pointer"
            style={{
              backgroundImage: `url("https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80")`,
            }}
            title="User Profile"
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
