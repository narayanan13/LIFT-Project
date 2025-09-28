import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import Layout from './components/Layout/Layout';
import LoginForm from './components/Auth/LoginForm';
import LandingPage from './pages/LandingPage';
import InvitationSignup from './pages/InvitationSignup';
import AuthCallback from './pages/AuthCallback';
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import MyContributions from './pages/MyContributions';
import AdminContributions from './pages/AdminContributions';
import AdminExpenses from './pages/AdminExpenses';
import AdminUsers from './pages/AdminUsers';
import AdminReports from './pages/AdminReports';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAdmin } = useAuth();
  return isAdmin ? <>{children}</> : <Navigate to="/" replace />;
};

const AppContent: React.FC = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={!user ? <LoginForm /> : <Navigate to="/dashboard" replace />} />
      <Route path="/invite/:token" element={<InvitationSignup />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route
        path="/dashboard/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/expenses" element={<Expenses />} />
                <Route path="/my-contributions" element={<MyContributions />} />
                <Route
                  path="/admin/contributions"
                  element={
                    <AdminRoute>
                      <AdminContributions />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/expenses"
                  element={
                    <AdminRoute>
                      <AdminExpenses />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/users"
                  element={
                    <AdminRoute>
                      <AdminUsers />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/reports"
                  element={
                    <AdminRoute>
                      <AdminReports />
                    </AdminRoute>
                  }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <Router>
          <AppContent />
        </Router>
      </DataProvider>
    </AuthProvider>
  );
}

export default App;