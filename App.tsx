import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import ClientSignup from './pages/ClientSignup';
import ScheduleManager from './pages/ScheduleManager';
import AdminPanel from './pages/AdminPanel';
import ProtectedRoute from './components/ProtectedRoute';

const App: React.FC = () => {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<ClientSignup />} />
          
          {/* Employee & Admin Routes */}
          <Route 
            path="/schedule-manager" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'employee']}>
                <ScheduleManager />
              </ProtectedRoute>
            } 
          />
          
          {/* Admin Only Route */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminPanel />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;