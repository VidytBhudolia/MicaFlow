import React, { useEffect, useState, useCallback } from 'react';
import { getInventorySummary } from '../services/dashboardService';
import { inventoryService, categoriesService, suppliersService } from '../services/firebaseServices';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Package, Layers, Boxes, Factory, RefreshCw } from 'lucide-react';

const COLORS = ['#FF7A00','#2563eb','#F2B705','#16a34a','#9333ea','#dc2626','#0d9488','#f59e0b','#3b82f6','#ef4444'];

const Inventory = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState(null);
  const [inventoryDocs, setInventoryDocs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [showZeroCats, setShowZeroCats] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [sum, cats, sups, invDocs] = await Promise.all([
        getInventorySummary(),
        categoriesService.getCategories(),
        suppliersService.getSuppliers(),
        inventoryService.getInventoryItems ? inventoryService.getInventoryItems() : Promise.resolve([])
      ]);
      setSummary(sum);
      setCategories(cats||[]);
      setSuppliers(sups||[]);
      setInventoryDocs(invDocs||[]);
    } catch (e) {
      console.error('Inventory load failed', e);
      setError(e?.message || 'Failed to load inventory');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const totalFinished = summary?.finishedStockPerSubProduct?.reduce((s,i)=>s+i.totalKg,0)||0;
  const finishedCategoryData = (summary?.finishedStockPerCategory||[]).map(c => ({ name: c.name, kg: c.totalKg }));
  const rawSupplierData = (summary?.rawStockPerSupplier||[]).map(s => ({ name: s.name, kg: s.totalKg }));
  const topSubProducts = [...(summary?.finishedStockPerSubProduct||[])].sort((a,b)=>b.totalKg-a.totalKg).slice(0,10).map(sp => ({ name: sp.name, kg: sp.totalKg }));

  // Build hierarchical category -> sub-products listing
  // Build a map for quick lookup of sub-product stock
  const spStockMap = new Map((summary?.finishedStockPerSubProduct||[]).map(s => [s.subProductId, s.totalKg]));
  // Ensure we consider all categories (optionally include zero-stock ones)
  const allCategoryIds = new Set((summary?.finishedStockPerCategory||[]).map(c => String(c.categoryId)));
  if (showZeroCats) categories.forEach(c => allCategoryIds.add(String(c.id)));
  const categoryTree = Array.from(allCategoryIds).map(cid => {
    const cat = categories.find(c => String(c.id) === String(cid));
    const catSum = (summary?.finishedStockPerCategory||[]).find(c => String(c.categoryId) === String(cid)) || { totalKg: 0, name: cat?.name || 'Uncategorized' };
    const subs = (cat?.subProducts||[]).map(sp => ({
      id: sp.id,
      name: sp.name,
      stockKg: spStockMap.get(sp.id) || 0
    })).filter(sp => sp.stockKg > 0 || showZeroCats).sort((a,b)=>b.stockKg-a.stockKg);
    return { id: cid, name: cat?.name || catSum.name, totalKg: catSum.totalKg || 0, subs };
  }).sort((a,b)=> (b.totalKg - a.totalKg));

  const pieData = finishedCategoryData.filter(d => d.kg > 0);

  return (
    <div id="inventory" className="space-y-8">
      <div className="flex items-center gap-3 mb-2">
        <Layers className="w-8 h-8 text-primary-orange" />
        <div>
          <h1 className="text-3xl font-bold text-secondary-blue">Inventory Overview</h1>
          <p className="text-body">Raw & finished goods current stock (kg)</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <label className="text-xs text-body flex items-center gap-2">
            <input type="checkbox" className="accent-primary-orange" checked={showZeroCats} onChange={(e)=>setShowZeroCats(e.target.checked)} />
            Show zero-stock categories
          </label>
          <button onClick={load} className="btn-secondary-mica flex items-center gap-2 text-sm"><RefreshCw className="w-4 h-4"/> Refresh</button>
        </div>
      </div>

      {error && <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded">{error}</div>}
      {loading && <div className="p-4 bg-white rounded shadow text-sm">Loading inventory...</div>}

      {!loading && summary && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="bg-white-bg rounded-lg shadow p-4 border border-light-gray-border">
              <div className="flex items-center justify-between mb-2"><span className="text-sm font-medium text-body">RAW STOCK TOTAL</span><Factory className="w-5 h-5 text-secondary-blue"/></div>
              <p className="text-2xl font-bold text-secondary-blue">{summary.rawStockTotal.toFixed(1)} kg</p>
            </div>
            <div className="bg-white-bg rounded-lg shadow p-4 border border-light-gray-border">
              <div className="flex items-center justify-between mb-2"><span className="text-sm font-medium text-body">FINISHED STOCK TOTAL</span><Package className="w-5 h-5 text-primary-orange"/></div>
              <p className="text-2xl font-bold text-primary-orange">{totalFinished.toFixed(1)} kg</p>
            </div>
            <div className="bg-white-bg rounded-lg shadow p-4 border border-light-gray-border">
              <div className="flex items-center justify-between mb-2"><span className="text-sm font-medium text-body">CATEGORIES W/ STOCK</span><Boxes className="w-5 h-5 text-tertiary-gold"/></div>
              <p className="text-2xl font-bold text-tertiary-gold">{finishedCategoryData.filter(c=>c.kg>0).length}</p>
            </div>
            <div className="bg-white-bg rounded-lg shadow p-4 border border-light-gray-border">
              <div className="flex items-center justify-between mb-2"><span className="text-sm font-medium text-body">SUPPLIERS (RAW)</span><Layers className="w-5 h-5 text-green-600"/></div>
              <p className="text-2xl font-bold text-green-600">{rawSupplierData.filter(s=>s.kg>0).length}</p>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <div className="bg-white-bg rounded-lg shadow p-4 border border-light-gray-border">
              <h3 className="font-semibold mb-3 text-secondary-blue">Raw Stock by Supplier</h3>
              {rawSupplierData.length === 0 ? <p className="text-sm text-body">No raw stock.</p> : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={rawSupplierData} layout="vertical" margin={{left: 60, right: 16, top: 10, bottom: 10}}>
                      <XAxis type="number" tickFormatter={v=>v.toFixed(0)} />
                      <YAxis type="category" dataKey="name" width={120} />
                      <Tooltip formatter={(v)=>[v+' kg','Stock']} />
                      <Bar dataKey="kg" fill="#2563eb" radius={[0,4,4,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="bg-white-bg rounded-lg shadow p-4 border border-light-gray-border">
              <h3 className="font-semibold mb-3 text-secondary-blue">Finished Stock by Category</h3>
              {finishedCategoryData.length === 0 ? <p className="text-sm text-body">No finished stock.</p> : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} dataKey="kg" nameKey="name" innerRadius={55} outerRadius={95} paddingAngle={2}>
                        {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v, n)=>[v+' kg', n]} />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="bg-white-bg rounded-lg shadow p-4 border border-light-gray-border lg:col-span-2">
              <h3 className="font-semibold mb-3 text-secondary-blue">Top Sub-Products (kg)</h3>
              {topSubProducts.length === 0 ? <p className="text-sm text-body">No finished sub-product stock.</p> : (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topSubProducts} margin={{ left: 20, right: 16, top: 10, bottom: 40 }}>
                      <XAxis dataKey="name" interval={0} angle={-30} textAnchor="end" height={70} />
                      <YAxis tickFormatter={v=>v.toFixed(0)} />
                      <Tooltip formatter={(v)=>[v+' kg','Stock']} />
                      <Bar dataKey="kg" fill="#FF7A00" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white-bg rounded-lg shadow p-4 border border-light-gray-border">
            <h3 className="font-semibold mb-4 text-secondary-blue">Category Breakdown with Sub-Products</h3>
            {categoryTree.length === 0 && <p className="text-sm text-body">No finished stock recorded.</p>}
            <div className="space-y-6">
              {categoryTree.map(cat => (
                <div key={cat.id} className="border border-light-gray-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-secondary-blue">{cat.name}</h4>
                    <span className="text-sm font-medium text-primary-orange">{cat.totalKg.toFixed(1)} kg</span>
                  </div>
                  {cat.subs.length === 0 ? (
                    <p className="text-xs text-body">No sub-product stock in this category.</p>
                  ) : (
                    <ul className="divide-y divide-light-gray-border">
                      {cat.subs.map(sp => (
                        <li key={sp.id} className="py-2 flex items-center justify-between text-sm">
                          <span>{sp.name}</span>
                          <span className="font-medium text-secondary-blue">{sp.stockKg.toFixed(1)} kg</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Inventory;
