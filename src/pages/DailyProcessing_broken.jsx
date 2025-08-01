import React, { useState } from 'react';
import { Calendar, Plus, Minus } from 'lucide-react';

const DailyProcessing = () => {
  const [formData, setFormData] = useState({
    processingDate: '',
    rawMaterialUsed: '',
    rawMaterialUnit: 'kg',
    supplierOfRawMaterial: '',
    productCategory: '',
    numMaleWorkers: 0,
    numFemaleWorkers: 0,
    dieselGeneratorHours: 0,
    dieselUsedLiters: 0,
    hammerChanges: 0,
    knifeChanges: 0,
    notes: ''
  });

  const [producedProducts, setProducedProducts] = useState([]);

  // Mock data - In real app, this would come from Management page
  const suppliers = [
    { id: 1, name: 'Mica Industries Ltd', defaultUnit: 'kg' },
    { id: 2, name: 'Premium Mica Co.', defaultUnit: '50kg' }
  ];

  const categories = [
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
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // When product category changes, initialize produced products
      if (field === 'productCategory') {
        const selectedCategory = categories.find(cat => cat.id.toString() === value);
        if (selectedCategory) {
          const initialProducts = selectedCategory.subProducts.map(subProduct => ({
            id: subProduct.id,
            name: subProduct.name,
            quantityProduced: '',
            unit: subProduct.defaultUnit
          }));
          setProducedProducts(initialProducts);
        } else {
          setProducedProducts([]);
        }
      }
      
      return updated;
    });
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
    // TODO: Replace with custom modal
    console.log('Daily processing update submitted successfully!');
  };

  return (
    <div id="daily-processing" className="w-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-secondary-blue mb-2">Daily Processing Update</h1>
          <p className="text-body">Record daily production activities and resource consumption</p>
        </div>
      </div>

      <div className="bg-white-bg rounded-2xl shadow-md p-6 lg:p-8 border border-light-gray-border">
        <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div>
                  <label htmlFor="processingDate" className="block text-sm font-medium text-secondary-blue mb-2">
                    Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      id="processingDate"
                      className="form-input-mica"
                      value={formData.processingDate}
                      onChange={(e) => handleInputChange('processingDate', e.target.value)}
                      required
                    />
                    <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-body w-5 h-5 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label htmlFor="supplierOfRawMaterial" className="block text-sm font-medium text-secondary-blue mb-2">
                    Supplier of Raw Material Used
                  </label>
                  <select
                    id="supplierOfRawMaterial"
                    className="form-select-mica"
                    value={formData.supplierOfRawMaterial}
                    onChange={(e) => handleInputChange('supplierOfRawMaterial', e.target.value)}
                    required
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map(supplier => (
                      <option key={supplier.id} value={supplier.name}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Raw Material Used - side by side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div>
                  <label htmlFor="rawMaterialUsed" className="block text-sm font-medium text-secondary-blue mb-2">
                    Raw Material Used
                  </label>
                  <input
                    type="number"
                    id="rawMaterialUsed"
                    className="form-input-mica"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    value={formData.rawMaterialUsed}
                    onChange={(e) => handleInputChange('rawMaterialUsed', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="rawMaterialUnit" className="block text-sm font-medium text-secondary-blue mb-2">
                    Raw Material Unit
                  </label>
                  <select
                    id="rawMaterialUnit"
                    className="form-select-mica"
                    value={formData.rawMaterialUnit}
                    onChange={(e) => handleInputChange('rawMaterialUnit', e.target.value)}
                  >
                    <option value="kg">kg</option>
                    <option value="50kg">50kg</option>
                    <option value="tonne">tonne</option>
                  </select>
                </div>
              </div>

              {/* Product Category */}
              <div>
                <label htmlFor="productCategory" className="block text-sm font-medium text-secondary-blue mb-2">
                  Product Category Being Made
                </label>
                <select
                  id="productCategory"
                  className="form-select-mica"
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
                  <h3 className="text-lg font-semibold text-secondary-blue mb-4">Produced Products</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {producedProducts.map((product, index) => (
                      <div key={index} className="border border-light-gray-border rounded-lg p-4 bg-white-bg">
                        <p className="font-medium text-secondary-blue mb-3">{product.name}</p>
                        <div className="space-y-3">
                          <div className="flex gap-2">
                            <input
                              type="number"
                              className="form-input-mica flex-1"
                              placeholder="Quantity"
                              step="0.01"
                              min="0"
                              value={product.quantity}
                              onChange={(e) => handleProductChange(index, 'quantity', e.target.value)}
                            />
                            <select
                              className="form-select-mica w-20"
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
                <h3 className="text-lg font-semibold text-secondary-blue mb-4">Labor & Resources</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  <div>
                    <label htmlFor="numMaleWorkers" className="block text-sm font-medium text-secondary-blue mb-2">
                      Number of Male Workers
                    </label>
                    <input
                      type="number"
                      id="numMaleWorkers"
                      className="form-input-mica"
                      placeholder="0"
                      min="0"
                      value={formData.numMaleWorkers}
                      onChange={(e) => handleInputChange('numMaleWorkers', e.target.value)}
                    />
                  </div>

                  <div>
                    <label htmlFor="numFemaleWorkers" className="block text-sm font-medium text-secondary-blue mb-2">
                      Number of Female Workers
                    </label>
                    <input
                      type="number"
                      id="numFemaleWorkers"
                      className="form-input-mica"
                      placeholder="0"
                      min="0"
                      value={formData.numFemaleWorkers}
                      onChange={(e) => handleInputChange('numFemaleWorkers', e.target.value)}
                    />
                  </div>

                  <div>
                    <label htmlFor="dieselGeneratorHours" className="block text-sm font-medium text-secondary-blue mb-2">
                      Diesel Generator Hours
                    </label>
                    <input
                      type="number"
                      id="dieselGeneratorHours"
                      className="form-input-mica"
                      placeholder="0"
                      min="0"
                      step="0.1"
                      value={formData.dieselGeneratorHours}
                      onChange={(e) => handleInputChange('dieselGeneratorHours', e.target.value)}
                    />
                  </div>

                  <div>
                    <label htmlFor="dieselUsedLiters" className="block text-sm font-medium text-secondary-blue mb-2">
                      Diesel Used (liters)
                    </label>
                    <input
                      type="number"
                      id="dieselUsedLiters"
                      className="form-input-mica"
                      placeholder="0"
                      min="0"
                      step="0.1"
                      value={formData.dieselUsedLiters}
                      onChange={(e) => handleInputChange('dieselUsedLiters', e.target.value)}
                    />
                  </div>

                  <div>
                    <label htmlFor="hammerChanges" className="block text-sm font-medium text-secondary-blue mb-2">
                      Hammer Changes
                    </label>
                    <input
                      type="number"
                      id="hammerChanges"
                      className="form-input-mica"
                      placeholder="0"
                      min="0"
                      value={formData.hammerChanges}
                      onChange={(e) => handleInputChange('hammerChanges', e.target.value)}
                    />
                  </div>

                  <div>
                    <label htmlFor="knifeChanges" className="block text-sm font-medium text-secondary-blue mb-2">
                      Knife Changes
                    </label>
                    <input
                      type="number"
                      id="knifeChanges"
                      className="form-input-mica"
                      placeholder="0"
                      min="0"
                      value={formData.knifeChanges}
                      onChange={(e) => handleInputChange('knifeChanges', e.target.value)}
                    />
                  </div>
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
                  placeholder="Additional notes about today's processing..."
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  className="btn-secondary-mica"
                  onClick={() => {
                    setFormData({
                      processingDate: '',
                      batchNumber: '',
                      rawMaterialUsed: '',
                      rawMaterialUnit: 'kg',
                      productCategory: '',
                      numMaleWorkers: 0,
                      numFemaleWorkers: 0,
                      dieselGeneratorHours: 0,
                      dieselUsedLiters: 0,
                      hammerChanges: 0,
                      knifeChanges: 0,
                      notes: ''
                    });
                    setProducedProducts([]);
                  }}
                >
                  Clear Form
                </button>
                <button type="submit" className="btn-primary-mica">
                  Submit Processing Update
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyProcessing;
