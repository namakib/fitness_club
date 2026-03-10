import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../../context/ThemeContext';

function TestConsumer() {
  const { isDark, toggle } = useTheme();
  return (
    <div>
      <span data-testid="dark">{String(isDark)}</span>
      <button onClick={toggle}>toggle</button>
    </div>
  );
}

const store = {};
function resetStorage() {
  Object.keys(store).forEach(k => delete store[k]);
  window.localStorage.getItem.mockImplementation((key) => store[key] ?? null);
  window.localStorage.setItem.mockImplementation((key, val) => { store[key] = String(val); });
  window.localStorage.clear.mockImplementation(() => { Object.keys(store).forEach(k => delete store[k]); });
}

describe('ThemeContext', () => {
  beforeEach(() => {
    resetStorage();
    document.documentElement.classList.remove('dark');
  });

  it('useTheme throws outside ThemeProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<TestConsumer />)).toThrow('useTheme must be used within ThemeProvider');
    spy.mockRestore();
  });

  it('defaults to light when no localStorage value', () => {
    render(<ThemeProvider><TestConsumer /></ThemeProvider>);
    expect(screen.getByTestId('dark').textContent).toBe('false');
  });

  it('reads dark from localStorage', () => {
    store.theme = 'dark';
    render(<ThemeProvider><TestConsumer /></ThemeProvider>);
    expect(screen.getByTestId('dark').textContent).toBe('true');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('reads light from localStorage', () => {
    store.theme = 'light';
    render(<ThemeProvider><TestConsumer /></ThemeProvider>);
    expect(screen.getByTestId('dark').textContent).toBe('false');
  });

  it('toggle flips isDark and updates class on html element', () => {
    render(<ThemeProvider><TestConsumer /></ThemeProvider>);
    expect(screen.getByTestId('dark').textContent).toBe('false');
    act(() => { screen.getByText('toggle').click(); });
    expect(screen.getByTestId('dark').textContent).toBe('true');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    act(() => { screen.getByText('toggle').click(); });
    expect(screen.getByTestId('dark').textContent).toBe('false');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('persists theme change to localStorage', () => {
    render(<ThemeProvider><TestConsumer /></ThemeProvider>);
    act(() => { screen.getByText('toggle').click(); });
    expect(window.localStorage.setItem).toHaveBeenCalledWith('theme', 'dark');
  });

  it('falls back to matchMedia dark preference when no stored theme', () => {
    window.matchMedia.mockImplementation(() => ({
      matches: true, media: '', onchange: null,
      addListener: vi.fn(), removeListener: vi.fn(),
      addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
    }));
    render(<ThemeProvider><TestConsumer /></ThemeProvider>);
    expect(screen.getByTestId('dark').textContent).toBe('true');
  });

  it('falls back to matchMedia light preference when no stored theme', () => {
    window.matchMedia.mockImplementation(() => ({
      matches: false, media: '', onchange: null,
      addListener: vi.fn(), removeListener: vi.fn(),
      addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
    }));
    render(<ThemeProvider><TestConsumer /></ThemeProvider>);
    expect(screen.getByTestId('dark').textContent).toBe('false');
  });

  it('falls back to false when localStorage.getItem throws', () => {
    window.localStorage.getItem.mockImplementation(() => { throw new Error('blocked'); });
    render(<ThemeProvider><TestConsumer /></ThemeProvider>);
    expect(screen.getByTestId('dark').textContent).toBe('false');
  });

  it('falls back to matchMedia when stored value is neither dark nor light', () => {
    store.theme = 'invalid';
    window.matchMedia.mockImplementation(() => ({
      matches: true, media: '', onchange: null,
      addListener: vi.fn(), removeListener: vi.fn(),
      addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
    }));
    render(<ThemeProvider><TestConsumer /></ThemeProvider>);
    expect(screen.getByTestId('dark').textContent).toBe('true');
  });
});
