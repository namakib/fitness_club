import { useEffect, useState, useCallback } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import ProfileHeader from '../../components/ProfileHeader';
import SelectDropdown from '../../components/SelectDropdown';
import PhoneInput from '../../components/PhoneInput';
import { formatPhoneDisplay } from '../../components/PhoneInput';
import { UserIcon, CalendarIcon, PhoneIcon, GenderIcon, ClockIcon } from '../../components/Icons';
import NavModeToggle from '../../components/NavModeToggle';
import t from '../../theme';

const GENDERS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
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
          <NavModeToggle />
        </div>
      </div>

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
