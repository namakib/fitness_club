import { useEffect, useState, useCallback } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import ProfileHeader from '../../components/ProfileHeader';
import SelectDropdown from '../../components/SelectDropdown';
import { UserIcon, HeartIcon, ChartIcon, TargetIcon, CalendarIcon, PhoneIcon, GenderIcon, ClockIcon } from '../../components/Icons';
import t from '../../theme';

const GENDERS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

const GOAL_TYPES = [
  { value: 'weight_loss', label: 'Weight Loss' },
  { value: 'muscle_gain', label: 'Muscle Gain' },
  { value: 'endurance', label: 'Endurance' },
  { value: 'flexibility', label: 'Flexibility' },
  { value: 'other', label: 'Other' },
];

export default function Profile() {
  const [data, setData] = useState(null);

  const load = useCallback(() => api.get('/member/profile').then(setData), []);
  useEffect(() => { load(); }, [load]);

  if (!data) return <Skeleton />;

  const { member } = data;

  const meta = [
    { icon: <CalendarIcon />, label: 'Date of Birth', value: member.dob ? fmtDate(member.dob) : null },
    { icon: <PhoneIcon />, label: 'Phone', value: member.phone },
    { icon: <GenderIcon />, label: 'Gender', value: member.gender ? capitalize(member.gender) : null },
    { icon: <ClockIcon />, label: 'Joined', value: member.created_at ? new Date(member.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : null },
  ];

  return (
    <div className="space-y-8">
      {/* Side-by-side: avatar left, forms right */}
      <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
        <ProfileHeader name={member.name} email={member.email} role="member" meta={meta} />

        <div className="space-y-6">
          <Card title="Edit Profile" icon={<UserIcon />}>
            <ProfileForm member={member} onSaved={load} />
          </Card>

          <Card title="Record Health Metric" icon={<HeartIcon />}>
            <MetricForm onSaved={load} />
          </Card>
        </div>
      </div>

      {/* Full-width sections below */}
      <GoalSection data={data} onSaved={load} />

      <Card title="Recent Health Metrics" icon={<ChartIcon />}>
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
      </Card>
    </div>
  );
}

/* ── Profile Form ─────────────────────────────────────────── */

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
    <form onSubmit={submit} className="space-y-4">
      <Field label="Email" value={member.email} disabled />
      <Field label="Name" value={form.name} onChange={set('name')} required />
      <Field label="Phone" value={form.phone} onChange={set('phone')} />
      <SelectDropdown
        label="Gender"
        value={form.gender}
        options={GENDERS}
        onChange={(val) => setForm({ ...form, gender: val })}
        placeholder="Select gender"
        searchable={false}
      />
      <button type="submit" disabled={busy} className={t.btn}>{busy ? 'Saving...' : 'Save Changes'}</button>
    </form>
  );
}

/* ── Metric Form ──────────────────────────────────────────── */

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
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Weight (kg)" type="number" step="0.1" value={form.weight} onChange={set('weight')} />
        <Field label="Body Fat %" type="number" step="0.1" value={form.body_fat_pct} onChange={set('body_fat_pct')} />
        <Field label="Blood Pressure" placeholder="e.g. 120/80" value={form.blood_pressure} onChange={set('blood_pressure')} />
        <Field label="Heart Rate (bpm)" type="number" value={form.heart_rate} onChange={set('heart_rate')} />
      </div>
      <button type="submit" disabled={busy} className={t.btn}>{busy ? 'Saving...' : 'Record Metric'}</button>
    </form>
  );
}

/* ── Goal Section ─────────────────────────────────────────── */

function GoalSection({ data, onSaved }) {
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-gray-800 dark:text-gray-200">
          <TargetIcon />
          <h2 className="text-lg font-semibold">Fitness Goals</h2>
        </div>
        <button onClick={() => setOpen(!open)} className={t.btnSmall}>
          {open ? 'Cancel' : '+ Add Goal'}
        </button>
      </div>

      {open && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
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
              <Field label="Start Date" type="date" value={form.start_date} onChange={set('start_date')} required />
              <Field label="End Date" type="date" value={form.end_date} onChange={set('end_date')} />
            </div>
            <button type="submit" disabled={busy} className={t.btn}>{busy ? 'Adding...' : 'Add Goal'}</button>
          </form>
        </div>
      )}

      <DataTable
        columns={[
          { key: 'goal_type', label: 'Type' },
          { key: 'target_value', label: 'Target' },
          { key: 'start_date', label: 'Start', render: (r) => fmtDate(r.start_date) },
          { key: 'end_date', label: 'End', render: (r) => fmtDate(r.end_date) },
          { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
          { key: 'action', label: '', render: (r) => r.status === 'active' && <GoalStatusSelect goal={r} onSaved={onSaved} /> },
        ]}
        data={data.goals}
      />
    </div>
  );
}

function GoalStatusSelect({ goal, onSaved }) {
  async function handleChange(e) {
    try { await api.put(`/member/goals/${goal.goal_id}`, { status: e.target.value }); toast.success('Goal updated.'); onSaved(); }
    catch (err) { toast.error(err.message); }
  }
  return (
    <select className="rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 px-2 py-1 text-xs" value={goal.status} onChange={handleChange}>
      <option value="active">Active</option>
      <option value="achieved">Achieved</option>
      <option value="cancelled">Cancelled</option>
    </select>
  );
}

/* ── Shared UI ────────────────────────────────────────────── */

function Card({ title, icon, children }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
      {title && (
        <div className="mb-5 flex items-center gap-2 text-gray-800 dark:text-gray-200">
          {icon}
          <h3 className="text-base font-semibold">{title}</h3>
        </div>
      )}
      {children}
    </div>
  );
}

function Field({ label, ...props }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      <input className={`${t.input} ${props.disabled ? 'bg-gray-50 text-gray-500 dark:bg-gray-700 dark:text-gray-400' : ''}`} {...props} />
    </div>
  );
}

function Skeleton() {
  return <div className="animate-pulse space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-gray-200 dark:bg-gray-700" />)}</div>;
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
