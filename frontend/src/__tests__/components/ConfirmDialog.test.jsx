import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import ConfirmDialog from '../../components/ConfirmDialog';

describe('ConfirmDialog', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('renders message when open', async () => {
    render(
      <ConfirmDialog open onClose={vi.fn()} message="Are you sure?" onConfirm={vi.fn()} />
    );
    await act(async () => { vi.advanceTimersByTime(100); });
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
  });

  it('renders confirm and cancel buttons', async () => {
    render(
      <ConfirmDialog open onClose={vi.fn()} message="Delete?" onConfirm={vi.fn()} confirmLabel="Delete" cancelLabel="Keep" />
    );
    await act(async () => { vi.advanceTimersByTime(100); });
    expect(screen.getByText('Delete')).toBeInTheDocument();
    expect(screen.getByText('Keep')).toBeInTheDocument();
  });

  it('calls onConfirm and then onClose on confirm click', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    render(
      <ConfirmDialog open onClose={onClose} onConfirm={onConfirm} message="Delete?" confirmLabel="Yes" />
    );
    await act(async () => { vi.advanceTimersByTime(100); });
    await act(async () => { fireEvent.click(screen.getByText('Yes')); });
    expect(onConfirm).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('stays open if onConfirm rejects', async () => {
    const onConfirm = vi.fn().mockRejectedValue(new Error('fail'));
    const onClose = vi.fn();
    render(
      <ConfirmDialog open onClose={onClose} onConfirm={onConfirm} message="Delete?" confirmLabel="Yes" />
    );
    await act(async () => { vi.advanceTimersByTime(100); });
    await act(async () => { fireEvent.click(screen.getByText('Yes')); });
    expect(onConfirm).toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('calls onClose on cancel click', async () => {
    const onClose = vi.fn();
    render(
      <ConfirmDialog open onClose={onClose} onConfirm={vi.fn()} message="Sure?" />
    );
    await act(async () => { vi.advanceTimersByTime(100); });
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();
  });

  it('shows loading text when loading', async () => {
    render(
      <ConfirmDialog open onClose={vi.fn()} onConfirm={vi.fn()} loading confirmLabel="Yes" />
    );
    await act(async () => { vi.advanceTimersByTime(100); });
    expect(screen.getByText('Please wait...')).toBeInTheDocument();
  });
});
