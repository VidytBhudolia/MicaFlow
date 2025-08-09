import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell, Database } from 'lucide-react';

const Navbar = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = () => setMobileOpen(false);
  const toggleMobile = () => setMobileOpen((o) => !o);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') closeMobile();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    // close drawer on route change
    closeMobile();
  }, [location.pathname]);

  const navigationItems = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Inventory', path: '/inventory' },
    { name: 'Raw Purchase', path: '/raw-material-purchase' },
    { name: 'Daily Processing', path: '/daily-processing' },
    { name: 'Daily Analytics', path: '/daily-analytics' },
    { name: 'Order Sheet', path: '/order-sheet' },
    { name: 'Management', path: '/management' },
    { name: 'Reports', path: '/reports' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
      <div className="w-full px-4 sm:px-6">
        <div className="flex justify-between items-center h-16">
          {/* Left: Hamburger + Logo */}
          <div className="flex items-center gap-3">
            <button
              className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-md text-gray-600 hover:text-primary hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Open menu"
              onClick={toggleMobile}
            >
              <span className="sr-only">Open main menu</span>
              {/* Hamburger icon */}
              <div className="space-y-1">
                <span
                  className={`block h-0.5 w-6 bg-current transition-transform ${
                    mobileOpen ? 'translate-y-1.5 rotate-45' : ''
                  }`}
                ></span>
                <span
                  className={`block h-0.5 w-6 bg-current transition-opacity ${
                    mobileOpen ? 'opacity-0' : 'opacity-100'
                  }`}
                ></span>
                <span
                  className={`block h-0.5 w-6 bg-current transition-transform ${
                    mobileOpen ? '-translate-y-1.5 -rotate-45' : ''
                  }`}
                ></span>
              </div>
            </button>
            <Link to="/dashboard" className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-8 h-8 bg-primary rounded">
                <Database className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-secondary hidden xs:inline">
                MicaFlow
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
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
            <button className="relative p-2 text-gray-600 hover:text-primary transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="hidden sm:flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-600">U</span>
              </div>
              <div className="hidden lg:block">
                <p className="text-sm font-medium text-gray-900">User Name</p>
                <p className="text-xs text-gray-500">Admin</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Backdrop */}
      {mobileOpen && (
        <button
          aria-label="Close menu backdrop"
          onClick={closeMobile}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm md:hidden z-40"
        />
      )}

      {/* Off-canvas mobile sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-white shadow-lg border-r border-gray-200 md:hidden transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-hidden={!mobileOpen}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <span className="font-semibold text-primary">Menu</span>
          <button
            onClick={closeMobile}
            aria-label="Close menu"
            className="p-2 rounded-md hover:bg-gray-100 text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            ✕
          </button>
        </div>
        <nav className="px-3 py-4 space-y-1 overflow-y-auto h-[calc(100%-4rem)]">
          {navigationItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive(item.path)
                  ? 'bg-primary text-white shadow'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-primary'
              }`}
            >
              {item.name}
            </Link>
          ))}
          <div className="pt-4 border-t border-gray-200 mt-4 text-xs text-gray-500 px-4">
            © {new Date().getFullYear()} MicaFlow
          </div>
        </nav>
      </div>
    </nav>
  );
};

export default Navbar;
