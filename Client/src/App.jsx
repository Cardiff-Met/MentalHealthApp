import {
  Routes,
  Route,
  Navigate,
  NavLink,
  useNavigate,
} from 'react-router-dom';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import MoodPage from '@/pages/MoodPage';
import ResourcesPage from '@/pages/ResourcesPage';
import BookingPage from '@/pages/BookingPage';
import { useAuth } from '@/context';

function Layout({ children }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const navLink = ({ isActive }) =>
    `text-sm font-medium transition-colors ${
      isActive ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-900'
    }`;

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🧠</span>
            <span className="font-bold text-slate-800 tracking-tight">
              MindSpace
            </span>
          </div>
          <div className="flex items-center gap-6">
            <NavLink to="/dashboard" className={navLink}>
              Home
            </NavLink>
            <NavLink to="/mood" className={navLink}>
              Mood
            </NavLink>
            <NavLink to="/resources" className={navLink}>
              Resources
            </NavLink>
            <NavLink to="/booking" className={navLink}>
              Book Session
            </NavLink>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm font-medium text-slate-500 hover:text-red-500 transition-colors"
          >
            Log out
          </button>
        </div>
      </nav>
      <main className="max-w-5xl mx-auto px-6 py-10">{children}</main>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('accessToken');
  if (!token) return <Navigate to="/login" />;
  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
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
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}
