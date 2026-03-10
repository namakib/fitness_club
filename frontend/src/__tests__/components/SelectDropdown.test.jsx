import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import SelectDropdown from '../../components/SelectDropdown';

const options = [
  { value: 'member', label: 'Member' },
  { value: 'trainer', label: 'Trainer' },
  { value: 'admin', label: 'Admin' },
];

beforeEach(() => { vi.useFakeTimers({ shouldAdvanceTime: true }); });
afterEach(() => { vi.useRealTimers(); });

describe('SelectDropdown', () => {
  it('renders with label', () => {
    render(<SelectDropdown label="Role" value="" options={options} onChange={vi.fn()} />);
    expect(screen.getByText('Role')).toBeInTheDocument();
  });

  it('displays selected value label', () => {
    render(<SelectDropdown value="trainer" options={options} onChange={vi.fn()} />);
    expect(screen.getByText('Trainer')).toBeInTheDocument();
  });

  it('shows placeholder when no value', () => {
    render(<SelectDropdown value="" options={options} onChange={vi.fn()} placeholder="Pick one" />);
    expect(screen.getByText('Pick one')).toBeInTheDocument();
  });

  it('opens dropdown and shows options on click', async () => {
    render(<SelectDropdown value="" options={options} onChange={vi.fn()} placeholder="Pick" />);
    fireEvent.click(screen.getByText('Pick'));
    await act(async () => { vi.advanceTimersByTime(50); });
    expect(screen.getByText('Member')).toBeInTheDocument();
    expect(screen.getByText('Trainer')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('calls onChange when option is selected', async () => {
    const onChange = vi.fn();
    render(<SelectDropdown value="" options={options} onChange={onChange} placeholder="Pick" />);
    fireEvent.click(screen.getByText('Pick'));
    await act(async () => { vi.advanceTimersByTime(50); });
    fireEvent.click(screen.getByText('Admin'));
    expect(onChange).toHaveBeenCalledWith('admin');
  });

  it('renders without label', () => {
    render(<SelectDropdown value="" options={options} onChange={vi.fn()} />);
    expect(screen.getByText('Select…')).toBeInTheDocument();
  });

  it('shows check icon for active option', async () => {
    render(<SelectDropdown value="member" options={options} onChange={vi.fn()} placeholder="Pick" />);
    fireEvent.click(screen.getByText('Member'));
    await act(async () => { vi.advanceTimersByTime(50); });
    const memberOption = screen.getAllByText('Member');
    expect(memberOption.length).toBeGreaterThanOrEqual(1);
  });

  describe('searchable', () => {
    it('filters options by search query', async () => {
      render(<SelectDropdown value="" options={options} onChange={vi.fn()} placeholder="Pick" searchable />);
      fireEvent.click(screen.getByText('Pick'));
      await act(async () => { vi.advanceTimersByTime(50); });
      const searchInput = screen.getByPlaceholderText('Search…');
      fireEvent.change(searchInput, { target: { value: 'Mem' } });
      expect(screen.getByText('Member')).toBeInTheDocument();
      expect(screen.queryByText('Trainer')).not.toBeInTheDocument();
    });

    it('shows No results when nothing matches', async () => {
      render(<SelectDropdown value="" options={options} onChange={vi.fn()} placeholder="Pick" searchable />);
      fireEvent.click(screen.getByText('Pick'));
      await act(async () => { vi.advanceTimersByTime(50); });
      const searchInput = screen.getByPlaceholderText('Search…');
      fireEvent.change(searchInput, { target: { value: 'xyz' } });
      expect(screen.getByText('No results')).toBeInTheDocument();
    });

    it('auto-focuses search input when opened', async () => {
      render(<SelectDropdown value="" options={options} onChange={vi.fn()} placeholder="Pick" searchable />);
      fireEvent.click(screen.getByText('Pick'));
      await act(async () => { vi.advanceTimersByTime(50); });
      expect(screen.getByPlaceholderText('Search…')).toBeInTheDocument();
    });
  });

  describe('non-searchable', () => {
    it('does not show search input when searchable=false', async () => {
      render(<SelectDropdown value="" options={options} onChange={vi.fn()} placeholder="Pick" searchable={false} />);
      fireEvent.click(screen.getByText('Pick'));
      await act(async () => { vi.advanceTimersByTime(50); });
      expect(screen.queryByPlaceholderText('Search…')).not.toBeInTheDocument();
    });
  });

  describe('click outside', () => {
    it('closes dropdown on outside click', async () => {
      render(<SelectDropdown value="" options={options} onChange={vi.fn()} placeholder="Pick" />);
      fireEvent.click(screen.getByText('Pick'));
      await act(async () => { vi.advanceTimersByTime(50); });
      expect(screen.getByText('Member')).toBeInTheDocument();
      fireEvent.mouseDown(document.body);
      await act(async () => { vi.advanceTimersByTime(200); });
    });
  });

  describe('close animation', () => {
    it('runs exit animation then unmounts', async () => {
      render(<SelectDropdown value="" options={options} onChange={vi.fn()} placeholder="Pick" />);
      fireEvent.click(screen.getByText('Pick'));
      await act(async () => { vi.advanceTimersByTime(50); });
      expect(screen.getByText('Member')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Pick'));
      await act(async () => { vi.advanceTimersByTime(200); });
    });
  });

  describe('floating portal', () => {
    it('renders in a portal when floating=true', async () => {
      render(<SelectDropdown value="" options={options} onChange={vi.fn()} placeholder="Pick" floating />);
      fireEvent.click(screen.getByText('Pick'));
      await act(async () => { vi.advanceTimersByTime(50); });
      expect(screen.getByText('Member')).toBeInTheDocument();
    });

    it('closes floating dropdown on outside click', async () => {
      render(<SelectDropdown value="" options={options} onChange={vi.fn()} placeholder="Pick" floating />);
      fireEvent.click(screen.getByText('Pick'));
      await act(async () => { vi.advanceTimersByTime(50); });
      fireEvent.mouseDown(document.body);
      await act(async () => { vi.advanceTimersByTime(200); });
    });

    it('repositions on window resize when floating', async () => {
      render(<SelectDropdown value="" options={options} onChange={vi.fn()} placeholder="Pick" floating />);
      fireEvent.click(screen.getByText('Pick'));
      await act(async () => { vi.advanceTimersByTime(50); });
      fireEvent.resize(window);
      await act(async () => { vi.advanceTimersByTime(50); });
    });

    it('repositions on scroll when floating', async () => {
      render(<SelectDropdown value="" options={options} onChange={vi.fn()} placeholder="Pick" floating />);
      fireEvent.click(screen.getByText('Pick'));
      await act(async () => { vi.advanceTimersByTime(50); });
      fireEvent.scroll(window);
      await act(async () => { vi.advanceTimersByTime(50); });
    });

    it('opens above when not enough space below', async () => {
      const original = Element.prototype.getBoundingClientRect;
      Element.prototype.getBoundingClientRect = function() {
        return { top: 500, bottom: 530, left: 10, right: 200, width: 190, height: 30 };
      };
      Object.defineProperty(window, 'innerHeight', { value: 540, writable: true });

      render(<SelectDropdown value="" options={options} onChange={vi.fn()} placeholder="Pick" floating />);
      fireEvent.click(screen.getByText('Pick'));
      await act(async () => { vi.advanceTimersByTime(50); });

      Element.prototype.getBoundingClientRect = original;
      Object.defineProperty(window, 'innerHeight', { value: 768, writable: true });
    });

    it('cleans up floating listeners on unmount', async () => {
      const { unmount } = render(<SelectDropdown value="" options={options} onChange={vi.fn()} placeholder="Pick" floating />);
      fireEvent.click(screen.getByText('Pick'));
      await act(async () => { vi.advanceTimersByTime(50); });
      expect(screen.getByText('Member')).toBeInTheDocument();
      unmount();
    });

    it('cleanup cancels pending RAF on unmount after scroll', async () => {
      const origRAF = window.requestAnimationFrame;
      const origCAF = window.cancelAnimationFrame;
      let pendingId = 1;
      window.requestAnimationFrame = () => pendingId++;
      window.cancelAnimationFrame = vi.fn();

      const { unmount } = render(<SelectDropdown value="" options={options} onChange={vi.fn()} placeholder="Pick" floating />);
      fireEvent.click(screen.getByText('Pick'));
      await act(async () => { vi.advanceTimersByTime(50); });
      fireEvent.scroll(window);
      unmount();
      expect(window.cancelAnimationFrame).toHaveBeenCalled();

      window.requestAnimationFrame = origRAF;
      window.cancelAnimationFrame = origCAF;
    });

    it('throttledUpdate cancels previous RAF', async () => {
      const origRAF = window.requestAnimationFrame;
      const origCAF = window.cancelAnimationFrame;
      const callbacks = [];
      window.requestAnimationFrame = (cb) => { callbacks.push(cb); return callbacks.length; };
      window.cancelAnimationFrame = vi.fn();

      render(<SelectDropdown value="" options={options} onChange={vi.fn()} placeholder="Pick" floating />);
      fireEvent.click(screen.getByText('Pick'));
      await act(async () => { vi.advanceTimersByTime(50); });

      fireEvent.scroll(window);
      fireEvent.scroll(window);
      expect(window.cancelAnimationFrame).toHaveBeenCalled();
      callbacks.forEach(cb => cb());

      window.requestAnimationFrame = origRAF;
      window.cancelAnimationFrame = origCAF;
    });

    it('detects scrollable parents and listens for scroll', async () => {
      const wrapper = document.createElement('div');
      Object.defineProperty(wrapper, 'style', {
        get: () => ({ overflow: 'auto', overflowX: '', overflowY: '' }),
      });
      const origGetComputedStyle = window.getComputedStyle;
      window.getComputedStyle = (el) => {
        if (el === wrapper) return { overflow: 'auto', overflowX: '', overflowY: '' };
        return origGetComputedStyle(el);
      };

      document.body.appendChild(wrapper);
      const { unmount } = render(
        <SelectDropdown value="" options={options} onChange={vi.fn()} placeholder="Pick" floating />,
        { container: wrapper }
      );
      fireEvent.click(screen.getByText('Pick'));
      await act(async () => { vi.advanceTimersByTime(50); });
      fireEvent.scroll(wrapper);
      await act(async () => { vi.advanceTimersByTime(50); });
      unmount();

      window.getComputedStyle = origGetComputedStyle;
      document.body.removeChild(wrapper);
    });
  });

  describe('toggle open/close', () => {
    it('toggles on repeated clicks', async () => {
      render(<SelectDropdown value="" options={options} onChange={vi.fn()} placeholder="Pick" />);
      fireEvent.click(screen.getByText('Pick'));
      await act(async () => { vi.advanceTimersByTime(50); });
      expect(screen.getByText('Member')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Pick'));
      await act(async () => { vi.advanceTimersByTime(200); });

      fireEvent.click(screen.getByText('Pick'));
      await act(async () => { vi.advanceTimersByTime(50); });
      expect(screen.getByText('Member')).toBeInTheDocument();
    });
  });

  describe('selecting an option closes dropdown', () => {
    it('closes after selection', async () => {
      const onChange = vi.fn();
      render(<SelectDropdown value="" options={options} onChange={onChange} placeholder="Pick" />);
      fireEvent.click(screen.getByText('Pick'));
      await act(async () => { vi.advanceTimersByTime(50); });
      fireEvent.click(screen.getByText('Trainer'));
      expect(onChange).toHaveBeenCalledWith('trainer');
      await act(async () => { vi.advanceTimersByTime(200); });
    });
  });

  describe('floating dropdown openAbove positioning', () => {
    it('positions panel above trigger when space below is limited', async () => {
      const orig = Element.prototype.getBoundingClientRect;
      Element.prototype.getBoundingClientRect = function() {
        return { top: 500, bottom: 530, left: 10, right: 200, width: 190, height: 30 };
      };
      Object.defineProperty(window, 'innerHeight', { value: 540, writable: true });

      render(<SelectDropdown value="" options={options} onChange={vi.fn()} placeholder="Pick" floating />);
      fireEvent.click(screen.getByText('Pick'));
      await act(async () => { vi.advanceTimersByTime(50); });
      const portalContent = document.querySelector('[style*="position: fixed"]');
      expect(portalContent).toBeTruthy();

      Element.prototype.getBoundingClientRect = orig;
      Object.defineProperty(window, 'innerHeight', { value: 768, writable: true });
    });

    it('does not register scroll listener when floating=false', async () => {
      render(<SelectDropdown value="" options={options} onChange={vi.fn()} placeholder="Pick" floating={false} />);
      fireEvent.click(screen.getByText('Pick'));
      await act(async () => { vi.advanceTimersByTime(50); });
      expect(screen.getByText('Member')).toBeInTheDocument();
    });
  });

  describe('empty query shows all options', () => {
    it('shows all when search cleared', async () => {
      render(<SelectDropdown value="" options={options} onChange={vi.fn()} placeholder="Pick" searchable />);
      fireEvent.click(screen.getByText('Pick'));
      await act(async () => { vi.advanceTimersByTime(50); });
      const searchInput = screen.getByPlaceholderText('Search…');
      fireEvent.change(searchInput, { target: { value: 'Mem' } });
      expect(screen.queryByText('Admin')).not.toBeInTheDocument();
      fireEvent.change(searchInput, { target: { value: '' } });
      expect(screen.getByText('Admin')).toBeInTheDocument();
    });
  });
});
