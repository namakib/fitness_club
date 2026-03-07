import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FilterDropdown from '../../components/FilterDropdown';

const options = [
  { value: 'active', label: 'Active' },
  { value: 'cancelled', label: 'Cancelled' },
];

describe('FilterDropdown', () => {
  it('renders with "All" label when no value selected', () => {
    render(<FilterDropdown label="Status" value="" options={options} onChange={vi.fn()} />);
    expect(screen.getByText('Status: All')).toBeInTheDocument();
  });

  it('shows selected option label', () => {
    render(<FilterDropdown label="Status" value="active" options={options} onChange={vi.fn()} />);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('opens dropdown on click and shows options', () => {
    render(<FilterDropdown label="Status" value="" options={options} onChange={vi.fn()} />);
    fireEvent.click(screen.getByText('Status: All'));
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
  });

  it('calls onChange when option is selected', () => {
    const onChange = vi.fn();
    render(<FilterDropdown label="Status" value="" options={options} onChange={onChange} />);
    fireEvent.click(screen.getByText('Status: All'));
    fireEvent.click(screen.getByText('Active'));
    expect(onChange).toHaveBeenCalledWith('active');
  });

  it('calls onChange with empty string when All is clicked', () => {
    const onChange = vi.fn();
    render(<FilterDropdown label="Status" value="active" options={options} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByText('All'));
    expect(onChange).toHaveBeenCalledWith('');
  });
});
