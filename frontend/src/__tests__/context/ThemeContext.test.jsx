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

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorage.clear();
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

  it('reads initial theme from localStorage', () => {
    localStorage.setItem('theme', 'dark');
    render(<ThemeProvider><TestConsumer /></ThemeProvider>);
    expect(screen.getByTestId('dark').textContent).toBe('true');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
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
    expect(localStorage.setItem).toHaveBeenCalledWith('theme', 'dark');
  });
});
