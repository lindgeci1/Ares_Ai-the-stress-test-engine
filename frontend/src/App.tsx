import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/Layout';
import { AdminLayout } from './components/AdminLayout';
import { SessionExpiredModal } from './components/SessionExpiredModal';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PublicRoute } from './components/PublicRoute';
import { Landing } from './pages/Landing';
import { Auth } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { AuditLab } from './pages/AuditLab';
import { Checkout } from './pages/Checkout';
import { NewAudit } from './pages/NewAudit';
import { Billing } from './pages/Billing';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminUsers } from './pages/AdminUsers';
import { AdminDocuments } from './pages/AdminDocuments';
import { AdminPackages } from './pages/AdminPackages';
import { AdminPayments } from './pages/AdminPayments';
export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <SessionExpiredModal />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route
            path="/auth"
            element={
              <PublicRoute>
                <Auth />
              </PublicRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/audit/new"
            element={
              <ProtectedRoute>
                <Layout>
                  <NewAudit />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route path="/checkout/:plan" element={<Checkout />} />
          <Route
            path="/audit/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <AuditLab />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/billing"
            element={
              <ProtectedRoute>
                <Layout>
                  <Billing />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/packages"
            element={
              <ProtectedRoute requiredRole="Admin">
                <AdminLayout>
                  <AdminPackages />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/payments"
            element={
              <ProtectedRoute requiredRole="Admin">
                <AdminLayout>
                  <AdminPayments />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="Admin">
                <AdminLayout>
                  <AdminDashboard />
                </AdminLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/users"
            element={
              <ProtectedRoute requiredRole="Admin">
                <AdminLayout>
                  <AdminUsers />
                </AdminLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/documents"
            element={
              <ProtectedRoute requiredRole="Admin">
                <AdminLayout>
                  <AdminDocuments />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}