import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../helpers/renderWithProviders';
import Home from '../../pages/Home';

describe('Home page', () => {
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
});
