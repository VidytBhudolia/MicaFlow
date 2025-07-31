import React, { useState, useEffect } from 'react';
import { FormInput, FormTextarea, Button } from '../components/forms/FormComponents';
import { Edit, Trash2, Plus, Loader } from 'lucide-react';
import { suppliersService } from '../services/firebaseServices';

const SupplierManagement = () => {
  const [formData, setFormData] = useState({
    supplierName: '',
    contactPerson: '',
    phoneNumber: '',
    email: '',
    address: '',
  });

  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Load suppliers on component mount
  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const suppliersData = await suppliersService.getSuppliers();
      setSuppliers(suppliersData);
    } catch (error) {
      console.error('Error loading suppliers:', error);
      alert('Error loading suppliers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingId) {
        // Update existing supplier
        await suppliersService.updateSupplier(editingId, formData);
        setSuppliers(prev => prev.map(supplier => 
          supplier.id === editingId 
            ? { ...supplier, ...formData }
            : supplier
        ));
        setEditingId(null);
        alert('Supplier updated successfully!');
      } else {
        // Add new supplier
        const newSupplier = await suppliersService.addSupplier(formData);
        setSuppliers(prev => [newSupplier, ...prev]);
        alert('Supplier added successfully!');
      }

      // Reset form
      setFormData({
        supplierName: '',
        contactPerson: '',
        phoneNumber: '',
        email: '',
        address: '',
      });
    } catch (error) {
      console.error('Error saving supplier:', error);
      alert('Error saving supplier. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (supplier) => {
    setFormData({
      supplierName: supplier.supplierName,
      contactPerson: supplier.contactPerson,
      phoneNumber: supplier.phoneNumber,
      email: supplier.email,
      address: supplier.address,
    });
    setEditingId(supplier.id);
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({
      supplierName: '',
      contactPerson: '',
      phoneNumber: '',
      email: '',
      address: '',
    });
  };

  const handleDelete = async (supplier) => {
    if (window.confirm(`Are you sure you want to delete ${supplier.supplierName}?`)) {
      try {
        await suppliersService.deleteSupplier(supplier.id);
        setSuppliers(prev => prev.filter(s => s.id !== supplier.id));
        alert('Supplier deleted successfully!');
      } catch (error) {
        console.error('Error deleting supplier:', error);
        alert('Error deleting supplier. Please try again.');
      }
    }
  };

  return (
    <div className="content-wrapper-mica">
      <div className="flex flex-col max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-wrap justify-between gap-3 p-4">
          <h1 className="text-heading text-4xl font-bold leading-tight min-w-72">
            Supplier Management
          </h1>
        </div>

        {/* Add Supplier Form */}
        <div className="card-mica mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-heading text-2xl font-bold leading-tight tracking-[-0.015em]">
              {editingId ? 'Edit Supplier' : 'Add Supplier'}
            </h2>
            {editingId && (
              <Button 
                type="button" 
                variant="secondary" 
                onClick={handleCancelEdit}
                className="text-sm py-2 px-4"
              >
                Cancel Edit
              </Button>
            )}
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* First Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormInput
                label="Supplier Name"
                id="supplierName"
                name="supplierName"
                placeholder="Enter supplier name"
                value={formData.supplierName}
                onChange={handleInputChange}
                required
              />
              <FormInput
                label="Contact Person"
                id="contactPerson"
                name="contactPerson"
                placeholder="Enter contact person name"
                value={formData.contactPerson}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* Second Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormInput
                label="Phone Number"
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                placeholder="Enter phone number"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                required
              />
              <FormInput
                label="Email"
                id="email"
                name="email"
                type="email"
                placeholder="Enter email address"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* Address */}
            <FormTextarea
              label="Address"
              id="address"
              name="address"
              placeholder="Enter supplier address"
              value={formData.address}
              onChange={handleInputChange}
              required
              rows={3}
            />

            {/* Submit Button */}
            <div className="flex justify-start">
              <Button 
                type="submit" 
                variant="primary" 
                disabled={submitting}
                className="flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    {editingId ? 'Updating...' : 'Adding...'}
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    {editingId ? 'Update Supplier' : 'Add Supplier'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Existing Suppliers Table */}
        <div className="card-mica">
          <h2 className="text-heading text-2xl font-bold leading-tight tracking-[-0.015em] mb-6">
            Existing Suppliers ({suppliers.length})
          </h2>
          
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-8 h-8 animate-spin text-primary-orange" />
              <span className="ml-3 text-secondary-text">Loading suppliers...</span>
            </div>
          ) : suppliers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-secondary-text text-lg mb-4">No suppliers found</p>
              <p className="text-secondary-text">Add your first supplier using the form above.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="flex overflow-hidden rounded-xl border border-light-border bg-white-bg">
                <table className="flex-1 min-w-full">
                  <thead>
                    <tr className="bg-light-gray-bg">
                      <th className="px-4 py-3 text-left text-body-text text-sm font-semibold leading-normal">
                        Supplier Name
                      </th>
                      <th className="px-4 py-3 text-left text-body-text text-sm font-semibold leading-normal">
                        Contact Person
                      </th>
                      <th className="px-4 py-3 text-left text-body-text text-sm font-semibold leading-normal">
                        Phone Number
                      </th>
                      <th className="px-4 py-3 text-left text-body-text text-sm font-semibold leading-normal">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left text-body-text text-sm font-semibold leading-normal">
                        Address
                      </th>
                      <th className="px-4 py-3 text-left text-secondary-text text-sm font-semibold leading-normal">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {suppliers.map((supplier, index) => (
                      <tr 
                        key={supplier.id} 
                        className={`border-t border-light-border ${
                          index % 2 === 0 ? 'bg-white-bg' : 'bg-light-gray-bg'
                        } ${editingId === supplier.id ? 'ring-2 ring-primary-orange' : ''}`}
                      >
                        <td className="px-4 py-4 text-body-text text-sm font-medium leading-normal">
                          {supplier.supplierName}
                        </td>
                        <td className="px-4 py-4 text-secondary-text text-sm font-normal leading-normal">
                          {supplier.contactPerson}
                        </td>
                        <td className="px-4 py-4 text-secondary-text text-sm font-normal leading-normal">
                          {supplier.phoneNumber}
                        </td>
                        <td className="px-4 py-4 text-secondary-text text-sm font-normal leading-normal">
                          {supplier.email}
                        </td>
                        <td className="px-4 py-4 text-secondary-text text-sm font-normal leading-normal max-w-xs truncate">
                          {supplier.address}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleEdit(supplier)}
                              className="text-primary-orange hover:text-orange-600 transition-colors"
                              title="Edit Supplier"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(supplier)}
                              className="text-red-500 hover:text-red-600 transition-colors"
                              title="Delete Supplier"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupplierManagement;
