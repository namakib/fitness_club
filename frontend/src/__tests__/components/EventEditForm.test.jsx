import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';

vi.mock('../../api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));
vi.mock('../../toastUtil', () => ({
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));

import api from '../../api';
import { toastSuccess } from '../../toastUtil';
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
    render(
      <EventEditForm event={classEvent} onClose={onClose} onSaved={onSaved} rooms={rooms} onRoomsLoad={onRoomsLoad} />
    );
    expect(screen.getByText('Group Class')).toBeInTheDocument();
    expect(screen.getByText('Class Name')).toBeInTheDocument();
    expect(screen.getByText('Max Participants')).toBeInTheDocument();
  });
});
