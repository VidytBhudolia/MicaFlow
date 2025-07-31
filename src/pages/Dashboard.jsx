import React from 'react';
import { Link } from 'react-router-dom';
import { Package, ShoppingCart, BarChart3, Users, Truck, FileText, Settings } from 'lucide-react';

const Dashboard = () => {
  const stats = [
    { label: 'Total Raw Materials', value: '156', change: '+12%', color: 'text-blue-600' },
    { label: 'Active Suppliers', value: '24', change: '+3%', color: 'text-green-600' },
    { label: 'Processing Orders', value: '8', change: '-2%', color: 'text-orange-600' },
    { label: 'Inventory Items', value: '342', change: '+18%', color: 'text-purple-600' },
  ];

  const quickActions = [
    { title: 'Raw Material Purchase', icon: ShoppingCart, path: '/raw-material-purchase', color: 'bg-blue-500' },
    { title: 'Daily Processing', icon: Package, path: '/daily-processing', color: 'bg-green-500' },
    { title: 'Material Deduction', icon: Truck, path: '/material-deduction', color: 'bg-purple-500' },
    { title: 'Order Sheet', icon: FileText, path: '/order-sheet', color: 'bg-orange-500' },
    { title: 'Inventory Analytics', icon: BarChart3, path: '/inventory-analytics', color: 'bg-red-500' },
    { title: 'Logs & Adjustments', icon: Settings, path: '/logs-adjustments', color: 'bg-gray-600' },
    { title: 'Supplier Management', icon: Users, path: '/supplier-management', color: 'bg-indigo-500' },
    { title: 'Inventory', icon: Package, path: '/inventory', color: 'bg-teal-500' },
    { title: 'Reports', icon: BarChart3, path: '/reports', color: 'bg-pink-500' },
    { title: 'Management', icon: Settings, path: '/management', color: 'bg-slate-600' },
  ];

  return (
    <div id="dashboard" className="">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary mb-2">MicaFlow Dashboard</h1>
        <p className="text-gray-600">Welcome to your mica factory management system</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`text-sm font-medium ${stat.color}`}>
                {stat.change}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-secondary mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {quickActions.map((action, index) => (
            <Link
              key={index}
              to={action.path}
              className="flex items-center p-4 rounded-lg border border-gray-200 hover:border-primary hover:shadow-md transition-all duration-200"
            >
              <div className={`${action.color} p-3 rounded-lg mr-4`}>
                <action.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{action.title}</h3>
                <p className="text-sm text-gray-500">Manage {action.title.toLowerCase()}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
