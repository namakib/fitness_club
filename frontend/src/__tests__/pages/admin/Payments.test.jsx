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
    const testId = `select-${label || placeholder || 'dropdown'}`;
    return (
      <div>
        {label && <label htmlFor={testId}>{label}</label>}
        <select data-testid={testId} id={label ? testId : undefined} value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
          <option value="">{placeholder || 'Select...'}</option>
          {(options || []).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
    );
  },
}));

import api from '../../../api';
import { toastError, toastSuccess } from '../../../toastUtil';
import Payments from '../../../pages/admin/Payments';
import { ThemeProvider } from '../../../context/ThemeContext';

function renderPayments() {
  return render(
    <MemoryRouter>
      <ThemeProvider>
        <Payments />
      </ThemeProvider>
    </MemoryRouter>
  );
}

describe('Admin Payments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockImplementation((path) => {
      if (path === '/admin/payments') return Promise.resolve({
        payments: [
          { payment_id: 1, member_name: 'PayAlice', amount: 50, payment_date: '2025-06-01', payment_status: 'completed', payment_method: 'credit_card' },
        ],
      });
      if (path === '/admin/room-booking') return Promise.resolve({
        rooms: [],
        members: [{ member_id: 1, name: 'PayAlice', email: 'payalice@test.com' }],
        trainers: [],
        bookings: [],
      });
      return Promise.resolve({});
    });
    api.post.mockResolvedValue({});
  });

  it('renders payments heading', async () => {
    renderPayments();
    await waitFor(() => {
      expect(screen.getByText('Payments')).toBeInTheDocument();
    });
  });

  it('renders payment data in the table', async () => {
    renderPayments();
    await waitFor(() => {
      expect(screen.getAllByText('PayAlice').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders Record Payment button', async () => {
    renderPayments();
    await waitFor(() => {
      expect(screen.getByText('+ Record Payment')).toBeInTheDocument();
    });
  });

  it('opens Record Payment modal', async () => {
    const user = userEvent.setup();
    renderPayments();
    await waitFor(() => {
      expect(screen.getByText('+ Record Payment')).toBeInTheDocument();
    });

    await user.click(screen.getByText('+ Record Payment'));
    await waitFor(() => {
      expect(screen.getByText('Record Payment')).toBeInTheDocument();
      expect(screen.getByTestId('select-Member')).toBeInTheDocument();
    });
  });

  it('closes modal via Cancel button', async () => {
    const user = userEvent.setup();
    renderPayments();
    await waitFor(() => {
      expect(screen.getByText('+ Record Payment')).toBeInTheDocument();
    });

    await user.click(screen.getByText('+ Record Payment'));
    await screen.findByText('Cancel');
    await user.click(screen.getByText('Cancel'));

    await waitFor(() => {
      expect(screen.queryByTestId('select-Member')).not.toBeInTheDocument();
    });
  });

  it('submits payment form successfully', async () => {
    const user = userEvent.setup();
    renderPayments();
    await waitFor(() => {
      expect(screen.getByText('+ Record Payment')).toBeInTheDocument();
    });

    await user.click(screen.getByText('+ Record Payment'));
    await screen.findByText('Save');

    fireEvent.change(screen.getByTestId('select-Member'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '75.50' } });
    fireEvent.change(screen.getByTestId('select-Status'), { target: { value: 'completed' } });
    fireEvent.change(screen.getByTestId('select-Payment Method (optional)'), { target: { value: 'credit_card' } });

    await user.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/admin/payments', {
        member_id: 1,
        amount: 75.5,
        payment_status: 'completed',
        payment_method: 'credit_card',
      });
      expect(toastSuccess).toHaveBeenCalledWith('Payment recorded.');
    });
  });

  it('submits with default status and empty method', async () => {
    const user = userEvent.setup();
    renderPayments();
    await waitFor(() => {
      expect(screen.getByText('+ Record Payment')).toBeInTheDocument();
    });

    await user.click(screen.getByText('+ Record Payment'));
    await screen.findByText('Save');

    fireEvent.change(screen.getByTestId('select-Member'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '25' } });

    await user.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/admin/payments', {
        member_id: 1,
        amount: 25,
        payment_status: 'pending',
        payment_method: null,
      });
    });
  });

  it('handles payment form submit error', async () => {
    const user = userEvent.setup();
    api.post.mockRejectedValueOnce({ message: 'Payment failed', details: 'insufficient' });
    renderPayments();
    await waitFor(() => {
      expect(screen.getByText('+ Record Payment')).toBeInTheDocument();
    });

    await user.click(screen.getByText('+ Record Payment'));
    await screen.findByText('Save');

    fireEvent.change(screen.getByTestId('select-Member'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '100' } });
    await user.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('Payment failed', 'insufficient');
    });
  });

  it('shows skeleton while loading', () => {
    api.get.mockReturnValue(new Promise(() => {}));
    const { container } = renderPayments();
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('formats payment dates', async () => {
    renderPayments();
    await waitFor(() => {
      expect(screen.getAllByText('Jun 1, 2025').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('formats payment amounts', async () => {
    renderPayments();
    await waitFor(() => {
      expect(screen.getAllByText('$50.00').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders payment status', async () => {
    renderPayments();
    await waitFor(() => {
      expect(screen.getAllByText('completed').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows empty message when no payments', async () => {
    api.get.mockImplementation((path) => {
      if (path === '/admin/payments') return Promise.resolve({ payments: [] });
      if (path === '/admin/room-booking') return Promise.resolve({ members: [] });
      return Promise.resolve({});
    });
    renderPayments();
    await waitFor(() => {
      expect(screen.getByText('No payments recorded.')).toBeInTheDocument();
    });
  });

  it('shows dash for null payment date', async () => {
    api.get.mockImplementation((path) => {
      if (path === '/admin/payments') return Promise.resolve({
        payments: [
          { payment_id: 2, member_name: 'Z', amount: 10, payment_date: null, payment_status: 'pending', payment_method: null },
        ],
      });
      if (path === '/admin/room-booking') return Promise.resolve({ members: [] });
      return Promise.resolve({});
    });
    renderPayments();
    await waitFor(() => {
      expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders subtitle text', async () => {
    renderPayments();
    await waitFor(() => {
      expect(screen.getByText('Simulated billing records. No real payment processing.')).toBeInTheDocument();
    });
  });

  it('handles payments response without payments key (|| [] fallback)', async () => {
    api.get.mockImplementation((path) => {
      if (path === '/admin/payments') return Promise.resolve({});
      if (path === '/admin/room-booking') return Promise.resolve({ members: [] });
      return Promise.resolve({});
    });
    renderPayments();
    await waitFor(() => {
      expect(screen.getByText('No payments recorded.')).toBeInTheDocument();
    });
  });

  it('handles room-booking response without members key (|| [] fallback)', async () => {
    api.get.mockImplementation((path) => {
      if (path === '/admin/payments') return Promise.resolve({ payments: [] });
      if (path === '/admin/room-booking') return Promise.resolve({});
      return Promise.resolve({});
    });
    renderPayments();
    await waitFor(() => {
      expect(screen.getByText('Payments')).toBeInTheDocument();
    });
  });

  it('submits with empty payment_status (|| pending fallback)', async () => {
    const user = userEvent.setup();
    renderPayments();
    await waitFor(() => {
      expect(screen.getByText('+ Record Payment')).toBeInTheDocument();
    });

    await user.click(screen.getByText('+ Record Payment'));
    await screen.findByText('Save');

    fireEvent.change(screen.getByTestId('select-Member'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '50' } });
    fireEvent.change(screen.getByTestId('select-Status'), { target: { value: '' } });

    await user.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/admin/payments', expect.objectContaining({
        payment_status: 'pending',
        payment_method: null,
      }));
    });
  });

  it('handles payments API load failure', async () => {
    api.get.mockImplementation((path) => {
      if (path === '/admin/payments') return Promise.reject(new Error('fail'));
      if (path === '/admin/room-booking') return Promise.resolve({ members: [] });
      return Promise.resolve({});
    });
    renderPayments();
    await waitFor(() => {
      expect(screen.getByText('No payments recorded.')).toBeInTheDocument();
    });
  });

  it('handles room-booking (members) API load failure', async () => {
    api.get.mockImplementation((path) => {
      if (path === '/admin/payments') return Promise.resolve({ payments: [] });
      if (path === '/admin/room-booking') return Promise.reject(new Error('fail'));
      return Promise.resolve({});
    });
    renderPayments();
    await waitFor(() => {
      expect(screen.getByText('Payments')).toBeInTheDocument();
    });
  });

  it('closes modal via X button (onClose)', async () => {
    const user = userEvent.setup();
    renderPayments();
    await waitFor(() => {
      expect(screen.getByText('+ Record Payment')).toBeInTheDocument();
    });

    await user.click(screen.getByText('+ Record Payment'));
    await waitFor(() => {
      expect(screen.getByText('Record Payment')).toBeInTheDocument();
    });

    await user.click(screen.getByLabelText('Close'));
  });
});
