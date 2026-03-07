import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import Modal from '../../components/Modal';

describe('Modal', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders nothing when open=false', () => {
    const { container } = render(<Modal open={false} onClose={vi.fn()} title="Test"><p>Body</p></Modal>);
    expect(container.textContent).toBe('');
  });

  it('renders title and children when open=true', async () => {
    render(<Modal open={true} onClose={vi.fn()} title="My Modal"><p>Modal body</p></Modal>);
    await act(() => vi.advanceTimersByTime(100));
    expect(screen.getByText('My Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal body')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn();
    render(<Modal open={true} onClose={onClose} title="Test"><p>Body</p></Modal>);
    await act(() => vi.advanceTimersByTime(100));
    fireEvent.click(screen.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when overlay is clicked', async () => {
    const onClose = vi.fn();
    render(<Modal open={true} onClose={onClose} title="Test"><p>Body</p></Modal>);
    await act(() => vi.advanceTimersByTime(100));
    const overlay = document.querySelector('[aria-hidden]');
    fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose on Escape key', async () => {
    const onClose = vi.fn();
    render(<Modal open={true} onClose={onClose} title="Test"><p>Body</p></Modal>);
    await act(() => vi.advanceTimersByTime(100));
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('locks body scroll when open', async () => {
    render(<Modal open={true} onClose={vi.fn()} title="Test"><p>Body</p></Modal>);
    await act(() => vi.advanceTimersByTime(100));
    expect(document.body.style.overflow).toBe('hidden');
  });
});
