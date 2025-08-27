import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  getDoc, 
  setDoc,
  runTransaction,
  increment,
  serverTimestamp,
  limit
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { validatePurchase, validateProduction, checkSupplierDeletable, ensureExists } from './refIntegrity';

// Generic CRUD functions
export const addDocument = async (collectionName, data) => {
  try {
    const docRef = await addDoc(collection(db, collectionName), {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return { id: docRef.id, ...data };
  } catch (error) {
    console.error(`Error adding document to ${collectionName}:`, error);
    throw error;
  }
};

export const getDocuments = async (collectionName) => {
  try {
    const querySnapshot = await getDocs(collection(db, collectionName));
    const documents = [];
    querySnapshot.forEach((doc) => {
      documents.push({ id: doc.id, ...doc.data() });
    });
    return documents;
  } catch (error) {
    console.error(`Error getting documents from ${collectionName}:`, error);
    throw error;
  }
};

export const updateDocument = async (collectionName, docId, data) => {
  try {
    const docRef = doc(db, collectionName, docId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString()
    });
    return { id: docId, ...data };
  } catch (error) {
    console.error(`Error updating document in ${collectionName}:`, error);
    throw error;
  }
};

export const deleteDocument = async (collectionName, docId) => {
  try {
    await deleteDoc(doc(db, collectionName, docId));
    return docId;
  } catch (error) {
    console.error(`Error deleting document from ${collectionName}:`, error);
    throw error;
  }
};

// Suppliers Service
export const suppliersService = {
  // Add new supplier
  async addSupplier(supplierData) {
    try {
      const docRef = await addDoc(collection(db, 'suppliers'), {
        ...supplierData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
  const created = { id: docRef.id, ...supplierData };
  try { await logsService.addLog({ type: 'supplier', action: 'create', message: `Supplier added: ${supplierData.name||created.id}`, refId: created.id, data: created }); } catch {}
  return created;
    } catch (error) {
      console.error('Error adding supplier: ', error);
      throw error;
    }
  },

  // Get all suppliers
  async getSuppliers() {
    try {
      const querySnapshot = await getDocs(collection(db, 'suppliers'));
      const suppliers = [];
      querySnapshot.forEach((doc) => {
        suppliers.push({ id: doc.id, ...doc.data() });
      });
      return suppliers;
    } catch (error) {
      console.error('Error getting suppliers: ', error);
      throw error;
    }
  },

  // Update supplier
  async updateSupplier(supplierId, supplierData) {
    try {
      const supplierRef = doc(db, 'suppliers', supplierId);
      await updateDoc(supplierRef, {
        ...supplierData,
        updatedAt: new Date().toISOString()
      });
  const updated = { id: supplierId, ...supplierData };
  try { await logsService.addLog({ type: 'supplier', action: 'update', message: `Supplier updated: ${supplierData.name||supplierId}`, refId: supplierId, data: updated }); } catch {}
  return updated;
    } catch (error) {
      console.error('Error updating supplier: ', error);
      throw error;
    }
  },

  // Delete supplier
  async deleteSupplier(supplierId) {
    try {
      // Guard: ensure no dependent records before deletion
      const check = await checkSupplierDeletable(supplierId);
      if (!check.ok) {
        throw new Error(check.reason || 'Supplier is referenced by other records');
      }
  await deleteDoc(doc(db, 'suppliers', supplierId));
  try { await logsService.addLog({ type: 'supplier', action: 'delete', message: `Supplier deleted: ${supplierId}`, refId: supplierId }); } catch {}
  return supplierId;
    } catch (error) {
      console.error('Error deleting supplier: ', error);
      throw error;
    }
  },

  // Listen to suppliers changes (real-time)
  subscribeToSuppliers(callback) {
    const q = query(collection(db, 'suppliers'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (querySnapshot) => {
      const suppliers = [];
      querySnapshot.forEach((doc) => {
        suppliers.push({ id: doc.id, ...doc.data() });
      });
      callback(suppliers);
    });
  }
};

// Buyers Service
export const buyersService = {
  async addBuyer(buyerData) {
    const docRef = await addDoc(collection(db, 'buyers'), {
      ...buyerData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  const created = { id: docRef.id, ...buyerData };
  try { await logsService.addLog({ type: 'buyer', action: 'create', message: `Buyer added: ${buyerData.name||created.id}`, refId: created.id, data: created }); } catch {}
  return created;
  },
  async getBuyers() {
    const snap = await getDocs(collection(db, 'buyers'));
    const buyers = [];
    snap.forEach(d => buyers.push({ id: d.id, ...d.data() }));
    return buyers;
  },
  async updateBuyer(buyerId, buyerData) {
    const ref = doc(db, 'buyers', buyerId);
    await updateDoc(ref, { ...buyerData, updatedAt: new Date().toISOString() });
  const updated = { id: buyerId, ...buyerData };
  try { await logsService.addLog({ type: 'buyer', action: 'update', message: `Buyer updated: ${buyerData.name||buyerId}`, refId: buyerId, data: updated }); } catch {}
  return updated;
  },
  async deleteBuyer(buyerId) {
  await deleteDoc(doc(db, 'buyers', buyerId));
  try { await logsService.addLog({ type: 'buyer', action: 'delete', message: `Buyer deleted: ${buyerId}`, refId: buyerId }); } catch {}
  return buyerId;
  }
};

// Inventory Service
export const inventoryService = {
  // Add inventory item
  async addInventoryItem(itemData) {
    try {
      const docRef = await addDoc(collection(db, 'inventory'), {
        ...itemData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      return { id: docRef.id, ...itemData };
    } catch (error) {
      console.error('Error adding inventory item: ', error);
      throw error;
    }
  },

  // Get all inventory items
  async getInventoryItems() {
    try {
      const querySnapshot = await getDocs(collection(db, 'inventory'));
      const items = [];
      querySnapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() });
      });
      return items;
    } catch (error) {
      console.error('Error getting inventory items: ', error);
      throw error;
    }
  },

  // Update inventory item
  async updateInventoryItem(itemId, itemData) {
    try {
      const itemRef = doc(db, 'inventory', itemId);
      await updateDoc(itemRef, {
        ...itemData,
        updatedAt: new Date().toISOString()
      });
      return { id: itemId, ...itemData };
    } catch (error) {
      console.error('Error updating inventory item: ', error);
      throw error;
    }
  },

  // Delete inventory item
  async deleteInventoryItem(itemId) {
    try {
      await deleteDoc(doc(db, 'inventory', itemId));
      return itemId;
    } catch (error) {
      console.error('Error deleting inventory item: ', error);
      throw error;
    }
  },

  async upsertDelta(id, delta) {
    const ref = doc(db, 'inventory', id);
    await setDoc(ref, { id, stockKg: increment(delta), updatedAt: serverTimestamp() }, { merge: true });
  },
  async applyProduction(production) {
    // Non-transactional fallback (kept for compatibility)
    try {
      if (production.rawMaterialUsedKg) {
        const rawId = production.supplierOfRawMaterial ? `raw_${production.supplierOfRawMaterial}` : 'raw_unknown';
        await this.upsertDelta(rawId, -Math.abs(production.rawMaterialUsedKg));
      }
      await Promise.all((production.producedProducts || []).map(async p => {
        const spKey = p.subProductId || p.id || p.subProduct; if (!spKey) return;
        const finishedId = `finished_${spKey}`;
        if (p.quantityKg) await this.upsertDelta(finishedId, Math.abs(p.quantityKg));
      }));
    } catch (e) { console.warn('applyProduction inventory error', e); }
  },
  async applyProductionTransaction(production) {
    // Transactional version to reduce race conditions
    const updates = [];
    if (production.rawMaterialUsedKg) {
      const rawId = production.supplierOfRawMaterial ? `raw_${production.supplierOfRawMaterial}` : 'raw_unknown';
  updates.push({ id: rawId, delta: -Math.abs(production.rawMaterialUsedKg) });
    }
    (production.producedProducts || []).forEach(p => {
      const spKey = p.subProductId || p.id || p.subProduct; if (!spKey) return;
      const finishedId = `finished_${spKey}`;
      if (p.quantityKg) updates.push({ id: finishedId, delta: Math.abs(p.quantityKg) });
    });
    if (updates.length === 0) return;
    await runTransaction(db, async (tx) => {
      for (const u of updates) {
        const ref = doc(db, 'inventory', u.id);
        const snap = await tx.get(ref);
        const current = snap.exists() ? (snap.data().stockKg || 0) : 0;
        // Prevent over-usage of raw stock
        if (u.id.startsWith('raw_') && (current + u.delta) < -1e-6) {
          throw new Error(`Insufficient raw stock for ${u.id.replace('raw_','supplier ')}: have ${current} kg, need ${Math.abs(u.delta)} kg`);
        }
        const next = current + u.delta;
        tx.set(ref, { id: u.id, stockKg: next, updatedAt: serverTimestamp() }, { merge: true });
      }
    });
  },
  // Deduct finished stock for an order in a single transaction
  async applyOrderFulfillment(items) {
    // items: [{ subProductId, quantityKg }]
    const updates = [];
    for (const it of (items || [])) {
      const spKey = it.subProductId || it.id || it.subProduct; if (!spKey) continue;
      const qty = Math.abs(Number(it.quantityKg || 0)); if (!qty) continue;
      updates.push({ id: `finished_${spKey}`, delta: -qty });
    }
    if (updates.length === 0) return;
  await runTransaction(db, async (tx) => {
      for (const u of updates) {
        const ref = doc(db, 'inventory', u.id);
        const snap = await tx.get(ref);
        const current = snap.exists() ? (snap.data().stockKg || 0) : 0;
        if ((current + u.delta) < -1e-6) {
          throw new Error(`Insufficient finished stock for ${u.id.replace('finished_','sub-product ')}: have ${current} kg, need ${Math.abs(u.delta)} kg`);
        }
        const next = current + u.delta;
        tx.set(ref, { id: u.id, stockKg: next, updatedAt: serverTimestamp() }, { merge: true });
      }
    });
    try {
      const total = updates.reduce((s,u)=> s + Math.abs(u.delta), 0);
      await logsService.addLog({ type: 'inventory', action: 'fulfillment', message: `Order fulfillment deducted ${total} kg across ${updates.length} item(s)`, data: { items } });
    } catch {}
  }
};

// Orders Service
export const ordersService = {
  // Add new order
  async addOrder(orderData) {
    try {
  // If buyerId exists, ensure buyer exists (soft FK)
  if (orderData?.buyerId) await ensureExists('buyers', orderData.buyerId, { fieldLabel: 'buyerId' });
      const docRef = await addDoc(collection(db, 'orders'), {
        ...orderData,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
  const created = { id: docRef.id, ...orderData };
  try { await logsService.addLog({ type: 'order', action: 'create', message: `Order created`, refId: created.id, data: { items: (orderData.items||[]).length, totalAmount: orderData.totalAmount } }); } catch {}
  return created;
    } catch (error) {
      console.error('Error adding order: ', error);
      throw error;
    }
  },

  // Get all orders
  async getOrders() {
    try {
      const querySnapshot = await getDocs(
        query(collection(db, 'orders'), orderBy('createdAt', 'desc'))
      );
      const orders = [];
      querySnapshot.forEach((doc) => {
        orders.push({ id: doc.id, ...doc.data() });
      });
      return orders;
    } catch (error) {
      console.error('Error getting orders: ', error);
      throw error;
    }
  },

  // Update order status
  async updateOrderStatus(orderId, status) {
    try {
      const orderRef = doc(db, 'orders', orderId);
  await updateDoc(orderRef, {
        status,
        updatedAt: new Date().toISOString()
      });
  try { await logsService.addLog({ type: 'order', action: 'status', message: `Order ${orderId} status → ${status}`, refId: orderId, data: { status } }); } catch {}
  return { id: orderId, status };
    } catch (error) {
      console.error('Error updating order status: ', error);
      throw error;
    }
  }
};

// Production Service
export const productionService = {
  // Add production batch
  async addProductionBatch(batchData) {
    try {
  await validateProduction(batchData);
      const docRef = await addDoc(collection(db, 'production'), {
        ...batchData,
        status: 'in-progress',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      const created = { id: docRef.id, ...batchData };
      try {
        const produced = (batchData.totalProducedKg != null) ? batchData.totalProducedKg : (batchData.producedProducts||[]).reduce((s,p)=>s+(p.quantityKg||0),0);
        await logsService.addLog({ type: 'production', action: 'create', message: `Batch added: raw ${batchData.rawMaterialUsedKg||batchData.rawUsedKg||0} kg → produced ${produced||0} kg`, refId: created.id, data: { produced, rawUsed: batchData.rawMaterialUsedKg||batchData.rawUsedKg||0 } });
      } catch {}
      return created;
    } catch (error) {
      console.error('Error adding production batch: ', error);
      throw error;
    }
  },

  // Get production batches
  async getProductionBatches() {
    try {
      const querySnapshot = await getDocs(
        query(collection(db, 'production'), orderBy('createdAt', 'desc'))
      );
      const batches = [];
      querySnapshot.forEach((doc) => {
        batches.push({ id: doc.id, ...doc.data() });
      });
      return batches;
    } catch (error) {
      console.error('Error getting production batches: ', error);
      throw error;
    }
  }
};

// Categories Service (categories collection + subcollection 'subProducts')
export const categoriesService = {
  async addCategory(name) {
    const now = new Date().toISOString();
  const ref = await addDoc(collection(db, 'categories'), { name, createdAt: now, updatedAt: now });
  const created = { id: ref.id, name, subProducts: [] };
  try { await logsService.addLog({ type: 'category', action: 'create', message: `Category added: ${name}`, refId: created.id, data: created }); } catch {}
  return created;
  },
  async getCategories() {
    const catsSnap = await getDocs(collection(db, 'categories'));
    const cats = [];
    for (const d of catsSnap.docs) {
      const catId = d.id;
      const catData = d.data();
      const subsSnap = await getDocs(collection(db, 'categories', catId, 'subProducts'));
      const subProducts = subsSnap.docs.map(s => ({ id: s.id, ...s.data() }));
      cats.push({ id: catId, name: catData.name, subProducts });
    }
    return cats;
  },
  async updateCategoryName(categoryId, name) {
    const ref = doc(db, 'categories', categoryId);
  await updateDoc(ref, { name, updatedAt: new Date().toISOString() });
  try { await logsService.addLog({ type: 'category', action: 'update', message: `Category renamed: ${name}`, refId: categoryId, data: { name } }); } catch {}
  return { id: categoryId, name };
  },
  async deleteCategory(categoryId) {
    // delete subProducts then category
    const subsSnap = await getDocs(collection(db, 'categories', categoryId, 'subProducts'));
    await Promise.all(subsSnap.docs.map(s => deleteDoc(doc(db, 'categories', categoryId, 'subProducts', s.id))));
  await deleteDoc(doc(db, 'categories', categoryId));
  try { await logsService.addLog({ type: 'category', action: 'delete', message: `Category deleted: ${categoryId}`, refId: categoryId }); } catch {}
  return categoryId;
  },
  async addSubProduct(categoryId, subProduct) {
    const now = new Date().toISOString();
    const payload = { name: subProduct.name, defaultBagWeight: subProduct.defaultBagWeight, defaultUnit: subProduct.defaultUnit, createdAt: now, updatedAt: now };
  const ref = await addDoc(collection(db, 'categories', categoryId, 'subProducts'), payload);
  const created = { id: ref.id, ...payload };
  try { await logsService.addLog({ type: 'subProduct', action: 'create', message: `Sub-Product added: ${payload.name}`, refId: created.id, data: { categoryId, ...created } }); } catch {}
  return created;
  },
  async updateSubProduct(categoryId, subProductId, updates) {
    const ref = doc(db, 'categories', categoryId, 'subProducts', subProductId);
  await updateDoc(ref, { ...updates, updatedAt: new Date().toISOString() });
  try { await logsService.addLog({ type: 'subProduct', action: 'update', message: `Sub-Product updated: ${updates?.name||subProductId}`, refId: subProductId, data: { categoryId, ...updates } }); } catch {}
  return { id: subProductId, ...updates };
  },
  async deleteSubProduct(categoryId, subProductId) {
  await deleteDoc(doc(db, 'categories', categoryId, 'subProducts', subProductId));
  try { await logsService.addLog({ type: 'subProduct', action: 'delete', message: `Sub-Product deleted: ${subProductId}`, refId: subProductId, data: { categoryId } }); } catch {}
  return subProductId;
  }
};

// New: Purchases Service (dedicated 'purchases' collection)
export const purchasesService = {
  async addPurchase(data) {
    const now = new Date().toISOString();
    await validatePurchase(data);
  const ref = await addDoc(collection(db, 'purchases'), { ...data, createdAt: now, updatedAt: now });
  const created = { id: ref.id, ...data };
  try { await logsService.addLog({ type: 'purchase', action: 'create', message: `Purchase added: ${data.quantityKg||0} kg from ${data.supplierId||'supplier'}`, refId: created.id, data: created }); } catch {}
  return created;
  },
  async getPurchases() {
    const snap = await getDocs(collection(db, 'purchases'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  async updatePurchase(id, patch) {
    if (patch?.supplierId) {
      await ensureExists('suppliers', patch.supplierId, { fieldLabel: 'supplierId' });
    }
  await updateDoc(doc(db, 'purchases', id), { ...patch, updatedAt: new Date().toISOString() });
  try { await logsService.addLog({ type: 'purchase', action: 'update', message: `Purchase updated: ${id}`, refId: id, data: patch }); } catch {}
  return { id, ...patch };
  },
  async deletePurchase(id) {
  await deleteDoc(doc(db, 'purchases', id));
  try { await logsService.addLog({ type: 'purchase', action: 'delete', message: `Purchase deleted: ${id}`, refId: id }); } catch {}
  return id;
  }
};

// New: daily stats service for per-day aggregation
export const dailyStatsService = {
  async accumulate(production) {
    const date = production.processingDate || production.date || new Date().toISOString().substring(0,10);
    const id = date;
    const ref = doc(db, 'daily_stats', id);
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      const base = snap.exists() ? snap.data() : { id, date, totalRawUsedKg: 0, totalProducedKg: 0, totalLossKg: 0, batches: 0, hammerChanges: 0, knifeChanges: 0, dieselUsedLiters: 0, workers: 0 };
      const incrementRaw = production.rawMaterialUsedKg || production.rawUsedKg || 0;
      const incrementProduced = production.totalProducedKg || 0;
      const incrementLoss = production.lossKg != null ? production.lossKg : Math.max(0, incrementRaw - incrementProduced);
      const incrementHammer = production.hammerChanges || 0;
      const incrementKnife = production.knifeChanges || 0;
      const incrementDiesel = production.dieselUsedLiters || 0;
      const incrementWorkers = (parseFloat(production.numMaleWorkers)||0) + (parseFloat(production.numFemaleWorkers)||0);
      const updated = {
        ...base,
        totalRawUsedKg: (base.totalRawUsedKg || 0) + incrementRaw,
        totalProducedKg: (base.totalProducedKg || 0) + incrementProduced,
        totalLossKg: (base.totalLossKg || 0) + incrementLoss,
        batches: (base.batches || 0) + 1,
        hammerChanges: (base.hammerChanges || 0) + incrementHammer,
        knifeChanges: (base.knifeChanges || 0) + incrementKnife,
        dieselUsedLiters: (base.dieselUsedLiters || 0) + incrementDiesel,
        workers: (base.workers || 0) + incrementWorkers,
      };
      updated.yieldPercent = updated.totalRawUsedKg > 0 ? (updated.totalProducedKg / updated.totalRawUsedKg) * 100 : 0;
      tx.set(ref, { ...updated, updatedAt: serverTimestamp() }, { merge: true });
    });
  },
  async getDailyStats() {
    const qs = await getDocs(collection(db, 'daily_stats'));
    return qs.docs.map(d => ({ id: d.id, ...d.data() }));
  }
};

// Daily Category Stats (per-category aggregates for 100% stacked chart)
export const dailyCategoryStatsService = {
  // Accumulate a production batch into the per-category daily doc
  async accumulate(production) {
    try {
      const categoryId = production.productCategory;
      if (!categoryId) return;
      const date = production.processingDate || production.date || new Date().toISOString().substring(0,10);
      const id = `${categoryId}_${date}`;
      const ref = doc(db, 'daily_category_stats', id);

      // Compute increments
      const producedBySub = {};
      let producedSum = 0;
      (production.producedProducts || []).forEach(p => {
        const spId = p.subProductId || p.id || p.subProduct;
        const qty = Number(p.quantityKg) || 0;
        if (!spId || qty <= 0) return;
        producedBySub[spId] = (producedBySub[spId] || 0) + qty;
        producedSum += qty;
      });
      const raw = production.rawMaterialUsedKg || production.rawUsedKg || 0;
      const loss = production.lossKg != null ? production.lossKg : Math.max(0, raw - producedSum);

      // Transaction: merge sums per sub-product
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(ref);
        const base = snap.exists() ? (snap.data() || {}) : { id, categoryId, date, producedKgBySub: {}, rawUsedKg: 0, lossKg: 0 };
        const merged = { ...base };
        merged.rawUsedKg = (base.rawUsedKg || 0) + raw;
        merged.lossKg = (base.lossKg || 0) + loss;
        const current = { ...(base.producedKgBySub || {}) };
        Object.entries(producedBySub).forEach(([k, v]) => { current[k] = (current[k] || 0) + v; });
        merged.producedKgBySub = current;
        tx.set(ref, { ...merged, updatedAt: serverTimestamp() }, { merge: true });
      });

      // Retention: keep only latest 30 dates for this category
      const qcat = query(collection(db, 'daily_category_stats'), where('categoryId','==', categoryId), orderBy('date','asc'));
      const qs = await getDocs(qcat);
      const docs = qs.docs;
      const excess = Math.max(0, docs.length - 30);
      if (excess > 0) {
        for (let i = 0; i < excess; i++) {
          try { await deleteDoc(doc(db, 'daily_category_stats', docs[i].id)); } catch {}
        }
      }
    } catch (e) {
      console.warn('dailyCategoryStats accumulate failed', e);
    }
  },
};

// Admin utilities
export const adminService = {
  // Danger: Deletes all documents from key collections
  async deleteAllData() {
    const collections = [
      'inventory',
      'production',
      'purchases',
      'daily_stats',
      'daily_category_stats',
      'orders',
      'buyers',
      'suppliers',
      // categories handled separately due to subcollection
    ];

    // Helper: delete all docs in a collection
    const deleteAllInCollection = async (name) => {
      const snap = await getDocs(collection(db, name));
      await Promise.all(snap.docs.map(async (d) => deleteDoc(doc(db, name, d.id))));
    };

    // 1) Delete flat collections
    for (const name of collections) {
      try { await deleteAllInCollection(name); } catch (e) { console.warn(`Failed deleting collection ${name}`, e); }
    }

    // 2) Delete categories and subProducts
    try {
      const catsSnap = await getDocs(collection(db, 'categories'));
      for (const c of catsSnap.docs) {
        // delete subProducts first
        const subsSnap = await getDocs(collection(db, 'categories', c.id, 'subProducts'));
        await Promise.all(subsSnap.docs.map(s => deleteDoc(doc(db, 'categories', c.id, 'subProducts', s.id))));
        await deleteDoc(doc(db, 'categories', c.id));
      }
  } catch (e) { console.warn('Failed deleting categories', e); }
  try { await logsService.addLog({ type: 'admin', action: 'wipe', message: 'All data wiped via Danger Zone' }); } catch {}
  }
};

// App settings (dashboard config, featured sub-products, etc.)
export const settingsService = {
  async getDashboardSettings() {
    const ref = doc(db, 'app_settings', 'dashboard');
    const snap = await getDoc(ref);
    const defaults = {
  // Supported stat keys for dashboard top cards
  // rawStock, totalProducedKg, totalPurchasedKg, suppliersCount, categoriesCount, subProductsCount,
  // thisMonthDiesel, thisMonthWorkers
  topCards: ['rawStock','totalProducedKg','totalPurchasedKg'],
      featuredSubProducts: [],
      updatedAt: new Date().toISOString()
    };
    if (!snap.exists()) return defaults;
    const data = snap.data() || {};
    return { ...defaults, ...data };
  },
  async updateDashboardSettings(patch) {
    const ref = doc(db, 'app_settings', 'dashboard');
    await setDoc(ref, { ...patch, updatedAt: new Date().toISOString() }, { merge: true });
  try { await logsService.addLog({ type: 'settings', action: 'update', message: 'Dashboard settings updated', data: patch }); } catch {}
    return patch;
  }
};

// Activity Logs Service
export const logsService = {
  async addLog(entry) {
    try {
      const payload = {
        type: entry.type || 'app',
        action: entry.action || 'info',
        message: entry.message || '',
        refId: entry.refId || null,
        data: entry.data || null,
        ts: serverTimestamp(),
        createdAt: new Date().toISOString()
      };
      await addDoc(collection(db, 'activity_logs'), payload);
    } catch (e) {
      console.warn('addLog failed', e);
    }
  },
  async getLogs({ startDate, endDate, limitCount = 10 } = {}) {
    try {
      const col = collection(db, 'activity_logs');
      const parts = [];
      if (startDate) {
        parts.push(where('createdAt', '>=', startDate));
      }
      if (endDate) {
        parts.push(where('createdAt', '<=', endDate));
      }
      const q = parts.length ? query(col, ...parts, orderBy('createdAt', 'desc'), limit(limitCount)) : query(col, orderBy('createdAt','desc'), limit(limitCount));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.warn('getLogs failed', e);
      return [];
    }
  }
};
