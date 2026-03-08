import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  setAccessToken: vi.fn(),
}));
vi.mock('../../toastUtil', () => ({
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));

import api from '../../api';
import { BookSessionForm } from '../../pages/member/BookSession';
import { ThemeProvider } from '../../context/ThemeContext';

function renderBooking() {
  return render(
    <MemoryRouter>
      <ThemeProvider>
        <BookSessionForm onSuccess={vi.fn()} />
      </ThemeProvider>
    </MemoryRouter>
  );
}

describe('Member Booking Integration Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockImplementation((path) => {
      if (path.includes('booking-options')) return Promise.resolve({
        trainers: [{ trainer_id: 1, name: 'Bob', specialization: 'Strength' }],
        rooms: [{ room_id: 1, room_name: 'Room A' }],
      });
      if (path.includes('trainer-availability')) return Promise.resolve({
        slots: [
          { availability_id: 1, available_date: '2025-07-07', start_time: '09:00', end_time: '17:00' },
        ],
      });
      return Promise.resolve({});
    });
    api.post.mockResolvedValue({ message: 'Session booked' });
  });

  it('loads booking options on mount', async () => {
    renderBooking();
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/member/booking-options');
    });
  });

  it('renders form with trainer select and submit', async () => {
    renderBooking();
    await waitFor(() => {
      expect(screen.getByText('Trainer')).toBeInTheDocument();
      expect(screen.getByText('Book Session')).toBeInTheDocument();
    });
  });

  it('selects a trainer from dropdown', async () => {
    const user = userEvent.setup();
    renderBooking();
    await waitFor(() => expect(screen.getByText('Select trainer')).toBeInTheDocument());

    await user.click(screen.getByText('Select trainer'));
    const trainerOption = await screen.findByText(/Bob.*Strength/);
    await user.click(trainerOption);

    await waitFor(() => {
      expect(screen.getByText(/Bob/)).toBeInTheDocument();
    });
  });
});
