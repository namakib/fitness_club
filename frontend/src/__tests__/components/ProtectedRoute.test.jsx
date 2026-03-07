import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

vi.mock('../../context/AuthContext', () => {
  let mockValue = { user: null, role: null, loading: true, login: vi.fn(), logout: vi.fn(), refetch: vi.fn() };
  return {
    useAuth: () => mockValue,
    __setMock: (v) => { mockValue = { ...mockValue, ...v }; },
    AuthProvider: ({ children }) => children,
  };
});

import ProtectedRoute from '../../components/ProtectedRoute';
import { __setMock } from '../../context/AuthContext';

function renderWithRoute(authState, requiredRole = 'member') {
  __setMock(authState);
  return render(
    <MemoryRouter initialEntries={['/protected']}>
      <Routes>
        <Route path="/protected" element={
          <ProtectedRoute role={requiredRole}>
            <div>Protected Content</div>
          </ProtectedRoute>
        } />
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    __setMock({ user: null, role: null, loading: true });
  });

  it('shows spinner while loading', () => {
    renderWithRoute({ loading: true });
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
  });

  it('redirects to /login if no user', () => {
    renderWithRoute({ loading: false, user: null, role: null });
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('redirects to /login if wrong role', () => {
    renderWithRoute({ loading: false, user: { name: 'Bob' }, role: 'trainer' }, 'member');
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('renders children when authorized', () => {
    renderWithRoute({ loading: false, user: { name: 'Alice' }, role: 'member' }, 'member');
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});
