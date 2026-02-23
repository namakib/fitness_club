import { useState, useRef, useEffect, useMemo } from 'react';
import t from '../theme';

const ChevronIcon = ({ open }) => (
  <svg
    className={`h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
    fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
  </svg>
);

const CheckIcon = () => (
  <svg className="h-4 w-4 shrink-0 text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
  </svg>
);

const SearchIcon = () => (
  <svg className="h-4 w-4 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
  </svg>
);

export default function SelectDropdown({ label, value, options, onChange, placeholder = 'Select…', searchable = true }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  useEffect(() => {
    if (open && searchable && searchRef.current) {
      searchRef.current.focus();
    }
    if (!open) setQuery('');
  }, [open, searchable]);

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.toLowerCase();
    return options.filter(o => o.label.toLowerCase().includes(q));
  }, [options, query]);

  const selected = options.find(o => o.value === value);

  return (
    <div>
      {label && <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>}

      <div className="relative" ref={ref}>
        <button
          type="button"
          onClick={() => setOpen(prev => !prev)}
          className={`${t.input} flex items-center justify-between gap-4 text-left ${!selected ? 'text-gray-400 dark:text-gray-500' : ''}`}
        >
          <span className="truncate">{selected ? selected.label : placeholder}</span>
          <ChevronIcon open={open} />
        </button>

        {open && (
          <div className="absolute left-0 right-0 z-50 mt-1.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black/5 dark:ring-white/5">
            {searchable && (
              <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 px-3 py-2">
                <SearchIcon />
                <input
                  ref={searchRef}
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search…"
                  className="w-full bg-transparent text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 outline-none"
                />
              </div>
            )}

            <div className="max-h-52 overflow-auto py-1">
              {filtered.length === 0 ? (
                <p className="px-3 py-2 text-sm text-gray-400 dark:text-gray-500">No results</p>
              ) : (
                filtered.map(opt => {
                  const active = opt.value === value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => { onChange(opt.value); setOpen(false); }}
                      className={`
                        flex w-full items-center justify-between px-3 py-2 text-left text-sm transition
                        ${active
                          ? 'bg-orange-50 text-orange-700 font-medium dark:bg-orange-900/30 dark:text-orange-400'
                          : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'}
                      `}
                    >
                      <span className="truncate pr-2">{opt.label}</span>
                      {active && <CheckIcon />}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
