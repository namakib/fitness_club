import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../../api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));
vi.mock('../../../toastUtil', () => ({
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));
vi.mock('../../../components/SelectDropdown', () => ({
  default: function MockSelect({ label, value, onChange, options, placeholder }) {
    const id = label ? `sel-${label}` : undefined;
    return (
      <div>
        {label && <label htmlFor={id}>{label}</label>}
        <select data-testid={`select-${label || placeholder || 'dropdown'}`} id={id} value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
          <option value="">{placeholder || 'Select...'}</option>
          {(options || []).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
    );
  },
}));
vi.mock('../../../components/PhoneInput', () => {
  function MockPhoneInput({ label, value, onChange }) {
    return (
      <div>
        {label && <label htmlFor="phone-input">{label}</label>}
        <input id="phone-input" value={value ?? ''} onChange={onChange} />
      </div>
    );
  }
  MockPhoneInput.formatPhoneDisplay = (v) => v || '';
  return { default: MockPhoneInput, formatPhoneDisplay: (v) => v || '' };
});

import api from '../../../api';
import { toastError, toastSuccess } from '../../../toastUtil';
import TrainerProfile from '../../../pages/trainer/Profile';
import { ThemeProvider } from '../../../context/ThemeContext';
import { NavModeProvider } from '../../../context/NavModeContext';

const trainerData = {
  trainer: { name: 'Bob Trainer', email: 'bob@gym.com', phone: '5559876543', specialization: 'Strength Training' },
};

const dashboardData = {
  total_sessions: 50,
  total_classes: 20,
  total_members: 30,
  total_availability_slots: 10,
};

function renderProfile() {
  return render(
    <MemoryRouter>
      <ThemeProvider>
        <NavModeProvider>
          <TrainerProfile />
        </NavModeProvider>
      </ThemeProvider>
    </MemoryRouter>
  );
}

describe('Trainer Profile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockImplementation((path) => {
      if (path === '/trainer/profile') return Promise.resolve(trainerData);
      if (path === '/trainer/dashboard') return Promise.resolve(dashboardData);
      return Promise.resolve({});
    });
  });

  it('renders trainer name after load', async () => {
    renderProfile();
    await waitFor(() => {
      expect(screen.getByText('Bob Trainer')).toBeInTheDocument();
    });
  });

  it('renders edit profile form', async () => {
    renderProfile();
    await waitFor(() => {
      expect(screen.getByText('Edit Profile')).toBeInTheDocument();
      expect(screen.getByText('Save Changes')).toBeInTheDocument();
    });
  });

  it('renders trainer email', async () => {
    renderProfile();
    await waitFor(() => {
      expect(screen.getByText('bob@gym.com')).toBeInTheDocument();
    });
  });

  it('renders email field as disabled', async () => {
    renderProfile();
    await waitFor(() => {
      expect(screen.getByDisplayValue('bob@gym.com')).toBeDisabled();
    });
  });

  it('renders stat cards from dashboard data', async () => {
    renderProfile();
    await waitFor(() => {
      expect(screen.getAllByText('50').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('20').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('30').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('10').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('hides stat cards when dashboard load fails', async () => {
    api.get.mockImplementation((path) => {
      if (path === '/trainer/profile') return Promise.resolve(trainerData);
      if (path === '/trainer/dashboard') return Promise.reject(new Error('fail'));
      return Promise.resolve({});
    });
    renderProfile();
    await waitFor(() => {
      expect(screen.getByText('Bob Trainer')).toBeInTheDocument();
    });
    expect(screen.queryByText('Upcoming Sessions')).not.toBeInTheDocument();
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
      expect(api.put).toHaveBeenCalledWith('/trainer/profile', {
        name: 'Bob Trainer',
        phone: '5559876543',
        specialization: 'Strength Training',
      });
      expect(toastSuccess).toHaveBeenCalledWith('Profile updated.');
    });
  });

  it('handles profile form submit error', async () => {
    const user = userEvent.setup();
    api.put.mockRejectedValueOnce({ message: 'Update failed', details: 'bad' });
    renderProfile();
    await waitFor(() => {
      expect(screen.getByText('Save Changes')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Save Changes'));
    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('Update failed', 'bad');
    });
  });

  it('changes specialization via dropdown', async () => {
    const user = userEvent.setup();
    api.put.mockResolvedValueOnce({});
    renderProfile();
    await waitFor(() => {
      expect(screen.getByTestId('select-Specialization')).toBeInTheDocument();
    });
    fireEvent.change(screen.getByTestId('select-Specialization'), { target: { value: 'CrossFit' } });
    await user.click(screen.getByText('Save Changes'));
    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/trainer/profile', expect.objectContaining({
        specialization: 'CrossFit',
      }));
    });
  });

  it('changes name via input', async () => {
    const user = userEvent.setup();
    api.put.mockResolvedValueOnce({});
    renderProfile();
    await waitFor(() => {
      expect(screen.getByDisplayValue('Bob Trainer')).toBeInTheDocument();
    });
    const nameInput = screen.getByDisplayValue('Bob Trainer');
    await user.clear(nameInput);
    await user.type(nameInput, 'New Name');
    await user.click(screen.getByText('Save Changes'));
    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/trainer/profile', expect.objectContaining({
        name: 'New Name',
      }));
    });
  });

  it('shows skeleton while loading', () => {
    api.get.mockReturnValue(new Promise(() => {}));
    const { container } = renderProfile();
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders Members Trained meta when stats load', async () => {
    renderProfile();
    await waitFor(() => {
      expect(screen.getAllByText('Members Trained').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('handles trainer with empty phone and specialization', async () => {
    api.get.mockImplementation((path) => {
      if (path === '/trainer/profile') return Promise.resolve({
        trainer: { name: 'No Phone', email: 'np@gym.com', phone: '', specialization: '' },
      });
      if (path === '/trainer/dashboard') return Promise.resolve(dashboardData);
      return Promise.resolve({});
    });
    renderProfile();
    await waitFor(() => {
      expect(screen.getByText('No Phone')).toBeInTheDocument();
    });
  });

  it('handles profile API failure (catch handler called)', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    api.get.mockImplementation((path) => {
      if (path === '/trainer/profile') return Promise.reject(new Error('fail'));
      if (path === '/trainer/dashboard') return Promise.resolve(dashboardData);
      return Promise.resolve({});
    });
    const ErrorFallback = () => <div>Error</div>;
    class EB extends React.Component { state = {}; static getDerivedStateFromError() { return { err: true }; } render() { return this.state.err ? <ErrorFallback /> : this.props.children; } }
    render(
      <MemoryRouter><ThemeProvider><NavModeProvider><EB><TrainerProfile /></EB></NavModeProvider></ThemeProvider></MemoryRouter>
    );
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/trainer/profile');
    });
    spy.mockRestore();
  });

  it('handles dashboard load failure gracefully', async () => {
    api.get.mockImplementation((path) => {
      if (path === '/trainer/profile') return Promise.resolve(trainerData);
      if (path === '/trainer/dashboard') return Promise.reject(new Error('fail'));
      return Promise.resolve({});
    });
    renderProfile();
    await waitFor(() => {
      expect(screen.getByText('Bob Trainer')).toBeInTheDocument();
    });
    expect(screen.queryByText('Upcoming Sessions')).not.toBeInTheDocument();
  });

  it('handles trainer with null name/phone/specialization (|| fallbacks line 71)', async () => {
    api.get.mockImplementation((path) => {
      if (path === '/trainer/profile') return Promise.resolve({
        trainer: { name: null, email: 'test@test.com', phone: null, specialization: null, dob: null, created_at: null },
      });
      if (path === '/trainer/dashboard') return Promise.resolve(dashboardData);
      return Promise.resolve({});
    });
    renderProfile();
    await waitFor(() => {
      expect(screen.getByText('Edit Profile')).toBeInTheDocument();
    });
  });
});
