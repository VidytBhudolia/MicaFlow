// Lightweight data service abstraction with pluggable backend (localStorage by default)
import { suppliersService, categoriesService, productionService, purchasesService, inventoryService, dailyStatsService, buyersService, adminService, dailyCategoryStatsService } from './firebaseServices';

const USE_FIREBASE = true; // enabled Firestore

const SUPPLIERS_KEY = 'micaflow-suppliers';
const CATEGORIES_KEY = 'micaflow-categories';
const CACHE_META_KEY = 'micaflow-cache-meta';
const PURCHASES_KEY = 'micaflow-purchases';
const PRODUCTION_KEY = 'micaflow-production';
const BUYERS_KEY = 'micaflow-buyers';

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

// Invalidate helper for cache keys we manage via CACHE_META_KEY
const invalidateCache = (key) => {
  try {
    const meta = getCacheMeta();
    // remove timestamp to force next fetch
    delete meta[key];
    setCacheMeta(meta);
    // also optionally clear the stored value for known keys
    if (key === 'production') localStorage.removeItem(PRODUCTION_KEY);
    if (key === 'purchases') localStorage.removeItem(PURCHASES_KEY);
    if (key === 'categories') localStorage.removeItem(CATEGORIES_KEY);
    if (key === 'suppliers') localStorage.removeItem(SUPPLIERS_KEY);
  } catch {}
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
  async getSuppliers(options = {}) {
    const { force = false, forceRefresh = false } = options;
    const effectiveForce = force || forceRefresh;
    const cached = readCached(SUPPLIERS_KEY, v => v);
    // Treat empty array as cache miss so we attempt a network fetch (fixes needing manual refresh)
    if (cached && !effectiveForce && Array.isArray(cached) && cached.length > 0) return cached;
    const remoteList = await suppliersService.getSuppliers();
    return writeCached(SUPPLIERS_KEY, remoteList, v => v);
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
  async getCategories(options = {}) {
    const { force = false, forceRefresh = false } = options;
    const effectiveForce = force || forceRefresh;
    const cached = readCached(CATEGORIES_KEY, normalizeCategories);
    // If we have a non-empty cached list and not forced, return it; otherwise fetch remote.
    if (cached && !effectiveForce && Array.isArray(cached) && cached.length > 0) return cached;
    const remoteList = await categoriesService.getCategories();
    return writeCached(CATEGORIES_KEY, remoteList, normalizeCategories);
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

  // Buyers
  async getBuyers(options = {}) {
    const { force = false, forceRefresh = false } = options;
    const effectiveForce = force || forceRefresh;
    const cached = readCached(BUYERS_KEY, v => v);
    if (cached && !effectiveForce && Array.isArray(cached) && cached.length > 0) return cached;
    const remoteList = await buyersService.getBuyers();
    return writeCached(BUYERS_KEY, remoteList, v => v);
  },
  async addBuyer(b) {
    const created = await buyersService.addBuyer(b);
    const current = readCached(BUYERS_KEY, v => v) || [];
    writeCached(BUYERS_KEY, [...current, created], v => v);
    return created;
  },
  async updateBuyer(id, patch) {
    const updated = await buyersService.updateBuyer(id, patch);
    const current = readCached(BUYERS_KEY, v => v) || [];
    writeCached(BUYERS_KEY, current.map(x => x.id === id ? { ...x, ...patch } : x), v => v);
    return updated;
  },
  async deleteBuyer(id) {
    const res = await buyersService.deleteBuyer(id);
    const current = readCached(BUYERS_KEY, v => v) || [];
    writeCached(BUYERS_KEY, current.filter(x => x.id !== id), v => v);
    return res;
  },

  // Production & Purchases
  async addProduction(production) {
    // production expected to already have: rawMaterialUsedKg, producedProducts[{quantityKg}], totalProducedKg, lossKg, yieldPercent
    const enriched = { ...production };
    if (enriched.totalProducedKg == null) {
      enriched.totalProducedKg = (enriched.producedProducts||[]).reduce((s,p)=> s + (p.quantityKg||0),0);
    }
    if (enriched.lossKg == null) {
      enriched.lossKg = Math.max(0, (enriched.rawMaterialUsedKg||0) - enriched.totalProducedKg);
    }
    if (enriched.yieldPercent == null) {
      enriched.yieldPercent = (enriched.rawMaterialUsedKg||0) > 0 ? (enriched.totalProducedKg / enriched.rawMaterialUsedKg) * 100 : 0;
    }
    // Firestore write
    const saved = USE_FIREBASE
      ? await productionService.addProductionBatch(enriched)
      : await local.addProduction(enriched);
    if (USE_FIREBASE) {
      try {
        if (inventoryService.applyProductionTransaction) {
          await inventoryService.applyProductionTransaction(enriched);
        } else {
          await inventoryService.applyProduction(enriched);
        }
      } catch (e) {
        console.warn('Inventory transaction update failed; retrying non-transactional applyProduction', e);
        try { await inventoryService.applyProduction(enriched); } catch (e2) { console.warn('Inventory fallback update failed', e2); }
      }
  try { await dailyStatsService.accumulate(enriched); } catch (e) { console.warn('Daily stats update failed', e); }
  try { await dailyCategoryStatsService.accumulate(enriched); } catch (e) { console.warn('Daily category stats update failed', e); }
    }
  invalidateCache('production');
  invalidateCache('inventory');
  // Also clear any dashboard-related aggregations consumers may cache
  invalidateCache('categories');
  invalidateCache('suppliers');
    return saved;
  },
  async addPurchase(doc) { 
    // Enforce supplierId. If only supplierName is provided, try to map to id.
    if (!doc.supplierId && doc.supplierName) {
      try {
        const suppliers = await suppliersService.getSuppliers();
        const match = suppliers.find(s => (s.name||'').toLowerCase() === (doc.supplierName||'').toLowerCase());
        if (match) doc.supplierId = match.id;
      } catch {}
    }
    const saved = await purchasesService.addPurchase(doc); 
    try { 
      if (doc.supplierId) { 
        await inventoryService.upsertDelta(`raw_${doc.supplierId}`, doc.quantityKg||0); 
      } 
    } catch (e) { console.warn('Inventory raw purchase delta failed', e); }
    return saved; 
  },
  // New: getters for dashboard statistics with lightweight cache (always refetch if older than 5 min)
  async getPurchases({ force = false } = {}) {
    const ageLimitMs = 5 * 60 * 1000;
    const meta = getCacheMeta();
    const cacheValid = meta[PURCHASES_KEY] && (Date.now() - meta[PURCHASES_KEY].ts < ageLimitMs);
    if (!force && cacheValid) {
      const cached = readCached(PURCHASES_KEY, v => v);
      if (cached) return cached;
    }
    if (!purchasesService.getPurchases) return [];
    const list = await purchasesService.getPurchases();
    return writeCached(PURCHASES_KEY, list, v => v);
  },
  async getProductionBatches({ force = false } = {}) {
    const ageLimitMs = 5 * 60 * 1000;
    const meta = getCacheMeta();
    const cacheValid = meta[PRODUCTION_KEY] && (Date.now() - meta[PRODUCTION_KEY].ts < ageLimitMs);
    if (!force && cacheValid) {
      const cached = readCached(PRODUCTION_KEY, v => v);
      if (cached) return cached;
    }
    if (!productionService.getProductionBatches) return [];
    const list = await productionService.getProductionBatches();
    return writeCached(PRODUCTION_KEY, list, v => v);
  },
  async getInventory({ force = false } = {}) {
    // Always fetch fresh (can add cache later)
    if (!inventoryService.getInventoryItems) return [];
    try { return await inventoryService.getInventoryItems(); } catch { return []; }
  },
  async getDailyStats({ force = false, days = 30 } = {}) {
    try { return await dailyStatsService.getDailyStats(days); } catch { return []; }
  },
  async refresh(key) {
    if (key === 'suppliers') return this.getSuppliers({ force: true });
    if (key === 'categories') return this.getCategories({ force: true });
    if (key === 'purchases') return this.getPurchases({ force: true });
    if (key === 'production') return this.getProductionBatches({ force: true });
    if (key === 'inventory') return this.getInventory({ force: true });
    if (key === 'daily_stats') return this.getDailyStats({ force: true });
    if (key === 'buyers') return this.getBuyers({ force: true });
    return null;
  },
  // Danger zone utilities
  async deleteAllData() {
    if (!adminService?.deleteAllData) throw new Error('Not supported');
    await adminService.deleteAllData();
    // Clear local caches
    try {
      localStorage.removeItem('micaflow-suppliers');
      localStorage.removeItem('micaflow-categories');
      localStorage.removeItem('micaflow-purchases');
      localStorage.removeItem('micaflow-production');
      localStorage.removeItem('micaflow-buyers');
      localStorage.removeItem('micaflow-cache-meta');
    } catch {}
  }
};

export const dataService = USE_FIREBASE ? remote : local;
export { normalizeCategories, normalizeSubProduct };
