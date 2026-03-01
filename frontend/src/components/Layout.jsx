import { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import { UserIcon, SignOutIcon, ChevronUpDownIcon, DashboardIcon } from './Icons';
import t from '../theme';

const navItems = {
  member: [
    { to: '/member/health-history', label: 'Health History' },
  ],
  trainer: [
    { to: '/trainer/schedule', label: 'Schedule' },
    { to: '/trainer/availability', label: 'Availability' },
  ],
  admin: [
    { to: '/admin/room-booking', label: 'Room Booking' },
    { to: '/admin/equipment', label: 'Equipment' },
  ],
};

const profilePath = {
  member: '/member/profile',
  trainer: '/trainer/profile',
  admin: '/admin/profile',
};

const dashboardPath = {
  member: '/member/dashboard',
  trainer: '/trainer/dashboard',
  admin: '/admin/dashboard',
};

export default function Layout() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const items = navItems[role] || [];
  const dashboardTo = dashboardPath[role] || '/member/dashboard';
  const profileTo = profilePath[role] || '/member/profile';
  const isOnDashboard = location.pathname === dashboardTo;
  const isOnProfile = location.pathname === profileTo;

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

  function handleDashboard() {
    setMenuOpen(false);
    navigate(dashboardTo);
  }

  function handleBrandClick() {
    navigate(dashboardTo);
  }

  const initials = (user?.name || '')
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={`min-h-screen transition-colors duration-200 ${t.pageBg}`}>
      <nav className={`sticky top-0 z-30 ${t.navBar}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <button
              type="button"
              onClick={handleBrandClick}
              className={`flex cursor-pointer items-center gap-2 rounded-lg py-2 pr-1 text-left text-lg font-bold tracking-tight ${t.navBrand} hover:opacity-90 focus:outline-none transition-opacity`}
              aria-label="Go to dashboard"
            >
              <img src="/logo.png" alt="" className="h-8 w-auto pointer-events-none dark:[filter:drop-shadow(0_0_1px_white)_drop-shadow(0_0_2px_white)]" />
              <span className="pointer-events-none">Fitness Club</span>
            </button>
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
                className={`inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium transition ${t.focusRing} ${t.navDropdownItem}`}
              >
                <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${t.avatarCircle}`}>
                  {initials}
                </span>
                <span className="hidden sm:block max-w-[120px] truncate">{user?.name}</span>
                <span className={`ml-0.5 hidden sm:inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${t.roleBadge}`}>{role}</span>
                <ChevronUpDownIcon open={menuOpen} className="h-3.5 w-3.5" />
              </button>

              {menuOpen && (
                <div className={`absolute right-0 z-50 mt-1.5 w-56 rounded-xl border py-1 shadow-lg ring-1 ring-black/5 dark:ring-white/5 ${t.cardBorder} ${t.cardBg}`}>
                  <div className={`border-b px-4 py-3 ${t.dropdownDivider}`}>
                    <p className={`text-sm font-medium truncate ${t.pageText}`}>{user?.name}</p>
                    <p className={`text-xs truncate ${t.pageTextMuted}`}>{user?.email}</p>
                  </div>

                  <button
                    type="button"
                    onClick={handleDashboard}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition ${isOnDashboard ? t.navActive : t.navDropdownItem}`}
                  >
                    <DashboardIcon />
                    Dashboard
                  </button>

                  <button
                    type="button"
                    onClick={handleProfile}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition ${isOnProfile ? t.navActive : t.navDropdownItem}`}
                  >
                    <UserIcon />
                    Profile
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition ${t.dangerText} ${t.dangerHover}`}
                  >
                    <SignOutIcon />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={`flex gap-1 overflow-x-auto border-t px-4 py-2 sm:hidden ${t.mobileNavBorder}`}>
          {items.map(({ to, label }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition ${isActive ? t.navActive : t.pageTextSubtle}`
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
