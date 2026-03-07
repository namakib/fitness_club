import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';

vi.mock('../../api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

vi.mock('../../toastUtil', () => ({
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));

import api from '../../api';
import { toastError, toastSuccess } from '../../toastUtil';
import RecordMetricForm from '../../components/RecordMetricForm';

describe('RecordMetricForm', () => {
  const onSaved = vi.fn();
  const onCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    api.post.mockResolvedValue({});
  });

  it('renders all metric fields', () => {
    render(<RecordMetricForm onSaved={onSaved} onCancel={onCancel} />);
    expect(screen.getByText('Weight (kg)')).toBeInTheDocument();
    expect(screen.getByText('Body Fat %')).toBeInTheDocument();
    expect(screen.getByText('Systolic (mmHg)')).toBeInTheDocument();
    expect(screen.getByText('Diastolic (mmHg)')).toBeInTheDocument();
    expect(screen.getByText('Heart Rate (bpm)')).toBeInTheDocument();
  });

  it('shows error if no fields are filled', async () => {
    render(<RecordMetricForm onSaved={onSaved} onCancel={onCancel} />);
    await act(async () => {
      fireEvent.click(screen.getByText('Record Metric'));
    });
    expect(toastError).toHaveBeenCalledWith('Please enter at least one metric.');
    expect(api.post).not.toHaveBeenCalled();
  });

  it('calls onCancel when Cancel button is clicked', () => {
    render(<RecordMetricForm onSaved={onSaved} onCancel={onCancel} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalled();
  });

  it('submits successfully with weight, calls toastSuccess, resets form, and calls onSaved', async () => {
    render(<RecordMetricForm onSaved={onSaved} onCancel={onCancel} />);

    const weightInput = screen.getByLabelText('Weight (kg)');
    fireEvent.change(weightInput, { target: { value: '75' } });

    await act(async () => {
      fireEvent.click(screen.getByText('Record Metric'));
    });

    expect(api.post).toHaveBeenCalledWith('/member/metrics', {
      weight: '75',
      body_fat_pct: null,
      blood_pressure: null,
      heart_rate: null,
    });
    expect(toastSuccess).toHaveBeenCalledWith('Metric recorded.');
    expect(onSaved).toHaveBeenCalled();
    expect(weightInput.value).toBe('');
  });

  it('sends blood pressure as concatenated systolic/diastolic', async () => {
    render(<RecordMetricForm onSaved={onSaved} onCancel={onCancel} />);

    const systolicInput = screen.getByLabelText('Systolic (mmHg)');
    const diastolicInput = screen.getByLabelText('Diastolic (mmHg)');
    fireEvent.change(systolicInput, { target: { value: '120' } });
    fireEvent.change(diastolicInput, { target: { value: '80' } });

    await act(async () => {
      fireEvent.click(screen.getByText('Record Metric'));
    });

    expect(api.post).toHaveBeenCalledWith('/member/metrics', expect.objectContaining({
      blood_pressure: '120/80',
    }));
  });

  it('sends partial blood pressure when only systolic is set', async () => {
    render(<RecordMetricForm onSaved={onSaved} onCancel={onCancel} />);

    const systolicInput = screen.getByLabelText('Systolic (mmHg)');
    fireEvent.change(systolicInput, { target: { value: '130' } });

    await act(async () => {
      fireEvent.click(screen.getByText('Record Metric'));
    });

    expect(api.post).toHaveBeenCalledWith('/member/metrics', expect.objectContaining({
      blood_pressure: '130/',
    }));
  });

  it('shows error toast when API call fails', async () => {
    api.post.mockRejectedValueOnce({ message: 'Network error', details: 'timeout' });

    render(<RecordMetricForm onSaved={onSaved} onCancel={onCancel} />);

    const weightInput = screen.getByLabelText('Weight (kg)');
    fireEvent.change(weightInput, { target: { value: '80' } });

    await act(async () => {
      fireEvent.click(screen.getByText('Record Metric'));
    });

    expect(toastError).toHaveBeenCalledWith('Network error', 'timeout');
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('shows "Saving..." during submit and re-enables after', async () => {
    let resolvePromise;
    api.post.mockReturnValueOnce(new Promise(r => { resolvePromise = r; }));

    render(<RecordMetricForm onSaved={onSaved} onCancel={onCancel} />);

    const weightInput = screen.getByLabelText('Weight (kg)');
    fireEvent.change(weightInput, { target: { value: '70' } });

    await act(async () => {
      fireEvent.click(screen.getByText('Record Metric'));
    });

    expect(screen.getByText('Saving...')).toBeInTheDocument();
    expect(screen.getByText('Saving...')).toBeDisabled();

    await act(async () => {
      resolvePromise({});
    });

    expect(screen.getByText('Record Metric')).toBeInTheDocument();
  });

  it('submits with only systolic (no diastolic)', async () => {
    render(<RecordMetricForm onSaved={onSaved} onCancel={onCancel} />);
    fireEvent.change(screen.getByLabelText('Systolic (mmHg)'), { target: { value: '120' } });

    await act(async () => {
      fireEvent.click(screen.getByText('Record Metric'));
    });

    expect(api.post).toHaveBeenCalledWith('/member/metrics', expect.objectContaining({
      blood_pressure: '120/',
    }));
  });

  it('submits all fields together', async () => {
    render(<RecordMetricForm onSaved={onSaved} onCancel={onCancel} />);

    fireEvent.change(screen.getByLabelText('Weight (kg)'), { target: { value: '85' } });
    fireEvent.change(screen.getByLabelText('Body Fat %'), { target: { value: '15' } });
    fireEvent.change(screen.getByLabelText('Systolic (mmHg)'), { target: { value: '120' } });
    fireEvent.change(screen.getByLabelText('Diastolic (mmHg)'), { target: { value: '80' } });
    fireEvent.change(screen.getByLabelText('Heart Rate (bpm)'), { target: { value: '72' } });

    await act(async () => {
      fireEvent.click(screen.getByText('Record Metric'));
    });

    expect(api.post).toHaveBeenCalledWith('/member/metrics', {
      weight: '85',
      body_fat_pct: '15',
      blood_pressure: '120/80',
      heart_rate: '72',
    });
  });

  it('submits with only systolic (diastolic empty — bp partial line 21)', async () => {
    render(<RecordMetricForm onSaved={onSaved} onCancel={onCancel} />);
    fireEvent.change(screen.getByLabelText('Systolic (mmHg)'), { target: { value: '120' } });

    await act(async () => {
      fireEvent.click(screen.getByText('Record Metric'));
    });

    expect(api.post).toHaveBeenCalledWith('/member/metrics', expect.objectContaining({
      blood_pressure: '120/',
    }));
  });

  it('submits with only diastolic (systolic empty — bp partial line 21)', async () => {
    render(<RecordMetricForm onSaved={onSaved} onCancel={onCancel} />);
    fireEvent.change(screen.getByLabelText('Diastolic (mmHg)'), { target: { value: '80' } });

    await act(async () => {
      fireEvent.click(screen.getByText('Record Metric'));
    });

    expect(api.post).toHaveBeenCalledWith('/member/metrics', expect.objectContaining({
      blood_pressure: '/80',
    }));
  });

  it('submits with no bp fields (bp null — line 21 null branch)', async () => {
    render(<RecordMetricForm onSaved={onSaved} onCancel={onCancel} />);
    fireEvent.change(screen.getByLabelText('Weight (kg)'), { target: { value: '70' } });

    await act(async () => {
      fireEvent.click(screen.getByText('Record Metric'));
    });

    expect(api.post).toHaveBeenCalledWith('/member/metrics', expect.objectContaining({
      blood_pressure: null,
    }));
  });
});
