import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { toastError, toastSuccess } from '../../toastUtil';
import DatePicker from '../../components/DatePicker';
import SelectDropdown from '../../components/SelectDropdown';
import TimePicker from '../../components/TimePicker';
import TrainerAvailabilityCalendar from '../../components/TrainerAvailabilityCalendar';
import t from '../../theme';

export function BookSessionForm({ onSuccess }) {
  const [data, setData] = useState(null);
  const [form, setForm] = useState({ trainer_id: '', room_id: '', session_date: '', start_time: '', end_time: '' });
  const [busy, setBusy] = useState(false);
  const [availabilitySlots, setAvailabilitySlots] = useState([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  const load = useCallback(() => api.get('/member/booking-options').then(setData).catch(() => setData({ trainers: [], rooms: [] })), []);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!form.trainer_id) {
      setAvailabilitySlots([]);
      return;
    }
    let cancelled = false;
    setLoadingAvailability(true);
    api.get(`/member/trainer-availability?trainer_id=${form.trainer_id}`)
      .then((res) => {
        /* istanbul ignore next */
        if (!cancelled) {
          setAvailabilitySlots(res.slots || []);
        }
      })
      /* istanbul ignore next */
      .catch(() => { if (!cancelled) setAvailabilitySlots([]); })
      .finally(() => { /* istanbul ignore next */ if (!cancelled) setLoadingAvailability(false); });
    return () => { cancelled = true; };
  }, [form.trainer_id]);

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
      toastSuccess('Session booked.');
      setForm({ trainer_id: '', room_id: '', session_date: '', start_time: '', end_time: '' });
      onSuccess?.();
    } catch (err) {
      toastError(err.message, err.details);
    } finally {
      setBusy(false);
    }
  }

  if (!data) return <div className="animate-pulse space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-16 rounded-lg bg-gray-200 dark:bg-gray-700" />)}</div>;

  const trainers = (data.trainers || []).map(tr => ({ value: tr.trainer_id, label: `${tr.name} – ${tr.specialization || 'General'}` }));
  const rooms = (data.rooms || []).map(r => ({ value: r.room_id, label: r.room_name }));

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Choose a trainer, room, date, and time. The trainer must have availability set for your chosen slot.
      </p>
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

      {form.trainer_id ? (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Trainer availability</h3>
          <TrainerAvailabilityCalendar
            slots={availabilitySlots}
            loading={loadingAvailability}
            onSlotSelect={(date, start, end) => setForm({ ...form, session_date: date, start_time: start, end_time: end })}
            bookedByLabel="your booking"
          />
        </div>
      ) : (
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
  );
}

export default function BookSession() {
  const navigate = useNavigate();
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Book Personal Session</h1>
      <div className="max-w-2xl rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
        <BookSessionForm onSuccess={() => navigate('/member/schedule')} />
      </div>
    </div>
  );
}
