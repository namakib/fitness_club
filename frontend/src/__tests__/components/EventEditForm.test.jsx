import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';

vi.mock('../../api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));
vi.mock('../../toastUtil', () => ({
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));
vi.mock('../../components/DatePicker', () => ({
  default: ({ label, value, onChange }) => <input data-testid={`dp-${label}`} value={value ?? ''} onChange={e => onChange(e.target.value)} />,
}));
vi.mock('../../components/TimePicker', () => ({
  default: ({ label, value, onChange }) => <input data-testid={`tp-${label}`} value={value ?? ''} onChange={e => onChange(e.target.value)} />,
}));
vi.mock('../../components/SelectDropdown', () => ({
  default: ({ label, value, onChange, options, placeholder }) => (
    <select data-testid={`sel-${label || placeholder}`} value={value ?? ''} onChange={e => onChange(e.target.value)}>
      <option value="">{placeholder || 'Select'}</option>
      {(options || []).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  ),
}));
vi.mock('../../components/NumberInput', () => ({
  default: ({ label, value, onChange, ...rest }) => (
    <div>{label && <label>{label}</label>}<input data-testid={`num-${label}`} type="number" value={value ?? ''} onChange={onChange} {...rest} /></div>
  ),
}));

import api from '../../api';
import { toastError, toastSuccess } from '../../toastUtil';
import EventEditForm from '../../components/EventEditForm';

const sessionEvent = {
  event_type: 'session',
  session_id: 1,
  event_date: '2025-06-15',
  start_time: '09:00',
  end_time: '10:00',
  room_id: 1,
  title: 'John Doe',
};

const classEvent = {
  event_type: 'class',
  class_id: 2,
  event_date: '2025-06-16',
  start_time: '14:00',
  end_time: '15:00',
  room_id: 2,
  title: 'Yoga',
  max_participants: 20,
};

const rooms = [
  { room_id: 1, room_name: 'Room A' },
  { room_id: 2, room_name: 'Room B' },
];

describe('EventEditForm', () => {
  const onClose = vi.fn();
  const onSaved = vi.fn();
  const onRoomsLoad = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    api.put.mockResolvedValue({});
    api.delete.mockResolvedValue({});
  });

  afterEach(() => { vi.useRealTimers(); });

  it('renders session form fields', () => {
    render(
      <EventEditForm event={sessionEvent} onClose={onClose} onSaved={onSaved} rooms={rooms} onRoomsLoad={onRoomsLoad} />
    );
    expect(screen.getByText('Personal Session')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Save Changes')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('calls onRoomsLoad on mount', () => {
    render(
      <EventEditForm event={sessionEvent} onClose={onClose} onSaved={onSaved} rooms={rooms} onRoomsLoad={onRoomsLoad} />
    );
    expect(onRoomsLoad).toHaveBeenCalled();
  });

  it('calls onClose on Cancel', () => {
    render(
      <EventEditForm event={sessionEvent} onClose={onClose} onSaved={onSaved} rooms={rooms} onRoomsLoad={onRoomsLoad} />
    );
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();
  });

  it('opens confirm dialog on Delete click', async () => {
    render(
      <EventEditForm event={sessionEvent} onClose={onClose} onSaved={onSaved} rooms={rooms} onRoomsLoad={onRoomsLoad} />
    );
    fireEvent.click(screen.getByText('Delete'));
    await act(() => vi.advanceTimersByTime(100));
    expect(screen.getByText(/Are you sure you want to delete this session/)).toBeInTheDocument();
  });

  it('renders class form with extra fields', () => {
    render(
      <EventEditForm event={classEvent} onClose={onClose} onSaved={onSaved} rooms={rooms} onRoomsLoad={onRoomsLoad} />
    );
    expect(screen.getByText('Group Class')).toBeInTheDocument();
    expect(screen.getByText('Class Name')).toBeInTheDocument();
    expect(screen.getByText('Max Participants')).toBeInTheDocument();
  });

  it('submits session update successfully', async () => {
    render(
      <EventEditForm event={sessionEvent} onClose={onClose} onSaved={onSaved} rooms={rooms} onRoomsLoad={onRoomsLoad} />
    );

    await act(async () => {
      fireEvent.click(screen.getByText('Save Changes'));
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(api.put).toHaveBeenCalledWith('/trainer/sessions/1', expect.objectContaining({
      session_date: '2025-06-15',
      start_time: '09:00',
      end_time: '10:00',
    }));
    expect(toastSuccess).toHaveBeenCalledWith('Session updated.');
    expect(onSaved).toHaveBeenCalled();
  });

  it('submits class update successfully', async () => {
    render(
      <EventEditForm event={classEvent} onClose={onClose} onSaved={onSaved} rooms={rooms} onRoomsLoad={onRoomsLoad} />
    );

    await act(async () => {
      fireEvent.click(screen.getByText('Save Changes'));
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(api.put).toHaveBeenCalledWith('/trainer/classes/2', expect.objectContaining({
      class_date: '2025-06-16',
      start_time: '14:00',
      end_time: '15:00',
    }));
    expect(toastSuccess).toHaveBeenCalledWith('Class updated.');
    expect(onSaved).toHaveBeenCalled();
  });

  it('shows error toast when session update fails', async () => {
    api.put.mockRejectedValueOnce({ message: 'Server error', details: 'details' });

    render(
      <EventEditForm event={sessionEvent} onClose={onClose} onSaved={onSaved} rooms={rooms} onRoomsLoad={onRoomsLoad} />
    );

    await act(async () => {
      fireEvent.click(screen.getByText('Save Changes'));
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(toastError).toHaveBeenCalledWith('Server error', 'details');
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('shows "Saving..." while submit is in progress', async () => {
    let resolvePromise;
    api.put.mockReturnValueOnce(new Promise(r => { resolvePromise = r; }));

    render(
      <EventEditForm event={sessionEvent} onClose={onClose} onSaved={onSaved} rooms={rooms} onRoomsLoad={onRoomsLoad} />
    );

    await act(async () => {
      fireEvent.click(screen.getByText('Save Changes'));
    });

    expect(screen.getByText('Saving...')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeDisabled();

    await act(async () => {
      resolvePromise({});
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(screen.getByText('Save Changes')).toBeInTheDocument();
  });

  it('confirms and deletes a session successfully', async () => {
    render(
      <EventEditForm event={sessionEvent} onClose={onClose} onSaved={onSaved} rooms={rooms} onRoomsLoad={onRoomsLoad} />
    );

    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);
    await act(() => vi.advanceTimersByTime(100));

    const allDeleteBtns = screen.getAllByText('Delete');
    const confirmDeleteBtn = allDeleteBtns[allDeleteBtns.length - 1];

    await act(async () => {
      fireEvent.click(confirmDeleteBtn);
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(api.delete).toHaveBeenCalledWith('/trainer/sessions/1');
    expect(toastSuccess).toHaveBeenCalledWith('Session deleted.');
    expect(onSaved).toHaveBeenCalled();
  });

  it('confirms and deletes a class successfully', async () => {
    render(
      <EventEditForm event={classEvent} onClose={onClose} onSaved={onSaved} rooms={rooms} onRoomsLoad={onRoomsLoad} />
    );

    fireEvent.click(screen.getByText('Delete'));
    await act(() => vi.advanceTimersByTime(100));

    const deleteButtons = screen.getAllByText('Delete');
    const confirmDeleteBtn = deleteButtons[deleteButtons.length - 1];

    await act(async () => {
      fireEvent.click(confirmDeleteBtn);
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(api.delete).toHaveBeenCalledWith('/trainer/classes/2');
    expect(toastSuccess).toHaveBeenCalledWith('Class deleted.');
    expect(onSaved).toHaveBeenCalled();
  });

  it('shows error toast when session delete fails', async () => {
    api.delete.mockRejectedValueOnce({ message: 'Delete error', details: 'delete details' });

    render(
      <EventEditForm event={sessionEvent} onClose={onClose} onSaved={onSaved} rooms={rooms} onRoomsLoad={onRoomsLoad} />
    );

    fireEvent.click(screen.getByText('Delete'));
    await act(() => vi.advanceTimersByTime(100));

    const deleteButtons = screen.getAllByText('Delete');
    const confirmDeleteBtn = deleteButtons[deleteButtons.length - 1];

    await act(async () => {
      fireEvent.click(confirmDeleteBtn);
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(toastError).toHaveBeenCalledWith('Delete error', 'delete details');
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('handles event with Date object for event_date', () => {
    const dateObj = new Date('2025-07-01T12:00:00');
    const event = {
      ...sessionEvent,
      event_date: dateObj,
      date: dateObj,
    };
    render(
      <EventEditForm event={event} onClose={onClose} onSaved={onSaved} rooms={rooms} onRoomsLoad={onRoomsLoad} />
    );
    expect(screen.getByText('Personal Session')).toBeInTheDocument();
  });

  it('handles event without date helpers gracefully', () => {
    const event = {
      ...sessionEvent,
      event_date: undefined,
      date: undefined,
    };
    render(
      <EventEditForm event={event} onClose={onClose} onSaved={onSaved} rooms={rooms} onRoomsLoad={onRoomsLoad} />
    );
    expect(screen.getByText('Personal Session')).toBeInTheDocument();
  });

  it('changes date via DatePicker', () => {
    render(
      <EventEditForm event={sessionEvent} onClose={onClose} onSaved={onSaved} rooms={rooms} onRoomsLoad={onRoomsLoad} />
    );
    fireEvent.change(screen.getByTestId('dp-Date'), { target: { value: '2025-07-01' } });
    expect(screen.getByTestId('dp-Date').value).toBe('2025-07-01');
  });

  it('changes start and end times', () => {
    render(
      <EventEditForm event={sessionEvent} onClose={onClose} onSaved={onSaved} rooms={rooms} onRoomsLoad={onRoomsLoad} />
    );
    fireEvent.change(screen.getByTestId('tp-Start'), { target: { value: '10:00' } });
    fireEvent.change(screen.getByTestId('tp-End'), { target: { value: '11:00' } });
    expect(screen.getByTestId('tp-Start').value).toBe('10:00');
    expect(screen.getByTestId('tp-End').value).toBe('11:00');
  });

  it('changes room via SelectDropdown', () => {
    render(
      <EventEditForm event={sessionEvent} onClose={onClose} onSaved={onSaved} rooms={rooms} onRoomsLoad={onRoomsLoad} />
    );
    fireEvent.change(screen.getByTestId('sel-Room'), { target: { value: '2' } });
    expect(screen.getByTestId('sel-Room').value).toBe('2');
  });

  it('changes class name and max participants for class event', () => {
    render(
      <EventEditForm event={classEvent} onClose={onClose} onSaved={onSaved} rooms={rooms} onRoomsLoad={onRoomsLoad} />
    );
    const classInput = screen.getByDisplayValue('Yoga');
    fireEvent.change(classInput, { target: { value: 'Pilates' } });
    expect(classInput.value).toBe('Pilates');

    fireEvent.change(screen.getByTestId('num-Max Participants'), { target: { value: '30' } });
    expect(screen.getByTestId('num-Max Participants').value).toBe('30');
  });

  it('initializes form with fallbacks for missing start_time/end_time/room_id', () => {
    const event = { event_type: 'session', session_id: 5, event_date: '2025-08-01', title: 'Test' };
    render(<EventEditForm event={event} onClose={onClose} onSaved={onSaved} rooms={rooms} onRoomsLoad={onRoomsLoad} />);
    expect(screen.getByTestId('tp-Start').value).toBe('');
    expect(screen.getByTestId('tp-End').value).toBe('');
    expect(screen.getByTestId('sel-Room').value).toBe('');
  });

  it('submits class with empty room_id, class_name, and max_participants (undefined fallbacks)', async () => {
    const emptyClass = { event_type: 'class', class_id: 10, event_date: '2025-09-01', start_time: '08:00', end_time: '09:00', title: '' };
    render(<EventEditForm event={emptyClass} onClose={onClose} onSaved={onSaved} rooms={rooms} onRoomsLoad={onRoomsLoad} />);

    await act(async () => { fireEvent.click(screen.getByText('Save Changes')); });
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });

    expect(api.put).toHaveBeenCalledWith('/trainer/classes/10', expect.objectContaining({
      class_date: '2025-09-01',
      start_time: '08:00',
      end_time: '09:00',
    }));
    const payload = api.put.mock.calls[0][1];
    expect(payload.room_id).toBeUndefined();
    expect(payload.class_name).toBeUndefined();
    expect(payload.max_participants).toBeUndefined();
  });

  it('shows error when class submit fails', async () => {
    api.put.mockRejectedValueOnce({ message: 'Class error', details: ['invalid'] });
    render(<EventEditForm event={classEvent} onClose={onClose} onSaved={onSaved} rooms={rooms} onRoomsLoad={onRoomsLoad} />);

    await act(async () => { fireEvent.click(screen.getByText('Save Changes')); });
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });

    expect(toastError).toHaveBeenCalledWith('Class error', ['invalid']);
  });

  it('submits session with empty room_id (|| undefined fallback line 65)', async () => {
    const noRoomSession = { event_type: 'session', session_id: 3, event_date: '2025-08-01', start_time: '09:00', end_time: '10:00', title: 'Test' };
    render(<EventEditForm event={noRoomSession} onClose={onClose} onSaved={onSaved} rooms={rooms} onRoomsLoad={onRoomsLoad} />);

    await act(async () => { fireEvent.click(screen.getByText('Save Changes')); });
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });

    const payload = api.put.mock.calls[0][1];
    expect(payload.room_id).toBeUndefined();
  });
});
