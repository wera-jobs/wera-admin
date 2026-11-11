import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Gate } from './auth/Gate';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Shell } from './layout/Shell';
import { lazyPage } from './lib/lazyPage';
import { createQueryClient } from './lib/queryClient';
import { Toasts } from './lib/toast';
import OverviewPage from './pages/OverviewPage';
import UsersPage from './pages/UsersPage';

// Charts (recharts) load with the pages that draw them.
const RunsPage = lazyPage(() => import('./pages/RunsPage'));
const UsagePage = lazyPage(() => import('./pages/UsagePage'));
const TrafficPage = lazyPage(() => import('./pages/TrafficPage'));
const CompaniesPage = lazyPage(() => import('./pages/CompaniesPage'));
const ContentPage = lazyPage(() => import('./pages/ContentPage'));
const EmailPage = lazyPage(() => import('./pages/EmailPage'));
const AuditPage = lazyPage(() => import('./pages/AuditPage'));

/** The routes, for the app and for tests (which bring their own router). */
export function AdminRoutes() {
  return (
    <Gate>
      <Routes>
        <Route element={<Shell />}>
          <Route index element={<OverviewPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="runs" element={<RunsPage />} />
          <Route path="traffic" element={<TrafficPage />} />
          <Route path="usage" element={<UsagePage />} />
          <Route path="companies" element={<CompaniesPage />} />
          <Route path="content" element={<ContentPage />} />
          <Route path="email" element={<EmailPage />} />
          <Route path="audit" element={<AuditPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Gate>
  );
}

const queryClient = createQueryClient();

export function App() {
  return (
    <ErrorBoundary fullPage>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AdminRoutes />
        </BrowserRouter>
        <Toasts />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
