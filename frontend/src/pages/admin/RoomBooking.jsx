import { useEffect, useState, useCallback } from 'react';
import api from '../../api';
import { toastError, toastSuccess } from '../../toastUtil';
import DataTable from '../../components/DataTable';
import DatePicker from '../../components/DatePicker';
import SelectDropdown from '../../components/SelectDropdown';
import StatusBadge from '../../components/StatusBadge';
import TimePicker from '../../components/TimePicker';
import TrainerAvailabilityCalendar from '../../components/TrainerAvailabilityCalendar';
import t from '../../theme';

export default function RoomBooking() {
  const [data, setData] = useState(null);
  const [tab, setTab] = useState('session');

  const load = useCallback(() => api.get('/admin/room-booking').then(setData).catch(() => setData({ rooms: [], members: [], trainers: [], bookings: [] })), []);
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
  const [availableRooms, setAvailableRooms] = useState(null);
  const [availabilitySlots, setAvailabilitySlots] = useState([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  const hasMemberAndTrainer = form.member_id && form.trainer_id;
  useEffect(() => {
    if (!hasMemberAndTrainer) {
      setAvailabilitySlots([]);
      return;
    }
    let cancelled = false;
    setLoadingAvailability(true);
    api.get(`/admin/room-booking/trainer-availability?trainer_id=${form.trainer_id}&member_id=${form.member_id}`)
      .then((res) => {
        if (!cancelled) setAvailabilitySlots(res.slots || []);
      })
      .catch(() => { if (!cancelled) setAvailabilitySlots([]); })
      .finally(() => { if (!cancelled) setLoadingAvailability(false); });
    return () => { cancelled = true; };
  }, [hasMemberAndTrainer, form.member_id, form.trainer_id]);

  const hasSlot = form.session_date && form.start_time && form.end_time && form.start_time < form.end_time;
  useEffect(() => {
    if (!hasSlot) {
      setAvailableRooms(null);
      return;
    }
    api.get(`/admin/room-booking/available-rooms?date=${encodeURIComponent(form.session_date)}&start_time=${encodeURIComponent(form.start_time)}&end_time=${encodeURIComponent(form.end_time)}`)
      .then(d => setAvailableRooms(d.available_rooms || []))
      .catch(() => setAvailableRooms(null));
  }, [hasSlot, form.session_date, form.start_time, form.end_time]);

  const roomOptions = availableRooms
    ? availableRooms.map(r => ({ value: r.room_id, label: r.room_name }))
    : rooms.map(r => ({ value: r.room_id, label: r.room_name }));
  const roomHint = hasSlot && availableRooms ? (availableRooms.length === 0 ? 'No rooms available for this slot' : `${availableRooms.length} room(s) available`) : null;

  function setFormField(updates) {
    const next = { ...form, ...updates };
    if (updates.session_date ?? updates.start_time ?? updates.end_time) {
      const hadSlot = form.session_date && form.start_time && form.end_time && form.start_time < form.end_time;
      const hasSlotNow = next.session_date && next.start_time && next.end_time && next.start_time < next.end_time;
      if (hadSlot && hasSlotNow && availableRooms && next.room_id && !availableRooms.some(r => String(r.room_id) === String(next.room_id))) {
        next.room_id = '';
      }
    }
    setForm(next);
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try { await api.post('/admin/room-booking/session', form); toastSuccess('Session booked.'); setForm({ member_id: '', trainer_id: '', room_id: '', session_date: '', start_time: '', end_time: '' }); setAvailableRooms(null); onSaved(); }
    catch (err) { toastError(err.message, err.details); }
    finally { setBusy(false); }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SelectDropdown label="Member" value={form.member_id} onChange={(val) => setFormField({ member_id: val })} options={members.map(m => ({ value: m.member_id, label: `${m.name} (${m.email})` }))} placeholder="Select member" searchable={members.length > 5} />
        <SelectDropdown label="Trainer" value={form.trainer_id} onChange={(val) => setFormField({ trainer_id: val })} options={trainers.map(tr => ({ value: tr.trainer_id, label: `${tr.name} – ${tr.specialization}` }))} placeholder="Select trainer" searchable={trainers.length > 5} />
      </div>

      {hasMemberAndTrainer ? (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Trainer availability</h3>
          <TrainerAvailabilityCalendar
            slots={availabilitySlots}
            loading={loadingAvailability}
            onSlotSelect={(date, start, end) => setFormField({ session_date: date, start_time: start, end_time: end })}
            bookedByLabel="member's booking"
          />
        </div>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400">Select a member and trainer to see availability</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <SelectDropdown label="Room" value={form.room_id} onChange={(val) => setFormField({ room_id: val })} options={roomOptions} placeholder="Select room" searchable={roomOptions.length > 5} />
          {roomHint && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{roomHint}</p>}
        </div>
        <DatePicker label="Date" value={form.session_date} onChange={(val) => setFormField({ session_date: val })} placeholder="Select date" required />
        <TimePicker label="Start Time" value={form.start_time} onChange={(val) => setFormField({ start_time: val })} placeholder="Select start time" required />
        <TimePicker label="End Time" value={form.end_time} onChange={(val) => setFormField({ end_time: val })} placeholder="Select end time" required />
      </div>
      <button type="submit" disabled={busy} className={t.btn}>{busy ? 'Booking...' : 'Book Session'}</button>
    </form>
  );
}

function ClassForm({ rooms, trainers, onSaved }) {
  const [form, setForm] = useState({ class_name: '', trainer_id: '', room_id: '', class_date: '', start_time: '', end_time: '', max_participants: '' });
  const [busy, setBusy] = useState(false);
  const [availableRooms, setAvailableRooms] = useState(null);
  const set = (k) => (e) => setForm(prev => ({ ...prev, [k]: e.target.value }));

  const hasSlot = form.class_date && form.start_time && form.end_time && form.start_time < form.end_time;
  useEffect(() => {
    if (!hasSlot) {
      setAvailableRooms(null);
      return;
    }
    api.get(`/admin/room-booking/available-rooms?date=${encodeURIComponent(form.class_date)}&start_time=${encodeURIComponent(form.start_time)}&end_time=${encodeURIComponent(form.end_time)}`)
      .then(d => setAvailableRooms(d.available_rooms || []))
      .catch(() => setAvailableRooms(null));
  }, [hasSlot, form.class_date, form.start_time, form.end_time]);

  const roomOptions = availableRooms
    ? availableRooms.map(r => ({ value: r.room_id, label: r.room_name }))
    : rooms.map(r => ({ value: r.room_id, label: r.room_name }));
  const roomHint = hasSlot && availableRooms ? (availableRooms.length === 0 ? 'No rooms available for this slot' : `${availableRooms.length} room(s) available`) : null;

  function setFormField(updates) {
    const next = { ...form, ...updates };
    if (updates.class_date ?? updates.start_time ?? updates.end_time) {
      const hadSlot = form.class_date && form.start_time && form.end_time && form.start_time < form.end_time;
      const hasSlotNow = next.class_date && next.start_time && next.end_time && next.start_time < next.end_time;
      if (hadSlot && hasSlotNow && availableRooms && next.room_id && !availableRooms.some(r => String(r.room_id) === String(next.room_id))) {
        next.room_id = '';
      }
    }
    setForm(next);
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try { await api.post('/admin/room-booking/class', form); toastSuccess('Class scheduled.'); setForm({ class_name: '', trainer_id: '', room_id: '', class_date: '', start_time: '', end_time: '', max_participants: '' }); setAvailableRooms(null); onSaved(); }
    catch (err) { toastError(err.message, err.details); }
    finally { setBusy(false); }
  }

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Field label="Class Name" value={form.class_name} onChange={set('class_name')} required />
      <SelectDropdown label="Trainer" value={form.trainer_id} onChange={(val) => setFormField({ trainer_id: val })} options={trainers.map(tr => ({ value: tr.trainer_id, label: `${tr.name} – ${tr.specialization}` }))} placeholder="Select trainer" searchable={trainers.length > 5} />
      <div>
        <SelectDropdown label="Room" value={form.room_id} onChange={(val) => setFormField({ room_id: val })} options={roomOptions} placeholder="Select room" searchable={roomOptions.length > 5} />
        {roomHint && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{roomHint}</p>}
      </div>
      <DatePicker label="Date" value={form.class_date} onChange={(val) => setFormField({ class_date: val })} placeholder="Select date" required />
      <TimePicker label="Start Time" value={form.start_time} onChange={(val) => setFormField({ start_time: val })} placeholder="Select start time" required />
      <TimePicker label="End Time" value={form.end_time} onChange={(val) => setFormField({ end_time: val })} placeholder="Select end time" required />
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
  return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
