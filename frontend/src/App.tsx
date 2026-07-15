import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import ToastContainer from './components/ToastContainer';
import Sidebar from './components/Sidebar';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AssetsPage from './pages/AssetsPage';
import BookingsPage from './pages/BookingsPage';
import AISearchPage from './pages/AISearchPage';
import PeerLendingPage from './pages/PeerLendingPage';
import LostFoundPage from './pages/LostFoundPage';
import StudyGroupsPage from './pages/StudyGroupsPage';
import ConditionCheckPage from './pages/ConditionCheckPage';
import ManageAssetsPage from './pages/ManageAssetsPage';
import AnomalyDetectorPage from './pages/AnomalyDetectorPage';
import AnalyticsPage from './pages/AnalyticsPage';
import { useWebSockets } from './hooks/useWebSockets';
import type { Role } from './types';

const PAGE_TITLES: Record<string, string> = {
  dashboard: 'Dashboard',
  assets: 'Browse Assets',
  bookings: 'My Bookings',
  'peer-lending': 'Peer Lending',
  'lost-found': 'Lost & Found',
  'study-groups': 'Study Groups',
  'ai-search': 'AI Smart Search',
  condition: 'Condition Assessment',
  'manage-assets': 'Manage Assets',
  anomalies: 'Anomaly Detector',
  analytics: 'Analytics',
};

const PAGE_ROLES: Record<string, Role[]> = {
  dashboard: ['student', 'staff', 'lfofficer', 'admin'],
  assets: ['student', 'staff', 'admin'],
  bookings: ['student', 'staff', 'admin'],
  'peer-lending': ['student'],
  'lost-found': ['student', 'lfofficer', 'admin'],
  'study-groups': ['student'],
  'ai-search': ['student', 'staff', 'admin'],
  condition: ['staff', 'admin'],
  'manage-assets': ['staff', 'admin'],
  anomalies: ['admin'],
  analytics: ['admin'],
};

export default function App() {
  const { user, hydrate } = useAuthStore();
  const location = useLocation();

  // Activate WebSocket connection when logged in
  useWebSockets();
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const activePage = routeToPage(location.pathname);

  // Not logged in -> show login
  if (!user) {
    return (
      <>
        <ToastContainer />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </>
    );
  }

  const currentUser = user;
  const canAccess = (page: string) => PAGE_ROLES[page]?.includes(currentUser.role) ?? true;

  return (
    <>
      <ToastContainer />
      <div className="app-layout">
        <Sidebar />
        <main className="app-main">
          <header className="app-header">
            <h2 className="app-header__title">
              {PAGE_TITLES[activePage] || 'CampusLoop'}
            </h2>
            <div className="app-header__actions">
              <span className="text-sm text-secondary">
                {user.role.replace('_', ' ')} · {user.department?.name || user.faculty}
              </span>
            </div>
          </header>
          <div className="app-content">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/login" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={canAccess('dashboard') ? <DashboardPage /> : <Navigate to="/dashboard" replace />} />
              <Route path="/assets" element={canAccess('assets') ? <AssetsPage /> : <Navigate to="/dashboard" replace />} />
              <Route path="/bookings" element={canAccess('bookings') ? <BookingsPage /> : <Navigate to="/dashboard" replace />} />
              <Route path="/peer-lending" element={canAccess('peer-lending') ? <PeerLendingPage /> : <Navigate to="/dashboard" replace />} />
              <Route path="/lost-found" element={canAccess('lost-found') ? <LostFoundPage /> : <Navigate to="/dashboard" replace />} />
              <Route path="/study-groups" element={canAccess('study-groups') ? <StudyGroupsPage /> : <Navigate to="/dashboard" replace />} />
              <Route path="/ai-search" element={canAccess('ai-search') ? <AISearchPage /> : <Navigate to="/dashboard" replace />} />
              <Route path="/condition" element={canAccess('condition') ? <ConditionCheckPage /> : <Navigate to="/dashboard" replace />} />
              <Route path="/manage-assets" element={canAccess('manage-assets') ? <ManageAssetsPage /> : <Navigate to="/dashboard" replace />} />
              <Route path="/anomalies" element={canAccess('anomalies') ? <AnomalyDetectorPage /> : <Navigate to="/dashboard" replace />} />
              <Route path="/analytics" element={canAccess('analytics') ? <AnalyticsPage /> : <Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </>
  );
}

function routeToPage(pathname: string) {
  const normalized = pathname.replace(/^\//, '').split('/')[0];
  return normalized || 'dashboard';
}
