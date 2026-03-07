import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
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
});
