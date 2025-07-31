import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Plus } from 'lucide-react';

const RawMaterialPurchase = () => {
  const [formData, setFormData] = useState({
    purchaseDate: '',
    supplierName: '',
    materialType: '',
    quantity: '',
    unit: 'kg',
    unitPrice: '',
    totalAmount: '',
    invoiceNumber: '',
    notes: ''
  });

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
    <div id="raw-material-purchase" className="">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-secondary mb-2">Raw Material Purchase Entry</h1>
          <p className="text-gray-600">Record new raw material purchases and supplier transactions</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-md p-6 lg:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
              {/* Purchase Date and Supplier */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div>
                  <label htmlFor="purchaseDate" className="block text-sm font-medium text-gray-700 mb-2">
                    Purchase Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      id="purchaseDate"
                      className="form-input"
                      value={formData.purchaseDate}
                      onChange={(e) => handleInputChange('purchaseDate', e.target.value)}
                      required
                    />
                    <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label htmlFor="supplierName" className="block text-sm font-medium text-gray-700 mb-2">
                    Supplier Name
                  </label>
                  <div className="flex gap-2">
                    <select
                      id="supplierName"
                      className="form-select flex-1"
                      value={formData.supplierName}
                      onChange={(e) => handleInputChange('supplierName', e.target.value)}
                      required
                    >
                      <option value="">Select Supplier</option>
                      <option value="Supplier A">Supplier A</option>
                      <option value="Supplier B">Supplier B</option>
                      <option value="Supplier C">Supplier C</option>
                    </select>
                    <Link
                      to="/management"
                      className="btn-secondary flex items-center px-3"
                      title="Add New Supplier"
                    >
                      <Plus className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Material Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="materialType" className="block text-sm font-medium text-gray-700 mb-2">
                    Material Type
                  </label>
                  <select
                    id="materialType"
                    className="form-select"
                    value={formData.materialType}
                    onChange={(e) => handleInputChange('materialType', e.target.value)}
                    required
                  >
                    <option value="">Select Material Type</option>
                    <option value="Raw Mica">Raw Mica</option>
                    <option value="Mica Sheets">Mica Sheets</option>
                    <option value="Mica Powder">Mica Powder</option>
                    <option value="Mica Flakes">Mica Flakes</option>
                    <option value="Industrial Mica">Industrial Mica</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="invoiceNumber" className="block text-sm font-medium text-gray-700 mb-2">
                    Invoice Number
                  </label>
                  <input
                    type="text"
                    id="invoiceNumber"
                    className="form-input"
                    placeholder="Invoice Number"
                    value={formData.invoiceNumber}
                    onChange={(e) => handleInputChange('invoiceNumber', e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Quantity and Unit side by side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      id="quantity"
                      className="form-input flex-1"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      value={formData.quantity}
                      onChange={(e) => handleInputChange('quantity', e.target.value)}
                      required
                    />
                    <select
                      className="form-select w-24"
                      value={formData.unit}
                      onChange={(e) => handleInputChange('unit', e.target.value)}
                    >
                      <option value="kg">kg</option>
                      <option value="ton">ton</option>
                      <option value="lb">lb</option>
                      <option value="g">g</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="unitPrice" className="block text-sm font-medium text-gray-700 mb-2">
                    Unit Price (₹)
                  </label>
                  <input
                    type="number"
                    id="unitPrice"
                    className="form-input"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    value={formData.unitPrice}
                    onChange={(e) => handleInputChange('unitPrice', e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Total Amount */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="totalAmount" className="block text-sm font-medium text-gray-700 mb-2">
                    Total Amount (₹)
                  </label>
                  <input
                    type="text"
                    id="totalAmount"
                    className="form-input bg-gray-50"
                    value={formData.totalAmount}
                    readOnly
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  id="notes"
                  className="form-textarea"
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
                  className="btn-secondary"
                  onClick={() => setFormData({
                    purchaseDate: '',
                    supplierName: '',
                    materialType: '',
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
                <button type="submit" className="btn-primary rounded-full">
                  Record Purchase
                </button>
              </div>
            </form>
          </div>
    </div>
  );
};

export default RawMaterialPurchase;
