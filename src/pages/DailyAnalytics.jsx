import React, { useEffect, useState, useCallback } from 'react';
import { getDailyStats, getCategoryDailyTotals } from '../services/dashboardService';
import { categoriesService } from '../services/firebaseServices';
import InlineSpinner from '../components/InlineSpinner';
import { dataService } from '../services/dataService';

const formatNum = (n) => (Number.isFinite(n) ? n.toLocaleString(undefined,{ maximumFractionDigits: 1 }) : '0');

const todayISO = () => new Date().toISOString().slice(0,10);
const monthStartISO = () => { const d = new Date(); d.setDate(1); return d.toISOString().slice(0,10); };

const DailyAnalytics = () => {
  const [range, setRange] = useState({ start: monthStartISO(), end: todayISO() });
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      if (!selectedCategoryId) {
        const data = await getDailyStats({ range });
        setStats(data);
      } else {
        // Build per-category daily rows within range, merging category totals with per-batch non-material metrics
        const [catTotals, batches] = await Promise.all([
          getCategoryDailyTotals(selectedCategoryId, { points: 365 }),
          dataService.getProductionBatches?.({ force: false }) || Promise.resolve([])
        ]);
        const inRange = (d) => (!range.start || d >= range.start) && (!range.end || d <= range.end);
        // Map date -> {raw, produced, loss}
        const byDate = new Map();
        (catTotals||[]).filter(r => inRange(String(r.date))).forEach(r => {
          byDate.set(String(r.date), {
            date: String(r.date),
            totalRawUsedKg: Number(r.totalRawUsedKg)||0,
            totalProducedKg: Number(r.totalProducedKg)||0,
            totalLossKg: Number(r.totalLossKg)||0,
            hammerChanges: 0,
            knifeChanges: 0,
            dieselUsedLiters: 0,
            workers: 0,
          });
        });
        // Merge metrics from production docs for this category
        (batches||[]).forEach(p => {
          const cat = String(p.productCategory||'');
          if (String(selectedCategoryId) !== cat) return;
          const date = String(p.processingDate || p.date || (p.createdAt ? String(p.createdAt).slice(0,10) : ''));
          if (!date || !inRange(date)) return;
          const cur = byDate.get(date) || {
            date,
            totalRawUsedKg: Number(p.rawMaterialUsedKg||p.rawUsedKg||0)||0,
            totalProducedKg: Number(p.totalProducedKg||0)||0,
            totalLossKg: Number(p.lossKg != null ? p.lossKg : Math.max(0,(p.rawMaterialUsedKg||p.rawUsedKg||0)-(p.totalProducedKg||0)))||0,
            hammerChanges: 0,
            knifeChanges: 0,
            dieselUsedLiters: 0,
            workers: 0,
          };
          cur.hammerChanges += Number(p.hammerChanges)||0;
          cur.knifeChanges += Number(p.knifeChanges)||0;
          cur.dieselUsedLiters += Number(p.dieselUsedLiters)||0;
          cur.workers += Number(p.workers)||((Number(p.numMaleWorkers)||0)+(Number(p.numFemaleWorkers)||0));
          byDate.set(date, cur);
        });
        const rows = Array.from(byDate.values()).sort((a,b)=>a.date.localeCompare(b.date)).map(r => ({
          ...r,
          yieldPercent: r.totalRawUsedKg ? (r.totalProducedKg / r.totalRawUsedKg) * 100 : 0,
        }));
        setStats(rows);
      }
    } catch (e) {
      setError(e?.message || 'Failed to load daily stats');
    } finally { setLoading(false); }
  }, [range, selectedCategoryId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { categoriesService.getCategories().then(setCategories).catch(()=>setCategories([])); }, []);

  // no secondary list anymore

  const summary = stats.reduce((acc, d) => {
    acc.raw += d.totalRawUsedKg || 0;
    acc.produced += d.totalProducedKg || 0;
    acc.loss += d.totalLossKg || 0;
    acc.hammer += d.hammerChanges || 0;
    acc.knife += d.knifeChanges || 0;
    acc.diesel += d.dieselUsedLiters || 0;
    acc.workers += d.workers || 0;
    return acc;
  }, { raw:0, produced:0, loss:0, hammer:0, knife:0, diesel:0, workers:0 });
  summary.yieldPercent = summary.raw ? (summary.produced / summary.raw) * 100 : 0;
  summary.lossPercent = summary.raw ? (summary.loss / summary.raw) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-end flex-wrap gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Start Date</label>
          <input type="date" value={range.start} max={range.end} onChange={e => setRange(r => ({ ...r, start: e.target.value }))} className="form-input-mica" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">End Date</label>
          <input type="date" value={range.end} min={range.start} onChange={e => setRange(r => ({ ...r, end: e.target.value }))} className="form-input-mica" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Category</label>
          <select value={selectedCategoryId} onChange={e=>setSelectedCategoryId(e.target.value)} className="form-select-mica min-w-56">
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2 mt-6">
          <button onClick={load} disabled={loading} className="btn-secondary-mica flex items-center gap-2">{loading && <InlineSpinner size={14} />} Refresh</button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
        <Stat label="Raw Used (Kg)" value={summary.raw} />
        <Stat label="Produced (Kg)" value={summary.produced} />
        <Stat label="Loss (Kg)" value={summary.loss} />
        <Stat label="Yield %" value={summary.yieldPercent} suffix="%" decimals={1} />
        <Stat label="Loss %" value={summary.lossPercent} suffix="%" decimals={1} />
        <Stat label="Diesel (L)" value={summary.diesel} />
        <Stat label="Hammer Chg" value={summary.hammer} />
        <Stat label="Knife Chg" value={summary.knife} />
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

      <div className="overflow-auto border border-light-gray-border rounded-md bg-white-bg">
        <table className="min-w-full text-sm">
      <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <Th>Date</Th>
              <Th>Raw Used (Kg)</Th>
              <Th>Produced (Kg)</Th>
              <Th>Loss (Kg)</Th>
              <Th>Loss %</Th>
              <Th>Yield %</Th>
              <Th>Workers</Th>
              <Th>Diesel (L)</Th>
        <Th>Hammer</Th>
        <Th>Knife</Th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={11} className="py-10 text-center"><InlineSpinner size={24} /></td></tr>
            ) : stats.length === 0 ? (
              <tr><td colSpan={11} className="py-6 text-center text-gray-500">No data</td></tr>
            ) : (
              stats.map(d => {
                const lossPercent = d.totalRawUsedKg ? (d.totalLossKg / d.totalRawUsedKg) * 100 : 0;
                return (
                  <tr key={d.date} className="border-t border-light-gray-border hover:bg-gray-50">
                    <Td>{d.date}</Td>
                    <Td>{formatNum(d.totalRawUsedKg)}</Td>
                    <Td>{formatNum(d.totalProducedKg)}</Td>
                    <Td>{formatNum(d.totalLossKg)}</Td>
                    <Td>{lossPercent.toFixed(1)}%</Td>
                    <Td>{d.yieldPercent?.toFixed(1)}%</Td>
                    <Td>{d.workers}</Td>
                    <Td>{d.dieselUsedLiters}</Td>
                    <Td>{d.hammerChanges}</Td>
                    <Td>{d.knifeChanges}</Td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

  {/* Secondary list removed; main table reflects the category filter */}
    </div>
  );
};

const Stat = ({ label, value, suffix='', decimals=0 }) => (
  <div className="mica-card p-3">
    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-0.5">{label}</p>
    <p className="text-lg font-bold text-secondary-blue">{Number(value||0).toLocaleString(undefined,{ maximumFractionDigits: decimals })}{suffix}</p>
  </div>
);

const Th = ({ children }) => <th className="px-3 py-2 text-left font-semibold">{children}</th>;
const Td = ({ children }) => <td className="px-3 py-2 whitespace-nowrap">{children}</td>;

export default DailyAnalytics;
