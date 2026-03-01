import { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNavMode } from '../context/NavModeContext';
import ThemeToggle from './ThemeToggle';
import {
  UserIcon, SignOutIcon, ChevronUpDownIcon, DashboardIcon,
  CalendarIcon, HeartIcon,
  ClockIcon, BuildingIcon, WrenchIcon, TagIcon,
} from './Icons';
import t from '../theme';

const sidebarItems = {
  member: [
    { to: '/member/dashboard', label: 'Dashboard', Icon: DashboardIcon },
    { to: '/member/schedule', label: 'Schedule', Icon: CalendarIcon },
    { to: '/member/goals', label: 'Health & Goals', Icon: HeartIcon },
    { to: '/member/profile', label: 'Profile', Icon: UserIcon },
  ],
  trainer: [
    { to: '/trainer/dashboard', label: 'Dashboard', Icon: DashboardIcon },
    { to: '/trainer/schedule', label: 'Schedule', Icon: CalendarIcon },
    { to: '/trainer/availability', label: 'Availability', Icon: ClockIcon },
    { to: '/trainer/profile', label: 'Profile', Icon: UserIcon },
  ],
  admin: [
    { to: '/admin/dashboard', label: 'Dashboard', Icon: DashboardIcon },
    { to: '/admin/room-booking', label: 'Room Booking', Icon: BuildingIcon },
    { to: '/admin/equipment', label: 'Equipment', Icon: WrenchIcon },
    { to: '/admin/payments', label: 'Payments', Icon: TagIcon },
    { to: '/admin/profile', label: 'Profile', Icon: UserIcon },
  ],
};

const dashboardPath = {
  member: '/member/dashboard',
  trainer: '/trainer/dashboard',
  admin: '/admin/dashboard',
};

export default function Layout() {
  const { user, role, logout } = useAuth();
  const { navMode } = useNavMode();
  const navigate = useNavigate();
  const location = useLocation();
  const dashboardTo = dashboardPath[role] || '/member/dashboard';
  const items = sidebarItems[role] || [];
  const isSidebar = navMode === 'sidebar';

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setSidebarOpen(false); };
    if (sidebarOpen) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [sidebarOpen]);

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    if (menuOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  async function handleLogout() {
    setMenuOpen(false);
    setSidebarOpen(false);
    await logout();
    navigate('/login');
  }

  const initials = (user?.name || '')
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={`min-h-screen transition-colors duration-200 ${t.pageBg}`}>
      {/* Top bar */}
      <nav className={`sticky top-0 z-30 ${t.navBar}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            {isSidebar && (
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className={`rounded-lg p-2 transition ${t.navInactive} ${t.focusRing}`}
                aria-label="Open menu"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
                </svg>
              </button>
            )}

            <button
              type="button"
              onClick={() => navigate(dashboardTo)}
              className={`flex cursor-pointer items-center gap-2 rounded-lg py-2 pr-1 text-left text-lg font-bold tracking-tight ${t.navBrand} hover:opacity-90 focus:outline-none transition-opacity`}
              aria-label="Go to dashboard"
            >
              <img src="/logo.png" alt="" className="h-8 w-auto pointer-events-none dark:[filter:drop-shadow(0_0_1px_white)_drop-shadow(0_0_2px_white)]" />
              <span className="pointer-events-none hidden sm:inline">Fitness Club</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />

            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen(prev => !prev)}
                className={`inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium transition ${t.focusRing} ${t.navDropdownItem}`}
              >
                <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${t.avatarCircle}`}>
                  {initials}
                </span>
                <span className="hidden sm:block max-w-[120px] truncate">{user?.name}</span>
                <ChevronUpDownIcon open={menuOpen} className="h-3.5 w-3.5" />
              </button>

              <div
                className={`absolute right-0 z-50 mt-1.5 ${isSidebar ? 'w-56' : 'w-64'} origin-top rounded-xl border shadow-lg ring-1 ring-black/5 dark:ring-white/5 ${t.cardBorder} ${t.cardBg} overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out ${
                  menuOpen
                    ? 'max-h-[600px] opacity-100 visible'
                    : 'max-h-0 opacity-0 invisible pointer-events-none'
                }`}
              >
                <div className={`border-b px-4 py-3 ${t.dropdownDivider}`}>
                  <p className={`text-sm font-medium truncate ${t.pageText}`}>{user?.name}</p>
                  <p className={`text-xs truncate ${t.pageTextMuted}`}>{user?.email}</p>
                </div>

                {!isSidebar && (
                  <nav className={`border-b py-1 ${t.dropdownDivider}`}>
                    {items.map(({ to, label, Icon }) => (
                      <NavLink
                        key={to}
                        to={to}
                        onClick={() => setMenuOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-4 py-2 text-sm font-medium transition ${isActive ? t.navActive : `${t.pageText} ${t.navDropdownItem}`}`
                        }
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {label}
                      </NavLink>
                    ))}
                  </nav>
                )}

                <button
                  type="button"
                  onClick={handleLogout}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition ${t.dangerText} ${t.dangerHover}`}
                >
                  <SignOutIcon />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar overlay -- only in sidebar mode, animated via CSS */}
      {isSidebar && <div
        className={`fixed inset-0 z-40 flex transition-[visibility] duration-300 ${sidebarOpen ? 'visible' : 'invisible'}`}
        role="dialog"
        aria-modal="true"
      >
        {/* Backdrop */}
        <div
          className={`fixed inset-0 bg-black/40 dark:bg-black/60 transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />

        {/* Panel */}
        <div className={`relative z-50 flex w-72 flex-col ${t.cardBg} shadow-xl transition-transform duration-300 ease-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          {/* Sidebar header */}
          <div className={`flex items-center justify-between border-b px-5 py-4 ${t.dropdownDivider}`}>
            <div className="min-w-0">
              <p className={`text-sm font-semibold truncate ${t.pageText}`}>{user?.name}</p>
              <p className={`text-xs truncate ${t.pageTextMuted}`}>{user?.email}</p>
            </div>
            <span className={`ml-2 shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${t.roleBadge}`}>
              {role}
            </span>
          </div>

          {/* Nav links */}
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
            {items.map(({ to, label, Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${isActive ? t.navActive : t.navInactive}`
                }
              >
                <Icon className="h-5 w-5 shrink-0" />
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Sign out */}
          <div className={`border-t px-3 py-3 ${t.dropdownDivider}`}>
            <button
              type="button"
              onClick={handleLogout}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${t.dangerText} ${t.dangerHover}`}
            >
              <SignOutIcon className="h-5 w-5 shrink-0" />
              Sign Out
            </button>
          </div>
        </div>
      </div>}

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
