import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import NumberInput from '../../components/NumberInput';

describe('NumberInput', () => {
  it('renders with label', () => {
    render(<NumberInput label="Reps" value="5" onChange={vi.fn()} />);
    expect(screen.getByText('Reps')).toBeInTheDocument();
  });

  it('shows required asterisk', () => {
    render(<NumberInput label="Sets" value="" onChange={vi.fn()} required />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('increment button increases value', () => {
    const onChange = vi.fn();
    render(<NumberInput value="5" onChange={onChange} step={1} />);
    fireEvent.click(screen.getByLabelText('Increment'));
    expect(onChange).toHaveBeenCalledWith({ target: { value: '6' } });
  });

  it('decrement button decreases value', () => {
    const onChange = vi.fn();
    render(<NumberInput value="5" onChange={onChange} step={1} />);
    fireEvent.click(screen.getByLabelText('Decrement'));
    expect(onChange).toHaveBeenCalledWith({ target: { value: '4' } });
  });

  it('respects max limit', () => {
    const onChange = vi.fn();
    render(<NumberInput value="10" onChange={onChange} max={10} step={1} />);
    expect(screen.getByLabelText('Increment')).toBeDisabled();
  });

  it('respects min limit', () => {
    const onChange = vi.fn();
    render(<NumberInput value="0" onChange={onChange} min={0} step={1} />);
    expect(screen.getByLabelText('Decrement')).toBeDisabled();
  });

  it('clamps increment to max', () => {
    const onChange = vi.fn();
    render(<NumberInput value="9" onChange={onChange} max={10} step={2} />);
    fireEvent.click(screen.getByLabelText('Increment'));
    expect(onChange).toHaveBeenCalledWith({ target: { value: '10' } });
  });

  it('shows helper text', () => {
    render(<NumberInput value="5" onChange={vi.fn()} helperText="Enter reps" />);
    expect(screen.getByText('Enter reps')).toBeInTheDocument();
  });

  it('shows max helper when no helperText and max is set', () => {
    render(<NumberInput value="5" onChange={vi.fn()} max={20} />);
    expect(screen.getByText('Maximum of 20')).toBeInTheDocument();
  });
});
