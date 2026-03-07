import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DatePicker from '../../components/DatePicker';

describe('DatePicker', () => {
  it('renders with label', () => {
    render(<DatePicker label="Start Date" value="" onChange={vi.fn()} />);
    expect(screen.getByText('Start Date')).toBeInTheDocument();
  });

  it('shows placeholder when no value', () => {
    render(<DatePicker value="" onChange={vi.fn()} placeholder="Select date" />);
    expect(screen.getByText('Select date')).toBeInTheDocument();
  });

  it('displays formatted date value', () => {
    render(<DatePicker value="2025-06-15" onChange={vi.fn()} />);
    const el = screen.getByText(/Jun 15/);
    expect(el).toBeInTheDocument();
  });

  it('opens calendar popup on button click', () => {
    render(<DatePicker value="" onChange={vi.fn()} placeholder="Pick" />);
    fireEvent.click(screen.getByText('Pick'));
    expect(screen.getByText('Sun')).toBeInTheDocument();
  });

  it('shows required asterisk', () => {
    render(<DatePicker label="DOB" value="" onChange={vi.fn()} required />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });
});
