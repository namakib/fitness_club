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
import TrainerProfile from '../../../pages/trainer/Profile';
import { ThemeProvider } from '../../../context/ThemeContext';
import { NavModeProvider } from '../../../context/NavModeContext';

function renderProfile() {
  return render(
    <MemoryRouter>
      <ThemeProvider>
        <NavModeProvider>
          <TrainerProfile />
        </NavModeProvider>
      </ThemeProvider>
    </MemoryRouter>
  );
}

describe('Trainer Profile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockResolvedValue({
      trainer: { name: 'Bob Trainer', email: 'bob@gym.com', phone: '5559876543', specialization: 'Strength', created_at: '2024-01-01' },
      stats: { total_sessions: 50, total_classes: 20 },
    });
  });

  it('renders trainer name after load', async () => {
    renderProfile();
    await waitFor(() => {
      expect(screen.getByText('Bob Trainer')).toBeInTheDocument();
    });
  });

  it('renders edit profile form', async () => {
    renderProfile();
    await waitFor(() => {
      expect(screen.getByText('Edit Profile')).toBeInTheDocument();
      expect(screen.getByText('Save Changes')).toBeInTheDocument();
    });
  });

  it('renders trainer email', async () => {
    renderProfile();
    await waitFor(() => {
      expect(screen.getByText('bob@gym.com')).toBeInTheDocument();
    });
  });
});
