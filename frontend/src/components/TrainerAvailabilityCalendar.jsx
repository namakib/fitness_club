import { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from './Icons';

function toYMD(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function timeToDisplay(t) {
  if (!t) return '';
  const s = String(t);
  return s.length > 5 ? s.slice(0, 5) : s;
}

export default function TrainerAvailabilityCalendar({
  slots = [],
  loading = false,
  onSlotSelect,
  bookedByLabel = 'your booking',
  bookedByTooltip,
}) {
  const defaultBookedByTooltip = bookedByLabel === "your booking"
    ? "You've already booked this slot"
    : "Member already has a session here";
  const tooltip = bookedByTooltip ?? defaultBookedByTooltip;
  const [weekOffset, setWeekOffset] = useState(0);

  if (loading) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400">Loading…</div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400">No upcoming availability</div>
    );
  }

  const now = new Date();
  const today = toYMD(now);
  const dayOfWeek = now.getDay();
  const sunday = new Date(now);
  sunday.setDate(now.getDate() - dayOfWeek + weekOffset * 7);
  const weekDates = WEEKDAYS.map((_, i) => {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    return d;
  });
  const weekStart = weekDates[0];
  const weekEnd = weekDates[6];
  const slotByDay = {};
  slots.forEach((s) => {
    const key = s.available_date;
    if (!slotByDay[key]) slotByDay[key] = [];
    slotByDay[key].push(s);
  });

  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setWeekOffset((o) => o - 1)}
          className="p-1.5 rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
          aria-label="Previous week"
        >
          <ChevronLeftIcon className="w-4 h-4" />
        </button>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          Week of {weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
        <button
          type="button"
          onClick={() => setWeekOffset((o) => o + 1)}
          className="p-1.5 rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
          aria-label="Next week"
        >
          <ChevronRightIcon className="w-4 h-4" />
        </button>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        <span className="inline-block w-2.5 h-2.5 rounded-sm bg-green-500/90 align-middle mr-0.5" /> available
        <span className="mx-2">|</span>
        <span className="inline-block w-2.5 h-2.5 rounded-sm bg-indigo-400/80 align-middle mr-0.5" /> {bookedByLabel}
        <span className="mx-2">|</span>
        <span className="inline-block w-2.5 h-2.5 rounded-sm bg-gray-400/80 align-middle mr-0.5" /> taken
      </p>
      <div className="grid grid-cols-7 gap-1 text-xs">
        {weekDates.map((d) => {
          const ymd = toYMD(d);
          const daySlots = slotByDay[ymd] || [];
          const isPast = ymd < today;
          return (
            <div
              key={ymd}
              className={`rounded p-1.5 min-h-[4rem] ${isPast ? 'bg-gray-100 dark:bg-gray-800 opacity-70' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600'}`}
            >
              <div className="font-medium text-gray-600 dark:text-gray-400 mb-1">
                {WEEKDAYS[d.getDay()]} {d.getDate()}
              </div>
              <div className="space-y-1">
                {daySlots.map((slot) => {
                  const isBooked = Boolean(slot.is_booked);
                  const bookedByMe = Boolean(slot.booked_by_me);
                  const disabled = isBooked;
                  const title = bookedByMe
                    ? tooltip
                    : isBooked
                      ? 'This slot is taken'
                      : undefined;
                  const cn = disabled
                    ? bookedByMe
                      ? 'w-full text-left px-1.5 py-0.5 rounded bg-indigo-400/80 text-white border border-indigo-500 cursor-not-allowed'
                      : 'w-full text-left px-1.5 py-0.5 rounded bg-gray-400/80 text-white border border-gray-500 cursor-not-allowed'
                    : 'w-full text-left px-1.5 py-0.5 rounded bg-green-500/90 hover:bg-green-600 text-white border border-green-600 dark:border-green-500';
                  return (
                    <button
                      key={slot.availability_id}
                      type="button"
                      disabled={disabled}
                      title={title}
                      onClick={
                        disabled
                          ? undefined
                          : () =>
                              onSlotSelect(
                                slot.available_date,
                                timeToDisplay(slot.start_time),
                                timeToDisplay(slot.end_time),
                              )
                      }
                      className={cn}
                    >
                      {timeToDisplay(slot.start_time)}–{timeToDisplay(slot.end_time)}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
