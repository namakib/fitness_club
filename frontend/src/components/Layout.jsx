import { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import t from '../theme';

const navItems = {
  member: [
    { to: '/member/dashboard', label: 'Dashboard' },
    { to: '/member/health-history', label: 'Health History' },
  ],
  trainer: [
    { to: '/trainer/dashboard', label: 'Dashboard' },
    { to: '/trainer/schedule', label: 'Schedule' },
    { to: '/trainer/availability', label: 'Availability' },
  ],
  admin: [
    { to: '/admin/dashboard', label: 'Dashboard' },
    { to: '/admin/room-booking', label: 'Room Booking' },
    { to: '/admin/equipment', label: 'Equipment' },
  ],
};

const profilePath = {
  member: '/member/profile',
  trainer: '/trainer/profile',
  admin: '/admin/profile',
};

const UserIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
  </svg>
);

const SignOutIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
  </svg>
);

const ChevronIcon = ({ open }) => (
  <svg className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
  </svg>
);

export default function Layout() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const items = navItems[role] || [];

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    if (menuOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  async function handleLogout() {
    setMenuOpen(false);
    await logout();
    navigate('/login');
  }

  function handleProfile() {
    setMenuOpen(false);
    navigate(profilePath[role] || '/member/profile');
  }

  const initials = (user?.name || '')
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <nav className="sticky top-0 z-30 border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <span className={`flex items-center gap-2 text-lg font-bold tracking-tight ${t.navBrand}`}>
              <img src="/logo.png" alt="" className="h-8 w-auto" />
              Fitness Club
            </span>
            <div className="hidden items-center gap-1 sm:flex">
              {items.map(({ to, label }) => (
                <NavLink key={to} to={to}
                  className={({ isActive }) =>
                    `rounded-lg px-3 py-2 text-sm font-medium transition ${isActive ? t.navActive : t.navInactive}`
                  }>
                  {label}
                </NavLink>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />

            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen(prev => !prev)}
                className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/40 text-xs font-bold text-orange-700 dark:text-orange-400">
                  {initials}
                </span>
                <span className="hidden sm:block max-w-[120px] truncate">{user?.name}</span>
                <span className={`ml-0.5 hidden sm:inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${t.roleBadge}`}>{role}</span>
                <ChevronIcon open={menuOpen} />
              </button>

              {menuOpen && (
                <div className="absolute right-0 z-50 mt-1.5 w-56 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 py-1 shadow-lg ring-1 ring-black/5 dark:ring-white/5">
                  <div className="border-b border-gray-100 dark:border-gray-700 px-4 py-3">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{user?.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                  </div>

                  <button
                    type="button"
                    onClick={handleProfile}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    <UserIcon />
                    Profile
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                  >
                    <SignOutIcon />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-1 overflow-x-auto border-t border-gray-100 dark:border-gray-700/50 px-4 py-2 sm:hidden">
          {items.map(({ to, label }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition ${isActive ? t.navActive : 'text-gray-500 dark:text-gray-400'}`
              }>
              {label}
            </NavLink>
          ))}
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
