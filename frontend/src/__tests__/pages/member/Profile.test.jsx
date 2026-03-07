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
import Profile from '../../../pages/member/Profile';
import { ThemeProvider } from '../../../context/ThemeContext';
import { NavModeProvider } from '../../../context/NavModeContext';

function renderProfile() {
  return render(
    <MemoryRouter>
      <ThemeProvider>
        <NavModeProvider>
          <Profile />
        </NavModeProvider>
      </ThemeProvider>
    </MemoryRouter>
  );
}

const profileData = {
  member: { name: 'Alice Smith', email: 'alice@test.com', phone: '5551234567', gender: 'female', dob: '1990-05-15', created_at: '2024-01-01' },
  goals: [],
  recent_metrics: [],
};

describe('Member Profile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockResolvedValue(profileData);
  });

  it('renders profile after data loads', async () => {
    renderProfile();
    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
      expect(screen.getByText('alice@test.com')).toBeInTheDocument();
    });
  });

  it('renders edit profile form', async () => {
    renderProfile();
    await waitFor(() => {
      expect(screen.getByText('Edit Profile')).toBeInTheDocument();
      expect(screen.getByText('Save Changes')).toBeInTheDocument();
    });
  });

  it('renders navigation style toggle', async () => {
    renderProfile();
    await waitFor(() => {
      expect(screen.getByText('Navigation Style')).toBeInTheDocument();
    });
  });

  it('handles API error gracefully', async () => {
    api.get.mockRejectedValueOnce(new Error('fail'));
    renderProfile();
    await waitFor(() => {
      expect(screen.getByText('Unable to load profile.')).toBeInTheDocument();
    });
  });
});
