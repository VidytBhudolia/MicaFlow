// Dashboard aggregation helpers
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { categoriesService, suppliersService } from './firebaseServices';

// Helpers to classify inventory ids
const isRaw = (id='') => id.startsWith('raw_');
const isFinished = (id='') => id.startsWith('finished_');
const extractKey = (id='') => id.split('_').slice(1).join('_');

export async function getInventorySummary() {
  // Load inventory, categories, suppliers
  const invSnap = await getDocs(collection(db, 'inventory'));
  const inventory = invSnap.docs.map(d => ({ id: d.id, ...(d.data()||{}) }));
  const categories = await categoriesService.getCategories();
  const suppliers = await suppliersService.getSuppliers();

  const supplierMap = Object.fromEntries(suppliers.map(s => [s.id, s.name]));

  // Build subProduct -> {name, categoryId, categoryName}
  const subProductMeta = {};
  categories.forEach(cat => {
    (cat.subProducts||[]).forEach(sp => {
      subProductMeta[sp.id] = { name: sp.name, categoryId: cat.id, categoryName: cat.name };
    });
  });

  let rawStockTotal = 0;
  const rawStockBySupplier = {};
  const finishedStockPerCategoryMap = {};
  const finishedStockPerSubProduct = [];

  inventory.forEach(item => {
    const stockKg = item.stockKg || 0;
    if (isRaw(item.id)) {
      rawStockTotal += stockKg;
      const supplierId = extractKey(item.id) || 'unknown';
      rawStockBySupplier[supplierId] = (rawStockBySupplier[supplierId]||0) + stockKg;
    } else if (isFinished(item.id)) {
      const spId = extractKey(item.id);
      const meta = subProductMeta[spId];
      const subName = meta?.name || spId;
      finishedStockPerSubProduct.push({ subProductId: spId, name: subName, totalKg: stockKg, categoryId: meta?.categoryId, categoryName: meta?.categoryName });
      if (meta) {
        finishedStockPerCategoryMap[meta.categoryId] = (finishedStockPerCategoryMap[meta.categoryId]||0) + stockKg;
      } else {
        finishedStockPerCategoryMap['uncategorized'] = (finishedStockPerCategoryMap['uncategorized']||0) + stockKg;
      }
    }
  });

  const finishedStockPerCategory = Object.entries(finishedStockPerCategoryMap).map(([categoryId,totalKg]) => {
    const cat = categories.find(c => String(c.id) === String(categoryId));
    return { categoryId, name: cat?.name || (categoryId === 'uncategorized' ? 'Uncategorized' : categoryId), totalKg };
  });

  const rawStockPerSupplier = Object.entries(rawStockBySupplier).map(([supplierId,totalKg]) => ({ supplierId, name: supplierMap[supplierId] || supplierId, totalKg }));

  return { rawStockTotal, rawStockPerSupplier, finishedStockPerCategory, finishedStockPerSubProduct };
}

export async function getDailyStats({ range } = {}) {
  // range: { start: 'YYYY-MM-DD', end: 'YYYY-MM-DD' }
  let stats = [];
  if (range?.start && range?.end) {
    // Firestore date strings stored as ISO (YYYY-MM-DD) prefix so simple string compare works
    const qRef = query(collection(db, 'daily_stats'));
    const snap = await getDocs(qRef); // (Spark plan; filtering client side acceptable for now)
    stats = snap.docs.map(d => ({ id: d.id, ...(d.data()||{}) }))
      .filter(d => d.date >= range.start && d.date <= range.end);
  } else {
    const snap = await getDocs(collection(db, 'daily_stats'));
    stats = snap.docs.map(d => ({ id: d.id, ...(d.data()||{}) }));
  }
  // Normalize field names for UI expectations
  return stats.map(s => {
    const male = parseFloat(s.numMaleWorkers)||0;
    const female = parseFloat(s.numFemaleWorkers)||0;
    const workers = s.workers != null ? s.workers : (male + female);
    const totalRawUsedKg = s.totalRawUsedKg || s.rawUsedKg || s.rawMaterialUsedKgTotal || 0;
    const totalProducedKg = s.totalProducedKg || s.producedKgTotal || 0;
    const totalLossKg = s.totalLossKg || s.lossKgTotal || Math.max(0, totalRawUsedKg - totalProducedKg);
    return {
      date: s.date || s.id,
      totalRawUsedKg,
      totalProducedKg,
      totalLossKg,
      yieldPercent: s.yieldPercent != null ? s.yieldPercent : (totalRawUsedKg ? (totalProducedKg / totalRawUsedKg) * 100 : 0),
      hammerChanges: s.hammerChanges || 0,
      knifeChanges: s.knifeChanges || 0,
      dieselUsedLiters: s.dieselUsedLiters || 0,
      workers,
    };
  }).sort((a,b) => a.date.localeCompare(b.date));
}
export default { getInventorySummary, getDailyStats };
