import { useState } from 'react';
import api from '../api';
import toast from 'react-hot-toast';
import t from '../theme';

export default function RecordMetricForm({ onSaved, onCancel }) {
  const [form, setForm] = useState({ weight: '', body_fat_pct: '', blood_pressure: '', heart_rate: '' });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post('/member/metrics', form);
      toast.success('Metric recorded.');
      setForm({ weight: '', body_fat_pct: '', blood_pressure: '', heart_rate: '' });
      onSaved();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Weight (kg)" type="number" step="0.1" value={form.weight} onChange={set('weight')} />
        <Field label="Body Fat %" type="number" step="0.1" value={form.body_fat_pct} onChange={set('body_fat_pct')} />
        <Field label="Blood Pressure" placeholder="e.g. 120/80" value={form.blood_pressure} onChange={set('blood_pressure')} />
        <Field label="Heart Rate (bpm)" type="number" value={form.heart_rate} onChange={set('heart_rate')} />
      </div>
      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={busy} className={t.btn}>{busy ? 'Saving...' : 'Record Metric'}</button>
        <button type="button" onClick={onCancel} className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
          Cancel
        </button>
      </div>
    </form>
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
