import React, { useState } from 'react';
import { Calendar, Plus, Minus } from 'lucide-react';

const DailyProcessing = () => {
  const [formData, setFormData] = useState({
    processingDate: '',
    batchNumber: '',
    rawMaterialUsed: '',
    rawMaterialUnit: 'kg',
    productCategory: '',
    laborHours: '',
    electricityCost: '',
    maintenanceCost: '',
    otherCosts: '',
    notes: ''
  });

  const [producedProducts, setProducedProducts] = useState([]);

  const productCategories = {
    'mica-sheets': {
      name: 'Mica Sheets',
      products: ['Thin Sheets', 'Medium Sheets', 'Thick Sheets', 'Custom Sheets']
    },
    'mica-powder': {
      name: 'Mica Powder',
      products: ['Fine Powder', 'Coarse Powder', 'Ultra Fine Powder']
    },
    'mica-flakes': {
      name: 'Mica Flakes',
      products: ['Small Flakes', 'Medium Flakes', 'Large Flakes']
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // When product category changes, update produced products
    if (field === 'productCategory' && value) {
      const category = productCategories[value];
      if (category) {
        const newProducts = category.products.map(product => ({
          name: product,
          quantity: '',
          unit: 'kg'
        }));
        setProducedProducts(newProducts);
      }
    } else if (field === 'productCategory' && !value) {
      setProducedProducts([]);
    }
  };

  const handleProductChange = (index, field, value) => {
    setProducedProducts(prev => 
      prev.map((product, i) => 
        i === index ? { ...product, [field]: value } : product
      )
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const submissionData = {
      ...formData,
      producedProducts
    };
    console.log('Daily Processing Data:', submissionData);
    // TODO: Integrate with Firebase
    alert('Daily processing update submitted successfully!');
  };

  return (
    <div id="daily-processing" className="">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-secondary mb-2">Daily Processing Update</h1>
          <p className="text-gray-600">Record daily production activities and resource consumption</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-md p-6 lg:p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div>
                  <label htmlFor="processingDate" className="block text-sm font-medium text-gray-700 mb-2">
                    Processing Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      id="processingDate"
                      className="form-input"
                      value={formData.processingDate}
                      onChange={(e) => handleInputChange('processingDate', e.target.value)}
                      required
                    />
                    <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label htmlFor="batchNumber" className="block text-sm font-medium text-gray-700 mb-2">
                    Batch Number
                  </label>
                  <input
                    type="text"
                    id="batchNumber"
                    className="form-input"
                    placeholder="Batch Number"
                    value={formData.batchNumber}
                    onChange={(e) => handleInputChange('batchNumber', e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Raw Material Used - side by side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div>
                  <label htmlFor="rawMaterialUsed" className="block text-sm font-medium text-gray-700 mb-2">
                    Raw Material Used
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      id="rawMaterialUsed"
                      className="form-input flex-1"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      value={formData.rawMaterialUsed}
                      onChange={(e) => handleInputChange('rawMaterialUsed', e.target.value)}
                      required
                    />
                    <select
                      className="form-select w-24"
                      value={formData.rawMaterialUnit}
                      onChange={(e) => handleInputChange('rawMaterialUnit', e.target.value)}
                    >
                      <option value="kg">kg</option>
                      <option value="ton">ton</option>
                      <option value="lb">lb</option>
                      <option value="g">g</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="productCategory" className="block text-sm font-medium text-gray-700 mb-2">
                    Product Category
                  </label>
                  <select
                    id="productCategory"
                    className="form-select"
                    value={formData.productCategory}
                    onChange={(e) => handleInputChange('productCategory', e.target.value)}
                    required
                  >
                    <option value="">Select Product Category</option>
                    {Object.entries(productCategories).map(([key, category]) => (
                      <option key={key} value={key}>{category.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Produced Products Section */}
              {producedProducts.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-secondary mb-4">Produced Products</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {producedProducts.map((product, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <p className="font-medium text-gray-800 mb-3">{product.name}</p>
                        <div className="space-y-3">
                          <div className="flex gap-2">
                            <input
                              type="number"
                              className="form-input flex-1"
                              placeholder="Quantity"
                              step="0.01"
                              min="0"
                              value={product.quantity}
                              onChange={(e) => handleProductChange(index, 'quantity', e.target.value)}
                            />
                            <select
                              className="form-select w-20"
                              value={product.unit}
                              onChange={(e) => handleProductChange(index, 'unit', e.target.value)}
                            >
                              <option value="kg">kg</option>
                              <option value="ton">ton</option>
                              <option value="pcs">pcs</option>
                              <option value="sheets">sheets</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Labor & Resources Section */}
              <div>
                <h3 className="text-lg font-semibold text-secondary mb-4">Labor & Resources</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  <div>
                    <label htmlFor="laborHours" className="block text-sm font-medium text-gray-700 mb-2">
                      Labor Hours
                    </label>
                    <input
                      type="number"
                      id="laborHours"
                      className="form-input"
                      placeholder="0.0"
                      step="0.5"
                      min="0"
                      value={formData.laborHours}
                      onChange={(e) => handleInputChange('laborHours', e.target.value)}
                    />
                  </div>

                  <div>
                    <label htmlFor="electricityCost" className="block text-sm font-medium text-gray-700 mb-2">
                      Electricity Cost (₹)
                    </label>
                    <input
                      type="number"
                      id="electricityCost"
                      className="form-input"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      value={formData.electricityCost}
                      onChange={(e) => handleInputChange('electricityCost', e.target.value)}
                    />
                  </div>

                  <div>
                    <label htmlFor="maintenanceCost" className="block text-sm font-medium text-gray-700 mb-2">
                      Maintenance Cost (₹)
                    </label>
                    <input
                      type="number"
                      id="maintenanceCost"
                      className="form-input"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      value={formData.maintenanceCost}
                      onChange={(e) => handleInputChange('maintenanceCost', e.target.value)}
                    />
                  </div>

                  <div>
                    <label htmlFor="otherCosts" className="block text-sm font-medium text-gray-700 mb-2">
                      Other Costs (₹)
                    </label>
                    <input
                      type="number"
                      id="otherCosts"
                      className="form-input"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      value={formData.otherCosts}
                      onChange={(e) => handleInputChange('otherCosts', e.target.value)}
                    />
                  </div>
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
                  placeholder="Additional notes about today's processing..."
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setFormData({
                      processingDate: '',
                      batchNumber: '',
                      rawMaterialUsed: '',
                      rawMaterialUnit: 'kg',
                      productCategory: '',
                      laborHours: '',
                      electricityCost: '',
                      maintenanceCost: '',
                      otherCosts: '',
                      notes: ''
                    });
                    setProducedProducts([]);
                  }}
                >
                  Clear Form
                </button>
                <button type="submit" className="btn-primary">
                  Submit Processing Update
                </button>
              </div>
            </form>
          </div>
    </div>
  );
};

export default DailyProcessing;
