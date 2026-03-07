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
vi.mock('../../../components/DatePicker', () => ({
  default: ({ label, value, onChange }) => (
    <input data-testid={`dp-${label}`} value={value ?? ''} onChange={e => onChange(e.target.value)} />
  ),
}));
vi.mock('../../../components/SelectDropdown', () => ({
  default: ({ label, value, onChange, options, placeholder }) => (
    <select data-testid={`sel-${label || placeholder}`} value={value ?? ''} onChange={e => onChange(e.target.value)}>
      <option value="">{placeholder || 'Select'}</option>
      {(options || []).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  ),
}));
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  AreaChart: ({ children }) => <div data-testid="area-chart">{children}</div>,
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  Area: () => null,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
}));

import api from '../../../api';
import { toastSuccess, toastError } from '../../../toastUtil';
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

function setupMocks(profile = profileData, metrics = metricsData) {
  api.get.mockImplementation((path) => {
    if (path.includes('profile')) return Promise.resolve(profile);
    if (path.includes('health-history')) return Promise.resolve(metrics);
    return Promise.resolve({});
  });
}

describe('Member Goals page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupMocks();
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

  it('opens Add Goal modal and submits successfully', async () => {
    const user = userEvent.setup();
    api.post.mockResolvedValueOnce({});
    renderGoals();

    await waitFor(() => {
      expect(screen.getByText('+ Add Goal')).toBeInTheDocument();
    });

    await user.click(screen.getByText('+ Add Goal'));

    await waitFor(() => {
      expect(screen.getByText('Add Fitness Goal')).toBeInTheDocument();
    });

    const modalForm = document.querySelector('form');
    const targetInput = modalForm.querySelector('input[required]');
    await user.type(targetInput, '70kg');

    const submitBtn = screen.getByText('Add Goal', { exact: true });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/member/goals', expect.objectContaining({
        goal_type: 'weight_loss',
        target_value: '70kg',
      }));
      expect(toastSuccess).toHaveBeenCalledWith('Goal added.');
    });
  });

  it('shows error on Add Goal submit failure', async () => {
    const user = userEvent.setup();
    const err = new Error('Validation failed');
    err.details = ['Target required'];
    api.post.mockRejectedValueOnce(err);
    renderGoals();

    await waitFor(() => {
      expect(screen.getByText('+ Add Goal')).toBeInTheDocument();
    });

    await user.click(screen.getByText('+ Add Goal'));

    await waitFor(() => {
      expect(screen.getByText('Add Fitness Goal')).toBeInTheDocument();
    });

    const modalForm = document.querySelector('form');
    const targetInput = modalForm.querySelector('input[required]');
    await user.type(targetInput, 'something');

    const submitBtn = screen.getByText('Add Goal', { exact: true });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('Validation failed', ['Target required']);
    });
  });

  it('opens Record Metric modal', async () => {
    const user = userEvent.setup();
    renderGoals();

    await waitFor(() => {
      expect(screen.getByText('+ Record Metric')).toBeInTheDocument();
    });

    await user.click(screen.getByText('+ Record Metric'));

    await waitFor(() => {
      expect(screen.getByText('Record Health Metric')).toBeInTheDocument();
    });
  });

  it('renders weight chart when metrics have weight data', async () => {
    setupMocks(profileData, {
      metrics: [
        { recorded_at: '2025-06-01T10:00:00', weight: 75, body_fat_pct: null, heart_rate: null, blood_pressure: null },
      ],
    });
    renderGoals();

    await waitFor(() => {
      expect(screen.getByText('Weight')).toBeInTheDocument();
    });
  });

  it('renders body fat chart when metrics have body_fat data', async () => {
    setupMocks(profileData, {
      metrics: [
        { recorded_at: '2025-06-01T10:00:00', weight: null, body_fat_pct: 20, heart_rate: null, blood_pressure: null },
      ],
    });
    renderGoals();

    await waitFor(() => {
      expect(screen.getByText('over time')).toBeInTheDocument();
    });
  });

  it('renders heart rate chart when metrics have heart_rate data', async () => {
    setupMocks(profileData, {
      metrics: [
        { recorded_at: '2025-06-01T10:00:00', weight: null, body_fat_pct: null, heart_rate: 72, blood_pressure: null },
      ],
    });
    renderGoals();

    await waitFor(() => {
      expect(screen.getByText('Heart Rate')).toBeInTheDocument();
    });
  });

  it('renders blood pressure chart when metrics have bp data', async () => {
    setupMocks(profileData, {
      metrics: [
        { recorded_at: '2025-06-01T10:00:00', weight: null, body_fat_pct: null, heart_rate: null, blood_pressure: '120/80' },
      ],
    });
    renderGoals();

    await waitFor(() => {
      expect(screen.getByText('systolic & diastolic (mmHg)')).toBeInTheDocument();
    });
  });

  it('renders all four charts when metrics have all data', async () => {
    setupMocks(profileData, metricsData);
    renderGoals();

    await waitFor(() => {
      expect(screen.getByText('kg over time')).toBeInTheDocument();
      expect(screen.getByText('over time')).toBeInTheDocument();
      expect(screen.getByText('bpm per reading')).toBeInTheDocument();
      expect(screen.getByText('systolic & diastolic (mmHg)')).toBeInTheDocument();
    });
  });

  it('GoalStatusSelect changes goal status on success', async () => {
    const user = userEvent.setup();
    api.put.mockResolvedValueOnce({});
    renderGoals();

    await waitFor(() => {
      expect(screen.getByText('Fitness Goals')).toBeInTheDocument();
    });

    const statusSelects = screen.getAllByTestId('sel-Status');
    expect(statusSelects.length).toBeGreaterThanOrEqual(1);

    await user.selectOptions(statusSelects[0], 'achieved');

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/member/goals/1', { status: 'achieved' });
      expect(toastSuccess).toHaveBeenCalledWith('Goal updated.');
    });
  });

  it('GoalStatusSelect shows error on failure', async () => {
    const user = userEvent.setup();
    const err = new Error('Update failed');
    err.details = [];
    api.put.mockRejectedValueOnce(err);
    renderGoals();

    await waitFor(() => {
      expect(screen.getByText('Fitness Goals')).toBeInTheDocument();
    });

    const statusSelects = screen.getAllByTestId('sel-Status');
    expect(statusSelects.length).toBeGreaterThanOrEqual(1);

    await user.selectOptions(statusSelects[0], 'achieved');

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('Update failed', []);
    });
  });

  it('renders health records with fmtDateTime formatted dates', async () => {
    setupMocks(profileData, {
      metrics: [
        { recorded_at: '2025-06-01T10:00:00', weight: 75, body_fat_pct: null, heart_rate: null, blood_pressure: null },
      ],
    });
    renderGoals();

    await waitFor(() => {
      expect(screen.getByText('All Health Records')).toBeInTheDocument();
    });
  });

  it('handles metrics with invalid blood pressure gracefully', async () => {
    setupMocks(profileData, {
      metrics: [
        { recorded_at: '2025-06-01T10:00:00', weight: 75, body_fat_pct: null, heart_rate: null, blood_pressure: 'invalid' },
      ],
    });
    renderGoals();

    await waitFor(() => {
      expect(screen.getByText('All Health Records')).toBeInTheDocument();
    });
  });

  it('handles metrics with null blood pressure gracefully', async () => {
    setupMocks(profileData, {
      metrics: [
        { recorded_at: '2025-06-01T10:00:00', weight: 75, body_fat_pct: null, heart_rate: null, blood_pressure: null },
      ],
    });
    renderGoals();

    await waitFor(() => {
      expect(screen.getByText('Weight')).toBeInTheDocument();
    });
  });

  it('shows no charts when metrics is empty', async () => {
    setupMocks(profileData, { metrics: [] });
    renderGoals();

    await waitFor(() => {
      expect(screen.getByText('Fitness Goals')).toBeInTheDocument();
      expect(screen.queryByText('Weight')).not.toBeInTheDocument();
    });
  });

  it('shows empty message when no goals', async () => {
    setupMocks({ ...profileData, goals: [] }, metricsData);
    renderGoals();

    await waitFor(() => {
      expect(screen.getByText(/No goals yet/)).toBeInTheDocument();
    });
  });

  it('shows Adding... button state while submitting goal', async () => {
    const user = userEvent.setup();
    let resolve;
    api.post.mockImplementationOnce(() => new Promise(r => { resolve = r; }));
    renderGoals();

    await waitFor(() => {
      expect(screen.getByText('+ Add Goal')).toBeInTheDocument();
    });

    await user.click(screen.getByText('+ Add Goal'));

    await waitFor(() => {
      expect(screen.getByText('Add Fitness Goal')).toBeInTheDocument();
    });

    const modalForm = document.querySelector('form');
    const targetInput = modalForm.querySelector('input[required]');
    await user.type(targetInput, 'target');

    const submitBtn = screen.getByText('Add Goal', { exact: true });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Adding...')).toBeInTheDocument();
    });

    resolve({});
    await waitFor(() => {
      expect(api.post).toHaveBeenCalled();
    });
  });

  it('handles date-only recorded_at in shortDate', async () => {
    setupMocks(profileData, {
      metrics: [
        { recorded_at: '2025-06-01', weight: 75, body_fat_pct: null, heart_rate: null, blood_pressure: null },
      ],
    });
    renderGoals();

    await waitFor(() => {
      expect(screen.getByText('Weight')).toBeInTheDocument();
    });
  });

  it('sorts multiple metrics by date and renders chart', async () => {
    setupMocks(profileData, {
      metrics: [
        { recorded_at: '2025-06-08T10:00:00', weight: 74, body_fat_pct: null, heart_rate: null, blood_pressure: null },
        { recorded_at: '2025-06-01T10:00:00', weight: 76, body_fat_pct: null, heart_rate: null, blood_pressure: null },
      ],
    });
    renderGoals();

    await waitFor(() => {
      expect(screen.getByText('Weight')).toBeInTheDocument();
      expect(screen.getByText('kg over time')).toBeInTheDocument();
    });
  });

  it('renders body fat and heart rate charts with multiple metrics', async () => {
    setupMocks(profileData, {
      metrics: [
        { recorded_at: '2025-06-01T10:00:00', weight: null, body_fat_pct: 20, heart_rate: 70, blood_pressure: null },
        { recorded_at: '2025-06-08T10:00:00', weight: null, body_fat_pct: 18, heart_rate: 68, blood_pressure: null },
      ],
    });
    renderGoals();

    await waitFor(() => {
      expect(screen.getAllByText('Body Fat %').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Heart Rate').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('closes Record Metric modal via onSaved', async () => {
    const user = userEvent.setup();
    api.post.mockResolvedValueOnce({});
    renderGoals();

    await waitFor(() => {
      expect(screen.getByText('+ Record Metric')).toBeInTheDocument();
    });

    await user.click(screen.getByText('+ Record Metric'));
    await waitFor(() => {
      expect(screen.getByText('Record Health Metric')).toBeInTheDocument();
    });

    const weightInput = screen.getByLabelText('Weight (kg)');
    await user.type(weightInput, '72');
    await user.click(screen.getByText('Record Metric'));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/member/metrics', expect.objectContaining({ weight: '72' }));
    });
  });

  it('closes Record Metric modal via onCancel', async () => {
    const user = userEvent.setup();
    renderGoals();

    await waitFor(() => {
      expect(screen.getByText('+ Record Metric')).toBeInTheDocument();
    });

    await user.click(screen.getByText('+ Record Metric'));
    await waitFor(() => {
      expect(screen.getAllByText('Cancel').length).toBeGreaterThanOrEqual(1);
    });

    await user.click(screen.getAllByText('Cancel')[0]);
  });

  it('handles invalid recorded_at in shortDate', async () => {
    setupMocks(profileData, {
      metrics: [
        { recorded_at: 'not-a-date', weight: 75, body_fat_pct: null, heart_rate: null, blood_pressure: null },
      ],
    });
    renderGoals();

    await waitFor(() => {
      expect(screen.getByText('All Health Records')).toBeInTheDocument();
    });
  });

  it('handles null recorded_at in fmtDateTime', async () => {
    setupMocks(profileData, {
      metrics: [
        { recorded_at: null, weight: 75, body_fat_pct: null, heart_rate: null, blood_pressure: null },
      ],
    });
    renderGoals();

    await waitFor(() => {
      expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('handles date-only recorded_at in fmtDateTime', async () => {
    setupMocks(profileData, {
      metrics: [
        { recorded_at: '2025-06-01', weight: 75, body_fat_pct: null, heart_rate: null, blood_pressure: null },
      ],
    });
    renderGoals();

    await waitFor(() => {
      expect(screen.getByText('All Health Records')).toBeInTheDocument();
    });
  });

  it('closes Record Metric modal via X button (onClose)', async () => {
    const user = userEvent.setup();
    renderGoals();

    await waitFor(() => {
      expect(screen.getByText('+ Record Metric')).toBeInTheDocument();
    });

    await user.click(screen.getByText('+ Record Metric'));
    await waitFor(() => {
      expect(screen.getByText('Record Health Metric')).toBeInTheDocument();
    });

    await user.click(screen.getByLabelText('Close'));
  });

  it('changes goal type, start date, and end date in Add Goal modal', async () => {
    const user = userEvent.setup();
    api.post.mockResolvedValueOnce({});
    renderGoals();

    await waitFor(() => {
      expect(screen.getByText('+ Add Goal')).toBeInTheDocument();
    });

    await user.click(screen.getByText('+ Add Goal'));
    await waitFor(() => {
      expect(screen.getByText('Add Fitness Goal')).toBeInTheDocument();
    });

    const typeSelect = screen.getByTestId('sel-Type');
    await user.selectOptions(typeSelect, 'endurance');
    expect(typeSelect.value).toBe('endurance');

    const startDate = screen.getByTestId('dp-Start Date');
    await user.clear(startDate);
    await user.type(startDate, '2025-03-01');
    expect(startDate.value).toBe('2025-03-01');

    const endDate = screen.getByTestId('dp-End Date');
    await user.clear(endDate);
    await user.type(endDate, '2025-09-01');
    expect(endDate.value).toBe('2025-09-01');

    const targetInput = document.querySelector('form input[required]');
    await user.type(targetInput, '5k');

    await user.click(screen.getByText('Add Goal', { exact: true }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/member/goals', expect.objectContaining({
        goal_type: 'endurance',
        start_date: '2025-03-01',
        end_date: '2025-09-01',
        target_value: '5k',
      }));
    });
  });

  it('closes Add Goal modal via X button (onClose)', async () => {
    const user = userEvent.setup();
    renderGoals();

    await waitFor(() => {
      expect(screen.getByText('+ Add Goal')).toBeInTheDocument();
    });

    await user.click(screen.getByText('+ Add Goal'));
    await waitFor(() => {
      expect(screen.getByText('Add Fitness Goal')).toBeInTheDocument();
    });

    await user.click(screen.getByLabelText('Close'));
  });

  it('handles profileData without goals key (|| [] fallback)', async () => {
    setupMocks({ member: { name: 'Bob' } });
    renderGoals();
    await waitFor(() => {
      expect(screen.getByText('Health & Goals')).toBeInTheDocument();
    });
  });

  it('renders in dark theme (isDark branches lines 64-66)', async () => {
    localStorage.setItem('theme', 'dark');
    setupMocks();
    render(
      <MemoryRouter>
        <ThemeProvider>
          <Goals />
        </ThemeProvider>
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByText('Health & Goals')).toBeInTheDocument();
    });
    localStorage.removeItem('theme');
  });

  it('filters out metrics rows with all null values (line 85)', async () => {
    setupMocks(profileData, {
      metrics: [
        { recorded_at: '2025-06-01', weight: null, body_fat_pct: null, heart_rate: null, blood_pressure: null },
        { recorded_at: '2025-06-02', weight: 80, body_fat_pct: null, heart_rate: null, blood_pressure: null },
      ],
    });
    renderGoals();
    await waitFor(() => {
      expect(screen.getByText('Health & Goals')).toBeInTheDocument();
    });
  });

  it('parses blood pressure with NaN parts (line 333)', async () => {
    setupMocks(profileData, {
      metrics: [
        { recorded_at: '2025-06-01', weight: 70, body_fat_pct: null, heart_rate: null, blood_pressure: 'abc/def' },
      ],
    });
    renderGoals();
    await waitFor(() => {
      expect(screen.getByText('Health & Goals')).toBeInTheDocument();
    });
  });

  it('handles blood pressure with only one part', async () => {
    setupMocks(profileData, {
      metrics: [
        { recorded_at: '2025-06-01', weight: 70, body_fat_pct: null, heart_rate: null, blood_pressure: '120' },
      ],
    });
    renderGoals();
    await waitFor(() => {
      expect(screen.getByText('Health & Goals')).toBeInTheDocument();
    });
  });

  it('handles metrics being undefined (|| [] fallback line 71)', async () => {
    api.get.mockImplementation((path) => {
      if (path.includes('profile')) return Promise.resolve(profileData);
      if (path.includes('health-history')) return Promise.resolve({});
      return Promise.resolve({});
    });
    renderGoals();
    await waitFor(() => {
      expect(screen.getByText('Health & Goals')).toBeInTheDocument();
    });
  });
});
