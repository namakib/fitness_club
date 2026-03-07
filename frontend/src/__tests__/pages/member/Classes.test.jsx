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
import Classes from '../../../pages/member/Classes';
import { ThemeProvider } from '../../../context/ThemeContext';

function renderClasses() {
  return render(
    <MemoryRouter>
      <ThemeProvider>
        <Classes />
      </ThemeProvider>
    </MemoryRouter>
  );
}

describe('Classes page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockResolvedValue({
      classes: [
        { class_id: 1, class_name: 'Yoga', class_date: '2025-07-01', start_time: '10:00', end_time: '11:00', trainer_name: 'Bob', room_name: 'A', enrolled_count: 5, max_participants: 20 },
      ],
    });
  });

  it('renders Browse Classes heading', async () => {
    renderClasses();
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Browse Classes/i })).toBeInTheDocument();
    });
  });

  it('fetches available classes on mount', async () => {
    renderClasses();
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/member/available-classes');
    });
  });

  it('handles empty classes list', async () => {
    api.get.mockResolvedValueOnce({ classes: [] });
    renderClasses();
    await waitFor(() => {
      expect(screen.getByText(/No available classes/)).toBeInTheDocument();
    });
  });
});
