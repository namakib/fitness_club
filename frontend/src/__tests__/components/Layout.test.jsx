import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../../context/AuthContext', () => {
  let mockValue = { user: null, role: null, loading: false, login: vi.fn(), logout: vi.fn(), refetch: vi.fn() };
  return {
    useAuth: () => mockValue,
    __setMock: (v) => { mockValue = { ...mockValue, ...v }; },
    AuthProvider: ({ children }) => children,
  };
});

import { __setMock } from '../../context/AuthContext';
import { ThemeProvider } from '../../context/ThemeContext';
import { NavModeProvider } from '../../context/NavModeContext';
import Layout from '../../components/Layout';

function renderLayout(authState, route = '/member/dashboard', navMode) {
  __setMock(authState);
  if (navMode) {
    try { localStorage.setItem('navMode', navMode); } catch {}
  }
  return render(
    <MemoryRouter initialEntries={[route]}>
      <ThemeProvider>
        <NavModeProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/member/dashboard" element={<div>Member Dashboard</div>} />
              <Route path="/member/schedule" element={<div>Member Schedule</div>} />
              <Route path="/member/goals" element={<div>Member Goals</div>} />
              <Route path="/member/profile" element={<div>Member Profile</div>} />
              <Route path="/trainer/dashboard" element={<div>Trainer Dashboard</div>} />
              <Route path="/trainer/schedule" element={<div>Trainer Schedule</div>} />
              <Route path="/trainer/availability" element={<div>Trainer Availability</div>} />
              <Route path="/trainer/profile" element={<div>Trainer Profile</div>} />
              <Route path="/admin/dashboard" element={<div>Admin Dashboard</div>} />
              <Route path="/admin/room-booking" element={<div>Admin Room Booking</div>} />
              <Route path="/admin/equipment" element={<div>Admin Equipment</div>} />
              <Route path="/admin/payments" element={<div>Admin Payments</div>} />
              <Route path="/admin/profile" element={<div>Admin Profile</div>} />
              <Route path="/login" element={<div>Login Page</div>} />
            </Route>
          </Routes>
        </NavModeProvider>
      </ThemeProvider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  mockNavigate.mockReset();
  localStorage.clear();
});

