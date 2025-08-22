import React, { useState } from 'react';
import { FileText, Plus, Filter, Search, Calendar, Edit, Trash2 } from 'lucide-react';
import InlineSpinner from '../components/InlineSpinner';

const LogsAdjustments = () => {
  const [activeTab, setActiveTab] = useState('logs');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdjustmentForm, setShowAdjustmentForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [adjustmentForm, setAdjustmentForm] = useState({
    materialType: '',
    adjustmentType: 'increase',
    quantity: '',
    unit: 'kg',
    reason: '',
    notes: ''
  });

  // Sample logs data - replace with Firebase data
  const logs = [
    {
      id: 1,
      timestamp: '2024-01-15 14:30:25',
      action: 'Raw Material Purchase',
      user: 'Admin User',
      details: 'Added 500 kg Raw Mica from ABC Suppliers',
      status: 'completed'
    },
    {
      id: 2,
      timestamp: '2024-01-15 12:15:10',
      action: 'Daily Processing',
      user: 'Production Manager',
      details: 'Processed 200 kg Raw Mica to Mica Sheets',
      status: 'completed'
    },
    {
      id: 3,
      timestamp: '2024-01-15 10:45:33',
      action: 'Material Deduction',
      user: 'Warehouse Manager',
      details: 'Deducted 150 kg Mica Sheets for Order #ORD-001',
      status: 'completed'
    },
    {
      id: 4,
      timestamp: '2024-01-15 09:20:18',
      action: 'Stock Adjustment',
      user: 'Admin User',
      details: 'Adjusted Mica Powder stock -10 kg (Damage)',
      status: 'completed'
    },
    {
      id: 5,
      timestamp: '2024-01-14 16:55:42',
      action: 'Order Creation',
      user: 'Sales Manager',
      details: 'Created order #ORD-001 for XYZ Industries',
      status: 'pending'
    }
  ];

  const adjustmentReasons = [
    'Physical Count Correction',
    'Damage/Spoilage',
    'Quality Issues',
    'Theft/Loss',
    'System Error Correction',
    'Other'
  ];

  const materialTypes = [
    'Raw Mica',
    'Mica Sheets',
    'Mica Powder',
    'Mica Flakes'
  ];

  const filteredLogs = logs.filter(log => {
    const matchesStatus = filterStatus === 'all' || log.status === filterStatus;
    const matchesSearch = log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.user.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleAdjustmentSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      console.log('Stock Adjustment:', adjustmentForm);
      // TODO: Integrate with Firebase
      try { alert('Stock adjustment recorded successfully!'); } catch {}
      setAdjustmentForm({
        materialType: '',
        adjustmentType: 'increase',
        quantity: '',
        unit: 'kg',
        reason: '',
        notes: ''
      });
      setShowAdjustmentForm(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div id="logs-adjustments" className="">
      <div className="flex items-center gap-3 mb-6">
        <FileText className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-secondary mb-2">Logs & Adjustments</h1>
          <p className="text-gray-600">Monitor system activities and manage stock adjustments</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md">
            <div className="border-b border-gray-200">
              <nav className="flex">
                <button
                  onClick={() => setActiveTab('logs')}
                  className={`px-6 py-4 text-sm font-medium border-b-2 ${
                    activeTab === 'logs'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Activity Logs
                </button>
                <button
                  onClick={() => setActiveTab('adjustments')}
                  className={`px-6 py-4 text-sm font-medium border-b-2 ${
                    activeTab === 'adjustments'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Stock Adjustments
                </button>
              </nav>
            </div>

            <div className="p-6">
              {activeTab === 'logs' && (
                <div className="space-y-6">
                  {/* Filters */}
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        placeholder="Search logs..."
                        className="form-input pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <select
                        className="form-select"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                      >
                        <option value="all">All Status</option>
                        <option value="completed">Completed</option>
                        <option value="pending">Pending</option>
                        <option value="failed">Failed</option>
                      </select>
                      <button className="btn-secondary flex items-center gap-2">
                        <Filter className="w-4 h-4" />
                        Filter
                      </button>
                    </div>
                  </div>

                  {/* Logs Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Timestamp</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Action</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">User</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Details</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredLogs.map((log) => (
                          <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4 text-sm text-gray-600">
                              {log.timestamp}
                            </td>
                            <td className="py-3 px-4 text-sm font-medium text-gray-800">
                              {log.action}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600">
                              {log.user}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600">
                              {log.details}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusBadge(log.status)}`}>
                                {log.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'adjustments' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-secondary">Stock Adjustments</h3>
                    <button
                      onClick={() => setShowAdjustmentForm(true)}
                      className="btn-primary flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      New Adjustment
                    </button>
                  </div>

                  {showAdjustmentForm && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                      <h4 className="font-semibold mb-4">Create Stock Adjustment</h4>
                      <form onSubmit={handleAdjustmentSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Material Type
                            </label>
                            <select
                              className="form-select"
                              value={adjustmentForm.materialType}
                              onChange={(e) => setAdjustmentForm({...adjustmentForm, materialType: e.target.value})}
                              required
                            >
                              <option value="">Select Material</option>
                              {materialTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Adjustment Type
                            </label>
                            <select
                              className="form-select"
                              value={adjustmentForm.adjustmentType}
                              onChange={(e) => setAdjustmentForm({...adjustmentForm, adjustmentType: e.target.value})}
                            >
                              <option value="increase">Increase Stock</option>
                              <option value="decrease">Decrease Stock</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Quantity
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="number"
                                className="form-input flex-1"
                                placeholder="0.00"
                                step="0.01"
                                min="0"
                                value={adjustmentForm.quantity}
                                onChange={(e) => setAdjustmentForm({...adjustmentForm, quantity: e.target.value})}
                                required
                              />
                              <select
                                className="form-select w-20"
                                value={adjustmentForm.unit}
                                onChange={(e) => setAdjustmentForm({...adjustmentForm, unit: e.target.value})}
                              >
                                <option value="kg">kg</option>
                                <option value="ton">ton</option>
                                <option value="pcs">pcs</option>
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Reason
                            </label>
                            <select
                              className="form-select"
                              value={adjustmentForm.reason}
                              onChange={(e) => setAdjustmentForm({...adjustmentForm, reason: e.target.value})}
                              required
                            >
                              <option value="">Select Reason</option>
                              {adjustmentReasons.map(reason => (
                                <option key={reason} value={reason}>{reason}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Notes
                          </label>
                          <textarea
                            className="form-textarea"
                            rows={3}
                            placeholder="Additional notes about this adjustment..."
                            value={adjustmentForm.notes}
                            onChange={(e) => setAdjustmentForm({...adjustmentForm, notes: e.target.value})}
                          />
                        </div>

                        <div className="flex gap-3">
                          <button type="submit" disabled={isSubmitting} className={`btn-primary flex items-center gap-2 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}>
                            {isSubmitting && <InlineSpinner size={16} />}
                            {isSubmitting ? 'Saving...' : 'Submit Adjustment'}
                          </button>
                          <button 
                            type="button" 
                            onClick={() => { if (!isSubmitting) setShowAdjustmentForm(false); }}
                            className="btn-secondary"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Recent Adjustments */}
                  <div className="bg-white rounded-lg border border-gray-200">
                    <div className="p-4 border-b border-gray-200">
                      <h4 className="font-semibold text-gray-800">Recent Adjustments</h4>
                    </div>
                    <div className="divide-y divide-gray-200">
                      {[1, 2, 3].map((item) => (
                        <div key={item} className="p-4 flex justify-between items-center">
                          <div>
                            <h5 className="font-medium text-gray-800">Mica Powder - Decrease</h5>
                            <p className="text-sm text-gray-600">-5 kg • Physical Count Correction</p>
                            <p className="text-xs text-gray-500">2024-01-15 10:30 AM by Admin User</p>
                          </div>
                          <div className="flex gap-2">
                            <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
    </div>
  );
};

export default LogsAdjustments;
