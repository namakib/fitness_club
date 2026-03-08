import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

const mockNavigate = vi.fn();

vi.mock('../../api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  setAccessToken: vi.fn(),
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

function renderRegisterFlow() {
  return render(
    <MemoryRouter initialEntries={['/register']}>
      <ThemeProvider>
        <Register />
      </ThemeProvider>
    </MemoryRouter>
  );
}

describe('Register Integration Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.post.mockResolvedValue({});
  });

  it('fills all fields and submits registration', async () => {
    const user = userEvent.setup();
    renderRegisterFlow();

    await user.type(document.querySelectorAll('input[type="text"]')[0], 'John Doe');
    await user.type(document.querySelector('input[type="email"]'), 'john@test.com');
    await user.type(document.querySelector('input[type="password"]'), 'securepass');

    const submitBtn = screen.getAllByText('Create Account').find(el => el.tagName === 'BUTTON');
    await user.click(submitBtn);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/register', expect.objectContaining({
        name: 'John Doe',
        email: 'john@test.com',
        password: 'securepass',
      }));
      expect(toastSuccess).toHaveBeenCalledWith('Registration successful! Please log in.');
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  it('shows error on registration failure', async () => {
    const user = userEvent.setup();
    const err = new Error('Email already registered');
    err.details = ['Try a different email'];
    api.post.mockRejectedValueOnce(err);
    renderRegisterFlow();

    await user.type(document.querySelectorAll('input[type="text"]')[0], 'Dup User');
    await user.type(document.querySelector('input[type="email"]'), 'dup@test.com');
    await user.type(document.querySelector('input[type="password"]'), 'pass123');

    const submitBtn = screen.getAllByText('Create Account').find(el => el.tagName === 'BUTTON');
    await user.click(submitBtn);

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('Email already registered', ['Try a different email']);
    });
  });
});
