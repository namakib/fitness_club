import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';
import ThemeToggle from '../components/ThemeToggle';
import t from '../theme';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', dob: '', gender: 'male', phone: '', password: '' });
  const [busy, setBusy] = useState(false);

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
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <img src="/logo.png" alt="Fitness Club" className="mx-auto mb-2 h-28 w-auto" />
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
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Date of Birth</label>
                <input type="date" required className={t.inputLg} value={form.dob} onChange={set('dob')} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Gender</label>
                <select className={t.inputLg} value={form.gender} onChange={set('gender')}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Phone <span className="text-gray-400 dark:text-gray-500">(optional)</span></label>
              <input type="tel" className={t.inputLg} value={form.phone} onChange={set('phone')} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
              <input type="password" required minLength={6} className={t.inputLg} value={form.password} onChange={set('password')} />
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
