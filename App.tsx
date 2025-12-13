import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import ScheduleManager from './pages/ScheduleManager';
import AdminPanel from './pages/AdminPanel';
import ProtectedRoute from './components/ProtectedRoute';
import { UserRole } from './types';

const App: React.FC = () => {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          {/* Public Route */}
          <Route path="/" element={<Home />} />
          
          {/* Login */}
          <Route path="/login" element={<Login />} />
          
          {/* Receptionist & Admin Routes */}
          <Route 
            path="/schedule-manager" 
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.RECEPTIONIST]}>
                <ScheduleManager />
              </ProtectedRoute>
            } 
          />
          
          {/* Admin Only Route */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
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