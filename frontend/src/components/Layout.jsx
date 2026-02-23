import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = {
  member: [
    { to: '/member/dashboard', label: 'Dashboard' },
    { to: '/member/profile', label: 'Profile' },
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

export default function Layout() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const items = navItems[role] || [];

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="sticky top-0 z-30 border-b border-gray-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <span className="text-lg font-bold tracking-tight text-indigo-600">Fitness Club</span>
            <div className="hidden items-center gap-1 sm:flex">
              {items.map(({ to, label }) => (
                <NavLink
                  key={to} to={to}
                  className={({ isActive }) =>
                    `rounded-lg px-3 py-2 text-sm font-medium transition ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`
                  }
                >
                  {label}
                </NavLink>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-gray-500 sm:block">
              {user?.name}
              <span className="ml-1.5 inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 capitalize">{role}</span>
            </span>
            <button
              onClick={handleLogout}
              className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition"
            >
              Sign Out
            </button>
          </div>
        </div>
        {/* Mobile nav */}
        <div className="flex gap-1 overflow-x-auto border-t border-gray-100 px-4 py-2 sm:hidden">
          {items.map(({ to, label }) => (
            <NavLink
              key={to} to={to}
              className={({ isActive }) =>
                `shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500'
                }`
              }
            >
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
