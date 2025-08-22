import React, { useState, useMemo, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { dataService } from '../services/dataService';
import InlineSpinner from '../components/InlineSpinner';

const unitToKg = (qty, unit) => {
  const u = (unit || '').toLowerCase();
  if (u === 'tonne' || u === 'tonnes' || u === 't') return (parseFloat(qty) || 0) * 1000;
  if (/^([0-9]*\.?[0-9]+)\s*kg$/.test(u)) {
    const m = u.match(/^([0-9]*\.?[0-9]+)\s*kg$/);
    return (parseFloat(qty) || 0) * parseFloat(m[1]);
  }
  return parseFloat(qty) || 0; // default kg
};

const normalizeBagSpec = (sp) => {
  let weight = parseFloat(sp.defaultBagWeight);
  let unit = (sp.defaultUnit || 'kg').toLowerCase();
  // If unit includes number like '50kg', parse it
  const m = typeof sp.defaultUnit === 'string' && sp.defaultUnit.toLowerCase().match(/^([0-9]*\.?[0-9]+)\s*kg$/);
  if ((Number.isNaN(weight) || !weight) && m) {
    weight = parseFloat(m[1]);
    unit = 'kg';
  }
  // If unit itself is like '50kg', normalize
  const m2 = unit.match(/^([0-9]*\.?[0-9]+)\s*kg$/);
  if (m2) {
    weight = weight || parseFloat(m2[1]);
    unit = 'kg';
  }
  if (unit !== 'kg' && unit !== 'tonne') unit = 'kg';
  return { weight: weight || 0, unit };
};

const DailyProcessing = () => {
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [formData, setFormData] = useState({
    processingDate: todayStr,
    rawMaterialUsed: '',
    rawMaterialUnit: 'kg',
  supplierOfRawMaterial: '', // will hold supplierId
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

  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [inlineSubForm, setInlineSubForm] = useState({ name: '', defaultBagWeight: '', defaultUnit: 'kg' });
  const [isAddingSub, setIsAddingSub] = useState(false);

  const getSupplierUnitOptions = () => {
    const opts = new Set(['kg', 'tonne']);
  const sel = suppliers.find(s => s.id === formData.supplierOfRawMaterial);
    if (sel) {
      const w = sel.defaultBagWeight;
      const u = String(sel.defaultUnit || 'kg').toLowerCase();
      if (Number.isFinite(Number(w))) {
        if (u === 'kg') opts.add(`${w}kg`);
        else if (u === 'tonne') opts.add(`${w * 1000}kg`);
      } else {
        const m = u.match(/^(\d+(?:\.[0-9]+)?)\s*kg$/) || u.match(/^(\d+(?:\.[0-9]+)?)kg$/);
        if (m) opts.add(`${parseFloat(m[1])}kg`);
      }
    }
    return Array.from(opts);
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const s = await dataService.getSuppliers({ forceRefresh: true });
        if (mounted) {
          const list = Array.isArray(s) ? s : [];
          setSuppliers(list);
          // If current selection is invalid against fresh suppliers, clear it
          if (formData.supplierOfRawMaterial && !list.find(x => String(x.id) === String(formData.supplierOfRawMaterial))) {
            setFormData(prev => ({ ...prev, supplierOfRawMaterial: '' }));
          }
        }
      } catch { if (mounted) setSuppliers([]); }
      try {
        const c = await dataService.getCategories({ forceRefresh: true });
        if (mounted) setCategories(Array.isArray(c) ? c : []);
      } catch { if (mounted) setCategories([]); }
      finally { if (mounted) setIsLoadingCategories(false); }
    })();
    return () => { mounted = false; };
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };

      // When product category changes, initialize produced products
      if (field === 'productCategory') {
        const selectedCategory = categories.find(cat => `${cat.id}` === `${value}`);
        if (selectedCategory) {
          const initialProducts = (selectedCategory.subProducts || []).map(subProduct => {
            const { weight, unit } = normalizeBagSpec(subProduct);
            return {
              id: subProduct.id,
              subProductId: subProduct.id,
              name: subProduct.name,
              categoryId: selectedCategory.id,
              bagWeight: weight,
              bagUnit: unit,
              mode: 'bags',
              bags: '',
              kg: '',
              tonne: ''
            };
          });
          setProducedProducts(initialProducts);
        } else {
          setProducedProducts([]);
        }
      }

      // When supplier changes, set raw material unit default from supplier (prefer bag spec)
      if (field === 'supplierOfRawMaterial') {
        const sel = suppliers.find(s => s.id === value);
        if (sel) {
          const w = sel.defaultBagWeight;
          const u = String(sel.defaultUnit || 'kg').toLowerCase();
          if (Number.isFinite(Number(w))) {
            updated.rawMaterialUnit = u === 'kg' ? `${w}kg` : u === 'tonne' ? `${w * 1000}kg` : 'kg';
          } else {
            updated.rawMaterialUnit = sel.defaultUnit || 'kg';
          }
        }
      }

      return updated;
    });
  };

  const rebuildProducedForCategory = (categoryId) => {
    const selectedCategory = categories.find(cat => String(cat.id) === String(categoryId));
    if (!selectedCategory) { setProducedProducts([]); return; }
    const initial = (selectedCategory.subProducts || []).map(subProduct => {
      const { weight, unit } = normalizeBagSpec(subProduct);
      return {
        id: subProduct.id,
  subProductId: subProduct.id,
        name: subProduct.name,
        categoryId: selectedCategory.id,
        bagWeight: weight,
        bagUnit: unit,
        mode: 'bags',
        bags: '',
        kg: '',
        tonne: ''
      };
    });
    setProducedProducts(initial);
  };

  const handleAddInlineSub = async () => {
    const categoryId = formData.productCategory;
    const name = (inlineSubForm.name || '').trim();
    const weightNum = parseFloat(inlineSubForm.defaultBagWeight);
    const unit = inlineSubForm.defaultUnit || 'kg';
    if (!categoryId || !name || Number.isNaN(weightNum)) return;
    if (isAddingSub) return;
    setIsAddingSub(true);
    try {
      await dataService.addSubProduct(categoryId, { name, defaultBagWeight: weightNum, defaultUnit: unit });
      const fresh = await dataService.getCategories({ force: true });
      setCategories(Array.isArray(fresh) ? fresh : []);
      setInlineSubForm({ name: '', defaultBagWeight: '', defaultUnit: 'kg' });
      rebuildProducedForCategory(categoryId);
    } catch (e) {
      console.error('Add sub-product failed', e);
      try { alert('Failed to add sub-product'); } catch {}
    } finally {
      setIsAddingSub(false);
    }
  };

  const setProductMode = (index, mode) => {
    setProducedProducts(prev => prev.map((p, i) => i === index ? { ...p, mode } : p));
  };

  const handleProductField = (index, patch) => {
    setProducedProducts(prev => prev.map((p, i) => i === index ? { ...p, ...patch } : p));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    // Basic client-side validation
    if (!formData.productCategory) {
      try { alert('Please select a product category.'); } catch {}
      return;
    }
    const hasProducts = Array.isArray(producedProducts) && producedProducts.length > 0;
    if (!hasProducts) {
      try { alert('This category has no sub-products yet. Please add one below before submitting.'); } catch {}
      return;
    }
    if (!formData.supplierOfRawMaterial) {
      try { alert('Please select a supplier of raw material.'); } catch {}
      return;
    }
    if (!suppliers.find(s => String(s.id) === String(formData.supplierOfRawMaterial))) {
      try { alert('Selected supplier no longer exists. Please pick another.'); } catch {}
      return;
    }
    const anyPositive = producedProducts.some(p => {
      if (p.mode === 'bags') return parseFloat(p.bags) > 0;
      if (p.mode === 'kg') return parseFloat(p.kg) > 0;
      if (p.mode === 'tonne') return parseFloat(p.tonne) > 0;
      return false;
    });
    if (!anyPositive) {
      try { alert('Enter a positive quantity for at least one produced sub-product.'); } catch {}
      return;
    }
    setIsSubmitting(true);
    const enrichedProducts = producedProducts.map(p => {
      let quantityKg = 0;
      if (p.mode === 'bags') {
        const perBagKg = p.bagUnit === 'tonne' ? (parseFloat(p.bagWeight) || 0) * 1000 : (parseFloat(p.bagWeight) || 0);
        quantityKg = (parseFloat(p.bags) || 0) * perBagKg;
      } else if (p.mode === 'kg') {
        quantityKg = parseFloat(p.kg) || 0;
      } else if (p.mode === 'tonne') {
        quantityKg = (parseFloat(p.tonne) || 0) * 1000;
      }
      return { ...p, quantityKg };
    });
    const rawUsedKg = unitToKg(formData.rawMaterialUsed, formData.rawMaterialUnit);
    const totalProducedKg = enrichedProducts.reduce((s,p)=> s + (p.quantityKg||0), 0);
    const lossKg = Math.max(0, rawUsedKg - totalProducedKg);
    const yieldPercent = rawUsedKg > 0 ? (totalProducedKg / rawUsedKg) * 100 : 0;

    const submissionData = {
      ...formData,
      rawMaterialUsedKg: rawUsedKg, // legacy/backward
      rawUsedKg, // canonical
      workers: (parseFloat(formData.numMaleWorkers)||0) + (parseFloat(formData.numFemaleWorkers)||0),
      producedProducts: enrichedProducts,
      totalProducedKg,
      lossKg,
      yieldPercent,
      hammerChanges: parseFloat(formData.hammerChanges)||0,
      knifeChanges: parseFloat(formData.knifeChanges)||0,
      dieselUsedLiters: parseFloat(formData.dieselUsedLiters)||0,
    };

    try {
      await dataService.addProduction(submissionData);
      // Clear form after success
      setFormData({
        processingDate: formData.processingDate, // keep date
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
      setProducedProducts([]);
    } catch (e) {
      console.error('Failed to save daily processing', e);
      try { alert(`Failed to submit: ${e?.message || 'Unknown error'}`); } catch {}
    } finally {
      setIsSubmitting(false);
    }
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
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Raw Material Used */}
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
                {getSupplierUnitOptions().map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Product Category */}
          <div>
            <label htmlFor="productCategory" className="block text-sm font-medium text-secondary-blue mb-2">
              Product Category Being Made
            </label>
            {isLoadingCategories ? (
                <select id="productCategory" className="form-select-mica" disabled>
                  <option>Loading...</option>
                </select>
              ) : (
            <select
              id="productCategory"
              className="form-select-mica"
              value={formData.productCategory}
              onChange={(e) => handleInputChange('productCategory', e.target.value)}
              required
            >
              <option value="">Select Product Category</option>
              {categories.map(category => (
                <option key={category.id} value={`${category.id}`}>
                  {category.name}
                </option>
              ))}
            </select>)}
            {/* Inline sub-product creation when category has no sub-products */}
            {formData.productCategory && (categories.find(c => String(c.id) === String(formData.productCategory))?.subProducts?.length === 0) && (
              <div className="mt-4 p-4 border border-dashed border-primary-orange/40 rounded bg-primary-orange/5">
                <p className="text-sm text-secondary-blue mb-2">No sub-products defined for this category. Add one to start logging production.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    className="form-input-mica"
                    placeholder="Sub-product name (e.g., 12+ Mesh)"
                    value={inlineSubForm.name}
                    onChange={(e)=>setInlineSubForm(prev=>({ ...prev, name: e.target.value }))}
                  />
                  <input
                    type="number"
                    className="form-input-mica"
                    placeholder="Default bag weight"
                    min="0"
                    step="0.01"
                    value={inlineSubForm.defaultBagWeight}
                    onChange={(e)=>setInlineSubForm(prev=>({ ...prev, defaultBagWeight: e.target.value }))}
                  />
                  <select
                    className="form-select-mica"
                    value={inlineSubForm.defaultUnit}
                    onChange={(e)=>setInlineSubForm(prev=>({ ...prev, defaultUnit: e.target.value }))}
                  >
                    <option value="kg">kg</option>
                    <option value="tonne">tonne</option>
                  </select>
                </div>
                <div className="mt-3">
                  <button type="button" onClick={handleAddInlineSub} disabled={isAddingSub} className={`btn-secondary-mica flex items-center gap-2 ${isAddingSub ? 'opacity-70 cursor-not-allowed' : ''}`}>
                    {isAddingSub && <InlineSpinner size={14} />}
                    {isAddingSub ? 'Adding…' : 'Add Sub-Product'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Produced Products Section - Dynamic based on selected category */}
          {producedProducts.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-secondary-blue mb-2">Produced Products</h3>
              <div className="space-y-4">
                {producedProducts.map((product, index) => (
                  <div key={product.id} className="p-4 border border-light-gray-border rounded-lg">
                    <div className="mb-3">
                      <h4 className="text-sm font-semibold text-secondary-blue">{product.name}</h4>
                      <p className="text-xs text-body">Default bag: {product.bagWeight} {product.bagUnit}</p>
                    </div>

                    {/* Entry mode selector */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      <button
                        type="button"
                        className={`px-3 py-1 rounded-full text-xs border ${product.mode === 'bags' ? 'bg-primary text-white border-primary' : 'bg-white-bg text-secondary-blue border-light-gray-border'}`}
                        onClick={() => setProductMode(index, 'bags')}
                      >
                        Bags ({product.bagWeight} {product.bagUnit})
                      </button>
                      <button
                        type="button"
                        className={`px-3 py-1 rounded-full text-xs border ${product.mode === 'kg' ? 'bg-primary text-white border-primary' : 'bg-white-bg text-secondary-blue border-light-gray-border'}`}
                        onClick={() => setProductMode(index, 'kg')}
                      >
                        kg
                      </button>
                      <button
                        type="button"
                        className={`px-3 py-1 rounded-full text-xs border ${product.mode === 'tonne' ? 'bg-primary text-white border-primary' : 'bg-white-bg text-secondary-blue border-light-gray-border'}`}
                        onClick={() => setProductMode(index, 'tonne')}
                      >
                        tonne
                      </button>
                    </div>

                    {/* Inputs per mode */}
                    {product.mode === 'bags' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        <div>
                          <label className="block text-sm font-medium text-secondary-blue mb-2">Number of bags</label>
                          <input
                            type="number"
                            className="form-input-mica"
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                            value={product.bags}
                            onChange={(e) => handleProductField(index, { bags: e.target.value })}
                            required
                          />
                        </div>
                        <div className="self-end text-sm text-body">
                          {(() => {
                            const perBagKg = product.bagUnit === 'tonne' ? (parseFloat(product.bagWeight) || 0) * 1000 : (parseFloat(product.bagWeight) || 0);
                            const approxKg = (parseFloat(product.bags || '0') * perBagKg).toFixed(2);
                            return <>Approx. total = {approxKg} kg</>;
                          })()}
                        </div>
                      </div>
                    )}

                    {product.mode === 'kg' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        <div>
                          <label className="block text-sm font-medium text-secondary-blue mb-2">Quantity (kg)</label>
                          <input
                            type="number"
                            className="form-input-mica"
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                            value={product.kg}
                            onChange={(e) => handleProductField(index, { kg: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                    )}

                    {product.mode === 'tonne' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        <div>
                          <label className="block text-sm font-medium text-secondary-blue mb-2">Quantity (tonne)</label>
                          <input
                            type="number"
                            className="form-input-mica"
                            placeholder="0.000"
                            step="0.001"
                            min="0"
                            value={product.tonne}
                            onChange={(e) => handleProductField(index, { tonne: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                    )}
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

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3 pt-2 border-t border-light-gray-border mt-4">
            <button
              type="button"
              className="btn-secondary-mica"
              onClick={() => {
                setFormData({
                  processingDate: todayStr,
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
                setProducedProducts([]);
              }}
            >
              Clear Form
            </button>
            <button type="submit" disabled={isSubmitting} className={`btn-primary-mica flex items-center gap-2 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}>
              {isSubmitting && <InlineSpinner size={16} />}
              {isSubmitting ? 'Saving...' : 'Submit Daily Log'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DailyProcessing;
