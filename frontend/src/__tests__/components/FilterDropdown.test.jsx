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

  it('closes dropdown when clicking outside', () => {
    const { container: _container } = render(
      <div>
        <div data-testid="outside">Outside element</div>
        <FilterDropdown label="Status" value="" options={options} onChange={vi.fn()} />
      </div>
    );

    fireEvent.click(screen.getByText('Status: All'));
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Cancelled')).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByTestId('outside'));

    expect(screen.queryByText('Cancelled')).not.toBeInTheDocument();
  });

  it('shows check icon next to selected option', () => {
    render(<FilterDropdown label="Status" value="active" options={options} onChange={vi.fn()} />);
    fireEvent.click(screen.getByRole('button'));
    const activeBtn = screen.getAllByRole('button').find(b => b.textContent.includes('Active'));
    expect(activeBtn).toBeTruthy();
  });

  it('closes dropdown after selecting an option', () => {
    const onChange = vi.fn();
    render(<FilterDropdown label="Status" value="" options={options} onChange={onChange} />);
    fireEvent.click(screen.getByText('Status: All'));
    fireEvent.click(screen.getByText('Cancelled'));
    expect(screen.queryByText('Active')).not.toBeInTheDocument();
  });

  it('toggles open/closed on repeated clicks', () => {
    render(<FilterDropdown label="Status" value="" options={options} onChange={vi.fn()} />);
    const trigger = screen.getByText('Status: All');

    fireEvent.click(trigger);
    expect(screen.getByText('Active')).toBeInTheDocument();

    fireEvent.click(trigger);
    expect(screen.queryByText('Cancelled')).not.toBeInTheDocument();
  });

  it('adds mousedown listener when open', () => {
    const addSpy = vi.spyOn(document, 'addEventListener');
    const removeSpy = vi.spyOn(document, 'removeEventListener');
    render(<FilterDropdown label="Status" value="" options={options} onChange={vi.fn()} />);
    fireEvent.click(screen.getByText('Status: All'));
    expect(addSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
    fireEvent.mouseDown(document.body);
    expect(removeSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
    addSpy.mockRestore();
    removeSpy.mockRestore();
  });

  it('closes dropdown on click outside', () => {
    render(<FilterDropdown label="Status" value="" options={options} onChange={vi.fn()} />);
    fireEvent.click(screen.getByText('Status: All'));
    expect(screen.getByText('Active')).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    expect(screen.queryByText('Active')).not.toBeInTheDocument();
  });

  it('does not close when mouseDown fires inside the dropdown', () => {
    render(<FilterDropdown label="Status" value="" options={options} onChange={vi.fn()} />);
    fireEvent.click(screen.getByText('Status: All'));
    expect(screen.getByText('Active')).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByText('Active'));
    expect(screen.getByText('Active')).toBeInTheDocument();
  });
});
