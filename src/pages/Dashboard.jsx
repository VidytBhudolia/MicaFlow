import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Package, ShoppingCart, BarChart3, Users, Truck, FileText, Settings, RefreshCw } from 'lucide-react';
import { dataService } from '../services/dataService';
import { getInventorySummary, getDailyStats as getDailyStatsAgg, getCategoryStackedPercentSeries, getCategoryDailyTotals } from '../services/dashboardService';
import { settingsService } from '../services/firebaseServices';
import { AreaChart, Area, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [production, setProduction] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [dailyStats, setDailyStats] = useState([]);
  const [invSummary, setInvSummary] = useState(null);
  const [trend, setTrend] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [rvpMode, setRvpMode] = useState('general'); // 'general' | 'category'
  const [rvpCategoryId, setRvpCategoryId] = useState('');
  const [categorySeries, setCategorySeries] = useState([]);
  const [rvpCategorySeries, setRvpCategorySeries] = useState([]);
  const [featuredSubProducts, setFeaturedSubProducts] = useState([]);
  const [topCards, setTopCards] = useState([]);
  const [isMobile, setIsMobile] = useState(() => (typeof window !== 'undefined' ? window.innerWidth < 768 : false));

  const loadData = useCallback(async (force = false) => {
    setError('');
    try {
      setLoading(true);
      const [s, c, pu, pr] = await Promise.all([
        dataService.getSuppliers({ force }),
        dataService.getCategories({ force }),
        dataService.getPurchases ? dataService.getPurchases({ force }) : Promise.resolve([]),
        dataService.getProductionBatches ? dataService.getProductionBatches({ force }) : Promise.resolve([]),
      ]);
      setSuppliers(s || []);
      setCategories(c || []);
      setPurchases(pu || []);
      setProduction(pr || []);
    } catch (e) {
      console.error('Dashboard load error', e);
      setError(e?.message || 'Failed to load data');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(false); }, [loadData]);

  const load = async () => {
    setLoading(true);
    try {
      const inv = await dataService.getInventory();
      setInventory(inv || []);
  const stats = await dataService.getDailyStats();
      setDailyStats(stats || []);
    } catch (e) {
      console.error('Failed loading dashboard data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  load();
  }, []);

  const loadAnalytics = useCallback(async () => {
    try {
      const [inv, daily] = await Promise.all([
        getInventorySummary(),
        getDailyStatsAgg({})
      ]);
      setInvSummary(inv);
      setTrend(daily);
    } catch (e) { console.error('Analytics load failed', e); }
  }, []);
  useEffect(() => { loadAnalytics(); }, [loadAnalytics]);

  // Load dashboard settings (featured sub-products)
  useEffect(() => {
    let mounted = true;
  const onResize = () => { if (mounted) setIsMobile(window.innerWidth < 768); };
  window.addEventListener('resize', onResize);
    (async () => {
      try {
        const s = await settingsService.getDashboardSettings();
        if (mounted) {
          setFeaturedSubProducts(Array.isArray(s.featuredSubProducts) ? s.featuredSubProducts : []);
          setTopCards(Array.isArray(s.topCards) ? s.topCards : []);
        }
      } catch { if (mounted) { setFeaturedSubProducts([]); setTopCards([]); } }
    })();
  return () => { mounted = false; window.removeEventListener('resize', onResize); };
  }, []);

  // Default selected category to the first (top) category when categories arrive
  useEffect(() => {
    if (!selectedCategoryId && categories.length > 0) {
      setSelectedCategoryId(String(categories[0].id));
      if (!rvpCategoryId) setRvpCategoryId(String(categories[0].id));
    }
  }, [categories, selectedCategoryId, rvpCategoryId]);

  // Load category stacked 100% data for selected category (30 points)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const catId = selectedCategoryId || (categories[0]?.id ? String(categories[0].id) : '');
        if (!catId) { if (mounted) setCategorySeries([]); return; }
        const series = await getCategoryStackedPercentSeries(catId, { points: 30 });
        if (mounted) setCategorySeries(series);
      } catch (e) {
        console.error('Category stacked series load failed', e);
        if (mounted) setCategorySeries([]);
      }
    })();
    return () => { mounted = false; };
  }, [selectedCategoryId, categories]);

  // Refresh category chart when data updates elsewhere
  useEffect(() => {
    const handler = () => {
      const id = selectedCategoryId || (categories[0]?.id ? String(categories[0].id) : '');
      if (!id) return;
      getCategoryStackedPercentSeries(id, { points: 30 }).then(setCategorySeries).catch(()=>{});
    };
    window.addEventListener('micaflow:updated', handler);
    return () => window.removeEventListener('micaflow:updated', handler);
  }, [selectedCategoryId, categories]);

  // Load RVP category series when mode/category changes
  useEffect(() => {
    let active = true;
    (async () => {
      if (rvpMode !== 'category' || !rvpCategoryId) { if (active) setRvpCategorySeries([]); return; }
      try { const s = await getCategoryDailyTotals(rvpCategoryId, { points: 60 }); if (active) setRvpCategorySeries(s); } catch { if (active) setRvpCategorySeries([]); }
    })();
    return () => { active = false; };
  }, [rvpMode, rvpCategoryId]);

  // Fix total produced computation using normalized daily stats
  const totalProducedKg = dailyStats.reduce((sum, d) => sum + (d.totalProducedKg || 0), 0);
  const totalPurchaseKg = purchases.reduce((sum, p) => sum + (p.quantityKg || 0), 0);
  const totalSubProducts = categories.reduce((sum, cat) => sum + (cat.subProducts?.length || 0), 0);
  const totalRawStockKg = inventory.filter(i => i.type === 'raw').reduce((s,i)=>s + (i.quantityKg||0),0);
  const totalFinishedStockKg = inventory.filter(i => i.type === 'finished').reduce((s,i)=>s + (i.quantityKg||0),0);

  const aggregateDaily = dailyStats.reduce((acc, d) => {
    acc.raw += d.rawMaterialUsedKgTotal || 0;
    acc.produced += d.producedKgTotal || 0;
    acc.loss += d.lossKgTotal || 0;
    return acc;
  }, { raw:0, produced:0, loss:0 });

  const overallYieldPct = aggregateDaily.raw ? ((aggregateDaily.produced / aggregateDaily.raw) * 100).toFixed(1) : '0.0';
  const overallLossPct = aggregateDaily.raw ? ((aggregateDaily.loss / aggregateDaily.raw) * 100).toFixed(1) : '0.0';

  // Helper: consistent color for stat keys / featured items
  const colorForKey = (key, idx = 0) => {
    const map = {
      rawStock: 'text-secondary-blue',
      totalProducedKg: 'text-green-600',
      totalPurchasedKg: 'text-primary-orange',
      suppliersCount: 'text-indigo-600',
      categoriesCount: 'text-purple-600',
      subProductsCount: 'text-tertiary-gold',
      thisMonthDiesel: 'text-amber-600',
      thisMonthWorkers: 'text-rose-600',
    };
    if (map[key]) return map[key];
    const palette = ['text-secondary-blue','text-green-600','text-primary-orange','text-tertiary-gold','text-indigo-600','text-purple-600','text-rose-600','text-amber-600'];
    return palette[idx % palette.length];
  };

  // Build dynamic top stats based on settings
  // Compute month-to-date diesel and workers from trend
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0,10);
  const mtd = (trend||[]).filter(d => String(d.date) >= monthStart);
  const mtdDiesel = mtd.reduce((s,d)=>s+(Number(d.dieselUsedLiters)||0),0);
  const mtdWorkers = mtd.reduce((s,d)=>s+(Number(d.workers)||0),0);
  const topStatMap = {
    rawStock: { label: 'Raw Stock (kg)', value: invSummary ? invSummary.rawStockTotal.toLocaleString() : '—' },
    totalProducedKg: { label: 'Total Produced (kg)', value: totalProducedKg.toFixed(0) },
    totalPurchasedKg: { label: 'Total Purchased (kg)', value: totalPurchaseKg.toFixed(0) },
    suppliersCount: { label: 'Suppliers', value: suppliers.length },
    categoriesCount: { label: 'Categories', value: categories.length },
    subProductsCount: { label: 'Sub-Products', value: totalSubProducts },
    thisMonthDiesel: { label: 'This Month Diesel (L)', value: mtdDiesel.toFixed(0) },
    thisMonthWorkers: { label: 'This Month Workers', value: mtdWorkers.toFixed(0) },
  };
  const statCards = (topCards && topCards.length ? topCards : ['rawStock','totalProducedKg','totalPurchasedKg'])
    .map((k, i) => ({ key: k, color: colorForKey(k, i), ...topStatMap[k] }))
    .filter(Boolean);

  // Featured sub-products as cards shown in the first row (with colors)
  const featuredCards = (() => {
    if (!featuredSubProducts || !invSummary) return [];
    return featuredSubProducts.slice(0,6).map((sel, idx) => {
      const sp = invSummary.finishedStockPerSubProduct.find(x => String(x.subProductId) === String(sel.subProductId));
      const name = sp?.name || (categories.find(c=>String(c.id)===String(sel.categoryId))?.subProducts||[]).find(p=>String(p.id)===String(sel.subProductId))?.name || '—';
      const qty = sp?.totalKg ?? 0;
      return {
        key: `featured:${sel.categoryId}:${sel.subProductId}`,
        label: name,
        value: Number(qty).toLocaleString(),
        color: colorForKey(`featured_${idx}`, idx)
      };
    });
  })();
  const topRowCards = [...statCards, ...featuredCards];

  const quickActions = [
    { title: 'Raw Purchase', icon: ShoppingCart, path: '/raw-material-purchase', color: 'bg-secondary-blue' },
    { title: 'Daily Processing', icon: Package, path: '/daily-processing', color: 'bg-green-500' },
    { title: 'Daily Analytics', icon: FileText, path: '/daily-analytics', color: 'bg-tertiary-gold' },
    { title: 'Inventory', icon: BarChart3, path: '/inventory', color: 'bg-secondary-blue' },
    { title: 'Order Sheet', icon: Truck, path: '/order-sheet', color: 'bg-primary-orange', desktopOnly: true },
    { title: 'Management', icon: Settings, path: '/management', color: 'bg-secondary-blue', desktopOnly: true },
    { title: 'Reports', icon: FileText, path: '/reports', color: 'bg-tertiary-gold', desktopOnly: true },
  ];

  return (
    <div id="dashboard" className="bg-light-gray-bg min-h-screen">
  <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-secondary-blue mb-1">MicaFlow Dashboard</h1>
          <p className="text-body">Factory overview</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={async () => {
              await Promise.all([
                loadData(true),
                (async () => { try { await load(); } catch {} })(),
                (async () => { try { await loadAnalytics(); } catch {} })(),
              ]);
            }}
            className="btn-secondary-mica flex items-center gap-2"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>
      {error && <div className="mb-4 text-sm text-red-600">{error}</div>}

      {/* Stats + Featured Sub-Products (first row) */}
      {/* Phone: compact 2-column grid */}
      <div className="grid grid-cols-2 gap-3 mb-6 md:hidden">
        {topRowCards.map((card, i) => (
          <div key={`${card.key}-m-${i}`} className="bg-white-bg rounded-lg shadow-md p-3 border border-light-gray-border">
            <p className="text-[10px] font-medium text-body uppercase tracking-wide mb-1 truncate" title={card.label}>{card.label}</p>
            <p className={`text-lg font-bold ${card.color}`}>{loading ? '…' : card.value}</p>
          </div>
        ))}
      </div>
      {/* Tablet/Desktop: grid cards */}
      <div className="hidden md:grid md:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        {topRowCards.map((card, i) => (
          <div key={`${card.key}-d-${i}`} className="bg-white-bg rounded-lg shadow-md p-5 border border-light-gray-border">
            <p className="text-xs font-medium text-body uppercase tracking-wider mb-1 truncate" title={card.label}>{card.label}</p>
            <p className={`text-2xl font-bold ${card.color}`}>{loading ? '…' : card.value}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white-bg rounded-lg shadow-md p-6 border border-light-gray-border">
        <h2 className="text-xl font-semibold text-secondary-blue mb-6">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
          {quickActions.filter((a, idx) => window.innerWidth < 640 ? idx < 4 : true).map((action) => (
            <Link
              key={action.title}
              to={action.path}
              className={`flex items-center p-4 rounded-lg border border-light-gray-border hover:border-primary-orange hover:shadow-md transition-all duration-200 bg-white-bg ${action.desktopOnly ? 'hidden sm:flex' : ''}`}
            >
              <div className={`${action.color} p-3 rounded-lg mr-4`}>
                <action.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-medium text-secondary-blue text-sm sm:text-base">{action.title}</h3>
                <p className="text-xs text-body hidden md:block">Go to {action.title}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Operational Indicators: moved up to replace the removed extra row */}
      <div className="mt-8 mica-card p-4">
        <h3 className="font-semibold mb-3 text-secondary-blue">Operational Indicators (Latest Day)</h3>
        {trend.length === 0 ? <p className="text-sm text-gray-500">No data</p> : (() => {
          const latest = trend[trend.length-1];
          const kgPerWorker = latest.workers ? (latest.totalProducedKg / latest.workers) : 0;
          const kgPerL = latest.dieselUsedLiters ? (latest.totalProducedKg / latest.dieselUsedLiters) : 0;
          const toolWearPerTonne = latest.totalRawUsedKg ? ((latest.hammerChanges + latest.knifeChanges) / (latest.totalRawUsedKg/1000)) : 0;
          return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div><p className="text-gray-500 text-xs mb-1">Workers</p><p className="font-semibold">{latest.workers}</p></div>
              <div><p className="text-gray-500 text-xs mb-1">Kg / Worker</p><p className="font-semibold">{kgPerWorker.toFixed(1)}</p></div>
              <div><p className="text-gray-500 text-xs mb-1">Kg / L Diesel</p><p className="font-semibold">{kgPerL.toFixed(1)}</p></div>
              <div><p className="text-gray-500 text-xs mb-1">Tool Wear / Tonne</p><p className="font-semibold">{toolWearPerTonne.toFixed(2)}</p></div>
            </div>
          );
        })()}
      </div>

      

  {/* Featured Sub-Products are included above in the top row */}

  {/* Charts Section */}
      <div className="mt-8 grid grid-cols-1 xl:grid-cols-2 gap-6">
  <div className="mica-card p-4 h-80 md:h-96 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-secondary-blue">Category Yield Breakdown (100%)</h3>
            <select className="form-select-mica w-full md:w-56" value={selectedCategoryId} onChange={(e)=>setSelectedCategoryId(e.target.value)}>
              <option value="">Select category</option>
              {categories.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
            </select>
          </div>
          {categorySeries.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-sm text-gray-500">No data yet for this category.</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={categorySeries.map(r => ({ date: r.date, ...r.series }))} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis domain={[0, 100]} ticks={[0,10,20,30,40,50,60,70,80,90,100]} fontSize={12} tickFormatter={(v)=>`${v}%`} />
                <Tooltip formatter={(v)=>`${Number(v).toFixed(1)}%`} />
                {!isMobile && <Legend />}
                {(() => {
                  const keys = Object.keys(categorySeries[0].series);
                  const labels = categorySeries[0].labels || {};
                  const palette = ['#10b981','#2563eb','#f59e0b','#9333ea','#ef4444','#14b8a6','#8b5cf6','#f97316','#22c55e','#64748b'];
                  return keys.map((k, idx) => (
                    <Area key={k} type="monotone" dataKey={k} stackId="1" stroke={palette[idx % palette.length]} fill={palette[idx % palette.length]} name={k === 'loss' ? 'Loss' : (labels[k] || k)} />
                  ));
                })()}
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
  <div className="mica-card p-4 h-72 md:h-96 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-secondary-blue">Raw vs Produced (Kg)</h3>
            <div className="flex items-center gap-2">
              <select className="form-select-mica" value={rvpMode} onChange={e=>setRvpMode(e.target.value)}>
                <option value="general">General</option>
                <option value="category">By Category</option>
              </select>
              {rvpMode === 'category' && (
    <select className="form-select-mica max-w-[60%]" value={rvpCategoryId} onChange={e=>setRvpCategoryId(e.target.value)}>
                  {categories.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
                </select>
              )}
            </div>
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={rvpMode === 'general' ? trend : rvpCategorySeries} stackOffset="none" margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="rawColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="prodColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              {!isMobile && <Legend />}
              <Area type="monotone" dataKey="totalRawUsedKg" stroke="#f59e0b" fillOpacity={1} fill="url(#rawColor)" name="Raw Used" />
              <Area type="monotone" dataKey="totalProducedKg" stroke="#10b981" fillOpacity={1} fill="url(#prodColor)" name="Produced" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      
    </div>
  );
};

export default Dashboard;
