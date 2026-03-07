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
vi.mock('../../../components/SelectDropdown', () => ({
  default: function MockSelect({ label, value, onChange, options, placeholder }) {
    const testId = `select-${label || placeholder || 'dropdown'}`;
    return (
      <div>
        {label && <label htmlFor={testId}>{label}</label>}
        <select data-testid={testId} id={label ? testId : undefined} value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
          <option value="">{placeholder || 'Select...'}</option>
          {(options || []).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
    );
  },
}));
vi.mock('../../../components/DatePicker', () => ({
  default: function MockDatePicker({ label, value, onChange }) {
    return <input data-testid={`dp-${label}`} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />;
  },
}));
vi.mock('../../../components/TimePicker', () => ({
  default: function MockTimePicker({ label, value, onChange }) {
    return <input data-testid={`tp-${label}`} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />;
  },
}));

import api from '../../../api';
import { toastError, toastSuccess } from '../../../toastUtil';
import RoomBooking from '../../../pages/admin/RoomBooking';
import { ThemeProvider } from '../../../context/ThemeContext';

function renderRoomBooking() {
  return render(
    <MemoryRouter>
      <ThemeProvider>
        <RoomBooking />
      </ThemeProvider>
    </MemoryRouter>
  );
}

const mockData = {
  rooms: [{ room_id: 1, room_name: 'Room A' }],
  members: [{ member_id: 1, name: 'Alice', email: 'alice@test.com' }],
  trainers: [{ trainer_id: 1, name: 'Bob', specialization: 'Strength' }],
  bookings: [
    {
      room_name: 'Room A', booking_type: 'Personal Session', event_date: '2025-07-10',
      start_time: '09:00', end_time: '10:00', participant: 'Alice', trainer_name: 'Bob', status: 'scheduled',
    },
    {
      room_name: 'Room A', booking_type: 'Group Class', event_date: '2025-07-11',
      start_time: '14:00', end_time: '15:00', participant: 'Yoga', trainer_name: 'Bob', status: 'scheduled',
    },
  ],
};

describe('Admin RoomBooking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockResolvedValue(mockData);
    api.post.mockResolvedValue({});
  });

  it('renders Room Booking heading', async () => {
    renderRoomBooking();
    await waitFor(() => {
      expect(screen.getByText('Room Booking')).toBeInTheDocument();
    });
  });

  it('renders Personal Session and Group Class tabs', async () => {
    renderRoomBooking();
    await waitFor(() => {
      expect(screen.getAllByText('Personal Session').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Group Class').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('fetches room booking data on mount', async () => {
    renderRoomBooking();
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/admin/room-booking');
    });
  });

  it('renders booking table with data', async () => {
    renderRoomBooking();
    await waitFor(() => {
      expect(screen.getByText('Room Schedule')).toBeInTheDocument();
      expect(screen.getAllByText('Alice').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders booking type badge', async () => {
    renderRoomBooking();
    await waitFor(() => {
      expect(screen.getAllByText('Personal Session').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('formats dates in booking table', async () => {
    renderRoomBooking();
    await waitFor(() => {
      expect(screen.getAllByText('Jul 10, 2025').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('switches to Group Class tab', async () => {
    const user = userEvent.setup();
    renderRoomBooking();
    await waitFor(() => {
      expect(screen.getAllByText('Group Class').length).toBeGreaterThanOrEqual(1);
    });

    const tabBtn = screen.getAllByText('Group Class').find(el => el.tagName === 'BUTTON' && !el.closest('table'));
    await user.click(tabBtn);
    await waitFor(() => {
      expect(screen.getByText('Schedule Class')).toBeInTheDocument();
    });
  });

  it('switches back to Personal Session tab', async () => {
    const user = userEvent.setup();
    renderRoomBooking();
    await waitFor(() => {
      expect(screen.getAllByText('Group Class').length).toBeGreaterThanOrEqual(1);
    });

    await user.click(screen.getAllByText('Group Class')[0]);
    await screen.findByText('Schedule Class');
    await user.click(screen.getAllByText('Personal Session')[0]);
    await waitFor(() => {
      expect(screen.getAllByText('Book Session').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('fills and submits session form successfully', async () => {
    const user = userEvent.setup();
    renderRoomBooking();
    await waitFor(() => {
      expect(screen.getByText('Book Session')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId('select-Member'), { target: { value: '1' } });
    fireEvent.change(screen.getByTestId('select-Trainer'), { target: { value: '1' } });
    fireEvent.change(screen.getByTestId('select-Room'), { target: { value: '1' } });
    fireEvent.change(screen.getByTestId('dp-Date'), { target: { value: '2025-08-01' } });
    fireEvent.change(screen.getByTestId('tp-Start Time'), { target: { value: '09:00' } });
    fireEvent.change(screen.getByTestId('tp-End Time'), { target: { value: '10:00' } });

    await user.click(screen.getByText('Book Session'));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/admin/room-booking/session', {
        member_id: '1',
        trainer_id: '1',
        room_id: '1',
        session_date: '2025-08-01',
        start_time: '09:00',
        end_time: '10:00',
      });
      expect(toastSuccess).toHaveBeenCalledWith('Session booked.');
    });
  });

  it('handles session form submit error', async () => {
    const user = userEvent.setup();
    api.post.mockRejectedValueOnce({ message: 'Conflict', details: 'room busy' });
    renderRoomBooking();
    await waitFor(() => {
      expect(screen.getByText('Book Session')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId('select-Member'), { target: { value: '1' } });
    fireEvent.change(screen.getByTestId('dp-Date'), { target: { value: '2025-08-01' } });
    fireEvent.change(screen.getByTestId('tp-Start Time'), { target: { value: '09:00' } });
    fireEvent.change(screen.getByTestId('tp-End Time'), { target: { value: '10:00' } });

    await user.click(screen.getByText('Book Session'));

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('Conflict', 'room busy');
    });
  });

  it('fills and submits class form successfully', async () => {
    const user = userEvent.setup();
    renderRoomBooking();
    await waitFor(() => {
      expect(screen.getAllByText('Group Class').length).toBeGreaterThanOrEqual(1);
    });

    await user.click(screen.getAllByText('Group Class')[0]);
    await screen.findByText('Schedule Class');

    const classNameInput = screen.getByText('Class Name').closest('div').querySelector('input');
    fireEvent.change(classNameInput, { target: { value: 'Yoga Flow' } });
    fireEvent.change(screen.getByTestId('select-Trainer'), { target: { value: '1' } });
    fireEvent.change(screen.getByTestId('select-Room'), { target: { value: '1' } });
    fireEvent.change(screen.getByTestId('dp-Date'), { target: { value: '2025-08-05' } });
    fireEvent.change(screen.getByTestId('tp-Start Time'), { target: { value: '14:00' } });
    fireEvent.change(screen.getByTestId('tp-End Time'), { target: { value: '15:00' } });

    const maxInput = screen.getByRole('spinbutton');
    fireEvent.change(maxInput, { target: { value: '20' } });

    await user.click(screen.getByText('Schedule Class'));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/admin/room-booking/class', {
        class_name: 'Yoga Flow',
        trainer_id: '1',
        room_id: '1',
        class_date: '2025-08-05',
        start_time: '14:00',
        end_time: '15:00',
        max_participants: '20',
      });
      expect(toastSuccess).toHaveBeenCalledWith('Class scheduled.');
    });
  });

  it('handles class form submit error', async () => {
    const user = userEvent.setup();
    api.post.mockRejectedValueOnce({ message: 'Class error', details: 'invalid' });
    renderRoomBooking();
    await waitFor(() => {
      expect(screen.getAllByText('Group Class').length).toBeGreaterThanOrEqual(1);
    });

    await user.click(screen.getAllByText('Group Class')[0]);
    await screen.findByText('Schedule Class');

    const classNameInput = screen.getByText('Class Name').closest('div').querySelector('input');
    fireEvent.change(classNameInput, { target: { value: 'Spin' } });
    fireEvent.change(screen.getByTestId('dp-Date'), { target: { value: '2025-08-05' } });
    fireEvent.change(screen.getByTestId('tp-Start Time'), { target: { value: '10:00' } });
    fireEvent.change(screen.getByTestId('tp-End Time'), { target: { value: '11:00' } });

    const maxInput = screen.getByRole('spinbutton');
    fireEvent.change(maxInput, { target: { value: '15' } });

    await user.click(screen.getByText('Schedule Class'));

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('Class error', 'invalid');
    });
  });

  it('resets session form after successful submit', async () => {
    const user = userEvent.setup();
    renderRoomBooking();
    await waitFor(() => {
      expect(screen.getAllByText('Book Session').length).toBeGreaterThanOrEqual(1);
    });

    fireEvent.change(screen.getByTestId('select-Member'), { target: { value: '1' } });
    fireEvent.change(screen.getByTestId('dp-Date'), { target: { value: '2025-08-01' } });
    fireEvent.change(screen.getByTestId('tp-Start Time'), { target: { value: '09:00' } });
    fireEvent.change(screen.getByTestId('tp-End Time'), { target: { value: '10:00' } });

    await user.click(screen.getAllByText('Book Session')[0]);

    await waitFor(() => {
      expect(toastSuccess).toHaveBeenCalledWith('Session booked.');
    });

    expect(screen.getByTestId('dp-Date').value).toBe('');
  });

  it('shows skeleton while loading', () => {
    api.get.mockReturnValue(new Promise(() => {}));
    const { container } = renderRoomBooking();
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('handles API error gracefully', async () => {
    api.get.mockRejectedValueOnce(new Error('fail'));
    renderRoomBooking();
    await waitFor(() => {
      expect(screen.getByText('Room Booking')).toBeInTheDocument();
    });
    expect(screen.getByText('No bookings found.')).toBeInTheDocument();
  });

  it('shows dash for null event date', async () => {
    api.get.mockResolvedValueOnce({
      ...mockData,
      bookings: [{
        room_name: 'R', booking_type: 'Personal Session', event_date: null,
        start_time: '09:00', end_time: '10:00', participant: 'X', trainer_name: 'Y', status: 'scheduled',
      }],
    });
    renderRoomBooking();
    await waitFor(() => {
      expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows Booking... text while session form is submitting', async () => {
    const user = userEvent.setup();
    api.post.mockReturnValue(new Promise(() => {}));
    renderRoomBooking();
    await waitFor(() => {
      expect(screen.getByText('Book Session')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId('dp-Date'), { target: { value: '2025-08-01' } });
    fireEvent.change(screen.getByTestId('tp-Start Time'), { target: { value: '09:00' } });
    fireEvent.change(screen.getByTestId('tp-End Time'), { target: { value: '10:00' } });

    await user.click(screen.getByText('Book Session'));
    expect(screen.getByText('Booking...')).toBeInTheDocument();
  });

  it('shows Scheduling... text while class form is submitting', async () => {
    const user = userEvent.setup();
    api.post.mockReturnValue(new Promise(() => {}));
    renderRoomBooking();
    await waitFor(() => {
      expect(screen.getAllByText('Group Class').length).toBeGreaterThanOrEqual(1);
    });

    await user.click(screen.getAllByText('Group Class')[0]);
    await screen.findByText('Schedule Class');

    const classNameInput = screen.getByText('Class Name').closest('div').querySelector('input');
    fireEvent.change(classNameInput, { target: { value: 'Spin' } });
    fireEvent.change(screen.getByTestId('dp-Date'), { target: { value: '2025-08-05' } });
    fireEvent.change(screen.getByTestId('tp-Start Time'), { target: { value: '10:00' } });
    fireEvent.change(screen.getByTestId('tp-End Time'), { target: { value: '11:00' } });

    const maxInput = screen.getByRole('spinbutton');
    fireEvent.change(maxInput, { target: { value: '15' } });

    await user.click(screen.getByText('Schedule Class'));
    expect(screen.getByText('Scheduling...')).toBeInTheDocument();
  });
});
