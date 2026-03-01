import { useEffect, useState, useCallback } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import SelectDropdown from '../../components/SelectDropdown';
import DatePicker from '../../components/DatePicker';
import Modal from '../../components/Modal';
import { TargetIcon } from '../../components/Icons';
import t from '../../theme';

const GOAL_TYPES = [
  { value: 'weight_loss', label: 'Weight Loss' },
  { value: 'muscle_gain', label: 'Muscle Gain' },
  { value: 'endurance', label: 'Endurance' },
  { value: 'flexibility', label: 'Flexibility' },
  { value: 'other', label: 'Other' },
];

const GOAL_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'achieved', label: 'Achieved' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function Goals() {
  const [goals, setGoals] = useState(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ goal_type: 'weight_loss', target_value: '', start_date: '', end_date: '' });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const load = useCallback(() => api.get('/member/profile').then(d => setGoals(d.goals || [])), []);
  useEffect(() => { load(); }, [load]);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post('/member/goals', form);
      toast.success('Goal added.');
      setOpen(false);
      setForm({ goal_type: 'weight_loss', target_value: '', start_date: '', end_date: '' });
      load();
    } catch (err) { toast.error(err.message); }
    finally { setBusy(false); }
  }

  if (!goals) return <Skeleton />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TargetIcon className="h-6 w-6 text-emerald-500" />
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Fitness Goals</h1>
        </div>
        <button onClick={() => setOpen(true)} className={t.btnSmall}>+ Add Goal</button>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Add Fitness Goal">
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <SelectDropdown
              label="Type"
              value={form.goal_type}
              options={GOAL_TYPES}
              onChange={(val) => setForm({ ...form, goal_type: val })}
              placeholder="Select type"
              searchable={false}
            />
            <Field label="Target" value={form.target_value} onChange={set('target_value')} required />
            <DatePicker
              label="Start Date"
              value={form.start_date}
              onChange={(val) => setForm({ ...form, start_date: val })}
              placeholder="Select start date"
              required
            />
            <DatePicker
              label="End Date"
              value={form.end_date}
              onChange={(val) => setForm({ ...form, end_date: val })}
              placeholder="Select end date"
              min={form.start_date || undefined}
            />
          </div>
          <button type="submit" disabled={busy} className={t.btn}>{busy ? 'Adding...' : 'Add Goal'}</button>
        </form>
      </Modal>

      <DataTable
        columns={[
          { key: 'goal_type', label: 'Type', filter: 'enum' },
          { key: 'target_value', label: 'Target' },
          { key: 'start_date', label: 'Start', render: (r) => fmtDate(r.start_date) },
          { key: 'end_date', label: 'End', render: (r) => fmtDate(r.end_date) },
          { key: 'status', label: 'Status', filter: 'enum', render: (r) => <StatusBadge status={r.status} /> },
          { key: 'action', label: '', render: (r) => r.status === 'active' && <GoalStatusSelect goal={r} onSaved={load} /> },
        ]}
        data={goals}
        emptyMessage="No goals yet. Add one to start tracking."
      />
    </div>
  );
}

function GoalStatusSelect({ goal, onSaved }) {
  async function handleChange(val) {
    try { await api.put(`/member/goals/${goal.goal_id}`, { status: val }); toast.success('Goal updated.'); onSaved(); }
    catch (err) { toast.error(err.message); }
  }
  return (
    <SelectDropdown
      value={goal.status}
      onChange={handleChange}
      options={GOAL_STATUS_OPTIONS}
      placeholder="Status"
      searchable={false}
      floating
    />
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

function Skeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="flex justify-between"><div className="h-8 w-48 rounded bg-gray-200 dark:bg-gray-700" /><div className="h-8 w-24 rounded bg-gray-200 dark:bg-gray-700" /></div>
      <div className="h-64 rounded-xl bg-gray-200 dark:bg-gray-700" />
    </div>
  );
}
