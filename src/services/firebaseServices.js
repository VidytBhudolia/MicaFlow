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
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

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
      return { id: docRef.id, ...supplierData };
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
      return { id: supplierId, ...supplierData };
    } catch (error) {
      console.error('Error updating supplier: ', error);
      throw error;
    }
  },

  // Delete supplier
  async deleteSupplier(supplierId) {
    try {
      await deleteDoc(doc(db, 'suppliers', supplierId));
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
    return { id: docRef.id, ...buyerData };
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
    return { id: buyerId, ...buyerData };
  },
  async deleteBuyer(buyerId) {
    await deleteDoc(doc(db, 'buyers', buyerId));
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
        const next = current + u.delta;
        tx.set(ref, { id: u.id, stockKg: next, updatedAt: serverTimestamp() }, { merge: true });
      }
    });
  }
};

// Orders Service
export const ordersService = {
  // Add new order
  async addOrder(orderData) {
    try {
      const docRef = await addDoc(collection(db, 'orders'), {
        ...orderData,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      return { id: docRef.id, ...orderData };
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
      const docRef = await addDoc(collection(db, 'production'), {
        ...batchData,
        status: 'in-progress',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      return { id: docRef.id, ...batchData };
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
    return { id: ref.id, name, subProducts: [] };
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
    return { id: categoryId, name };
  },
  async deleteCategory(categoryId) {
    // delete subProducts then category
    const subsSnap = await getDocs(collection(db, 'categories', categoryId, 'subProducts'));
    await Promise.all(subsSnap.docs.map(s => deleteDoc(doc(db, 'categories', categoryId, 'subProducts', s.id))));
    await deleteDoc(doc(db, 'categories', categoryId));
    return categoryId;
  },
  async addSubProduct(categoryId, subProduct) {
    const now = new Date().toISOString();
    const payload = { name: subProduct.name, defaultBagWeight: subProduct.defaultBagWeight, defaultUnit: subProduct.defaultUnit, createdAt: now, updatedAt: now };
    const ref = await addDoc(collection(db, 'categories', categoryId, 'subProducts'), payload);
    return { id: ref.id, ...payload };
  },
  async updateSubProduct(categoryId, subProductId, updates) {
    const ref = doc(db, 'categories', categoryId, 'subProducts', subProductId);
    await updateDoc(ref, { ...updates, updatedAt: new Date().toISOString() });
    return { id: subProductId, ...updates };
  },
  async deleteSubProduct(categoryId, subProductId) {
    await deleteDoc(doc(db, 'categories', categoryId, 'subProducts', subProductId));
    return subProductId;
  }
};

// New: Purchases Service (dedicated 'purchases' collection)
export const purchasesService = {
  async addPurchase(data) {
    const now = new Date().toISOString();
    const ref = await addDoc(collection(db, 'purchases'), { ...data, createdAt: now, updatedAt: now });
    return { id: ref.id, ...data };
  },
  async getPurchases() {
    const snap = await getDocs(collection(db, 'purchases'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  async updatePurchase(id, patch) {
    await updateDoc(doc(db, 'purchases', id), { ...patch, updatedAt: new Date().toISOString() });
    return { id, ...patch };
  },
  async deletePurchase(id) {
    await deleteDoc(doc(db, 'purchases', id));
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
