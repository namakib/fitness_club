import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';
import ThemeToggle from '../components/ThemeToggle';
import SelectDropdown from '../components/SelectDropdown';
import DatePicker from '../components/DatePicker';
import PhoneInput from '../components/PhoneInput';
import { EyeIcon, EyeSlashIcon } from '../components/Icons';
import t from '../theme';

const GENDERS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', dob: '', gender: 'male', phone: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post('/register', form);
      toast.success('Registration successful! Please log in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`flex min-h-screen items-center justify-center ${t.authBg} px-4 transition-colors duration-200`}>
      <div className="absolute left-4 top-4">
        <Link to="/" className="text-sm text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 transition">
          ← Back to Home
        </Link>
      </div>
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <img src="/logo.png" alt="Fitness Club" className="mx-auto mb-2 h-28 w-auto dark:[filter:drop-shadow(0_0_1px_white)_drop-shadow(0_0_2px_white)]" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Create Account</h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">Join the Fitness Club</p>
        </div>
        <form onSubmit={handleSubmit} className={t.authCard}>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
              <input type="text" required className={t.inputLg} value={form.name} onChange={set('name')} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
              <input type="email" required className={t.inputLg} value={form.email} onChange={set('email')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <DatePicker
                label="Date of Birth"
                value={form.dob}
                onChange={(val) => setForm({ ...form, dob: val })}
                placeholder="Select date"
                max={new Date().toISOString().slice(0, 10)}
                required
              />
              <SelectDropdown
                label="Gender"
                value={form.gender}
                options={GENDERS}
                onChange={(val) => setForm({ ...form, gender: val })}
                placeholder="Select gender"
                searchable={false}
              />
            </div>
            <PhoneInput
              label="Phone (optional)"
              value={form.phone}
              onChange={set('phone')}
              className={t.inputLg}
            />
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  className={`${t.inputLg} pr-10`}
                  value={form.password}
                  onChange={set('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeSlashIcon variant="fa" className="h-4 w-4" /> : <EyeIcon variant="fa" className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <button type="submit" disabled={busy}
            className={`mt-6 w-full py-2.5 ${t.btn}`}>
            {busy ? 'Creating account...' : 'Create Account'}
          </button>

          <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className={t.link}>Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
