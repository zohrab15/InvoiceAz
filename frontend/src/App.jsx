// Vercel Rebuild Trigger (Ver 2c4f534): 2026-02-19 15:56
import React, { lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useAuthStore from './store/useAuthStore';
import client from './api/client';
import { BusinessProvider } from './context/BusinessContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';

import { ToastProvider } from './components/Toast';

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

function App() {
  const { token, user, setAuth } = useAuthStore();

  React.useEffect(() => {
    const fetchProfile = async () => {
      if (token && !user) {
        try {
          const res = await client.get('/auth/user/');
          setAuth(res.data, token);
        } catch (err) {
          console.error('Profile fetch failed:', err);
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
      <BusinessProvider>
        <ThemeProvider>
          <ToastProvider>
            <Router>
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
                  <Route path="/" element={token ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
                  <Route
                    path="/*"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <Routes>
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/invoices" element={<Invoices />} />
                            <Route path="/products" element={<Products />} />
                            <Route path="/problematic-invoices" element={<ProblematicInvoices />} />
                            <Route path="/analytics/payments" element={<PaymentAnalytics />} />
                            <Route path="/analytics/issues" element={<ProblematicInvoices />} />
                            <Route path="/analytics/forecast" element={<ForecastAnalytics />} />
                            <Route path="/analytics/products" element={<ProductAnalytics />} />
                            <Route path="/analytics/tax" element={<TaxReports />} />
                            <Route path="/expenses" element={<Expenses />} />
                            <Route path="/clients" element={<Clients />} />
                            <Route path="/settings" element={<BusinessSettings />} />
                            <Route path="/pricing" element={<PricingPage />} />
                            <Route path="/security" element={<SecurityPage />} />
                            <Route path="/system-settings" element={<SystemSettings />} />
                            <Route path="/notifications" element={<Notifications />} />
                            <Route path="/help" element={<HelpSupport />} />
                          </Routes>
                        </Layout>
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </Suspense>
            </Router>
          </ToastProvider>
        </ThemeProvider>
      </BusinessProvider>
    </QueryClientProvider>
  );
}

export default App;
