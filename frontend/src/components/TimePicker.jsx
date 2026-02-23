import { useState, useRef, useEffect } from 'react';
import t from '../theme';
import { ClockIcon, ChevronUpDownIcon, ChevronUpIcon, ChevronDownIcon } from './Icons';

/** HH:mm (24h) to 12h display e.g. "9:00 AM", "2:30 PM" */
function formatTimeDisplay(hhmm) {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return hhmm;
  const hour12 = h % 12 || 12;
  const ampm = h < 12 ? 'am' : 'pm';
  return `${hour12}:${String(m).padStart(2, '0')} ${ampm}`;
}

/** Parse HH:mm (24h) to { hour12, minute, meridiem } */
function parseValue(hhmm) {
  if (!hhmm) return { hour12: 12, minute: 0, meridiem: 'am' };
  const [h, m] = hhmm.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return { hour12: 12, minute: 0, meridiem: 'am' };
  const hour12 = h % 12 || 12;
  const meridiem = h < 12 ? 'am' : 'pm';
  return { hour12, minute: m, meridiem };
}

/** hour12 (1-12), minute (0-59), meridiem (am|pm) -> HH:mm (24h) */
function to24h(hour12, minute, meridiem) {
  let h = hour12;
  if (meridiem === 'pm' && h !== 12) h += 12;
  if (meridiem === 'am' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

const HOURS_12 = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
const MERIDIEM = ['am', 'pm'];

export default function TimePicker({ label, value, onChange, placeholder = 'Select time', required }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const parsed = parseValue(value);
  const hour12 = value ? parsed.hour12 : 12;
  const minute = value ? parsed.minute : 0;
  const meridiem = value ? parsed.meridiem : 'am';

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  function applyTime(h, m, mer) {
    onChange(to24h(h, m, mer));
  }

  function stepHour(delta) {
    let h = hour12 + delta;
    if (h > 12) h = 1;
    if (h < 1) h = 12;
    applyTime(h, minute, meridiem);
  }

  function stepMinute(delta) {
    let m = minute + delta;
    if (m > 59) m = 0;
    if (m < 0) m = 59;
    applyTime(hour12, m, meridiem);
  }

  function setNow() {
    const n = new Date();
    onChange(`${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`);
  }

  function clearTime() {
    onChange('');
  }

  function selectHour(h) {
    const hNum = parseInt(h, 10);
    applyTime(hNum, minute, meridiem);
  }

  function selectMinute(m) {
    const mNum = parseInt(m, 10);
    applyTime(hour12, mNum, meridiem);
  }

  function selectMeridiem(mer) {
    applyTime(hour12, minute, mer);
  }

  const display = value ? formatTimeDisplay(value) : '';

  return (
    <div>
      {label && (
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500 dark:text-red-400 ml-0.5">*</span>}
        </label>
      )}

      <div className="relative w-full min-w-0" ref={ref}>
        <button
          type="button"
          onClick={() => setOpen(prev => !prev)}
          className={`${t.input} flex items-center justify-between gap-3 text-left w-full min-w-0 ${!display ? 'text-gray-400 dark:text-gray-500' : ''}`}
        >
          <span className="flex items-center gap-2 truncate">
            <ClockIcon />
            {display || placeholder}
          </span>
          <ChevronUpDownIcon open={open} />
        </button>

        {open && (
          <div className="absolute left-0 right-0 top-full z-50 mt-1.5 w-full min-w-0 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black/5 dark:ring-white/5 overflow-hidden">
            {/* Compact row: Hour : Minute with spinners + AM/PM toggle */}
            <div className="p-3 border-b border-gray-100 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3 text-center">Enter time</p>
              <div className="flex items-center justify-center gap-1">
                <div className="flex-1 flex flex-col items-center rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 overflow-hidden min-w-0">
                  <button type="button" onClick={() => stepHour(1)} className="p-1.5 w-full flex justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition">
                    <ChevronUpIcon />
                  </button>
                  <span className="px-2 py-1 text-lg font-semibold text-gray-900 dark:text-gray-100 tabular-nums text-center w-full">
                    {hour12}
                  </span>
                  <button type="button" onClick={() => stepHour(-1)} className="p-1.5 w-full flex justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition">
                    <ChevronDownIcon />
                  </button>
                </div>
                <span className="text-lg font-semibold text-gray-500 dark:text-gray-400 px-0.5 flex-shrink-0">:</span>
                <div className="flex-1 flex flex-col items-center rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 overflow-hidden min-w-0">
                  <button type="button" onClick={() => stepMinute(1)} className="p-1.5 w-full flex justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition">
                    <ChevronUpIcon />
                  </button>
                  <span className="px-2 py-1 text-lg font-semibold text-gray-900 dark:text-gray-100 tabular-nums text-center w-full">
                    {String(minute).padStart(2, '0')}
                  </span>
                  <button type="button" onClick={() => stepMinute(-1)} className="p-1.5 w-full flex justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition">
                    <ChevronDownIcon />
                  </button>
                </div>
                <div className="flex flex-col rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden flex-shrink-0">
                  {MERIDIEM.map(mer => {
                    const active = meridiem === mer;
                    return (
                      <button
                        key={mer}
                        type="button"
                        onClick={() => selectMeridiem(mer)}
                        className={`px-3 py-2 text-sm font-medium transition uppercase ${active ? 'bg-orange-600 text-white dark:bg-orange-500' : 'bg-gray-50 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'}`}
                      >
                        {mer}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button type="button" onClick={setNow} className="flex-1 py-1.5 text-sm font-medium text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition">
                  Now
                </button>
                <button type="button" onClick={clearTime} className="flex-1 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
                  Clear
                </button>
              </div>
            </div>

            {/* Scroll columns: Hour | Minutes | Meridiem — hour and minutes equal width */}
            <div className="flex">
              <div className="flex-1 flex flex-col min-w-0 border-r border-gray-200 dark:border-gray-600">
                <div className="py-1.5 text-center text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
                  Hour
                </div>
                <div className="max-h-28 overflow-y-auto">
                  {HOURS_12.map(h => {
                    const active = hour12 === parseInt(h, 10);
                    return (
                      <button
                        key={h}
                        type="button"
                        onClick={() => selectHour(h)}
                        className={`w-full py-1.5 text-sm text-center transition ${active ? 'bg-orange-600 text-white font-medium dark:bg-orange-500' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                      >
                        {h}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex-1 flex flex-col min-w-0 border-r border-gray-200 dark:border-gray-600">
                <div className="py-1.5 text-center text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
                  Minutes
                </div>
                <div className="max-h-28 overflow-y-auto">
                  {MINUTES.map(m => {
                    const active = minute === parseInt(m, 10);
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => selectMinute(m)}
                        className={`w-full py-1.5 text-sm text-center transition ${active ? 'bg-orange-600 text-white font-medium dark:bg-orange-500' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                      >
                        {m}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex flex-col flex-shrink-0 min-w-[64px]">
                <div className="py-1.5 text-center text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
                  Meridiem
                </div>
                <div className="max-h-28 overflow-y-auto">
                  {MERIDIEM.map(mer => {
                    const active = meridiem === mer;
                    return (
                      <button
                        key={mer}
                        type="button"
                        onClick={() => selectMeridiem(mer)}
                        className={`w-full py-1.5 text-sm text-center transition ${active ? 'bg-orange-600 text-white font-medium dark:bg-orange-500' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                      >
                        {mer}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
