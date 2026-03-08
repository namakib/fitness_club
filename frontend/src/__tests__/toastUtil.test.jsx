import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import toast from 'react-hot-toast';
import { toastError, toastSuccess } from '../toastUtil';

vi.mock('react-hot-toast', () => ({
  default: { error: vi.fn(), success: vi.fn() },
}));

describe('toastUtil', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('toastError with string shows error toast', () => {
    toastError('Something went wrong');
    expect(toast.error).toHaveBeenCalledWith('Something went wrong', expect.objectContaining({ duration: expect.any(Number) }));
  });

  it('toastError with details array renders jsx function', () => {
    toastError('err', ['Name is required', 'Email is invalid']);
    expect(toast.error).toHaveBeenCalledWith(expect.any(Function), expect.objectContaining({ duration: expect.any(Number) }));
  });

  it('toastError with single-item details renders without bullet', () => {
    toastError('err', ['One error']);
    const renderFn = toast.error.mock.calls[0][0];
    const { container } = render(renderFn());
    const items = container.querySelectorAll('.space-y-1 > div');
    expect(items).toHaveLength(1);
    expect(items[0].textContent).toBe('One error');
  });

  it('toastError with multiple details renders bullets on all but last', () => {
    toastError('err', ['Error A', 'Error B', 'Error C']);
    const renderFn = toast.error.mock.calls[0][0];
    const { container } = render(renderFn());
    const items = container.querySelectorAll('.space-y-1 > div');
    expect(items).toHaveLength(3);
    expect(items[0].textContent).toBe('• Error A');
    expect(items[1].textContent).toBe('• Error B');
    expect(items[2].textContent).toBe('Error C');
  });

  it('toastError without details uses message directly', () => {
    toastError('Simple error');
    expect(toast.error).toHaveBeenCalledWith('Simple error', expect.any(Object));
  });

  it('toastError with non-string msgOrJsx uses empty string for duration calc', () => {
    const jsx = <span>Error!</span>;
    toastError(jsx);
    expect(toast.error).toHaveBeenCalledWith(jsx, expect.objectContaining({ duration: 2500 }));
  });

  it('toastSuccess calls toast.success', () => {
    toastSuccess('Profile saved!');
    expect(toast.success).toHaveBeenCalledWith('Profile saved!', expect.objectContaining({ duration: expect.any(Number) }));
  });

  it('duration is clamped between 2500 and 10000', () => {
    toastSuccess('Hi');
    const duration = toast.success.mock.calls[0][1].duration;
    expect(duration).toBeGreaterThanOrEqual(2500);
    expect(duration).toBeLessThanOrEqual(10000);
  });

  it('long string duration is capped at 10000', () => {
    toastSuccess('x'.repeat(500));
    expect(toast.success.mock.calls[0][1].duration).toBe(10000);
  });

  it('calcDuration uses min duration for non-string error message', () => {
    toastError(<div>JSX content</div>);
    const duration = toast.error.mock.calls[0][1].duration;
    expect(duration).toBe(2500);
  });

  it('calcDuration uses 60 fallback for non-string argument via toastSuccess', () => {
    toastSuccess(12345);
    const duration = toast.success.mock.calls[0][1].duration;
    expect(duration).toBe(3000);
  });
});
