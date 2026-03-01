import { useEffect, useState, useCallback } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import DatePicker from '../../components/DatePicker';
import SelectDropdown from '../../components/SelectDropdown';
import TimePicker from '../../components/TimePicker';
import t from '../../theme';

export default function BookSession() {
  const [data, setData] = useState(null);
  const [form, setForm] = useState({ trainer_id: '', room_id: '', session_date: '', start_time: '', end_time: '' });
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => api.get('/member/booking-options').then(setData), []);
  useEffect(() => { load(); }, [load]);

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
