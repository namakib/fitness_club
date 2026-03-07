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
});
