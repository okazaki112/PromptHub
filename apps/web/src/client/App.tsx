import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LoginPage } from './pages/Login';
import { SetupPage } from './pages/Setup';
import { DesktopWorkspacePage } from './pages/DesktopWorkspace';
import { AuthProvider, useAuth } from './contexts/AuthContext';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, isBootstrapLoading, isInitialized } = useAuth();
  const location = useLocation();
  const { t } = useTranslation();

  if (isLoading || isBootstrapLoading) {
    return <div className="loading-screen">{t('dashboard.loading')}</div>;
  }

  if (!isInitialized) {
    return <Navigate to="/setup" state={{ from: location }} replace />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

function SetupRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isBootstrapLoading, isInitialized } = useAuth();
  const { t } = useTranslation();

  if (isBootstrapLoading) {
    return <div className="loading-screen">{t('dashboard.loading')}</div>;
  }

  if (isInitialized) {
    return <Navigate to={isAuthenticated ? '/' : '/login'} replace />;
  }

  return <>{children}</>;
}

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/setup" element={<SetupRoute><SetupPage /></SetupRoute>} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<ProtectedRoute><DesktopWorkspacePage /></ProtectedRoute>} />
          <Route path="*" element={<ProtectedRoute><DesktopWorkspacePage /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
