import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
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

import api from '../../api';
import { setAccessToken } from '../../api';
import { AuthProvider, useAuth } from '../../context/AuthContext';

function TestConsumer() {
  const { user, role, loading, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="user">{user ? JSON.stringify(user) : 'null'}</span>
      <span data-testid="role">{role || 'null'}</span>
      <button onClick={() => login('a@b.com', 'pass', 'member')}>login</button>
      <button onClick={async () => { try { await logout(); } catch {} }}>logout</button>
    </div>
  );
}

function renderAuth() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('useAuth throws when used outside AuthProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<TestConsumer />)).toThrow('useAuth must be used within AuthProvider');
    spy.mockRestore();
  });

  it('bootstraps via /refresh then /me on mount', async () => {
    api.post.mockResolvedValueOnce({ access_token: 'tok123' });
    api.get.mockResolvedValueOnce({ user: { name: 'Alice' }, role: 'member' });
    renderAuth();
    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toContain('Alice');
      expect(screen.getByTestId('role').textContent).toBe('member');
    });
    expect(api.post).toHaveBeenCalledWith('/refresh');
    expect(api.get).toHaveBeenCalledWith('/me');
    expect(setAccessToken).toHaveBeenCalledWith('tok123');
  });

  it('sets user/role to null when /refresh fails', async () => {
    api.post.mockRejectedValueOnce(new Error('No refresh token'));
    renderAuth();
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
    expect(screen.getByTestId('user').textContent).toBe('null');
    expect(screen.getByTestId('role').textContent).toBe('null');
    expect(setAccessToken).toHaveBeenCalledWith(null);
  });

  it('login calls POST and updates state with token', async () => {
    api.post
      .mockRejectedValueOnce(new Error('no session'))
      .mockResolvedValueOnce({ user: { name: 'Bob' }, role: 'member', access_token: 'login-tok' });
    renderAuth();
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));

    await act(async () => {
      screen.getByText('login').click();
    });
    expect(api.post).toHaveBeenCalledWith('/login', { email: 'a@b.com', password: 'pass', role: 'member' });
    expect(setAccessToken).toHaveBeenCalledWith('login-tok');
    expect(screen.getByTestId('user').textContent).toContain('Bob');
  });

  it('logout clears state and token even when API fails', async () => {
    api.post
      .mockResolvedValueOnce({ access_token: 'tok' })
      .mockRejectedValueOnce(new Error('Network error'));
    api.get.mockResolvedValueOnce({ user: { name: 'Carol' }, role: 'trainer' });
    renderAuth();
    await waitFor(() => expect(screen.getByTestId('user').textContent).toContain('Carol'));

    await act(async () => {
      screen.getByText('logout').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('null');
      expect(screen.getByTestId('role').textContent).toBe('null');
    });
    expect(setAccessToken).toHaveBeenCalledWith(null);
  });
});
