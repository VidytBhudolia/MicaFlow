import React, { useState } from 'react';
import { Calendar, FileText, Minus } from 'lucide-react';

const MaterialDeduction = () => {
  const [deductionType, setDeductionType] = useState('order-sheet');
  const [formData, setFormData] = useState({
    deductionDate: '',
    orderSheetRef: '',
    materialType: '',
    quantity: '',
    unit: 'kg',
    reason: '',
    invoiceNumber: '',
    truckNumber: '',
    notes: ''
  });

  const materialTypes = [
    'Raw Mica',
    'Processed Mica Sheets',
    'Mica Powder',
    'Mica Flakes',
    'Quality Grade A',
    'Quality Grade B',
    'Quality Grade C'
  ];

  const deductionReasons = [
    'Production Use',
    'Quality Issues',
    'Customer Return',
    'Damage/Waste',
    'Testing/Sampling',
    'Other'
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDeductionTypeChange = (type) => {
    setDeductionType(type);
    // Clear order sheet ref if switching to direct deduction
    if (type === 'direct') {
      setFormData(prev => ({ ...prev, orderSheetRef: '' }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const submissionData = {
      ...formData,
      deductionType
    };
    console.log('Material Deduction Data:', submissionData);
    // TODO: Integrate with Firebase
    // TODO: Replace with custom modal
    console.log('Material deduction recorded successfully!');
  };

  return (
    <div id="material-deduction" className="w-full">
      <div className="flex items-center gap-3 mb-6">
        <Minus className="w-8 h-8 text-primary-orange" />
        <div>
          <h1 className="text-3xl font-bold text-secondary-blue mb-2">Material Deduction</h1>
          <p className="text-body">Record material usage and inventory deductions</p>
        </div>
      </div>

          <div className="bg-white-bg rounded-lg shadow-md p-6 border border-light-gray-border">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Deduction Type Selection */}
              <div>
                <label className="block text-sm font-medium text-secondary-blue mb-3">
                  Deduction Type
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => handleDeductionTypeChange('order-sheet')}
                    className={`p-4 rounded-lg border-2 text-left transition-colors ${
                      deductionType === 'order-sheet'
                        ? 'border-primary-orange bg-primary-orange/5 text-primary-orange'
                        : 'border-light-gray-border hover:border-primary-orange/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5" />
                      <div>
                        <h3 className="font-medium">From Order Sheet</h3>
                        <p className="text-sm text-body">Deduct materials based on existing order</p>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeductionTypeChange('direct')}
                    className={`p-4 rounded-lg border-2 text-left transition-colors ${
                      deductionType === 'direct'
                        ? 'border-primary-orange bg-primary-orange/5 text-primary-orange'
                        : 'border-light-gray-border hover:border-primary-orange/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Minus className="w-5 h-5" />
                      <div>
                        <h3 className="font-medium">Direct Deduction</h3>
                        <p className="text-sm text-body">Manual inventory deduction</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="deductionDate" className="block text-sm font-medium text-secondary-blue mb-2">
                    Deduction Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      id="deductionDate"
                      className="form-input-mica"
                      value={formData.deductionDate}
                      onChange={(e) => handleInputChange('deductionDate', e.target.value)}
                      required
                    />
                    <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-body w-5 h-5 pointer-events-none" />
                  </div>
                </div>

                {deductionType === 'order-sheet' && (
                  <div>
                    <label htmlFor="orderSheetRef" className="block text-sm font-medium text-secondary-blue mb-2">
                      Order Sheet Reference
                    </label>
                    <input
                      type="text"
                      id="orderSheetRef"
                      className="form-input-mica"
                      placeholder="Enter order reference number"
                      value={formData.orderSheetRef}
                      onChange={(e) => handleInputChange('orderSheetRef', e.target.value)}
                      required
                    />
                  </div>
                )}

                <div>
                  <label htmlFor="invoiceNumber" className="block text-sm font-medium text-secondary-blue mb-2">
                    Invoice Number
                  </label>
                  <input
                    type="text"
                    id="invoiceNumber"
                    className="form-input-mica"
                    placeholder="Enter invoice number"
                    value={formData.invoiceNumber}
                    onChange={(e) => handleInputChange('invoiceNumber', e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="truckNumber" className="block text-sm font-medium text-secondary-blue mb-2">
                    Truck Number
                  </label>
                  <input
                    type="text"
                    id="truckNumber"
                    className="form-input-mica"
                    placeholder="Enter truck number"
                    value={formData.truckNumber}
                    onChange={(e) => handleInputChange('truckNumber', e.target.value)}
                  />
                </div>
              </div>

              {/* Material Details */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-secondary-blue">Material Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="materialType" className="block text-sm font-medium text-secondary-blue mb-2">
                      Material Type
                    </label>
                    <select
                      id="materialType"
                      className="form-select-mica"
                      value={formData.materialType}
                      onChange={(e) => handleInputChange('materialType', e.target.value)}
                      required
                    >
                      <option value="">Select Material Type</option>
                      {materialTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="reason" className="block text-sm font-medium text-secondary-blue mb-2">
                      Reason for Deduction
                    </label>
                    <select
                      id="reason"
                      className="form-select-mica"
                      value={formData.reason}
                      onChange={(e) => handleInputChange('reason', e.target.value)}
                      required
                    >
                      <option value="">Select Reason</option>
                      {deductionReasons.map(reason => (
                        <option key={reason} value={reason}>{reason}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Quantity - side by side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="quantity" className="block text-sm font-medium text-secondary-blue mb-2">
                      Quantity to Deduct
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        id="quantity"
                        className="form-input-mica flex-1"
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        value={formData.quantity}
                        onChange={(e) => handleInputChange('quantity', e.target.value)}
                        required
                      />
                      <select
                        className="form-select-mica w-24"
                        value={formData.unit}
                        onChange={(e) => handleInputChange('unit', e.target.value)}
                      >
                        <option value="kg">kg</option>
                        <option value="ton">ton</option>
                        <option value="pcs">pcs</option>
                        <option value="sheets">sheets</option>
                        <option value="g">g</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-end">
                    <div className="w-full">
                      <div className="bg-primary-orange/5 border border-primary-orange/20 rounded-lg p-4">
                        <p className="text-sm text-primary-orange">
                          <strong>Available Stock:</strong> 250.5 kg
                          <br />
                          <strong>After Deduction:</strong> {
                            formData.quantity 
                              ? (250.5 - parseFloat(formData.quantity || 0)).toFixed(2)
                              : '250.5'
                          } kg
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              {deductionType === 'order-sheet' && (
                <div className="bg-light-gray-bg border border-light-gray-border rounded-lg p-4">
                  <h4 className="font-medium text-secondary-blue mb-3">Order Sheet Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-body">Customer:</span>
                      <p className="font-medium text-secondary-blue">ABC Industries Ltd</p>
                    </div>
                    <div>
                      <span className="text-body">Order Date:</span>
                      <p className="font-medium text-secondary-blue">2024-01-15</p>
                    </div>
                    <div>
                      <span className="text-body">Total Quantity:</span>
                      <p className="font-medium text-secondary-blue">500 kg</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-secondary-blue mb-2">
                  Additional Notes (Optional)
                </label>
                <textarea
                  id="notes"
                  className="form-textarea-mica"
                  rows={3}
                  placeholder="Any additional notes about this deduction..."
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  className="btn-secondary-mica"
                  onClick={() => {
                    setFormData({
                      deductionDate: '',
                      orderSheetRef: '',
                      materialType: '',
                      quantity: '',
                      unit: 'kg',
                      reason: '',
                      invoiceNumber: '',
                      truckNumber: '',
                      notes: ''
                    });
                  }}
                >
                  Clear Form
                </button>
                <button type="submit" className="btn-primary-mica">
                  Record Deduction
                </button>
              </div>
            </form>
          </div>
    </div>
  );
};

export default MaterialDeduction;
