import { useEffect, useState, useCallback } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import DataTable from '../../components/DataTable';
import DatePicker from '../../components/DatePicker';
import SelectDropdown from '../../components/SelectDropdown';
import StatusBadge from '../../components/StatusBadge';
import TimePicker from '../../components/TimePicker';
import t from '../../theme';

export default function RoomBooking() {
  const [data, setData] = useState(null);
  const [tab, setTab] = useState('session');

  const load = useCallback(() => api.get('/admin/room-booking').then(setData), []);
  useEffect(() => { load(); }, [load]);

  if (!data) return <div className="animate-pulse space-y-6">{[...Array(3)].map((_, i) => <div key={i} className="h-40 rounded-xl bg-gray-200 dark:bg-gray-700" />)}</div>;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Room Booking</h1>

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <TabButton active={tab === 'session'} onClick={() => setTab('session')}>Personal Session</TabButton>
          <TabButton active={tab === 'class'} onClick={() => setTab('class')}>Group Class</TabButton>
        </div>
        <div className="p-6">
          {tab === 'session'
            ? <SessionForm rooms={data.rooms} members={data.members} trainers={data.trainers} onSaved={load} />
            : <ClassForm rooms={data.rooms} trainers={data.trainers} onSaved={load} />}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-gray-800 dark:text-gray-200">Room Schedule</h2>
        <DataTable
          columns={[
            { key: 'room_name', label: 'Room', filter: 'enum' },
            { key: 'booking_type', label: 'Type', filter: 'enum', render: (r) => (
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
                r.booking_type === 'Personal Session'
                  ? 'bg-violet-50 text-violet-700 ring-violet-600/20 dark:bg-violet-900/30 dark:text-violet-400 dark:ring-violet-500/30'
                  : 'bg-teal-50 text-teal-700 ring-teal-600/20 dark:bg-teal-900/30 dark:text-teal-400 dark:ring-teal-500/30'
              }`}>{r.booking_type}</span>
            )},
            { key: 'event_date', label: 'Date', filter: 'date', render: (r) => fmtDate(r.event_date) },
            { key: 'time', label: 'Time', render: (r) => `${r.start_time} – ${r.end_time}` },
            { key: 'participant', label: 'Participant / Class' },
            { key: 'trainer_name', label: 'Trainer', filter: 'enum' },
            { key: 'status', label: 'Status', filter: 'enum', render: (r) => <StatusBadge status={r.status} /> },
          ]}
          data={data.bookings}
          emptyMessage="No bookings found."
        />
      </div>
    </div>
  );
}

function SessionForm({ rooms, members, trainers, onSaved }) {
  const [form, setForm] = useState({ member_id: '', trainer_id: '', room_id: '', session_date: '', start_time: '', end_time: '' });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try { await api.post('/admin/room-booking/session', form); toast.success('Session booked.'); onSaved(); }
    catch (err) { toast.error(err.message); }
    finally { setBusy(false); }
  }

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <SelectDropdown label="Member" value={form.member_id} onChange={(val) => setForm({ ...form, member_id: val })} options={members.map(m => ({ value: m.member_id, label: `${m.name} (${m.email})` }))} placeholder="Select member" searchable={members.length > 5} />
      <SelectDropdown label="Trainer" value={form.trainer_id} onChange={(val) => setForm({ ...form, trainer_id: val })} options={trainers.map(tr => ({ value: tr.trainer_id, label: `${tr.name} – ${tr.specialization}` }))} placeholder="Select trainer" searchable={trainers.length > 5} />
      <SelectDropdown label="Room" value={form.room_id} onChange={(val) => setForm({ ...form, room_id: val })} options={rooms.map(r => ({ value: r.room_id, label: r.room_name }))} placeholder="Select room" searchable={rooms.length > 5} />
      <DatePicker label="Date" value={form.session_date} onChange={(val) => setForm({ ...form, session_date: val })} placeholder="Select date" required />
      <TimePicker label="Start Time" value={form.start_time} onChange={(val) => setForm({ ...form, start_time: val })} placeholder="Select start time" required />
      <TimePicker label="End Time" value={form.end_time} onChange={(val) => setForm({ ...form, end_time: val })} placeholder="Select end time" required />
      <div className="sm:col-span-2 lg:col-span-3">
        <button type="submit" disabled={busy} className={t.btn}>{busy ? 'Booking...' : 'Book Session'}</button>
      </div>
    </form>
  );
}

function ClassForm({ rooms, trainers, onSaved }) {
  const [form, setForm] = useState({ class_name: '', trainer_id: '', room_id: '', class_date: '', start_time: '', end_time: '', max_participants: '' });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try { await api.post('/admin/room-booking/class', form); toast.success('Class scheduled.'); onSaved(); }
    catch (err) { toast.error(err.message); }
    finally { setBusy(false); }
  }

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Field label="Class Name" value={form.class_name} onChange={set('class_name')} required />
      <SelectDropdown label="Trainer" value={form.trainer_id} onChange={(val) => setForm({ ...form, trainer_id: val })} options={trainers.map(tr => ({ value: tr.trainer_id, label: `${tr.name} – ${tr.specialization}` }))} placeholder="Select trainer" searchable={trainers.length > 5} />
      <SelectDropdown label="Room" value={form.room_id} onChange={(val) => setForm({ ...form, room_id: val })} options={rooms.map(r => ({ value: r.room_id, label: r.room_name }))} placeholder="Select room" searchable={rooms.length > 5} />
      <DatePicker label="Date" value={form.class_date} onChange={(val) => setForm({ ...form, class_date: val })} placeholder="Select date" required />
      <TimePicker label="Start Time" value={form.start_time} onChange={(val) => setForm({ ...form, start_time: val })} placeholder="Select start time" required />
      <TimePicker label="End Time" value={form.end_time} onChange={(val) => setForm({ ...form, end_time: val })} placeholder="Select end time" required />
      <Field label="Max Participants" type="number" min={1} value={form.max_participants} onChange={set('max_participants')} required />
      <div className="sm:col-span-2 lg:col-span-3">
        <button type="submit" disabled={busy} className={t.btn}>{busy ? 'Scheduling...' : 'Schedule Class'}</button>
      </div>
    </form>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button onClick={onClick}
      className={`px-5 py-3 text-sm font-medium transition ${active ? t.tabActive : t.tabInactive}`}>
      {children}
    </button>
  );
}

function Field({ label, ...props }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      <input className={t.input} {...props} />
    </div>
  );
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
