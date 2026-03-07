import { describe, it, expect, vi, beforeEach } from 'vitest';
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

  it('toastError with single-item details array still renders jsx', () => {
    toastError('err', ['One error']);
    expect(toast.error).toHaveBeenCalledWith(expect.any(Function), expect.any(Object));
  });

  it('toastError without details uses message directly', () => {
    toastError('Simple error');
    expect(toast.error).toHaveBeenCalledWith('Simple error', expect.any(Object));
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
});
