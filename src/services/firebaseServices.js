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
