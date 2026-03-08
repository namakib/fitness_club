import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
  setAccessToken: vi.fn(),
}));

vi.mock('../../toastUtil', () => ({
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));

import api from '../../api';
import { toastError } from '../../toastUtil';
import { AuthProvider } from '../../context/AuthContext';
import { ThemeProvider } from '../../context/ThemeContext';
import { NavModeProvider } from '../../context/NavModeContext';
import Login from '../../pages/Login';

function renderLoginFlow(route = '/login') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <ThemeProvider>
        <NavModeProvider>
          <AuthProvider>
            <Login />
          </AuthProvider>
        </NavModeProvider>
      </ThemeProvider>
    </MemoryRouter>
  );
}

describe('Login Integration Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.post.mockRejectedValueOnce(new Error('no session'));
  });

  it('fills and submits login form successfully', async () => {
    const user = userEvent.setup();
    api.post.mockResolvedValueOnce({ user: { name: 'Alice' }, role: 'member', access_token: 'tok' });
    renderLoginFlow();

    await waitFor(() => {
      expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
    });

    await user.type(document.querySelector('input[type="email"]'), 'alice@test.com');
    await user.type(document.querySelector('input[type="password"]'), 'pass123');
    await user.click(screen.getByText('Sign In'));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/login', {
        email: 'alice@test.com',
        password: 'pass123',
        role: 'member',
      });
    });
  });

  it('shows error toast on failed login', async () => {
    const user = userEvent.setup();
    const err = new Error('Invalid credentials');
    err.details = null;
    api.post.mockRejectedValueOnce(err);
    renderLoginFlow();

    await waitFor(() => {
      expect(screen.getByText('Sign In')).toBeInTheDocument();
    });

    await user.type(document.querySelector('input[type="email"]'), 'bad@test.com');
    await user.type(document.querySelector('input[type="password"]'), 'wrong');
    await user.click(screen.getByText('Sign In'));

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('Invalid credentials', null);
    });
  });

  it('disables button while submitting', async () => {
    const user = userEvent.setup();
    let resolvePost;
    api.post.mockReturnValueOnce(new Promise((res) => { resolvePost = res; }));
    renderLoginFlow();

    await waitFor(() => expect(screen.getByText('Sign In')).toBeInTheDocument());

    await user.type(document.querySelector('input[type="email"]'), 'a@b.com');
    await user.type(document.querySelector('input[type="password"]'), 'pass');
    await user.click(screen.getByText('Sign In'));

    expect(screen.getByText('Signing in...')).toBeInTheDocument();
    resolvePost({ user: { name: 'A' }, role: 'member', access_token: 'tok' });
  });
});
