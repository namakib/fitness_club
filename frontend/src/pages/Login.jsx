import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import t from '../theme';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', role: 'member' });
  const [busy, setBusy] = useState(false);

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
    <div className={`flex min-h-screen items-center justify-center ${t.authBg} px-4`}>
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <img src="/logo.png" alt="Fitness Club" className="mx-auto mb-2 h-28 w-auto" />
          <p className="mt-2 text-gray-500">Sign in to your account</p>
        </div>
        <form onSubmit={handleSubmit} className={t.authCard}>
          <div className="space-y-5">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
              <input type="email" required autoFocus className={t.inputLg}
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
              <input type="password" required className={t.inputLg}
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Role</label>
              <select className={t.inputLg} value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                <option value="member">Member</option>
                <option value="trainer">Trainer</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          <button type="submit" disabled={busy}
            className={`mt-6 w-full py-2.5 ${t.btn}`}>
            {busy ? 'Signing in...' : 'Sign In'}
          </button>

          <p className="mt-4 text-center text-sm text-gray-500">
            Don't have an account?{' '}
            <Link to="/register" className={t.link}>Register</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
