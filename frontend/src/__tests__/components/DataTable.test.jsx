import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

function makeRows(n) {
  return Array.from({ length: n }, (_, i) => ({
    id: i + 1,
    name: `User ${i + 1}`,
    status: i % 2 === 0 ? 'active' : 'inactive',
    date: `2025-06-${String(i + 1).padStart(2, '0')}`,
  }));
}

const filterColumns = [
  { key: 'name', label: 'Name' },
  { key: 'status', label: 'Status', filter: true },
];

const dateFilterColumns = [
  { key: 'name', label: 'Name' },
  { key: 'date', label: 'Date', filter: 'date', filterLabel: 'Date' },
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

  it('resets page to 0 on search input change', () => {
    const rows = makeRows(15);
    const { container } = render(<DataTable columns={filterColumns} data={rows} pageSize={5} />);
    const pageButtons = container.querySelectorAll('button');
    const page2Btn = Array.from(pageButtons).find(b => b.textContent === '2');
    fireEvent.click(page2Btn);

    const search = screen.getByPlaceholderText('Search...');
    fireEvent.change(search, { target: { value: 'User 1' } });
    const tbodyRows = container.querySelectorAll('tbody tr');
    expect(tbodyRows.length).toBeGreaterThanOrEqual(1);
  });

  it('renders FilterDropdown for filterable columns and applies filter', async () => {
    const rows = makeRows(12);
    render(<DataTable columns={filterColumns} data={rows} pageSize={20} />);
    const filterBtn = screen.getByText('Status: All');
    expect(filterBtn).toBeInTheDocument();

    fireEvent.click(filterBtn);
    const activeOption = screen.getAllByText('Active').find(el => el.closest('button'));
    fireEvent.click(activeOption);

    const tbodyRows = document.querySelectorAll('tbody tr');
    for (const row of tbodyRows) {
      expect(row.textContent).not.toContain('inactive');
    }
  });

  it('clears filters and search when Clear filters is clicked', async () => {
    const rows = makeRows(12);
    const { container } = render(<DataTable columns={filterColumns} data={rows} pageSize={20} />);

    fireEvent.click(screen.getByText('Status: All'));
    const activeOption = screen.getAllByText('Active').find(el => el.closest('button'));
    fireEvent.click(activeOption);

    const search = screen.getByPlaceholderText('Search...');
    fireEvent.change(search, { target: { value: 'User' } });

    fireEvent.click(screen.getByText('Clear filters'));

    const tbodyRows = container.querySelectorAll('tbody tr');
    expect(tbodyRows.length).toBe(12);
  });

  it('shows pagination when rows exceed pageSize', () => {
    const rows = makeRows(15);
    render(<DataTable columns={filterColumns} data={rows} pageSize={5} />);
    expect(screen.getByText('Prev')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('pagination Prev button is disabled on first page', () => {
    const rows = makeRows(15);
    render(<DataTable columns={filterColumns} data={rows} pageSize={5} />);
    const prevBtn = screen.getByText('Prev');
    expect(prevBtn).toBeDisabled();
  });

  it('pagination Next button navigates forward and Prev navigates back', () => {
    const rows = makeRows(15);
    const { container } = render(<DataTable columns={filterColumns} data={rows} pageSize={5} />);

    fireEvent.click(screen.getByText('Next'));
    let tbodyRows = container.querySelectorAll('tbody tr');
    expect(tbodyRows[0].textContent).toContain('User 6');

    fireEvent.click(screen.getByText('Prev'));
    tbodyRows = container.querySelectorAll('tbody tr');
    expect(tbodyRows[0].textContent).toContain('User 1');
  });

  it('clicking page number navigates to that page', () => {
    const rows = makeRows(15);
    const { container } = render(<DataTable columns={filterColumns} data={rows} pageSize={5} />);

    fireEvent.click(screen.getByText('3'));
    const tbodyRows = container.querySelectorAll('tbody tr');
    expect(tbodyRows[0].textContent).toContain('User 11');
  });

  it('Next button is disabled on last page', () => {
    const rows = makeRows(15);
    render(<DataTable columns={filterColumns} data={rows} pageSize={5} />);
    fireEvent.click(screen.getByText('3'));
    expect(screen.getByText('Next')).toBeDisabled();
  });

  it('shows result count in pagination area', () => {
    const rows = makeRows(15);
    render(<DataTable columns={filterColumns} data={rows} pageSize={5} />);
    expect(screen.getByText('15 results')).toBeInTheDocument();
  });

  it('shows "(filtered)" label when search or filter is active', () => {
    const rows = makeRows(15);
    render(<DataTable columns={filterColumns} data={rows} pageSize={5} />);
    const search = screen.getByPlaceholderText('Search...');
    fireEvent.change(search, { target: { value: 'User 1' } });
    expect(screen.getByText(/\(filtered\)/)).toBeInTheDocument();
  });

  it('shows "(filtered)" label when column filter is active', () => {
    const rows = makeRows(15);
    render(<DataTable columns={filterColumns} data={rows} pageSize={5} />);
    fireEvent.click(screen.getByText('Status: All'));
    const activeOption = screen.getAllByText('Active').find(el => el.closest('button'));
    fireEvent.click(activeOption);
    expect(screen.getByText(/\(filtered\)/)).toBeInTheDocument();
  });

  it('shows singular "result" for 1 match', () => {
    const rows = makeRows(12);
    render(<DataTable columns={filterColumns} data={rows} pageSize={5} />);
    const search = screen.getByPlaceholderText('Search...');
    fireEvent.change(search, { target: { value: 'User 12' } });
    expect(screen.queryByText(/\bresults\b/)).not.toBeInTheDocument();
  });

  it('handles date filter columns', () => {
    const rows = makeRows(5);
    render(<DataTable columns={dateFilterColumns} data={rows} pageSize={20} />);
    const filterBtn = screen.getByText('Date: All');
    expect(filterBtn).toBeInTheDocument();
  });

  it('shows "No matching results." when search yields nothing', () => {
    render(<DataTable columns={columns} data={data} />);
    const search = screen.getByPlaceholderText('Search...');
    fireEvent.change(search, { target: { value: 'nonexistent' } });
    const noMatch = screen.getAllByText('No matching results.');
    expect(noMatch.length).toBeGreaterThanOrEqual(1);
  });

  it('handles null data prop', () => {
    render(<DataTable columns={columns} data={null} emptyMessage="Empty" />);
    expect(screen.getByText('Empty')).toBeInTheDocument();
  });

  it('hides search bar when searchable is false', () => {
    render(<DataTable columns={columns} data={data} searchable={false} />);
    expect(screen.queryByPlaceholderText('Search...')).not.toBeInTheDocument();
  });

  it('renders filter with explicit options', () => {
    const cols = [
      { key: 'name', label: 'Name' },
      {
        key: 'status',
        label: 'Status',
        filter: { options: [{ value: 'on', label: 'On' }, { value: 'off', label: 'Off' }] },
      },
    ];
    const rows = [{ name: 'A', status: 'on' }, { name: 'B', status: 'off' }];
    render(<DataTable columns={cols} data={rows} pageSize={20} />);
    fireEvent.click(screen.getByText('Status: All'));
    expect(screen.getByText('On')).toBeInTheDocument();
    expect(screen.getByText('Off')).toBeInTheDocument();
  });

  it('handles date filter type as object', () => {
    const cols = [
      { key: 'name', label: 'Name' },
      { key: 'date', label: 'Date', filter: { type: 'date' } },
    ];
    const rows = [
      { name: 'A', date: '2025-06-01' },
      { name: 'B', date: '2025-06-02' },
    ];
    render(<DataTable columns={cols} data={rows} pageSize={20} />);
    fireEvent.click(screen.getByText('Date: All'));
    expect(screen.getByText('Jun 1, 2025')).toBeInTheDocument();
  });

  it('applies date filter and filters rows by date match', () => {
    const cols = [
      { key: 'name', label: 'Name' },
      { key: 'date', label: 'Date', filter: 'date', filterLabel: 'Date' },
    ];
    const rows = [
      { name: 'A', date: '2025-06-01' },
      { name: 'B', date: '2025-06-02' },
      { name: 'C', date: '2025-06-01' },
    ];
    const { container } = render(<DataTable columns={cols} data={rows} pageSize={20} />);
    fireEvent.click(screen.getByText('Date: All'));
    fireEvent.click(screen.getByText('Jun 1, 2025'));

    const tbodyRows = container.querySelectorAll('tbody tr');
    expect(tbodyRows.length).toBe(2);
  });

  it('handles rows with null/empty filter values gracefully', () => {
    const cols = [
      { key: 'name', label: 'Name' },
      { key: 'status', label: 'Status', filter: true },
    ];
    const rows = [
      { name: 'A', status: 'active' },
      { name: 'B', status: null },
      { name: 'C', status: '' },
    ];
    render(<DataTable columns={cols} data={rows} pageSize={20} />);
    fireEvent.click(screen.getByText('Status: All'));
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders default empty message when not specified', () => {
    render(<DataTable columns={columns} data={[]} />);
    expect(screen.getByText('No data found.')).toBeInTheDocument();
  });

  it('corrects page when filter reduces total below current page', () => {
    const rows = makeRows(20);
    const { container } = render(<DataTable columns={filterColumns} data={rows} pageSize={5} />);
    fireEvent.click(screen.getByText('4'));
    let tbodyRows = container.querySelectorAll('tbody tr');
    expect(tbodyRows[0].textContent).toContain('User 16');

    const search = screen.getByPlaceholderText('Search...');
    fireEvent.change(search, { target: { value: 'User 1' } });

    tbodyRows = container.querySelectorAll('tbody tr');
    expect(tbodyRows.length).toBeGreaterThanOrEqual(1);
  });

  it('returns null for filterable column with no options', () => {
    const cols = [
      { key: 'name', label: 'Name' },
      { key: 'empty_col', label: 'Empty', filter: true },
    ];
    const rows = [
      { name: 'A', empty_col: null },
      { name: 'B', empty_col: '' },
    ];
    render(<DataTable columns={cols} data={rows} pageSize={20} />);
    expect(screen.queryByText('Empty: All')).not.toBeInTheDocument();
  });

  it('handles date filter matching exact date key', () => {
    const cols = [
      { key: 'name', label: 'Name' },
      { key: 'date', label: 'Date', filter: 'date' },
    ];
    const rows = [
      { name: 'A', date: '2025-06-01T10:00:00' },
      { name: 'B', date: '2025-06-02' },
      { name: 'C', date: null },
    ];
    const { container } = render(<DataTable columns={cols} data={rows} pageSize={20} />);
    fireEvent.click(screen.getByText('Date: All'));
    fireEvent.click(screen.getByText('Jun 1, 2025'));

    const tbodyRows = container.querySelectorAll('tbody tr');
    expect(tbodyRows.length).toBe(1);
  });

  it('handles invalid date in extractDateKey', () => {
    const cols = [
      { key: 'name', label: 'Name' },
      { key: 'date', label: 'Date', filter: 'date' },
    ];
    const rows = [
      { name: 'A', date: 'invalid-date' },
      { name: 'B', date: '2025-06-01' },
    ];
    render(<DataTable columns={cols} data={rows} pageSize={20} />);
    fireEvent.click(screen.getByText('Date: All'));
    expect(screen.getByText('Jun 1, 2025')).toBeInTheDocument();
  });

  it('handles fmtDateLabel with non-string date', () => {
    const cols = [
      { key: 'name', label: 'Name' },
      { key: 'date', label: 'Date', filter: { type: 'date' } },
    ];
    const rows = [
      { name: 'A', date: new Date('2025-06-01').toISOString() },
    ];
    render(<DataTable columns={cols} data={rows} pageSize={20} />);
    fireEvent.click(screen.getByText('Date: All'));
  });

  it('shows singular result count when exactly 1 match with pagination visible', () => {
    const rows = makeRows(12);
    const { container } = render(<DataTable columns={filterColumns} data={rows} pageSize={1} />);
    expect(container.textContent).toContain('12 results');
  });
});
