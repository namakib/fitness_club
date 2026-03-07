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
import Schedule from '../../../pages/trainer/Schedule';
import { ThemeProvider } from '../../../context/ThemeContext';

function renderSchedule() {
  return render(
    <MemoryRouter>
      <ThemeProvider>
        <Schedule />
      </ThemeProvider>
    </MemoryRouter>
  );
}

describe('Trainer Schedule', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockImplementation((path) => {
      if (path.includes('schedule')) return Promise.resolve({
        sessions: [{ session_id: 1, session_date: '2025-07-01', start_time: '09:00', end_time: '10:00', member_name: 'Alice', room_name: 'A', status: 'scheduled' }],
        classes: [],
      });
      if (path.includes('rooms')) return Promise.resolve({ rooms: [] });
      return Promise.resolve({});
    });
  });

  it('renders schedule heading', async () => {
    renderSchedule();
    await waitFor(() => {
      expect(screen.getByText('Schedule')).toBeInTheDocument();
    });
  });

  it('fetches schedule data on mount', async () => {
    renderSchedule();
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/trainer/schedule');
    });
  });
});
