import { useEffect, useState } from 'react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import api from '../../api';
import StatCard from '../../components/StatCard';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import t from '../../theme';

export default function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => { api.get('/member/dashboard').then(setData); }, []);

  if (!data) return <Skeleton />;

  const { summary, active_goals, recent_metrics, all_metrics, upcoming_sessions, upcoming_classes } = data;

  const chartData = (all_metrics || []).map(m => ({
    date: shortDate(m.recorded_at),
    weight: m.weight,
    bodyFat: m.body_fat_pct,
    heartRate: m.heart_rate,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Welcome back! Here's your fitness overview.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Latest Weight" value={summary?.latest_weight ? `${summary.latest_weight} kg` : null} icon="weight" color="orange" />
        <StatCard label="Active Goals" value={summary?.active_goal_count ?? 0} icon="goal" color="emerald" />
        <StatCard label="Classes Enrolled" value={summary?.enrolled_class_count ?? 0} icon="class" color="violet" />
        <StatCard label="Upcoming Sessions" value={summary?.upcoming_session_count ?? 0} icon="session" color="amber" />
      </div>

      {chartData.length > 1 && (
        <div className="grid gap-6 lg:grid-cols-2">
          <ChartCard title="Weight Trend" subtitle="kg over time">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={t.chartGradientFrom} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={t.chartGradientFrom} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 13 }} />
                <Area type="monotone" dataKey="weight" stroke={t.chartPrimary} strokeWidth={2.5} fill="url(#weightGrad)" dot={{ r: 3, fill: t.chartPrimary }} name="Weight (kg)" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Heart Rate" subtitle="bpm per reading">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 13 }} />
                <Bar dataKey="heartRate" fill={t.chartBar} radius={[6, 6, 0, 0]} name="Heart Rate (bpm)" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Recent Health Metrics" icon={
          <svg className="h-5 w-5 text-orange-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
          </svg>
        }>
          <DataTable
            columns={[
              { key: 'recorded_at', label: 'Date', render: (r) => fmtDate(r.recorded_at) },
              { key: 'weight', label: 'Weight' },
              { key: 'body_fat_pct', label: 'BF%' },
              { key: 'heart_rate', label: 'HR' },
            ]}
            data={recent_metrics}
            emptyMessage="No metrics yet."
          />
        </Section>

        <Section title="Active Goals" icon={
          <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
          </svg>
        }>
          <DataTable
            columns={[
              { key: 'goal_type', label: 'Type', filter: 'enum', render: (r) => <span className="capitalize">{(r.goal_type || '').replace(/_/g, ' ')}</span> },
              { key: 'target_value', label: 'Target' },
              { key: 'end_date', label: 'Due', render: (r) => fmtDate(r.end_date) },
            ]}
            data={active_goals}
            emptyMessage="No active goals."
          />
        </Section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Upcoming Sessions" icon={
          <svg className="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
          </svg>
        }>
          <DataTable
            columns={[
              { key: 'session_date', label: 'Date', filter: 'date', render: (r) => fmtDate(r.session_date) },
              { key: 'time', label: 'Time', render: (r) => `${r.start_time} – ${r.end_time}` },
              { key: 'trainer_name', label: 'Trainer', filter: 'enum' },
              { key: 'room_name', label: 'Room', filter: 'enum' },
            ]}
            data={upcoming_sessions}
            emptyMessage="No upcoming sessions."
          />
        </Section>

        <Section title="Upcoming Classes" icon={
          <svg className="h-5 w-5 text-violet-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
          </svg>
        }>
          <DataTable
            columns={[
              { key: 'class_name', label: 'Class', filter: 'enum' },
              { key: 'class_date', label: 'Date', filter: 'date', render: (r) => fmtDate(r.class_date) },
              { key: 'time', label: 'Time', render: (r) => `${r.start_time} – ${r.end_time}` },
              { key: 'room_name', label: 'Room', filter: 'enum' },
            ]}
            data={upcoming_classes}
            emptyMessage="No upcoming classes."
          />
        </Section>
      </div>
    </div>
  );
}

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{title}</h3>
        {subtitle && <p className="text-xs text-gray-400 dark:text-gray-500">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function Section({ title, icon, children }) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function shortDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function Skeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div><div className="h-8 w-48 rounded bg-gray-200 dark:bg-gray-700" /><div className="mt-2 h-4 w-64 rounded bg-gray-100 dark:bg-gray-700/50" /></div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-28 rounded-xl bg-gray-200 dark:bg-gray-700" />)}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {[...Array(2)].map((_, i) => <div key={i} className="h-64 rounded-xl bg-gray-200 dark:bg-gray-700" />)}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {[...Array(2)].map((_, i) => <div key={i} className="h-40 rounded-xl bg-gray-200 dark:bg-gray-700" />)}
      </div>
    </div>
  );
}
