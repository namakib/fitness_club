import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NavModeProvider } from '../../context/NavModeContext';
import NavModeToggle from '../../components/NavModeToggle';

function renderToggle() {
  return render(
    <NavModeProvider>
      <NavModeToggle />
    </NavModeProvider>
  );
}

describe('NavModeToggle', () => {
  it('renders navigation style section', () => {
    renderToggle();
    expect(screen.getByText('Navigation Style')).toBeInTheDocument();
  });

  it('renders sidebar and dropdown options', () => {
    renderToggle();
    expect(screen.getByText('Sidebar')).toBeInTheDocument();
    expect(screen.getByText('Dropdown')).toBeInTheDocument();
  });

  it('clicking dropdown switches navigation mode', () => {
    renderToggle();
    fireEvent.click(screen.getByText('Dropdown'));
    expect(localStorage.setItem).toHaveBeenCalledWith('navMode', 'dropdown');
  });

  it('clicking sidebar switches navigation mode back', () => {
    renderToggle();
    fireEvent.click(screen.getByText('Dropdown'));
    fireEvent.click(screen.getByText('Sidebar'));
    expect(localStorage.setItem).toHaveBeenCalledWith('navMode', 'sidebar');
  });
});
