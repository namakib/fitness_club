import { useEffect, useState, useCallback } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import ProfileHeader from '../../components/ProfileHeader';
import SelectDropdown from '../../components/SelectDropdown';
import DatePicker from '../../components/DatePicker';
import Modal from '../../components/Modal';
import PhoneInput from '../../components/PhoneInput';
import { formatPhoneDisplay } from '../../components/PhoneInput';
import { UserIcon, ChartIcon, TargetIcon, CalendarIcon, PhoneIcon, GenderIcon, ClockIcon } from '../../components/Icons';
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
    { icon: <PhoneIcon />, label: 'Phone', value: formatPhoneDisplay(member.phone) || member.phone },
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
      <PhoneInput label="Phone" value={form.phone} onChange={set('phone')} />
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

/* ── Goal Section ─────────────────────────────────────────── */

function GoalSection({ data, onSaved }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ goal_type: 'weight_loss', target_value: '', start_date: '', end_date: '' });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post('/member/goals', form);
      toast.success('Goal added.');
      setOpen(false);
      setForm({ goal_type: 'weight_loss', target_value: '', start_date: '', end_date: '' });
      onSaved();
    } catch (err) { toast.error(err.message); }
    finally { setBusy(false); }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-gray-800 dark:text-gray-200">
          <TargetIcon />
          <h2 className="text-lg font-semibold">Fitness Goals</h2>
        </div>
        <button onClick={() => setOpen(true)} className={t.btnSmall}>
          + Add Goal
        </button>
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

const GOAL_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'achieved', label: 'Achieved' },
  { value: 'cancelled', label: 'Cancelled' },
];

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
