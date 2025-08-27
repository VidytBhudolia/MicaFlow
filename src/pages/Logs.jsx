import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { List, RefreshCw } from 'lucide-react';
import { logsService } from '../services/firebaseServices';
import InlineSpinner from '../components/InlineSpinner';

const todayISO = () => new Date().toISOString().slice(0,10);
const monthStartISO = () => { const d = new Date(); d.setDate(1); return d.toISOString().slice(0,10); };

const typeColor = (type) => {
  switch ((type||'').toLowerCase()) {
    case 'purchase': return 'text-emerald-700';
    case 'production': return 'text-blue-700';
    case 'inventory': return 'text-indigo-700';
    case 'order': return 'text-fuchsia-700';
    case 'supplier': return 'text-amber-700';
    case 'buyer': return 'text-cyan-700';
    case 'category':
    case 'subproduct': return 'text-orange-700';
    case 'settings': return 'text-teal-700';
    case 'admin': return 'text-red-700';
    default: return 'text-gray-700';
  }
};

export default function Logs() {
  const [range, setRange] = useState({ start: monthStartISO(), end: todayISO() });
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [limitCount, setLimitCount] = useState(10);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      // Include the whole end day by pushing end one day forward when using string date filter
      const endInclusive = range.end;
      const endBump = endInclusive ? new Date(endInclusive) : null;
      if (endBump) { endBump.setDate(endBump.getDate() + 1); }
      const list = await logsService.getLogs({ startDate: range.start, endDate: endBump ? endBump.toISOString().slice(0,10) : range.end, limitCount });
      setLogs(Array.isArray(list) ? list : []);
    } catch (e) {
      setError(e?.message || 'Failed to load logs');
    } finally { setLoading(false); }
  }, [range, limitCount]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <List className="w-6 h-6 text-primary-orange" />
        <h1 className="text-2xl font-semibold text-secondary-blue">Activity Logs</h1>
      </div>
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
          <label className="block text-xs font-semibold text-gray-500 mb-1">Show</label>
          <select value={limitCount} onChange={e=>setLimitCount(Number(e.target.value)||10)} className="form-select-mica">
            <option value={10}>Latest 10</option>
            <option value={25}>Latest 25</option>
            <option value={50}>Latest 50</option>
          </select>
        </div>
        <div className="flex items-center gap-2 mt-6">
          <button onClick={load} disabled={loading} className="btn-secondary-mica flex items-center gap-2">{loading && <InlineSpinner size={14}/>} Refresh</button>
        </div>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

      <div className="overflow-hidden border border-light-gray-border rounded-md bg-white-bg">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-2 text-left">Time</th>
              <th className="px-4 py-2 text-left">Type</th>
              <th className="px-4 py-2 text-left">Action</th>
              <th className="px-4 py-2 text-left">Message</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-light-gray-border">
            {logs.map((l) => {
              const ts = l.ts?.toDate ? l.ts.toDate() : (l.createdAt ? new Date(l.createdAt) : null);
              const tsStr = ts ? ts.toLocaleString() : '';
              return (
                <tr key={l.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 whitespace-nowrap text-gray-600">{tsStr}</td>
                  <td className={`px-4 py-2 font-medium ${typeColor(l.type)}`}>{l.type}</td>
                  <td className="px-4 py-2 text-gray-700">{l.action}</td>
                  <td className="px-4 py-2 text-gray-800">{l.message}</td>
                </tr>
              );
            })}
            {logs.length === 0 && !loading && (
              <tr><td className="px-4 py-4 text-center text-gray-500" colSpan={4}>No logs found for selected range.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
