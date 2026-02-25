import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
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
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', role: 'member' });
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const dest = { member: '/member/dashboard', trainer: '/trainer/dashboard', admin: '/admin/dashboard' };

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await login(form.email, form.password, form.role);
      navigate(dest[form.role]);
    } catch (err) {
      toast.error(err.message);
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

          <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
            Don't have an account?{' '}
            <Link to="/register" className={t.link}>Register</Link>
          </p>
        </form>
      </div>
      <footer className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
        Health & Fitness Club Management
      </footer>
    </div>
  );
}
