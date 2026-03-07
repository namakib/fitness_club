import { useEffect, useState, useCallback } from 'react';
import api from '../../api';
import { toastError, toastSuccess } from '../../toastUtil';
import ProfileHeader from '../../components/ProfileHeader';
import StatCard from '../../components/StatCard';
import PhoneInput, { formatPhoneDisplay } from '../../components/PhoneInput';
import { UserIcon, PhoneIcon, UsersIcon, TrainerIcon } from '../../components/Icons';
import NavModeToggle from '../../components/NavModeToggle';
import t from '../../theme';

export default function AdminProfile() {
  const [data, setData] = useState(null);
  const [stats, setStats] = useState(null);

  const load = useCallback(() => api.get('/admin/profile').then(setData).catch(() => setData({ admin: null })), []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { api.get('/admin/dashboard').then(setStats).catch(() => {}); }, []);

  if (!data) return <Skeleton />;

  const { admin } = data;

  const meta = [
    { icon: <PhoneIcon />, label: 'Phone', value: formatPhoneDisplay(admin.phone) || admin.phone },
    ...(stats ? [
      { icon: <UsersIcon />, label: 'Total Members', value: String(stats.total_members) },
      { icon: <TrainerIcon />, label: 'Total Trainers', value: String(stats.total_trainers) },
    ] : []),
  ];

  return (
    <div className="space-y-8">
      {/* Side-by-side: avatar left, form right */}
      <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
        <ProfileHeader name={admin.name} email={admin.email} role="admin" meta={meta} />

        <div className="space-y-6">
          <Card title="Edit Profile" icon={<UserIcon />}>
            <ProfileForm admin={admin} onSaved={load} />
          </Card>
          <NavModeToggle />

          {stats && (
            <div className="grid gap-4 sm:grid-cols-2">
              <StatCard label="Total Members" value={stats.total_members} icon="users" color="orange" />
              <StatCard label="Total Trainers" value={stats.total_trainers} icon="trainer" color="emerald" />
              <StatCard label="Equipment" value={stats.total_equipment} icon="wrench" color="violet" />
              <StatCard label="Rooms" value={stats.total_rooms} icon="building" color="amber" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProfileForm({ admin, onSaved }) {
  const [form, setForm] = useState({
    name: admin.name || '',
    phone: admin.phone || '',
  });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.put('/admin/profile', form);
      toastSuccess('Profile updated.');
      onSaved();
    } catch (err) {
      toastError(err.message, err.details);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Email" value={admin.email} disabled />
      <Field label="Name" value={form.name} onChange={set('name')} required />
      <PhoneInput label="Phone" value={form.phone} onChange={set('phone')} />
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
