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
  onSnapshot 
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
