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
import Availability from '../../../pages/trainer/Availability';
import { ThemeProvider } from '../../../context/ThemeContext';

function renderAvailability() {
  return render(
    <MemoryRouter>
      <ThemeProvider>
        <Availability />
      </ThemeProvider>
    </MemoryRouter>
  );
}

describe('Trainer Availability', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockImplementation((path) => {
      if (path === '/trainer/availability') return Promise.resolve({
        slots: [
          { availability_id: 1, available_date: '2025-07-07', start_time: '09:00', end_time: '17:00' },
        ],
      });
      if (path.includes('rooms')) return Promise.resolve({ rooms: [] });
      if (path.includes('schedule')) return Promise.resolve({ sessions: [], classes: [] });
      return Promise.resolve({});
    });
  });

  it('renders availability heading', async () => {
    renderAvailability();
    await waitFor(() => {
      expect(screen.getByText('Availability')).toBeInTheDocument();
    });
  });

  it('fetches availability on mount', async () => {
    renderAvailability();
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/trainer/availability');
    });
  });

  it('renders Add Slot button', async () => {
    renderAvailability();
    await waitFor(() => {
      expect(screen.getByText('Add Time Slot')).toBeInTheDocument();
    });
  });
});
