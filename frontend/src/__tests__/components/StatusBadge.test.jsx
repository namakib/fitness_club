import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatusBadge from '../../components/StatusBadge';

describe('StatusBadge', () => {
  it('renders status text with underscores replaced by spaces', () => {
    render(<StatusBadge status="under_repair" />);
    expect(screen.getByText('under repair')).toBeInTheDocument();
  });

  it('renders simple status', () => {
    render(<StatusBadge status="active" />);
    expect(screen.getByText('active')).toBeInTheDocument();
  });

  it('falls back to default styling for unknown status', () => {
    render(<StatusBadge status="unknown_xyz" />);
    expect(screen.getByText('unknown xyz')).toBeInTheDocument();
  });

  it('handles null/undefined status', () => {
    const { container } = render(<StatusBadge status={null} />);
    expect(container.querySelector('span')).toBeInTheDocument();
  });
});
