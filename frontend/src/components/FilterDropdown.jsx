import { useState, useRef, useEffect } from 'react';
import { ChevronUpDownIcon, CheckIcon } from './Icons';
import t from '../theme';

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
        className={`inline-flex items-center gap-4 rounded-lg border px-3 py-1.5 text-sm font-medium shadow-sm transition ${isFiltered ? t.filterButtonActive : t.filterButtonInactive}`}
      >
        <span className="max-w-[140px] truncate">{displayLabel}</span>
        <ChevronUpDownIcon open={open} className="h-3.5 w-3.5" />
      </button>

      {open && (
        <div className={`absolute left-0 z-50 mt-1.5 min-w-[180px] max-h-60 overflow-auto rounded-xl border py-1 shadow-lg ring-1 ring-black/5 dark:ring-white/5 ${t.cardBorder} ${t.cardBg}`}>
          <button
            type="button"
            onClick={() => { onChange(''); setOpen(false); }}
            className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition ${!value ? t.dropdownOptionActive : t.dropdownOptionInactive}`}
          >
            <span>All</span>
            {!value && <CheckIcon className="h-3.5 w-3.5" />}
          </button>

          <div className={`mx-2 my-0.5 border-t ${t.cardBorderMuted}`} />

          {options.map(opt => {
            const active = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition ${active ? t.dropdownOptionActive : t.dropdownOptionInactive}`}
              >
                <span className="truncate pr-2">{opt.label}</span>
                {active && <CheckIcon className="h-3.5 w-3.5" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
