import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders, renderWithRouter, renderPlain } from './renderWithProviders';

describe('renderWithProviders helpers', () => {
  it('renderWithProviders wraps with Router + Theme + NavMode', () => {
    renderWithProviders(<div data-testid="child">Hello</div>);
    expect(screen.getByTestId('child').textContent).toBe('Hello');
  });

  it('renderWithRouter wraps only with MemoryRouter', () => {
    renderWithRouter(<div data-testid="rt">Router Only</div>);
    expect(screen.getByTestId('rt').textContent).toBe('Router Only');
  });

  it('renderPlain renders without any wrapper', () => {
    renderPlain(<div data-testid="plain">Plain</div>);
    expect(screen.getByTestId('plain').textContent).toBe('Plain');
  });
});
