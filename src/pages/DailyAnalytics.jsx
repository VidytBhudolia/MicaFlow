import React, { useEffect, useState, useCallback } from 'react';
import { getDailyStats } from '../services/dashboardService';
import InlineSpinner from '../components/InlineSpinner';

const formatNum = (n) => (Number.isFinite(n) ? n.toLocaleString(undefined,{ maximumFractionDigits: 1 }) : '0');

const todayISO = () => new Date().toISOString().slice(0,10);
const monthStartISO = () => { const d = new Date(); d.setDate(1); return d.toISOString().slice(0,10); };

const DailyAnalytics = () => {
  const [range, setRange] = useState({ start: monthStartISO(), end: todayISO() });
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const data = await getDailyStats({ range });
      setStats(data);
    } catch (e) {
      setError(e?.message || 'Failed to load daily stats');
    } finally { setLoading(false); }
  }, [range]);

  useEffect(() => { load(); }, [load]);

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
        <Stat label="Hammer Chg" value={summary.hammer} />
        <Stat label="Knife Chg" value={summary.knife} />
        <Stat label="Diesel (L)" value={summary.diesel} />
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
              <Th>Hammer</Th>
              <Th>Knife</Th>
              <Th>Workers</Th>
              <Th>Diesel (L)</Th>
              <Th>Kg / L Diesel</Th>
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
                const kgPerL = d.dieselUsedLiters ? d.totalProducedKg / d.dieselUsedLiters : 0;
                return (
                  <tr key={d.date} className="border-t border-light-gray-border hover:bg-gray-50">
                    <Td>{d.date}</Td>
                    <Td>{formatNum(d.totalRawUsedKg)}</Td>
                    <Td>{formatNum(d.totalProducedKg)}</Td>
                    <Td>{formatNum(d.totalLossKg)}</Td>
                    <Td>{lossPercent.toFixed(1)}%</Td>
                    <Td>{d.yieldPercent?.toFixed(1)}%</Td>
                    <Td>{d.hammerChanges}</Td>
                    <Td>{d.knifeChanges}</Td>
                    <Td>{d.workers}</Td>
                    <Td>{d.dieselUsedLiters}</Td>
                    <Td>{kgPerL.toFixed(1)}</Td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
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
