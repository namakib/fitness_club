import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ScheduleCalendar from '../../components/ScheduleCalendar';
import { ThemeProvider } from '../../context/ThemeContext';

function renderCal(props = {}) {
  return render(
    <ThemeProvider>
      <ScheduleCalendar
        events={[]}
        onEventClick={vi.fn()}
        {...props}
      />
    </ThemeProvider>
  );
}

describe('ScheduleCalendar', () => {
  it('renders day headers', () => {
    renderCal();
    expect(screen.getByText('Mon')).toBeInTheDocument();
    expect(screen.getByText('Fri')).toBeInTheDocument();
    expect(screen.getByText('Sun')).toBeInTheDocument();
  });

  it('renders with events', () => {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10);
    renderCal({
      events: [
        { id: '1', title: 'Yoga Class', event_type: 'class', event_date: dateStr, start_time: '09:00', end_time: '10:00' },
      ],
    });
    expect(screen.getByText('Mon')).toBeInTheDocument();
  });

  it('renders empty calendar without crashing', () => {
    renderCal({ events: [] });
    expect(screen.getByText('Mon')).toBeInTheDocument();
  });
});
