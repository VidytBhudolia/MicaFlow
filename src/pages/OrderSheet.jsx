import React, { useState, useMemo, useEffect } from 'react';
import { Calendar, Plus, Trash2, FileText, Package } from 'lucide-react';
import InlineSpinner from '../components/InlineSpinner';
import { dataService } from '../services/dataService';
import { ordersService, inventoryService } from '../services/firebaseServices';

const OrderSheet = () => {
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [formData, setFormData] = useState({
    orderDate: todayStr,
    customerName: '',
    customerContact: '',
    customerAddress: '',
    deliveryDate: '',
    priority: 'normal',
    notes: ''
  });

  const [orderItems, setOrderItems] = useState([
    { id: 1, categoryId: '', subProductId: '', quantityKg: '', bagWeight: '', bags: '', unit: 'kg', rate: '', amount: 0, availableKg: 0 }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [inventory, setInventory] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [cats, inv] = await Promise.all([
          dataService.getCategories({ force: true }),
          dataService.getInventory({ force: true })
        ]);
        setCategories(Array.isArray(cats) ? cats : []);
        setInventory(Array.isArray(inv) ? inv : []);
      } catch {}
    })();
  }, []);

  const getAvailableKg = (subProductId) => {
    const item = inventory.find(x => x.id === `finished_${subProductId}`);
    return Number(item?.stockKg || 0);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (index, field, value) => {
    setOrderItems(prev => {
      const updated = prev.map((item, i) => {
        if (i === index) {
          const newItem = { ...item, [field]: value };
          // Reset subProduct when category changes
          if (field === 'categoryId') {
            newItem.subProductId = '';
            newItem.availableKg = 0;
            newItem.quantityKg = '';
            newItem.bags = '';
          }
          // On subProduct change, fetch available
          if (field === 'subProductId') {
            newItem.availableKg = getAvailableKg(value);
          }
          // Bags to quantity and vice-versa
          if (field === 'bags') {
            const bw = parseFloat(newItem.bagWeight) || 0;
            const bags = parseFloat(value) || 0;
            newItem.quantityKg = bw > 0 ? (bags * bw).toString() : newItem.quantityKg;
          }
          if (field === 'bagWeight') {
            const bw = parseFloat(value) || 0;
            const bags = parseFloat(newItem.bags) || 0;
            newItem.quantityKg = bw > 0 ? (bags * bw).toString() : newItem.quantityKg;
          }
          // Auto-calculate amount when quantity or rate changes
          if (field === 'quantityKg' || field === 'rate') {
            const qty = parseFloat(field === 'quantityKg' ? value : newItem.quantityKg) || 0;
            const rate = parseFloat(field === 'rate' ? value : newItem.rate) || 0;
            newItem.amount = qty * rate;
          }
          
          return newItem;
        }
        return item;
      });
      return updated;
    });
  };

  const addItem = () => {
    const newId = Math.max(...orderItems.map(item => item.id)) + 1;
    setOrderItems(prev => [
      ...prev,
      { id: newId, categoryId: '', subProductId: '', quantityKg: '', bagWeight: '', bags: '', unit: 'kg', rate: '', amount: 0, availableKg: 0 }
    ]);
  };

  const removeItem = (index) => {
    if (orderItems.length > 1) {
      setOrderItems(prev => prev.filter((_, i) => i !== index));
    }
  };

  const calculateTotal = () => {
    return orderItems.reduce((total, item) => total + (item.amount || 0), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      // Validate availability per line
      for (const it of orderItems) {
        const avail = getAvailableKg(it.subProductId);
        const qty = parseFloat(it.quantityKg) || 0;
        if (qty <= 0 || !it.subProductId) throw new Error('Select a sub-product and enter quantity');
        if (qty > avail) throw new Error(`Insufficient stock for selected sub-product. Have ${avail} kg, need ${qty} kg.`);
      }
      // Create order and deduct inventory transactionally
      const submissionData = {
        ...formData,
        items: orderItems.map(it => ({
          categoryId: it.categoryId,
          subProductId: it.subProductId,
          quantityKg: parseFloat(it.quantityKg) || 0,
          bagWeight: parseFloat(it.bagWeight) || 0,
          bags: parseFloat(it.bags) || 0,
          unit: it.unit,
          rate: parseFloat(it.rate) || 0,
          amount: it.amount || 0
        })),
        totalAmount: calculateTotal()
      };
      await inventoryService.applyOrderFulfillment(submissionData.items);
      await ordersService.addOrder(submissionData);
      // Auto-clear after successful submission
      setFormData({
        orderDate: todayStr,
        customerName: '',
        customerContact: '',
        customerAddress: '',
        deliveryDate: '',
        priority: 'normal',
        notes: ''
      });
      setOrderItems([
        { id: 1, categoryId: '', subProductId: '', quantityKg: '', bagWeight: '', bags: '', unit: 'kg', rate: '', amount: 0, availableKg: 0 }
      ]);
      try { alert('Order sheet created and inventory updated.'); } catch {}
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="order-sheet" className="bg-light-gray-bg min-h-screen">
      <div className="flex items-center gap-3 mb-6">
        <FileText className="w-8 h-8 text-primary-orange" />
        <div>
          <h1 className="text-3xl font-bold text-secondary-blue mb-2">Order Sheet</h1>
          <p className="text-body">Create and manage customer orders</p>
        </div>
      </div>

      <div className="bg-white-bg rounded-lg shadow-md p-6 border border-light-gray-border">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Customer Information */}
              <div>
                <h3 className="text-lg font-semibold text-secondary-blue mb-4">Customer Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="customerName" className="block text-sm font-medium text-secondary-blue mb-2">
                      Customer Name
                    </label>
                    <input
                      type="text"
                      id="customerName"
                      className="form-input-mica"
                      placeholder="Enter customer name"
                      value={formData.customerName}
                      onChange={(e) => handleInputChange('customerName', e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="customerContact" className="block text-sm font-medium text-secondary-blue mb-2">
                      Contact Number
                    </label>
                    <input
                      type="tel"
                      id="customerContact"
                      className="form-input-mica"
                      placeholder="+91-9876543210"
                      value={formData.customerContact}
                      onChange={(e) => handleInputChange('customerContact', e.target.value)}
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="customerAddress" className="block text-sm font-medium text-secondary-blue mb-2">
                      Customer Address
                    </label>
                    <textarea
                      id="customerAddress"
                      className="form-textarea-mica"
                      rows={2}
                      placeholder="Enter complete address"
                      value={formData.customerAddress}
                      onChange={(e) => handleInputChange('customerAddress', e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Order Details */}
              <div>
                <h3 className="text-lg font-semibold text-secondary-blue mb-4">Order Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label htmlFor="orderDate" className="block text-sm font-medium text-secondary-blue mb-2">
                      Order Date
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        id="orderDate"
                        className="form-input-mica"
                        value={formData.orderDate}
                        onChange={(e) => handleInputChange('orderDate', e.target.value)}
                        required
                      />
                      <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-body w-5 h-5 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="deliveryDate" className="block text-sm font-medium text-secondary-blue mb-2">
                      Delivery Date
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        id="deliveryDate"
                        className="form-input-mica"
                        value={formData.deliveryDate}
                        onChange={(e) => handleInputChange('deliveryDate', e.target.value)}
                        required
                      />
                      <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-body w-5 h-5 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="priority" className="block text-sm font-medium text-secondary-blue mb-2">
                      Priority
                    </label>
                    <select
                      id="priority"
                      className="form-select"
                      value={formData.priority}
                      onChange={(e) => handleInputChange('priority', e.target.value)}
                    >
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-secondary-blue">Order Items</h3>
                  <button
                    type="button"
                    onClick={addItem}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Item
                  </button>
                </div>

                <div className="space-y-4">
                  {orderItems.map((item, index) => (
                    <div key={item.id} className="border border-light-gray-border rounded-lg p-4 bg-white-bg">
                      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                        <div>
                          <label className="block text-sm font-medium text-secondary-blue mb-2">Category</label>
                          <select className="form-select" value={item.categoryId} onChange={(e)=>handleItemChange(index,'categoryId',e.target.value)} required>
                            <option value="">Select</option>
                            {categories.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-secondary-blue mb-2">Sub-Product</label>
                          <select className="form-select" value={item.subProductId} onChange={(e)=>handleItemChange(index,'subProductId',e.target.value)} required>
                            <option value="">Select</option>
                            {(categories.find(c=>String(c.id)===String(item.categoryId))?.subProducts||[]).map(sp => (<option key={sp.id} value={sp.id}>{sp.name}</option>))}
                          </select>
                          {item.subProductId && (
                            <div className="mt-1 text-xs text-body flex items-center gap-1"><Package className="w-3 h-3"/> Available: <span className="font-medium text-secondary-blue">{getAvailableKg(item.subProductId).toLocaleString()} kg</span></div>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-secondary-blue mb-2">
                            Quantity
                          </label>
                          <input
                            type="number"
                            className="form-input-mica"
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                            value={item.quantityKg}
                            onChange={(e) => handleItemChange(index, 'quantityKg', e.target.value)}
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-secondary-blue mb-2">
                            Bag Weight (kg)
                          </label>
                          <input type="number" className="form-input-mica" placeholder="e.g., 50" step="0.01" min="0" value={item.bagWeight} onChange={(e)=>handleItemChange(index,'bagWeight',e.target.value)} />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-secondary-blue mb-2">
                            Bags
                          </label>
                          <input type="number" className="form-input-mica" placeholder="e.g., 20" step="1" min="0" value={item.bags} onChange={(e)=>handleItemChange(index,'bags',e.target.value)} />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-secondary-blue mb-2">
                            Rate (₹/kg)
                          </label>
                          <input
                            type="number"
                            className="form-input-mica"
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                            value={item.rate}
                            onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-secondary-blue mb-2">
                            Amount (₹)
                          </label>
                          <div className="w-full px-3 py-2 border border-light-gray-border rounded-md bg-light-gray-bg text-body">
                            {item.amount.toFixed(2)}
                          </div>
                        </div>

                        <div>
                          {orderItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg border border-light-gray-border"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="flex justify-end mt-4">
                  <div className="bg-primary-orange/5 border border-primary-orange/20 rounded-lg p-4">
                    <div className="text-right">
                      <p className="text-sm text-body">Total Amount</p>
                      <p className="text-2xl font-bold text-primary-orange">₹{calculateTotal().toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-secondary-blue mb-2">
                  Order Notes (Optional)
                </label>
                <textarea
                  id="notes"
                  className="form-textarea-mica"
                  rows={3}
                  placeholder="Special instructions, delivery notes, etc."
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setFormData({
                      orderDate: todayStr,
                      customerName: '',
                      customerContact: '',
                      customerAddress: '',
                      deliveryDate: '',
                      priority: 'normal',
                      notes: ''
                    });
                    setOrderItems([
                      { id: 1, categoryId: '', subProductId: '', quantityKg: '', bagWeight: '', bags: '', unit: 'kg', rate: '', amount: 0, availableKg: 0 }
                    ]);
                  }}
                >
                  Clear Form
                </button>
                <button type="submit" disabled={isSubmitting} className={`btn-primary flex items-center gap-2 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}>
                  {isSubmitting && <InlineSpinner size={16} />}
                  {isSubmitting ? 'Saving...' : 'Create Order Sheet'}
                </button>
              </div>
            </form>
          </div>
    </div>
  );
};

export default OrderSheet;
