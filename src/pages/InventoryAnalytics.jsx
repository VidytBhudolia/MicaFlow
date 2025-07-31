import React, { useState } from 'react';
import { TrendingUp, Package, AlertTriangle, DollarSign, BarChart3, PieChart, Activity } from 'lucide-react';

const InventoryAnalytics = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('7days');

  // Sample data - replace with Firebase data
  const dashboardData = {
    totalStock: 1250.5,
    totalValue: 875000,
    lowStockItems: 8,
    monthlyTurnover: 125000
  };

  const stockLevels = [
    { material: 'Raw Mica', current: 450, minimum: 300, status: 'good' },
    { material: 'Mica Sheets', current: 280, minimum: 250, status: 'good' },
    { material: 'Mica Powder', current: 120, minimum: 150, status: 'low' },
    { material: 'Mica Flakes', current: 80, minimum: 100, status: 'low' }
  ];

  const topProducts = [
    { name: 'Mica Sheets - Medium', sold: 450, revenue: 225000 },
    { name: 'Mica Powder - Fine', sold: 320, revenue: 180000 },
    { name: 'Raw Mica Grade A', sold: 280, revenue: 165000 },
    { name: 'Mica Flakes - Large', sold: 150, revenue: 95000 }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'good': return 'text-green-600 bg-green-100';
      case 'low': return 'text-orange-600 bg-orange-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-full ${color.replace('text', 'bg').replace('600', '100')}`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </div>
  );

  return (
    <div id="inventory-analytics" className="">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-secondary mb-2">Inventory Analytics</h1>
            <p className="text-gray-600">Monitor stock levels, trends, and performance metrics</p>
          </div>
        </div>
            
        <div>
          <label htmlFor="period" className="block text-sm font-medium text-gray-700 mb-1">
            Period
          </label>
          <select
            id="period"
            className="form-select"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
            <option value="1year">Last Year</option>
          </select>
        </div>
      </div>

      {/* Dashboard Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Stock"
              value={`${dashboardData.totalStock} kg`}
              icon={Package}
              color="text-blue-600"
              subtitle="Across all materials"
            />
            <StatCard
              title="Stock Value"
              value={`₹${(dashboardData.totalValue / 100000).toFixed(1)}L`}
              icon={DollarSign}
              color="text-green-600"
              subtitle="Current inventory worth"
            />
            <StatCard
              title="Low Stock Items"
              value={dashboardData.lowStockItems}
              icon={AlertTriangle}
              color="text-orange-600"
              subtitle="Items below minimum"
            />
            <StatCard
              title="Monthly Turnover"
              value={`₹${(dashboardData.monthlyTurnover / 100000).toFixed(1)}L`}
              icon={TrendingUp}
              color="text-purple-600"
              subtitle="Revenue this month"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Stock Levels Chart */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold text-secondary">Stock Levels</h3>
              </div>
              
              <div className="space-y-4">
                {stockLevels.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">{item.material}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">{item.current} kg</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full ${
                          item.status === 'good' ? 'bg-green-500' : 
                          item.status === 'low' ? 'bg-orange-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.max((item.current / (item.minimum * 2)) * 100, 10)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Min: {item.minimum} kg</span>
                      <span>Max: {item.minimum * 2} kg</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Products */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold text-secondary">Top Selling Products</h3>
              </div>
              
              <div className="space-y-4">
                {topProducts.map((product, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-800">{product.name}</p>
                      <p className="text-sm text-gray-600">{product.sold} kg sold</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">₹{(product.revenue / 1000).toFixed(0)}K</p>
                      <p className="text-xs text-gray-500">Revenue</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Charts Placeholders */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Monthly Trends */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold text-secondary">Monthly Trends</h3>
              </div>
              
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>Stock Level Trends Chart</p>
                  <p className="text-sm">Chart component to be integrated</p>
                </div>
              </div>
            </div>

            {/* Category Distribution */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center gap-2 mb-4">
                <PieChart className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold text-secondary">Category Distribution</h3>
              </div>
              
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <PieChart className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>Stock Distribution Chart</p>
                  <p className="text-sm">Pie chart component to be integrated</p>
                </div>
              </div>
            </div>
          </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-secondary mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="btn-primary flex items-center justify-center gap-2">
              <Package className="w-4 h-4" />
              Stock Report
            </button>
            <button className="btn-secondary flex items-center justify-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Low Stock Alert
            </button>
            <button className="btn-secondary flex items-center justify-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Export Analytics
            </button>
          </div>
        </div>
    </div>
  );
};

export default InventoryAnalytics;
