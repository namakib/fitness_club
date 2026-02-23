import { useEffect, useState, useCallback } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';

export default function RoomBooking() {
  const [data, setData] = useState(null);
  const [tab, setTab] = useState('session');

  const load = useCallback(() => api.get('/admin/room-booking').then(setData), []);
  useEffect(() => { load(); }, [load]);

  if (!data) return <div className="animate-pulse space-y-6">{[...Array(3)].map((_, i) => <div key={i} className="h-40 rounded-xl bg-gray-200" />)}</div>;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Room Booking</h1>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex border-b border-gray-200">
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
        <h2 className="mb-3 text-lg font-semibold text-gray-800">Room Schedule</h2>
        <DataTable
          columns={[
            { key: 'room_name', label: 'Room' },
            { key: 'booking_type', label: 'Type', render: (r) => (
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
                r.booking_type === 'Personal Session' ? 'bg-violet-50 text-violet-700 ring-violet-600/20' : 'bg-teal-50 text-teal-700 ring-teal-600/20'
              }`}>{r.booking_type}</span>
            )},
            { key: 'event_date', label: 'Date', render: (r) => fmtDate(r.event_date) },
            { key: 'time', label: 'Time', render: (r) => `${r.start_time} – ${r.end_time}` },
            { key: 'participant', label: 'Participant / Class' },
            { key: 'trainer_name', label: 'Trainer' },
            { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
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
      <SelectField label="Member" value={form.member_id} onChange={set('member_id')} options={members.map(m => ({ value: m.member_id, label: `${m.name} (${m.email})` }))} />
      <SelectField label="Trainer" value={form.trainer_id} onChange={set('trainer_id')} options={trainers.map(t => ({ value: t.trainer_id, label: `${t.name} – ${t.specialization}` }))} />
      <SelectField label="Room" value={form.room_id} onChange={set('room_id')} options={rooms.map(r => ({ value: r.room_id, label: r.room_name }))} />
      <Field label="Date" type="date" value={form.session_date} onChange={set('session_date')} required />
      <Field label="Start Time" type="time" value={form.start_time} onChange={set('start_time')} required />
      <Field label="End Time" type="time" value={form.end_time} onChange={set('end_time')} required />
      <div className="sm:col-span-2 lg:col-span-3">
        <button type="submit" disabled={busy} className={btnCls}>{busy ? 'Booking...' : 'Book Session'}</button>
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
      <SelectField label="Trainer" value={form.trainer_id} onChange={set('trainer_id')} options={trainers.map(t => ({ value: t.trainer_id, label: `${t.name} – ${t.specialization}` }))} />
      <SelectField label="Room" value={form.room_id} onChange={set('room_id')} options={rooms.map(r => ({ value: r.room_id, label: r.room_name }))} />
      <Field label="Date" type="date" value={form.class_date} onChange={set('class_date')} required />
      <Field label="Start Time" type="time" value={form.start_time} onChange={set('start_time')} required />
      <Field label="End Time" type="time" value={form.end_time} onChange={set('end_time')} required />
      <Field label="Max Participants" type="number" min={1} value={form.max_participants} onChange={set('max_participants')} required />
      <div className="sm:col-span-2 lg:col-span-3">
        <button type="submit" disabled={busy} className={btnCls}>{busy ? 'Scheduling...' : 'Schedule Class'}</button>
      </div>
    </form>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button onClick={onClick}
      className={`px-5 py-3 text-sm font-medium transition ${active ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>
      {children}
    </button>
  );
}

function Field({ label, ...props }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <input className={inputCls} {...props} />
    </div>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <select className={inputCls} value={value} onChange={onChange} required>
        <option value="">Select...</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

const inputCls = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none';
const btnCls = 'rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 transition';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
