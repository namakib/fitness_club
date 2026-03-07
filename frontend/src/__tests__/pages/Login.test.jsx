import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

const mockLogin = vi.fn();
const mockNavigate = vi.fn();

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    role: null,
    loading: false,
    login: mockLogin,
    logout: vi.fn(),
    refetch: vi.fn(),
  }),
  AuthProvider: ({ children }) => children,
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../../toastUtil', () => ({
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));

import Login from '../../pages/Login';
import { toastError } from '../../toastUtil';
import { ThemeProvider } from '../../context/ThemeContext';

function renderLogin() {
  return render(
    <MemoryRouter>
      <ThemeProvider>
        <Login />
      </ThemeProvider>
    </MemoryRouter>
  );
}

describe('Login page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form', () => {
    renderLogin();
    expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Password')).toBeInTheDocument();
  });

  it('renders Sign In button', () => {
    renderLogin();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('renders link to register page', () => {
    renderLogin();
    expect(screen.getByText('Register')).toBeInTheDocument();
  });

  it('submits login and navigates on success', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValueOnce({ user: { name: 'Alice' }, role: 'member' });
    renderLogin();

    const emailInput = document.querySelector('input[type="email"]');
    const passwordInput = document.querySelector('input[type="password"]');
    await user.type(emailInput, 'alice@test.com');
    await user.type(passwordInput, 'secret123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('alice@test.com', 'secret123', 'member');
      expect(mockNavigate).toHaveBeenCalledWith('/member/dashboard');
    });
  });

  it('shows toast on login error', async () => {
    const user = userEvent.setup();
    const err = new Error('Invalid credentials');
    err.details = ['Bad password'];
    mockLogin.mockRejectedValueOnce(err);
    renderLogin();

    await user.type(document.querySelector('input[type="email"]'), 'a@b.com');
    await user.type(document.querySelector('input[type="password"]'), 'wrong');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('Invalid credentials', ['Bad password']);
    });
  });

  it('toggles password visibility', async () => {
    const user = userEvent.setup();
    renderLogin();
    const passwordInput = document.querySelector('input[type="password"]');
    expect(passwordInput.type).toBe('password');

    await user.click(screen.getByLabelText('Show password'));
    expect(passwordInput.type).toBe('text');
  });

  it('toggles password back to hidden', async () => {
    const user = userEvent.setup();
    renderLogin();

    const toggle = screen.getByLabelText('Show password');
    await user.click(toggle);
    expect(screen.getByLabelText('Hide password')).toBeInTheDocument();

    await user.click(screen.getByLabelText('Hide password'));
    expect(screen.getByLabelText('Show password')).toBeInTheDocument();
    expect(document.querySelector('input[type="password"]')).toBeInTheDocument();
  });

  it('changes role via dropdown', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValueOnce({});
    renderLogin();

    const roleTrigger = screen.getByText('Member');
    await user.click(roleTrigger);

    await waitFor(() => {
      expect(screen.getByText('Trainer')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Trainer'));

    await user.type(document.querySelector('input[type="email"]'), 'a@b.com');
    await user.type(document.querySelector('input[type="password"]'), 'pass123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('a@b.com', 'pass123', 'trainer');
      expect(mockNavigate).toHaveBeenCalledWith('/trainer/dashboard');
    });
  });
});
