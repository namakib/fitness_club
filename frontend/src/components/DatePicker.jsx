import { useState, useRef, useEffect } from 'react';
import t from '../theme';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const ChevronLeft = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
  </svg>
);

const ChevronRight = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
  </svg>
);

const ChevronDoubleLeft = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m18.75 4.5-7.5 7.5 7.5 7.5" />
    <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 4.5-7.5 7.5 7.5 7.5" />
  </svg>
);

const ChevronDoubleRight = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m5.25 19.5 7.5-7.5 7.5 7.5" />
    <path strokeLinecap="round" strokeLinejoin="round" d="m12.75 19.5 7.5-7.5 7.5 7.5" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="h-4 w-4 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
  </svg>
);

function formatDisplay(value) {
  if (!value) return '';
  const d = new Date(value + 'T12:00:00');
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function toYMD(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getCalendarGrid(year, month) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startPad = first.getDay();
  const daysInMonth = last.getDate();
  const cells = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  const remainder = (startPad + daysInMonth) % 7;
  if (remainder !== 0) for (let i = 0; i < 7 - remainder; i++) cells.push(null);
  return cells;
}

function getDecadeRange(year) {
  const start = Math.floor(year / 10) * 10;
  return [start, start + 11];
}

export default function DatePicker({ label, value, onChange, placeholder = 'Select date', min, max, required }) {
  const [open, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState('day');
  const ref = useRef(null);

  const valueDate = value ? new Date(value + 'T12:00:00') : null;
  const [view, setView] = useState(() => {
    if (valueDate && !isNaN(valueDate.getTime())) return { year: valueDate.getFullYear(), month: valueDate.getMonth() };
    const n = new Date();
    return { year: n.getFullYear(), month: n.getMonth() };
  });

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const minDate = min ? new Date(min + 'T00:00:00') : null;
  const maxDate = max ? new Date(max + 'T23:59:59') : null;

  const grid = getCalendarGrid(view.year, view.month);
  const [decadeStart, decadeEnd] = getDecadeRange(view.year);

  function goPrevMonth() {
    setView(prev => (prev.month === 0 ? { year: prev.year - 1, month: 11 } : { year: prev.year, month: prev.month - 1 }));
  }

  function goNextMonth() {
    setView(prev => (prev.month === 11 ? { year: prev.year + 1, month: 0 } : { year: prev.year, month: prev.month + 1 }));
  }

  function goPrevYear() {
    setView(prev => ({ ...prev, year: prev.year - 1 }));
  }

  function goNextYear() {
    setView(prev => ({ ...prev, year: prev.year + 1 }));
  }

  function goPrevDecade() {
    setView(prev => ({ ...prev, year: prev.year - 12 }));
  }

  function goNextDecade() {
    setView(prev => ({ ...prev, year: prev.year + 12 }));
  }

  function isDisabled(year, month, day) {
    const d = new Date(year, month, day);
    if (minDate && d < minDate) return true;
    if (maxDate && d > maxDate) return true;
    return false;
  }

  function isMonthDisabled(year, month) {
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    if (minDate && last < minDate) return true;
    if (maxDate && first > maxDate) return true;
    return false;
  }

  function isYearDisabled(year) {
    if (minDate && year < minDate.getFullYear()) return true;
    if (maxDate && year > maxDate.getFullYear()) return true;
    return false;
  }

  function handleSelectDay(day) {
    const ymd = toYMD(new Date(view.year, view.month, day));
    onChange(ymd);
    setOpen(false);
  }

  function handleSelectMonth(month) {
    setView(prev => ({ ...prev, month }));
    setViewMode('day');
  }

  function handleSelectYear(year) {
    setView(prev => ({ ...prev, year }));
    setViewMode('month');
  }

  const monthLabel = new Date(view.year, view.month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const today = toYMD(new Date());

  const navButtonClass = 'rounded-lg p-1.5 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700';
  const headerLabelClass = 'cursor-pointer rounded px-2 py-0.5 text-sm font-semibold text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700';

  return (
    <div>
      {label && (
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500"> *</span>}
        </label>
      )}
      <div className="relative" ref={ref}>
        <button
          type="button"
          onClick={() => setOpen(prev => !prev)}
          className={`${t.input} flex items-center justify-between gap-2 text-left ${!value ? 'text-gray-400 dark:text-gray-500' : ''}`}
        >
          <span className="flex items-center gap-2 truncate">
            <CalendarIcon />
            {value ? formatDisplay(value) : placeholder}
          </span>
          <svg className={`h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </button>

        {open && (
          <div className="absolute left-0 z-50 mt-1.5 w-[280px] rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 p-3 shadow-lg ring-1 ring-black/5 dark:ring-white/5">
            {/* Header: navigation + clickable label to switch view */}
            <div className="mb-3 flex items-center justify-between">
              <button type="button" onClick={viewMode === 'day' ? goPrevMonth : viewMode === 'month' ? goPrevYear : goPrevDecade} className={navButtonClass}>
                {viewMode === 'year' ? <ChevronDoubleLeft /> : <ChevronLeft />}
              </button>

              <button
                type="button"
                onClick={() => setViewMode(viewMode === 'day' ? 'month' : viewMode === 'month' ? 'year' : 'day')}
                className={headerLabelClass}
              >
                {viewMode === 'day' && monthLabel}
                {viewMode === 'month' && view.year}
                {viewMode === 'year' && `${decadeStart} – ${decadeEnd}`}
              </button>

              <button type="button" onClick={viewMode === 'day' ? goNextMonth : viewMode === 'month' ? goNextYear : goNextDecade} className={navButtonClass}>
                {viewMode === 'year' ? <ChevronDoubleRight /> : <ChevronRight />}
              </button>
            </div>

            {/* Day view */}
            {viewMode === 'day' && (
              <div className="grid grid-cols-7 gap-0.5 text-center">
                {WEEKDAYS.map(day => (
                  <div key={day} className="py-1 text-[11px] font-medium text-gray-500 dark:text-gray-400">
                    {day}
                  </div>
                ))}
                {grid.map((day, i) => {
                  if (day === null) return <div key={`e-${i}`} />;
                  const ymd = toYMD(new Date(view.year, view.month, day));
                  const disabled = isDisabled(view.year, view.month, day);
                  const isSelected = value === ymd;
                  const isToday = ymd === today;
                  return (
                    <button
                      key={ymd}
                      type="button"
                      disabled={disabled}
                      onClick={() => !disabled && handleSelectDay(day)}
                      className={`
                        rounded-lg py-2 text-sm transition
                        ${disabled ? 'cursor-not-allowed text-gray-300 dark:text-gray-600' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}
                        ${isSelected ? 'bg-orange-600 text-white hover:bg-orange-500 dark:bg-orange-500 dark:hover:bg-orange-400' : 'text-gray-800 dark:text-gray-200'}
                        ${!isSelected && isToday ? 'ring-1 ring-orange-500 dark:ring-orange-400' : ''}
                      `}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Month view */}
            {viewMode === 'month' && (
              <div className="grid grid-cols-3 gap-1">
                {MONTHS.map((name, month) => {
                  const disabled = isMonthDisabled(view.year, month);
                  return (
                    <button
                      key={name}
                      type="button"
                      disabled={disabled}
                      onClick={() => !disabled && handleSelectMonth(month)}
                      className={`
                        rounded-lg py-2.5 text-sm font-medium transition
                        ${disabled ? 'cursor-not-allowed text-gray-300 dark:text-gray-600' : 'text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700'}
                      `}
                    >
                      {name}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Year view (decade) */}
            {viewMode === 'year' && (
              <div className="grid grid-cols-3 gap-1">
                {Array.from({ length: 12 }, (_, i) => decadeStart + i).map(year => {
                  const disabled = isYearDisabled(year);
                  const isSelected = valueDate && valueDate.getFullYear() === year;
                  return (
                    <button
                      key={year}
                      type="button"
                      disabled={disabled}
                      onClick={() => !disabled && handleSelectYear(year)}
                      className={`
                        rounded-lg py-2.5 text-sm font-medium transition
                        ${disabled ? 'cursor-not-allowed text-gray-300 dark:text-gray-600' : 'text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700'}
                        ${isSelected ? 'bg-orange-600 text-white hover:bg-orange-500 dark:bg-orange-500 dark:hover:bg-orange-400' : ''}
                      `}
                    >
                      {year}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
