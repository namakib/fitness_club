import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../../api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));
vi.mock('../../../toastUtil', () => ({
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));

import api from '../../../api';
import AdminProfile from '../../../pages/admin/Profile';
import { ThemeProvider } from '../../../context/ThemeContext';
import { NavModeProvider } from '../../../context/NavModeContext';

function renderProfile() {
  return render(
    <MemoryRouter>
      <ThemeProvider>
        <NavModeProvider>
          <AdminProfile />
        </NavModeProvider>
      </ThemeProvider>
    </MemoryRouter>
  );
}

describe('Admin Profile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockResolvedValue({
      admin: { name: 'Admin User', email: 'admin@gym.com', phone: '5551112222', created_at: '2023-01-01' },
      stats: { total_members: 50, total_trainers: 5 },
    });
  });

  it('renders admin name after load', async () => {
    renderProfile();
    await waitFor(() => {
      expect(screen.getByText('Admin User')).toBeInTheDocument();
    });
  });

  it('renders admin email', async () => {
    renderProfile();
    await waitFor(() => {
      expect(screen.getByText('admin@gym.com')).toBeInTheDocument();
    });
  });

  it('renders edit profile section', async () => {
    renderProfile();
    await waitFor(() => {
      expect(screen.getByText('Edit Profile')).toBeInTheDocument();
    });
  });
});
