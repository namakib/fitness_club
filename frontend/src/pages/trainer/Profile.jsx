import { useEffect, useState, useCallback } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import ProfileHeader from '../../components/ProfileHeader';
import StatCard from '../../components/StatCard';
import SelectDropdown from '../../components/SelectDropdown';
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

/* ── Icons ────────────────────────────────────────────────── */

const UserIcon = () => (
  <svg className="h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
  </svg>
);

const TagIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
  </svg>
);

const PhoneIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
  </svg>
);

const UsersIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
  </svg>
);
