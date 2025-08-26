// Dashboard aggregation helpers
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { categoriesService, suppliersService } from './firebaseServices';

// Helpers to classify inventory ids
const isRaw = (id='') => id.startsWith('raw_');
const isFinished = (id='') => id.startsWith('finished_');
const extractKey = (id='') => id.split('_').slice(1).join('_');

export async function getInventorySummary({ includeZeroCategories = false } = {}) {
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

  // Fallback: if no finished inventory documents exist yet, derive finished stock from production history
  if (finishedStockPerSubProduct.length === 0) {
    try {
      const prodSnap = await getDocs(collection(db, 'production'));
      const totalsBySub = {};
      prodSnap.docs.forEach(docSnap => {
        const data = docSnap.data() || {};
        (data.producedProducts || []).forEach(p => {
          const spKey = p.subProductId || p.id || p.subProduct;
          if (!spKey) return;
          const qty = Number(p.quantityKg) || 0;
          if (qty <= 0) return;
          totalsBySub[spKey] = (totalsBySub[spKey] || 0) + qty;
        });
      });
      Object.entries(totalsBySub).forEach(([spId, totalKg]) => {
        const meta = subProductMeta[spId];
        const subName = meta?.name || spId;
        finishedStockPerSubProduct.push({ subProductId: spId, name: subName, totalKg, categoryId: meta?.categoryId, categoryName: meta?.categoryName });
        if (meta) {
          finishedStockPerCategoryMap[meta.categoryId] = (finishedStockPerCategoryMap[meta.categoryId] || 0) + totalKg;
        } else {
          finishedStockPerCategoryMap['uncategorized'] = (finishedStockPerCategoryMap['uncategorized'] || 0) + totalKg;
        }
      });
    } catch (e) {
      // ignore fallback errors; UI can show zero
      console.warn('Fallback finished stock from production failed', e);
    }
  }

  let finishedStockPerCategory = Object.entries(finishedStockPerCategoryMap).map(([categoryId,totalKg]) => {
    const cat = categories.find(c => String(c.id) === String(categoryId));
    return { categoryId, name: cat?.name || (categoryId === 'uncategorized' ? 'Uncategorized' : categoryId), totalKg };
  });
  if (includeZeroCategories) {
    const existing = new Set(finishedStockPerCategory.map(c => String(c.categoryId)));
    categories.forEach(cat => {
      if (!existing.has(String(cat.id))) finishedStockPerCategory.push({ categoryId: cat.id, name: cat.name, totalKg: 0 });
    });
  }

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
// Returns time series for a category where each point sums to 100%: { date, series: { [subProductId]: pct, loss: pct }, labels }
export async function getCategoryStackedPercentSeries(categoryId, { points = 30 } = {}) {
  const categories = await categoriesService.getCategories();
  const cat = categories.find(c => String(c.id) === String(categoryId));
  const subNames = Object.fromEntries((cat?.subProducts || []).map(sp => [sp.id, sp.name]));
  let rows = [];
  try {
    const qRef = query(
      collection(db, 'daily_category_stats'),
      where('categoryId','==', categoryId),
      orderBy('date','desc'),
      limit(points)
    );
    const snap = await getDocs(qRef);
    rows = snap.docs.map(d => d.data()).sort((a,b)=>String(a.date).localeCompare(String(b.date)));
  } catch (e) {
    // likely missing composite index; fallback to client-side filter
    console.warn('Indexed query failed, falling back to full scan', e);
    const snap = await getDocs(collection(db, 'daily_category_stats'));
    rows = snap.docs
      .map(d => d.data())
      .filter(r => String(r.categoryId) === String(categoryId))
      .sort((a,b)=>String(a.date).localeCompare(String(b.date)))
      .slice(-points);
  }
  // If no analytics rows yet (new setup or pending backfill), derive from production as a fallback
  if (!rows || rows.length === 0) {
    try {
      const prodSnap = await getDocs(collection(db, 'production'));
      // Group by date
      const byDate = new Map(); // date -> { raw, loss, bySub: {spId: kg}}
      prodSnap.docs.forEach(d => {
        const p = d.data() || {};
        if (String(p.productCategory) !== String(categoryId)) return;
        const date = p.processingDate || p.date || (p.createdAt ? String(p.createdAt).slice(0,10) : '');
        if (!date) return;
        const raw = Number(p.rawMaterialUsedKg || p.rawUsedKg || 0) || 0;
        const bySub = {};
        let producedSum = 0;
        (p.producedProducts || []).forEach(pp => {
          const sp = pp.subProductId || pp.id || pp.subProduct;
          const kg = Number(pp.quantityKg) || 0;
          if (!sp || kg <= 0) return;
          bySub[sp] = (bySub[sp] || 0) + kg;
          producedSum += kg;
        });
        const loss = p.lossKg != null ? Number(p.lossKg)||0 : Math.max(0, raw - producedSum);
        const cur = byDate.get(date) || { raw: 0, loss: 0, bySub: {} };
        cur.raw += raw;
        cur.loss += loss;
        Object.entries(bySub).forEach(([k,v]) => { cur.bySub[k] = (cur.bySub[k]||0) + v; });
        byDate.set(date, cur);
      });
      const all = Array.from(byDate.entries()).map(([date, v]) => ({ date, rawUsedKg: v.raw, lossKg: v.loss, producedKgBySub: v.bySub }))
        .sort((a,b)=>String(a.date).localeCompare(String(b.date)))
        .slice(-points);
      rows = all;
    } catch (e) {
      console.warn('Production-derived fallback for category series failed', e);
    }
  }
  return rows.map(r => {
    const raw = Number(r.rawUsedKg) || 0;
    const producedBySub = r.producedKgBySub || {};
    const producedSum = Object.values(producedBySub).reduce((s, v) => s + (Number(v) || 0), 0);
    const lossKg = Number(r.lossKg) || Math.max(0, raw - producedSum);
    const denom = raw > 0 ? raw : (producedSum + lossKg || 1);
    const series = {};
    Object.entries(producedBySub).forEach(([spId, kg]) => { series[spId] = (Number(kg) || 0) / denom * 100; });
    const sumOthers = Object.values(series).reduce((s, v) => s + v, 0);
    series.loss = Math.max(0, 100 - sumOthers);
    return { date: r.date, series, labels: { ...subNames, loss: 'Loss' } };
  });
}

// Category daily totals for Raw vs Produced chart
export async function getCategoryDailyTotals(categoryId, { points = 60 } = {}) {
  if (!categoryId) return [];
  let rows = [];
  try {
    const qRef = query(
      collection(db, 'daily_category_stats'),
      where('categoryId','==', categoryId),
      orderBy('date','asc')
    );
    const snap = await getDocs(qRef);
    rows = snap.docs.map(d => d.data());
  } catch (e) {
    try {
      const snap = await getDocs(collection(db, 'daily_category_stats'));
      rows = snap.docs.map(d => d.data()).filter(r => String(r.categoryId) === String(categoryId));
    } catch {}
  }
  const series = rows
    .sort((a,b)=>String(a.date).localeCompare(String(b.date)))
    .slice(-points)
    .map(r => ({
      date: r.date,
      totalRawUsedKg: Number(r.rawUsedKg)||0,
      totalProducedKg: Object.values(r.producedKgBySub||{}).reduce((s,v)=>s+(Number(v)||0),0),
      totalLossKg: Number(r.lossKg)||0,
    }));
  return series;
}

export default { getInventorySummary, getDailyStats, getCategoryStackedPercentSeries, getCategoryDailyTotals };
