import { useEffect, useState } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import api from '../../api';
import StatCard from '../../components/StatCard';
import DataTable from '../../components/DataTable';
import { useTheme } from '../../context/ThemeContext';
import t from '../../theme';

export default function TrainerDashboard() {
  const { isDark } = useTheme();
  const [data, setData] = useState(null);
  const gridStroke = t.chartGridStroke[isDark ? 'dark' : 'light'];
  const tickFill = t.chartTickFill[isDark ? 'dark' : 'light'];
  const tt = t.chartTooltip[isDark ? 'dark' : 'light'];
  const tooltipStyle = { ...tt.content, borderRadius: 12, fontSize: 13 };
  const tooltipLabelStyle = tt.label;
  const tooltipItemStyle = tt.item;

  useEffect(() => { api.get('/trainer/dashboard').then(setData).catch(() => setData({ total_sessions: 0, total_classes: 0, total_members: 0, total_availability_slots: 0, upcoming_sessions: [], session_trend: [], class_trend: [] })); }, []);

  if (!data) return <Skeleton />;

  const sessionData = (data.session_trend || []).map(r => ({ month: r.month, count: r.count }));
  const classData = (data.class_trend || []).map(r => ({ month: r.month, count: r.count }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Trainer Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Overview of your sessions, classes, and availability.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Upcoming Sessions" value={data.total_sessions} icon="session" color="orange" />
        <StatCard label="Upcoming Classes" value={data.total_classes} icon="class" color="emerald" />
        <StatCard label="Members Trained" value={data.total_members} icon="users" color="violet" />
        <StatCard label="Availability Slots" value={data.total_availability_slots} icon="clock" color="amber" />
      </div>

      {(sessionData.length > 0 || classData.length > 0) && (
        <div className="grid gap-6 lg:grid-cols-2">
          {sessionData.length > 0 && (
            <ChartCard title="Sessions per Month" subtitle="Last 6 months">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={sessionData}>
                  <defs>
                    <linearGradient id="sessionBarGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={t.chartPrimary} stopOpacity={1} />
                      <stop offset="100%" stopColor={t.chartPrimary} stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: tickFill }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: tickFill }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} cursor={tt.cursor} />
                  <Bar dataKey="count" fill="url(#sessionBarGrad)" activeBar={{ fill: 'url(#sessionBarGrad)' }} radius={[8, 8, 0, 0]} name="Sessions" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {classData.length > 0 && (
            <ChartCard title="Classes per Month" subtitle="Last 6 months">
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={classData}>
                  <defs>
                    <linearGradient id="classGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={t.chartPrimary} stopOpacity={0.45} />
                      <stop offset="60%" stopColor={t.chartGradientFrom} stopOpacity={0.15} />
                      <stop offset="100%" stopColor={t.chartGradientFrom} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: tickFill }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: tickFill }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} cursor={tt.cursor} />
                  <Area type="monotone" dataKey="count" stroke={t.chartPrimary} strokeWidth={2.5} fill="url(#classGrad)" dot={{ r: 4, fill: '#fff', stroke: t.chartPrimary, strokeWidth: 2 }} activeDot={{ r: 6, fill: t.chartPrimary, stroke: '#fff', strokeWidth: 2 }} name="Classes" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          )}
        </div>
      )}

      <div>
        <h2 className="mb-3 text-base font-semibold text-gray-800 dark:text-gray-200">Next Upcoming Sessions</h2>
        <DataTable
          columns={[
            { key: 'session_date', label: 'Date', render: r => fmtDate(r.session_date) },
            { key: 'time', label: 'Time', render: r => `${r.start_time} – ${r.end_time}` },
            { key: 'member_name', label: 'Member' },
            { key: 'room_name', label: 'Room' },
          ]}
          data={data.upcoming_sessions}
          searchable={false}
          pageSize={5}
          emptyMessage="No upcoming sessions."
        />
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

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function Skeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div><div className="h-8 w-56 rounded bg-gray-200 dark:bg-gray-700" /><div className="mt-2 h-4 w-72 rounded bg-gray-100 dark:bg-gray-700/50" /></div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-28 rounded-xl bg-gray-200 dark:bg-gray-700" />)}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {[...Array(2)].map((_, i) => <div key={i} className="h-64 rounded-xl bg-gray-200 dark:bg-gray-700" />)}
      </div>
      <div className="h-48 rounded-xl bg-gray-200 dark:bg-gray-700" />
    </div>
  );
}
