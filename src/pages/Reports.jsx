import React, { useEffect, useState } from 'react';
import { getInventorySummary } from '../services/dashboardService';

const Reports = () => {
  const [invSummary, setInvSummary] = useState(null);
  useEffect(() => { getInventorySummary().then(setInvSummary).catch(()=>setInvSummary(null)); }, []);
  return (
    <div id="reports" className="">
      <h1 className="text-3xl font-bold text-secondary mb-6">Reports & Analytics</h1>
      {invSummary ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          <div className="mica-card p-4"><p className="text-sm text-gray-500">Raw Stock (Kg)</p><p className="text-2xl font-semibold">{invSummary.rawStockTotal.toLocaleString()}</p></div>
          <div className="mica-card p-4"><p className="text-sm text-gray-500">Finished Categories</p><p className="text-2xl font-semibold">{invSummary.finishedStockPerCategory.length}</p></div>
          <div className="mica-card p-4"><p className="text-sm text-gray-500">Sub-Products Tracked</p><p className="text-2xl font-semibold">{invSummary.finishedStockPerSubProduct.length}</p></div>
          <div className="mica-card p-4"><p className="text-sm text-gray-500">Suppliers (Raw in stock)</p><p className="text-2xl font-semibold">{invSummary.rawStockPerSupplier.length}</p></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6"><p className="text-gray-600">Loading…</p></div>
      )}
    </div>
  );
};

export default Reports;
