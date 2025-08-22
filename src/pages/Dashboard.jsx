import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Package, ShoppingCart, BarChart3, Users, Truck, FileText, Settings, RefreshCw } from 'lucide-react';
import { dataService } from '../services/dataService';
import { getInventorySummary, getDailyStats as getDailyStatsAgg } from '../services/dashboardService';
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

  const totalProducedKg = production.reduce((sum, batch) => sum + (batch.totalKg || 0), 0);
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

  const stats = [
    { label: 'Suppliers', value: suppliers.length, color: 'text-secondary-blue' },
    { label: 'Categories', value: categories.length, color: 'text-green-600' },
    { label: 'Sub-Products', value: totalSubProducts, color: 'text-primary-orange' },
    { label: 'Total Produced (kg)', value: totalProducedKg.toFixed(0), color: 'text-tertiary-gold' },
    { label: 'Total Purchased (kg)', value: totalPurchaseKg.toFixed(0), color: 'text-secondary-blue' },
  ];

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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white-bg rounded-lg shadow-md p-5 border border-light-gray-border">
            <p className="text-xs font-medium text-body uppercase tracking-wider mb-1">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{loading ? '…' : stat.value}</p>
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

      {/* Replace old inventory/yield cards with analytics */}
      {invSummary && (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          <div className="mica-card p-4"><p className="text-sm text-gray-500">Raw Stock (Kg)</p><p className="text-2xl font-semibold">{invSummary.rawStockTotal.toLocaleString()}</p></div>
          <div className="mica-card p-4"><p className="text-sm text-gray-500">Finished Categories</p><p className="text-2xl font-semibold">{invSummary.finishedStockPerCategory.length}</p></div>
          <div className="mica-card p-4"><p className="text-sm text-gray-500">Sub-Products Tracked</p><p className="text-2xl font-semibold">{invSummary.finishedStockPerSubProduct.length}</p></div>
          <div className="mica-card p-4"><p className="text-sm text-gray-500">Suppliers (Raw in stock)</p><p className="text-2xl font-semibold">{invSummary.rawStockPerSupplier.length}</p></div>
        </div>
      )}

      {/* Charts Section */}
      <div className="mt-8 grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="mica-card p-4 h-96 flex flex-col">
          <h3 className="font-semibold mb-2 text-secondary-blue">Yield & Loss Trend</h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" fontSize={12} />
              <YAxis yAxisId="left" fontSize={12} />
              <YAxis yAxisId="right" orientation="right" fontSize={12} />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="yieldPercent" stroke="#2563eb" strokeWidth={2} dot={false} name="Yield %" />
              <Line yAxisId="right" type="monotone" dataKey="totalLossKg" stroke="#dc2626" strokeWidth={2} dot={false} name="Loss Kg" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mica-card p-4 h-96 flex flex-col">
          <h3 className="font-semibold mb-2 text-secondary-blue">Raw vs Produced (Kg)</h3>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend} stackOffset="none" margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
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
              <Legend />
              <Area type="monotone" dataKey="totalRawUsedKg" stroke="#f59e0b" fillOpacity={1} fill="url(#rawColor)" name="Raw Used" />
              <Area type="monotone" dataKey="totalProducedKg" stroke="#10b981" fillOpacity={1} fill="url(#prodColor)" name="Produced" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Inventory Breakdown */}
      {invSummary && (
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="mica-card p-4">
            <h3 className="font-semibold mb-3 text-secondary-blue">Finished Stock by Category (Kg)</h3>
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {invSummary.finishedStockPerCategory.map(c => {
                const subs = invSummary.finishedStockPerSubProduct.filter(sp => sp.categoryId === c.categoryId);
                return (
                  <div key={c.categoryId} className="border-b last:border-b-0 border-light-gray-border pb-2">
                    <div className="flex items-center justify-between text-sm font-semibold">
                      <span>{c.name}</span>
                      <span>{c.totalKg.toLocaleString()}</span>
                    </div>
                    {subs.length > 0 && (
                      <div className="mt-1 pl-2 space-y-1">
                        {subs.map(sp => (
                          <div key={sp.subProductId} className="flex justify-between text-xs text-gray-600">
                            <span>{sp.name}</span>
                            <span className="font-medium text-gray-700">{sp.totalKg.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mica-card p-4">
            <h3 className="font-semibold mb-3 text-secondary-blue">Raw Stock by Supplier (Kg)</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
              {invSummary.rawStockPerSupplier.map(s => (
                <div key={s.supplierId} className="flex items-center justify-between text-sm">
                  <span>{s.name}</span>
                  <span className="font-semibold">{s.totalKg.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Operational Indicators */}
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

      {/* High Loss Days */}
      {trend.length > 0 && (
        <div className="mt-8 mica-card p-4">
          <h3 className="font-semibold mb-3 text-secondary-blue">High Loss Days (&gt;10%)</h3>
          <div className="flex flex-col gap-1 text-sm max-h-60 overflow-y-auto">
            {trend.filter(d => d.totalRawUsedKg && (d.totalLossKg / d.totalRawUsedKg) * 100 > 10).map(d => (
              <div key={d.date} className="flex justify-between border-b border-light-gray-border py-1 last:border-b-0">
                <span>{d.date}</span>
                <span className="font-semibold text-red-600">{((d.totalLossKg / d.totalRawUsedKg) * 100).toFixed(1)}%</span>
              </div>
            ))}
            {trend.filter(d => d.totalRawUsedKg && (d.totalLossKg / d.totalRawUsedKg) * 100 > 10).length === 0 && <p className="text-gray-500">None</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
