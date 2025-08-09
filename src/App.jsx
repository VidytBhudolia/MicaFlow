import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import RawMaterialPurchase from './pages/RawMaterialPurchase';
import DailyProcessing from './pages/DailyProcessing';
import Management from './pages/Management';
import OrderSheet from './pages/OrderSheet';
import Inventory from './pages/Inventory';
import Reports from './pages/Reports';
import DailyAnalytics from './pages/DailyAnalytics';
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
            <Route path="/order-sheet" element={<OrderSheet />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/daily-analytics" element={<DailyAnalytics />} />
            {/* Legacy redirects */}
            <Route path="/inventory-analytics" element={<Navigate to="/inventory" replace />} />
            <Route path="/logs-adjustments" element={<Navigate to="/management" replace />} />
            <Route path="/material-deduction" element={<Navigate to="/management" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
