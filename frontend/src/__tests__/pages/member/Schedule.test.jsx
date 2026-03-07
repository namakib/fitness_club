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
import Schedule from '../../../pages/member/Schedule';
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

const dashboardData = {
  summary: null,
  active_goals: [],
  recent_metrics: [],
  all_metrics: [],
  upcoming_sessions: [
    { session_id: 1, session_date: '2025-07-01', start_time: '09:00', end_time: '10:00', trainer_name: 'Bob', room_name: 'A' },
  ],
  upcoming_classes: [
    { class_id: 1, class_name: 'Yoga', class_date: '2025-07-02', start_time: '10:00', end_time: '11:00', room_name: 'B', enrolled_count: 5, max_participants: 20 },
  ],
};

describe('Member Schedule page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockImplementation((path) => {
      if (path.includes('dashboard')) return Promise.resolve(dashboardData);
      if (path.includes('available-classes')) return Promise.resolve({ classes: [] });
      if (path.includes('trainers')) return Promise.resolve({ trainers: [] });
      return Promise.resolve({});
    });
  });

  it('renders Schedule heading', async () => {
    renderSchedule();
    await waitFor(() => {
      expect(screen.getByText('Schedule')).toBeInTheDocument();
    });
  });

  it('renders Book Session button', async () => {
    renderSchedule();
    await waitFor(() => {
      expect(screen.getByText('+ Book Session')).toBeInTheDocument();
    });
  });

  it('renders sections for sessions and classes', async () => {
    renderSchedule();
    await waitFor(() => {
      expect(screen.getByText('Upcoming Sessions')).toBeInTheDocument();
      expect(screen.getByText('Upcoming Classes')).toBeInTheDocument();
      expect(screen.getByText('Browse Classes')).toBeInTheDocument();
    });
  });
});
