/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from '@/src/contexts/AuthContext';
import { LanguageProvider, useLanguage } from '@/src/contexts/LanguageContext';
import Layout from '@/src/components/Layout';
import Login from '@/src/pages/Login';

// Import pages (we'll create these next)
import Dashboard from '@/src/pages/Dashboard';
import Menu from '@/src/pages/Menu';
import SalesNew from '@/src/pages/SalesNew';
import SalesHistory from '@/src/pages/SalesHistory';
import Expenses from '@/src/pages/Expenses';
import Stock from '@/src/pages/Stock';
import StockMovements from '@/src/pages/StockMovements';
import Reports from '@/src/pages/Reports';
import Settings from '@/src/pages/Settings';
import HRManagement from '@/src/pages/HRManagement';

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) => {
  const { session, profile, isLoading } = useAuth();
  const { t, language } = useLanguage();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="w-8 h-8 border-4 border-amber-600/30 border-t-amber-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    // We cannot use toast easily here while rendering, but we can do it in a useEffect or we can just navigate. Let's just navigate. Wait, user specifically says: "If cashier/staff visits blocked page, redirect to dashboard with message: “Access denied / 无权限访问”". Better to do this in a side effect.
    return <NavigateWithToastErrorMessage to="/dashboard" message={language === 'zh' ? "无权限访问" : "Access denied"} />;
  }

  return <>{children}</>;
};

const NavigateWithToastErrorMessage = ({ to, message }: { to: string, message: string }) => {
  React.useEffect(() => {
    toast.error(message);
  }, [message]);
  return <Navigate to={to} replace />;
};

const TitleUpdater = () => {
  const { t } = useLanguage();
  
  React.useEffect(() => {
    document.title = t('app.name');
  }, [t]);

  return null;
};

export default function App() {
  return (
    <LanguageProvider>
      <TitleUpdater />
      <BrowserRouter>
        <AuthProvider>
        <Toaster 
          position="top-right" 
          toastOptions={{
            style: {
              background: '#161616',
              color: '#e7e5e4',
              border: '1px solid rgb(41 37 36 / 0.6)',
            },
          }} 
        />
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            
            <Route 
              path="menu" 
              element={
                <ProtectedRoute allowedRoles={['admin', 'owner']}>
                  <Menu />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="sales/new" 
              element={
                <ProtectedRoute allowedRoles={['admin', 'owner', 'cashier', 'staff']}>
                  <SalesNew />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="sales" 
              element={
                <ProtectedRoute allowedRoles={['admin', 'owner', 'cashier', 'staff']}>
                  <SalesHistory />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="expenses" 
              element={
                <ProtectedRoute allowedRoles={['admin', 'owner', 'cashier', 'staff']}>
                  <Expenses />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="stock" 
              element={
                <ProtectedRoute allowedRoles={['admin', 'owner']}>
                  <Stock />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="stock/movements" 
              element={
                <ProtectedRoute allowedRoles={['admin', 'owner', 'staff', 'cashier']}>
                  <StockMovements />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="reports" 
              element={
                <ProtectedRoute allowedRoles={['admin', 'owner']}>
                  <Reports />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="hr" 
              element={
                <ProtectedRoute allowedRoles={['admin', 'owner']}>
                  <HRManagement />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="settings" 
              element={
                <ProtectedRoute allowedRoles={['admin', 'owner', 'cashier', 'staff']}>
                  <Settings />
                </ProtectedRoute>
              } 
            />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
    </LanguageProvider>
  );
}
