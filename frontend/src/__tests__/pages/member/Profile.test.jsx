import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../../api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));
vi.mock('../../../toastUtil', () => ({
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));

import api from '../../../api';
import { toastSuccess, toastError } from '../../../toastUtil';
import Profile from '../../../pages/member/Profile';
import { ThemeProvider } from '../../../context/ThemeContext';
import { NavModeProvider } from '../../../context/NavModeContext';

function renderProfile() {
  return render(
    <MemoryRouter>
      <ThemeProvider>
        <NavModeProvider>
          <Profile />
        </NavModeProvider>
      </ThemeProvider>
    </MemoryRouter>
  );
}

const profileData = {
  member: { name: 'Alice Smith', email: 'alice@test.com', phone: '5551234567', gender: 'female', dob: '1990-05-15', created_at: '2024-01-01' },
  goals: [],
  recent_metrics: [],
};

describe('Member Profile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockResolvedValue(profileData);
  });

  it('renders profile after data loads', async () => {
    renderProfile();
    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
      expect(screen.getByText('alice@test.com')).toBeInTheDocument();
    });
  });

  it('renders edit profile form', async () => {
    renderProfile();
    await waitFor(() => {
      expect(screen.getByText('Edit Profile')).toBeInTheDocument();
      expect(screen.getByText('Save Changes')).toBeInTheDocument();
    });
  });

  it('renders navigation style toggle', async () => {
    renderProfile();
    await waitFor(() => {
      expect(screen.getByText('Navigation Style')).toBeInTheDocument();
    });
  });

  it('handles API error gracefully', async () => {
    api.get.mockRejectedValueOnce(new Error('fail'));
    renderProfile();
    await waitFor(() => {
      expect(screen.getByText('Unable to load profile.')).toBeInTheDocument();
    });
  });

  it('submits profile form successfully', async () => {
    const user = userEvent.setup();
    api.put.mockResolvedValueOnce({});
    renderProfile();

    await waitFor(() => {
      expect(screen.getByText('Save Changes')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Save Changes'));

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/member/profile', expect.objectContaining({
        name: 'Alice Smith',
        phone: '5551234567',
        gender: 'female',
      }));
      expect(toastSuccess).toHaveBeenCalledWith('Profile updated.');
    });
  });

  it('shows error toast on submit failure', async () => {
    const user = userEvent.setup();
    const err = new Error('Server error');
    err.details = ['Something went wrong'];
    api.put.mockRejectedValueOnce(err);
    renderProfile();

    await waitFor(() => {
      expect(screen.getByText('Save Changes')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Save Changes'));

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('Server error', ['Something went wrong']);
    });
  });

  it('shows busy state while saving', async () => {
    const user = userEvent.setup();
    let resolve;
    api.put.mockImplementationOnce(() => new Promise(r => { resolve = r; }));
    renderProfile();

    await waitFor(() => {
      expect(screen.getByText('Save Changes')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Save Changes'));

    await waitFor(() => {
      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });

    resolve({});
    await waitFor(() => {
      expect(screen.getByText('Save Changes')).toBeInTheDocument();
    });
  });

  it('changes gender via dropdown', async () => {
    const user = userEvent.setup();
    api.put.mockResolvedValueOnce({});
    renderProfile();

    await waitFor(() => {
      expect(screen.getAllByText('Female').length).toBeGreaterThanOrEqual(1);
    });

    const femaleTrigger = screen.getAllByText('Female').find(el => el.closest('button'));
    await user.click(femaleTrigger);

    await waitFor(() => {
      const maleOptions = screen.getAllByText('Male');
      expect(maleOptions.length).toBeGreaterThanOrEqual(1);
    });
    const maleOption = screen.getAllByText('Male').find(el => el.closest('button'));
    await user.click(maleOption);

    await user.click(screen.getByText('Save Changes'));

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/member/profile', expect.objectContaining({
        gender: 'male',
      }));
    });
  });

  it('renders email field as disabled (Field disabled branch)', async () => {
    renderProfile();

    await waitFor(() => {
      const emailInputs = document.querySelectorAll('input[disabled]');
      const emailField = Array.from(emailInputs).find(el => el.value === 'alice@test.com');
      expect(emailField).toBeTruthy();
      expect(emailField.disabled).toBe(true);
      expect(emailField.className).toMatch(/bg-gray-50|dark:bg-gray-700/);
    });
  });

  it('renders profile meta information', async () => {
    renderProfile();
    await waitFor(() => {
      expect(screen.getAllByText('Date of Birth').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Gender').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Joined')).toBeInTheDocument();
    });
  });

  it('renders formatted date of birth (fmtDate line 117)', async () => {
    renderProfile();
    await waitFor(() => {
      expect(screen.getByText('May 15, 1990')).toBeInTheDocument();
    });
  });

  it('can edit name field', async () => {
    const user = userEvent.setup();
    api.put.mockResolvedValueOnce({});
    renderProfile();

    await waitFor(() => {
      expect(screen.getByDisplayValue('Alice Smith')).toBeInTheDocument();
    });

    const nameInput = screen.getByDisplayValue('Alice Smith');
    await user.clear(nameInput);
    await user.type(nameInput, 'Alice Johnson');
    await user.click(screen.getByText('Save Changes'));

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/member/profile', expect.objectContaining({
        name: 'Alice Johnson',
      }));
    });
  });

  it('handles null meta values (dob, gender, created_at)', async () => {
    api.get.mockResolvedValueOnce({
      member: { name: 'Bob', email: 'bob@test.com', phone: null, gender: null, dob: null, created_at: null },
      goals: [],
      recent_metrics: [],
    });
    renderProfile();

    await waitFor(() => {
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });
  });

  it('shows skeleton while loading', () => {
    api.get.mockReturnValue(new Promise(() => {}));
    const { container } = renderProfile();
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('handles member without phone gracefully', async () => {
    api.get.mockResolvedValueOnce({
      member: { name: 'No Phone', email: 'np@test.com', phone: '', gender: 'male', dob: '1990-01-01', created_at: '2024-01-01' },
      goals: [],
      recent_metrics: [],
    });
    renderProfile();

    await waitFor(() => {
      expect(screen.getByText('No Phone')).toBeInTheDocument();
    });
  });

  it('handles member with null name/phone/gender (|| fallbacks line 57)', async () => {
    api.get.mockResolvedValueOnce({
      member: { name: null, email: 'test@test.com', phone: null, gender: null, dob: null, created_at: null },
      goals: [],
      recent_metrics: [],
    });
    renderProfile();
    await waitFor(() => {
      expect(screen.getByText('Edit Profile')).toBeInTheDocument();
    });
  });

  it('handles member with null dob (fmtDate null branch)', async () => {
    api.get.mockResolvedValueOnce({
      member: { name: 'Test', email: 'test@test.com', phone: '1234567890', gender: 'male', dob: null, created_at: '2024-01-01' },
      goals: [],
      recent_metrics: [],
    });
    renderProfile();
    await waitFor(() => {
      expect(screen.getByText('Test')).toBeInTheDocument();
    });
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(1);
  });

  it('handles member with null created_at (fmtDate null branch for joined)', async () => {
    api.get.mockResolvedValueOnce({
      member: { name: 'Test', email: 'test@test.com', phone: '1234567890', gender: 'male', dob: '2000-01-01', created_at: null },
      goals: [],
      recent_metrics: [],
    });
    renderProfile();
    await waitFor(() => {
      expect(screen.getByText('Test')).toBeInTheDocument();
    });
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(1);
  });
});
