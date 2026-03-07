import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';

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
});
