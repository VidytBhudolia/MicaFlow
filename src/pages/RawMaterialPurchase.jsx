import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Plus } from 'lucide-react';

const RawMaterialPurchase = () => {
  const [formData, setFormData] = useState({
    purchaseDate: '',
    supplierName: '',
    quantity: '',
    unit: 'kg',
    unitPrice: '',
    totalAmount: '',
    invoiceNumber: '',
    notes: ''
  });

  // Mock data - In real app, this would come from Management page
  const suppliers = [
    { id: 1, name: 'Mica Industries Ltd', defaultUnit: 'kg' },
    { id: 2, name: 'Premium Mica Co.', defaultUnit: '50kg' }
  ];

  const unitOptions = ['kg', '50kg', 'tonne'];

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      // Auto-calculate total amount
      if (field === 'quantity' || field === 'unitPrice') {
        const qty = parseFloat(updated.quantity) || 0;
        const price = parseFloat(updated.unitPrice) || 0;
        updated.totalAmount = (qty * price).toFixed(2);
      }
      return updated;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Raw Material Purchase Data:', formData);
    // TODO: Integrate with Firebase
    alert('Raw material purchase entry submitted successfully!');
  };

  return (
    <div id="raw-material-purchase" className="bg-light-gray-bg min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-secondary-blue mb-2">Raw Material Purchase Entry</h1>
          <p className="text-body">Record new raw material purchases and supplier transactions</p>
        </div>
      </div>

      <div className="bg-white-bg rounded-2xl shadow-md p-6 lg:p-8 border border-light-gray-border">
        <form onSubmit={handleSubmit} className="space-y-6">
              {/* Purchase Date and Supplier */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div>
                  <label htmlFor="purchaseDate" className="block text-sm font-medium text-secondary-blue mb-2">
                    Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      id="purchaseDate"
                      className="form-input-mica"
                      value={formData.purchaseDate}
                      onChange={(e) => handleInputChange('purchaseDate', e.target.value)}
                      required
                    />
                    <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-body w-5 h-5 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label htmlFor="supplierName" className="block text-sm font-medium text-secondary-blue mb-2">
                    Supplier Name
                  </label>
                  <div className="flex gap-2">
                    <select
                      id="supplierName"
                      className="form-select-mica flex-1"
                      value={formData.supplierName}
                      onChange={(e) => handleInputChange('supplierName', e.target.value)}
                      required
                    >
                      <option value="">Select Supplier</option>
                      {suppliers.map(supplier => (
                        <option key={supplier.id} value={supplier.name}>
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                    <Link
                      to="/management"
                      className="btn-secondary-mica flex items-center px-3"
                      title="Add New Supplier"
                    >
                      <Plus className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Quantity, Unit, and Invoice Number */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6">
                <div>
                  <label htmlFor="quantity" className="block text-sm font-medium text-secondary-blue mb-2">
                    Quantity
                  </label>
                  <input
                    type="number"
                    id="quantity"
                    className="form-input-mica"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    value={formData.quantity}
                    onChange={(e) => handleInputChange('quantity', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="unit" className="block text-sm font-medium text-secondary-blue mb-2">
                    Unit
                  </label>
                  <select
                    id="unit"
                    className="form-select-mica"
                    value={formData.unit}
                    onChange={(e) => handleInputChange('unit', e.target.value)}
                  >
                    {unitOptions.map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="invoiceNumber" className="block text-sm font-medium text-secondary-blue mb-2">
                    Invoice Number
                  </label>
                  <input
                    type="text"
                    id="invoiceNumber"
                    className="form-input-mica"
                    placeholder="Invoice Number"
                    value={formData.invoiceNumber}
                    onChange={(e) => handleInputChange('invoiceNumber', e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Unit Price and Total Amount */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div>
                  <label htmlFor="unitPrice" className="block text-sm font-medium text-secondary-blue mb-2">
                    Unit Price (₹)
                  </label>
                  <input
                    type="number"
                    id="unitPrice"
                    className="form-input-mica"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    value={formData.unitPrice}
                    onChange={(e) => handleInputChange('unitPrice', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="totalAmount" className="block text-sm font-medium text-secondary-blue mb-2">
                    Total Amount (₹)
                  </label>
                  <input
                    type="text"
                    id="totalAmount"
                    className="form-input-mica bg-light-gray-bg"
                    value={formData.totalAmount}
                    readOnly
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-secondary-blue mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  id="notes"
                  className="form-textarea-mica"
                  rows={3}
                  placeholder="Additional notes about the purchase..."
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  className="btn-secondary-mica"
                  onClick={() => setFormData({
                    purchaseDate: '',
                    supplierName: '',
                    quantity: '',
                    unit: 'kg',
                    unitPrice: '',
                    totalAmount: '',
                    invoiceNumber: '',
                    notes: ''
                  })}
                >
                  Clear Form
                </button>
                <button type="submit" className="btn-primary-mica">
                  Record Purchase
                </button>
              </div>
            </form>
          </div>
    </div>
  );
};

export default RawMaterialPurchase;
