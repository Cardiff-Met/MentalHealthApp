import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context';

const navLinkClass = ({ isActive }) =>
  [
    'text-sm font-medium transition-colors px-1 py-0.5 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
    isActive ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-900',
  ].join(' ');

export default function AppShell({ children }) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const isAdmin = user?.role === 'admin';
  const isTherapist = user?.role === 'therapist';

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top navigation */}
      <header>
        <nav
          className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10"
          aria-label="Main navigation"
        >
          <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
            {/* Logo */}
            <NavLink
              to="/dashboard"
              className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
              aria-label="MindSpace home"
            >
              <span className="text-xl" aria-hidden="true">
                🧠
              </span>
              <span className="font-bold text-slate-800 tracking-tight">
                MindSpace
              </span>
            </NavLink>

            {/* Nav links */}
            <div className="flex items-center gap-5">
              <NavLink to="/dashboard" className={navLinkClass}>
                Home
              </NavLink>
              <NavLink to="/mood" className={navLinkClass}>
                Mood
              </NavLink>
              <NavLink to="/resources" className={navLinkClass}>
                Resources
              </NavLink>
              <NavLink to="/booking" className={navLinkClass}>
                Book Session
              </NavLink>
              <NavLink to="/profile" className={navLinkClass}>
                Profile
              </NavLink>
              {isTherapist && (
                <NavLink
                  to="/therapist"
                  className={({ isActive }) =>
                    [
                      navLinkClass({ isActive }),
                      'text-teal-600 hover:text-teal-800',
                    ].join(' ')
                  }
                >
                  My Availability
                </NavLink>
              )}
              {isAdmin && (
                <NavLink
                  to="/admin"
                  className={({ isActive }) =>
                    [
                      navLinkClass({ isActive }),
                      'text-violet-600 hover:text-violet-800',
                    ].join(' ')
                  }
                >
                  Admin
                </NavLink>
              )}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              {isTherapist && (
                <span className="text-xs font-semibold px-2 py-0.5 bg-teal-100 text-teal-700 rounded-full">
                  Therapist
                </span>
              )}
              {isAdmin && (
                <span className="text-xs font-semibold px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full">
                  Admin
                </span>
              )}
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-slate-500 hover:text-red-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 rounded px-1"
              >
                Log out
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Page content */}
      <main className="max-w-5xl mx-auto px-6 py-10" id="main-content">
        {children}
      </main>
    </div>
  );
}
