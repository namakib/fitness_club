import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../../api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  AreaChart: ({ children }) => <div data-testid="area-chart">{children}</div>,
  Area: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
}));

import api from '../../../api';
import Dashboard from '../../../pages/member/Dashboard';
import { ThemeProvider } from '../../../context/ThemeContext';

function renderDashboard() {
  return render(
    <MemoryRouter>
      <ThemeProvider>
        <Dashboard />
      </ThemeProvider>
    </MemoryRouter>
  );
}

const mockData = {
  summary: { latest_weight: 75, active_goals: 2, classes_attended: 3, upcoming_sessions: 1 },
  active_goals: [{ goal_type: 'weight_loss', target_value: '70kg', end_date: '2025-12-31' }],
  all_metrics: [],
  upcoming_sessions: [{ session_date: '2025-07-01', start_time: '09:00', end_time: '10:00', trainer_name: 'Bob', room_name: 'A' }],
  upcoming_classes: [],
};

describe('Member Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockResolvedValue(mockData);
  });

  it('renders dashboard heading after data loads', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });

  it('renders stat cards with data', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('75 kg')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  it('renders Record Health Metric button', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('+ Record Health Metric')).toBeInTheDocument();
    });
  });

  it('renders active goals', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText(/weight loss/i)).toBeInTheDocument();
    });
  });

  it('handles API error gracefully', async () => {
    api.get.mockRejectedValueOnce(new Error('fail'));
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });
});