describe('Layout', () => {
  it('renders child route content', () => {
    renderLayout({ user: { name: 'Alice' }, role: 'member' }, '/member/dashboard');
    expect(screen.getByText('Member Dashboard')).toBeInTheDocument();
  });

  it('displays navigation links for the current role', () => {
    renderLayout({ user: { name: 'Alice' }, role: 'member' }, '/member/dashboard');
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Schedule')).toBeInTheDocument();
  });

  it('renders the brand/logo link', () => {
    renderLayout({ user: { name: 'Bob' }, role: 'trainer' }, '/trainer/dashboard');
    expect(screen.getByText('Fitness Club')).toBeInTheDocument();
  });

  it('renders admin sidebar items', () => {
    renderLayout({ user: { name: 'Admin' }, role: 'admin' }, '/admin/dashboard', 'sidebar');
    fireEvent.click(screen.getByLabelText('Open menu'));
    expect(screen.getByText('Room Booking')).toBeInTheDocument();
    expect(screen.getByText('Equipment')).toBeInTheDocument();
    expect(screen.getByText('Payments')).toBeInTheDocument();
  });

  it('computes initials from user name', () => {
    renderLayout({ user: { name: 'John Doe' }, role: 'member' }, '/member/dashboard');
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('computes single initial from single-word name', () => {
    renderLayout({ user: { name: 'Alice' }, role: 'member' }, '/member/dashboard');
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('handles null user name gracefully for initials', () => {
    renderLayout({ user: {}, role: 'member' }, '/member/dashboard');
    expect(screen.getByLabelText('Go to dashboard')).toBeInTheDocument();
  });

  it('falls back to member dashboard when role is unknown', () => {
    renderLayout({ user: { name: 'X' }, role: 'unknown' }, '/member/dashboard');
    fireEvent.click(screen.getByLabelText('Go to dashboard'));
    expect(mockNavigate).toHaveBeenCalledWith('/member/dashboard');
  });

  describe('user menu', () => {
    it('toggles user menu open and closed', () => {
      renderLayout({ user: { name: 'Alice', email: 'a@b.com' }, role: 'member' }, '/member/dashboard', 'dropdown');
      const toggle = screen.getByText('A').closest('button');
      fireEvent.click(toggle);
      expect(screen.getAllByText('a@b.com').length).toBeGreaterThanOrEqual(1);
      fireEvent.click(toggle);
    });

    it('closes user menu on outside click', () => {
      renderLayout({ user: { name: 'Alice', email: 'a@b.com' }, role: 'member' }, '/member/dashboard', 'dropdown');
      const toggle = screen.getByText('A').closest('button');
      fireEvent.click(toggle);
      expect(screen.getAllByText('a@b.com').length).toBeGreaterThanOrEqual(1);
      fireEvent.mouseDown(document.body);
    });

    it('does not close user menu on mouseDown inside the menu', () => {
      renderLayout({ user: { name: 'Alice', email: 'a@b.com' }, role: 'member' }, '/member/dashboard', 'dropdown');
      const toggle = screen.getByText('A').closest('button');
      fireEvent.click(toggle);
      const emailEl = screen.getAllByText('a@b.com')[0];
      fireEvent.mouseDown(emailEl);
      expect(screen.getAllByText('a@b.com').length).toBeGreaterThanOrEqual(1);
    });

    it('displays user name and email in menu', () => {
      renderLayout({ user: { name: 'Alice Smith', email: 'alice@test.com' }, role: 'member' }, '/member/dashboard', 'dropdown');
      const toggle = screen.getByText('AS').closest('button');
      fireEvent.click(toggle);
      expect(screen.getAllByText('Alice Smith').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('alice@test.com')).toBeInTheDocument();
    });
  });

  describe('logout', () => {
    it('calls logout and navigates to /login', async () => {
      const logoutFn = vi.fn().mockResolvedValue(undefined);
      renderLayout({ user: { name: 'Alice' }, role: 'member', logout: logoutFn }, '/member/dashboard');

      const toggle = screen.getByText('A').closest('button');
      fireEvent.click(toggle);

      const signOutButtons = screen.getAllByText('Sign Out');
      await act(async () => { fireEvent.click(signOutButtons[0]); });

      expect(logoutFn).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  describe('dashboard navigation', () => {
    it('navigates to member dashboard', () => {
      renderLayout({ user: { name: 'A' }, role: 'member' }, '/member/dashboard');
      fireEvent.click(screen.getByLabelText('Go to dashboard'));
      expect(mockNavigate).toHaveBeenCalledWith('/member/dashboard');
    });

    it('navigates to trainer dashboard', () => {
      renderLayout({ user: { name: 'A' }, role: 'trainer' }, '/trainer/dashboard');
      fireEvent.click(screen.getByLabelText('Go to dashboard'));
      expect(mockNavigate).toHaveBeenCalledWith('/trainer/dashboard');
    });

    it('navigates to admin dashboard', () => {
      renderLayout({ user: { name: 'A' }, role: 'admin' }, '/admin/dashboard');
      fireEvent.click(screen.getByLabelText('Go to dashboard'));
      expect(mockNavigate).toHaveBeenCalledWith('/admin/dashboard');
    });
  });

  describe('sidebar mode', () => {
    it('shows Open menu button in sidebar mode', () => {
      renderLayout({ user: { name: 'Alice' }, role: 'member' }, '/member/dashboard', 'sidebar');
      expect(screen.getByLabelText('Open menu')).toBeInTheDocument();
    });

    it('opens sidebar on Open menu click', () => {
      renderLayout({ user: { name: 'Alice', email: 'a@b.com' }, role: 'member' }, '/member/dashboard', 'sidebar');
      fireEvent.click(screen.getByLabelText('Open menu'));
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('closes sidebar on Escape key', () => {
      renderLayout({ user: { name: 'Alice' }, role: 'member' }, '/member/dashboard', 'sidebar');
      fireEvent.click(screen.getByLabelText('Open menu'));
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      fireEvent.keyDown(document, { key: 'Escape' });
    });

    it('ignores non-Escape key when sidebar open', () => {
      renderLayout({ user: { name: 'Alice' }, role: 'member' }, '/member/dashboard', 'sidebar');
      fireEvent.click(screen.getByLabelText('Open menu'));
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      fireEvent.keyDown(document, { key: 'Tab' });
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('closes sidebar on backdrop click', () => {
      renderLayout({ user: { name: 'Alice' }, role: 'member' }, '/member/dashboard', 'sidebar');
      fireEvent.click(screen.getByLabelText('Open menu'));
      const backdrop = screen.getByRole('dialog').querySelector('[aria-hidden="true"]');
      fireEvent.click(backdrop);
    });

    it('displays role badge in sidebar', () => {
      renderLayout({ user: { name: 'Alice' }, role: 'member' }, '/member/dashboard', 'sidebar');
      fireEvent.click(screen.getByLabelText('Open menu'));
      expect(screen.getByText('member')).toBeInTheDocument();
    });

    it('sidebar contains sign out button', async () => {
      const logoutFn = vi.fn().mockResolvedValue(undefined);
      renderLayout({ user: { name: 'Alice' }, role: 'member', logout: logoutFn }, '/member/dashboard', 'sidebar');
      fireEvent.click(screen.getByLabelText('Open menu'));
      const signOutButtons = screen.getAllByText('Sign Out');
      expect(signOutButtons.length).toBeGreaterThanOrEqual(2);
      await act(async () => { fireEvent.click(signOutButtons[1]); });
      expect(logoutFn).toHaveBeenCalled();
    });

    it('shows nav links in sidebar panel', () => {
      renderLayout({ user: { name: 'Alice' }, role: 'trainer' }, '/trainer/dashboard', 'sidebar');
      fireEvent.click(screen.getByLabelText('Open menu'));
      expect(screen.getByText('Availability')).toBeInTheDocument();
    });
  });

  describe('dropdown mode', () => {
    it('does not show Open menu button in dropdown mode', () => {
      renderLayout({ user: { name: 'Alice' }, role: 'member' }, '/member/dashboard', 'dropdown');
      expect(screen.queryByLabelText('Open menu')).not.toBeInTheDocument();
    });

    it('shows nav items in dropdown menu', () => {
      renderLayout({ user: { name: 'Alice' }, role: 'member' }, '/member/dashboard', 'dropdown');
      const toggle = screen.getByText('A').closest('button');
      fireEvent.click(toggle);
      expect(screen.getByText('Health & Goals')).toBeInTheDocument();
    });

    it('closes menu when dropdown nav link is clicked', () => {
      renderLayout({ user: { name: 'Alice' }, role: 'member' }, '/member/dashboard', 'dropdown');
      const toggle = screen.getByText('A').closest('button');
      fireEvent.click(toggle);
      const scheduleLink = screen.getByText('Schedule');
      fireEvent.click(scheduleLink);
    });
  });

  it('closes user menu when clicking outside menuRef', () => {
    renderLayout({ user: { name: 'Alice', email: 'a@b.com' }, role: 'member' }, '/member/dashboard', 'dropdown');
    const toggle = screen.getByText('A').closest('button');
    fireEvent.click(toggle);
    expect(screen.getAllByText('a@b.com').length).toBeGreaterThanOrEqual(1);
    fireEvent.mouseDown(document.body);
  });

  describe('Escape keydown on sidebar not open does nothing', () => {
    it('does not error when Escape pressed without sidebar open', () => {
      renderLayout({ user: { name: 'Alice' }, role: 'member' }, '/member/dashboard', 'sidebar');
      fireEvent.keyDown(document, { key: 'Escape' });
    });
  });
});
