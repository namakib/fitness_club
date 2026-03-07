import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

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

function renderLayout(authState, route = '/member/dashboard') {
  __setMock(authState);
  return render(
    <MemoryRouter initialEntries={[route]}>
      <ThemeProvider>
        <NavModeProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/member/dashboard" element={<div>Member Dashboard</div>} />
              <Route path="/trainer/dashboard" element={<div>Trainer Dashboard</div>} />
              <Route path="/admin/dashboard" element={<div>Admin Dashboard</div>} />
            </Route>
          </Routes>
        </NavModeProvider>
      </ThemeProvider>
    </MemoryRouter>
  );
}

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
});
