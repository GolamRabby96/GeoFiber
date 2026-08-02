import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import AppContent from './AppContent';
import AdminLogin from './components/AdminLogin';
import AdminPanel from './components/AdminPanel';

const API_URL = '/api';

function App() {
  const [isAdmin, setIsAdmin] = useState(false);

  const AdminRoute = ({ children }) => {
    if (!isAdmin) {
      return <AdminLogin onLogin={() => setIsAdmin(true)} />;
    }
    return children;
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppContent />} />
        <Route path="/admin" element={
          <AdminRoute>
            <AdminPanel />
          </AdminRoute>
        } />
        <Route path="/admin/panel" element={
          <AdminRoute>
            <AdminPanel />
          </AdminRoute>
        } />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
