import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Plus } from 'lucide-react';
import { dataService } from '../services/dataService';
import InlineSpinner from '../components/InlineSpinner';

const unitToKg = (qty, unit) => {
  const u = String(unit || '').toLowerCase();
  if (u === 'tonne' || u === 'tonnes' || u === 't') return (parseFloat(qty) || 0) * 1000;
  const m = u.match(/^(\d+(?:\.[\d]+)?)\s*kg$/) || u.match(/^(\d+(?:\.[\d]+)?)kg$/);
  if (m) return (parseFloat(qty) || 0) * parseFloat(m[1]);
  return parseFloat(qty) || 0;
};

const RawMaterialPurchase = () => {
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [formData, setFormData] = useState({
    purchaseDate: todayStr,
    supplierId: '',
    supplierName: '',
    quantity: '',
    unit: 'kg',
    unitPrice: '',
    totalAmount: '',
    invoiceNumber: '',
    notes: ''
  });

  const [suppliers, setSuppliers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const s = await dataService.getSuppliers();
        if (mounted) setSuppliers(Array.isArray(s) ? s : []);
      } catch { if (mounted) setSuppliers([]); }
    })();
    return () => { mounted = false; };
  }, []);

  const getSupplierUnitOptions = () => {
    // Allow kg, tonne and supplier bag size if available (e.g., 50kg)
    const opts = new Set(['kg', 'tonne']);
    const sel = suppliers.find(s => s.id === formData.supplierId);
    if (sel) {
      const w = sel.defaultBagWeight;
      const u = String(sel.defaultUnit || 'kg').toLowerCase();
      if (Number.isFinite(Number(w)) && (u === 'kg' || u === 'tonne')) {
        if (u === 'kg') opts.add(`${w}kg`);
        if (u === 'tonne') opts.add(`${w * 1000}kg`); // represent as kg denomination
      } else {
        // legacy '50kg' stored in unit
        const m = u.match(/^(\d+(?:\.[\d]+)?)\s*kg$/) || u.match(/^(\d+(?:\.[\d]+)?)kg$/);
        if (m) opts.add(`${parseFloat(m[1])}kg`);
      }
    }
    return Array.from(opts);
  };

  const unitOptions = getSupplierUnitOptions();

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };

      if (field === 'supplierId') {
        const sel = suppliers.find(s => s.id === value);
        if (sel) {
          updated.supplierName = sel.name || '';
          // Prefer explicit bag spec over plain unit
          const w = sel.defaultBagWeight;
          const u = String(sel.defaultUnit || 'kg').toLowerCase();
          if (Number.isFinite(Number(w))) {
            updated.unit = u === 'kg' ? `${w}kg` : u === 'tonne' ? `${w * 1000}kg` : 'kg';
          } else {
            updated.unit = sel.defaultUnit || 'kg';
          }
        }
      }

      // Auto-calc total
      if (field === 'quantity' || field === 'unitPrice') {
        const qty = parseFloat(updated.quantity) || 0;
        const price = parseFloat(updated.unitPrice) || 0;
        updated.totalAmount = (qty * price).toFixed(2);
      }
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    const quantityKg = unitToKg(formData.quantity, formData.unit);
    try {
      await dataService.addPurchase({
        ...formData,
        quantityKg
      });
      setFormData({
        purchaseDate: formData.purchaseDate, // keep date
        supplierId: '',
        supplierName: '',
        quantity: '',
        unit: 'kg',
        unitPrice: '',
        totalAmount: '',
        invoiceNumber: '',
        notes: ''
      });
    } catch (err) {
      console.error('Failed to save purchase', err);
    } finally {
      setIsSubmitting(false);
    }
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
                  <label htmlFor="supplierId" className="block text-sm font-medium text-secondary-blue mb-2">
                    Supplier Name
                  </label>
                  <div className="flex gap-2">
                    <select
                      id="supplierId"
                      className="form-select-mica flex-1"
                      value={formData.supplierId}
                      onChange={(e) => handleInputChange('supplierId', e.target.value)}
                      required
                    >
                      <option value="">Select Supplier</option>
                      {suppliers.map(supplier => (
                        <option key={supplier.id} value={supplier.id}>
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
                    supplierId: '',
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
                <button type="submit" disabled={isSubmitting} className={`btn-primary-mica flex items-center gap-2 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}>
                  {isSubmitting && <InlineSpinner size={16} />}
                  {isSubmitting ? 'Saving...' : 'Add Purchase'}
                </button>
              </div>
            </form>
          </div>
    </div>
  );
};

export default RawMaterialPurchase;
