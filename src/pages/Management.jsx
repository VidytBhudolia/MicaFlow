import React, { useState } from 'react';
import { Settings, Plus, Edit, Trash2, Save, X } from 'lucide-react';

const Management = () => {
  const [activeTab, setActiveTab] = useState('suppliers');
  const [editingItem, setEditingItem] = useState(null);
  const [newItem, setNewItem] = useState({ name: '', contact: '', address: '', notes: '' });
  const [showAddForm, setShowAddForm] = useState(false);

  // Sample data - replace with Firebase data
  const [suppliers, setSuppliers] = useState([
    { id: 1, name: 'ABC Mica Ltd', contact: '+91-9876543210', address: 'Rajasthan', notes: 'Premium supplier' },
    { id: 2, name: 'XYZ Mining Co', contact: '+91-9876543211', address: 'Jharkhand', notes: 'Bulk supplier' }
  ]);

  const [categories, setCategories] = useState([
    { id: 1, name: 'Mica Sheets', description: 'Various sizes of mica sheets' },
    { id: 2, name: 'Mica Powder', description: 'Fine ground mica powder' },
    { id: 3, name: 'Mica Flakes', description: 'Natural mica flakes' }
  ]);

  const [users, setUsers] = useState([
    { id: 1, name: 'Admin User', role: 'Administrator', email: 'admin@micaflow.com', status: 'Active' },
    { id: 2, name: 'Manager', role: 'Manager', email: 'manager@micaflow.com', status: 'Active' }
  ]);

  const handleEdit = (item) => {
    setEditingItem(item);
  };

  const handleSave = () => {
    // TODO: Save to Firebase
    setEditingItem(null);
  };

  const handleCancel = () => {
    setEditingItem(null);
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this item?')) {
      if (activeTab === 'suppliers') {
        setSuppliers(suppliers.filter(s => s.id !== id));
      } else if (activeTab === 'categories') {
        setCategories(categories.filter(c => c.id !== id));
      } else if (activeTab === 'users') {
        setUsers(users.filter(u => u.id !== id));
      }
    }
  };

  const handleAddNew = () => {
    if (newItem.name.trim()) {
      const id = Date.now();
      if (activeTab === 'suppliers') {
        setSuppliers([...suppliers, { id, ...newItem }]);
      } else if (activeTab === 'categories') {
        setCategories([...categories, { id, name: newItem.name, description: newItem.notes }]);
      } else if (activeTab === 'users') {
        setUsers([...users, { id, name: newItem.name, email: newItem.contact, role: newItem.notes, status: 'Active' }]);
      }
      setNewItem({ name: '', contact: '', address: '', notes: '' });
      setShowAddForm(false);
    }
  };

  const renderSuppliersTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-secondary">Suppliers Management</h3>
        <button 
          onClick={() => setShowAddForm(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Supplier
        </button>
      </div>

      {showAddForm && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium mb-3">Add New Supplier</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Supplier Name"
              className="form-input"
              value={newItem.name}
              onChange={(e) => setNewItem({...newItem, name: e.target.value})}
            />
            <input
              type="text"
              placeholder="Contact"
              className="form-input"
              value={newItem.contact}
              onChange={(e) => setNewItem({...newItem, contact: e.target.value})}
            />
            <input
              type="text"
              placeholder="Address"
              className="form-input"
              value={newItem.address}
              onChange={(e) => setNewItem({...newItem, address: e.target.value})}
            />
            <input
              type="text"
              placeholder="Notes"
              className="form-input"
              value={newItem.notes}
              onChange={(e) => setNewItem({...newItem, notes: e.target.value})}
            />
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleAddNew} className="btn-primary">Add</button>
            <button onClick={() => setShowAddForm(false)} className="btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {suppliers.map(supplier => (
          <div key={supplier.id} className="bg-white border border-gray-200 rounded-lg p-4">
            {editingItem?.id === supplier.id ? (
              <div className="space-y-3">
                <input
                  type="text"
                  className="form-input"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    className="form-input"
                    value={editingItem.contact}
                    onChange={(e) => setEditingItem({...editingItem, contact: e.target.value})}
                  />
                  <input
                    type="text"
                    className="form-input"
                    value={editingItem.address}
                    onChange={(e) => setEditingItem({...editingItem, address: e.target.value})}
                  />
                </div>
                <input
                  type="text"
                  className="form-input"
                  value={editingItem.notes}
                  onChange={(e) => setEditingItem({...editingItem, notes: e.target.value})}
                />
                <div className="flex gap-2">
                  <button onClick={handleSave} className="btn-primary flex items-center gap-1">
                    <Save className="w-4 h-4" />
                    Save
                  </button>
                  <button onClick={handleCancel} className="btn-secondary flex items-center gap-1">
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold text-gray-800">{supplier.name}</h4>
                  <p className="text-sm text-gray-600">Contact: {supplier.contact}</p>
                  <p className="text-sm text-gray-600">Address: {supplier.address}</p>
                  <p className="text-sm text-gray-500">{supplier.notes}</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleEdit(supplier)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(supplier.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderCategoriesTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-secondary">Product Categories</h3>
        <button 
          onClick={() => setShowAddForm(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      {showAddForm && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium mb-3">Add New Category</h4>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Category Name"
              className="form-input"
              value={newItem.name}
              onChange={(e) => setNewItem({...newItem, name: e.target.value})}
            />
            <input
              type="text"
              placeholder="Description"
              className="form-input"
              value={newItem.notes}
              onChange={(e) => setNewItem({...newItem, notes: e.target.value})}
            />
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleAddNew} className="btn-primary">Add</button>
            <button onClick={() => setShowAddForm(false)} className="btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {categories.map(category => (
          <div key={category.id} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-semibold text-gray-800">{category.name}</h4>
                <p className="text-sm text-gray-600">{category.description}</p>
              </div>
              <div className="flex gap-2">
                <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                  <Edit className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDelete(category.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderUsersTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-secondary">User Management</h3>
        <button 
          onClick={() => setShowAddForm(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add User
        </button>
      </div>

      <div className="grid gap-4">
        {users.map(user => (
          <div key={user.id} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-semibold text-gray-800">{user.name}</h4>
                <p className="text-sm text-gray-600">Role: {user.role}</p>
                <p className="text-sm text-gray-600">Email: {user.email}</p>
                <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                  user.status === 'Active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {user.status}
                </span>
              </div>
              <div className="flex gap-2">
                <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                  <Edit className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDelete(user.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
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
    <div id="management" className="">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-secondary mb-2">Management</h1>
          <p className="text-gray-600">Manage suppliers, categories, and system users</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-md">
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('suppliers')}
              className={`px-6 py-4 text-sm font-medium border-b-2 ${
                activeTab === 'suppliers'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Suppliers
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`px-6 py-4 text-sm font-medium border-b-2 ${
                activeTab === 'categories'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Categories
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-6 py-4 text-sm font-medium border-b-2 ${
                activeTab === 'users'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
