import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDemo } from '../context/DemoContext';
import { toastError } from '../toastUtil';
import ThemeToggle from '../components/ThemeToggle';
import SelectDropdown from '../components/SelectDropdown';
import { EyeIcon, EyeSlashIcon } from '../components/Icons';
import t from '../theme';

const ROLE_OPTIONS = [
  { value: 'member', label: 'Member' },
  { value: 'trainer', label: 'Trainer' },
  { value: 'admin', label: 'Admin' },
];

export default function Login() {
  const { login } = useAuth();
  const { demoMode, demoAccounts } = useDemo();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', role: 'member' });
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const dest = { member: '/member/dashboard', trainer: '/trainer/dashboard', admin: '/admin/dashboard' };

  function fillDemo(account) {
    setForm({ email: account.email, password: account.password, role: account.role });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await login(form.email, form.password, form.role);
      navigate(dest[form.role]);
    } catch (err) {
      toastError(err.message, err.details);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`flex min-h-screen flex-col items-center justify-center ${t.authBg} px-4 transition-colors duration-200`}>
      <div className="absolute left-4 top-4">
        <Link to="/" className="text-sm text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 transition">
          ← Back to Home
        </Link>
      </div>
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md flex-1 flex flex-col justify-center">
        <div className="mb-8 text-center">
          <img src="/logo.png" alt="Fitness Club" className="mx-auto mb-2 h-28 w-auto dark:[filter:drop-shadow(0_0_1px_white)_drop-shadow(0_0_2px_white)]" />
          <p className="mt-2 text-gray-500 dark:text-gray-400">Sign in to your account</p>
        </div>
        <form onSubmit={handleSubmit} className={t.authCard}>
          <div className="space-y-5">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
              <input type="email" required autoFocus className={t.inputLg}
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className={`${t.inputLg} pr-10`}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <SelectDropdown
              label="Role"
              value={form.role}
              options={ROLE_OPTIONS}
              onChange={(val) => setForm({ ...form, role: val })}
              placeholder="Select role"
              searchable={false}
            />
          </div>

          <button type="submit" disabled={busy}
            className={`mt-6 w-full py-2.5 ${t.btn}`}>
            {busy ? 'Signing in...' : 'Sign In'}
          </button>

          {!demoMode && (
            <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
              Don't have an account?{' '}
              <Link to="/register" className={t.link}>Register</Link>
            </p>
          )}
        </form>

        {demoMode && demoAccounts.length > 0 && (
          <div className="mt-4 rounded-xl border border-orange-200 bg-orange-50/60 p-4 dark:border-orange-800 dark:bg-orange-900/20">
            <p className="mb-3 text-center text-sm font-semibold text-orange-700 dark:text-orange-400">
              Demo Mode &mdash; click a role to auto-fill
            </p>
            <div className="flex flex-col gap-2">
              {demoAccounts.map((a) => (
                <button
                  key={a.role}
                  type="button"
                  onClick={() => fillDemo(a)}
                  className="flex items-center justify-between rounded-lg border border-orange-200 bg-white px-3 py-2 text-left text-sm transition hover:border-orange-400 hover:shadow-sm dark:border-orange-700 dark:bg-gray-800 dark:hover:border-orange-500"
                >
                  <span className="font-medium capitalize text-gray-800 dark:text-gray-200">{a.role}</span>
                  <span className="text-gray-500 dark:text-gray-400">{a.email}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <footer className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
        Health & Fitness Club Management
      </footer>
    </div>
  );
}
