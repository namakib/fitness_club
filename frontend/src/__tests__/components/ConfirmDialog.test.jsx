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

  it('renders default title "Confirm"', async () => {
    render(
      <ConfirmDialog open onClose={vi.fn()} onConfirm={vi.fn()} />
    );
    await act(async () => { vi.advanceTimersByTime(100); });
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Confirm');
  });

  it('renders custom title', async () => {
    render(
      <ConfirmDialog open onClose={vi.fn()} onConfirm={vi.fn()} title="Delete Item?" />
    );
    await act(async () => { vi.advanceTimersByTime(100); });
    expect(screen.getByText('Delete Item?')).toBeInTheDocument();
  });

  it('does not render message when not provided', async () => {
    render(
      <ConfirmDialog open onClose={vi.fn()} onConfirm={vi.fn()} />
    );
    await act(async () => { vi.advanceTimersByTime(100); });
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Confirm');
  });

  it('uses danger variant styling', async () => {
    render(
      <ConfirmDialog open onClose={vi.fn()} onConfirm={vi.fn()} variant="danger" confirmLabel="Delete" message="This is destructive" />
    );
    await act(async () => { vi.advanceTimersByTime(100); });
    expect(screen.getByText('Delete')).toBeInTheDocument();
    expect(screen.getByText('This is destructive')).toBeInTheDocument();
  });

  it('uses default variant styling', async () => {
    render(
      <ConfirmDialog open onClose={vi.fn()} onConfirm={vi.fn()} variant="default" confirmLabel="OK" />
    );
    await act(async () => { vi.advanceTimersByTime(100); });
    expect(screen.getByText('OK')).toBeInTheDocument();
  });

  it('disables buttons when loading', async () => {
    render(
      <ConfirmDialog open onClose={vi.fn()} onConfirm={vi.fn()} loading />
    );
    await act(async () => { vi.advanceTimersByTime(100); });
    const buttons = screen.getAllByRole('button');
    const cancelBtn = buttons.find(b => b.textContent === 'Cancel');
    const confirmBtn = buttons.find(b => b.textContent === 'Please wait...');
    expect(cancelBtn).toBeDisabled();
    expect(confirmBtn).toBeDisabled();
  });

  it('calls onClose directly when onConfirm is not a function', async () => {
    const onClose = vi.fn();
    render(
      <ConfirmDialog open onClose={onClose} onConfirm={null} confirmLabel="OK" />
    );
    await act(async () => { vi.advanceTimersByTime(100); });
    await act(async () => { fireEvent.click(screen.getByText('OK')); });
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when onConfirm is undefined', async () => {
    const onClose = vi.fn();
    render(
      <ConfirmDialog open onClose={onClose} confirmLabel="OK" />
    );
    await act(async () => { vi.advanceTimersByTime(100); });
    await act(async () => { fireEvent.click(screen.getByText('OK')); });
    expect(onClose).toHaveBeenCalled();
  });

  it('renders nothing when not open', () => {
    const { container: _container } = render(
      <ConfirmDialog open={false} onClose={vi.fn()} onConfirm={vi.fn()} message="Hidden" />
    );
    expect(screen.queryByText('Hidden')).not.toBeInTheDocument();
  });
});
