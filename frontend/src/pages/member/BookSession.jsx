import { useEffect, useState, useCallback } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import DatePicker from '../../components/DatePicker';
import SelectDropdown from '../../components/SelectDropdown';
import TimePicker from '../../components/TimePicker';
import { ChevronLeftIcon, ChevronRightIcon } from '../../components/Icons';
import t from '../../theme';

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
  return s.length > 5 ? s.slice(0, 5) : s; // "09:00:00" -> "09:00"
}

export default function BookSession() {
  const [data, setData] = useState(null);
  const [form, setForm] = useState({ trainer_id: '', room_id: '', session_date: '', start_time: '', end_time: '' });
  const [busy, setBusy] = useState(false);
  const [availabilitySlots, setAvailabilitySlots] = useState([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  const load = useCallback(() => api.get('/member/booking-options').then(setData), []);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!form.trainer_id) {
      setAvailabilitySlots([]);
      return;
    }
    setLoadingAvailability(true);
    api.get(`/member/trainer-availability?trainer_id=${form.trainer_id}`)
      .then((res) => { setAvailabilitySlots(res.slots || []); setWeekOffset(0); })
      .catch(() => setAvailabilitySlots([]))
      .finally(() => setLoadingAvailability(false));
  }, [form.trainer_id]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post('/member/sessions', {
        trainer_id: Number(form.trainer_id),
        room_id: Number(form.room_id),
        session_date: form.session_date,
        start_time: form.start_time,
        end_time: form.end_time,
      });
      toast.success('Session booked.');
      setForm({ trainer_id: '', room_id: '', session_date: '', start_time: '', end_time: '' });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!data) return <div className="animate-pulse space-y-6">{[...Array(3)].map((_, i) => <div key={i} className="h-40 rounded-xl bg-gray-200 dark:bg-gray-700" />)}</div>;

  const trainers = (data.trainers || []).map(tr => ({ value: tr.trainer_id, label: `${tr.name} – ${tr.specialization || 'General'}` }));
  const rooms = (data.rooms || []).map(r => ({ value: r.room_id, label: r.room_name }));

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Book Personal Session</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Choose a trainer, room, date, and time. The trainer must have availability set for your chosen slot.
      </p>
      <form onSubmit={submit} className="max-w-2xl rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectDropdown
            label="Trainer"
            value={form.trainer_id}
            onChange={(val) => setForm({ ...form, trainer_id: val })}
            options={trainers}
            placeholder="Select trainer"
            searchable={trainers.length > 5}
          />
          <SelectDropdown
            label="Room"
            value={form.room_id}
            onChange={(val) => setForm({ ...form, room_id: val })}
            options={rooms}
            placeholder="Select room"
            searchable={rooms.length > 5}
          />
        </div>

        {form.trainer_id && (
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Trainer availability</h3>
            {loadingAvailability ? (
              <div className="text-sm text-gray-500 dark:text-gray-400">Loading…</div>
            ) : availabilitySlots.length === 0 ? (
              <div className="text-sm text-gray-500 dark:text-gray-400">No upcoming availability</div>
            ) : (
              <>
                {(() => {
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
                  availabilitySlots.forEach((s) => {
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
                      <div className="grid grid-cols-7 gap-1 text-xs">
                        {weekDates.map((d) => {
                          const ymd = toYMD(d);
                          const slots = slotByDay[ymd] || [];
                          const isPast = ymd < today;
                          return (
                            <div key={ymd} className={`rounded p-1.5 min-h-[4rem] ${isPast ? 'bg-gray-100 dark:bg-gray-800 opacity-70' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600'}`}>
                              <div className="font-medium text-gray-600 dark:text-gray-400 mb-1">
                                {WEEKDAYS[d.getDay()]} {d.getDate()}
                              </div>
                              <div className="space-y-1">
                                {slots.map((slot) => (
                                  <button
                                    key={slot.availability_id}
                                    type="button"
                                    onClick={() => setForm({ ...form, session_date: slot.available_date, start_time: timeToDisplay(slot.start_time), end_time: timeToDisplay(slot.end_time) })}
                                    className="w-full text-left px-1.5 py-0.5 rounded bg-green-500/90 hover:bg-green-600 text-white border border-green-600 dark:border-green-500"
                                  >
                                    {timeToDisplay(slot.start_time)}–{timeToDisplay(slot.end_time)}
                                  </button>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  );
                })()}
              </>
            )}
          </div>
        )}
        {!form.trainer_id && (
          <p className="text-sm text-gray-500 dark:text-gray-400">Select a trainer to see availability</p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <DatePicker
            label="Date"
            value={form.session_date}
            onChange={(val) => setForm({ ...form, session_date: val })}
            placeholder="Select date"
            required
          />
          <TimePicker
            label="Start Time"
            value={form.start_time}
            onChange={(val) => setForm({ ...form, start_time: val })}
            placeholder="Select start time"
            required
          />
          <TimePicker
            label="End Time"
            value={form.end_time}
            onChange={(val) => setForm({ ...form, end_time: val })}
            placeholder="Select end time"
            required
          />
        </div>
        <button type="submit" disabled={busy} className={t.btn}>
          {busy ? 'Booking...' : 'Book Session'}
        </button>
      </form>
    </div>
  );
}
