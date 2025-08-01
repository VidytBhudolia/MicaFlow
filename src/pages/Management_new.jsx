import React, { useState } from 'react';
import { Settings, Plus, Edit, Trash2, Search, ChevronRight, ChevronDown } from 'lucide-react';

const Management = () => {
  const [activeTab, setActiveTab] = useState('suppliers');
  
  // Supplier Management State (from SupplierManagement.jsx)
  const [suppliers, setSuppliers] = useState([
    {
      id: 1,
      name: 'Mica Industries Ltd',
      contact: '+91-9876543210',
      email: 'contact@micaindustries.com',
      address: '123 Industrial Area, Jharkhand',
      materialType: 'Raw Mica',
      defaultUnit: 'kg',
      status: 'active'
    },
    {
      id: 2,
      name: 'Premium Mica Co.',
      contact: '+91-9876543211',
      email: 'info@premiummica.com',
      address: '456 Mining District, Rajasthan',
      materialType: 'Mica Sheets',
      defaultUnit: '50kg',
      status: 'active'
    }
  ]);
  const [isSupplierFormOpen, setIsSupplierFormOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [supplierSearchTerm, setSupplierSearchTerm] = useState('');
  const [supplierFormData, setSupplierFormData] = useState({
    name: '',
    contact: '',
    email: '',
    address: '',
    materialType: '',
    defaultUnit: 'kg',
    status: 'active'
  });

  // Categories Management State
  const [categories, setCategories] = useState([
    { 
      id: 1, 
      name: 'Mica Sheets', 
      subProducts: [
        { id: 11, name: '12+ Mesh', defaultBagWeight: 50, defaultUnit: '50kg' },
        { id: 12, name: '16+ Mesh', defaultBagWeight: 50, defaultUnit: '50kg' }
      ]
    },
    { 
      id: 2, 
      name: 'Mica Powder', 
      subProducts: [
        { id: 21, name: 'Fine Powder', defaultBagWeight: 25, defaultUnit: 'kg' },
        { id: 22, name: 'Coarse Powder', defaultBagWeight: 50, defaultUnit: '50kg' }
      ]
    }
  ]);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({ name: '' });
  const [subProductForm, setSubProductForm] = useState({
    categoryId: null,
    name: '',
    defaultBagWeight: '',
    defaultUnit: 'kg'
  });
  const [showSubProductForm, setShowSubProductForm] = useState(false);

  // Users Management State
  const [users, setUsers] = useState([
    { id: 1, name: 'Admin User', role: 'Administrator', email: 'admin@micaflow.com', status: 'Active' },
    { id: 2, name: 'Manager', role: 'Manager', email: 'manager@micaflow.com', status: 'Active' }
  ]);

  // Supplier Management Functions
  const handleSupplierSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSupplier) {
        setSuppliers(prev => prev.map(supplier => 
          supplier.id === editingSupplier.id 
            ? { ...supplierFormData, id: editingSupplier.id }
            : supplier
        ));
      } else {
        const newSupplier = {
          ...supplierFormData,
          id: Date.now()
        };
        setSuppliers(prev => [...prev, newSupplier]);
      }
      resetSupplierForm();
    } catch (error) {
      console.error('Error saving supplier:', error);
    }
  };

  const handleSupplierEdit = (supplier) => {
    setEditingSupplier(supplier);
    setSupplierFormData(supplier);
    setIsSupplierFormOpen(true);
  };

  const handleSupplierDelete = async (supplierId) => {
    // TODO: Replace with custom modal
    if (window.confirm('Are you sure you want to delete this supplier?')) {
      try {
        setSuppliers(prev => prev.filter(supplier => supplier.id !== supplierId));
      } catch (error) {
        console.error('Error deleting supplier:', error);
      }
    }
  };

  const resetSupplierForm = () => {
    setSupplierFormData({
      name: '',
      contact: '',
      email: '',
      address: '',
      materialType: '',
      defaultUnit: 'kg',
      status: 'active'
    });
    setEditingSupplier(null);
    setIsSupplierFormOpen(false);
  };

  const handleSupplierInputChange = (field, value) => {
    setSupplierFormData(prev => ({ ...prev, [field]: value }));
  };

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name?.toLowerCase().includes(supplierSearchTerm.toLowerCase()) ||
    supplier.materialType?.toLowerCase().includes(supplierSearchTerm.toLowerCase())
  );

  // Categories Management Functions
  const handleAddCategory = () => {
    if (categoryForm.name.trim()) {
      const newCategory = {
        id: Date.now(),
        name: categoryForm.name,
        subProducts: []
      };
      setCategories(prev => [...prev, newCategory]);
      setCategoryForm({ name: '' });
    }
  };

  const handleDeleteCategory = (categoryId) => {
    // TODO: Replace with custom modal
    if (window.confirm('Are you sure you want to delete this category and all its sub-products?')) {
      setCategories(prev => prev.filter(cat => cat.id !== categoryId));
    }
  };

  const handleAddSubProduct = () => {
    if (subProductForm.name.trim() && subProductForm.defaultBagWeight) {
      const newSubProduct = {
        id: Date.now(),
        name: subProductForm.name,
        defaultBagWeight: parseInt(subProductForm.defaultBagWeight),
        defaultUnit: subProductForm.defaultUnit
      };
      
      setCategories(prev => prev.map(category => 
        category.id === subProductForm.categoryId 
          ? { ...category, subProducts: [...category.subProducts, newSubProduct] }
          : category
      ));
      
      setSubProductForm({
        categoryId: null,
        name: '',
        defaultBagWeight: '',
        defaultUnit: 'kg'
      });
      setShowSubProductForm(false);
    }
  };

  const handleDeleteSubProduct = (categoryId, subProductId) => {
    // TODO: Replace with custom modal
    if (window.confirm('Are you sure you want to delete this sub-product?')) {
      setCategories(prev => prev.map(category => 
        category.id === categoryId 
          ? { ...category, subProducts: category.subProducts.filter(sub => sub.id !== subProductId) }
          : category
      ));
    }
  };

  const renderSuppliersTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-secondary-blue">Supplier Management</h3>
          <p className="text-body">Manage your mica suppliers and their information</p>
        </div>
        <button
          onClick={() => setIsSupplierFormOpen(true)}
          className="btn-primary-mica flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Supplier</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white-bg rounded-lg shadow-md p-6 border border-light-gray-border">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-body w-4 h-4" />
          <input
            type="text"
            placeholder="Search suppliers..."
            value={supplierSearchTerm}
            onChange={(e) => setSupplierSearchTerm(e.target.value)}
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
                <th className="px-6 py-3 text-left text-xs font-medium text-body uppercase tracking-wider">Default Unit</th>
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-blue">{supplier.defaultUnit}</td>
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
                      onClick={() => handleSupplierEdit(supplier)}
                      className="text-secondary-blue hover:text-primary-orange mr-4"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleSupplierDelete(supplier.id)}
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
      {isSupplierFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white-bg rounded-lg p-6 w-full max-w-md border border-light-gray-border">
            <h2 className="text-xl font-semibold text-secondary-blue mb-4">
              {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
            </h2>
            <form onSubmit={handleSupplierSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-blue mb-2">
                  Supplier Name
                </label>
                <input
                  type="text"
                  className="form-input-mica"
                  value={supplierFormData.name}
                  onChange={(e) => handleSupplierInputChange('name', e.target.value)}
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
                  value={supplierFormData.contact}
                  onChange={(e) => handleSupplierInputChange('contact', e.target.value)}
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
                  value={supplierFormData.email}
                  onChange={(e) => handleSupplierInputChange('email', e.target.value)}
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
                  value={supplierFormData.address}
                  onChange={(e) => handleSupplierInputChange('address', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-blue mb-2">
                  Material Type
                </label>
                <select
                  className="form-select-mica"
                  value={supplierFormData.materialType}
                  onChange={(e) => handleSupplierInputChange('materialType', e.target.value)}
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
                  value={supplierFormData.defaultUnit}
                  onChange={(e) => handleSupplierInputChange('defaultUnit', e.target.value)}
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
                  value={supplierFormData.status}
                  onChange={(e) => handleSupplierInputChange('status', e.target.value)}
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
                  onClick={resetSupplierForm}
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

  const renderCategoriesTab = () => (
    <div className="space-y-6">
      {/* Add New Category Section */}
      <div className="bg-white-bg rounded-lg shadow-md p-6 border border-light-gray-border">
        <h3 className="text-lg font-semibold text-secondary-blue mb-4">Add New Category</h3>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-secondary-blue mb-2">
              Category Name
            </label>
            <input
              type="text"
              placeholder="Enter category name"
              className="form-input-mica"
              value={categoryForm.name}
              onChange={(e) => setCategoryForm({ name: e.target.value })}
            />
          </div>
          <button 
            onClick={handleAddCategory}
            className="btn-primary-mica flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Category
          </button>
        </div>
      </div>

      {/* Existing Categories Section */}
      <div className="bg-white-bg rounded-lg shadow-md border border-light-gray-border">
        <div className="p-6 border-b border-light-gray-border">
          <h3 className="text-lg font-semibold text-secondary-blue">Existing Product Categories</h3>
        </div>
        <div className="divide-y divide-light-gray-border">
          {categories.map(category => (
            <div key={category.id} className="p-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setExpandedCategory(expandedCategory === category.id ? null : category.id)}
                    className="text-secondary-blue hover:text-primary-orange"
                  >
                    {expandedCategory === category.id ? 
                      <ChevronDown className="w-5 h-5" /> : 
                      <ChevronRight className="w-5 h-5" />
                    }
                  </button>
                  <div>
                    <h4 className="font-semibold text-secondary-blue">{category.name}</h4>
                    <p className="text-sm text-body">{category.subProducts.length} sub-products</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 text-secondary-blue hover:text-primary-orange rounded-lg border border-light-gray-border">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDeleteCategory(category.id)}
                    className="p-2 text-red-600 hover:text-red-900 rounded-lg border border-light-gray-border"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setSubProductForm({ ...subProductForm, categoryId: category.id });
                      setShowSubProductForm(true);
                    }}
                    className="btn-secondary-mica text-sm"
                  >
                    Manage Sub-Products
                  </button>
                </div>
              </div>

              {/* Expanded Sub-Products */}
              {expandedCategory === category.id && (
                <div className="mt-4 ml-8 space-y-3">
                  {category.subProducts.map(subProduct => (
                    <div key={subProduct.id} className="flex justify-between items-center p-3 bg-light-gray-bg rounded-lg border border-light-gray-border">
                      <div>
                        <p className="font-medium text-secondary-blue">{subProduct.name}</p>
                        <p className="text-sm text-body">
                          Default: {subProduct.defaultBagWeight}{subProduct.defaultUnit}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button className="p-1 text-secondary-blue hover:text-primary-orange">
                          <Edit className="w-3 h-3" />
                        </button>
                        <button 
                          onClick={() => handleDeleteSubProduct(category.id, subProduct.id)}
                          className="p-1 text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Add Sub-Product Modal */}
      {showSubProductForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white-bg rounded-lg p-6 w-full max-w-md border border-light-gray-border">
            <h2 className="text-xl font-semibold text-secondary-blue mb-4">
              Add Sub-Product to {categories.find(c => c.id === subProductForm.categoryId)?.name}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-blue mb-2">
                  Sub-Product Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., 12+ Mesh"
                  className="form-input-mica"
                  value={subProductForm.name}
                  onChange={(e) => setSubProductForm({ ...subProductForm, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-blue mb-2">
                  Default Bag Weight
                </label>
                <input
                  type="number"
                  placeholder="50"
                  className="form-input-mica"
                  value={subProductForm.defaultBagWeight}
                  onChange={(e) => setSubProductForm({ ...subProductForm, defaultBagWeight: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-blue mb-2">
                  Default Unit
                </label>
                <select
                  className="form-select-mica"
                  value={subProductForm.defaultUnit}
                  onChange={(e) => setSubProductForm({ ...subProductForm, defaultUnit: e.target.value })}
                >
                  <option value="kg">kg</option>
                  <option value="50kg">50kg</option>
                  <option value="35kg">35kg</option>
                  <option value="tonne">tonne</option>
                </select>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleAddSubProduct}
                  className="btn-primary-mica flex-1"
                >
                  Add Sub-Product
                </button>
                <button
                  onClick={() => {
                    setShowSubProductForm(false);
                    setSubProductForm({ categoryId: null, name: '', defaultBagWeight: '', defaultUnit: 'kg' });
                  }}
                  className="btn-secondary-mica flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderUsersTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-secondary-blue">User Management</h3>
        <button 
          className="btn-primary-mica flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add User
        </button>
      </div>

      <div className="grid gap-4">
        {users.map(user => (
          <div key={user.id} className="bg-white-bg border border-light-gray-border rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-semibold text-secondary-blue">{user.name}</h4>
                <p className="text-sm text-body">Role: {user.role}</p>
                <p className="text-sm text-body">Email: {user.email}</p>
                <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                  user.status === 'Active' 
                    ? 'bg-green-100 text-green-600' 
                    : 'bg-red-100 text-red-600'
                }`}>
                  {user.status}
                </span>
              </div>
              <div className="flex gap-2">
                <button className="p-2 text-secondary-blue hover:text-primary-orange rounded-lg border border-light-gray-border">
                  <Edit className="w-4 h-4" />
                </button>
                <button className="p-2 text-red-600 hover:text-red-900 rounded-lg border border-light-gray-border">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div id="management" className="bg-light-gray-bg min-h-screen">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="w-8 h-8 text-primary-orange" />
        <div>
          <h1 className="text-3xl font-bold text-secondary-blue mb-2">Management</h1>
          <p className="text-body">Manage suppliers, categories, and system users</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white-bg rounded-2xl shadow-md border border-light-gray-border">
        <div className="border-b border-light-gray-border">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('suppliers')}
              className={`px-6 py-4 text-sm font-medium border-b-2 ${
                activeTab === 'suppliers'
                  ? 'border-primary-orange text-primary-orange'
                  : 'border-transparent text-body hover:text-secondary-blue hover:border-light-gray-border'
              }`}
            >
              Suppliers
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`px-6 py-4 text-sm font-medium border-b-2 ${
                activeTab === 'categories'
                  ? 'border-primary-orange text-primary-orange'
                  : 'border-transparent text-body hover:text-secondary-blue hover:border-light-gray-border'
              }`}
            >
              Categories
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-6 py-4 text-sm font-medium border-b-2 ${
                activeTab === 'users'
                  ? 'border-primary-orange text-primary-orange'
                  : 'border-transparent text-body hover:text-secondary-blue hover:border-light-gray-border'
              }`}
            >
              Users
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'suppliers' && renderSuppliersTab()}
          {activeTab === 'categories' && renderCategoriesTab()}
          {activeTab === 'users' && renderUsersTab()}
        </div>
      </div>
    </div>
  );
};

export default Management;
