import { useEffect, useState, useCallback } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import DataTable from '../../components/DataTable';
import TimePicker from '../../components/TimePicker';
import t from '../../theme';

export default function Availability() {
  const [slots, setSlots] = useState(null);
  const [form, setForm] = useState({ available_date: '', start_time: '', end_time: '' });
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => api.get('/trainer/availability').then(d => setSlots(d.slots)), []);
  useEffect(() => { load(); }, [load]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function handleAdd(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post('/trainer/availability', form);
      toast.success('Slot added.');
      setForm({ available_date: '', start_time: '', end_time: '' });
      load();
    } catch (err) { toast.error(err.message); }
    finally { setBusy(false); }
  }

  async function handleDelete(id) {
    try { await api.delete(`/trainer/availability/${id}`); toast.success('Slot removed.'); load(); }
    catch (err) { toast.error(err.message); }
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Availability</h1>

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-gray-800 dark:text-gray-200">Add Time Slot</h2>
        <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[140px]">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
            <input type="date" required className={t.input} value={form.available_date} onChange={set('available_date')} />
          </div>
          <div className="flex-1 min-w-[200px]">
            <TimePicker label="Start" value={form.start_time} onChange={(val) => setForm({ ...form, start_time: val })} placeholder="Select start" required />
          </div>
          <div className="flex-1 min-w-[200px]">
            <TimePicker label="End" value={form.end_time} onChange={(val) => setForm({ ...form, end_time: val })} placeholder="Select end" required />
          </div>
          <button type="submit" disabled={busy} className={t.btn}>
            {busy ? 'Adding...' : 'Add Slot'}
          </button>
        </form>
      </div>

      {slots === null ? (
        <div className="animate-pulse h-40 rounded-xl bg-gray-200 dark:bg-gray-700" />
      ) : (
        <DataTable
          columns={[
            { key: 'available_date', label: 'Date', render: (r) => fmtDate(r.available_date) },
            { key: 'start_time', label: 'Start' },
            { key: 'end_time', label: 'End' },
            { key: 'action', label: '', render: (r) => (
              <button onClick={() => handleDelete(r.availability_id)}
                className="rounded-lg px-2.5 py-1 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition">
                Remove
              </button>
            )},
          ]}
          data={slots}
          emptyMessage="No availability slots set."
        />
      )}
    </div>
  );
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}
