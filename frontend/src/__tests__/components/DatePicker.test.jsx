import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DatePicker from '../../components/DatePicker';

describe('DatePicker', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

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

  it('handles invalid date value gracefully', () => {
    render(<DatePicker value="not-a-date" onChange={vi.fn()} />);
    expect(screen.getByText('not-a-date')).toBeInTheDocument();
  });

  it('selects a day and calls onChange with YYYY-MM-DD', () => {
    const onChange = vi.fn();
    render(<DatePicker value="2025-06-15" onChange={onChange} />);
    fireEvent.click(screen.getByText(/Jun 15/));
    fireEvent.click(screen.getByText('20'));
    expect(onChange).toHaveBeenCalledWith('2025-06-20');
  });

  it('closes popup after selecting a day', () => {
    const onChange = vi.fn();
    render(<DatePicker value="2025-06-15" onChange={onChange} />);
    fireEvent.click(screen.getByText(/Jun 15/));
    expect(screen.getByText('Sun')).toBeInTheDocument();
    fireEvent.click(screen.getByText('20'));
    expect(screen.queryByText('Sun')).not.toBeInTheDocument();
  });

  it('navigates to next and previous months', () => {
    render(<DatePicker value="2025-06-15" onChange={vi.fn()} />);
    fireEvent.click(screen.getByText(/Jun 15/));
    expect(screen.getByText('June 2025')).toBeInTheDocument();

    const buttons = screen.getAllByRole('button');
    const _nextBtn = buttons.find(b => {
      const parent = b.closest('.mb-3');
      return parent && b === parent.querySelector('button:last-child');
    });
    const navContainer = screen.getByText('June 2025').closest('.mb-3');
    const navButtons = navContainer.querySelectorAll('button');
    fireEvent.click(navButtons[navButtons.length - 1]);
    expect(screen.getByText('July 2025')).toBeInTheDocument();

    fireEvent.click(navButtons[0]);
    expect(screen.getByText('June 2025')).toBeInTheDocument();

    fireEvent.click(navButtons[0]);
    expect(screen.getByText('May 2025')).toBeInTheDocument();
  });

  it('switches to month view and selects a month', () => {
    render(<DatePicker value="2025-06-15" onChange={vi.fn()} />);
    fireEvent.click(screen.getByText(/Jun 15/));
    fireEvent.click(screen.getByText('June 2025'));
    expect(screen.getByText('Jan')).toBeInTheDocument();
    expect(screen.getByText('Dec')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Mar'));
    expect(screen.getByText('March 2025')).toBeInTheDocument();
  });

  it('navigates years in month view', () => {
    render(<DatePicker value="2025-06-15" onChange={vi.fn()} />);
    fireEvent.click(screen.getByText(/Jun 15/));
    fireEvent.click(screen.getByText('June 2025'));
    expect(screen.getByText('2025')).toBeInTheDocument();

    const navContainer = screen.getByText('2025').closest('.mb-3');
    const navButtons = navContainer.querySelectorAll('button');
    fireEvent.click(navButtons[navButtons.length - 1]);
    expect(screen.getByText('2026')).toBeInTheDocument();

    fireEvent.click(navButtons[0]);
    expect(screen.getByText('2025')).toBeInTheDocument();
    fireEvent.click(navButtons[0]);
    expect(screen.getByText('2024')).toBeInTheDocument();
  });

  it('switches to year view and selects a year', () => {
    render(<DatePicker value="2025-06-15" onChange={vi.fn()} />);
    fireEvent.click(screen.getByText(/Jun 15/));
    fireEvent.click(screen.getByText('June 2025'));
    fireEvent.click(screen.getByText('2025'));
    expect(screen.getByText(/2020 –/)).toBeInTheDocument();

    const yearBtn = screen.getAllByText('2023').find(el => el.tagName === 'BUTTON' && !el.textContent.includes('–'));
    fireEvent.click(yearBtn);
    expect(screen.getByText('Jan')).toBeInTheDocument();
  });

  it('navigates decades in year view', () => {
    render(<DatePicker value="2025-06-15" onChange={vi.fn()} />);
    fireEvent.click(screen.getByText(/Jun 15/));
    fireEvent.click(screen.getByText('June 2025'));
    fireEvent.click(screen.getByText('2025'));

    const decadeLabel = screen.getByText(/2020 –/);
    const navContainer = decadeLabel.closest('.mb-3');
    const navButtons = navContainer.querySelectorAll('button');

    fireEvent.click(navButtons[navButtons.length - 1]);
    expect(screen.getByText(/2030 – 2041/)).toBeInTheDocument();

    fireEvent.click(navButtons[0]);
    expect(screen.getByText(/2020 – 2031/)).toBeInTheDocument();
  });

  it('disables days outside min/max range', () => {
    const onChange = vi.fn();
    render(<DatePicker value="2025-06-15" onChange={onChange} min="2025-06-10" max="2025-06-20" />);
    fireEvent.click(screen.getByText(/Jun 15/));

    const day5 = screen.getByText('5');
    expect(day5).toBeDisabled();
    fireEvent.click(day5);
    expect(onChange).not.toHaveBeenCalled();

    const day25 = screen.getByText('25');
    expect(day25).toBeDisabled();
  });

  it('disables months outside min/max range in month view', () => {
    render(<DatePicker value="2025-06-15" onChange={vi.fn()} min="2025-04-01" max="2025-08-31" />);
    fireEvent.click(screen.getByText(/Jun 15/));
    fireEvent.click(screen.getByText('June 2025'));

    expect(screen.getByText('Jan')).toBeDisabled();
    expect(screen.getByText('Feb')).toBeDisabled();
    expect(screen.getByText('Oct')).toBeDisabled();
    expect(screen.getByText('Jun')).not.toBeDisabled();
  });

  it('disables years outside min/max range in year view', () => {
    render(<DatePicker value="2025-06-15" onChange={vi.fn()} min="2023-01-01" max="2027-12-31" />);
    fireEvent.click(screen.getByText(/Jun 15/));
    fireEvent.click(screen.getByText('June 2025'));
    fireEvent.click(screen.getByText('2025'));

    expect(screen.getByText('2020')).toBeDisabled();
    expect(screen.getByText('2021')).toBeDisabled();
    expect(screen.getByText('2029')).toBeDisabled();
    expect(screen.getByText('2025')).not.toBeDisabled();
  });

  it('closes dropdown when clicking outside', () => {
    const { container: _container } = render(
      <div>
        <div data-testid="outside">Outside</div>
        <DatePicker value="2025-06-15" onChange={vi.fn()} />
      </div>
    );
    fireEvent.click(screen.getByText(/Jun 15/));
    expect(screen.getByText('Sun')).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByTestId('outside'));
    expect(screen.queryByText('Sun')).not.toBeInTheDocument();
  });

  it('toggles calendar open and closed', () => {
    render(<DatePicker value="2025-06-15" onChange={vi.fn()} />);
    const toggle = screen.getByText(/Jun 15/);
    fireEvent.click(toggle);
    expect(screen.getByText('Sun')).toBeInTheDocument();
    fireEvent.click(toggle);
    expect(screen.queryByText('Sun')).not.toBeInTheDocument();
  });

  it('defaults to current month when no value provided', () => {
    render(<DatePicker value="" onChange={vi.fn()} placeholder="Pick" />);
    fireEvent.click(screen.getByText('Pick'));
    const now = new Date();
    const expected = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  it('year view cycles back to day view when label clicked again', () => {
    render(<DatePicker value="2025-06-15" onChange={vi.fn()} />);
    fireEvent.click(screen.getByText(/Jun 15/));
    fireEvent.click(screen.getByText('June 2025'));
    fireEvent.click(screen.getByText('2025'));
    const decadeLabel = screen.getByText(/2020 –/);
    fireEvent.click(decadeLabel);
    expect(screen.getByText('Sun')).toBeInTheDocument();
  });

  it('wraps from January to December when navigating prev month', () => {
    render(<DatePicker value="2025-01-15" onChange={vi.fn()} />);
    fireEvent.click(screen.getByText(/Jan 15/));
    expect(screen.getByText('January 2025')).toBeInTheDocument();

    const navContainer = screen.getByText('January 2025').closest('.mb-3');
    const navButtons = navContainer.querySelectorAll('button');
    fireEvent.click(navButtons[0]);
    expect(screen.getByText('December 2024')).toBeInTheDocument();
  });

  it('wraps from December to January when navigating next month', () => {
    render(<DatePicker value="2025-12-15" onChange={vi.fn()} />);
    fireEvent.click(screen.getByText(/Dec 15/));
    expect(screen.getByText('December 2025')).toBeInTheDocument();

    const navContainer = screen.getByText('December 2025').closest('.mb-3');
    const navButtons = navContainer.querySelectorAll('button');
    fireEvent.click(navButtons[navButtons.length - 1]);
    expect(screen.getByText('January 2026')).toBeInTheDocument();
  });

  it('highlights selected date in year view', () => {
    render(<DatePicker value="2025-06-15" onChange={vi.fn()} />);
    fireEvent.click(screen.getByText(/Jun 15/));
    fireEvent.click(screen.getByText('June 2025'));
    fireEvent.click(screen.getByText('2025'));
    const year2025 = screen.getByText('2025');
    expect(year2025.className).toContain('bg-orange');
  });
});
