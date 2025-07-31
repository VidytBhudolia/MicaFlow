import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import RawMaterialPurchase from './pages/RawMaterialPurchase';
import DailyProcessing from './pages/DailyProcessing';
import Management from './pages/Management';
import MaterialDeduction from './pages/MaterialDeduction';
import OrderSheet from './pages/OrderSheet';
import InventoryAnalytics from './pages/InventoryAnalytics';
import LogsAdjustments from './pages/LogsAdjustments';
import SupplierManagement from './pages/SupplierManagement';
import Inventory from './pages/Inventory';
import Reports from './pages/Reports';
import './App.css';

function App() {
  return (
    <Router>
      <div className="relative flex size-full min-h-screen flex-col bg-[#F7F8FA] font-inter overflow-x-hidden">
        <Navbar />
        {/* The main content area now uses full width with proper top padding for fixed navbar */}
        <main className="flex flex-1 flex-col pt-20 px-6 w-full max-w-none min-h-screen">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/raw-material-purchase" element={<RawMaterialPurchase />} />
            <Route path="/daily-processing" element={<DailyProcessing />} />
            <Route path="/management" element={<Management />} />
            <Route path="/material-deduction" element={<MaterialDeduction />} />
            <Route path="/order-sheet" element={<OrderSheet />} />
            <Route path="/inventory-analytics" element={<InventoryAnalytics />} />
            <Route path="/logs-adjustments" element={<LogsAdjustments />} />
            <Route path="/supplier-management" element={<SupplierManagement />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/reports" element={<Reports />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
