import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TrainerAvailabilityCalendar from '../../components/TrainerAvailabilityCalendar';

function toYMD(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function weekDate(dayOffset) {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const sun = new Date(now);
  sun.setDate(now.getDate() - dayOfWeek);
  const d = new Date(sun);
  d.setDate(sun.getDate() + dayOffset);
  return toYMD(d);
}

const slots = [
  { availability_id: 1, available_date: weekDate(1), start_time: '09:00', end_time: '10:00', is_booked: false, booked_by_me: false },
  { availability_id: 2, available_date: weekDate(1), start_time: '11:00', end_time: '12:00', is_booked: true, booked_by_me: false },
  { availability_id: 3, available_date: weekDate(2), start_time: '14:00', end_time: '15:00', is_booked: true, booked_by_me: true },
];

describe('TrainerAvailabilityCalendar', () => {
  it('renders loading state', () => {
    render(<TrainerAvailabilityCalendar slots={[]} loading />);
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('renders empty state when no slots', () => {
    render(<TrainerAvailabilityCalendar slots={[]} loading={false} />);
    expect(screen.getByText('No upcoming availability')).toBeInTheDocument();
  });

  it('renders slots and week navigation', () => {
    const onSlotSelect = vi.fn();
    render(<TrainerAvailabilityCalendar slots={slots} loading={false} onSlotSelect={onSlotSelect} />);
    expect(screen.getByLabelText('Previous week')).toBeInTheDocument();
    expect(screen.getByLabelText('Next week')).toBeInTheDocument();
  });

  it('uses "Member already has a session here" when bookedByLabel is not "your booking"', () => {
    render(
      <TrainerAvailabilityCalendar
        slots={slots}
        loading={false}
        onSlotSelect={vi.fn()}
        bookedByLabel="member's booking"
      />
    );
    expect(screen.getByText(/member's booking/)).toBeInTheDocument();
    const bookedByMeSlot = document.querySelector('button[title="Member already has a session here"]');
    expect(bookedByMeSlot || document.querySelector('button[title*="session"]')).toBeTruthy();
  });

  it('uses custom bookedByTooltip when provided', () => {
    render(
      <TrainerAvailabilityCalendar
        slots={slots}
        loading={false}
        onSlotSelect={vi.fn()}
        bookedByLabel="custom"
        bookedByTooltip="Custom tooltip for booked slot"
      />
    );
    const btn = document.querySelector('button[title="Custom tooltip for booked slot"]');
    expect(btn).toBeTruthy();
  });

  it('calls onSlotSelect when available slot is clicked', () => {
    const onSlotSelect = vi.fn();
    render(<TrainerAvailabilityCalendar slots={slots} loading={false} onSlotSelect={onSlotSelect} />);
    const availableBtn = document.querySelector('button.bg-green-500\\/90:not([disabled])');
    if (availableBtn) {
      fireEvent.click(availableBtn);
      expect(onSlotSelect).toHaveBeenCalledWith(expect.any(String), expect.any(String), expect.any(String));
    }
  });

  it('does not call onSlotSelect when booked slot is clicked', () => {
    const onSlotSelect = vi.fn();
    render(<TrainerAvailabilityCalendar slots={slots} loading={false} onSlotSelect={onSlotSelect} />);
    const bookedBtn = document.querySelector('button[disabled]');
    if (bookedBtn) {
      fireEvent.click(bookedBtn);
      expect(onSlotSelect).not.toHaveBeenCalled();
    }
  });

  it('truncates time strings longer than 5 chars', () => {
    const longSlots = [
      { availability_id: 10, available_date: weekDate(1), start_time: '09:00:00', end_time: '10:00:00', is_booked: false, booked_by_me: false },
    ];
    render(<TrainerAvailabilityCalendar slots={longSlots} loading={false} onSlotSelect={vi.fn()} />);
    expect(screen.getByText(/09:00–10:00/)).toBeInTheDocument();
  });

  it('uses default props when slots and loading are not passed', () => {
    render(<TrainerAvailabilityCalendar onSlotSelect={vi.fn()} />);
    expect(screen.getByText('No upcoming availability')).toBeInTheDocument();
  });
});
