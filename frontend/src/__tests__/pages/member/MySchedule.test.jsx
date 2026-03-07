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
import MySchedule from '../../../pages/member/MySchedule';
import { ThemeProvider } from '../../../context/ThemeContext';

function renderMySchedule() {
  return render(
    <MemoryRouter>
      <ThemeProvider>
        <MySchedule />
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
  upcoming_classes: [],
};

describe('MySchedule page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockResolvedValue(dashboardData);
  });

  it('renders heading after data loads', async () => {
    renderMySchedule();
    await waitFor(() => {
      expect(screen.getByText('My Schedule')).toBeInTheDocument();
    });
  });

  it('renders session and class sections', async () => {
    renderMySchedule();
    await waitFor(() => {
      expect(screen.getByText('Upcoming Sessions')).toBeInTheDocument();
      expect(screen.getByText('Upcoming Classes')).toBeInTheDocument();
    });
  });

  it('handles API error gracefully', async () => {
    api.get.mockRejectedValueOnce(new Error('fail'));
    renderMySchedule();
    await waitFor(() => expect(api.get).toHaveBeenCalled());
  });
});
