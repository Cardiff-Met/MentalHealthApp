import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context';

const navLinkClass = ({ isActive }) =>
  [
    'text-sm font-medium transition-colors px-1 py-0.5 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
    isActive ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-900',
  ].join(' ');

const mobileNavLinkClass = ({ isActive }) =>
  [
    'block px-4 py-3 text-sm font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
    isActive
      ? 'bg-indigo-50 text-indigo-600'
      : 'text-slate-600 hover:bg-slate-50',
  ].join(' ');

export default function AppShell({ children }) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const isAdmin = user?.role === 'admin';
  const isTherapist = user?.role === 'therapist';

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Skip to main content */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-indigo-600 focus:text-white focus:rounded-lg focus:text-sm focus:font-medium"
      >
        Skip to main content
      </a>

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

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-5">
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
              {(isTherapist || isAdmin) && (
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

            {/* Desktop right side */}
            <div className="hidden md:flex items-center gap-3">
              {(isTherapist || isAdmin) && (
                <span
                  className="text-xs font-semibold px-2 py-0.5 bg-teal-100 text-teal-700 rounded-full"
                  aria-label="Therapist role"
                >
                  Therapist
                </span>
              )}
              {isAdmin && (
                <span
                  className="text-xs font-semibold px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full"
                  aria-label="Admin role"
                >
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

            {/* Hamburger — mobile only */}
            <button
              className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition-colors"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              onClick={() => setMenuOpen((o) => !o)}
            >
              {menuOpen ? (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>

          {/* Mobile menu */}
          {menuOpen && (
            <div
              id="mobile-menu"
              className="md:hidden border-t border-slate-100 bg-white px-4 py-3 space-y-1"
            >
              <NavLink
                to="/dashboard"
                className={mobileNavLinkClass}
                onClick={() => setMenuOpen(false)}
              >
                Home
              </NavLink>
              <NavLink
                to="/mood"
                className={mobileNavLinkClass}
                onClick={() => setMenuOpen(false)}
              >
                Mood
              </NavLink>
              <NavLink
                to="/resources"
                className={mobileNavLinkClass}
                onClick={() => setMenuOpen(false)}
              >
                Resources
              </NavLink>
              <NavLink
                to="/booking"
                className={mobileNavLinkClass}
                onClick={() => setMenuOpen(false)}
              >
                Book Session
              </NavLink>
              <NavLink
                to="/profile"
                className={mobileNavLinkClass}
                onClick={() => setMenuOpen(false)}
              >
                Profile
              </NavLink>
              {(isTherapist || isAdmin) && (
                <NavLink
                  to="/therapist"
                  className={mobileNavLinkClass}
                  onClick={() => setMenuOpen(false)}
                >
                  My Availability
                </NavLink>
              )}
              {isAdmin && (
                <NavLink
                  to="/admin"
                  className={mobileNavLinkClass}
                  onClick={() => setMenuOpen(false)}
                >
                  Admin
                </NavLink>
              )}
              <div className="border-t border-slate-100 mt-2 pt-2">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    handleLogout();
                  }}
                  className="block w-full text-left px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Log out
                </button>
              </div>
            </div>
          )}
        </nav>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10" id="main-content">
        {children}
      </main>
    </div>
  );
}
