import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '../../context/ThemeContext';
import ThemeToggle from '../../components/ThemeToggle';

function renderToggle() {
  return render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>
  );
}

describe('ThemeToggle', () => {
  it('renders the toggle button', () => {
    renderToggle();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('has aria-label for accessibility', () => {
    renderToggle();
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('aria-label', expect.stringContaining('Switch to'));
  });

  it('toggles theme on click', () => {
    renderToggle();
    const btn = screen.getByRole('button');
    const initialLabel = btn.getAttribute('aria-label');
    fireEvent.click(btn);
    expect(btn.getAttribute('aria-label')).not.toBe(initialLabel);
  });
});
