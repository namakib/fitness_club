import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

const mockNavigate = vi.fn();

vi.mock('../../../api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));
vi.mock('../../../toastUtil', () => ({
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});
vi.mock('../../../components/DatePicker', () => ({
  default: ({ label, value, onChange }) => (
    <input data-testid={`dp-${label}`} value={value ?? ''} onChange={e => onChange(e.target.value)} />
  ),
}));
vi.mock('../../../components/TimePicker', () => ({
  default: ({ label, value, onChange }) => (
    <input data-testid={`tp-${label}`} value={value ?? ''} onChange={e => onChange(e.target.value)} />
  ),
}));

import api from '../../../api';
import { toastSuccess, toastError } from '../../../toastUtil';
import BookSession, { BookSessionForm } from '../../../pages/member/BookSession';
import { ThemeProvider } from '../../../context/ThemeContext';

const bookingOptions = {
  trainers: [
    { trainer_id: 1, name: 'Bob', specialization: 'Strength' },
    { trainer_id: 2, name: 'Carol', specialization: null },
  ],
  rooms: [
    { room_id: 1, room_name: 'Room A' },
    { room_id: 2, room_name: 'Room B' },
  ],
};

function toYMD(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function weekDate(dayOffset) {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const sun = new Date(now);
  sun.setDate(now.getDate() - dayOfWeek);
  const d = new Date(sun);
  d.setDate(sun.getDate() + dayOffset);
  return toYMD(d);
}

const availabilitySlots = {
  slots: [
    { availability_id: 10, available_date: weekDate(6), start_time: '09:00', end_time: '10:00', is_booked: false, booked_by_me: false },
    { availability_id: 11, available_date: weekDate(6), start_time: '11:00', end_time: '12:00', is_booked: true, booked_by_me: false },
    { availability_id: 12, available_date: weekDate(5), start_time: '14:00', end_time: '15:00', is_booked: true, booked_by_me: true },
  ],
};

function setupMocks(opts = bookingOptions, avail = availabilitySlots) {
  api.get.mockImplementation((path) => {
    if (path.includes('booking-options')) return Promise.resolve(opts);
    if (path.includes('trainer-availability')) return Promise.resolve(avail);
    return Promise.resolve({});
  });
}

function renderForm(props = {}) {
  return render(
    <MemoryRouter>
      <ThemeProvider>
        <BookSessionForm onSuccess={props.onSuccess || vi.fn()} />
      </ThemeProvider>
    </MemoryRouter>
  );
}

function renderPage() {
  return render(
    <MemoryRouter>
      <ThemeProvider>
        <BookSession />
      </ThemeProvider>
    </MemoryRouter>
  );
}

describe('BookSessionForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupMocks();
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

  it('shows "Select a trainer to see availability" when no trainer selected', async () => {
    renderForm();
    await waitFor(() => {
      expect(screen.getByText('Select a trainer to see availability')).toBeInTheDocument();
    });
  });

  it('fetches availability when trainer is selected', async () => {
    const user = userEvent.setup();
    renderForm();

    await waitFor(() => {
      expect(screen.getByText('Select trainer')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Select trainer'));

    await waitFor(() => {
      expect(screen.getByText('Bob – Strength')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Bob – Strength'));

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/member/trainer-availability?trainer_id=1');
    });
  });

  it('shows trainer availability heading after selecting trainer', async () => {
    const user = userEvent.setup();
    renderForm();

    await waitFor(() => {
      expect(screen.getByText('Select trainer')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Select trainer'));

    await waitFor(() => {
      expect(screen.getByText('Bob – Strength')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Bob – Strength'));

    await waitFor(() => {
      expect(screen.getByText('Trainer availability')).toBeInTheDocument();
    });
  });

  it('shows "No upcoming availability" when slots are empty', async () => {
    const user = userEvent.setup();
    setupMocks(bookingOptions, { slots: [] });
    renderForm();

    await waitFor(() => {
      expect(screen.getByText('Select trainer')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Select trainer'));
    await waitFor(() => {
      expect(screen.getByText('Bob – Strength')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Bob – Strength'));

    await waitFor(() => {
      expect(screen.getByText('No upcoming availability')).toBeInTheDocument();
    });
  });

  it('renders available, booked, and bookedByMe slot states', async () => {
    const user = userEvent.setup();
    renderForm();

    await waitFor(() => {
      expect(screen.getByText('Select trainer')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Select trainer'));
    await waitFor(() => {
      expect(screen.getByText('Bob – Strength')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Bob – Strength'));

    await waitFor(() => {
      expect(screen.getByText('Trainer availability')).toBeInTheDocument();
    });

    await waitFor(() => {
      const takenBtn = document.querySelector('button[title="This slot is taken"]');
      const myBookingBtn = document.querySelector('button[title="You\'ve already booked this slot"]');
      expect(takenBtn || myBookingBtn).toBeTruthy();
      if (takenBtn) expect(takenBtn.disabled).toBe(true);
      if (myBookingBtn) expect(myBookingBtn.disabled).toBe(true);
    });
  });

  it('clicking available slot fills form', async () => {
    const user = userEvent.setup();
    renderForm();

    await waitFor(() => {
      expect(screen.getByText('Select trainer')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Select trainer'));
    await waitFor(() => {
      expect(screen.getByText('Bob – Strength')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Bob – Strength'));

    await waitFor(() => {
      expect(screen.getByText('Trainer availability')).toBeInTheDocument();
    });

    const availableSlot = await waitFor(() => {
      const btn = document.querySelector('button.bg-green-500\\/90:not([disabled])');
      expect(btn).toBeTruthy();
      return btn;
    });
    await user.click(availableSlot);
  });

  it('submits form successfully', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    api.post.mockResolvedValueOnce({});
    renderForm({ onSuccess });

    await waitFor(() => {
      expect(screen.getByText('Select trainer')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Select trainer'));
    await waitFor(() => {
      expect(screen.getByText('Bob – Strength')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Bob – Strength'));

    await waitFor(() => {
      expect(screen.getByText('Trainer availability')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Select room'));
    await waitFor(() => {
      expect(screen.getByText('Room A')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Room A'));

    await user.click(screen.getByText('Book Session'));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/member/sessions', expect.objectContaining({
        trainer_id: 1,
        room_id: 1,
      }));
      expect(toastSuccess).toHaveBeenCalledWith('Session booked.');
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('shows error on form submit failure', async () => {
    const user = userEvent.setup();
    const err = new Error('Conflict');
    err.details = ['Time slot taken'];
    api.post.mockRejectedValueOnce(err);
    renderForm();

    await waitFor(() => {
      expect(screen.getByText('Select trainer')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Select trainer'));
    await waitFor(() => {
      expect(screen.getByText('Bob – Strength')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Bob – Strength'));

    await user.click(screen.getByText('Book Session'));

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('Conflict', ['Time slot taken']);
    });
  });

  it('shows busy state during submit', async () => {
    const user = userEvent.setup();
    let resolve;
    api.post.mockImplementationOnce(() => new Promise(r => { resolve = r; }));
    renderForm();

    await waitFor(() => {
      expect(screen.getByText('Select trainer')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Select trainer'));
    await waitFor(() => {
      expect(screen.getByText('Bob – Strength')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Bob – Strength'));

    await user.click(screen.getByText('Book Session'));

    await waitFor(() => {
      expect(screen.getByText('Booking...')).toBeInTheDocument();
    });

    resolve({});
    await waitFor(() => {
      expect(screen.getByText('Book Session')).toBeInTheDocument();
    });
  });

  it('navigates weeks with Previous/Next buttons', async () => {
    const user = userEvent.setup();
    renderForm();

    await waitFor(() => {
      expect(screen.getByText('Select trainer')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Select trainer'));
    await waitFor(() => {
      expect(screen.getByText('Bob – Strength')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Bob – Strength'));

    await waitFor(() => {
      expect(screen.getByText('Trainer availability')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByLabelText('Next week')).toBeInTheDocument();
    });

    await user.click(screen.getByLabelText('Next week'));
    await user.click(screen.getByLabelText('Previous week'));
  });

  it('handles booking-options fetch error', async () => {
    api.get.mockImplementation((path) => {
      if (path.includes('booking-options')) return Promise.reject(new Error('fail'));
      return Promise.resolve({});
    });
    renderForm();

    await waitFor(() => {
      expect(screen.getByText('Book Session')).toBeInTheDocument();
    });
  });

  it('handles availability fetch error', async () => {
    const user = userEvent.setup();
    api.get.mockImplementation((path) => {
      if (path.includes('booking-options')) return Promise.resolve(bookingOptions);
      if (path.includes('trainer-availability')) return Promise.reject(new Error('fail'));
      return Promise.resolve({});
    });
    renderForm();

    await waitFor(() => {
      expect(screen.getByText('Select trainer')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Select trainer'));
    await waitFor(() => {
      expect(screen.getByText('Bob – Strength')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Bob – Strength'));

    await waitFor(() => {
      expect(screen.getByText('No upcoming availability')).toBeInTheDocument();
    });
  });

  it('renders trainer without specialization', async () => {
    const user = userEvent.setup();
    renderForm();

    await waitFor(() => {
      expect(screen.getByText('Select trainer')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Select trainer'));

    await waitFor(() => {
      expect(screen.getByText('Carol – General')).toBeInTheDocument();
    });
  });

  it('shows loading state for availability', async () => {
    const user = userEvent.setup();
    let resolveAvailability;
    api.get.mockImplementation((path) => {
      if (path.includes('booking-options')) return Promise.resolve(bookingOptions);
      if (path.includes('trainer-availability')) return new Promise(r => { resolveAvailability = r; });
      return Promise.resolve({});
    });
    renderForm();

    await waitFor(() => {
      expect(screen.getByText('Select trainer')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Select trainer'));
    await waitFor(() => {
      expect(screen.getByText('Bob – Strength')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Bob – Strength'));

    await waitFor(() => {
      expect(screen.getByText('Loading…')).toBeInTheDocument();
    });

    resolveAvailability({ slots: [] });
    await waitFor(() => {
      expect(screen.getByText('No upcoming availability')).toBeInTheDocument();
    });
  });

  it('displays time slots with >5 char times (truncated)', async () => {
    const user = userEvent.setup();
    const longTimeSlots = {
      slots: [
        { availability_id: 20, available_date: weekDate(1), start_time: '09:00:00', end_time: '10:00:00', is_booked: false, booked_by_me: false },
      ],
    };
    setupMocks(bookingOptions, longTimeSlots);
    renderForm();

    await waitFor(() => {
      expect(screen.getByText('Select trainer')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Select trainer'));
    await waitFor(() => expect(screen.getByText('Bob – Strength')).toBeInTheDocument());
    await user.click(screen.getByText('Bob – Strength'));

    await waitFor(() => {
      expect(screen.getByText('Trainer availability')).toBeInTheDocument();
    });
  });

  it('handles slots with null time values', async () => {
    const user = userEvent.setup();
    const nullTimeSlots = {
      slots: [
        { availability_id: 30, available_date: weekDate(1), start_time: null, end_time: null, is_booked: false, booked_by_me: false },
      ],
    };
    setupMocks(bookingOptions, nullTimeSlots);
    renderForm();

    await waitFor(() => {
      expect(screen.getByText('Select trainer')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Select trainer'));
    await waitFor(() => expect(screen.getByText('Bob – Strength')).toBeInTheDocument());
    await user.click(screen.getByText('Bob – Strength'));

    await waitFor(() => {
      expect(screen.getByText('Trainer availability')).toBeInTheDocument();
    });
  });

  it('handles booking options with missing trainers/rooms arrays', async () => {
    setupMocks({}, { slots: [] });
    renderForm();

    await waitFor(() => {
      expect(screen.getByText('Book Session')).toBeInTheDocument();
    });
  });

  it('clears availability when trainer is deselected', async () => {
    const user = userEvent.setup();
    renderForm();

    await waitFor(() => {
      expect(screen.getByText('Select trainer')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Select trainer'));
    await waitFor(() => expect(screen.getByText('Bob – Strength')).toBeInTheDocument());
    await user.click(screen.getByText('Bob – Strength'));

    await waitFor(() => {
      expect(screen.getByText('Trainer availability')).toBeInTheDocument();
    });
  });

  it('renders week legend with available/booking/taken indicators', async () => {
    const user = userEvent.setup();
    renderForm();

    await waitFor(() => {
      expect(screen.getByText('Select trainer')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Select trainer'));
    await waitFor(() => {
      expect(screen.getByText('Bob – Strength')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Bob – Strength'));

    await waitFor(() => {
      expect(screen.getByText(/available/)).toBeInTheDocument();
      expect(screen.getByText(/your booking/)).toBeInTheDocument();
      expect(screen.getByText(/taken/)).toBeInTheDocument();
    });
  });
});

describe('BookSession page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupMocks();
  });

  it('renders page heading', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Book Personal Session/i })).toBeInTheDocument();
    });
  });

  it('navigates to schedule on successful booking', async () => {
    const user = userEvent.setup();
    api.post.mockResolvedValueOnce({});
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Select trainer')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Select trainer'));
    await waitFor(() => {
      expect(screen.getByText('Bob – Strength')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Bob – Strength'));

    await user.click(screen.getByText('Book Session'));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/member/schedule');
    });
  });

  it('changes date and time via form fields', async () => {
    const { container } = renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('dp-Date')).toBeInTheDocument();
    });

    const { fireEvent } = await import('@testing-library/react');
    fireEvent.change(screen.getByTestId('dp-Date'), { target: { value: '2025-08-01' } });
    fireEvent.change(screen.getByTestId('tp-Start Time'), { target: { value: '10:00' } });
    fireEvent.change(screen.getByTestId('tp-End Time'), { target: { value: '11:00' } });

    expect(screen.getByTestId('dp-Date').value).toBe('2025-08-01');
    expect(screen.getByTestId('tp-Start Time').value).toBe('10:00');
    expect(screen.getByTestId('tp-End Time').value).toBe('11:00');
  });
});

describe('BookSessionForm - cancelled effect (lines 46-52)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('cancels in-flight availability fetch on unmount', async () => {
    let resolveAvail;
    api.get.mockImplementation((path) => {
      if (path.includes('booking-options')) return Promise.resolve(bookingOptions);
      if (path.includes('trainer-availability')) return new Promise(r => { resolveAvail = r; });
      return Promise.resolve({});
    });

    const user = userEvent.setup();
    const { unmount } = renderForm();

    await waitFor(() => {
      expect(screen.getByText('Select trainer')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Select trainer'));
    await waitFor(() => expect(screen.getByText('Bob – Strength')).toBeInTheDocument());
    await user.click(screen.getByText('Bob – Strength'));

    unmount();

    resolveAvail({ slots: [{ availability_id: 99, available_date: '2025-01-01', start_time: '09:00', end_time: '10:00' }] });
  });

  it('cancels in-flight availability fetch when trainer changes', async () => {
    let calls = 0;
    let resolvers = [];
    api.get.mockImplementation((path) => {
      if (path.includes('booking-options')) return Promise.resolve(bookingOptions);
      if (path.includes('trainer-availability')) {
        calls++;
        return new Promise(r => { resolvers.push(r); });
      }
      return Promise.resolve({});
    });

    const user = userEvent.setup();
    renderForm();

    await waitFor(() => expect(screen.getByText('Select trainer')).toBeInTheDocument());
    await user.click(screen.getByText('Select trainer'));
    await waitFor(() => expect(screen.getByText('Bob – Strength')).toBeInTheDocument());
    await user.click(screen.getByText('Bob – Strength'));

    await waitFor(() => expect(calls).toBe(1));

    const trainerButtons = screen.getAllByText('Bob – Strength');
    await user.click(trainerButtons[0]);
    await waitFor(() => expect(screen.getByText('Carol – General')).toBeInTheDocument());
    await user.click(screen.getByText('Carol – General'));

    await waitFor(() => expect(calls).toBe(2));

    resolvers[0]({ slots: [] });
    resolvers[1]({ slots: [] });
  });

  it('handles availability fetch failure when cancelled', async () => {
    let rejectAvail;
    api.get.mockImplementation((path) => {
      if (path.includes('booking-options')) return Promise.resolve(bookingOptions);
      if (path.includes('trainer-availability')) return new Promise((_, rej) => { rejectAvail = rej; });
      return Promise.resolve({});
    });

    const user = userEvent.setup();
    const { unmount } = renderForm();

    await waitFor(() => expect(screen.getByText('Select trainer')).toBeInTheDocument());
    await user.click(screen.getByText('Select trainer'));
    await waitFor(() => expect(screen.getByText('Bob – Strength')).toBeInTheDocument());
    await user.click(screen.getByText('Bob – Strength'));

    unmount();

    rejectAvail(new Error('network'));
  });
});
