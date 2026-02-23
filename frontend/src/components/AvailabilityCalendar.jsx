import { useState, useCallback, useMemo, useEffect } from 'react';
import api from '../api';
import DatePicker from './DatePicker';
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon } from './Icons';

function toYMD(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => i); // 12am–11pm

const EVENT_COLORS = {
  session: 'bg-orange-500/90 dark:bg-orange-600/90 border-orange-600 dark:border-orange-500',
  class: 'bg-violet-500/90 dark:bg-violet-600/90 border-violet-600 dark:border-violet-500',
};

function toMinutes(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = String(timeStr).split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function parseEvent(event) {
  const date = event.event_date ? new Date(event.event_date + 'T12:00:00') : null;
  const startM = toMinutes(event.start_time);
  const endM = toMinutes(event.end_time);
  return { ...event, date, startM, endM };
}

export default function AvailabilityCalendar({ onSlotClick, refreshTrigger }) {
  const [viewDate, setViewDate] = useState(() => new Date());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const weekStart = useMemo(() => {
    const d = new Date(viewDate);
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    return d;
  }, [viewDate]);

  const weekKey = `${weekStart.getFullYear()}-${weekStart.getMonth()}-${weekStart.getDate()}`;

  const load = useCallback(() => {
    setLoading(true);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const months = [[weekStart.getFullYear(), weekStart.getMonth() + 1]];
    if (weekEnd.getMonth() !== weekStart.getMonth() || weekEnd.getFullYear() !== weekStart.getFullYear()) {
      months.push([weekEnd.getFullYear(), weekEnd.getMonth() + 1]);
    }
    Promise.all(months.map(([y, m]) => api.get(`/trainer/calendar?year=${y}&month=${m}`)))
      .then((results) => {
        const merged = {
          sessions: results.flatMap((r) => r.sessions || []),
          classes: results.flatMap((r) => r.classes || []),
        };
        setData(merged);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [weekKey]);

  useEffect(() => { load(); }, [load, refreshTrigger]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [weekStart]);

  const allEvents = useMemo(() => {
    if (!data) return [];
    const list = [
      ...(data.sessions || []).map((e) => ({ ...e, event_type: 'session', title: e.title || 'Session' })),
      ...(data.classes || []).map((e) => ({ ...e, event_type: 'class', title: e.title || 'Class' })),
    ];
    return list.map(parseEvent);
  }, [data]);

  const eventsByDay = useMemo(() => {
    const map = {};
    allEvents.forEach((ev) => {
      if (!ev.date) return;
      const key = ev.date.toISOString().slice(0, 10);
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    });
    return map;
  }, [allEvents]);

  function goPrevWeek() {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setViewDate(d);
  }

  function goNextWeek() {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setViewDate(d);
  }

  function goToday() {
    setViewDate(new Date());
  }

  const minM = 0;
  const maxM = 24 * 60;
  const totalM = maxM - minM;

  function getEventStyle(ev) {
    const top = ((ev.startM - minM) / totalM) * 100;
    const height = ((ev.endM - ev.startM) / totalM) * 100;
    return { top: `${top}%`, height: `${Math.max(height, 4)}%` };
  }

  const monthLabel = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const weekRange = `${weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  if (loading && !data) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-8">
        <div className="animate-pulse h-96 rounded-lg bg-gray-200 dark:bg-gray-700" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Calendar</h2>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-44 shrink-0">
            <DatePicker
              label="Jump to"
              value={toYMD(viewDate)}
              onChange={(val) => val && setViewDate(new Date(val + 'T12:00:00'))}
              placeholder="Select date"
            />
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={goPrevWeek}
              className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition"
              aria-label="Previous week"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={goToday}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              Today
            </button>
            <button
              type="button"
              onClick={goNextWeek}
              className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition"
              aria-label="Next week"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="w-full sm:w-auto text-sm text-gray-600 dark:text-gray-400">
          {monthLabel} · {weekRange}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 px-4 py-2 border-b border-gray-100 dark:border-gray-700/50 text-xs text-gray-600 dark:text-gray-400">
        <span>Empty slots = available for booking</span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-orange-500" />
          Session (booked)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-violet-500" />
          Class (booked)
        </span>
      </div>

      {/* Week grid */}
      <div className="overflow-auto max-h-[80vh]">
        <div className="min-w-[600px] flex">
          {/* Time column */}
          <div className="w-[60px] shrink-0 border-r border-gray-200 dark:border-gray-700">
            <div className="h-12 border-b border-gray-200 dark:border-gray-700" />
            {HOURS.map((h) => (
              <div key={h} className="h-[30px] flex items-center px-1 text-xs text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-700/50">
                {h === 0 ? '12am' : h === 12 ? '12pm' : h < 12 ? `${h}am` : `${h - 12}pm`}
              </div>
            ))}
          </div>

          {/* Day columns */}
          <div className="flex-1 grid grid-cols-7">
            {weekDays.map((d) => {
              const key = d.toISOString().slice(0, 10);
              const events = eventsByDay[key] || [];
              const today = new Date();
              const isToday = d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
              return (
                <div
                  key={key}
                  className={`relative border-r border-gray-200 dark:border-gray-700 last:border-r-0 ${isToday ? 'bg-orange-50/50 dark:bg-orange-900/20' : ''}`}
                  style={{ minHeight: 720 }}
                >
                  {/* Day header */}
                  <div className={`h-12 flex flex-col items-center justify-center border-b border-gray-200 dark:border-gray-700 text-sm font-medium ${isToday ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 ring-1 ring-orange-500/30 dark:ring-orange-400/30' : 'text-gray-700 dark:text-gray-300'}`}>
                    <span className={`text-xs ${isToday ? 'text-orange-600 dark:text-orange-400' : 'text-gray-500 dark:text-gray-400'}`}>{WEEKDAYS[d.getDay()]}</span>
                    {d.getDate()}
                  </div>
                  {/* Hour cells */}
                  <div className="absolute inset-x-0 top-12 bottom-0">
                    {HOURS.map((h) => (
                      <div key={h} className="h-[30px] border-b border-gray-100 dark:border-gray-700/50" />
                    ))}
                  </div>
                  {/* Events */}
                  <div className="absolute inset-x-0.5 top-12 bottom-0 pointer-events-none">
                    <div className="relative w-full" style={{ height: 720 }}>
                      {events.map((ev) => {
                        const style = getEventStyle(ev);
                        const color = EVENT_COLORS[ev.event_type] || EVENT_COLORS.session;
                        return (
                          <div
                            key={`${ev.event_type}-${ev.availability_id || ev.session_id || ev.class_id}-${ev.start_time}`}
                            className={`absolute left-0 right-0 rounded px-1.5 py-0.5 text-[10px] font-medium text-white truncate border cursor-pointer hover:opacity-90 transition pointer-events-auto ${color}`}
                            style={{ ...style, minHeight: 20 }}
                            title={`${ev.title}${ev.location ? ` · ${ev.location}` : ''} ${ev.start_time}–${ev.end_time}`}
                            onClick={() => onSlotClick?.(ev)}
                          >
                            {ev.start_time} {ev.title}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
