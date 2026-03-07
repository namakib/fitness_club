import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import DataTable from '../../components/DataTable';

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
];

const data = [
  { name: 'Alice', email: 'alice@test.com' },
  { name: 'Bob', email: 'bob@test.com' },
  { name: 'Carol', email: 'carol@test.com' },
];

describe('DataTable', () => {
  it('renders table with headers', () => {
    const { container } = render(<DataTable columns={columns} data={data} />);
    const ths = container.querySelectorAll('th');
    const headerTexts = Array.from(ths).map(th => th.textContent);
    expect(headerTexts).toContain('Name');
    expect(headerTexts).toContain('Email');
  });

  it('renders all data rows', () => {
    const { container } = render(<DataTable columns={columns} data={data} />);
    const rows = container.querySelectorAll('tbody tr');
    expect(rows.length).toBe(3);
  });

  it('shows empty message when data is empty', () => {
    render(<DataTable columns={columns} data={[]} emptyMessage="No records found" />);
    expect(screen.getByText('No records found')).toBeInTheDocument();
  });

  it('renders custom cell via render prop', () => {
    const cols = [
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email', render: (r) => <span data-testid="custom">{r.email.toUpperCase()}</span> },
    ];
    render(<DataTable columns={cols} data={[{ name: 'Test User', email: 'test@custom.com' }]} />);
    const customs = screen.getAllByTestId('custom');
    expect(customs.length).toBeGreaterThanOrEqual(1);
    expect(customs[0].textContent).toBe('TEST@CUSTOM.COM');
  });

  it('search filters visible rows', () => {
    const { container } = render(<DataTable columns={columns} data={data} />);
    const search = screen.getByPlaceholderText('Search...');
    fireEvent.change(search, { target: { value: 'Alice' } });
    const rows = container.querySelectorAll('tbody tr');
    expect(rows.length).toBe(1);
  });
});
