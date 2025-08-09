import React, { useState, useEffect } from 'react';
import { Settings, Plus, Edit, Trash2, Search, ChevronRight, ChevronDown, RefreshCw, List, Wrench } from 'lucide-react';
import { dataService } from '../services/dataService';

// Helper to generate unique IDs reliably
const getUUID = () => (window.crypto?.randomUUID ? window.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);
// Helper to make a slug from category names (for potential Firestore ID uniqueness later)
const slugify = (str = '') => str.trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');

const Management = () => {
  const [activeTab, setActiveTab] = useState('suppliers');
  // Buyers Management State
  const [buyers, setBuyers] = useState([]);
  const [isBuyerFormOpen, setIsBuyerFormOpen] = useState(false);
  const [editingBuyer, setEditingBuyer] = useState(null);
  const [buyerSearchTerm, setBuyerSearchTerm] = useState('');
  const [buyerFormData, setBuyerFormData] = useState({
    name: '',
    contactPerson: '',
    phoneNumber: '',
    email: '',
    address: ''
  });

  // Supplier Management State
  const [suppliers, setSuppliers] = useState([]);
  const [isSupplierFormOpen, setIsSupplierFormOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [supplierSearchTerm, setSupplierSearchTerm] = useState('');
  const [supplierFormData, setSupplierFormData] = useState({
    name: '',
    contactPerson: '',
    phoneNumber: '',
    email: '',
    address: '',
    // Default raw material bag spec
    defaultBagWeight: '',
    defaultUnit: 'kg'
  });

  // Categories Management State
  const [categories, setCategories] = useState([]);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({ name: '' });
  const [subProductForm, setSubProductForm] = useState({
    categoryId: null,
    name: '',
    defaultBagWeight: '',
    defaultUnit: 'kg'
  });
  const [showSubProductForm, setShowSubProductForm] = useState(false);
  // New: loading/error for adding category
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [addCategoryError, setAddCategoryError] = useState('');

  // Category rename & sub-product edit modals
  const [isCategoryEditOpen, setIsCategoryEditOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryEditName, setCategoryEditName] = useState('');
  const [isSubProductEditOpen, setIsSubProductEditOpen] = useState(false);
  const [editingSubProduct, setEditingSubProduct] = useState(null);
  const [subProductEditForm, setSubProductEditForm] = useState({ name: '', defaultBagWeight: '', defaultUnit: 'kg' });

  // Confirm modal state
  const [confirmConfig, setConfirmConfig] = useState({ open: false, title: '', message: '', onConfirm: null });
  const openConfirm = (title, message, onConfirm) => setConfirmConfig({ open: true, title, message, onConfirm });
  const closeConfirm = () => setConfirmConfig({ open: false, title: '', message: '', onConfirm: null });

  // New: loading states
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(false);

  // Load suppliers & categories from dataService (supports async/remote)
  useEffect(() => {
    let mounted = true;
    let categoryAttempts = 0;

    const loadSuppliers = async () => {
      setIsLoadingSuppliers(true);
      try {
        const s = await dataService.getSuppliers();
        if (mounted) setSuppliers(Array.isArray(s) ? s : []);
      } catch { if (mounted) setSuppliers([]); }
      finally { if (mounted) setIsLoadingSuppliers(false); }
    };

    const loadCategories = async (force = false) => {
      if (!mounted) return;
      setIsLoadingCategories(true);
      try {
        const c = await dataService.getCategories(force ? { force: true } : {});
        if (mounted) setCategories(Array.isArray(c) ? c : []);
        if (mounted && (!c || c.length === 0) && categoryAttempts < 2) {
          categoryAttempts += 1;
          // Retry once after short delay (covers auth becoming ready just after first call)
          setTimeout(() => loadCategories(true), 600);
        }
      } catch {
        if (mounted) setCategories([]);
      } finally {
        if (mounted) setIsLoadingCategories(false);
      }
    };

    const loadBuyers = async () => {
      try { const b = await dataService.getBuyers?.(); if (mounted) setBuyers(Array.isArray(b)?b:[]); } catch { if (mounted) setBuyers([]); }
    };

    loadSuppliers();
    loadCategories(false);
    loadBuyers();
    return () => { mounted = false; };
  }, []);

  // When switching back to Categories tab, if list still empty and not currently loading, fetch once.
  useEffect(() => {
    if (activeTab === 'categories' && categories.length === 0 && !isLoadingCategories) {
      dataService.getCategories({ force: true }).then(c => setCategories(Array.isArray(c) ? c : [])).catch(()=>{});
    }
  }, [activeTab]);

  // New: persist via dataService on change
  useEffect(() => {
    try { dataService.setSuppliers(suppliers); } catch {}
  }, [suppliers]);
  useEffect(() => {
    try { dataService.setCategories(categories); } catch {}
  }, [categories]);

  // Buyer Management Functions
  const resetBuyerForm = () => {
    setBuyerFormData({ name:'', contactPerson:'', phoneNumber:'', email:'', address:'' });
    setEditingBuyer(null); setIsBuyerFormOpen(false);
  };
  const handleBuyerInputChange = (field, value) => setBuyerFormData(prev=>({...prev,[field]:value}));
  const handleBuyerSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...buyerFormData };
      if (editingBuyer) {
        await dataService.updateBuyer(editingBuyer.id, payload);
        setBuyers(prev => prev.map(b => b.id === editingBuyer.id ? { ...b, ...payload } : b));
      } else {
        const created = await dataService.addBuyer(payload);
        setBuyers(prev => [...prev, created]);
      }
      resetBuyerForm();
    } catch (err) { console.error('Save buyer failed', err); try { alert('Failed to save buyer'); } catch {} }
  };
  const handleBuyerEdit = (buyer) => { setEditingBuyer(buyer); setBuyerFormData({ name:buyer.name||'', contactPerson:buyer.contactPerson||'', phoneNumber:buyer.phoneNumber||'', email:buyer.email||'', address:buyer.address||'' }); setIsBuyerFormOpen(true); };
  const handleBuyerDelete = (buyerId) => {
    openConfirm('Delete Buyer','Are you sure you want to delete this buyer?', async () => { try { await dataService.deleteBuyer(buyerId); setBuyers(prev=>prev.filter(b=>b.id!==buyerId)); } finally { closeConfirm(); } });
  };
  const filteredBuyers = buyers.filter(b => (b.name||'').toLowerCase().includes(buyerSearchTerm.toLowerCase()) || (b.contactPerson||'').toLowerCase().includes(buyerSearchTerm.toLowerCase()));

  // Supplier Management Functions
  const handleSupplierSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...supplierFormData };
      // Coerce weight to number when present
      if (payload.defaultBagWeight !== '' && payload.defaultBagWeight !== undefined) {
        payload.defaultBagWeight = parseFloat(payload.defaultBagWeight);
      }
      if (editingSupplier) {
        const updated = { ...payload, id: editingSupplier.id };
        await dataService.updateSupplier(editingSupplier.id, updated);
        setSuppliers(prev => prev.map(s => s.id === editingSupplier.id ? updated : s));
      } else {
        const created = await dataService.addSupplier(payload);
        setSuppliers(prev => [...prev, created]);
      }
      resetSupplierForm();
    } catch (error) {
      console.error('Error saving supplier:', error);
      try { alert(`Failed to save supplier: ${error?.message || 'Unknown error'}`); } catch {}
    }
  };

  const handleSupplierEdit = (supplier) => {
    setEditingSupplier(supplier);
    setSupplierFormData({
      name: supplier.name || '',
      contactPerson: supplier.contactPerson || '',
      phoneNumber: supplier.phoneNumber || '',
      email: supplier.email || '',
      address: supplier.address || '',
      defaultBagWeight: supplier.defaultBagWeight ?? // prefer normalized field
        (() => {
          // fallback: parse like '50kg'
          const u = String(supplier.defaultUnit || '').toLowerCase();
          const m = u.match(/^(\d+(?:\.\d+)?)\s*kg$/) || u.match(/^(\d+(?:\.\d+)?)kg$/);
          return m ? parseFloat(m[1]) : '';
        })(),
      defaultUnit: (String(supplier.defaultUnit || 'kg').toLowerCase().includes('tonne') ? 'tonne' : 'kg')
    });
    setIsSupplierFormOpen(true);
  };

  const handleSupplierDelete = async (supplierId) => {
    openConfirm(
      'Delete Supplier',
      'Are you sure you want to delete this supplier?',
      async () => {
        try {
          await dataService.deleteSupplier(supplierId);
          setSuppliers(prev => prev.filter(supplier => supplier.id !== supplierId));
        } catch (error) {
          console.error('Error deleting supplier:', error);
        } finally { closeConfirm(); }
      }
    );
  };

  const resetSupplierForm = () => {
    setSupplierFormData({
      name: '',
      contactPerson: '',
      phoneNumber: '',
      email: '',
      address: '',
      defaultBagWeight: '',
      defaultUnit: 'kg'
    });
    setEditingSupplier(null);
    setIsSupplierFormOpen(false);
  };

  const handleSupplierInputChange = (field, value) => {
    setSupplierFormData(prev => ({ ...prev, [field]: value }));
  };

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name?.toLowerCase().includes(supplierSearchTerm.toLowerCase()) ||
    supplier.contactPerson?.toLowerCase().includes(supplierSearchTerm.toLowerCase())
  );

  const supplierDefaultDisplay = (s) => {
    const w = s.defaultBagWeight;
    const u = String(s.defaultUnit || 'kg');
    if (w && Number.isFinite(Number(w))) return `${w} ${u}`;
    // fallback for legacy '50kg'
    const m = String(u).toLowerCase().match(/^(\d+(?:\.\d+)?)\s*kg$/) || String(u).toLowerCase().match(/^(\d+(?:\.\d+)?)kg$/);
    if (m) return `${m[1]} kg`;
    return u;
  };

  // Categories Management Functions
  const handleAddCategory = async () => {
    const name = categoryForm.name.trim();
    if (!name) {
      setAddCategoryError('Please enter a category name.');
      return;
    }
    // Duplicate (case-insensitive) check (acts as simple uniqueness constraint)
    const exists = categories.some(c => (c.name || '').trim().toLowerCase() === name.toLowerCase());
    if (exists) {
      setAddCategoryError('Category name already exists.');
      return;
    }
    setAddCategoryError('');
    setIsAddingCategory(true);
    try {
      // NOTE: if we later want Firestore-level uniqueness, we can create with a fixed ID = slugify(name)
      const created = await dataService.addCategory(name);
      setCategories(prev => [...prev, created]);
      setCategoryForm({ name: '' });
    } catch (error) {
      console.error('Error adding category:', error);
      setAddCategoryError(error?.message || 'Failed to add category. Check console for details.');
      try { alert(`Add Category failed: ${error?.message || 'Unknown error'}`); } catch {}
    } finally {
      setIsAddingCategory(false);
    }
  };

  const handleDeleteCategory = (categoryId) => {
    openConfirm(
      'Delete Category',
      'Are you sure you want to delete this category and all its sub-products?',
      async () => {
        await dataService.deleteCategory(categoryId);
        setCategories(prev => prev.filter(cat => cat.id !== categoryId));
        closeConfirm();
      }
    );
  };

  const handleAddSubProduct = async () => {
    if (subProductForm.name.trim() && subProductForm.defaultBagWeight) {
      const payload = {
        name: subProductForm.name.trim(),
        defaultBagWeight: parseFloat(subProductForm.defaultBagWeight),
        defaultUnit: subProductForm.defaultUnit
      };
      const created = await dataService.addSubProduct(subProductForm.categoryId, payload);
      setCategories(prev => prev.map(category => 
        category.id === subProductForm.categoryId 
          ? { ...category, subProducts: [...category.subProducts, created] }
          : category
      ));
      setSubProductForm({ categoryId: null, name: '', defaultBagWeight: '', defaultUnit: 'kg' });
      setShowSubProductForm(false);
    }
  };

  const handleDeleteSubProduct = (categoryId, subProductId) => {
    openConfirm(
      'Delete Sub-Product',
      'Are you sure you want to delete this sub-product?',
      async () => {
        await dataService.deleteSubProduct(categoryId, subProductId);
        setCategories(prev => prev.map(category => 
          category.id === categoryId 
            ? { ...category, subProducts: category.subProducts.filter(sub => sub.id !== subProductId) }
            : category
        ));
        closeConfirm();
      }
    );
  };

  // New: Handlers for category rename
  const openCategoryEdit = (category) => {
    setEditingCategory(category);
    setCategoryEditName(category.name);
    setIsCategoryEditOpen(true);
  };

  const handleUpdateCategoryName = async () => {
    const name = categoryEditName.trim();
    if (!name || !editingCategory) return;
    await dataService.updateCategoryName(editingCategory.id, name);
    setCategories(prev => prev.map(cat => (cat.id === editingCategory.id ? { ...cat, name } : cat)));
    setIsCategoryEditOpen(false);
    setEditingCategory(null);
    setCategoryEditName('');
  };

  const closeCategoryEdit = () => {
    setIsCategoryEditOpen(false);
    setEditingCategory(null);
    setCategoryEditName('');
  };

  // New: Handlers for sub-product edit
  const openSubProductEdit = (categoryId, subProduct) => {
    setEditingSubProduct({ categoryId, id: subProduct.id });
    setSubProductEditForm({
      name: subProduct.name || '',
      defaultBagWeight: subProduct.defaultBagWeight !== undefined ? String(subProduct.defaultBagWeight) : '',
      defaultUnit: subProduct.defaultUnit || 'kg',
    });
    setIsSubProductEditOpen(true);
  };

  const handleUpdateSubProduct = async () => {
    if (!editingSubProduct) return;
    const name = subProductEditForm.name.trim();
    const weightNum = parseFloat(subProductEditForm.defaultBagWeight);
    if (!name || Number.isNaN(weightNum)) return;

    await dataService.updateSubProduct(editingSubProduct.categoryId, editingSubProduct.id, { name, defaultBagWeight: weightNum, defaultUnit: subProductEditForm.defaultUnit });

    setCategories(prev => prev.map(cat =>
      cat.id === editingSubProduct.categoryId
        ? {
            ...cat,
            subProducts: cat.subProducts.map(sp =>
              sp.id === editingSubProduct.id
                ? { ...sp, name, defaultBagWeight: weightNum, defaultUnit: subProductEditForm.defaultUnit }
                : sp
            ),
          }
        : cat
    ));
    setIsSubProductEditOpen(false);
    setEditingSubProduct(null);
    setSubProductEditForm({ name: '', defaultBagWeight: '', defaultUnit: 'kg' });
  };

  const closeSubProductEdit = () => {
    setIsSubProductEditOpen(false);
    setEditingSubProduct(null);
    setSubProductEditForm({ name: '', defaultBagWeight: '', defaultUnit: 'kg' });
  };

  const Spinner = () => (
    <span className="inline-block w-4 h-4 border-2 border-primary-orange border-t-transparent rounded-full animate-spin align-middle" aria-label="Loading" />
  );

  const renderSuppliersTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-secondary-blue">Supplier Management</h3>
          <p className="text-body">Manage your mica suppliers and their information</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={async () => {
              const fresh = await dataService.refresh('suppliers');
              setSuppliers(Array.isArray(fresh) ? fresh : []);
            }}
            className="btn-secondary-mica flex items-center gap-2"
            title="Refresh suppliers from server"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={() => setIsSupplierFormOpen(true)}
            className="btn-primary-mica flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Supplier</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white-bg rounded-lg shadow-md p-6 border border-light-gray-border">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-body w-4 h-4" />
          <input
            type="text"
            placeholder="Search suppliers..."
            value={supplierSearchTerm}
            onChange={(e) => setSupplierSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-light-gray-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-orange focus:border-transparent bg-white-bg text-secondary-blue"
          />
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="bg-white-bg rounded-lg shadow-md overflow-hidden border border-light-gray-border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-light-gray-bg">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-body uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-body uppercase tracking-wider">Contact Person</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-body uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-body uppercase tracking-wider">Default Raw Unit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-body uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white-bg divide-y divide-light-gray-border">
              {filteredSuppliers.map((supplier) => (
                <tr key={supplier.id || Math.random()}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-secondary-blue">{supplier.name}</div>
                      <div className="text-sm text-body">{supplier.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-blue">{supplier.contactPerson}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-blue">{supplier.phoneNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-blue">{supplierDefaultDisplay(supplier)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleSupplierEdit(supplier)}
                      className="text-secondary-blue hover:text-primary-orange mr-4"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleSupplierDelete(supplier.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Supplier Modal */}
      {isSupplierFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white-bg rounded-lg p-6 w-full max-w-md border border-light-gray-border">
            <h2 className="text-xl font-semibold text-secondary-blue mb-4">
              {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
            </h2>
            <form onSubmit={handleSupplierSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-blue mb-2">
                  Supplier Name
                </label>
                <input
                  type="text"
                  className="form-input-mica"
                  value={supplierFormData.name}
                  onChange={(e) => handleSupplierInputChange('name', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-blue mb-2">
                  Contact Person
                </label>
                <input
                  type="text"
                  className="form-input-mica"
                  value={supplierFormData.contactPerson}
                  onChange={(e) => handleSupplierInputChange('contactPerson', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-blue mb-2">
                  Phone Number
                </label>
                <input
                  type="text"
                  className="form-input-mica"
                  value={supplierFormData.phoneNumber}
                  onChange={(e) => handleSupplierInputChange('phoneNumber', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-blue mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  className="form-input-mica"
                  value={supplierFormData.email}
                  onChange={(e) => handleSupplierInputChange('email', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-blue mb-2">
                  Address
                </label>
                <textarea
                  className="form-textarea-mica"
                  rows={3}
                  value={supplierFormData.address}
                  onChange={(e) => handleSupplierInputChange('address', e.target.value)}
                />
              </div>

              {/* New: Default raw material bag specification */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-secondary-blue mb-2">Default Bag Weight</label>
                  <input
                    type="number"
                    className="form-input-mica"
                    placeholder="e.g., 50"
                    min="0"
                    step="0.01"
                    value={supplierFormData.defaultBagWeight}
                    onChange={(e) => handleSupplierInputChange('defaultBagWeight', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-blue mb-2">Unit</label>
                  <select
                    className="form-select-mica"
                    value={supplierFormData.defaultUnit}
                    onChange={(e) => handleSupplierInputChange('defaultUnit', e.target.value)}
                    required
                  >
                    <option value="kg">kg</option>
                    <option value="tonne">tonne</option>
                  </select>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button type="submit" className="btn-primary-mica flex-1">
                  {editingSupplier ? 'Update' : 'Add'} Supplier
                </button>
                <button
                  type="button"
                  onClick={resetSupplierForm}
                  className="btn-secondary-mica flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  const renderBuyersTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-secondary-blue">Buyer Management</h3>
          <p className="text-body">Manage customers / buyers for orders</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={async ()=>{ const fresh = await dataService.getBuyers?.({ force:true }); setBuyers(Array.isArray(fresh)?fresh:[]); }}
            className="btn-secondary-mica flex items-center gap-2"
            title="Refresh buyers from server"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button onClick={()=>setIsBuyerFormOpen(true)} className="btn-primary-mica flex items-center gap-2"><Plus className="w-4 h-4"/>Add Buyer</button>
        </div>
      </div>
      <div className="bg-white-bg rounded-lg shadow-md p-6 border border-light-gray-border">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-body w-4 h-4" />
            <input value={buyerSearchTerm} onChange={e=>setBuyerSearchTerm(e.target.value)} placeholder="Search buyers..." className="w-full pl-10 pr-4 py-2 border border-light-gray-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-orange bg-white-bg text-secondary-blue" />
        </div>
      </div>
      <div className="bg-white-bg rounded-lg shadow-md overflow-hidden border border-light-gray-border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-light-gray-bg">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-body uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-body uppercase tracking-wider">Contact Person</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-body uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-body uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-body uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white-bg divide-y divide-light-gray-border">
              {filteredBuyers.map(buyer => (
                <tr key={buyer.id || Math.random()}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-secondary-blue">{buyer.name}</div>
                      <div className="text-sm text-body">{buyer.address}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-blue">{buyer.contactPerson}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-blue">{buyer.phoneNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-blue">{buyer.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onClick={()=>handleBuyerEdit(buyer)} className="text-secondary-blue hover:text-primary-orange mr-4"><Edit className="w-4 h-4"/></button>
                    <button onClick={()=>handleBuyerDelete(buyer.id)} className="text-red-600 hover:text-red-900"><Trash2 className="w-4 h-4"/></button>
                  </td>
                </tr>
              ))}
              {filteredBuyers.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-6 text-sm text-body italic">No buyers found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {isBuyerFormOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white-bg rounded-lg p-6 w-full max-w-md border border-light-gray-border">
            <h2 className="text-xl font-semibold text-secondary-blue mb-4">{editingBuyer ? 'Edit Buyer' : 'Add Buyer'}</h2>
            <form onSubmit={handleBuyerSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-blue mb-2">Buyer Name</label>
                <input className="form-input-mica" value={buyerFormData.name} onChange={e=>handleBuyerInputChange('name', e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-blue mb-2">Contact Person</label>
                <input className="form-input-mica" value={buyerFormData.contactPerson} onChange={e=>handleBuyerInputChange('contactPerson', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-blue mb-2">Phone Number</label>
                <input className="form-input-mica" value={buyerFormData.phoneNumber} onChange={e=>handleBuyerInputChange('phoneNumber', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-blue mb-2">Email</label>
                <input type="email" className="form-input-mica" value={buyerFormData.email} onChange={e=>handleBuyerInputChange('email', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-blue mb-2">Address</label>
                <textarea className="form-textarea-mica" rows={3} value={buyerFormData.address} onChange={e=>handleBuyerInputChange('address', e.target.value)} />
              </div>
              <div className="flex space-x-3 pt-4">
                <button type="submit" className="btn-primary-mica flex-1">{editingBuyer ? 'Update' : 'Add'} Buyer</button>
                <button type="button" className="btn-secondary-mica flex-1" onClick={resetBuyerForm}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  const renderCategoriesTab = () => (
    <div className="space-y-6">
      {/* Add New Category Section */}
      <div className="bg-white-bg rounded-lg shadow-md p-6 border border-light-gray-border">
        <h3 className="text-lg font-semibold text-secondary-blue mb-4">Add New Category</h3>
        {isLoadingCategories && categories.length === 0 && (
          <div className="mb-2 text-xs text-body flex items-center gap-2"><Spinner /> <span>Loading categories…</span></div>
        )}
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-secondary-blue mb-2">
              Category Name
            </label>
            <input
              type="text"
              placeholder="Enter category name"
              className="form-input-mica"
              value={categoryForm.name}
              onChange={(e) => setCategoryForm({ name: e.target.value })}
            />
            {addCategoryError && (
              <p className="mt-2 text-sm text-red-600">{addCategoryError}</p>
            )}
          </div>
          <button 
            onClick={handleAddCategory}
            disabled={isAddingCategory || !categoryForm.name.trim()}
            className={`btn-primary-mica flex items-center gap-2 ${isAddingCategory ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            <Plus className="w-4 h-4" />
            {isAddingCategory ? 'Adding...' : 'Add Category'}
          </button>
        </div>
      </div>

      {/* Existing Categories Section */}
      <div className="bg-white-bg rounded-lg shadow-md border border-light-gray-border">
        <div className="p-6 border-b border-light-gray-border flex items-center justify-between">
          <h3 className="text-lg font-semibold text-secondary-blue">Existing Product Categories</h3>
          <div className="flex items-center gap-3">
            {isLoadingCategories && <Spinner />}
            <button
              onClick={async () => {
                if (isLoadingCategories) return;
                setIsLoadingCategories(true);
                try {
                  const fresh = await dataService.refresh('categories');
                  setCategories(Array.isArray(fresh) ? fresh : []);
                } finally { setIsLoadingCategories(false); }
              }}
              className="btn-secondary-mica flex items-center gap-2 disabled:opacity-50"
              title="Refresh categories from server"
              disabled={isLoadingCategories}
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingCategories ? 'animate-spin' : ''}`} />
              {isLoadingCategories ? 'Refreshing' : 'Refresh'}
            </button>
          </div>
        </div>
        <div className="divide-y divide-light-gray-border">
          {categories.length === 0 && (
            <div className="p-6 text-sm text-body italic">
              No categories found. Add one above, or click Refresh if you expect existing data.
            </div>
          )}
          {categories.map(category => (
            <div key={category.id} className="p-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setExpandedCategory(expandedCategory === category.id ? null : category.id)}
                    className="text-secondary-blue hover:text-primary-orange"
                  >
                    {expandedCategory === category.id ? 
                      <ChevronDown className="w-5 h-5" /> : 
                      <ChevronRight className="w-5 h-5" />
                    }
                  </button>
                  <div>
                    <h4 className="font-semibold text-secondary-blue">{category.name}</h4>
                    <p className="text-sm text-body">{category.subProducts.length} sub-products</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => openCategoryEdit(category)}
                    className="p-2 text-secondary-blue hover:text-primary-orange rounded-lg border border-light-gray-border"
                    title="Rename Category"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDeleteCategory(category.id)}
                    className="p-2 text-red-600 hover:text-red-900 rounded-lg border border-light-gray-border"
                    title="Delete Category"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setSubProductForm({ categoryId: category.id, name: '', defaultBagWeight: '', defaultUnit: 'kg' });
                      setShowSubProductForm(true);
                    }}
                    className="p-2 text-secondary-blue hover:text-primary-orange rounded-lg border border-light-gray-border"
                    title="Add Sub-Product"
                    aria-label={`Add sub-product to ${category.name}`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Expanded Sub-Products */}
              {expandedCategory === category.id && (
                <div className="mt-4 ml-8 space-y-3">
                  {category.subProducts.map(subProduct => (
                    <div key={subProduct.id} className="flex justify-between items-center p-3 bg-light-gray-bg rounded-lg border border-light-gray-border">
                      <div>
                        <p className="font-medium text-secondary-blue">{subProduct.name}</p>
                        <p className="text-sm text-body">
                          Default: {subProduct.defaultBagWeight} {subProduct.defaultUnit}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openSubProductEdit(category.id, subProduct)}
                          className="p-1 text-secondary-blue hover:text-primary-orange"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                        <button 
                          onClick={() => handleDeleteSubProduct(category.id, subProduct.id)}
                          className="p-1 text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Add Sub-Product Modal */}
      {showSubProductForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white-bg rounded-lg p-6 w-full max-w-md border border-light-gray-border">
            <h2 className="text-xl font-semibold text-secondary-blue mb-4">
              Add Sub-Product to {categories.find(c => c.id === subProductForm.categoryId)?.name}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-blue mb-2">
                  Sub-Category Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., 12+ Mesh"
                  className="form-input-mica"
                  value={subProductForm.name}
                  onChange={(e) => setSubProductForm({ ...subProductForm, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-blue mb-2">
                  Default Bag Weight
                </label>
                <input
                  type="number"
                  placeholder="50"
                  className="form-input-mica"
                  value={subProductForm.defaultBagWeight}
                  onChange={(e) => setSubProductForm({ ...subProductForm, defaultBagWeight: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-blue mb-2">
                  Default Unit
                </label>
                <select
                  className="form-select-mica"
                  value={subProductForm.defaultUnit}
                  onChange={(e) => setSubProductForm({ ...subProductForm, defaultUnit: e.target.value })}
                >
                  <option value="kg">kg</option>
                  <option value="tonne">tonne</option>
                </select>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleAddSubProduct}
                  className="btn-primary-mica flex-1"
                >
                  Add Sub-Product
                </button>
                <button
                  onClick={() => {
                    setShowSubProductForm(false);
                    setSubProductForm({ categoryId: null, name: '', defaultBagWeight: '', defaultUnit: 'kg' });
                  }}
                  className="btn-secondary-mica flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderLogsTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-secondary-blue flex items-center gap-2"><List className="w-5 h-5"/>Activity Logs</h3>
      <p className="text-sm text-body">(Placeholder) Future: show real-time activity logs (purchases, production, adjustments, orders).</p>
    </div>
  );
  const renderAdjustmentsTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-secondary-blue flex items-center gap-2"><Wrench className="w-5 h-5"/>Inventory Adjustments</h3>
      <p className="text-sm text-body mb-4">Record manual increases/decreases to inventory. (Placeholder form for now)</p>
      <form className="space-y-4 max-w-lg">
        <div>
          <label className="block text-sm font-medium text-secondary-blue mb-2">Item Key / ID</label>
          <input className="form-input-mica" placeholder="e.g., raw_supplier123 or finished_subProd456" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-secondary-blue mb-2">Delta (kg)</label>
            <input type="number" className="form-input-mica" placeholder="e.g., -25" />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-blue mb-2">Reason</label>
            <select className="form-select-mica">
              <option value="correction">Correction</option>
              <option value="damage">Damage</option>
              <option value="loss">Loss</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-secondary-blue mb-2">Notes</label>
          <textarea className="form-textarea-mica" rows={3} placeholder="Optional notes" />
        </div>
        <button type="button" className="btn-primary-mica">Submit Adjustment</button>
      </form>
    </div>
  );

  return (
    <div id="management" className="bg-light-gray-bg min-h-screen">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="w-8 h-8 text-primary-orange" />
        <div>
          <h1 className="text-3xl font-bold text-secondary-blue mb-2">Management</h1>
          <p className="text-body">Manage suppliers, categories, and system users</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white-bg rounded-2xl shadow-md border border-light-gray-border">
        <div className="border-b border-light-gray-border">
          <nav className="flex flex-wrap">
            <button onClick={() => setActiveTab('suppliers')} className={`px-6 py-4 text-sm font-medium border-b-2 ${activeTab === 'suppliers' ? 'border-primary-orange text-primary-orange' : 'border-transparent text-body hover:text-secondary-blue hover:border-light-gray-border'}`}>Suppliers</button>
            <button onClick={() => setActiveTab('buyers')} className={`px-6 py-4 text-sm font-medium border-b-2 ${activeTab === 'buyers' ? 'border-primary-orange text-primary-orange' : 'border-transparent text-body hover:text-secondary-blue hover:border-light-gray-border'}`}>Buyers</button>
            <button onClick={() => setActiveTab('categories')} className={`px-6 py-4 text-sm font-medium border-b-2 ${activeTab === 'categories' ? 'border-primary-orange text-primary-orange' : 'border-transparent text-body hover:text-secondary-blue hover:border-light-gray-border'}`}>Categories</button>
            <button onClick={() => setActiveTab('logs')} className={`px-6 py-4 text-sm font-medium border-b-2 ${activeTab === 'logs' ? 'border-primary-orange text-primary-orange' : 'border-transparent text-body hover:text-secondary-blue hover:border-light-gray-border'}`}>Logs</button>
            <button onClick={() => setActiveTab('adjustments')} className={`px-6 py-4 text-sm font-medium border-b-2 ${activeTab === 'adjustments' ? 'border-primary-orange text-primary-orange' : 'border-transparent text-body hover:text-secondary-blue hover:border-light-gray-border'}`}>Adjustments</button>
          </nav>
        </div>
        <div className="p-6">
          {activeTab === 'suppliers' && renderSuppliersTab()}
          {activeTab === 'buyers' && renderBuyersTab()}
          {activeTab === 'categories' && renderCategoriesTab()}
          {activeTab === 'logs' && renderLogsTab()}
          {activeTab === 'adjustments' && renderAdjustmentsTab()}
        </div>
      </div>

      {/* New: generic confirm modal */}
      {confirmConfig.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white-bg rounded-lg p-6 w-full max-w-md border border-light-gray-border">
            <h2 className="text-xl font-semibold text-secondary-blue mb-2">{confirmConfig.title}</h2>
            <p className="text-body mb-4">{confirmConfig.message}</p>
            <div className="flex justify-end gap-3">
              <button className="btn-secondary-mica" onClick={closeConfirm}>Cancel</button>
              <button className="btn-primary-mica" onClick={() => confirmConfig.onConfirm?.()}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* New: edit category modal */}
      {isCategoryEditOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white-bg rounded-lg p-6 w-full max-w-md border border-light-gray-border">
            <h2 className="text-xl font-semibold text-secondary-blue mb-4">Edit Category Name</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-blue mb-2">Category Name</label>
                <input
                  type="text"
                  className="form-input-mica"
                  value={categoryEditName}
                  onChange={(e) => setCategoryEditName(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-3">
                <button className="btn-secondary-mica" onClick={closeCategoryEdit}>Cancel</button>
                <button className="btn-primary-mica" onClick={handleUpdateCategoryName}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New: edit sub-product modal */}
      {isSubProductEditOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white-bg rounded-lg p-6 w-full max-w-md border border-light-gray-border">
            <h2 className="text-xl font-semibold text-secondary-blue mb-4">Edit Sub-Product</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-blue mb-2">Sub-Product Name</label>
                <input
                  type="text"
                  className="form-input-mica"
                  value={subProductEditForm.name}
                  onChange={(e) => setSubProductEditForm({ ...subProductEditForm, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-blue mb-2">Default Bag Weight</label>
                <input
                  type="number"
                  className="form-input-mica"
                  value={subProductEditForm.defaultBagWeight}
                  onChange={(e) => setSubProductEditForm({ ...subProductEditForm, defaultBagWeight: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-blue mb-2">Default Unit</label>
                <select
                  className="form-select-mica"
                  value={subProductEditForm.defaultUnit}
                  onChange={(e) => setSubProductEditForm({ ...subProductEditForm, defaultUnit: e.target.value })}
                >
                  <option value="kg">kg</option>
                  <option value="tonne">tonne</option>
                </select>
              </div>
              <div className="flex justify-end gap-3">
                <button className="btn-secondary-mica" onClick={closeSubProductEdit}>Cancel</button>
                <button className="btn-primary-mica" onClick={handleUpdateSubProduct}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Management;
