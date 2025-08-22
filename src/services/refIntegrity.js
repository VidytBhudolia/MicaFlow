// Lightweight referential integrity helpers for Firestore
// Note: Firestore has no built-in foreign keys; we enforce them in app code
// and tighten security rules where feasible.

import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';

// Ensure a document exists; throw a descriptive error if not
export async function ensureExists(collectionName, id, { fieldLabel = 'id' } = {}) {
  if (!id || typeof id !== 'string') {
    throw new Error(`Missing or invalid ${fieldLabel} for ${collectionName}`);
  }
  const ref = doc(db, collectionName, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    throw new Error(`Referenced ${collectionName}/${id} does not exist`);
  }
  return { id, data: snap.data() };
}

// Validate a purchase payload has a valid supplier reference
export async function validatePurchase(purchase) {
  if (!purchase) throw new Error('Missing purchase payload');
  // We standardize on supplierId; keep supplierName optional for display
  const supplierId = purchase.supplierId || null;
  await ensureExists('suppliers', supplierId, { fieldLabel: 'supplierId' });
}

// Validate production payload references
export async function validateProduction(production) {
  if (!production) throw new Error('Missing production payload');
  const supId = production.supplierOfRawMaterial || production.supplierId || null;
  // Treat supplier as optional here; UI validates presence. If provided, ensure it exists.
  if (supId) {
    await ensureExists('suppliers', supId, { fieldLabel: 'supplierOfRawMaterial' });
  }
  // Basic sanity for producedProducts entries
  if (Array.isArray(production.producedProducts)) {
    for (const p of production.producedProducts) {
      if (!p || !(p.subProductId || p.id || p.subProduct)) {
        throw new Error('Each produced product must include a subProductId');
      }
    }
  }
}

// Check if a supplier can be safely deleted (no dependent records)
export async function checkSupplierDeletable(supplierId) {
  await ensureExists('suppliers', supplierId, { fieldLabel: 'supplierId' });

  // Purchases referencing this supplier
  try {
    const purchasesSnap = await getDocs(
      query(collection(db, 'purchases'), where('supplierId', '==', supplierId))
    );
    if (!purchasesSnap.empty) {
      return {
        ok: false,
        reason: `Supplier is referenced by ${purchasesSnap.size} purchase(s)`
      };
    }
  } catch (_) {
    // ignore query errors; fail open here and rely on UI to warn
  }

  // Inventory doc id convention: raw_<supplierId>
  try {
    const invId = `raw_${supplierId}`;
    const invSnap = await getDoc(doc(db, 'inventory', invId));
    if (invSnap.exists()) {
      const stock = invSnap.data()?.stockKg ?? 0;
      if (Number(stock) > 0) {
        return { ok: false, reason: `Supplier has raw stock (${stock} kg) in inventory` };
      }
    }
  } catch (_) {}

  return { ok: true };
}

export default {
  ensureExists,
  validatePurchase,
  validateProduction,
  checkSupplierDeletable,
};
