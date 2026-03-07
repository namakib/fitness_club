import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

const mockNavigate = vi.fn();

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
});
