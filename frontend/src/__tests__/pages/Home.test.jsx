import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../helpers/renderWithProviders';

let mockDemoMode = false;

vi.mock('../../context/DemoContext', () => ({
  useDemo: () => ({ demoMode: mockDemoMode, demoAccounts: [] }),
  DemoProvider: ({ children }) => children,
}));

import Home from '../../pages/Home';

describe('Home page', () => {
  beforeEach(() => {
    mockDemoMode = false;
  });

  it('renders the hero heading', () => {
    renderWithProviders(<Home />);
    expect(screen.getByText('Fitness Club')).toBeInTheDocument();
  });

  it('renders Sign In link pointing to /login', () => {
    renderWithProviders(<Home />);
    const link = screen.getByText('Sign In');
    expect(link).toBeInTheDocument();
    expect(link.closest('a')).toHaveAttribute('href', '/login');
  });

  it('renders Create Account link pointing to /register', () => {
    renderWithProviders(<Home />);
    const link = screen.getByText('Create Account');
    expect(link).toBeInTheDocument();
    expect(link.closest('a')).toHaveAttribute('href', '/register');
  });

  it('renders tagline text', () => {
    renderWithProviders(<Home />);
    expect(screen.getByText(/Track your goals/)).toBeInTheDocument();
  });

  it('renders footer', () => {
    renderWithProviders(<Home />);
    expect(screen.getByText('Health & Fitness Club Management')).toBeInTheDocument();
  });

  it('hides Create Account and shows demo hint in demo mode', () => {
    mockDemoMode = true;
    renderWithProviders(<Home />);
    expect(screen.queryByText('Create Account')).not.toBeInTheDocument();
    expect(screen.getByText(/Demo mode/)).toBeInTheDocument();
    expect(screen.getByText('Sign In')).toBeInTheDocument();
  });
});
