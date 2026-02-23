import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import t from '../theme';

const navItems = {
  member: [
    { to: '/member/dashboard', label: 'Dashboard' },
    { to: '/member/profile', label: 'Profile' },
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

export default function Layout() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const items = navItems[role] || [];

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

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
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-gray-500 dark:text-gray-400 sm:block">
              {user?.name}
              <span className={`ml-1.5 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${t.roleBadge}`}>{role}</span>
            </span>
            <ThemeToggle />
            <button onClick={handleLogout}
              className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200 transition">
              Sign Out
            </button>
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
