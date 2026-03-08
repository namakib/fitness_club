import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

const mockNavigate = vi.fn();

let mockDemoMode = false;

vi.mock('../../api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../../toastUtil', () => ({
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));
vi.mock('../../components/DatePicker', () => ({
  default: ({ label, value, onChange }) => (
    <input data-testid={`dp-${label}`} value={value ?? ''} onChange={e => onChange(e.target.value)} />
  ),
}));
vi.mock('../../context/DemoContext', () => ({
  useDemo: () => ({ demoMode: mockDemoMode, demoAccounts: [] }),
  DemoProvider: ({ children }) => children,
}));

import api from '../../api';
import { toastSuccess, toastError } from '../../toastUtil';
import Register from '../../pages/Register';
import { ThemeProvider } from '../../context/ThemeContext';

function renderRegister() {
  return render(
    <MemoryRouter>
      <ThemeProvider>
        <Register />
      </ThemeProvider>
    </MemoryRouter>
  );
}

describe('Register page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDemoMode = false;
    api.post.mockResolvedValue({});
  });

  it('renders registration form heading', () => {
    renderRegister();
    expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument();
  });

  it('renders form fields', () => {
    renderRegister();
    expect(screen.getByText('Full Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Password')).toBeInTheDocument();
  });

  it('renders link to login', () => {
    renderRegister();
    expect(screen.getByText('Sign in')).toBeInTheDocument();
  });

  it('shows error toast on failure', async () => {
    const user = userEvent.setup();
    const err = new Error('Email exists');
    err.details = ['Already registered'];
    api.post.mockRejectedValueOnce(err);
    renderRegister();

    await user.type(document.querySelector('input[type="text"]'), 'Test');
    await user.type(document.querySelector('input[type="email"]'), 'dup@test.com');
    await user.type(document.querySelector('input[type="password"]'), 'pass123');

    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('Email exists', ['Already registered']);
    });
  });

  it('submits registration and navigates on success', async () => {
    const user = userEvent.setup();
    api.post.mockResolvedValueOnce({});
    renderRegister();

    await user.type(document.querySelector('input[type="text"]'), 'Alice');
    await user.type(document.querySelector('input[type="email"]'), 'alice@test.com');
    await user.type(document.querySelector('input[type="password"]'), 'secret123');

    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/register', expect.objectContaining({
        name: 'Alice',
        email: 'alice@test.com',
        password: 'secret123',
      }));
      expect(toastSuccess).toHaveBeenCalledWith('Registration successful! Please log in.');
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  it('toggles password visibility show and hide', async () => {
    const user = userEvent.setup();
    renderRegister();

    const pwInput = document.querySelector('input[type="password"]');
    expect(pwInput.type).toBe('password');

    await user.click(screen.getByLabelText('Show password'));
    expect(pwInput.type).toBe('text');
    expect(screen.getByLabelText('Hide password')).toBeInTheDocument();

    await user.click(screen.getByLabelText('Hide password'));
    expect(document.querySelector('input[type="password"]')).toBeInTheDocument();
    expect(screen.getByLabelText('Show password')).toBeInTheDocument();
  });

  it('shows busy state while submitting', async () => {
    const user = userEvent.setup();
    let resolve;
    api.post.mockImplementationOnce(() => new Promise(r => { resolve = r; }));
    renderRegister();

    await user.type(document.querySelector('input[type="text"]'), 'Bob');
    await user.type(document.querySelector('input[type="email"]'), 'bob@test.com');
    await user.type(document.querySelector('input[type="password"]'), 'pass123');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /creating account/i })).toBeDisabled();
    });

    resolve({});
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /create account/i })).not.toBeDisabled();
    });
  });

  it('changes gender via dropdown', async () => {
    const user = userEvent.setup();
    renderRegister();

    const genderTrigger = screen.getByText('Male');
    await user.click(genderTrigger);

    await waitFor(() => {
      expect(screen.getByText('Female')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Female'));

    api.post.mockResolvedValueOnce({});
    await user.type(document.querySelector('input[type="text"]'), 'Alice');
    await user.type(document.querySelector('input[type="email"]'), 'a@b.com');
    await user.type(document.querySelector('input[type="password"]'), 'pass12');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/register', expect.objectContaining({ gender: 'female' }));
    });
  });

  it('updates date of birth via DatePicker', async () => {
    const { fireEvent } = await import('@testing-library/react');
    renderRegister();
    const dp = screen.getByTestId('dp-Date of Birth');
    fireEvent.change(dp, { target: { value: '1990-05-15' } });
    expect(dp.value).toBe('1990-05-15');
  });

  it('renders phone input', () => {
    renderRegister();
    expect(screen.getByText('Phone (optional)')).toBeInTheDocument();
  });

  it('redirects to /login in demo mode', () => {
    mockDemoMode = true;
    const { container } = renderRegister();
    expect(container.querySelector('form')).not.toBeInTheDocument();
  });
});
