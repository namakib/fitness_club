import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PhoneInput, { formatPhoneDisplay } from '../../components/PhoneInput';

describe('formatPhoneDisplay', () => {
  it('formats 10 digits as (XXX) XXX-XXXX', () => {
    expect(formatPhoneDisplay('5551234567')).toBe('(555) 123-4567');
  });

  it('formats partial digits', () => {
    expect(formatPhoneDisplay('555')).toBe('(555');
    expect(formatPhoneDisplay('555123')).toBe('(555) 123');
  });

  it('strips non-digit characters', () => {
    expect(formatPhoneDisplay('(555) 123-4567')).toBe('(555) 123-4567');
  });

  it('returns empty string for empty input', () => {
    expect(formatPhoneDisplay('')).toBe('');
    expect(formatPhoneDisplay(null)).toBe('');
  });

  it('formats 1 digit', () => {
    expect(formatPhoneDisplay('5')).toBe('(5');
  });

  it('formats 2 digits', () => {
    expect(formatPhoneDisplay('55')).toBe('(55');
  });

  it('formats 4 digits', () => {
    expect(formatPhoneDisplay('5551')).toBe('(555) 1');
  });

  it('formats 7 digits', () => {
    expect(formatPhoneDisplay('5551234')).toBe('(555) 123-4');
  });

  it('truncates beyond 10 digits', () => {
    expect(formatPhoneDisplay('55512345678901')).toBe('(555) 123-4567');
  });

  it('handles undefined', () => {
    expect(formatPhoneDisplay(undefined)).toBe('');
  });
});

describe('PhoneInput component', () => {
  it('renders with label', () => {
    render(<PhoneInput label="Phone" value="" onChange={vi.fn()} />);
    expect(screen.getByText('Phone')).toBeInTheDocument();
  });

  it('renders with default placeholder', () => {
    render(<PhoneInput value="" onChange={vi.fn()} />);
    expect(screen.getByPlaceholderText('(555) 555-5555')).toBeInTheDocument();
  });

  it('displays formatted phone value', () => {
    render(<PhoneInput value="5551234567" onChange={vi.fn()} />);
    expect(screen.getByDisplayValue('(555) 123-4567')).toBeInTheDocument();
  });

  it('calls onChange with formatted value on input', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<PhoneInput value="" onChange={onChange} />);
    const input = screen.getByPlaceholderText('(555) 555-5555');
    await user.type(input, '5');
    expect(onChange).toHaveBeenCalled();
  });

  it('shows required asterisk when required', () => {
    render(<PhoneInput label="Phone" value="" onChange={vi.fn()} required />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('does not show asterisk when not required', () => {
    render(<PhoneInput label="Phone" value="" onChange={vi.fn()} />);
    expect(screen.queryByText('*')).not.toBeInTheDocument();
  });

  it('renders without label', () => {
    render(<PhoneInput value="" onChange={vi.fn()} />);
    expect(screen.queryByText('Phone')).not.toBeInTheDocument();
  });

  it('uses custom placeholder', () => {
    render(<PhoneInput value="" onChange={vi.fn()} placeholder="Enter phone" />);
    expect(screen.getByPlaceholderText('Enter phone')).toBeInTheDocument();
  });

  it('handles onChange and formats digits', () => {
    const onChange = vi.fn();
    render(<PhoneInput value="" onChange={onChange} />);
    const input = screen.getByPlaceholderText('(555) 555-5555');
    fireEvent.change(input, { target: { value: '5551234567' } });
    expect(onChange).toHaveBeenCalledWith({ target: { value: '(555) 123-4567' } });
  });

  it('strips non-digits from input', () => {
    const onChange = vi.fn();
    render(<PhoneInput value="" onChange={onChange} />);
    const input = screen.getByPlaceholderText('(555) 555-5555');
    fireEvent.change(input, { target: { value: '(555) abc 123-4567' } });
    expect(onChange).toHaveBeenCalled();
    const formatted = onChange.mock.calls[0][0].target.value;
    expect(formatted).toMatch(/^\(\d{3}\) \d{3}-\d{4}$/);
  });

  it('limits to 10 digits max', () => {
    const onChange = vi.fn();
    render(<PhoneInput value="" onChange={onChange} />);
    const input = screen.getByPlaceholderText('(555) 555-5555');
    fireEvent.change(input, { target: { value: '12345678901234' } });
    expect(onChange).toHaveBeenCalled();
    const formatted = onChange.mock.calls[0][0].target.value;
    expect(formatted).toBe('(123) 456-7890');
  });

  it('updates display when value prop changes', () => {
    const { rerender } = render(<PhoneInput value="" onChange={vi.fn()} />);
    rerender(<PhoneInput value="9876543210" onChange={vi.fn()} />);
    expect(screen.getByDisplayValue('(987) 654-3210')).toBeInTheDocument();
  });

  it('handles empty value prop gracefully', () => {
    const { rerender } = render(<PhoneInput value="5551234567" onChange={vi.fn()} />);
    rerender(<PhoneInput value="" onChange={vi.fn()} />);
    expect(screen.getByDisplayValue('')).toBeInTheDocument();
  });

  it('applies disabled styling when disabled', () => {
    render(<PhoneInput value="5551234567" onChange={vi.fn()} disabled />);
    const input = screen.getByDisplayValue('(555) 123-4567');
    expect(input).toBeDisabled();
  });

  it('passes custom className', () => {
    render(<PhoneInput value="" onChange={vi.fn()} className="custom-class" />);
    const input = screen.getByPlaceholderText('(555) 555-5555');
    expect(input.className).toContain('custom-class');
  });
});
