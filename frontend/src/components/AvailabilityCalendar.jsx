import { useState, useCallback, useMemo, useEffect } from 'react';
import api from '../api';
import toast from 'react-hot-toast';
import DatePicker from './DatePicker';
import TimePicker from './TimePicker';
import SelectDropdown from './SelectDropdown';
import Modal from './Modal';
import ConfirmDialog from './ConfirmDialog';
import NumberInput from './NumberInput';
import t from '../theme';
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

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

function EventEditForm({ event, form, setForm, rooms, onRoomsLoad, busy, setBusy, onSaved, onClose }) {
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmDeleteBusy, setConfirmDeleteBusy] = useState(false);

  useEffect(() => { onRoomsLoad(); }, [onRoomsLoad]);

  const roomOptions = rooms.map((r) => ({ value: r.room_id, label: r.room_name }));

  const label = event.event_type === 'session' ? 'session' : 'class';

  async function handleConfirmDelete() {
    setConfirmDeleteBusy(true);
    try {
      if (event.event_type === 'session') {
        await api.delete(`/trainer/sessions/${event.session_id}`);
        toast.success('Session deleted.');
      } else {
        await api.delete(`/trainer/classes/${event.class_id}`);
        toast.success('Class deleted.');
      }
      onSaved();
    } catch (err) {
      toast.error(err.message);
      throw err;
    } finally {
      setConfirmDeleteBusy(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      if (event.event_type === 'session') {
        await api.put(`/trainer/sessions/${event.session_id}`, {
          session_date: form.event_date,
          start_time: form.start_time,
          end_time: form.end_time,
          room_id: form.room_id || undefined,
        });
        toast.success('Session updated.');
      } else {
        await api.put(`/trainer/classes/${event.class_id}`, {
          class_date: form.event_date,
          start_time: form.start_time,
          end_time: form.end_time,
          room_id: form.room_id || undefined,
          class_name: form.class_name || undefined,
          max_participants: form.max_participants ? Number(form.max_participants) : undefined,
        });
        toast.success('Class updated.');
      }
      onSaved();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  const eventDate = typeof event.event_date === 'string' ? event.event_date : event.event_date?.toISOString?.()?.slice(0, 10);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${event.event_type === 'session' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300' : 'bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-300'}`}>
          {event.event_type === 'session' ? 'Personal Session' : 'Group Class'}
        </span>
      </div>
      {event.event_type === 'session' && (
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Member</label>
          <p className="text-gray-900 dark:text-gray-100">{event.title}</p>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <DatePicker
          label="Date"
          value={form.event_date || eventDate}
          onChange={(val) => setForm({ ...form, event_date: val })}
          placeholder="Select date"
          required
        />
        <div className="flex flex-col gap-4 sm:col-span-2">
          <TimePicker
            label="Start"
            value={form.start_time}
            onChange={(val) => setForm({ ...form, start_time: val })}
            placeholder="Start"
            required
          />
          <TimePicker
            label="End"
            value={form.end_time}
            onChange={(val) => setForm({ ...form, end_time: val })}
            placeholder="End"
            required
          />
        </div>
      </div>
      <SelectDropdown
        label="Room"
        value={form.room_id}
        options={roomOptions}
        onChange={(val) => setForm({ ...form, room_id: val })}
        placeholder="Select room"
        searchable={false}
      />
      {event.event_type === 'class' && (
        <>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Class Name</label>
            <input
              type="text"
              value={form.class_name}
              onChange={(e) => setForm({ ...form, class_name: e.target.value })}
              className={t.input}
              placeholder="Class name"
            />
          </div>
          <NumberInput
            label="Max Participants"
            value={form.max_participants}
            onChange={(e) => setForm({ ...form, max_participants: e.target.value })}
            min={1}
          />
        </>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
        <div className="flex gap-2">
          <button type="submit" disabled={busy} className={t.btn}>
            {busy ? 'Saving...' : 'Save Changes'}
          </button>
          <button type="button" onClick={onClose} className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
            Cancel
          </button>
        </div>
        <button
          type="button"
          onClick={() => setConfirmDeleteOpen(true)}
          disabled={busy}
          className="rounded-lg px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition disabled:opacity-50"
        >
          Delete
        </button>
      </div>

      <ConfirmDialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        title={`Delete ${label.charAt(0).toUpperCase() + label.slice(1)}?`}
        message={`Are you sure you want to delete this ${label}? This cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        loading={confirmDeleteBusy}
        onConfirm={handleConfirmDelete}
      />
    </form>
  );
}

export default function AvailabilityCalendar({ onSlotClick, refreshTrigger, onEventUpdated }) {
  const [viewDate, setViewDate] = useState(() => new Date());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [editBusy, setEditBusy] = useState(false);

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
    <>
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
                  {/* Hour cells - pointer-events-none so event blocks receive clicks */}
                  <div className="absolute inset-x-0 top-12 bottom-0 pointer-events-none">
                    {HOURS.map((h) => (
                      <div key={h} className="h-[30px] border-b border-gray-100 dark:border-gray-700/50" />
                    ))}
                  </div>
                  {/* Events */}
                  <div className="absolute inset-x-0.5 top-12 bottom-0 z-10" style={{ height: 720 }}>
                      {events.map((ev) => {
                        const style = getEventStyle(ev);
                        const color = EVENT_COLORS[ev.event_type] || EVENT_COLORS.session;
                        return (
                          <button
                            type="button"
                            key={`${ev.event_type}-${ev.availability_id || ev.session_id || ev.class_id}-${ev.start_time}`}
                            className={`absolute left-0 right-0 rounded px-1.5 py-0.5 text-[10px] font-medium text-white truncate border cursor-pointer hover:opacity-90 transition text-left ${color}`}
                            style={{ ...style, minHeight: 20 }}
                            title={`${ev.title}${ev.location ? ` · ${ev.location}` : ''} ${ev.start_time}–${ev.end_time}`}
                            onClick={() => {
                              const initialForm = {
                                event_date: typeof ev.event_date === 'string' ? ev.event_date : (ev.date?.toISOString?.()?.slice(0, 10) ?? ''),
                                start_time: ev.start_time || '',
                                end_time: ev.end_time || '',
                                room_id: ev.room_id ?? '',
                                class_name: ev.event_type === 'class' ? ev.title : '',
                                max_participants: ev.max_participants ?? '',
                              };
                              setEditForm(initialForm);
                              setSelectedEvent(ev);
                              onSlotClick?.(ev);
                            }}
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

      <Modal
        open={!!selectedEvent}
        onClose={() => { setSelectedEvent(null); setEditForm(null); }}
        title={selectedEvent ? (selectedEvent.event_type === 'session' ? 'Edit Session' : 'Edit Class') : ''}
        size="lg"
      >
        {selectedEvent && (
          <EventEditForm
            event={selectedEvent}
            form={editForm ?? {
              event_date: typeof selectedEvent.event_date === 'string' ? selectedEvent.event_date : (selectedEvent.date?.toISOString?.()?.slice(0, 10) ?? ''),
              start_time: selectedEvent.start_time || '',
              end_time: selectedEvent.end_time || '',
              room_id: selectedEvent.room_id ?? '',
              class_name: selectedEvent.event_type === 'class' ? selectedEvent.title : '',
              max_participants: selectedEvent.max_participants ?? '',
            }}
            setForm={setEditForm}
            rooms={rooms}
            onRoomsLoad={() => api.get('/trainer/rooms').then((d) => setRooms(d.rooms || []))}
            busy={editBusy}
            setBusy={setEditBusy}
            onSaved={() => {
              load();
              onEventUpdated?.();
              setSelectedEvent(null);
              setEditForm(null);
            }}
            onClose={() => { setSelectedEvent(null); setEditForm(null); }}
          />
        )}
      </Modal>
    </>
  );
}
