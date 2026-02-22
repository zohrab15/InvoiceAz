// Vercel Rebuild Trigger (Ver RBAC-Deploy): 2026-02-21 06:51
import React, { lazy, Suspense, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useAuthStore from './store/useAuthStore';
import client from './api/client';
import { BusinessProvider, useBusiness } from './context/BusinessContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';

import { ToastProvider, useToast } from './components/Toast';
import useLocationTracker from './hooks/useLocationTracker';

const PAGE_TITLES = {
  '/': 'InvoiceAZ - Peşəkar Faktura və Maliyyə İdarəetməsi',
  '/login': 'Giriş | InvoiceAZ',
  '/register': 'Qeydiyyat | InvoiceAZ',
  '/forgot-password': 'Şifrəni Unutmusunuz? | InvoiceAZ',
  '/dashboard': 'İdarə Paneli | InvoiceAZ',
  '/invoices': 'Fakturalar | InvoiceAZ',
  '/clients': 'Müştərilər | InvoiceAZ',
  '/expenses': 'Xərclər | InvoiceAZ',
  '/products': 'Məhsullar | InvoiceAZ',
  '/analytics/payments': 'Ödəniş Analitikası | InvoiceAZ',
  '/analytics/forecast': 'Proqnoz Analitikası | InvoiceAZ',
  '/analytics/tax': 'Vergi Hesabatları | InvoiceAZ',
  '/analytics/issues': 'Problem Fakturalar | InvoiceAZ',
  '/analytics/products': 'Məhsul Analitikası | InvoiceAZ',
  '/problematic-invoices': 'Problem Fakturalar | InvoiceAZ',
  '/settings': 'Tənzimləmələr | InvoiceAZ',
  '/security': 'Təhlükəsizlik | InvoiceAZ',
  '/system-settings': 'Sistem Tənzimləmələri | InvoiceAZ',
  '/notifications': 'Bildirişlər | InvoiceAZ',
  '/pricing': 'Qiymət Planları | InvoiceAZ',
  '/help': 'Yardım | InvoiceAZ',
  '/terms': 'İstifadə Qaydaları | InvoiceAZ',
  '/privacy': 'Məxfilik Siyasəti | InvoiceAZ',
  '/verify-email-sent': 'E-poçtu Yoxlayın | InvoiceAZ',
  '/akademiya': 'Akademiya | InvoiceAZ',
};

const PageTitleUpdater = () => {
  const location = useLocation();
  useEffect(() => {
    const title = PAGE_TITLES[location.pathname] || 'InvoiceAZ - Peşəkar Faktura və Maliyyə İdarəetməsi';
    document.title = title;
  }, [location.pathname]);
  return null;
};

// Role Gate for granular access control
const RoleGate = ({ roles, children }) => {
  const { activeBusiness, isLoading, businesses } = useBusiness();
  const user = useAuthStore(state => state.user);
  const showToast = useToast();
  const location = useLocation();

  // Wait for business query to complete
  if (isLoading || !user) return null;

  // Wait for auto-selection to complete (useEffect runs after render)
  if (!activeBusiness && businesses?.length > 0) return null;

  // No businesses at all — go to dashboard
  if (!activeBusiness) {
    if (location.pathname !== '/dashboard') {
      showToast('Xidmətlərdən istifadə etmək üçün əvvəlcə Biznes Profili yaratmalısınız.', 'warning');
    }
    return <Navigate to="/dashboard" replace />;
  }

  // Determine role: explicitly check if current user is the business owner
  let role = (activeBusiness.user_role || '').toUpperCase();

  if (!role && activeBusiness.user === user.id) {
    role = 'OWNER';
  }

  // If still no role, default to OWNER safely — the backend controls actual data access
  // Defaulting to SALES_REP was the cause of normal users seeing restricted UI
  if (!role) role = 'OWNER';

  if (roles.includes(role)) return children;

  return <Navigate to="/dashboard" replace />;
};

// Lazy loading components for better performance
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Clients = lazy(() => import('./pages/Clients'));
const Invoices = lazy(() => import('./pages/Invoices'));
const Expenses = lazy(() => import('./pages/Expenses'));
const BusinessSettings = lazy(() => import('./pages/BusinessSettings'));
const SecurityPage = lazy(() => import('./pages/SecurityPage'));
const SystemSettings = lazy(() => import('./pages/SystemSettings'));
const PricingPage = lazy(() => import('./pages/PricingPage'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const AuthCallback = lazy(() => import('./pages/AuthCallback'));
const EmailVerificationSent = lazy(() => import('./pages/EmailVerificationSent'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const PublicInvoice = lazy(() => import('./pages/PublicInvoice'));
const PublicPayment = lazy(() => import('./pages/PublicPayment'));
const ProblematicInvoices = lazy(() => import('./pages/ProblematicInvoices'));
const ForecastAnalytics = lazy(() => import('./pages/ForecastAnalytics'));
const PaymentAnalytics = lazy(() => import('./pages/PaymentAnalytics'));
const TaxReports = lazy(() => import('./pages/TaxReports'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const Products = lazy(() => import('./pages/Products'));
const ProductAnalytics = lazy(() => import('./pages/ProductAnalytics'));
const DemoLogin = lazy(() => import('./pages/DemoLogin'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Notifications = lazy(() => import('./pages/Notifications'));
const HelpSupport = lazy(() => import('./pages/HelpSupport'));
const LegalPage = lazy(() => import('./pages/LegalPage'));
const Akademiya = lazy(() => import('./pages/Akademiya'));
const AkademiyaPost = lazy(() => import('./pages/AkademiyaPost'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Cache data for 5 minutes
      refetchOnWindowFocus: false, // Prevent redundant refetches
    },
  },
});

const ProtectedRoute = ({ children }) => {
  const token = useAuthStore((state) => state.token);
  if (!token) return <Navigate to="/" replace />;
  return children;
};

const LoadingScreen = () => (
  <div className="h-screen w-screen flex items-center justify-center bg-[#0a0a0f] px-8 fixed inset-0 z-[9999]">
    <div className="flex flex-col items-center gap-6">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-blue-500/20 rounded-full"></div>
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute inset-0 shadow-[0_0_15px_rgba(37,99,235,0.3)]"></div>
      </div>
      <div className="flex flex-col items-center gap-2">
        <p className="text-xs font-black text-blue-500 animate-pulse tracking-[0.3em] uppercase">Yüklənir</p>
        <div className="flex gap-1">
          <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0 }} className="w-1 h-1 bg-blue-500 rounded-full" />
          <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }} className="w-1 h-1 bg-blue-500 rounded-full" />
          <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }} className="w-1 h-1 bg-blue-500 rounded-full" />
        </div>
      </div>
    </div>
  </div>
);

const AuthenticatedRoutes = () => {
  useLocationTracker();

  return (
    <Layout>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/invoices" element={
          <RoleGate roles={['OWNER', 'MANAGER', 'ACCOUNTANT', 'SALES_REP']}>
            <Invoices />
          </RoleGate>
        } />
        <Route path="/products" element={
          <RoleGate roles={['OWNER', 'MANAGER', 'ACCOUNTANT', 'INVENTORY_MANAGER']}>
            <Products />
          </RoleGate>
        } />
        <Route path="/problematic-invoices" element={
          <RoleGate roles={['OWNER', 'MANAGER', 'ACCOUNTANT']}>
            <ProblematicInvoices />
          </RoleGate>
        } />
        <Route path="/analytics/payments" element={
          <RoleGate roles={['OWNER', 'MANAGER', 'ACCOUNTANT']}>
            <PaymentAnalytics />
          </RoleGate>
        } />
        <Route path="/analytics/issues" element={
          <RoleGate roles={['OWNER', 'MANAGER', 'ACCOUNTANT']}>
            <ProblematicInvoices />
          </RoleGate>
        } />
        <Route path="/analytics/forecast" element={
          <RoleGate roles={['OWNER', 'MANAGER']}>
            <ForecastAnalytics />
          </RoleGate>
        } />
        <Route path="/analytics/products" element={
          <RoleGate roles={['OWNER', 'MANAGER', 'ACCOUNTANT', 'INVENTORY_MANAGER']}>
            <ProductAnalytics />
          </RoleGate>
        } />
        <Route path="/analytics/tax" element={
          <RoleGate roles={['OWNER', 'MANAGER', 'ACCOUNTANT']}>
            <TaxReports />
          </RoleGate>
        } />
        <Route path="/expenses" element={
          <RoleGate roles={['OWNER', 'MANAGER', 'ACCOUNTANT']}>
            <Expenses />
          </RoleGate>
        } />
        <Route path="/clients" element={
          <RoleGate roles={['OWNER', 'MANAGER', 'ACCOUNTANT', 'SALES_REP']}>
            <Clients />
          </RoleGate>
        } />
        <Route path="/settings" element={<BusinessSettings />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/security" element={<SecurityPage />} />
        <Route path="/system-settings" element={
          <RoleGate roles={['OWNER', 'MANAGER', 'ACCOUNTANT', 'INVENTORY_MANAGER', 'SALES_REP']}>
            <SystemSettings />
          </RoleGate>
        } />
        <Route path="/notifications" element={<Notifications />} />
      </Routes>
    </Layout>
  );
};

function App() {
  const { token, user, setAuth } = useAuthStore();

  React.useEffect(() => {
    const fetchProfile = async (retries = 2) => {
      if (token && !user) {
        try {
          // Pre-warm ping if it's the first attempt and we suspect service might be down
          if (retries === 2) {
            client.get('/').catch(() => { }); // Fire and forget health check
          }

          const res = await client.get('/auth/user/');
          setAuth(res.data, token);
        } catch (err) {
          console.error('Profile fetch failed:', err);

          // Retry on timeout or network error
          if (retries > 0 && (err.code === 'ECONNABORTED' || !err.response)) {
            console.log(`Retrying profile fetch... (${retries} attempts left)`);
            setTimeout(() => fetchProfile(retries - 1), 2000);
            return;
          }

          // If token is invalid, clear it
          if (err.response?.status === 401) {
            useAuthStore.getState().logout();
          }
        }
      }
    };
    fetchProfile();
  }, [token, user, setAuth]);

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <BusinessProvider>
          <ThemeProvider>
            <ToastProvider>
              <Router>
                <PageTitleUpdater />
                <Suspense fallback={<LoadingScreen />}>
                  <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/auth/callback" element={<AuthCallback />} />
                    <Route path="/verify-email-sent" element={<EmailVerificationSent />} />
                    <Route path="/verify-email/:key" element={<VerifyEmail />} />
                    <Route path="/password-reset-confirm/:uid/:token" element={<ResetPassword />} />
                    <Route path="/view/:token" element={<PublicInvoice />} />
                    <Route path="/public/pay/:token" element={<PublicPayment />} />
                    <Route path="/demo-login" element={<DemoLogin />} />
                    <Route path="/terms" element={<LegalPage />} />
                    <Route path="/privacy" element={<LegalPage />} />
                    <Route path="/help" element={<HelpSupport />} />
                    <Route path="/akademiya" element={<Akademiya />} />
                    <Route path="/akademiya/:slug" element={<AkademiyaPost />} />
                    <Route path="/" element={token ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
                    <Route
                      path="/*"
                      element={
                        <ProtectedRoute>
                          <AuthenticatedRoutes />
                        </ProtectedRoute>
                      }
                    />
                  </Routes>
                </Suspense>
              </Router>
            </ToastProvider>
          </ThemeProvider>
        </BusinessProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;
