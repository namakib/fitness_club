import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TimePicker from '../../components/TimePicker';

describe('TimePicker', () => {
  it('renders with label', () => {
    render(<TimePicker label="Start Time" value="" onChange={vi.fn()} />);
    expect(screen.getByText('Start Time')).toBeInTheDocument();
  });

  it('shows placeholder when no value', () => {
    render(<TimePicker value="" onChange={vi.fn()} placeholder="Pick time" />);
    expect(screen.getByText('Pick time')).toBeInTheDocument();
  });

  it('displays formatted time value for afternoon time', () => {
    render(<TimePicker value="14:30" onChange={vi.fn()} />);
    expect(screen.getByText(/2:30/)).toBeInTheDocument();
  });

  it('opens picker on click', () => {
    render(<TimePicker value="" onChange={vi.fn()} placeholder="Pick" />);
    fireEvent.click(screen.getByText('Pick'));
    expect(screen.getByText('Enter time')).toBeInTheDocument();
    expect(screen.getByText('Hour')).toBeInTheDocument();
  });

  it('shows required asterisk', () => {
    render(<TimePicker label="Time" value="" onChange={vi.fn()} required />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });
});
