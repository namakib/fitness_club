import { useEffect, useState, useCallback } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import ProfileHeader from '../../components/ProfileHeader';
import StatCard from '../../components/StatCard';
import SelectDropdown from '../../components/SelectDropdown';
import { UserIcon, TagIcon, PhoneIcon, UsersIcon } from '../../components/Icons';
import t from '../../theme';

const SPECIALIZATIONS = [
  { value: 'Strength Training', label: 'Strength Training' },
  { value: 'Cardio & HIIT', label: 'Cardio & HIIT' },
  { value: 'Yoga & Flexibility', label: 'Yoga & Flexibility' },
  { value: 'Pilates', label: 'Pilates' },
  { value: 'CrossFit', label: 'CrossFit' },
  { value: 'Boxing & Martial Arts', label: 'Boxing & Martial Arts' },
  { value: 'Nutrition & Weight Management', label: 'Nutrition & Weight Management' },
  { value: 'Sports Performance', label: 'Sports Performance' },
  { value: 'Rehabilitation & Recovery', label: 'Rehabilitation & Recovery' },
  { value: 'Group Fitness', label: 'Group Fitness' },
];

export default function TrainerProfile() {
  const [data, setData] = useState(null);
  const [stats, setStats] = useState(null);

  const load = useCallback(() => api.get('/trainer/profile').then(setData), []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { api.get('/trainer/dashboard').then(setStats).catch(() => {}); }, []);

  if (!data) return <Skeleton />;

  const { trainer } = data;

  const meta = [
    { icon: <TagIcon />, label: 'Specialization', value: trainer.specialization },
    { icon: <PhoneIcon />, label: 'Phone', value: trainer.phone },
    ...(stats ? [{ icon: <UsersIcon />, label: 'Members Trained', value: String(stats.total_members) }] : []),
  ];

  return (
    <div className="space-y-8">
      {/* Side-by-side: avatar left, form right */}
      <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
        <ProfileHeader name={trainer.name} email={trainer.email} role="trainer" meta={meta} />

        <div className="space-y-6">
          <Card title="Edit Profile" icon={<UserIcon />}>
            <ProfileForm trainer={trainer} onSaved={load} />
          </Card>

          {stats && (
            <div className="grid gap-4 sm:grid-cols-2">
              <StatCard label="Upcoming Sessions" value={stats.total_sessions} icon="session" color="orange" />
              <StatCard label="Group Classes" value={stats.total_classes} icon="class" color="emerald" />
              <StatCard label="Members Trained" value={stats.total_members} icon="users" color="violet" />
              <StatCard label="Availability Slots" value={stats.total_availability_slots} icon="clock" color="amber" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProfileForm({ trainer, onSaved }) {
  const [form, setForm] = useState({
    name: trainer.name || '',
    phone: trainer.phone || '',
    specialization: trainer.specialization || '',
  });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.put('/trainer/profile', form);
      toast.success('Profile updated.');
      onSaved();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Email" value={trainer.email} disabled />
      <Field label="Name" value={form.name} onChange={set('name')} required />
      <Field label="Phone" value={form.phone} onChange={set('phone')} />
      <SelectDropdown
        label="Specialization"
        value={form.specialization}
        options={SPECIALIZATIONS}
        onChange={(val) => setForm({ ...form, specialization: val })}
        placeholder="Select specialization"
      />
      <button type="submit" disabled={busy} className={t.btn}>{busy ? 'Saving...' : 'Save Changes'}</button>
    </form>
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
  return <div className="animate-pulse space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-gray-200 dark:bg-gray-700" />)}</div>;
}

