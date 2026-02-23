import { useEffect, useState, useCallback } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import DataTable from '../../components/DataTable';

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

  const inputCls = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none';

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Availability</h1>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-gray-800">Add Time Slot</h2>
        <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[140px]">
            <label className="mb-1 block text-sm font-medium text-gray-700">Date</label>
            <input type="date" required className={inputCls} value={form.available_date} onChange={set('available_date')} />
          </div>
          <div className="flex-1 min-w-[120px]">
            <label className="mb-1 block text-sm font-medium text-gray-700">Start</label>
            <input type="time" required className={inputCls} value={form.start_time} onChange={set('start_time')} />
          </div>
          <div className="flex-1 min-w-[120px]">
            <label className="mb-1 block text-sm font-medium text-gray-700">End</label>
            <input type="time" required className={inputCls} value={form.end_time} onChange={set('end_time')} />
          </div>
          <button type="submit" disabled={busy}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 transition">
            {busy ? 'Adding...' : 'Add Slot'}
          </button>
        </form>
      </div>

      {slots === null ? (
        <div className="animate-pulse h-40 rounded-xl bg-gray-200" />
      ) : (
        <DataTable
          columns={[
            { key: 'available_date', label: 'Date', render: (r) => fmtDate(r.available_date) },
            { key: 'start_time', label: 'Start' },
            { key: 'end_time', label: 'End' },
            { key: 'action', label: '', render: (r) => (
              <button
                onClick={() => handleDelete(r.availability_id)}
                className="rounded-lg px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 transition"
              >
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
