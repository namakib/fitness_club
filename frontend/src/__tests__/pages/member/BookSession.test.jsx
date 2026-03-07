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
import { BookSessionForm } from '../../../pages/member/BookSession';
import { ThemeProvider } from '../../../context/ThemeContext';

function renderForm() {
  return render(
    <MemoryRouter>
      <ThemeProvider>
        <BookSessionForm onSuccess={vi.fn()} />
      </ThemeProvider>
    </MemoryRouter>
  );
}

describe('BookSessionForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockImplementation((path) => {
      if (path.includes('booking-options')) return Promise.resolve({
        trainers: [{ trainer_id: 1, name: 'Bob' }],
        rooms: [{ room_id: 1, room_name: 'Room A' }],
      });
      if (path.includes('availability')) return Promise.resolve({ slots: [] });
      return Promise.resolve({});
    });
  });

  it('renders trainer selection', async () => {
    renderForm();
    await waitFor(() => {
      expect(screen.getByText('Trainer')).toBeInTheDocument();
    });
  });

  it('fetches booking options on mount', async () => {
    renderForm();
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/member/booking-options');
    });
  });

  it('renders Book Session submit button', async () => {
    renderForm();
    await waitFor(() => {
      expect(screen.getByText('Book Session')).toBeInTheDocument();
    });
  });
});
