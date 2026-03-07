import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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

  it('unmounts after close animation completes (200ms)', async () => {
    const onClose = vi.fn();
    const { rerender, container } = render(
      <Modal open={true} onClose={onClose} title="Anim Test"><p>Content</p></Modal>
    );
    await act(() => vi.advanceTimersByTime(100));
    expect(screen.getByText('Content')).toBeInTheDocument();

    rerender(<Modal open={false} onClose={onClose} title="Anim Test"><p>Content</p></Modal>);

    expect(container.textContent).toContain('Content');

    await act(() => vi.advanceTimersByTime(200));

    expect(container.textContent).toBe('');
  });

  it('restores body overflow after unmount', async () => {
    const { rerender } = render(
      <Modal open={true} onClose={vi.fn()} title="Test"><p>Body</p></Modal>
    );
    await act(() => vi.advanceTimersByTime(100));
    expect(document.body.style.overflow).toBe('hidden');

    rerender(<Modal open={false} onClose={vi.fn()} title="Test"><p>Body</p></Modal>);
    await act(() => vi.advanceTimersByTime(200));
    expect(document.body.style.overflow).toBe('');
  });

  it('does not call onClose for non-Escape keys', async () => {
    const onClose = vi.fn();
    render(<Modal open={true} onClose={onClose} title="Test"><p>Body</p></Modal>);
    await act(() => vi.advanceTimersByTime(100));
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('applies custom size class', async () => {
    const { container } = render(
      <Modal open={true} onClose={vi.fn()} title="Large" size="xl"><p>XL</p></Modal>
    );
    await act(() => vi.advanceTimersByTime(100));
    expect(container.innerHTML).toContain('max-w-xl');
  });

  it('falls back to md size for unknown size', async () => {
    const { container } = render(
      <Modal open={true} onClose={vi.fn()} title="Unknown" size="unknown"><p>Body</p></Modal>
    );
    await act(() => vi.advanceTimersByTime(100));
    expect(container.innerHTML).toContain('max-w-md');
  });

  it('does not propagate clicks from modal content to overlay', async () => {
    const onClose = vi.fn();
    render(<Modal open={true} onClose={onClose} title="Test"><p>Click me</p></Modal>);
    await act(() => vi.advanceTimersByTime(100));
    fireEvent.click(screen.getByText('Click me'));
    expect(onClose).not.toHaveBeenCalled();
  });
});
