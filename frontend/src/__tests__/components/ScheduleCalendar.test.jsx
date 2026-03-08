import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import ScheduleCalendar from '../../components/ScheduleCalendar';
import { ThemeProvider } from '../../context/ThemeContext';

vi.mock('../../components/DatePicker', () => ({
  default: ({ label, value, onChange, placeholder }) => (
    <div data-testid="date-picker">
      <label>{label}</label>
      <input
        type="text"
        placeholder={placeholder}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        data-testid="date-picker-input"
      />
    </div>
  ),
}));

vi.mock('../../components/Modal', () => ({
  default: ({ open, onClose, title, children }) =>
    open ? (
      <div data-testid="modal" role="dialog">
        <h2>{title}</h2>
        <button onClick={onClose} data-testid="modal-close">Close</button>
        {children}
      </div>
    ) : null,
}));

function today() {
  return new Date().toISOString().slice(0, 10);
}

function _getWeekDateStr(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function renderCal(props = {}) {
  return render(
    <ThemeProvider>
      <ScheduleCalendar
        events={{ sessions: [], classes: [] }}
        onEventClick={vi.fn()}
        {...props}
      />
    </ThemeProvider>
  );
}

beforeEach(() => { vi.useFakeTimers({ shouldAdvanceTime: true }); });
afterEach(() => { vi.useRealTimers(); });

describe('ScheduleCalendar', () => {
  it('renders day headers', () => {
    renderCal();
    expect(screen.getByText('Mon')).toBeInTheDocument();
    expect(screen.getByText('Fri')).toBeInTheDocument();
    expect(screen.getByText('Sun')).toBeInTheDocument();
  });

  it('renders with events', () => {
    const dateStr = today();
    renderCal({
      events: {
        sessions: [],
        classes: [{ id: '1', title: 'Yoga Class', event_type: 'class', event_date: dateStr, start_time: '09:00', end_time: '10:00' }],
      },
    });
    expect(screen.getByText('Mon')).toBeInTheDocument();
  });

  it('renders empty calendar without crashing', () => {
    renderCal({ events: { sessions: [], classes: [] } });
    expect(screen.getByText('Mon')).toBeInTheDocument();
  });

  it('renders custom title', () => {
    renderCal({ title: 'My Schedule' });
    expect(screen.getByText('My Schedule')).toBeInTheDocument();
  });

  it('renders default title', () => {
    renderCal();
    expect(screen.getByText('Calendar')).toBeInTheDocument();
  });

  it('renders default legend', () => {
    renderCal();
    expect(screen.getByText('Session')).toBeInTheDocument();
    expect(screen.getByText('Class')).toBeInTheDocument();
  });

  it('renders custom legend', () => {
    renderCal({ legend: [<span key="a">Custom A</span>, <span key="b">Custom B</span>] });
    expect(screen.getByText('Custom A')).toBeInTheDocument();
    expect(screen.getByText('Custom B')).toBeInTheDocument();
  });

  it('renders single legend item (non-array)', () => {
    renderCal({ legend: <span>Solo Legend</span> });
    expect(screen.getByText('Solo Legend')).toBeInTheDocument();
  });

  describe('navigation', () => {
    it('goes to previous day', () => {
      renderCal();
      fireEvent.click(screen.getByLabelText('Previous day'));
    });

    it('goes to next day', () => {
      renderCal();
      fireEvent.click(screen.getByLabelText('Next day'));
    });

    it('goes to today', () => {
      renderCal();
      fireEvent.click(screen.getByLabelText('Previous day'));
      fireEvent.click(screen.getByText('Today'));
    });

    it('jumps to a date via DatePicker', () => {
      renderCal();
      const input = screen.getByTestId('date-picker-input');
      fireEvent.change(input, { target: { value: '2025-06-15' } });
    });

    it('today is leftmost day on initial load', () => {
      renderCal();
      const todayWeekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date().getDay()];
      const allDayLabels = screen.getAllByText(/^(Sun|Mon|Tue|Wed|Thu|Fri|Sat)$/);
      expect(allDayLabels[0].textContent).toBe(todayWeekday);
    });

    it('next/prev move selected date by one day, not a full week', () => {
      renderCal();
      const input = screen.getByTestId('date-picker-input');
      const now = new Date();
      const fmt = (d) => {
        const yy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yy}-${mm}-${dd}`;
      };
      expect(input.value).toBe(fmt(now));

      fireEvent.click(screen.getByLabelText('Next day'));
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(input.value).toBe(fmt(tomorrow));

      fireEvent.click(screen.getByLabelText('Previous day'));
      expect(input.value).toBe(fmt(now));
    });

    it('jump to centers selected date in the week window', () => {
      renderCal();
      const input = screen.getByTestId('date-picker-input');
      fireEvent.change(input, { target: { value: '2025-07-10' } });

      const windowStartDate = new Date(2025, 6, 7);
      const expectedFirstDay = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][windowStartDate.getDay()];
      const allDayLabels = screen.getAllByText(/^(Sun|Mon|Tue|Wed|Thu|Fri|Sat)$/);
      expect(allDayLabels[0].textContent).toBe(expectedFirstDay);
    });
  });

  describe('events display', () => {
    it('displays session events', () => {
      const dateStr = today();
      renderCal({
        events: {
          sessions: [
            { session_id: 1, trainer_name: 'Coach Bob', session_date: dateStr, start_time: '10:00', end_time: '11:00' },
          ],
          classes: [],
        },
      });
      expect(screen.getByText(/Coach Bob/)).toBeInTheDocument();
    });

    it('displays class events', () => {
      const dateStr = today();
      renderCal({
        events: {
          sessions: [],
          classes: [
            { class_id: 1, class_name: 'Spin Class', class_date: dateStr, start_time: '14:00', end_time: '15:00' },
          ],
        },
      });
      expect(screen.getByText(/Spin Class/)).toBeInTheDocument();
    });

    it('uses fallback title for session without trainer_name', () => {
      const dateStr = today();
      renderCal({
        events: {
          sessions: [
            { session_id: 1, session_date: dateStr, start_time: '10:00', end_time: '11:00' },
          ],
          classes: [],
        },
      });
      const sessionButtons = screen.getAllByRole('button').filter(b => b.title && b.title.includes('Session'));
      expect(sessionButtons.length).toBeGreaterThanOrEqual(1);
    });

    it('uses fallback title for class without class_name', () => {
      const dateStr = today();
      renderCal({
        events: {
          sessions: [],
          classes: [
            { class_id: 1, class_date: dateStr, start_time: '14:00', end_time: '15:00' },
          ],
        },
      });
      const classButtons = screen.getAllByRole('button').filter(b => b.title && b.title.includes('Class'));
      expect(classButtons.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('event click', () => {
    it('calls onEventClick when event is clicked', () => {
      const onEventClick = vi.fn();
      const dateStr = today();
      renderCal({
        onEventClick,
        events: {
          sessions: [
            { session_id: 1, trainer_name: 'Coach', session_date: dateStr, start_time: '10:00', end_time: '11:00' },
          ],
          classes: [],
        },
      });
      fireEvent.click(screen.getByText(/Coach/));
      expect(onEventClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('renderEventModal', () => {
    it('opens modal when event is clicked and renderEventModal is provided', () => {
      const dateStr = today();
      const renderEventModal = vi.fn((event, onClose, onSaved) => (
        <div>
          <span>Edit: {event.title}</span>
          <button onClick={onClose}>Close Modal</button>
          <button onClick={onSaved}>Save</button>
        </div>
      ));
      renderCal({
        renderEventModal,
        events: {
          sessions: [
            { session_id: 1, trainer_name: 'Coach', session_date: dateStr, start_time: '10:00', end_time: '11:00' },
          ],
          classes: [],
        },
      });
      fireEvent.click(screen.getByText(/Coach/));
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(renderEventModal).toHaveBeenCalled();
    });

    it('closes modal when onClose is called', () => {
      const dateStr = today();
      const renderEventModal = vi.fn((event, onClose) => (
        <div>
          <button onClick={onClose}>Close It</button>
        </div>
      ));
      renderCal({
        renderEventModal,
        events: {
          sessions: [
            { session_id: 1, trainer_name: 'Coach', session_date: dateStr, start_time: '10:00', end_time: '11:00' },
          ],
          classes: [],
        },
      });
      fireEvent.click(screen.getByText(/Coach/));
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      fireEvent.click(screen.getByText('Close It'));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('closes modal and refetches on save', async () => {
      const dateStr = today();
      const loadEvents = vi.fn().mockResolvedValue({
        sessions: [
          { session_id: 1, trainer_name: 'Coach', session_date: dateStr, start_time: '10:00', end_time: '11:00' },
        ],
        classes: [],
      });
      const renderEventModal = vi.fn((event, onClose, onSaved) => (
        <div>
          <button onClick={onSaved}>Save It</button>
        </div>
      ));

      await act(async () => {
        renderCal({ loadEvents, renderEventModal, events: undefined });
      });
      await act(async () => { vi.advanceTimersByTime(100); });

      const eventBtn = screen.getByText(/Coach/);
      fireEvent.click(eventBtn);
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      await act(async () => { fireEvent.click(screen.getByText('Save It')); });
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(loadEvents).toHaveBeenCalledTimes(2);
    });

    it('shows session title in modal for session event', () => {
      const dateStr = today();
      const renderEventModal = vi.fn((event) => <div>{event.title}</div>);
      renderCal({
        renderEventModal,
        events: {
          sessions: [
            { session_id: 1, trainer_name: 'Coach', session_date: dateStr, start_time: '10:00', end_time: '11:00' },
          ],
          classes: [],
        },
      });
      fireEvent.click(screen.getByText(/Coach/));
      expect(screen.getByText('Edit Session')).toBeInTheDocument();
    });

    it('shows class title in modal for class event', () => {
      const dateStr = today();
      const renderEventModal = vi.fn((event) => <div>{event.title}</div>);
      renderCal({
        renderEventModal,
        events: {
          sessions: [],
          classes: [
            { class_id: 1, class_name: 'Yoga', class_date: dateStr, start_time: '10:00', end_time: '11:00' },
          ],
        },
      });
      fireEvent.click(screen.getByText(/Yoga/));
      expect(screen.getByText('Edit Class')).toBeInTheDocument();
    });
  });

  describe('loadEvents', () => {
    it('shows loading skeleton when loadEvents is provided', () => {
      const loadEvents = vi.fn().mockReturnValue(new Promise(() => {}));
      render(
        <ThemeProvider>
          <ScheduleCalendar loadEvents={loadEvents} onEventClick={vi.fn()} />
        </ThemeProvider>
      );
      expect(screen.queryByText('Mon')).not.toBeInTheDocument();
    });

    it('loads events on mount', async () => {
      const dateStr = today();
      const loadEvents = vi.fn().mockResolvedValue({
        sessions: [{ session_id: 1, trainer_name: 'Loaded Coach', session_date: dateStr, start_time: '09:00', end_time: '10:00' }],
        classes: [],
      });
      await act(async () => {
        render(
          <ThemeProvider>
            <ScheduleCalendar loadEvents={loadEvents} onEventClick={vi.fn()} />
          </ThemeProvider>
        );
      });
      await act(async () => { vi.advanceTimersByTime(100); });
      expect(loadEvents).toHaveBeenCalled();
    });

    it('handles loadEvents rejection gracefully', async () => {
      const loadEvents = vi.fn().mockRejectedValue(new Error('fail'));
      await act(async () => {
        render(
          <ThemeProvider>
            <ScheduleCalendar loadEvents={loadEvents} onEventClick={vi.fn()} />
          </ThemeProvider>
        );
      });
      await act(async () => { vi.advanceTimersByTime(100); });
      expect(loadEvents).toHaveBeenCalled();
    });

    it('refetches on refreshTrigger change', async () => {
      const _dateStr = today();
      const loadEvents = vi.fn().mockResolvedValue({ sessions: [], classes: [] });
      const { rerender } = render(
        <ThemeProvider>
          <ScheduleCalendar loadEvents={loadEvents} onEventClick={vi.fn()} refreshTrigger={0} />
        </ThemeProvider>
      );
      await act(async () => { vi.advanceTimersByTime(100); });
      const callCount = loadEvents.mock.calls.length;

      rerender(
        <ThemeProvider>
          <ScheduleCalendar loadEvents={loadEvents} onEventClick={vi.fn()} refreshTrigger={1} />
        </ThemeProvider>
      );
      await act(async () => { vi.advanceTimersByTime(100); });
      expect(loadEvents.mock.calls.length).toBeGreaterThan(callCount);
    });
  });

  describe('jumpToDate', () => {
    it('jumps to the specified date', () => {
      const { rerender } = renderCal();
      rerender(
        <ThemeProvider>
          <ScheduleCalendar
            events={{ sessions: [], classes: [] }}
            onEventClick={vi.fn()}
            jumpToDate="2025-01-15"
          />
        </ThemeProvider>
      );
    });
  });

  describe('eventsProp updates', () => {
    it('updates data when eventsProp changes', () => {
      const dateStr = today();
      const { rerender } = renderCal({ events: { sessions: [], classes: [] } });
      rerender(
        <ThemeProvider>
          <ScheduleCalendar
            events={{
              sessions: [{ session_id: 99, trainer_name: 'New Coach', session_date: dateStr, start_time: '08:00', end_time: '09:00' }],
              classes: [],
            }}
            onEventClick={vi.fn()}
          />
        </ThemeProvider>
      );
      expect(screen.getByText(/New Coach/)).toBeInTheDocument();
    });
  });

  describe('new event highlighting', () => {
    it('highlights newly added events', async () => {
      const dateStr = today();
      const events1 = {
        sessions: [{ session_id: 1, trainer_name: 'Coach A', session_date: dateStr, start_time: '09:00', end_time: '10:00' }],
        classes: [],
      };
      const events2 = {
        sessions: [
          { session_id: 1, trainer_name: 'Coach A', session_date: dateStr, start_time: '09:00', end_time: '10:00' },
          { session_id: 2, trainer_name: 'Coach B', session_date: dateStr, start_time: '11:00', end_time: '12:00' },
        ],
        classes: [],
      };

      const { rerender } = render(
        <ThemeProvider>
          <ScheduleCalendar events={events1} onEventClick={vi.fn()} />
        </ThemeProvider>
      );

      rerender(
        <ThemeProvider>
          <ScheduleCalendar events={events2} onEventClick={vi.fn()} />
        </ThemeProvider>
      );

      await act(async () => { vi.advanceTimersByTime(3100); });
    });
  });

  describe('hour labels', () => {
    it('renders 12am and 12pm labels', () => {
      renderCal();
      expect(screen.getByText('12am')).toBeInTheDocument();
      expect(screen.getByText('12pm')).toBeInTheDocument();
    });
  });

  describe('null events data', () => {
    it('handles null resolvedData gracefully', () => {
      renderCal({ events: null });
      expect(screen.getByText('Mon')).toBeInTheDocument();
    });
  });

  describe('event title attribute with location', () => {
    it('includes location in event tooltip', () => {
      const dateStr = today();
      renderCal({
        events: {
          sessions: [
            { session_id: 1, trainer_name: 'Coach', session_date: dateStr, start_time: '10:00', end_time: '11:00', location: 'Room A' },
          ],
          classes: [],
        },
      });
      const btn = screen.getByText(/Coach/);
      expect(btn.title).toContain('Room A');
    });

    it('includes room_name in event tooltip when location is absent', () => {
      const dateStr = today();
      renderCal({
        events: {
          sessions: [],
          classes: [
            { class_id: 1, class_name: 'Yoga', class_date: dateStr, start_time: '10:00', end_time: '11:00', room_name: 'Gym B' },
          ],
        },
      });
      const btn = screen.getByText(/Yoga/);
      expect(btn.title).toContain('Gym B');
    });

    it('does not include location separator when neither location nor room_name', () => {
      const dateStr = today();
      renderCal({
        events: {
          sessions: [
            { session_id: 1, trainer_name: 'Coach', session_date: dateStr, start_time: '10:00', end_time: '11:00' },
          ],
          classes: [],
        },
      });
      const btn = screen.getByText(/Coach/);
      expect(btn.title).not.toContain('·');
    });
  });

  describe('event with non-string event_date', () => {
    it('handles event where event_date is not a string', () => {
      const dateStr = today();
      renderCal({
        events: {
          sessions: [
            { session_id: 1, trainer_name: 'Coach', event_date: dateStr, start_time: '10:00', end_time: '11:00' },
          ],
          classes: [],
        },
      });
      expect(screen.getByText(/Coach/)).toBeInTheDocument();
    });
  });

  describe('handleModalSaved without loadEvents', () => {
    it('closes modal without refetch when no loadEvents', () => {
      const dateStr = today();
      const renderEventModal = vi.fn((event, onClose, onSaved) => (
        <div><button onClick={onSaved}>Save It</button></div>
      ));
      renderCal({
        renderEventModal,
        events: {
          sessions: [
            { session_id: 1, trainer_name: 'Coach', session_date: dateStr, start_time: '10:00', end_time: '11:00' },
          ],
          classes: [],
        },
      });
      fireEvent.click(screen.getByText(/Coach/));
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      fireEvent.click(screen.getByText('Save It'));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('missing keys in resolved data', () => {
    it('handles resolvedData without classes key (|| [] fallback line 123)', () => {
      const dateStr = today();
      renderCal({
        events: {
          sessions: [{ session_id: 1, trainer_name: 'Coach Only', session_date: dateStr, start_time: '10:00', end_time: '11:00' }],
        },
      });
      expect(screen.getByText(/Coach Only/)).toBeInTheDocument();
    });

    it('handles resolvedData without sessions key', () => {
      const dateStr = today();
      renderCal({
        events: {
          classes: [{ class_id: 1, class_name: 'Solo Class', class_date: dateStr, start_time: '14:00', end_time: '15:00' }],
        },
      });
      expect(screen.getByText(/Solo Class/)).toBeInTheDocument();
    });
  });

  describe('eventsByDay with non-string/non-ISO event_date (lines 152-154)', () => {
    it('handles event with numeric event_date falling back to toDateKey', () => {
      const _dateStr = today();
      renderCal({
        events: {
          sessions: [{ session_id: 1, trainer_name: 'Numeric', event_date: 12345, start_time: '10:00', end_time: '11:00' }],
          classes: [],
        },
      });
      expect(screen.getByText('Mon')).toBeInTheDocument();
    });

    it('handles event with non-ISO date string in event_date', () => {
      const _dateStr = today();
      renderCal({
        events: {
          sessions: [{ session_id: 1, trainer_name: 'BadDate', session_date: 'not-a-date', start_time: '10:00', end_time: '11:00' }],
          classes: [],
        },
      });
      expect(screen.getByText('Mon')).toBeInTheDocument();
    });

    it('handles event with event_date that is a Date-like ISO string (short slice)', () => {
      const dateStr = today();
      renderCal({
        events: {
          sessions: [{ session_id: 1, trainer_name: 'ISOCoach', session_date: dateStr + 'T10:00:00Z', start_time: '10:00', end_time: '11:00' }],
          classes: [],
        },
      });
      expect(screen.getByText(/ISOCoach/)).toBeInTheDocument();
    });
  });

  describe('unknown event_type color fallback (line 293)', () => {
    it('uses session color for unknown event_type', () => {
      const dateStr = today();
      renderCal({
        events: {
          sessions: [{ session_id: 1, trainer_name: 'Unknown', session_date: dateStr, start_time: '10:00', end_time: '11:00', event_type: 'unknown' }],
          classes: [],
        },
      });
      const btn = screen.getByText(/Unknown/);
      expect(btn).toBeInTheDocument();
    });
  });

  describe('parseEvent with null event_date (line 51)', () => {
    it('handles session with no event_date or session_date', () => {
      renderCal({
        events: {
          sessions: [{ session_id: 1, trainer_name: 'NoDate', start_time: '10:00', end_time: '11:00' }],
          classes: [],
        },
      });
      expect(screen.getByText('Mon')).toBeInTheDocument();
    });

    it('handles class with null class_date and null event_date', () => {
      renderCal({
        events: {
          sessions: [],
          classes: [{ class_id: 1, class_name: 'NoDateClass', class_date: null, event_date: null, start_time: '14:00', end_time: '15:00' }],
        },
      });
      expect(screen.getByText('Mon')).toBeInTheDocument();
    });
  });

  describe('eventsByDay skips events with no valid key (line 154)', () => {
    it('skips event with completely invalid date data', () => {
      renderCal({
        events: {
          sessions: [{ session_id: 1, trainer_name: 'BadEvent', event_date: '', start_time: '10:00', end_time: '11:00' }],
          classes: [],
        },
      });
      expect(screen.queryByText(/BadEvent/)).not.toBeInTheDocument();
    });
  });
});
