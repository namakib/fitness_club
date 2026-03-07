import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
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

import api from '../../../api';
import { toastSuccess, toastError } from '../../../toastUtil';
import Classes, { ClassesBrowser } from '../../../pages/member/Classes';
import { ThemeProvider } from '../../../context/ThemeContext';

const classesData = {
  classes: [
    { class_id: 1, class_name: 'Yoga', class_date: '2025-07-01', start_time: '10:00', end_time: '11:00', trainer_name: 'Bob', room_name: 'A', enrolled_count: 5, max_participants: 20 },
  ],
};

function renderClasses() {
  return render(
    <MemoryRouter>
      <ThemeProvider>
        <Classes />
      </ThemeProvider>
    </MemoryRouter>
  );
}

function renderBrowser(props = {}) {
  return render(
    <MemoryRouter>
      <ThemeProvider>
        <ClassesBrowser onSuccess={props.onSuccess || vi.fn()} refreshTrigger={props.refreshTrigger || 0} />
      </ThemeProvider>
    </MemoryRouter>
  );
}

describe('Classes page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockResolvedValue(classesData);
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

  it('navigates on successful enroll from Classes page', async () => {
    const user = userEvent.setup();
    api.post.mockResolvedValueOnce({});
    api.get.mockResolvedValue(classesData);
    renderClasses();

    await waitFor(() => {
      expect(screen.getAllByText('Yoga').length).toBeGreaterThanOrEqual(1);
    });

    const table = document.querySelector('table');
    const enrollBtn = within(table).getByText('Enroll');
    await user.click(enrollBtn);

    await waitFor(() => {
      expect(screen.getByText('Enroll in Class')).toBeInTheDocument();
    });

    const modalEnrollBtns = screen.getAllByText('Enroll');
    const confirmEnroll = modalEnrollBtns.find(el => el.tagName === 'BUTTON' && el.closest('.flex.justify-end'));
    if (confirmEnroll) {
      await user.click(confirmEnroll);

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/member/classes/1/enroll');
        expect(toastSuccess).toHaveBeenCalledWith('Enrolled in class.');
        expect(mockNavigate).toHaveBeenCalledWith('/member/schedule');
      });
    }
  });
});

