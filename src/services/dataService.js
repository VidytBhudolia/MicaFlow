// Lightweight data service abstraction with pluggable backend (localStorage by default)
import { suppliersService, categoriesService, productionService, purchasesService } from './firebaseServices';

const USE_FIREBASE = true; // enabled Firestore

const SUPPLIERS_KEY = 'micaflow-suppliers';
const CATEGORIES_KEY = 'micaflow-categories';
const CACHE_META_KEY = 'micaflow-cache-meta';

const safeParse = (str, fallback) => {
  try {
    const v = JSON.parse(str);
    return v ?? fallback;
  } catch {
    return fallback;
  }
};

// Normalize helpers
const toNumber = (v, d = 0) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : d;
};

const normalizeSubProduct = (sp) => {
  if (!sp) return sp;
  const unit = String(sp.defaultUnit || '').toLowerCase();
  let weight = toNumber(sp.defaultBagWeight, 0);
  let baseUnit = 'kg';

  if (unit === 'kg' || unit === 'kilogram' || unit === 'kilograms') {
    baseUnit = 'kg';
  } else if (unit === 'tonne' || unit === 'tonnes' || unit === 't') {
    baseUnit = 'tonne';
  } else {
    // Handle '50kg' / '50 kg'
    const m = unit.match(/^(\d+(?:\.\d+)?)\s*kg$/i) || unit.match(/^(\d+(?:\.\d+)?)kg$/i);
    if (m) {
      weight = weight || parseFloat(m[1]);
      baseUnit = 'kg';
    } else {
      baseUnit = 'kg';
    }
  }

  return {
    ...sp,
    defaultBagWeight: weight,
    defaultUnit: baseUnit,
  };
};

const normalizeCategories = (cats) => {
  if (!Array.isArray(cats)) return [];
  return cats.map(cat => ({
    ...cat,
    subProducts: Array.isArray(cat?.subProducts)
      ? cat.subProducts.map(normalizeSubProduct)
      : []
  }));
};

// Cache helpers
const getCacheMeta = () => safeParse(localStorage.getItem(CACHE_META_KEY), {});
const setCacheMeta = (meta) => { try { localStorage.setItem(CACHE_META_KEY, JSON.stringify(meta)); } catch {} };
const markCache = (key) => {
  const meta = getCacheMeta();
  meta[key] = { ts: Date.now() };
  setCacheMeta(meta);
};

const readCached = (key, normalizer) => {
  const raw = safeParse(localStorage.getItem(key), null);
  if (!raw) return null;
  const normalized = normalizer ? normalizer(raw) : raw;
  try { localStorage.setItem(key, JSON.stringify(normalized)); } catch {}
  return normalized;
};

const writeCached = (key, value, normalizer) => {
  const v = normalizer ? normalizer(value) : value;
  try { localStorage.setItem(key, JSON.stringify(v)); } catch {}
  markCache(key);
  return v;
};

// Local backend
const local = {
  // Suppliers
  getSuppliers() { return readCached(SUPPLIERS_KEY, v => v) ?? []; },
  setSuppliers(s) { return writeCached(SUPPLIERS_KEY, s, v => v); },
  async addSupplier(s) { const list = [...this.getSuppliers(), s]; this.setSuppliers(list); return s; },
  async updateSupplier(id, patch) { const list = this.getSuppliers().map(x => x.id === id ? { ...x, ...patch } : x); this.setSuppliers(list); return list.find(x => x.id === id); },
  async deleteSupplier(id) { const list = this.getSuppliers().filter(x => x.id !== id); this.setSuppliers(list); return id; },

  // Categories
  getCategories() { return readCached(CATEGORIES_KEY, normalizeCategories) ?? []; },
  setCategories(c) { return writeCached(CATEGORIES_KEY, c, normalizeCategories); },
  async addCategory(name) { const c = [...this.getCategories(), { id: Date.now(), name, subProducts: [] }]; this.setCategories(c); return c[c.length-1]; },
  async updateCategoryName(id, name) { const c = this.getCategories().map(x => x.id === id ? { ...x, name } : x); this.setCategories(c); return c.find(x => x.id === id); },
  async deleteCategory(id) { const c = this.getCategories().filter(x => x.id !== id); this.setCategories(c); return id; },
  async addSubProduct(categoryId, sub) { const c = this.getCategories().map(cat => cat.id === categoryId ? { ...cat, subProducts: [...cat.subProducts, { ...sub, id: Date.now() }] } : cat); this.setCategories(c); return c.find(cat => cat.id === categoryId).subProducts.slice(-1)[0]; },
  async updateSubProduct(categoryId, subId, patch) { const c = this.getCategories().map(cat => cat.id === categoryId ? { ...cat, subProducts: cat.subProducts.map(sp => sp.id === subId ? { ...sp, ...patch } : sp) } : cat); this.setCategories(c); return patch; },
  async deleteSubProduct(categoryId, subId) { const c = this.getCategories().map(cat => cat.id === categoryId ? { ...cat, subProducts: cat.subProducts.filter(sp => sp.id !== subId) } : cat); this.setCategories(c); return subId; },
  async addProduction(doc) { console.log('[local] addProduction', doc); return { id: Date.now(), ...doc }; },
  async addPurchase(doc) { console.log('[local] addPurchase', doc); return { id: Date.now(), ...doc }; },
};

