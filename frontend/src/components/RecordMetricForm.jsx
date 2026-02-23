import { useState } from 'react';
import api from '../api';
import toast from 'react-hot-toast';
import t from '../theme';
import NumberInput from './NumberInput';

export default function RecordMetricForm({ onSaved, onCancel }) {
  const [form, setForm] = useState({ weight: '', body_fat_pct: '', systolic: '', diastolic: '', heart_rate: '' });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const bp = (form.systolic || form.diastolic) ? `${form.systolic || ''}/${form.diastolic || ''}` : null;
      const payload = {
        weight: form.weight || null,
        body_fat_pct: form.body_fat_pct || null,
        blood_pressure: bp || null,
        heart_rate: form.heart_rate || null,
      };
      await api.post('/member/metrics', payload);
      toast.success('Metric recorded.');
      setForm({ weight: '', body_fat_pct: '', systolic: '', diastolic: '', heart_rate: '' });
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
        <NumberInput label="Weight (kg)" step={0.1} value={form.weight} onChange={set('weight')} />
        <NumberInput label="Body Fat %" step={0.1} value={form.body_fat_pct} onChange={set('body_fat_pct')} />
        <NumberInput label="Systolic (mmHg)" placeholder="120" value={form.systolic} onChange={set('systolic')} />
        <NumberInput label="Diastolic (mmHg)" placeholder="80" value={form.diastolic} onChange={set('diastolic')} />
        <NumberInput label="Heart Rate (bpm)" value={form.heart_rate} onChange={set('heart_rate')} />
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
