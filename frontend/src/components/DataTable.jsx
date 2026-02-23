import { useState, useMemo } from 'react';
import SearchInput from './SearchInput';
import FilterDropdown from './FilterDropdown';
import { CloseIcon } from './Icons';

function fmtDateLabel(d) {
  if (!d) return '';
  const dt = new Date(d);
  if (isNaN(dt)) return String(d);
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function extractDateKey(val) {
  if (!val) return null;
  const d = new Date(val);
  if (isNaN(d)) return null;
  return d.toISOString().slice(0, 10);
}

function buildFilterOptions(data, col) {
  if (!data || data.length === 0) return [];
  const { key, filter } = col;

  if (filter === 'date' || filter?.type === 'date') {
    const seen = new Map();
    data.forEach(row => {
      const dk = extractDateKey(row[key]);
      if (dk && !seen.has(dk)) seen.set(dk, fmtDateLabel(row[key]));
    });
    return [...seen.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([value, label]) => ({ value, label }));
  }

  const explicit = filter?.options;
  if (explicit) return explicit;

  const unique = [...new Set(data.map(r => r[key]).filter(v => v != null && v !== ''))].sort();
  return unique.map(v => ({
    value: String(v),
    label: String(v).replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
  }));
}

function matchesFilter(row, col, filterValue) {
  if (!filterValue) return true;
  const { key, filter } = col;

  if (filter === 'date' || filter?.type === 'date') {
    return extractDateKey(row[key]) === filterValue;
  }

  return String(row[key]) === filterValue;
}

export default function DataTable({ columns, data, emptyMessage = 'No data found.', searchable = true, pageSize = 10 }) {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [activeFilters, setActiveFilters] = useState({});

  const filterableCols = useMemo(
    () => columns.filter(c => c.filter),
    [columns],
  );

  const filterOptions = useMemo(
    () => Object.fromEntries(filterableCols.map(c => [c.key, buildFilterOptions(data, c)])),
    [data, filterableCols],
  );

  const filtered = useMemo(() => {
    if (!data) return [];
    let rows = data;

    for (const col of filterableCols) {
      const val = activeFilters[col.key];
      if (val) rows = rows.filter(r => matchesFilter(r, col, val));
    }

    if (query.trim()) {
      const q = query.toLowerCase();
      rows = rows.filter(row =>
        columns.some(col => {
          const v = row[col.key];
          return v != null && String(v).toLowerCase().includes(q);
        }),
      );
    }

    return rows;
  }, [data, query, columns, filterableCols, activeFilters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const paged = filtered.slice(safePage * pageSize, (safePage + 1) * pageSize);
  const showPagination = filtered.length > pageSize;

  if (safePage !== page) setPage(safePage);

  const hasToolbar = searchable || filterableCols.length > 0;
  const activeCount = Object.values(activeFilters).filter(Boolean).length;

  if (!data || data.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-8 text-center text-sm text-gray-400 dark:text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  function setFilter(key, value) {
    setActiveFilters(prev => ({ ...prev, [key]: value }));
    setPage(0);
  }

  function clearFilters() {
    setActiveFilters({});
    setQuery('');
    setPage(0);
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      {hasToolbar && (
        <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 dark:border-gray-700/50 px-4 py-3">
          {searchable && (
            <div className="w-full max-w-xs sm:w-auto">
              <SearchInput value={query} onChange={v => { setQuery(v); setPage(0); }} placeholder="Search..." />
            </div>
          )}

          {filterableCols.map(col => {
            const opts = filterOptions[col.key] || [];
            if (opts.length === 0) return null;
            return (
              <FilterDropdown
                key={col.key}
                label={col.filterLabel || col.label}
                value={activeFilters[col.key] || ''}
                options={opts}
                onChange={v => setFilter(col.key, v)}
              />
            );
          })}

          {activeCount > 0 && (
            <button onClick={clearFilters}
              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition">
              <CloseIcon />
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Mobile: card layout */}
      <div className="divide-y divide-gray-100 dark:divide-gray-700/50 md:hidden">
        {paged.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-gray-400 dark:text-gray-500">
            No matching results.
          </div>
        ) : (
          paged.map((row, i) => (
            <div
              key={row.id || safePage * pageSize + i}
              className="px-4 py-3 space-y-1.5 bg-white dark:bg-gray-800"
            >
              {columns.map(col => (
                <div key={col.key} className="flex justify-between gap-3 text-sm">
                  <span className="shrink-0 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {col.label}
                  </span>
                  <span className="text-right text-gray-700 dark:text-gray-300 break-words min-w-0">
                    {col.render ? col.render(row) : row[col.key]}
                  </span>
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-700/50 bg-gray-50/60 dark:bg-gray-700/30">
              {columns.map(col => (
                <th key={col.key} className="px-4 py-3 text-left text-xs font-semibold tracking-wider text-gray-500 dark:text-gray-400 uppercase">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {paged.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-sm text-gray-400 dark:text-gray-500">
                  No matching results.
                </td>
              </tr>
            ) : (
              paged.map((row, i) => (
                <tr key={row.id || safePage * pageSize + i} className="transition hover:bg-gray-50/50 dark:hover:bg-gray-700/30">
                  {columns.map(col => (
                    <td key={col.key} className="px-4 py-3 whitespace-nowrap text-gray-700 dark:text-gray-300">
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showPagination && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 dark:border-gray-700/50 px-4 py-3">
          <p className="text-xs text-gray-500 dark:text-gray-400 order-2 md:order-1">
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
            {(query || activeCount > 0) && ' (filtered)'}
          </p>
          <div className="flex flex-wrap items-center gap-1 order-1 md:order-2">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={safePage === 0}
              className="rounded-md px-2.5 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition">
              Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i} onClick={() => setPage(i)}
                className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition ${
                  i === safePage ? 'bg-orange-600 text-white shadow-sm dark:bg-orange-500' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}>
                {i + 1}
              </button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={safePage >= totalPages - 1}
              className="rounded-md px-2.5 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition">
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
