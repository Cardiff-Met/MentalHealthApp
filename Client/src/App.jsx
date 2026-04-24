import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppShell from '@/components/AppShell';
import LoadingSpinner from '@/components/LoadingSpinner';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import MoodPage from '@/pages/MoodPage';
import ResourcesPage from '@/pages/ResourcesPage';
import BookingPage from '@/pages/BookingPage';
import ProfilePage from '@/pages/ProfilePage';
import { useAuth } from '@/context';

// Lazy-load heavy pages to keep the initial bundle small
const MoodHistoryPage = lazy(() => import('@/pages/MoodHistoryPage'));
const TherapistPage = lazy(() => import('@/pages/TherapistPage'));
const AdminPage = lazy(() => import('@/pages/AdminPage'));

function ProtectedRoute({
  children,
  adminOnly = false,
  therapistOnly = false,
}) {
  const { accessToken, user } = useAuth();

  if (!accessToken) return <Navigate to="/login" replace />;
  if (adminOnly && user?.role !== 'admin')
    return <Navigate to="/dashboard" replace />;
  if (therapistOnly && user?.role !== 'therapist' && user?.role !== 'admin')
    return <Navigate to="/dashboard" replace />;

  return <AppShell>{children}</AppShell>;
}

export default function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mood"
          element={
            <ProtectedRoute>
              <MoodPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mood/history"
          element={
            <ProtectedRoute>
              <MoodHistoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/resources"
          element={
            <ProtectedRoute>
              <ResourcesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/booking"
          element={
            <ProtectedRoute>
              <BookingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/therapist"
          element={
            <ProtectedRoute therapistOnly>
              <TherapistPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute adminOnly>
              <AdminPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  );
}
