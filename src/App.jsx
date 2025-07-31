import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import SupplierManagement from './pages/SupplierManagement';
import './App.css';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/suppliers" element={<SupplierManagement />} />
          <Route path="/inventory" element={<div className="content-wrapper-mica"><div className="card-mica"><h1 className="text-heading text-2xl">Inventory Management</h1><p className="text-secondary-text">Coming soon...</p></div></div>} />
          <Route path="/production" element={<div className="content-wrapper-mica"><div className="card-mica"><h1 className="text-heading text-2xl">Production Management</h1><p className="text-secondary-text">Coming soon...</p></div></div>} />
          <Route path="/orders" element={<div className="content-wrapper-mica"><div className="card-mica"><h1 className="text-heading text-2xl">Orders Management</h1><p className="text-secondary-text">Coming soon...</p></div></div>} />
          <Route path="/analytics" element={<div className="content-wrapper-mica"><div className="card-mica"><h1 className="text-heading text-2xl">Analytics Dashboard</h1><p className="text-secondary-text">Coming soon...</p></div></div>} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
