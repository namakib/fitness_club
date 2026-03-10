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

  it('renders without label', () => {
    render(<NumberInput value="3" onChange={vi.fn()} />);
    expect(screen.queryByText('*')).not.toBeInTheDocument();
  });

  it('clamps decrement to min', () => {
    const onChange = vi.fn();
    render(<NumberInput value="1" onChange={onChange} min={0} step={2} />);
    fireEvent.click(screen.getByLabelText('Decrement'));
    expect(onChange).toHaveBeenCalledWith({ target: { value: '0' } });
  });

  it('uses default step of 1 when step is invalid', () => {
    const onChange = vi.fn();
    render(<NumberInput value="5" onChange={onChange} step="abc" />);
    fireEvent.click(screen.getByLabelText('Increment'));
    expect(onChange).toHaveBeenCalledWith({ target: { value: '6' } });
  });

  it('increment from NaN value uses min as base', () => {
    const onChange = vi.fn();
    render(<NumberInput value="" onChange={onChange} min={5} step={1} />);
    fireEvent.click(screen.getByLabelText('Increment'));
    expect(onChange).toHaveBeenCalledWith({ target: { value: '6' } });
  });

  it('increment from NaN value uses 0 when min is not set', () => {
    const onChange = vi.fn();
    render(<NumberInput value="" onChange={onChange} step={1} />);
    fireEvent.click(screen.getByLabelText('Increment'));
    expect(onChange).toHaveBeenCalledWith({ target: { value: '1' } });
  });

  it('decrement from NaN value uses min as base when min allows', () => {
    const onChange = vi.fn();
    render(<NumberInput value="" onChange={onChange} min={0} step={1} />);
    expect(screen.getByLabelText('Decrement')).toBeDisabled();
  });

  it('decrement from NaN value uses 0 when min is not set', () => {
    const onChange = vi.fn();
    render(<NumberInput value="" onChange={onChange} step={1} />);
    fireEvent.click(screen.getByLabelText('Decrement'));
    expect(onChange).toHaveBeenCalledWith({ target: { value: '-1' } });
  });

  it('displays empty string when value is empty', () => {
    render(<NumberInput value="" onChange={vi.fn()} label="Count" />);
    expect(screen.getByLabelText('Count')).toHaveValue(null);
  });

  it('displays empty string when value is null', () => {
    render(<NumberInput value={null} onChange={vi.fn()} label="Count" />);
    expect(screen.getByLabelText('Count')).toHaveValue(null);
  });

  it('increment without max does not clamp', () => {
    const onChange = vi.fn();
    render(<NumberInput value="100" onChange={onChange} step={1} />);
    fireEvent.click(screen.getByLabelText('Increment'));
    expect(onChange).toHaveBeenCalledWith({ target: { value: '101' } });
  });

  it('decrement without min does not clamp', () => {
    const onChange = vi.fn();
    render(<NumberInput value="-100" onChange={onChange} step={1} />);
    fireEvent.click(screen.getByLabelText('Decrement'));
    expect(onChange).toHaveBeenCalledWith({ target: { value: '-101' } });
  });

  it('increment enabled when value < max', () => {
    render(<NumberInput value="5" onChange={vi.fn()} max={10} step={1} />);
    expect(screen.getByLabelText('Increment')).not.toBeDisabled();
  });

  it('decrement enabled when value > min', () => {
    render(<NumberInput value="5" onChange={vi.fn()} min={0} step={1} />);
    expect(screen.getByLabelText('Decrement')).not.toBeDisabled();
  });

  it('does not show helper when helperText is empty string and no max', () => {
    const { container } = render(<NumberInput value="5" onChange={vi.fn()} helperText="" />);
    expect(container.querySelector('p')).not.toBeInTheDocument();
  });

  it('renders helper area when helperText is empty string and max is set', () => {
    const { container } = render(<NumberInput value="5" onChange={vi.fn()} helperText="" max={10} />);
    const helperEl = container.querySelector('p');
    expect(helperEl).toBeInTheDocument();
  });

  it('does not show max helper when helperText is provided', () => {
    render(<NumberInput value="5" onChange={vi.fn()} helperText="Custom help" max={10} />);
    expect(screen.getByText('Custom help')).toBeInTheDocument();
    expect(screen.queryByText('Maximum of 10')).not.toBeInTheDocument();
  });

  it('renders fullWidth layout', () => {
    const { container } = render(<NumberInput value="5" onChange={vi.fn()} fullWidth />);
    const wrapper = container.querySelector('.w-full');
    expect(wrapper).toBeInTheDocument();
  });

  it('renders inline layout by default', () => {
    const { container } = render(<NumberInput value="5" onChange={vi.fn()} />);
    const wrapper = container.querySelector('.inline-flex');
    expect(wrapper).toBeInTheDocument();
  });

  it('uses step as float', () => {
    const onChange = vi.fn();
    render(<NumberInput value="5" onChange={onChange} step={0.5} />);
    fireEvent.click(screen.getByLabelText('Increment'));
    expect(onChange).toHaveBeenCalledWith({ target: { value: '5.5' } });
  });

  it('passes placeholder to input', () => {
    render(<NumberInput value="" onChange={vi.fn()} placeholder="Enter amount" label="Amount" />);
    expect(screen.getByPlaceholderText('Enter amount')).toBeInTheDocument();
  });

  it('decrement disabled when NaN value and min is set', () => {
    render(<NumberInput value="" onChange={vi.fn()} min={0} step={1} />);
    expect(screen.getByLabelText('Decrement')).toBeDisabled();
  });

  it('increment disabled when NaN value and max is set', () => {
    render(<NumberInput value="" onChange={vi.fn()} max={0} step={1} />);
    expect(screen.getByLabelText('Increment')).toBeDisabled();
  });

  it('shows "Maximum of X" when max is set and no helperText', () => {
    render(<NumberInput label="Qty" value="5" onChange={vi.fn()} max={10} />);
    expect(screen.getByText('Maximum of 10')).toBeInTheDocument();
  });

  it('shows custom helperText instead of max helper', () => {
    render(<NumberInput label="Qty" value="5" onChange={vi.fn()} max={10} helperText="Custom help" />);
    expect(screen.getByText('Custom help')).toBeInTheDocument();
    expect(screen.queryByText('Maximum of 10')).not.toBeInTheDocument();
  });

  it('does not show helper when no max and no helperText', () => {
    const { container } = render(<NumberInput label="Qty" value="5" onChange={vi.fn()} />);
    expect(container.querySelector('.mt-1')).not.toBeInTheDocument();
  });

  it('shows null when helperText is explicitly null and max is not set', () => {
    const { container } = render(<NumberInput label="Qty" value="5" onChange={vi.fn()} helperText={null} />);
    expect(container.querySelector('.mt-1')).not.toBeInTheDocument();
  });

  it('shows "Maximum of N" when max is set and no helperText', () => {
    render(<NumberInput label="Qty" value="5" onChange={vi.fn()} max={20} />);
    expect(screen.getByText('Maximum of 20')).toBeInTheDocument();
  });
});