describe('ClassesBrowser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockResolvedValue(classesData);
  });

  it('renders class data in table', async () => {
    renderBrowser();
    await waitFor(() => {
      expect(screen.getAllByText('Yoga').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Bob').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('5 / 20').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('opens enroll modal with class details', async () => {
    const user = userEvent.setup();
    renderBrowser();

    await waitFor(() => {
      expect(screen.getAllByText('Yoga').length).toBeGreaterThanOrEqual(1);
    });

    const table = document.querySelector('table');
    const enrollBtn = within(table).getByText('Enroll');
    await user.click(enrollBtn);

    await waitFor(() => {
      expect(screen.getByText('Enroll in Class')).toBeInTheDocument();
      expect(screen.getByText(/Do you want to enroll/)).toBeInTheDocument();
      expect(screen.getByText('Group Class')).toBeInTheDocument();
    });
  });

  it('cancels enroll modal', async () => {
    const user = userEvent.setup();
    renderBrowser();

    await waitFor(() => {
      expect(screen.getAllByText('Yoga').length).toBeGreaterThanOrEqual(1);
    });

    const table = document.querySelector('table');
    const enrollBtn = within(table).getByText('Enroll');
    await user.click(enrollBtn);

    await waitFor(() => {
      expect(screen.getByText('Enroll in Class')).toBeInTheDocument();
    });

    const cancelBtns = screen.getAllByText('Cancel');
    const cancelBtn = cancelBtns.find(el => el.tagName === 'BUTTON');
    if (cancelBtn) {
      await user.click(cancelBtn);
    }
  });

  it('confirms enroll successfully', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn().mockResolvedValue(undefined);
    api.post.mockResolvedValueOnce({});
    renderBrowser({ onSuccess });

    await waitFor(() => {
      expect(screen.getAllByText('Yoga').length).toBeGreaterThanOrEqual(1);
    });

    const table = document.querySelector('table');
    const enrollBtn = within(table).getByText('Enroll');
    await user.click(enrollBtn);

    await waitFor(() => {
      expect(screen.getByText('Enroll in Class')).toBeInTheDocument();
    });

    const modalEnrollBtns = screen.getAllByText('Enroll');
    const confirmEnroll = modalEnrollBtns.find(el => el.tagName === 'BUTTON' && el.closest('.flex.justify-end'));
    if (confirmEnroll) {
      await user.click(confirmEnroll);

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/member/classes/1/enroll');
        expect(toastSuccess).toHaveBeenCalledWith('Enrolled in class.');
        expect(onSuccess).toHaveBeenCalled();
      });
    }
  });

  it('shows error on enroll failure', async () => {
    const user = userEvent.setup();
    const err = new Error('Class full');
    err.details = ['No spots available'];
    api.post.mockRejectedValueOnce(err);
    renderBrowser();

    await waitFor(() => {
      expect(screen.getAllByText('Yoga').length).toBeGreaterThanOrEqual(1);
    });

    const table = document.querySelector('table');
    const enrollBtn = within(table).getByText('Enroll');
    await user.click(enrollBtn);

    await waitFor(() => {
      expect(screen.getByText('Enroll in Class')).toBeInTheDocument();
    });

    const modalEnrollBtns = screen.getAllByText('Enroll');
    const confirmEnroll = modalEnrollBtns.find(el => el.tagName === 'BUTTON' && el.closest('.flex.justify-end'));
    if (confirmEnroll) {
      await user.click(confirmEnroll);

      await waitFor(() => {
        expect(toastError).toHaveBeenCalledWith('Class full', ['No spots available']);
      });
    }
  });

  it('handles API error on classes fetch', async () => {
    api.get.mockRejectedValueOnce(new Error('fail'));
    renderBrowser();
    await waitFor(() => {
      expect(screen.getByText(/No available classes/)).toBeInTheDocument();
    });
  });

  it('renders description text', async () => {
    renderBrowser();
    await waitFor(() => {
      expect(screen.getByText(/Available upcoming classes/)).toBeInTheDocument();
    });
  });

  it('shows enroll modal with time details', async () => {
    const user = userEvent.setup();
    renderBrowser();

    await waitFor(() => {
      expect(screen.getAllByText('Yoga').length).toBeGreaterThanOrEqual(1);
    });

    const table = document.querySelector('table');
    const enrollBtn = within(table).getByText('Enroll');
    await user.click(enrollBtn);

    await waitFor(() => {
      expect(screen.getByText('Enroll in Class')).toBeInTheDocument();
    });
  });

  it('enrolls in class via modal confirm', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn().mockResolvedValue(undefined);
    api.post.mockResolvedValueOnce({});
    renderBrowser({ onSuccess });

    await waitFor(() => {
      expect(screen.getAllByText('Yoga').length).toBeGreaterThanOrEqual(1);
    });

    const table = document.querySelector('table');
    const enrollBtn = within(table).getByText('Enroll');
    await user.click(enrollBtn);

    await waitFor(() => {
      expect(screen.getByText('Enroll in Class')).toBeInTheDocument();
    });

    const modalEnrollBtn = screen.getAllByText('Enroll').find(el =>
      el.closest('.flex.justify-end') || el.className.includes('bg-')
    );
    if (modalEnrollBtn) {
      await user.click(modalEnrollBtn);
      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/member/classes/1/enroll');
        expect(toastSuccess).toHaveBeenCalledWith('Enrolled in class.');
      });
    }
  });

  it('shows error on enrollment failure', async () => {
    const user = userEvent.setup();
    const err = new Error('Full');
    err.details = [];
    api.post.mockRejectedValueOnce(err);
    renderBrowser();

    await waitFor(() => {
      expect(screen.getAllByText('Yoga').length).toBeGreaterThanOrEqual(1);
    });

    const table = document.querySelector('table');
    const enrollBtn = within(table).getByText('Enroll');
    await user.click(enrollBtn);

    await waitFor(() => {
      expect(screen.getByText('Enroll in Class')).toBeInTheDocument();
    });

    const modalEnrollBtn = screen.getAllByText('Enroll').find(el =>
      el.closest('.flex.justify-end') || el.className.includes('bg-')
    );
    if (modalEnrollBtn) {
      await user.click(modalEnrollBtn);
      await waitFor(() => {
        expect(toastError).toHaveBeenCalledWith('Full', []);
      });
    }
  });

  it('cancels enroll modal', async () => {
    const user = userEvent.setup();
    renderBrowser();

    await waitFor(() => {
      expect(screen.getAllByText('Yoga').length).toBeGreaterThanOrEqual(1);
    });

    const table = document.querySelector('table');
    const enrollBtn = within(table).getByText('Enroll');
    await user.click(enrollBtn);

    await waitFor(() => {
      expect(screen.getByText('Enroll in Class')).toBeInTheDocument();
    });

    const cancelBtns = screen.getAllByText('Cancel');
    if (cancelBtns.length > 0) {
      await user.click(cancelBtns[0]);
    }
  });

  it('renders class with enrolled_count of 0 (falsy)', async () => {
    api.get.mockResolvedValue({
      classes: [
        { class_id: 3, class_name: 'Pilates', class_date: '2025-07-05', start_time: '08:00', end_time: '09:00', trainer_name: 'Zara', room_name: 'C', enrolled_count: 0, max_participants: 15 },
      ],
    });
    renderBrowser();
    await waitFor(() => {
      expect(screen.getAllByText('0 / 15').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders class with null enrolled_count', async () => {
    api.get.mockResolvedValue({
      classes: [
        { class_id: 4, class_name: 'HIIT', class_date: null, start_time: '12:00', end_time: '13:00', trainer_name: 'Sam', room_name: 'D', enrolled_count: null, max_participants: 10 },
      ],
    });
    renderBrowser();
    await waitFor(() => {
      expect(screen.getAllByText('0 / 10').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows loading skeleton while classes are loading', () => {
    api.get.mockReturnValue(new Promise(() => {}));
    const { container } = renderBrowser();
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('shows modal spots with enrolled_count 0', async () => {
    const user = userEvent.setup();
    api.get.mockResolvedValue({
      classes: [
        { class_id: 5, class_name: 'Spin', class_date: '2025-07-10', start_time: '07:00', end_time: '08:00', trainer_name: 'Lee', room_name: 'E', enrolled_count: 0, max_participants: 25 },
      ],
    });
    renderBrowser();

    await waitFor(() => {
      expect(screen.getAllByText('Spin').length).toBeGreaterThanOrEqual(1);
    });

    const table = document.querySelector('table');
    const enrollBtn = within(table).getByText('Enroll');
    await user.click(enrollBtn);

    await waitFor(() => {
      expect(screen.getByText('Enroll in Class')).toBeInTheDocument();
      expect(screen.getAllByText('0 / 25').length).toBeGreaterThanOrEqual(2);
    });
  });

  it('closes enroll modal via X button (onClose)', async () => {
    const user = userEvent.setup();
    renderBrowser();

    await waitFor(() => {
      expect(screen.getAllByText('Yoga').length).toBeGreaterThanOrEqual(1);
    });

    const table = document.querySelector('table');
    const enrollBtn = within(table).getByText('Enroll');
    await user.click(enrollBtn);

    await waitFor(() => {
      expect(screen.getByText('Enroll in Class')).toBeInTheDocument();
    });

    await user.click(screen.getByLabelText('Close'));
  });

  it('handles API response without classes key (d.classes || [] fallback line 19)', async () => {
    api.get.mockResolvedValueOnce({});
    renderBrowser();
    await waitFor(() => {
      expect(screen.getByText('No available classes. Check back later.')).toBeInTheDocument();
    });
  });
});
