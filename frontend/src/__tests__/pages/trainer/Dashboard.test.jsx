import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../../api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  BarChart: ({ children }) => <div>{children}</div>,
  AreaChart: ({ children }) => <div>{children}</div>,
  Bar: () => null,
  Area: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
}));

import api from '../../../api';
import TrainerDashboard from '../../../pages/trainer/Dashboard';
import { ThemeProvider } from '../../../context/ThemeContext';

function renderDashboard() {
  return render(
    <MemoryRouter>
      <ThemeProvider>
        <TrainerDashboard />
      </ThemeProvider>
    </MemoryRouter>
  );
}

const mockData = {
  total_sessions: 10,
  total_classes: 5,
  total_members: 20,
  total_availability_slots: 15,
  upcoming_sessions: [{ session_date: '2025-07-01', start_time: '09:00', end_time: '10:00', member_name: 'Alice', room_name: 'A' }],
  session_trend: [{ month: 'Jan', count: 3 }],
  class_trend: [{ month: 'Jan', count: 2 }],
};

describe('Trainer Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockResolvedValue(mockData);
  });

  it('renders heading after load', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Trainer Dashboard')).toBeInTheDocument();
    });
  });

  it('renders stat cards', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('20')).toBeInTheDocument();
    });
  });

  it('renders upcoming sessions heading', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Next Upcoming Sessions')).toBeInTheDocument();
    });
  });

  it('handles API error gracefully', async () => {
    api.get.mockRejectedValueOnce(new Error('fail'));
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Trainer Dashboard')).toBeInTheDocument();
    });
  });
});
