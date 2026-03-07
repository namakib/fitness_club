import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchInput from '../../components/SearchInput';

describe('SearchInput', () => {
  it('renders with default placeholder', () => {
    render(<SearchInput value="" onChange={vi.fn()} />);
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
  });

  it('renders with custom placeholder', () => {
    render(<SearchInput value="" onChange={vi.fn()} placeholder="Find members..." />);
    expect(screen.getByPlaceholderText('Find members...')).toBeInTheDocument();
  });

  it('calls onChange when typing', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SearchInput value="" onChange={onChange} />);
    await user.type(screen.getByPlaceholderText('Search...'), 'hello');
    expect(onChange).toHaveBeenCalled();
    expect(onChange.mock.calls[0][0]).toBe('h');
  });

  it('displays the current value', () => {
    render(<SearchInput value="test" onChange={vi.fn()} />);
    expect(screen.getByDisplayValue('test')).toBeInTheDocument();
  });
});
