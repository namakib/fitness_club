import { useEffect, useState, useCallback } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';

export default function Profile() {
  const [data, setData] = useState(null);

  const load = useCallback(() => api.get('/member/profile').then(setData), []);
  useEffect(() => { load(); }, [load]);

  if (!data) return <div className="animate-pulse space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-gray-200" />)}</div>;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
      <div className="grid gap-8 lg:grid-cols-2">
        <ProfileForm member={data.member} onSaved={load} />
        <MetricForm onSaved={load} />
      </div>
      <GoalForm onSaved={load} />
      <Section title="Recent Health Metrics">
        <DataTable
          columns={[
            { key: 'recorded_at', label: 'Date', render: (r) => fmtDate(r.recorded_at) },
            { key: 'weight', label: 'Weight (kg)' },
            { key: 'body_fat_pct', label: 'Body Fat %' },
            { key: 'blood_pressure', label: 'BP' },
            { key: 'heart_rate', label: 'HR' },
          ]}
          data={data.recent_metrics}
        />
      </Section>
      <Section title="Fitness Goals">
        <DataTable
          columns={[
            { key: 'goal_type', label: 'Type' },
            { key: 'target_value', label: 'Target' },
            { key: 'start_date', label: 'Start', render: (r) => fmtDate(r.start_date) },
            { key: 'end_date', label: 'End', render: (r) => fmtDate(r.end_date) },
            { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
            { key: 'action', label: '', render: (r) => r.status === 'active' && <GoalStatusSelect goal={r} onSaved={load} /> },
          ]}
          data={data.goals}
        />
      </Section>
    </div>
  );
}

function ProfileForm({ member, onSaved }) {
  const [form, setForm] = useState({ name: member.name || '', phone: member.phone || '', gender: member.gender || 'male' });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try { await api.put('/member/profile', form); toast.success('Profile updated.'); onSaved(); }
    catch (err) { toast.error(err.message); }
    finally { setBusy(false); }
  }

  return (
    <Card title="Edit Profile">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Email" value={member.email} disabled />
        <Field label="Name" value={form.name} onChange={set('name')} required />
        <Field label="Phone" value={form.phone} onChange={set('phone')} />
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Gender</label>
          <select className={inputCls} value={form.gender} onChange={set('gender')}>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
        <button type="submit" disabled={busy} className={btnCls}>{busy ? 'Saving...' : 'Save Changes'}</button>
      </form>
    </Card>
  );
}

function MetricForm({ onSaved }) {
  const [form, setForm] = useState({ weight: '', body_fat_pct: '', blood_pressure: '', heart_rate: '' });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try { await api.post('/member/metrics', form); toast.success('Metric recorded.'); setForm({ weight: '', body_fat_pct: '', blood_pressure: '', heart_rate: '' }); onSaved(); }
    catch (err) { toast.error(err.message); }
    finally { setBusy(false); }
  }

  return (
    <Card title="Record Health Metric">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Weight (kg)" type="number" step="0.1" value={form.weight} onChange={set('weight')} />
          <Field label="Body Fat %" type="number" step="0.1" value={form.body_fat_pct} onChange={set('body_fat_pct')} />
          <Field label="Blood Pressure" placeholder="e.g. 120/80" value={form.blood_pressure} onChange={set('blood_pressure')} />
          <Field label="Heart Rate (bpm)" type="number" value={form.heart_rate} onChange={set('heart_rate')} />
        </div>
        <button type="submit" disabled={busy} className={btnCls}>{busy ? 'Saving...' : 'Record Metric'}</button>
      </form>
    </Card>
  );
}

function GoalForm({ onSaved }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ goal_type: 'weight_loss', target_value: '', start_date: '', end_date: '' });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try { await api.post('/member/goals', form); toast.success('Goal added.'); setOpen(false); onSaved(); }
    catch (err) { toast.error(err.message); }
    finally { setBusy(false); }
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Fitness Goals</h2>
        <button onClick={() => setOpen(!open)} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 transition">
          {open ? 'Cancel' : '+ Add Goal'}
        </button>
      </div>
      {open && (
        <Card>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Type</label>
                <select className={inputCls} value={form.goal_type} onChange={set('goal_type')}>
                  <option value="weight_loss">Weight Loss</option>
                  <option value="muscle_gain">Muscle Gain</option>
                  <option value="endurance">Endurance</option>
                  <option value="flexibility">Flexibility</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <Field label="Target" value={form.target_value} onChange={set('target_value')} required />
              <Field label="Start Date" type="date" value={form.start_date} onChange={set('start_date')} required />
              <Field label="End Date" type="date" value={form.end_date} onChange={set('end_date')} />
            </div>
            <button type="submit" disabled={busy} className={btnCls}>{busy ? 'Adding...' : 'Add Goal'}</button>
          </form>
        </Card>
      )}
    </div>
  );
}

function GoalStatusSelect({ goal, onSaved }) {
  async function handleChange(e) {
    try { await api.put(`/member/goals/${goal.goal_id}`, { status: e.target.value }); toast.success('Goal updated.'); onSaved(); }
    catch (err) { toast.error(err.message); }
  }
  return (
    <select className="rounded border border-gray-300 px-2 py-1 text-xs" value={goal.status} onChange={handleChange}>
      <option value="active">Active</option>
      <option value="achieved">Achieved</option>
      <option value="cancelled">Cancelled</option>
    </select>
  );
}

function Card({ title, children }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      {title && <h3 className="mb-4 text-base font-semibold text-gray-800">{title}</h3>}
      {children}
    </div>
  );
}

function Section({ title, children }) {
  return <div><h2 className="mb-3 text-lg font-semibold text-gray-800">{title}</h2>{children}</div>;
}

function Field({ label, ...props }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <input className={`${inputCls} ${props.disabled ? 'bg-gray-50 text-gray-500' : ''}`} {...props} />
    </div>
  );
}

const inputCls = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none';
const btnCls = 'rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 transition';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
