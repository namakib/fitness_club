import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import DatePicker from './DatePicker';
import Modal from './Modal';
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon } from './Icons';

function toYMD(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function toDateKey(d) {
  if (!d) return null;
  return toYMD(d);
}

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function noonDate(d) {
  const c = new Date(d);
  c.setHours(12, 0, 0, 0);
  return c;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

const EVENT_COLORS = {
  session: 'bg-orange-500/90 dark:bg-orange-600/90 border-orange-600 dark:border-orange-500',
  class: 'bg-violet-500/90 dark:bg-violet-600/90 border-violet-600 dark:border-violet-500',
};

function toMinutes(timeStr) {
  const [h, m] = String(timeStr).split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function normalizeSession(s) {
  return {
    ...s,
    event_type: 'session',
    event_date: s.session_date || s.event_date,
    title: s.trainer_name || s.title || 'Session',
  };
}

function normalizeClass(c) {
  return {
    ...c,
    event_type: 'class',
    event_date: c.class_date || c.event_date,
    title: c.class_name || c.title || 'Class',
  };
}

function parseEvent(event) {
  const date = event.event_date ? new Date(event.event_date + 'T12:00:00') : null;
  const startM = toMinutes(event.start_time);
  const endM = toMinutes(event.end_time);
  return { ...event, date, startM, endM };
}

const DEFAULT_LEGEND = [
  { color: 'bg-orange-500', label: 'Session' },
  { color: 'bg-violet-500', label: 'Class' },
];

/**
 * Reusable weekly schedule calendar. API-agnostic -- all data comes via props.
 *
 * Data source (provide exactly one):
 *   loadEvents(weekStart: Date) => Promise<{ sessions, classes }>  -- component fetches
 *   events: { sessions, classes }                                  -- parent passes static data
 *
 * Event interaction:
 *   onEventClick(normalizedEvent)             -- always called on click
 *   renderEventModal(event, onClose, onSaved) -- if provided, opens a Modal with this content
 */
export default function ScheduleCalendar({
  loadEvents,
  events: eventsProp,
  onEventClick,
  renderEventModal,
  title = 'Calendar',
  legend,
  refreshTrigger,
  jumpToDate,
}) {
  const [selectedDate, setSelectedDate] = useState(() => noonDate(new Date()));
  const [windowStart, setWindowStart] = useState(() => noonDate(new Date()));
  const [data, setData] = useState(loadEvents ? null : eventsProp);
  const [loading, setLoading] = useState(!!loadEvents);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const windowKey = `${windowStart.getFullYear()}-${windowStart.getMonth()}-${windowStart.getDate()}`;

  const fetchData = useCallback(() => {
    setLoading(true);
    loadEvents(windowStart)
      .then((result) => { setData(result); setLoading(false); })
      .catch(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadEvents, windowKey]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (loadEvents) fetchData(); }, [fetchData, refreshTrigger]);

  useEffect(() => { if (!loadEvents) setData(eventsProp); }, [eventsProp, loadEvents]);

  useEffect(() => {
    if (jumpToDate) {
      const sel = noonDate(new Date(jumpToDate + 'T12:00:00'));
      setSelectedDate(sel);
      const ws = new Date(sel);
      ws.setDate(ws.getDate() - 3);
      setWindowStart(ws);
    }
  }, [jumpToDate]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const resolvedData = loadEvents ? data : (eventsProp ?? { sessions: [], classes: [] });

  const weekDays = useMemo(() => {
    const [y, m, day] = [windowStart.getFullYear(), windowStart.getMonth(), windowStart.getDate()];
    return Array.from({ length: 7 }, (_, i) => new Date(y, m, day + i, 12, 0, 0));
  }, [windowStart]);

  const allEvents = useMemo(() => {
    if (!resolvedData) return [];
    const sessions = (resolvedData.sessions || []).map(normalizeSession);
    const classes = (resolvedData.classes || []).map(normalizeClass);
    return [...sessions, ...classes].map(parseEvent);
  }, [resolvedData]);

  const prevKeysRef = useRef(null);
  const [newEventKeys, setNewEventKeys] = useState(() => new Set());

  useEffect(() => {
    const currentKeys = new Set(
      allEvents.map((ev) => `${ev.event_type}-${ev.session_id || ev.class_id || ev.availability_id}`),
    );
    if (prevKeysRef.current !== null) {
      const added = new Set();
      for (const k of currentKeys) {
        if (!prevKeysRef.current.has(k)) added.add(k);
      }
      if (added.size > 0) {
        setNewEventKeys(added);
        const timer = setTimeout(() => setNewEventKeys(new Set()), 3000);
        prevKeysRef.current = currentKeys;
        return () => clearTimeout(timer);
      }
    }
    prevKeysRef.current = currentKeys;
  }, [allEvents]);

  const eventsByDay = useMemo(() => {
    const map = {};
    allEvents.forEach((ev) => {
      const raw = typeof ev.event_date === 'string' ? ev.event_date.slice(0, 10) : null;
      const key = (raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : null) || toDateKey(ev.date);
      if (!key) return;
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    });
    return map;
  }, [allEvents]);

  function goPrev() {
    const newSel = new Date(selectedDate);
    newSel.setDate(newSel.getDate() - 1);
    setSelectedDate(newSel);
    if (newSel < windowStart) {
      const ws = new Date(windowStart);
      ws.setDate(ws.getDate() - 1);
      setWindowStart(ws);
    }
  }
  function goNext() {
    const newSel = new Date(selectedDate);
    newSel.setDate(newSel.getDate() + 1);
    setSelectedDate(newSel);
    const windowEnd = new Date(windowStart);
    windowEnd.setDate(windowEnd.getDate() + 6);
    if (newSel > windowEnd) {
      const ws = new Date(windowStart);
      ws.setDate(ws.getDate() + 1);
      setWindowStart(ws);
    }
  }
  function goToday() {
    const now = noonDate(new Date());
    setSelectedDate(now);
    setWindowStart(now);
  }

  const totalM = 24 * 60;
  function getEventStyle(ev) {
    const top = (ev.startM / totalM) * 100;
    const height = ((ev.endM - ev.startM) / totalM) * 100;
    return { top: `${top}%`, height: `${Math.max(height, 4)}%` };
  }

  function handleEventClick(ev) {
    onEventClick?.(ev);
    if (renderEventModal) setSelectedEvent(ev);
  }

  function handleModalClose() { setSelectedEvent(null); }
  function handleModalSaved() {
    setSelectedEvent(null);
    if (loadEvents) fetchData();
  }

  const monthLabel = selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const weekRange = `${weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  const legendItems = legend
    ? (Array.isArray(legend) ? legend : [legend])
    : null;

  if (loading && !data) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-8">
        <div className="animate-pulse h-96 rounded-lg bg-gray-200 dark:bg-gray-700" />
      </div>
    );
  }

  return (
    <>
      <style>{`@keyframes highlight-pulse{0%,15%{box-shadow:0 0 12px 4px rgba(250,204,21,.6);transform:scale(1.04)}100%{box-shadow:0 0 0 0 transparent;transform:scale(1)}}`}</style>
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{title}</h2>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-44 shrink-0">
              <DatePicker
                label="Jump to"
                value={toYMD(selectedDate)}
                onChange={(val) => {
                  if (!val) return;
                  const sel = noonDate(new Date(val + 'T12:00:00'));
                  setSelectedDate(sel);
                  const ws = new Date(sel);
                  ws.setDate(ws.getDate() - 3);
                  setWindowStart(ws);
                }}
                placeholder="Select date"
              />
            </div>
            <div className="flex items-center gap-1">
              <button type="button" onClick={goPrev} className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition" aria-label="Previous day">
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              <button type="button" onClick={goToday} className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                Today
              </button>
              <button type="button" onClick={goNext} className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition" aria-label="Next day">
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
          {legendItems
            ? legendItems.map((item, i) => <span key={i}>{item}</span>)
            : DEFAULT_LEGEND.map((l) => (
                <span key={l.label} className="flex items-center gap-1.5">
                  <span className={`w-3 h-3 rounded ${l.color}`} />
                  {l.label}
                </span>
              ))
          }
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
                const key = toDateKey(d);
                const dayEvents = eventsByDay[key] || [];
                const now = new Date();
                const isToday = sameDay(d, now);
                const isSelected = sameDay(d, selectedDate);

                const colBg = isToday && isSelected
                  ? 'bg-orange-50/50 dark:bg-orange-900/20'
                  : isToday
                    ? 'bg-orange-50/50 dark:bg-orange-900/20'
                    : isSelected
                      ? 'bg-blue-50/50 dark:bg-blue-900/20'
                      : '';

                let headerCls = 'text-gray-700 dark:text-gray-300';
                let dayLabelCls = 'text-gray-500 dark:text-gray-400';
                if (isToday && isSelected) {
                  headerCls = 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 ring-2 ring-blue-500/60 dark:ring-blue-400/60';
                  dayLabelCls = 'text-orange-600 dark:text-orange-400';
                } else if (isToday) {
                  headerCls = 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 ring-1 ring-orange-500/30 dark:ring-orange-400/30';
                  dayLabelCls = 'text-orange-600 dark:text-orange-400';
                } else if (isSelected) {
                  headerCls = 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/60 dark:ring-blue-400/60';
                  dayLabelCls = 'text-blue-600 dark:text-blue-400';
                }

                return (
                  <div
                    key={key}
                    className={`relative border-r border-gray-200 dark:border-gray-700 last:border-r-0 ${colBg}`}
                    style={{ minHeight: 720 }}
                  >
                    <div className={`h-12 flex flex-col items-center justify-center border-b border-gray-200 dark:border-gray-700 text-sm font-medium ${headerCls}`}>
                      <span className={`text-xs ${dayLabelCls}`}>{WEEKDAYS[d.getDay()]}</span>
                      {d.getDate()}
                    </div>
                    <div className="absolute inset-x-0 top-12 bottom-0 pointer-events-none">
                      {HOURS.map((h) => (
                        <div key={h} className="h-[30px] border-b border-gray-100 dark:border-gray-700/50" />
                      ))}
                    </div>
                    <div className="absolute inset-x-0.5 top-12 bottom-0 z-10" style={{ height: 720 }}>
                      {dayEvents.map((ev) => {
                        const style = getEventStyle(ev);
                        const color = EVENT_COLORS[ev.event_type];
                        const evKey = `${ev.event_type}-${ev.session_id || ev.class_id || ev.availability_id}`;
                        const isNew = newEventKeys.has(evKey);
                        return (
                          <button
                            type="button"
                            key={`${ev.event_type}-${ev.availability_id || ev.session_id || ev.class_id}-${ev.start_time}`}
                            className={`absolute left-0 right-0 rounded px-1.5 py-0.5 text-[10px] font-medium text-white truncate border cursor-pointer hover:opacity-90 transition text-left ${color}${isNew ? ' z-20 ring-2 ring-yellow-400 dark:ring-yellow-300' : ''}`}
                            style={{ ...style, minHeight: 20, animation: isNew ? 'highlight-pulse 3s ease-out forwards' : undefined }}
                            title={`${ev.title}${ev.location || ev.room_name ? ` · ${ev.location || ev.room_name}` : ''} ${ev.start_time}–${ev.end_time}`}
                            onClick={() => handleEventClick(ev)}
                          >
                            {ev.start_time} {ev.title}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {renderEventModal && (
        <Modal
          open={!!selectedEvent}
          onClose={handleModalClose}
          title={selectedEvent ? (selectedEvent.event_type === 'session' ? 'Edit Session' : 'Edit Class') : ''}
          size="lg"
        >
          {selectedEvent && renderEventModal(selectedEvent, handleModalClose, handleModalSaved)}
        </Modal>
      )}
    </>
  );
}
