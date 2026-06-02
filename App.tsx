/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { AuthProvider, useAuth } from '@/AuthContext';
import { LanguageProvider, useLanguage } from '@/LanguageContext';
import Layout from '@/Layout';
import Login from '@/Login';

// Import pages (we'll create these next)
import Dashboard from '@/Dashboard';
import Menu from '@/Menu';
import SalesNew from '@/SalesNew';
import SalesHistory from '@/SalesHistory';
import Expenses from '@/Expenses';
import Stock from '@/Stock';
import StockMovements from '@/StockMovements';
import Reports from '@/Reports';
import Settings from '@/Settings';
import HRManagement from '@/HRManagement';

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

const RootRoute = () => {
  const { session, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="w-8 h-8 border-4 border-amber-600/30 border-t-amber-600 rounded-full animate-spin" />
      </div>
    );
  }
  
  if (session) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <Navigate to="/login" replace />;
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
          
          <Route path="/" element={<RootRoute />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
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
