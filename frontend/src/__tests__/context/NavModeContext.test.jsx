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

  it('defaults to sidebar', () => {
    render(<NavModeProvider><TestConsumer /></NavModeProvider>);
    expect(screen.getByTestId('mode').textContent).toBe('sidebar');
  });

  it('reads initial value from localStorage', () => {
    localStorage.setItem('navMode', 'dropdown');
    render(<NavModeProvider><TestConsumer /></NavModeProvider>);
    expect(screen.getByTestId('mode').textContent).toBe('dropdown');
  });

  it('setNavMode updates state and localStorage', () => {
    render(<NavModeProvider><TestConsumer /></NavModeProvider>);
    act(() => { screen.getByText('dropdown').click(); });
    expect(screen.getByTestId('mode').textContent).toBe('dropdown');
    expect(localStorage.setItem).toHaveBeenCalledWith('navMode', 'dropdown');
  });

  it('rejects invalid mode values', () => {
    render(<NavModeProvider><TestConsumer /></NavModeProvider>);
    act(() => { screen.getByText('invalid').click(); });
    expect(screen.getByTestId('mode').textContent).toBe('sidebar');
  });
});
