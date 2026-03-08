import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { NavModeProvider, useNavMode } from '../../context/NavModeContext';

function TestConsumer() {
  const { navMode, setNavMode } = useNavMode();
  return (
    <div>
      <span data-testid="mode">{navMode}</span>
      <button onClick={() => setNavMode('dropdown')}>dropdown</button>
      <button onClick={() => setNavMode('sidebar')}>sidebar</button>
      <button onClick={() => setNavMode('invalid')}>invalid</button>
    </div>
  );
}

describe('NavModeContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('useNavMode throws outside NavModeProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<TestConsumer />)).toThrow('useNavMode must be used within NavModeProvider');
    spy.mockRestore();
  });

  it('defaults to dropdown', () => {
    render(<NavModeProvider><TestConsumer /></NavModeProvider>);
    expect(screen.getByTestId('mode').textContent).toBe('dropdown');
  });

  it('reads initial value from localStorage', () => {
    localStorage.setItem('navMode', 'dropdown');
    render(<NavModeProvider><TestConsumer /></NavModeProvider>);
    expect(screen.getByTestId('mode').textContent).toBe('dropdown');
  });

  it('setNavMode updates state and localStorage', () => {
    render(<NavModeProvider><TestConsumer /></NavModeProvider>);
    act(() => { screen.getByText('sidebar').click(); });
    expect(screen.getByTestId('mode').textContent).toBe('sidebar');
    expect(localStorage.setItem).toHaveBeenCalledWith('navMode', 'sidebar');
  });

  it('rejects invalid mode values', () => {
    render(<NavModeProvider><TestConsumer /></NavModeProvider>);
    act(() => { screen.getByText('invalid').click(); });
    expect(screen.getByTestId('mode').textContent).toBe('dropdown');
  });

  it('defaults to dropdown when localStorage throws', () => {
    window.localStorage.getItem.mockImplementation(() => { throw new Error('blocked'); });
    render(<NavModeProvider><TestConsumer /></NavModeProvider>);
    expect(screen.getByTestId('mode').textContent).toBe('dropdown');
  });

  it('defaults to dropdown when localStorage has invalid value', () => {
    localStorage.setItem('navMode', 'bogus');
    render(<NavModeProvider><TestConsumer /></NavModeProvider>);
    expect(screen.getByTestId('mode').textContent).toBe('dropdown');
  });

  it('handles localStorage.setItem throwing gracefully', () => {
    window.localStorage.setItem.mockImplementation(() => { throw new Error('quota'); });
    render(<NavModeProvider><TestConsumer /></NavModeProvider>);
    act(() => { screen.getByText('sidebar').click(); });
    expect(screen.getByTestId('mode').textContent).toBe('sidebar');
  });
});
