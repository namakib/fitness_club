import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../../api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  BarChart: ({ children }) => <div>{children}</div>,
  PieChart: ({ children }) => <div>{children}</div>,
  Bar: () => null,
  Pie: () => null,
  Cell: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
}));

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

const mockData = {
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
    api.get.mockResolvedValue(mockData);
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
    });
  });

  it('handles API error gracefully', async () => {
    api.get.mockRejectedValueOnce(new Error('fail'));
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    });
  });
});
