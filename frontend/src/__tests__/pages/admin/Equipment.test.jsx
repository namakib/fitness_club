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
import Equipment from '../../../pages/admin/Equipment';
import { ThemeProvider } from '../../../context/ThemeContext';

function renderEquipment() {
  return render(
    <MemoryRouter>
      <ThemeProvider>
        <Equipment />
      </ThemeProvider>
    </MemoryRouter>
  );
}

describe('Admin Equipment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockResolvedValue({
      equipment_list: [
        { equipment_id: 1, name: 'Treadmill', type: 'Cardio', status: 'operational', purchase_date: '2024-01-01', room_name: 'Gym Floor' },
      ],
      maintenance_logs: [],
    });
  });

  it('renders heading after data loads', async () => {
    renderEquipment();
    await waitFor(() => {
      expect(screen.getByText('Equipment & Maintenance')).toBeInTheDocument();
    });
  });

  it('renders log issue form section', async () => {
    renderEquipment();
    await waitFor(() => {
      expect(screen.getByText('Log Maintenance Issue')).toBeInTheDocument();
    });
  });

  it('handles API error gracefully', async () => {
    api.get.mockRejectedValueOnce(new Error('fail'));
    renderEquipment();
    await waitFor(() => {
      expect(screen.getByText('Equipment & Maintenance')).toBeInTheDocument();
    });
  });
});
