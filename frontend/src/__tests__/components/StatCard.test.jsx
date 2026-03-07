import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatCard from '../../components/StatCard';

describe('StatCard', () => {
  it('renders label and value', () => {
    render(<StatCard label="Total Users" value={42} icon="users" />);
    expect(screen.getByText('Total Users')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('shows dash when value is null', () => {
    render(<StatCard label="Weight" value={null} icon="weight" />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('renders sub text when provided', () => {
    render(<StatCard label="Sessions" value={5} icon="session" sub="this week" />);
    expect(screen.getByText('this week')).toBeInTheDocument();
  });

  it('renders without icon gracefully', () => {
    render(<StatCard label="Test" value={1} />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('falls back to orange when unknown color is passed', () => {
    render(<StatCard label="Unknown" value={1} icon="users" color="nonexistent" />);
    expect(screen.getByText('Unknown')).toBeInTheDocument();
  });
});
