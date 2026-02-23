import { useState, useRef, useEffect } from 'react';

const ChevronIcon = ({ open }) => (
  <svg
    className={`h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
    fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
  </svg>
);

const CheckIcon = () => (
  <svg className="h-3.5 w-3.5 text-orange-600" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
  </svg>
);

export default function FilterDropdown({ label, value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const selected = options.find(o => o.value === value);
  const displayLabel = selected ? selected.label : `${label}: All`;
  const isFiltered = !!value;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className={`
          inline-flex items-center gap-4 rounded-lg border px-3 py-1.5
          text-sm font-medium shadow-sm transition
          ${isFiltered
            ? 'border-orange-200 bg-orange-50 text-orange-700'
            : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
          }
        `}
      >
        <span className="max-w-[140px] truncate">{displayLabel}</span>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div className="absolute left-0 z-50 mt-1.5 min-w-[180px] max-h-60 overflow-auto rounded-xl border border-gray-200 bg-white py-1 shadow-lg ring-1 ring-black/5 animate-in fade-in slide-in-from-top-1">
          <button
            type="button"
            onClick={() => { onChange(''); setOpen(false); }}
            className={`
              flex w-full items-center justify-between px-3 py-2 text-left text-sm transition
              ${!value ? 'bg-orange-50 text-orange-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}
            `}
          >
            <span>All</span>
            {!value && <CheckIcon />}
          </button>

          <div className="mx-2 my-0.5 border-t border-gray-100" />

          {options.map(opt => {
            const active = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`
                  flex w-full items-center justify-between px-3 py-2 text-left text-sm transition
                  ${active ? 'bg-orange-50 text-orange-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}
                `}
              >
                <span className="truncate pr-2">{opt.label}</span>
                {active && <CheckIcon />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
