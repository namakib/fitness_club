import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

vi.mock('../../api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

import api from '../../api';
import { DemoProvider, useDemo } from '../../context/DemoContext';

function DemoStatus() {
  const { demoMode, demoAccounts } = useDemo();
  return (
    <div>
      <span data-testid="mode">{demoMode ? 'demo' : 'normal'}</span>
      <span data-testid="count">{demoAccounts.length}</span>
    </div>
  );
}

describe('DemoContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('provides demoMode=true and accounts when API returns demo config', async () => {
    api.get.mockResolvedValueOnce({
      demo_mode: true,
      demo_accounts: [
        { role: 'member', email: 'a@b.com', password: 'pw' },
        { role: 'trainer', email: 'c@d.com', password: 'pw' },
      ],
    });

    render(
      <DemoProvider>
        <DemoStatus />
      </DemoProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('mode')).toHaveTextContent('demo');
      expect(screen.getByTestId('count')).toHaveTextContent('2');
    });
    expect(api.get).toHaveBeenCalledWith('/config');
  });

  it('provides demoMode=false when API returns non-demo config', async () => {
    api.get.mockResolvedValueOnce({ demo_mode: false });

    render(
      <DemoProvider>
        <DemoStatus />
      </DemoProvider>,
    );

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/config');
    });
    expect(screen.getByTestId('mode')).toHaveTextContent('normal');
    expect(screen.getByTestId('count')).toHaveTextContent('0');
  });

  it('handles API error gracefully and defaults to non-demo', async () => {
    api.get.mockRejectedValueOnce(new Error('Network error'));

    render(
      <DemoProvider>
        <DemoStatus />
      </DemoProvider>,
    );

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/config');
    });
    expect(screen.getByTestId('mode')).toHaveTextContent('normal');
    expect(screen.getByTestId('count')).toHaveTextContent('0');
  });

  it('handles missing fields in API response', async () => {
    api.get.mockResolvedValueOnce({});

    render(
      <DemoProvider>
        <DemoStatus />
      </DemoProvider>,
    );

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/config');
    });
    expect(screen.getByTestId('mode')).toHaveTextContent('normal');
    expect(screen.getByTestId('count')).toHaveTextContent('0');
  });
});
