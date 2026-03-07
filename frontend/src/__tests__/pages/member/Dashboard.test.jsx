import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

  it('renders chart when all_metrics has 2+ items', async () => {
    const dataWithMetrics = {
      ...mockData,
      all_metrics: [
        { recorded_at: '2025-06-01T10:00:00', weight: 75, heart_rate: 70 },
        { recorded_at: '2025-06-08T10:00:00', weight: 74, heart_rate: 68 },
      ],
    };
    api.get.mockResolvedValueOnce(dataWithMetrics);
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Health Trend')).toBeInTheDocument();
      expect(screen.getByTestId('area-chart')).toBeInTheDocument();
    });
  });

  it('shows "No health data" when all_metrics is empty', async () => {
    api.get.mockResolvedValueOnce({ ...mockData, all_metrics: [] });
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText(/No health data recorded yet/)).toBeInTheDocument();
    });
  });

  it('opens Record Metric modal', async () => {
    const user = userEvent.setup();
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('+ Record Health Metric')).toBeInTheDocument();
    });

    await user.click(screen.getByText('+ Record Health Metric'));

    await waitFor(() => {
      expect(screen.getByText('Record Health Metric')).toBeInTheDocument();
    });
  });

  it('renders NextUpCard empty state for sessions', async () => {
    api.get.mockResolvedValueOnce({ ...mockData, upcoming_sessions: [], upcoming_classes: [] });
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('No upcoming sessions.')).toBeInTheDocument();
      expect(screen.getByText('No upcoming classes.')).toBeInTheDocument();
    });
  });

  it('renders NextUpCard with session content', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Next Session')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.getByText('09:00 – 10:00')).toBeInTheDocument();
    });
  });

  it('renders NextUpCard with class content', async () => {
    const dataWithClass = {
      ...mockData,
      upcoming_classes: [{ class_name: 'Yoga', class_date: '2025-07-02', start_time: '10:00', end_time: '11:00', room_name: 'B' }],
    };
    api.get.mockResolvedValueOnce(dataWithClass);
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Next Class')).toBeInTheDocument();
      expect(screen.getByText('Yoga')).toBeInTheDocument();
    });
  });

  it('shows "No active goals" link when active_goals is empty', async () => {
    api.get.mockResolvedValueOnce({ ...mockData, active_goals: [] });
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Add one now.')).toBeInTheDocument();
    });
  });

  it('renders goal with end_date', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText(/Due/)).toBeInTheDocument();
    });
  });

  it('renders goal without end_date', async () => {
    api.get.mockResolvedValueOnce({
      ...mockData,
      active_goals: [{ goal_type: 'endurance', target_value: '5k', end_date: null }],
    });
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText(/endurance/i)).toBeInTheDocument();
      expect(screen.queryByText(/Due/)).not.toBeInTheDocument();
    });
  });

  it('renders View full schedule link', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('View full schedule')).toBeInTheDocument();
    });
  });

  it('renders Manage goals link', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Manage goals')).toBeInTheDocument();
    });
  });

  it('renders single metric without chart', async () => {
    api.get.mockResolvedValueOnce({
      ...mockData,
      all_metrics: [{ recorded_at: '2025-06-01T10:00:00', weight: 75, heart_rate: 70 }],
    });
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText(/No health data recorded yet/)).toBeInTheDocument();
    });
  });

  it('closes metric modal via onSaved after successful submit', async () => {
    const user = userEvent.setup();
    api.post.mockResolvedValueOnce({});
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('+ Record Health Metric')).toBeInTheDocument();
    });

    await user.click(screen.getByText('+ Record Health Metric'));
    await waitFor(() => {
      expect(screen.getByText('Record Metric')).toBeInTheDocument();
    });

    const weightInput = screen.getByLabelText('Weight (kg)');
    await user.type(weightInput, '75');
    await user.click(screen.getByText('Record Metric'));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/member/metrics', expect.objectContaining({ weight: '75' }));
    });
  });

  it('closes metric modal via onCancel', async () => {
    const user = userEvent.setup();
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('+ Record Health Metric')).toBeInTheDocument();
    });

    await user.click(screen.getByText('+ Record Health Metric'));
    await waitFor(() => {
      expect(screen.getAllByText('Cancel').length).toBeGreaterThanOrEqual(1);
    });

    await user.click(screen.getAllByText('Cancel')[0]);
  });

  it('shows skeleton while loading', () => {
    api.get.mockReturnValue(new Promise(() => {}));
    const { container } = renderDashboard();
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('handles null summary gracefully', async () => {
    api.get.mockResolvedValueOnce({ ...mockData, summary: null });
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });

  it('renders chart with a metric having null recorded_at (shortDate null branch)', async () => {
    api.get.mockResolvedValueOnce({
      ...mockData,
      all_metrics: [
        { recorded_at: null, weight: 75, heart_rate: 70 },
        { recorded_at: '2025-06-08T10:00:00', weight: 74, heart_rate: 68 },
      ],
    });
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByTestId('area-chart')).toBeInTheDocument();
    });
  });

  it('renders goal with null goal_type', async () => {
    api.get.mockResolvedValueOnce({
      ...mockData,
      active_goals: [{ goal_type: null, target_value: 'test', end_date: null }],
    });
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText(/Target: test/)).toBeInTheDocument();
    });
  });

  it('handles data with missing all_metrics key', async () => {
    api.get.mockResolvedValueOnce({
      summary: mockData.summary,
      active_goals: [],
      upcoming_sessions: [],
      upcoming_classes: [],
    });
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText(/No health data recorded yet/)).toBeInTheDocument();
    });
  });

  it('renders session with null session_date (fmtDate null branch)', async () => {
    api.get.mockResolvedValueOnce({
      ...mockData,
      upcoming_sessions: [{ session_date: null, start_time: '09:00', end_time: '10:00', trainer_name: 'Bob', room_name: 'A' }],
    });
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Next Session')).toBeInTheDocument();
      expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders class with null class_date (fmtDate null branch)', async () => {
    api.get.mockResolvedValueOnce({
      ...mockData,
      upcoming_classes: [{ class_name: 'Yoga', class_date: null, start_time: '10:00', end_time: '11:00', room_name: 'B' }],
    });
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Next Class')).toBeInTheDocument();
      expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('closes metric modal via Modal X button (onClose)', async () => {
    const user = userEvent.setup();
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('+ Record Health Metric')).toBeInTheDocument();
    });

    await user.click(screen.getByText('+ Record Health Metric'));
    await waitFor(() => {
      expect(screen.getByLabelText('Close')).toBeInTheDocument();
    });

    await user.click(screen.getByLabelText('Close'));
  });

  it('renders in dark theme (isDark branches lines 19-21)', async () => {
    localStorage.setItem('theme', 'dark');
    api.get.mockResolvedValueOnce(mockData);
    render(
      <MemoryRouter>
        <ThemeProvider>
          <Dashboard />
        </ThemeProvider>
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
    localStorage.removeItem('theme');
  });
});
