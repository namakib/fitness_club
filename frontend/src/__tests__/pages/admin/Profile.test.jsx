import React from 'react';
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
vi.mock('../../../components/PhoneInput', () => {
  function MockPhoneInput({ label, value, onChange }) {
    return (
      <div>
        {label && <label htmlFor="admin-phone">{label}</label>}
        <input id="admin-phone" value={value ?? ''} onChange={onChange} />
      </div>
    );
  }
  MockPhoneInput.formatPhoneDisplay = (v) => v || '';
  return { default: MockPhoneInput, formatPhoneDisplay: (v) => v || '' };
});

import api from '../../../api';
import { toastError, toastSuccess } from '../../../toastUtil';
import AdminProfile from '../../../pages/admin/Profile';
import { ThemeProvider } from '../../../context/ThemeContext';
import { NavModeProvider } from '../../../context/NavModeContext';

const adminData = {
  admin: { name: 'Admin User', email: 'admin@gym.com', phone: '5551112222' },
};

const dashboardData = {
  total_members: 50,
  total_trainers: 5,
  total_equipment: 20,
  total_rooms: 10,
};

function renderProfile() {
  return render(
    <MemoryRouter>
      <ThemeProvider>
        <NavModeProvider>
          <AdminProfile />
        </NavModeProvider>
      </ThemeProvider>
    </MemoryRouter>
  );
}

describe('Admin Profile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockImplementation((path) => {
      if (path === '/admin/profile') return Promise.resolve(adminData);
      if (path === '/admin/dashboard') return Promise.resolve(dashboardData);
      return Promise.resolve({});
    });
  });

  it('renders admin name after load', async () => {
    renderProfile();
    await waitFor(() => {
      expect(screen.getByText('Admin User')).toBeInTheDocument();
    });
  });

  it('renders admin email', async () => {
    renderProfile();
    await waitFor(() => {
      expect(screen.getByText('admin@gym.com')).toBeInTheDocument();
    });
  });

  it('renders edit profile section', async () => {
    renderProfile();
    await waitFor(() => {
      expect(screen.getByText('Edit Profile')).toBeInTheDocument();
    });
  });

  it('renders email field as disabled', async () => {
    renderProfile();
    await waitFor(() => {
      expect(screen.getByDisplayValue('admin@gym.com')).toBeDisabled();
    });
  });

  it('renders stat cards from dashboard data', async () => {
    renderProfile();
    await waitFor(() => {
      expect(screen.getAllByText('50').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('5').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('20').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('10').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('hides stat cards when dashboard load fails', async () => {
    api.get.mockImplementation((path) => {
      if (path === '/admin/profile') return Promise.resolve(adminData);
      if (path === '/admin/dashboard') return Promise.reject(new Error('fail'));
      return Promise.resolve({});
    });
    renderProfile();
    await waitFor(() => {
      expect(screen.getByText('Admin User')).toBeInTheDocument();
    });
    expect(screen.queryByText('Total Members')).not.toBeInTheDocument();
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
      expect(api.put).toHaveBeenCalledWith('/admin/profile', {
        name: 'Admin User',
        phone: '5551112222',
      });
      expect(toastSuccess).toHaveBeenCalledWith('Profile updated.');
    });
  });

  it('handles profile form submit error', async () => {
    const user = userEvent.setup();
    api.put.mockRejectedValueOnce({ message: 'Error', details: 'bad' });
    renderProfile();
    await waitFor(() => {
      expect(screen.getByText('Save Changes')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Save Changes'));

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('Error', 'bad');
    });
  });

  it('updates name input and submits', async () => {
    const user = userEvent.setup();
    api.put.mockResolvedValueOnce({});
    renderProfile();
    await waitFor(() => {
      expect(screen.getByDisplayValue('Admin User')).toBeInTheDocument();
    });

    const nameInput = screen.getByDisplayValue('Admin User');
    await user.clear(nameInput);
    await user.type(nameInput, 'New Admin');
    await user.click(screen.getByText('Save Changes'));

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/admin/profile', expect.objectContaining({
        name: 'New Admin',
      }));
    });
  });

  it('shows skeleton while loading', () => {
    api.get.mockReturnValue(new Promise(() => {}));
    const { container } = renderProfile();
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders phone meta in profile header', async () => {
    renderProfile();
    await waitFor(() => {
      expect(screen.getAllByText('Phone').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders Total Members and Total Trainers meta when stats load', async () => {
    renderProfile();
    await waitFor(() => {
      const totalMembersTexts = screen.getAllByText('Total Members');
      expect(totalMembersTexts.length).toBeGreaterThanOrEqual(1);
      const totalTrainersTexts = screen.getAllByText('Total Trainers');
      expect(totalTrainersTexts.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows Saving... text while submitting', async () => {
    const user = userEvent.setup();
    api.put.mockReturnValue(new Promise(() => {}));
    renderProfile();
    await waitFor(() => {
      expect(screen.getByText('Save Changes')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Save Changes'));
    expect(screen.getByText('Saving...')).toBeInTheDocument();
  });

  it('handles admin with null/empty phone and name', async () => {
    api.get.mockImplementation((path) => {
      if (path === '/admin/profile') return Promise.resolve({ admin: { name: '', email: 'a@a.com', phone: '' } });
      if (path === '/admin/dashboard') return Promise.resolve(dashboardData);
      return Promise.resolve({});
    });
    renderProfile();
    await waitFor(() => {
      expect(screen.getByText('a@a.com')).toBeInTheDocument();
    });
  });

  it('handles profile API failure (catch handler called)', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    api.get.mockImplementation((path) => {
      if (path === '/admin/profile') return Promise.reject(new Error('fail'));
      if (path === '/admin/dashboard') return Promise.resolve(dashboardData);
      return Promise.resolve({});
    });
    const ErrorFallback = () => <div>Error</div>;
    class EB extends React.Component { state = {}; static getDerivedStateFromError() { return { err: true }; } render() { return this.state.err ? <ErrorFallback /> : this.props.children; } }
    render(
      <MemoryRouter><ThemeProvider><NavModeProvider><EB><AdminProfile /></EB></NavModeProvider></ThemeProvider></MemoryRouter>
    );
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/admin/profile');
    });
    spy.mockRestore();
  });

  it('updates phone field via ProfileForm', async () => {
    const user = userEvent.setup();
    api.put.mockResolvedValueOnce({});
    renderProfile();
    await waitFor(() => {
      expect(screen.getByDisplayValue('5551112222')).toBeInTheDocument();
    });

    const phoneInput = screen.getByDisplayValue('5551112222');
    await user.clear(phoneInput);
    await user.type(phoneInput, '9998887777');
    await user.click(screen.getByText('Save Changes'));

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/admin/profile', expect.objectContaining({
        phone: '9998887777',
      }));
    });
  });

  it('handles dashboard error (no stats)', async () => {
    api.get.mockImplementation((path) => {
      if (path === '/admin/profile') return Promise.resolve(adminData);
      if (path === '/admin/dashboard') return Promise.reject(new Error('fail'));
      return Promise.resolve({});
    });
    renderProfile();
    await waitFor(() => {
      expect(screen.getByText('Admin User')).toBeInTheDocument();
    });
  });
});
