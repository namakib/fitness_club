import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../../api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));
vi.mock('recharts', () => {
  const R = (name) => (props) => <div data-testid={name} {...props}>{props.children}</div>;
  return {
    ResponsiveContainer: R('ResponsiveContainer'), PieChart: R('PieChart'), Pie: R('Pie'), Cell: R('Cell'),
    BarChart: R('BarChart'), Bar: R('Bar'), XAxis: R('XAxis'), YAxis: R('YAxis'), Tooltip: R('Tooltip'),
    CartesianGrid: R('CartesianGrid'), Legend: R('Legend'), LineChart: R('LineChart'), Line: R('Line'),
    AreaChart: R('AreaChart'), Area: R('Area'), Brush: R('Brush'), ReferenceLine: R('ReferenceLine'),
    defs: R('defs'), linearGradient: R('linearGradient'), stop: R('stop'),
  };
});

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
  upcoming_sessions: [
    { session_date: '2025-07-01', start_time: '09:00', end_time: '10:00', member_name: 'Alice', room_name: 'A' },
  ],
  session_trend: [{ month: 'Jan', count: 3 }],
  class_trend: [{ month: 'Jan', count: 2 }],
};

describe('Trainer Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
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

  it('renders both charts when trend data exists', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Sessions per Month')).toBeInTheDocument();
      expect(screen.getByText('Classes per Month')).toBeInTheDocument();
    });
  });

  it('hides charts when trend data is empty', async () => {
    api.get.mockResolvedValueOnce({ ...mockData, session_trend: [], class_trend: [] });
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Trainer Dashboard')).toBeInTheDocument();
    });
    expect(screen.queryByText('Sessions per Month')).not.toBeInTheDocument();
    expect(screen.queryByText('Classes per Month')).not.toBeInTheDocument();
  });

  it('handles null trend arrays via || [] fallback', async () => {
    api.get.mockResolvedValueOnce({ ...mockData, session_trend: null, class_trend: null });
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Trainer Dashboard')).toBeInTheDocument();
    });
    expect(screen.queryByText('Sessions per Month')).not.toBeInTheDocument();
    expect(screen.queryByText('Classes per Month')).not.toBeInTheDocument();
  });

  it('renders empty upcoming sessions message', async () => {
    api.get.mockResolvedValueOnce({ ...mockData, upcoming_sessions: [] });
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('No upcoming sessions.')).toBeInTheDocument();
    });
  });

  it('formats dates in session table', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getAllByText('Jul 1, 2025').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows dash for null session date via fmtDate', async () => {
    api.get.mockResolvedValueOnce({
      ...mockData,
      upcoming_sessions: [
        { session_date: null, start_time: '09:00', end_time: '10:00', member_name: 'Alice', room_name: 'A' },
      ],
    });
    renderDashboard();
    await waitFor(() => {
      expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('applies dark theme variables', async () => {
    localStorage.setItem('theme', 'dark');
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Trainer Dashboard')).toBeInTheDocument();
    });
  });

  it('shows skeleton while data is loading', () => {
    api.get.mockReturnValue(new Promise(() => {}));
    const { container } = renderDashboard();
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('shows only session chart when class trend is empty', async () => {
    api.get.mockResolvedValueOnce({ ...mockData, class_trend: [] });
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Sessions per Month')).toBeInTheDocument();
    });
    expect(screen.queryByText('Classes per Month')).not.toBeInTheDocument();
  });

  it('shows only class chart when session trend is empty', async () => {
    api.get.mockResolvedValueOnce({ ...mockData, session_trend: [] });
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Classes per Month')).toBeInTheDocument();
    });
    expect(screen.queryByText('Sessions per Month')).not.toBeInTheDocument();
  });

  it('renders time range for sessions', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getAllByText('09:00 – 10:00').length).toBeGreaterThanOrEqual(1);
    });
  });
});
