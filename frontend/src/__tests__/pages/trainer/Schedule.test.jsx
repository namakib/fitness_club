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
import Schedule from '../../../pages/trainer/Schedule';
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

const fullData = {
  sessions: [
    { session_id: 1, session_date: '2025-07-01', start_time: '09:00', end_time: '10:00', member_name: 'Alice', room_name: 'A' },
  ],
  classes: [
    { class_id: 1, class_name: 'Yoga Flow', class_date: '2025-07-02T14:00:00', start_time: '14:00', end_time: '15:00', room_name: 'B', enrolled_count: 8, max_participants: 20 },
  ],
  member_health: [
    { name: 'Alice', email: 'alice@test.com', weight: 65, body_fat_pct: 18, blood_pressure: '120/80', heart_rate: 72, recorded_at: '2025-07-01' },
  ],
};

describe('Trainer Schedule', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockResolvedValue(fullData);
  });

  it('renders schedule heading', async () => {
    renderSchedule();
    await waitFor(() => {
      expect(screen.getByText('Schedule')).toBeInTheDocument();
    });
  });

  it('fetches schedule data on mount', async () => {
    renderSchedule();
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/trainer/schedule');
    });
  });

  it('renders all three section headings', async () => {
    renderSchedule();
    await waitFor(() => {
      expect(screen.getByText('Upcoming Personal Sessions')).toBeInTheDocument();
      expect(screen.getByText('Upcoming Group Classes')).toBeInTheDocument();
      expect(screen.getByText('Member Health Data')).toBeInTheDocument();
    });
  });

  it('renders session row data', async () => {
    renderSchedule();
    await waitFor(() => {
      expect(screen.getAllByText('Alice').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('09:00 – 10:00').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders class row with enrollment', async () => {
    renderSchedule();
    await waitFor(() => {
      expect(screen.getAllByText('Yoga Flow').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('8 / 20').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('14:00 – 15:00').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders member health data', async () => {
    renderSchedule();
    await waitFor(() => {
      expect(screen.getAllByText('alice@test.com').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('120/80').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('72').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('formats date-only strings (no T or space)', async () => {
    renderSchedule();
    await waitFor(() => {
      expect(screen.getAllByText('Jul 1, 2025').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('formats ISO datetime strings (includes T)', async () => {
    renderSchedule();
    await waitFor(() => {
      expect(screen.getAllByText('Jul 2, 2025').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('formats datetime strings with space separator', async () => {
    api.get.mockResolvedValueOnce({
      sessions: [],
      classes: [
        { class_id: 2, class_name: 'Spin', class_date: '2025-08-15 10:00:00', start_time: '10:00', end_time: '11:00', room_name: 'C', enrolled_count: 5, max_participants: 15 },
      ],
      member_health: [],
    });
    renderSchedule();
    await waitFor(() => {
      expect(screen.getAllByText('Aug 15, 2025').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows dash for null dates', async () => {
    api.get.mockResolvedValueOnce({
      sessions: [
        { session_id: 2, session_date: null, start_time: '09:00', end_time: '10:00', member_name: 'X', room_name: 'A' },
      ],
      classes: [],
      member_health: [],
    });
    renderSchedule();
    await waitFor(() => {
      expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows dash for invalid date strings', async () => {
    api.get.mockResolvedValueOnce({
      sessions: [
        { session_id: 3, session_date: 'not-a-date', start_time: '09:00', end_time: '10:00', member_name: 'Y', room_name: 'A' },
      ],
      classes: [],
      member_health: [],
    });
    renderSchedule();
    await waitFor(() => {
      expect(screen.getAllByText('Y').length).toBeGreaterThanOrEqual(1);
    });
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(1);
  });

  it('shows dash for invalid ISO-like strings', async () => {
    api.get.mockResolvedValueOnce({
      sessions: [],
      classes: [],
      member_health: [
        { name: 'Z', email: 'z@t.com', weight: 70, body_fat_pct: 20, blood_pressure: '130/85', heart_rate: 80, recorded_at: 'invalid date' },
      ],
    });
    renderSchedule();
    await waitFor(() => {
      expect(screen.getAllByText('z@t.com').length).toBeGreaterThanOrEqual(1);
    });
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(1);
  });

  it('handles API error with empty tables', async () => {
    api.get.mockRejectedValueOnce(new Error('fail'));
    renderSchedule();
    await waitFor(() => {
      expect(screen.getByText('Schedule')).toBeInTheDocument();
    });
    expect(screen.getByText('No upcoming personal sessions.')).toBeInTheDocument();
    expect(screen.getByText('No upcoming group classes.')).toBeInTheDocument();
    expect(screen.getByText('No member health data available.')).toBeInTheDocument();
  });

  it('shows empty messages for empty data arrays', async () => {
    api.get.mockResolvedValueOnce({ sessions: [], classes: [], member_health: [] });
    renderSchedule();
    await waitFor(() => {
      expect(screen.getByText('No upcoming personal sessions.')).toBeInTheDocument();
      expect(screen.getByText('No upcoming group classes.')).toBeInTheDocument();
      expect(screen.getByText('No member health data available.')).toBeInTheDocument();
    });
  });

  it('shows skeleton while loading', () => {
    api.get.mockReturnValue(new Promise(() => {}));
    const { container } = renderSchedule();
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });
});
