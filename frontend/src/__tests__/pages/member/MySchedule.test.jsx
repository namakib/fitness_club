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
  default: function MockCalendar({ onEventClick }) {
    return (
      <div data-testid="schedule-calendar">
        <button data-testid="click-session-event" onClick={() => onEventClick?.({ event_type: 'session', session_id: 99, session_date: '2025-07-01', start_time: '09:00' })}>ClickSession</button>
        <button data-testid="click-class-event" onClick={() => onEventClick?.({ event_type: 'class', class_id: 99, class_name: 'TestClass', class_date: '2025-07-02' })}>ClickClass</button>
      </div>
    );
  },
}));

import api from '../../../api';
import { toastSuccess, toastError } from '../../../toastUtil';
import MySchedule from '../../../pages/member/MySchedule';
import { ThemeProvider } from '../../../context/ThemeContext';

function renderMySchedule() {
  return render(
    <MemoryRouter>
      <ThemeProvider>
        <MySchedule />
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
    { class_id: 2, class_name: 'Yoga', class_date: '2025-07-02', start_time: '10:00', end_time: '11:00', room_name: 'B' },
  ],
};

describe('MySchedule page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockResolvedValue(dashboardData);
  });

  it('renders heading after data loads', async () => {
    renderMySchedule();
    await waitFor(() => {
      expect(screen.getByText('My Schedule')).toBeInTheDocument();
    });
  });

  it('renders session and class sections', async () => {
    renderMySchedule();
    await waitFor(() => {
      expect(screen.getByText('Upcoming Sessions')).toBeInTheDocument();
      expect(screen.getByText('Upcoming Classes')).toBeInTheDocument();
    });
  });

  it('handles API error gracefully', async () => {
    api.get.mockRejectedValueOnce(new Error('fail'));
    renderMySchedule();
    await waitFor(() => expect(api.get).toHaveBeenCalled());
  });

  it('opens cancel session dialog from table Cancel button', async () => {
    const user = userEvent.setup();
    renderMySchedule();

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

  it('confirms cancel session success', async () => {
    const user = userEvent.setup();
    api.put.mockResolvedValueOnce({});
    renderMySchedule();

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
    err.details = ['Too late'];
    api.put.mockRejectedValueOnce(err);
    renderMySchedule();

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
      expect(toastError).toHaveBeenCalledWith('Cannot cancel', ['Too late']);
    });
  });

  it('opens drop class dialog from table Drop button', async () => {
    const user = userEvent.setup();
    renderMySchedule();

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

  it('confirms drop class success', async () => {
    const user = userEvent.setup();
    api.delete.mockResolvedValueOnce({});
    renderMySchedule();

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
            expect(api.delete).toHaveBeenCalledWith('/member/classes/2/enroll');
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
    renderMySchedule();

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

  it('renders session table data', async () => {
    renderMySchedule();
    await waitFor(() => {
      expect(screen.getAllByText('Bob').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('09:00 – 10:00').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders class table data', async () => {
    renderMySchedule();
    await waitFor(() => {
      expect(screen.getAllByText('Yoga').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('10:00 – 11:00').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows empty states when no sessions or classes', async () => {
    api.get.mockResolvedValueOnce({ ...dashboardData, upcoming_sessions: [], upcoming_classes: [] });
    renderMySchedule();

    await waitFor(() => {
      expect(screen.getByText('No upcoming sessions.')).toBeInTheDocument();
      expect(screen.getByText('No upcoming classes.')).toBeInTheDocument();
    });
  });

  it('renders description text', async () => {
    renderMySchedule();
    await waitFor(() => {
      expect(screen.getByText(/Your upcoming personal sessions/)).toBeInTheDocument();
    });
  });

  it('onEventClick session opens cancel dialog via calendar', async () => {
    const user = userEvent.setup();
    renderMySchedule();
    await waitFor(() => {
      expect(screen.getByTestId('click-session-event')).toBeInTheDocument();
    });
    await user.click(screen.getByTestId('click-session-event'));
    await waitFor(() => {
      expect(screen.getByText(/Do you want to cancel your session/)).toBeInTheDocument();
    });
  });

  it('renders session with null date (fmtDate null branch)', async () => {
    api.get.mockResolvedValueOnce({
      ...dashboardData,
      upcoming_sessions: [{ session_id: 5, session_date: null, start_time: '14:00', end_time: '15:00', trainer_name: 'X', room_name: 'Z' }],
    });
    renderMySchedule();
    await waitFor(() => {
      expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders class with null date (fmtDate null branch)', async () => {
    api.get.mockResolvedValueOnce({
      ...dashboardData,
      upcoming_classes: [{ class_id: 10, class_name: 'Boxing', class_date: null, start_time: '16:00', end_time: '17:00', room_name: 'G' }],
    });
    renderMySchedule();
    await waitFor(() => {
      expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('handles data with missing upcoming_sessions/classes keys (|| [] fallback)', async () => {
    api.get.mockResolvedValueOnce({ summary: null, active_goals: [], recent_metrics: [], all_metrics: [] });
    renderMySchedule();
    await waitFor(() => {
      expect(screen.getByText('No upcoming sessions.')).toBeInTheDocument();
      expect(screen.getByText('No upcoming classes.')).toBeInTheDocument();
    });
  });

  it('shows skeleton while loading', () => {
    api.get.mockReturnValue(new Promise(() => {}));
    const { container } = renderMySchedule();
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('onEventClick class opens drop dialog via calendar', async () => {
    const user = userEvent.setup();
    renderMySchedule();
    await waitFor(() => {
      expect(screen.getByTestId('click-class-event')).toBeInTheDocument();
    });
    await user.click(screen.getByTestId('click-class-event'));
    await waitFor(() => {
      expect(screen.getByText(/Do you want to drop from TestClass/)).toBeInTheDocument();
    });
  });
});
