import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../../api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));
vi.mock('../../../toastUtil', () => ({
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));
vi.mock('../../../components/DatePicker', () => ({
  default: function MockDatePicker({ label, value, onChange, ...rest }) {
    return <input data-testid={`dp-${label}`} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />;
  },
}));
vi.mock('../../../components/TimePicker', () => ({
  default: function MockTimePicker({ label, value, onChange, ...rest }) {
    return <input data-testid={`tp-${label}`} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />;
  },
}));
vi.mock('../../../components/ScheduleCalendar', () => ({
  default: function MockCalendar({ loadEvents, renderEventModal }) {
    const modal = renderEventModal({ id: 1, type: 'session' }, () => {}, () => {});
    return (
      <div data-testid="schedule-calendar">
        <button data-testid="trigger-load-events" onClick={() => loadEvents(new Date('2025-07-07'))}>LoadEvents</button>
        <button data-testid="trigger-load-cross-month" onClick={() => loadEvents(new Date('2025-07-28'))}>CrossMonth</button>
        {modal}
      </div>
    );
  },
}));
vi.mock('../../../components/EventEditForm', () => ({
  default: function MockEditForm({ onRoomsLoad, onSaved }) {
    return (
      <div data-testid="event-edit-form">
        <button data-testid="trigger-load-rooms" onClick={onRoomsLoad}>LoadRooms</button>
        <button data-testid="trigger-save-event" onClick={onSaved}>SaveEvent</button>
      </div>
    );
  },
}));

import api from '../../../api';
import { toastError, toastSuccess } from '../../../toastUtil';
import Availability from '../../../pages/trainer/Availability';
import { ThemeProvider } from '../../../context/ThemeContext';

function renderAvailability() {
  return render(
    <MemoryRouter>
      <ThemeProvider>
        <Availability />
      </ThemeProvider>
    </MemoryRouter>
  );
}

const slotsData = {
  slots: [
    { availability_id: 1, available_date: '2025-07-07', start_time: '09:00', end_time: '17:00' },
  ],
};

describe('Trainer Availability', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockImplementation((path) => {
      if (path === '/trainer/availability') return Promise.resolve(slotsData);
      if (path.includes('rooms')) return Promise.resolve({ rooms: [{ room_id: 1, room_name: 'Room A' }] });
      if (path.includes('calendar')) return Promise.resolve({ sessions: [], classes: [] });
      return Promise.resolve({});
    });
    api.post.mockResolvedValue({});
    api.delete.mockResolvedValue({});
  });

  it('renders availability heading', async () => {
    renderAvailability();
    await waitFor(() => {
      expect(screen.getByText('Availability')).toBeInTheDocument();
    });
  });

  it('fetches availability on mount', async () => {
    renderAvailability();
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/trainer/availability');
    });
  });

  it('renders Add Time Slot heading', async () => {
    renderAvailability();
    await waitFor(() => {
      expect(screen.getByText('Add Time Slot')).toBeInTheDocument();
    });
  });

  it('renders slot data in table', async () => {
    renderAvailability();
    await waitFor(() => {
      expect(screen.getAllByText('09:00').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('17:00').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('fills form fields and submits successfully', async () => {
    const user = userEvent.setup();
    renderAvailability();
    await waitFor(() => {
      expect(screen.getByText('Add Time Slot')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId('dp-Date'), { target: { value: '2025-08-01' } });
    fireEvent.change(screen.getByTestId('tp-Start'), { target: { value: '10:00' } });
    fireEvent.change(screen.getByTestId('tp-End'), { target: { value: '18:00' } });
    await user.click(screen.getByText('Add Slot'));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/trainer/availability', {
        available_date: '2025-08-01',
        start_time: '10:00',
        end_time: '18:00',
      });
      expect(toastSuccess).toHaveBeenCalledWith('Slot added.');
    });
  });

  it('handles add slot form submit error', async () => {
    const user = userEvent.setup();
    api.post.mockRejectedValueOnce({ message: 'Overlap', details: 'conflict' });
    renderAvailability();
    await waitFor(() => {
      expect(screen.getByText('Add Time Slot')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId('dp-Date'), { target: { value: '2025-08-01' } });
    fireEvent.change(screen.getByTestId('tp-Start'), { target: { value: '10:00' } });
    fireEvent.change(screen.getByTestId('tp-End'), { target: { value: '18:00' } });
    await user.click(screen.getByText('Add Slot'));

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('Overlap', 'conflict');
    });
  });

  it('opens delete dialog and confirms deletion', async () => {
    const user = userEvent.setup();
    renderAvailability();
    await waitFor(() => {
      expect(screen.getAllByText('Remove').length).toBeGreaterThanOrEqual(1);
    });

    const tableRemoveButtons = screen.getAllByText('Remove');
    await user.click(tableRemoveButtons[0]);
    await screen.findByText('Are you sure you want to remove this availability slot?');

    const allRemoveButtons = screen.getAllByRole('button', { name: /^Remove$/ });
    await user.click(allRemoveButtons[allRemoveButtons.length - 1]);

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/trainer/availability/1');
      expect(toastSuccess).toHaveBeenCalledWith('Slot removed.');
    });
  });

  it('handles delete slot error', async () => {
    const user = userEvent.setup();
    api.delete.mockRejectedValueOnce({ message: 'Cannot delete', details: 'booked' });
    renderAvailability();
    await waitFor(() => {
      expect(screen.getAllByText('Remove').length).toBeGreaterThanOrEqual(1);
    });

    const tableRemoveButtons = screen.getAllByText('Remove');
    await user.click(tableRemoveButtons[0]);
    await screen.findByText('Are you sure you want to remove this availability slot?');

    const allRemoveButtons = screen.getAllByRole('button', { name: /^Remove$/ });
    await user.click(allRemoveButtons[allRemoveButtons.length - 1]);

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('Cannot delete', 'booked');
    });
  });

  it('cancels delete dialog', async () => {
    const user = userEvent.setup();
    renderAvailability();
    await waitFor(() => {
      expect(screen.getAllByText('Remove').length).toBeGreaterThanOrEqual(1);
    });

    const tableRemoveButtons = screen.getAllByText('Remove');
    await user.click(tableRemoveButtons[0]);
    await screen.findByText('Are you sure you want to remove this availability slot?');
    await user.click(screen.getByText('Cancel'));

    await waitFor(() => {
      expect(api.delete).not.toHaveBeenCalled();
    });
  });

  it('loads calendar events (same month)', async () => {
    const user = userEvent.setup();
    renderAvailability();
    await waitFor(() => {
      expect(screen.getByTestId('trigger-load-events')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('trigger-load-events'));
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/trainer/calendar?year=2025&month=7');
    });
  });

  it('loads calendar events (cross-month boundary)', async () => {
    const user = userEvent.setup();
    renderAvailability();
    await waitFor(() => {
      expect(screen.getByTestId('trigger-load-cross-month')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('trigger-load-cross-month'));
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/trainer/calendar?year=2025&month=7');
      expect(api.get).toHaveBeenCalledWith('/trainer/calendar?year=2025&month=8');
    });
  });

  it('loads rooms via event edit form', async () => {
    const user = userEvent.setup();
    renderAvailability();
    await waitFor(() => {
      expect(screen.getByTestId('trigger-load-rooms')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('trigger-load-rooms'));
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/trainer/rooms');
    });
  });

  it('triggers event save which reloads slots', async () => {
    const user = userEvent.setup();
    renderAvailability();
    await waitFor(() => {
      expect(screen.getByTestId('trigger-save-event')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('trigger-save-event'));
    await waitFor(() => {
      const availCalls = api.get.mock.calls.filter(c => c[0] === '/trainer/availability');
      expect(availCalls.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('handles rooms load error', async () => {
    api.get.mockImplementation((path) => {
      if (path === '/trainer/availability') return Promise.resolve(slotsData);
      if (path.includes('rooms')) return Promise.reject(new Error('rooms fail'));
      if (path.includes('calendar')) return Promise.resolve({ sessions: [], classes: [] });
      return Promise.resolve({});
    });
    const user = userEvent.setup();
    renderAvailability();
    await waitFor(() => {
      expect(screen.getByTestId('trigger-load-rooms')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('trigger-load-rooms'));
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/trainer/rooms');
    });
  });

  it('handles availability load error', async () => {
    api.get.mockImplementation((path) => {
      if (path === '/trainer/availability') return Promise.reject(new Error('fail'));
      if (path.includes('calendar')) return Promise.resolve({ sessions: [], classes: [] });
      return Promise.resolve({});
    });
    renderAvailability();
    await waitFor(() => {
      expect(screen.getByText('No availability slots set.')).toBeInTheDocument();
    });
  });

  it('formats dates in slot table', async () => {
    renderAvailability();
    await waitFor(() => {
      expect(screen.getAllByText(/Jul/).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows dash for null date in fmtDate', async () => {
    api.get.mockImplementation((path) => {
      if (path === '/trainer/availability') return Promise.resolve({
        slots: [{ availability_id: 2, available_date: null, start_time: '08:00', end_time: '12:00' }],
      });
      if (path.includes('calendar')) return Promise.resolve({ sessions: [], classes: [] });
      return Promise.resolve({});
    });
    renderAvailability();
    await waitFor(() => {
      expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('handles rooms load error gracefully', async () => {
    api.get.mockImplementation((path) => {
      if (path === '/trainer/availability') return Promise.resolve(slotsData);
      if (path.includes('rooms')) return Promise.reject(new Error('rooms fail'));
      if (path.includes('calendar')) return Promise.resolve({ sessions: [], classes: [] });
      return Promise.resolve({});
    });
    renderAvailability();
    await waitFor(() => {
      expect(screen.getByText('Availability')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('trigger-load-rooms'));
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/trainer/rooms');
    });
  });

  it('handles rooms response without rooms key (|| [] fallback)', async () => {
    api.get.mockImplementation((path) => {
      if (path === '/trainer/availability') return Promise.resolve(slotsData);
      if (path.includes('rooms')) return Promise.resolve({});
      if (path.includes('calendar')) return Promise.resolve({ sessions: [], classes: [] });
      return Promise.resolve({});
    });
    renderAvailability();
    await waitFor(() => {
      expect(screen.getByTestId('trigger-load-rooms')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('trigger-load-rooms'));
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/trainer/rooms');
    });
  });

  it('handles calendar response without sessions/classes keys', async () => {
    api.get.mockImplementation((path) => {
      if (path === '/trainer/availability') return Promise.resolve(slotsData);
      if (path.includes('calendar')) return Promise.resolve({});
      return Promise.resolve({});
    });
    renderAvailability();
    await waitFor(() => {
      expect(screen.getByTestId('trigger-load-events')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('trigger-load-events'));
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(expect.stringContaining('/trainer/calendar'));
    });
  });

  it('triggers onSaved callback from event edit form', async () => {
    renderAvailability();
    await waitFor(() => {
      expect(screen.getByTestId('trigger-save-event')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('trigger-save-event'));
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/trainer/availability');
    });
  });
});
