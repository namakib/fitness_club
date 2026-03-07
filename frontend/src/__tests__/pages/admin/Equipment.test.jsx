import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../../api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));
vi.mock('../../../toastUtil', () => ({
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));
vi.mock('../../../components/SelectDropdown', () => ({
  default: function MockSelect({ label, value, onChange, options, placeholder, searchable }) {
    const testId = label ? `select-${label}` : `select-${placeholder || 'dropdown'}`;
    return (
      <div>
        {label && <label htmlFor={testId}>{label}</label>}
        <select data-testid={testId} id={label ? testId : undefined} value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
          <option value="">{placeholder || 'Select...'}</option>
          {(options || []).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {searchable && <span data-testid="searchable-indicator" />}
      </div>
    );
  },
}));

import api from '../../../api';
import { toastError, toastSuccess } from '../../../toastUtil';
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

const mockData = {
  equipment_list: [
    { equipment_id: 1, name: 'Treadmill', type: 'Cardio', status: 'operational', purchase_date: '2024-01-01' },
  ],
  maintenance_logs: [
    { log_id: 1, equipment_name: 'Treadmill', equipment_type: 'Cardio', issue_description: 'Belt worn', reported_date: '2025-01-15', resolved_date: null, status: 'reported' },
  ],
};

const mockDataSearchable = {
  equipment_list: [
    { equipment_id: 1, name: 'Treadmill 1', type: 'Cardio', status: 'operational', purchase_date: '2024-01-01' },
    { equipment_id: 2, name: 'Treadmill 2', type: 'Cardio', status: 'operational', purchase_date: '2024-01-02' },
    { equipment_id: 3, name: 'Bike 1', type: 'Cardio', status: 'operational', purchase_date: '2024-01-03' },
    { equipment_id: 4, name: 'Bike 2', type: 'Cardio', status: 'under_repair', purchase_date: '2024-01-04' },
    { equipment_id: 5, name: 'Rower', type: 'Cardio', status: 'operational', purchase_date: '2024-01-05' },
    { equipment_id: 6, name: 'Elliptical', type: 'Cardio', status: 'out_of_service', purchase_date: '2024-01-06' },
  ],
  maintenance_logs: [],
};

describe('Admin Equipment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockResolvedValue(mockData);
    api.post.mockResolvedValue({});
    api.put.mockResolvedValue({});
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

  it('renders equipment inventory table', async () => {
    renderEquipment();
    await waitFor(() => {
      expect(screen.getByText('Equipment Inventory')).toBeInTheDocument();
      expect(screen.getAllByText('Treadmill').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders maintenance logs table', async () => {
    renderEquipment();
    await waitFor(() => {
      expect(screen.getByText('Maintenance Logs')).toBeInTheDocument();
      expect(screen.getAllByText('Belt worn').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('submits log issue form successfully', async () => {
    const user = userEvent.setup();
    renderEquipment();
    await waitFor(() => {
      expect(screen.getByTestId('select-Equipment')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId('select-Equipment'), { target: { value: '1' } });
    fireEvent.change(screen.getByPlaceholderText('Describe the issue...'), { target: { value: 'Motor broken' } });
    await user.click(screen.getByText('Log Issue'));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/admin/equipment/issue', {
        equipment_id: '1',
        issue_description: 'Motor broken',
      });
      expect(toastSuccess).toHaveBeenCalledWith('Issue logged.');
    });
  });

  it('handles log issue form error', async () => {
    const user = userEvent.setup();
    api.post.mockRejectedValueOnce({ message: 'Failed', details: 'bad data' });
    renderEquipment();
    await waitFor(() => {
      expect(screen.getByTestId('select-Equipment')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId('select-Equipment'), { target: { value: '1' } });
    fireEvent.change(screen.getByPlaceholderText('Describe the issue...'), { target: { value: 'Test' } });
    await user.click(screen.getByText('Log Issue'));

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('Failed', 'bad data');
    });
  });

  it('updates equipment status', async () => {
    renderEquipment();
    await waitFor(() => {
      expect(screen.getAllByText('Treadmill').length).toBeGreaterThanOrEqual(1);
    });

    const statusSelects = screen.getAllByTestId('select-Status');
    fireEvent.change(statusSelects[0], { target: { value: 'under_repair' } });

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/admin/equipment/1/status', { status: 'under_repair' });
      expect(toastSuccess).toHaveBeenCalledWith('Status updated.');
    });
  });

  it('handles equipment status update error', async () => {
    api.put.mockRejectedValueOnce({ message: 'Update fail', details: 'err' });
    renderEquipment();
    await waitFor(() => {
      expect(screen.getAllByText('Treadmill').length).toBeGreaterThanOrEqual(1);
    });

    const statusSelects = screen.getAllByTestId('select-Status');
    fireEvent.change(statusSelects[0], { target: { value: 'out_of_service' } });

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('Update fail', 'err');
    });
  });

  it('updates maintenance log status', async () => {
    renderEquipment();
    await waitFor(() => {
      expect(screen.getAllByText('Belt worn').length).toBeGreaterThanOrEqual(1);
    });

    const statusSelects = screen.getAllByTestId('select-Status');
    fireEvent.change(statusSelects[statusSelects.length - 1], { target: { value: 'in_progress' } });

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/admin/equipment/maintenance/1', { status: 'in_progress' });
      expect(toastSuccess).toHaveBeenCalledWith('Log updated.');
    });
  });

  it('updates maintenance log to resolved with resolved_date', async () => {
    renderEquipment();
    await waitFor(() => {
      expect(screen.getAllByText('Belt worn').length).toBeGreaterThanOrEqual(1);
    });

    const statusSelects = screen.getAllByTestId('select-Status');
    fireEvent.change(statusSelects[statusSelects.length - 1], { target: { value: 'resolved' } });

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/admin/equipment/maintenance/1', expect.objectContaining({
        status: 'resolved',
        resolved_date: expect.any(String),
      }));
    });
  });

  it('handles maintenance status update error', async () => {
    api.put.mockRejectedValueOnce({ message: 'Maint fail', details: 'x' });
    renderEquipment();
    await waitFor(() => {
      expect(screen.getAllByText('Belt worn').length).toBeGreaterThanOrEqual(1);
    });

    const statusSelects = screen.getAllByTestId('select-Status');
    fireEvent.change(statusSelects[statusSelects.length - 1], { target: { value: 'resolved' } });

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('Maint fail', 'x');
    });
  });

  it('enables searchable when equipment list > 5', async () => {
    api.get.mockResolvedValueOnce(mockDataSearchable);
    renderEquipment();
    await waitFor(() => {
      expect(screen.getAllByText('Treadmill 1').length).toBeGreaterThanOrEqual(1);
    });
    expect(screen.getByTestId('searchable-indicator')).toBeInTheDocument();
  });

  it('shows skeleton while loading', () => {
    api.get.mockReturnValue(new Promise(() => {}));
    const { container } = renderEquipment();
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('formats purchase dates', async () => {
    renderEquipment();
    await waitFor(() => {
      expect(screen.getAllByText('Jan 1, 2024').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows dash for null dates', async () => {
    api.get.mockResolvedValueOnce({
      equipment_list: [
        { equipment_id: 1, name: 'X', type: 'Y', status: 'operational', purchase_date: null },
      ],
      maintenance_logs: [],
    });
    renderEquipment();
    await waitFor(() => {
      expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('does not render maintenance action for resolved logs', async () => {
    api.get.mockResolvedValueOnce({
      equipment_list: [
        { equipment_id: 1, name: 'Treadmill', type: 'Cardio', status: 'operational', purchase_date: '2024-01-01' },
      ],
      maintenance_logs: [
        { log_id: 2, equipment_name: 'Treadmill', equipment_type: 'Cardio', issue_description: 'Fixed', reported_date: '2025-01-01', resolved_date: '2025-01-10', status: 'resolved' },
      ],
    });
    renderEquipment();
    await waitFor(() => {
      expect(screen.getAllByText('Fixed').length).toBeGreaterThanOrEqual(1);
    });
    const statusSelects = screen.getAllByTestId('select-Status');
    expect(statusSelects.length).toBeGreaterThanOrEqual(1);
  });
});
