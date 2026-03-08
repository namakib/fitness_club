import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../../api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));
vi.mock('recharts', () => {
  const R = (name) => (props) => <div data-testid={name} {...props}>{props.children}</div>;
  const PieMock = (props) => {
    if (typeof props.label === 'function') {
      props.label({ name: 'Test', value: 5 });
    }
    return <div data-testid="Pie" {...props}>{props.children}</div>;
  };
  return {
    ResponsiveContainer: R('ResponsiveContainer'), PieChart: R('PieChart'), Pie: PieMock, Cell: R('Cell'),
    BarChart: R('BarChart'), Bar: R('Bar'), XAxis: R('XAxis'), YAxis: R('YAxis'), Tooltip: R('Tooltip'),
    CartesianGrid: R('CartesianGrid'), Legend: R('Legend'), LineChart: R('LineChart'), Line: R('Line'),
    AreaChart: R('AreaChart'), Area: R('Area'), Brush: R('Brush'), ReferenceLine: R('ReferenceLine'),
    defs: R('defs'), linearGradient: R('linearGradient'), stop: R('stop'),
  };
});

import api from '../../../api';
import AdminDashboard from '../../../pages/admin/Dashboard';
import { ThemeProvider } from '../../../context/ThemeContext';

function renderDashboard() {
  return render(
    <MemoryRouter>
      <ThemeProvider>
        <AdminDashboard />
      </ThemeProvider>
    </MemoryRouter>
  );
}

const fullMockData = {
  total_members: 50,
  total_trainers: 5,
  total_equipment: 20,
  total_rooms: 10,
  equipment_status: [
    { status: 'operational', count: 15 },
    { status: 'under_repair', count: 3 },
    { status: 'out_of_service', count: 2 },
  ],
  maintenance_summary: { open: 4, resolved: 12 },
  booking_trend: [
    { month: 'Jan', count: 20 },
    { month: 'Feb', count: 25 },
  ],
  upcoming_bookings: [
    {
      room_name: 'Room A',
      booking_type: 'Personal Session',
      event_date: '2025-07-10',
      start_time: '09:00',
      end_time: '10:00',
      participant: 'Alice',
      trainer_name: 'Bob',
      status: 'scheduled',
    },
    {
      room_name: 'Room B',
      booking_type: 'Group Class',
      event_date: '2025-07-11',
      start_time: '14:00',
      end_time: '15:00',
      participant: 'Yoga Flow',
      trainer_name: 'Carol',
      status: 'scheduled',
    },
  ],
};

const emptyMockData = {
  total_members: 50,
  total_trainers: 5,
  total_equipment: 20,
  total_rooms: 10,
  equipment_status: [],
  maintenance_summary: { open: 0, resolved: 0 },
  booking_trend: [],
  upcoming_bookings: [],
};

describe('Admin Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    api.get.mockResolvedValue(fullMockData);
  });

  it('renders heading after load', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    });
  });

  it('renders stat card values', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('50')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('20')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
    });
  });

  it('handles API error gracefully', async () => {
    api.get.mockRejectedValueOnce(new Error('fail'));
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    });
  });

  it('renders equipment status pie chart', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Equipment Status')).toBeInTheDocument();
      expect(screen.getByText('Breakdown by condition')).toBeInTheDocument();
    });
  });

  it('renders bookings bar chart', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Bookings per Month')).toBeInTheDocument();
    });
  });

  it('hides charts when data is empty', async () => {
    api.get.mockResolvedValueOnce(emptyMockData);
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    });
    expect(screen.queryByText('Equipment Status')).not.toBeInTheDocument();
    expect(screen.queryByText('Bookings per Month')).not.toBeInTheDocument();
  });

  it('renders maintenance summary cards', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Open Issues')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();
      expect(screen.getByText('Resolved')).toBeInTheDocument();
      expect(screen.getByText('12')).toBeInTheDocument();
    });
  });

  it('renders upcoming bookings table', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Next Upcoming Bookings')).toBeInTheDocument();
      expect(screen.getAllByText('Alice').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Bob').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders booking type badges for both types', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getAllByText('Personal Session').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Group Class').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders formatted dates in bookings table', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getAllByText('Jul 10, 2025').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Jul 11, 2025').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders time ranges in bookings table', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getAllByText('09:00 – 10:00').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('14:00 – 15:00').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows empty bookings message', async () => {
    api.get.mockResolvedValueOnce(emptyMockData);
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('No upcoming bookings.')).toBeInTheDocument();
    });
  });

  it('shows dash for null event date', async () => {
    api.get.mockResolvedValueOnce({
      ...fullMockData,
      upcoming_bookings: [{
        room_name: 'R', booking_type: 'Personal Session', event_date: null,
        start_time: '09:00', end_time: '10:00', participant: 'X', trainer_name: 'Y', status: 'scheduled',
      }],
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
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    });
  });

  it('shows skeleton while loading', () => {
    api.get.mockReturnValue(new Promise(() => {}));
    const { container } = renderDashboard();
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders status badges in booking rows', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getAllByText('scheduled').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('handles null equipment_status and booking_trend (|| [] fallback)', async () => {
    api.get.mockResolvedValueOnce({
      ...fullMockData,
      equipment_status: null,
      booking_trend: null,
    });
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    });
    expect(screen.queryByText('Equipment Status')).not.toBeInTheDocument();
    expect(screen.queryByText('Bookings per Month')).not.toBeInTheDocument();
  });

  it('handles missing equipment_status and booking_trend keys', async () => {
    const { equipment_status: _equipment_status, booking_trend: _booking_trend, ...rest } = fullMockData;
    api.get.mockResolvedValueOnce(rest);
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    });
  });

  it('handles null maintenance_summary', async () => {
    api.get.mockResolvedValueOnce({ ...fullMockData, maintenance_summary: null });
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Open Issues')).toBeInTheDocument();
      expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(1);
    });
  });
});