// Remote backend (Firestore) with local cache layer
const remote = {
  // Suppliers
  async getSuppliers({ force = false } = {}) {
    const cached = readCached(SUPPLIERS_KEY, v => v);
    if (cached && !force) return cached;
    const remote = await suppliersService.getSuppliers();
    return writeCached(SUPPLIERS_KEY, remote, v => v);
  },
  async setSuppliers(list) { return writeCached(SUPPLIERS_KEY, list, v => v); },
  async addSupplier(s) {
    const created = await suppliersService.addSupplier(s);
    const current = readCached(SUPPLIERS_KEY, v => v) || [];
    writeCached(SUPPLIERS_KEY, [...current, created], v => v);
    return created;
  },
  async updateSupplier(id, patch) {
    const updated = await suppliersService.updateSupplier(id, patch);
    const current = readCached(SUPPLIERS_KEY, v => v) || [];
    writeCached(SUPPLIERS_KEY, current.map(x => x.id === id ? { ...x, ...patch } : x), v => v);
    return updated;
  },
  async deleteSupplier(id) {
    const res = await suppliersService.deleteSupplier(id);
    const current = readCached(SUPPLIERS_KEY, v => v) || [];
    writeCached(SUPPLIERS_KEY, current.filter(x => x.id !== id), v => v);
    return res;
  },

  // Categories
  async getCategories({ force = false } = {}) {
    const cached = readCached(CATEGORIES_KEY, normalizeCategories);
    if (cached && !force) return cached;
    const remote = await categoriesService.getCategories();
    return writeCached(CATEGORIES_KEY, remote, normalizeCategories);
  },
  async setCategories(list) { return writeCached(CATEGORIES_KEY, list, normalizeCategories); },
  async addCategory(name) {
    const created = await categoriesService.addCategory(name);
    const current = readCached(CATEGORIES_KEY, normalizeCategories) || [];
    writeCached(CATEGORIES_KEY, [...current, created], normalizeCategories);
    return created;
  },
  async updateCategoryName(id, name) {
    const updated = await categoriesService.updateCategoryName(id, name);
    const current = readCached(CATEGORIES_KEY, normalizeCategories) || [];
    writeCached(CATEGORIES_KEY, current.map(c => c.id === id ? { ...c, name } : c), normalizeCategories);
    return updated;
  },
  async deleteCategory(id) {
    const res = await categoriesService.deleteCategory(id);
    const current = readCached(CATEGORIES_KEY, normalizeCategories) || [];
    writeCached(CATEGORIES_KEY, current.filter(c => c.id !== id), normalizeCategories);
    return res;
  },
  async addSubProduct(categoryId, sub) {
    const created = await categoriesService.addSubProduct(categoryId, sub);
    const current = readCached(CATEGORIES_KEY, normalizeCategories) || [];
    writeCached(CATEGORIES_KEY, current.map(c => c.id === categoryId ? { ...c, subProducts: [...(c.subProducts||[]), created] } : c), normalizeCategories);
    return created;
  },
  async updateSubProduct(categoryId, subId, patch) {
    const updated = await categoriesService.updateSubProduct(categoryId, subId, patch);
    const current = readCached(CATEGORIES_KEY, normalizeCategories) || [];
    writeCached(CATEGORIES_KEY, current.map(c => c.id === categoryId ? { ...c, subProducts: (c.subProducts||[]).map(sp => sp.id === subId ? { ...sp, ...patch } : sp) } : c), normalizeCategories);
    return updated;
  },
  async deleteSubProduct(categoryId, subId) {
    const res = await categoriesService.deleteSubProduct(categoryId, subId);
    const current = readCached(CATEGORIES_KEY, normalizeCategories) || [];
    writeCached(CATEGORIES_KEY, current.map(c => c.id === categoryId ? { ...c, subProducts: (c.subProducts||[]).filter(sp => sp.id !== subId) } : c), normalizeCategories);
    return res;
  },

  // Production & Purchases
  async addProduction(doc) { return productionService.addProductionBatch(doc); },
  async addPurchase(doc) { return purchasesService.addPurchase(doc); },

  // Manual refresh entry points
  async refresh(key) {
    if (key === 'suppliers') return this.getSuppliers({ force: true });
    if (key === 'categories') return this.getCategories({ force: true });
    return null;
  },
};

export const dataService = USE_FIREBASE ? remote : local;
export { normalizeCategories, normalizeSubProduct };
