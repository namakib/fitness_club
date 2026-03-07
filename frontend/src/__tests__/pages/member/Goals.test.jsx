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
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  AreaChart: ({ children }) => <div>{children}</div>,
  BarChart: ({ children }) => <div>{children}</div>,
  Area: () => null,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
}));

import api from '../../../api';
import Goals from '../../../pages/member/Goals';
import { ThemeProvider } from '../../../context/ThemeContext';

function renderGoals() {
  return render(
    <MemoryRouter>
      <ThemeProvider>
        <Goals />
      </ThemeProvider>
    </MemoryRouter>
  );
}

const profileData = {
  member: { name: 'Alice' },
  goals: [
    { goal_id: 1, goal_type: 'weight_loss', target_value: '70kg', start_date: '2025-01-01', end_date: '2025-06-01', status: 'active' },
    { goal_id: 2, goal_type: 'endurance', target_value: '5k', start_date: '2025-02-01', end_date: null, status: 'achieved' },
  ],
};

const metricsData = {
  metrics: [
    { recorded_at: '2025-06-01T10:00:00', weight: 75, body_fat_pct: 20, heart_rate: 70, blood_pressure: '120/80' },
  ],
};

describe('Member Goals page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockImplementation((path) => {
      if (path.includes('profile')) return Promise.resolve(profileData);
      if (path.includes('health-history')) return Promise.resolve(metricsData);
      return Promise.resolve({});
    });
  });

  it('renders Health & Goals heading', async () => {
    renderGoals();
    await waitFor(() => {
      expect(screen.getByText('Health & Goals')).toBeInTheDocument();
    });
  });

  it('renders Record Metric and Add Goal buttons', async () => {
    renderGoals();
    await waitFor(() => {
      expect(screen.getByText('+ Record Metric')).toBeInTheDocument();
      expect(screen.getByText('+ Add Goal')).toBeInTheDocument();
    });
  });

  it('renders goals section', async () => {
    renderGoals();
    await waitFor(() => {
      expect(screen.getByText('Fitness Goals')).toBeInTheDocument();
    });
  });

  it('renders health records table', async () => {
    renderGoals();
    await waitFor(() => {
      expect(screen.getByText('All Health Records')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    api.get.mockRejectedValue(new Error('fail'));
    renderGoals();
    await waitFor(() => expect(api.get).toHaveBeenCalled());
  });
});
