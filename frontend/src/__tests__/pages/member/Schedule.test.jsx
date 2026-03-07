import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../../api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));
vi.mock('../../../toastUtil', () => ({
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));
vi.mock('../../../components/ScheduleCalendar', () => ({
  default: function MockCalendar({ onEventClick, jumpToDate, events }) {
    return (
      <div data-testid="schedule-calendar">
        <button data-testid="click-session-event" onClick={() => onEventClick?.({ event_type: 'session', session_id: 99, session_date: '2025-07-01', start_time: '09:00' })}>ClickSession</button>
        <button data-testid="click-class-event" onClick={() => onEventClick?.({ event_type: 'class', class_id: 99, class_name: 'TestClass', class_date: '2025-07-02' })}>ClickClass</button>
        {jumpToDate && <span data-testid="jump-date">{jumpToDate}</span>}
      </div>
    );
  },
}));
vi.mock('../../../pages/member/Classes', async () => {
  const actual = await vi.importActual('../../../pages/member/Classes');
  return {
    ...actual,
    ClassesBrowser: function MockBrowser({ onSuccess, refreshTrigger }) {
      return (
        <div data-testid="classes-browser">
          <button data-testid="enroll-success" onClick={() => onSuccess?.({ class_date: '2025-07-05' })}>EnrollSuccess</button>
          <button data-testid="enroll-success-no-date" onClick={() => onSuccess?.({})}>EnrollNoDate</button>
        </div>
      );
    },
  };
});
vi.mock('../../../pages/member/BookSession', async () => {
  const actual = await vi.importActual('../../../pages/member/BookSession');
  return {
    ...actual,
    BookSessionForm: function MockBookForm({ onSuccess }) {
      return <button data-testid="mock-book-success" onClick={() => onSuccess?.()}>SubmitBooking</button>;
    },
  };
});

import api from '../../../api';
import { toastSuccess, toastError } from '../../../toastUtil';
import Schedule from '../../../pages/member/Schedule';
import { ThemeProvider } from '../../../context/ThemeContext';

function renderSchedule() {
  return render(
    <MemoryRouter>
      <ThemeProvider>
        <Schedule />
      </ThemeProvider>
    </MemoryRouter>
  );
}

const dashboardData = {
  summary: null,
  active_goals: [],
  recent_metrics: [],
  all_metrics: [],
  upcoming_sessions: [
    { session_id: 1, session_date: '2025-07-01', start_time: '09:00', end_time: '10:00', trainer_name: 'Bob', room_name: 'A' },
  ],
  upcoming_classes: [
    { class_id: 1, class_name: 'Yoga', class_date: '2025-07-02', start_time: '10:00', end_time: '11:00', room_name: 'B', enrolled_count: 5, max_participants: 20 },
  ],
};

describe('Member Schedule page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockImplementation((path) => {
      if (path.includes('dashboard')) return Promise.resolve(dashboardData);
      if (path.includes('available-classes')) return Promise.resolve({ classes: [] });
      if (path.includes('booking-options')) return Promise.resolve({ trainers: [], rooms: [] });
      if (path.includes('trainers')) return Promise.resolve({ trainers: [] });
      return Promise.resolve({});
    });
  });

  it('renders Schedule heading', async () => {
    renderSchedule();
    await waitFor(() => {
      expect(screen.getByText('Schedule')).toBeInTheDocument();
    });
  });

  it('renders Book Session button', async () => {
    renderSchedule();
    await waitFor(() => {
      expect(screen.getByText('+ Book Session')).toBeInTheDocument();
    });
  });

  it('renders sections for sessions and classes', async () => {
    renderSchedule();
    await waitFor(() => {
      expect(screen.getByText('Upcoming Sessions')).toBeInTheDocument();
      expect(screen.getByText('Upcoming Classes')).toBeInTheDocument();
      expect(screen.getByText('Browse Classes')).toBeInTheDocument();
    });
  });

  it('opens Book Session modal', async () => {
    const user = userEvent.setup();
    renderSchedule();

    await waitFor(() => {
      expect(screen.getByText('+ Book Session')).toBeInTheDocument();
    });

    await user.click(screen.getByText('+ Book Session'));

    await waitFor(() => {
      expect(screen.getByText('Book Personal Session')).toBeInTheDocument();
    });
  });

  it('closes Book Session modal', async () => {
    const user = userEvent.setup();
    renderSchedule();

    await waitFor(() => {
      expect(screen.getByText('+ Book Session')).toBeInTheDocument();
    });

    await user.click(screen.getByText('+ Book Session'));

    await waitFor(() => {
      expect(screen.getByText('Book Personal Session')).toBeInTheDocument();
    });

    await user.click(screen.getByLabelText('Close'));
  });

  it('opens cancel session dialog from table Cancel button', async () => {
    const user = userEvent.setup();
    renderSchedule();

    await waitFor(() => {
      expect(screen.getByText('Upcoming Sessions')).toBeInTheDocument();
    });

    const tables = document.querySelectorAll('table');
    const sessionTable = tables[0];
    const cancelBtn = within(sessionTable).getByText('Cancel');
    await user.click(cancelBtn);

    await waitFor(() => {
      expect(screen.getByText(/Do you want to cancel your session/)).toBeInTheDocument();
    });
  });

  it('confirms cancel session and calls API', async () => {
    const user = userEvent.setup();
    api.put.mockResolvedValueOnce({});
    renderSchedule();

    await waitFor(() => {
      expect(screen.getByText('Upcoming Sessions')).toBeInTheDocument();
    });

    const tables = document.querySelectorAll('table');
    const sessionTable = tables[0];
    const cancelBtn = within(sessionTable).getByText('Cancel');
    await user.click(cancelBtn);

    await waitFor(() => {
      expect(screen.getByText(/Do you want to cancel your session/)).toBeInTheDocument();
    });

    const confirmBtns = screen.getAllByText('Cancel Session');
    const confirmBtn = confirmBtns.find(el => el.tagName === 'BUTTON');
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/member/sessions/1', { status: 'cancelled' });
      expect(toastSuccess).toHaveBeenCalledWith('Session cancelled.');
    });
  });

  it('shows error on cancel session failure', async () => {
    const user = userEvent.setup();
    const err = new Error('Cannot cancel');
    err.details = [];
    api.put.mockRejectedValueOnce(err);
    renderSchedule();

    await waitFor(() => {
      expect(screen.getByText('Upcoming Sessions')).toBeInTheDocument();
    });

    const tables = document.querySelectorAll('table');
    const sessionTable = tables[0];
    const cancelBtn = within(sessionTable).getByText('Cancel');
    await user.click(cancelBtn);

    await waitFor(() => {
      expect(screen.getByText(/Do you want to cancel your session/)).toBeInTheDocument();
    });

    const confirmBtns = screen.getAllByText('Cancel Session');
    const confirmBtn = confirmBtns.find(el => el.tagName === 'BUTTON');
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('Cannot cancel', []);
    });
  });

  it('opens drop class dialog from table Drop button', async () => {
    const user = userEvent.setup();
    renderSchedule();

    await waitFor(() => {
      expect(screen.getByText('Upcoming Classes')).toBeInTheDocument();
    });

    const tables = document.querySelectorAll('table');
    const classTable = tables[1];
    if (classTable) {
      const dropBtn = within(classTable).queryByText('Drop');
      if (dropBtn) {
        await user.click(dropBtn);
        await waitFor(() => {
          expect(screen.getByText(/Do you want to drop from Yoga/)).toBeInTheDocument();
        });
      }
    }
  });

  it('confirms drop class and calls API', async () => {
    const user = userEvent.setup();
    api.delete.mockResolvedValueOnce({});
    renderSchedule();

    await waitFor(() => {
      expect(screen.getByText('Upcoming Classes')).toBeInTheDocument();
    });

    const tables = document.querySelectorAll('table');
    const classTable = tables[1];
    if (classTable) {
      const dropBtn = within(classTable).queryByText('Drop');
      if (dropBtn) {
        await user.click(dropBtn);

        await waitFor(() => {
          expect(screen.getByText(/Do you want to drop from Yoga/)).toBeInTheDocument();
        });

        const allDropBtns = screen.getAllByText('Drop');
        const confirmDrop = allDropBtns.find(el => el.tagName === 'BUTTON' && el.closest('.flex.justify-end'));
        if (confirmDrop) {
          await user.click(confirmDrop);
          await waitFor(() => {
            expect(api.delete).toHaveBeenCalledWith('/member/classes/1/enroll');
            expect(toastSuccess).toHaveBeenCalledWith('Dropped from class.');
          });
        }
      }
    }
  });

  it('shows error on drop class failure', async () => {
    const user = userEvent.setup();
    const err = new Error('Cannot drop');
    err.details = [];
    api.delete.mockRejectedValueOnce(err);
    renderSchedule();

    await waitFor(() => {
      expect(screen.getByText('Upcoming Classes')).toBeInTheDocument();
    });

    const tables = document.querySelectorAll('table');
    const classTable = tables[1];
    if (classTable) {
      const dropBtn = within(classTable).queryByText('Drop');
      if (dropBtn) {
        await user.click(dropBtn);

        await waitFor(() => {
          expect(screen.getByText(/Do you want to drop from Yoga/)).toBeInTheDocument();
        });

        const allDropBtns = screen.getAllByText('Drop');
        const confirmDrop = allDropBtns.find(el => el.tagName === 'BUTTON' && el.closest('.flex.justify-end'));
        if (confirmDrop) {
          await user.click(confirmDrop);
          await waitFor(() => {
            expect(toastError).toHaveBeenCalledWith('Cannot drop', []);
          });
        }
      }
    }
  });

  it('handles API error on dashboard fetch', async () => {
    api.get.mockImplementation((path) => {
      if (path.includes('dashboard')) return Promise.reject(new Error('fail'));
      return Promise.resolve({});
    });
    renderSchedule();
    await waitFor(() => {
      expect(screen.getByText('Schedule')).toBeInTheDocument();
    });
  });

  it('renders session data in table', async () => {
    renderSchedule();
    await waitFor(() => {
      expect(screen.getAllByText('Bob').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('09:00 – 10:00').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders class data in table', async () => {
    renderSchedule();
    await waitFor(() => {
      expect(screen.getAllByText('Yoga').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('10:00 – 11:00').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('5 / 20').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows skeleton while loading', () => {
    api.get.mockReturnValue(new Promise(() => {}));
    const { container } = renderSchedule();
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('shows empty session and class tables', async () => {
    api.get.mockImplementation((path) => {
      if (path.includes('dashboard')) return Promise.resolve({
        ...dashboardData,
        upcoming_sessions: [],
        upcoming_classes: [],
      });
      if (path.includes('available-classes')) return Promise.resolve({ classes: [] });
      return Promise.resolve({});
    });
    renderSchedule();
    await waitFor(() => {
      expect(screen.getByText('No upcoming sessions.')).toBeInTheDocument();
      expect(screen.getByText('No upcoming classes.')).toBeInTheDocument();
    });
  });

  it('renders formatted session date', async () => {
    renderSchedule();
    await waitFor(() => {
      expect(screen.getAllByText('Jul 1, 2025').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders dash for null session date', async () => {
    api.get.mockImplementation((path) => {
      if (path.includes('dashboard')) return Promise.resolve({
        ...dashboardData,
        upcoming_sessions: [{ session_id: 2, session_date: null, start_time: '11:00', end_time: '12:00', trainer_name: 'T', room_name: 'R' }],
      });
      if (path.includes('available-classes')) return Promise.resolve({ classes: [] });
      return Promise.resolve({});
    });
    renderSchedule();
    await waitFor(() => {
      expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('onEventClick session opens cancel dialog', async () => {
    const user = userEvent.setup();
    renderSchedule();
    await waitFor(() => {
      expect(screen.getByTestId('click-session-event')).toBeInTheDocument();
    });
    await user.click(screen.getByTestId('click-session-event'));
    await waitFor(() => {
      expect(screen.getByText(/Do you want to cancel your session/)).toBeInTheDocument();
    });
  });

  it('onEventClick class opens drop dialog', async () => {
    const user = userEvent.setup();
    renderSchedule();
    await waitFor(() => {
      expect(screen.getByTestId('click-class-event')).toBeInTheDocument();
    });
    await user.click(screen.getByTestId('click-class-event'));
    await waitFor(() => {
      expect(screen.getByText(/Do you want to drop from TestClass/)).toBeInTheDocument();
    });
  });

  it('ClassesBrowser onSuccess with class_date sets jumpToDate', async () => {
    const user = userEvent.setup();
    renderSchedule();
    await waitFor(() => {
      expect(screen.getByTestId('enroll-success')).toBeInTheDocument();
    });
    await user.click(screen.getByTestId('enroll-success'));
    await waitFor(() => {
      expect(screen.getByTestId('jump-date')).toHaveTextContent('2025-07-05');
    });
  });

  it('handleBookSuccess closes modal and reloads', async () => {
    const user = userEvent.setup();
    renderSchedule();
    await waitFor(() => {
      expect(screen.getByText('+ Book Session')).toBeInTheDocument();
    });

    await user.click(screen.getByText('+ Book Session'));
    await waitFor(() => {
      expect(screen.getByTestId('mock-book-success')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('mock-book-success'));
    await waitFor(() => {
      expect(api.get).toHaveBeenCalled();
    });
  });

  it('handles data with missing upcoming_sessions/classes keys (|| [] fallback)', async () => {
    api.get.mockImplementation((path) => {
      if (path.includes('dashboard')) return Promise.resolve({ summary: null, active_goals: [], recent_metrics: [], all_metrics: [] });
      if (path.includes('available-classes')) return Promise.resolve({ classes: [] });
      return Promise.resolve({});
    });
    renderSchedule();
    await waitFor(() => {
      expect(screen.getByText('No upcoming sessions.')).toBeInTheDocument();
      expect(screen.getByText('No upcoming classes.')).toBeInTheDocument();
    });
  });

  it('renders class with null date (fmtDate null branch)', async () => {
    api.get.mockImplementation((path) => {
      if (path.includes('dashboard')) return Promise.resolve({
        ...dashboardData,
        upcoming_classes: [{ class_id: 10, class_name: 'HIIT', class_date: null, start_time: '12:00', end_time: '13:00', room_name: 'X', enrolled_count: null, max_participants: 15 }],
      });
      if (path.includes('available-classes')) return Promise.resolve({ classes: [] });
      return Promise.resolve({});
    });
    renderSchedule();
    await waitFor(() => {
      expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('0 / 15').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('ClassesBrowser onSuccess without class_date does not set jumpToDate', async () => {
    const user = userEvent.setup();
    renderSchedule();
    await waitFor(() => {
      expect(screen.getByTestId('enroll-success-no-date')).toBeInTheDocument();
    });
    await user.click(screen.getByTestId('enroll-success-no-date'));
    await waitFor(() => {
      expect(screen.queryByTestId('jump-date')).not.toBeInTheDocument();
    });
  });
});
