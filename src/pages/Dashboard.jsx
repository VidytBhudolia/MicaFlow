import React from 'react';
import { Package, Users, TrendingUp, ShoppingCart } from 'lucide-react';

const Dashboard = () => {
  const stats = [
    {
      title: 'Total Inventory',
      value: '2,847 kg',
      icon: Package,
      color: 'text-primary-orange',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Active Suppliers',
      value: '24',
      icon: Users,
      color: 'text-secondary-blue',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Monthly Production',
      value: '1,256 kg',
      icon: TrendingUp,
      color: 'text-tertiary-gold',
      bgColor: 'bg-yellow-50',
    },
    {
      title: 'Pending Orders',
      value: '18',
      icon: ShoppingCart,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
  ];

  return (
    <div className="content-wrapper-mica">
      <div className="flex flex-col max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-wrap justify-between items-center gap-3 mb-8">
          <h1 className="text-heading text-4xl font-bold leading-tight">
            Dashboard
          </h1>
          <p className="text-secondary-text text-lg">
            Welcome to MicaFlow - Your Inventory Management System
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div key={index} className="card-mica">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-secondary-text text-sm font-medium mb-1">
                      {stat.title}
                    </p>
                    <p className="text-heading text-2xl font-bold">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                    <IconComponent className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activity */}
          <div className="card-mica">
            <h2 className="text-heading text-xl font-semibold mb-4">
              Recent Activity
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-light-gray-bg rounded-lg">
                <div className="w-2 h-2 bg-primary-orange rounded-full"></div>
                <div>
                  <p className="text-body-text text-sm font-medium">
                    New supplier "Premium Raw Materials" added
                  </p>
                  <p className="text-secondary-text text-xs">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-light-gray-bg rounded-lg">
                <div className="w-2 h-2 bg-tertiary-gold rounded-full"></div>
                <div>
                  <p className="text-body-text text-sm font-medium">
                    Production batch #P2025-001 completed
                  </p>
                  <p className="text-secondary-text text-xs">4 hours ago</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-light-gray-bg rounded-lg">
                <div className="w-2 h-2 bg-secondary-blue rounded-full"></div>
                <div>
                  <p className="text-body-text text-sm font-medium">
                    Order #ORD-2025-0156 shipped
                  </p>
                  <p className="text-secondary-text text-xs">6 hours ago</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card-mica">
            <h2 className="text-heading text-xl font-semibold mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <button className="flex flex-col items-center justify-center p-4 border-2 border-light-border rounded-xl hover:border-primary-orange hover:bg-orange-50 transition-colors group">
                <Package className="w-8 h-8 text-primary-orange mb-2" />
                <span className="text-body-text text-sm font-medium group-hover:text-primary-orange">
                  Add Inventory
                </span>
              </button>
              <button className="flex flex-col items-center justify-center p-4 border-2 border-light-border rounded-xl hover:border-secondary-blue hover:bg-blue-50 transition-colors group">
                <Users className="w-8 h-8 text-secondary-blue mb-2" />
                <span className="text-body-text text-sm font-medium group-hover:text-secondary-blue">
                  Manage Suppliers
                </span>
              </button>
              <button className="flex flex-col items-center justify-center p-4 border-2 border-light-border rounded-xl hover:border-tertiary-gold hover:bg-yellow-50 transition-colors group">
                <TrendingUp className="w-8 h-8 text-tertiary-gold mb-2" />
                <span className="text-body-text text-sm font-medium group-hover:text-tertiary-gold">
                  View Analytics
                </span>
              </button>
              <button className="flex flex-col items-center justify-center p-4 border-2 border-light-border rounded-xl hover:border-green-600 hover:bg-green-50 transition-colors group">
                <ShoppingCart className="w-8 h-8 text-green-600 mb-2" />
                <span className="text-body-text text-sm font-medium group-hover:text-green-600">
                  Process Orders
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
