import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search } from 'lucide-react';

const SupplierManagement = () => {
  const [suppliers, setSuppliers] = useState([
    // Sample data for demonstration
    {
      id: 1,
      name: 'Mica Industries Ltd',
      contact: '+91-9876543210',
      email: 'contact@micaindustries.com',
      address: '123 Industrial Area, Jharkhand',
      materialType: 'Raw Mica',
      status: 'active'
    },
    {
      id: 2,
      name: 'Premium Mica Co.',
      contact: '+91-9876543211',
      email: 'info@premiummica.com',
      address: '456 Mining District, Rajasthan',
      materialType: 'Mica Sheets',
      status: 'active'
    }
  ]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    email: '',
    address: '',
    materialType: '',
    defaultUnit: 'kg',
    status: 'active'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSupplier) {
        // Update supplier
        setSuppliers(prev => prev.map(supplier => 
          supplier.id === editingSupplier.id 
            ? { ...formData, id: editingSupplier.id }
            : supplier
        ));
      } else {
        // Add new supplier
        const newSupplier = {
          ...formData,
          id: Date.now() // Simple ID generation for demo
        };
        setSuppliers(prev => [...prev, newSupplier]);
      }
      resetForm();
    } catch (error) {
      console.error('Error saving supplier:', error);
    }
  };

  const handleEdit = (supplier) => {
    setEditingSupplier(supplier);
    setFormData(supplier);
    setIsFormOpen(true);
  };

  const handleDelete = async (supplierId) => {
    if (window.confirm('Are you sure you want to delete this supplier?')) {
      try {
        setSuppliers(prev => prev.filter(supplier => supplier.id !== supplierId));
      } catch (error) {
        console.error('Error deleting supplier:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      contact: '',
      email: '',
      address: '',
      materialType: '',
      defaultUnit: 'kg',
      status: 'active'
    });
    setEditingSupplier(null);
    setIsFormOpen(false);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.materialType?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div id="supplier-management" className="w-full bg-light-gray-bg min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-secondary-blue mb-2">Supplier Management</h1>
          <p className="text-body">Manage your mica suppliers and their information</p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="btn-primary-mica flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Supplier</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white-bg rounded-lg shadow-md p-6 mb-6 border border-light-gray-border">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-body w-4 h-4" />
          <input
            type="text"
            placeholder="Search suppliers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-light-gray-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-orange focus:border-transparent bg-white-bg text-secondary-blue"
          />
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="bg-white-bg rounded-lg shadow-md overflow-hidden border border-light-gray-border">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-light-gray-bg">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-body uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-body uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-body uppercase tracking-wider">Material Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-body uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-body uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white-bg divide-y divide-light-gray-border">
                  {filteredSuppliers.map((supplier) => (
                    <tr key={supplier.id || Math.random()}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-secondary-blue">{supplier.name}</div>
                          <div className="text-sm text-body">{supplier.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-blue">{supplier.contact}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-blue">{supplier.materialType}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          supplier.status === 'active' 
                            ? 'bg-green-100 text-green-600' 
                            : 'bg-red-100 text-red-600'
                        }`}>
                          {supplier.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleEdit(supplier)}
                          className="text-secondary-blue hover:text-primary-orange mr-4"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(supplier.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add/Edit Supplier Modal */}
          {isFormOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white-bg rounded-lg p-6 w-full max-w-md border border-light-gray-border">
                <h2 className="text-xl font-semibold text-secondary-blue mb-4">
                  {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-blue mb-2">
                      Supplier Name
                    </label>
                    <input
                      type="text"
                      className="form-input-mica"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-blue mb-2">
                      Contact Number
                    </label>
                    <input
                      type="tel"
                      className="form-input-mica"
                      value={formData.contact}
                      onChange={(e) => handleInputChange('contact', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-blue mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      className="form-input-mica"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-blue mb-2">
                      Address
                    </label>
                    <textarea
                      className="form-textarea-mica"
                      rows={3}
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-blue mb-2">
                      Material Type
                    </label>
                    <select
                      className="form-select-mica"
                      value={formData.materialType}
                      onChange={(e) => handleInputChange('materialType', e.target.value)}
                      required
                    >
                      <option value="">Select Material Type</option>
                      <option value="Raw Mica">Raw Mica</option>
                      <option value="Mica Sheets">Mica Sheets</option>
                      <option value="Mica Powder">Mica Powder</option>
                      <option value="Mica Flakes">Mica Flakes</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-blue mb-2">
                      Default Unit
                    </label>
                    <select
                      className="form-select-mica"
                      value={formData.defaultUnit}
                      onChange={(e) => handleInputChange('defaultUnit', e.target.value)}
                      required
                    >
                      <option value="kg">kg</option>
                      <option value="50kg">50kg</option>
                      <option value="tonne">tonne</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-blue mb-2">
                      Status
                    </label>
                    <select
                      className="form-select-mica"
                      value={formData.status}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <div className="flex space-x-3 pt-4">
                    <button type="submit" className="btn-primary-mica flex-1">
                      {editingSupplier ? 'Update' : 'Add'} Supplier
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="btn-secondary-mica flex-1"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
    </div>
  );
};

export default SupplierManagement;
