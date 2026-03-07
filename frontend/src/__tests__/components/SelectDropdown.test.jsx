import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SelectDropdown from '../../components/SelectDropdown';

const options = [
  { value: 'member', label: 'Member' },
  { value: 'trainer', label: 'Trainer' },
  { value: 'admin', label: 'Admin' },
];

describe('SelectDropdown', () => {
  it('renders with label', () => {
    render(<SelectDropdown label="Role" value="" options={options} onChange={vi.fn()} />);
    expect(screen.getByText('Role')).toBeInTheDocument();
  });

  it('displays selected value label', () => {
    render(<SelectDropdown value="trainer" options={options} onChange={vi.fn()} />);
    expect(screen.getByText('Trainer')).toBeInTheDocument();
  });

  it('shows placeholder when no value', () => {
    render(<SelectDropdown value="" options={options} onChange={vi.fn()} placeholder="Pick one" />);
    expect(screen.getByText('Pick one')).toBeInTheDocument();
  });

  it('opens dropdown and shows options on click', () => {
    render(<SelectDropdown value="" options={options} onChange={vi.fn()} placeholder="Pick" />);
    fireEvent.click(screen.getByText('Pick'));
    expect(screen.getByText('Member')).toBeInTheDocument();
    expect(screen.getByText('Trainer')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('calls onChange when option is selected', () => {
    const onChange = vi.fn();
    render(<SelectDropdown value="" options={options} onChange={onChange} placeholder="Pick" />);
    fireEvent.click(screen.getByText('Pick'));
    fireEvent.click(screen.getByText('Admin'));
    expect(onChange).toHaveBeenCalledWith('admin');
  });
});
