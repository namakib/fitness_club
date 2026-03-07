import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../../api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));
vi.mock('../../../toastUtil', () => ({
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));

import api from '../../../api';
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

describe('Admin RoomBooking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockResolvedValue({
      rooms: [{ room_id: 1, room_name: 'Room A' }],
      members: [{ member_id: 1, name: 'Alice' }],
      trainers: [{ trainer_id: 1, name: 'Bob' }],
      bookings: [],
    });
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
      expect(screen.getByText('Personal Session')).toBeInTheDocument();
      expect(screen.getByText('Group Class')).toBeInTheDocument();
    });
  });

  it('fetches room booking data on mount', async () => {
    renderRoomBooking();
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/admin/room-booking');
    });
  });
});
