import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import api from '../../api';
import StatCard from '../../components/StatCard';
import Modal from '../../components/Modal';
import RecordMetricForm from '../../components/RecordMetricForm';
import { SessionIcon, ClassIcon, ChartIcon, TargetIcon } from '../../components/Icons';
import { useTheme } from '../../context/ThemeContext';
import t from '../../theme';

export default function Dashboard() {
  const { isDark } = useTheme();
  const [data, setData] = useState(null);
  const [metricModalOpen, setMetricModalOpen] = useState(false);
  const gridStroke = t.chartGridStroke[isDark ? 'dark' : 'light'];
  const tickFill = t.chartTickFill[isDark ? 'dark' : 'light'];
  const tt = t.chartTooltip[isDark ? 'dark' : 'light'];
  const tooltipStyle = { ...tt.content, borderRadius: 12, fontSize: 13 };
  const tooltipLabelStyle = tt.label;
  const tooltipItemStyle = tt.item;

  const load = useCallback(() => api.get('/member/dashboard').then(setData).catch(() => setData({ summary: null, active_goals: [], recent_metrics: [], all_metrics: [], upcoming_sessions: [], upcoming_classes: [] })), []);
  useEffect(() => { load(); }, [load]);

  if (!data) return <Skeleton />;

  const { summary, active_goals, all_metrics, upcoming_sessions, upcoming_classes } = data;

  const chartData = (all_metrics || []).map(m => ({
    date: shortDate(m.recorded_at),
    weight: m.weight,
    heartRate: m.heart_rate,
  }));

  const nextSession = upcoming_sessions?.[0] ?? null;
  const nextClass = upcoming_classes?.[0] ?? null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Welcome back! Here are your key insights.</p>
        </div>
        <button onClick={() => setMetricModalOpen(true)} className={t.btnSmall}>
          + Record Health Metric
        </button>
      </div>

      <Modal open={metricModalOpen} onClose={() => setMetricModalOpen(false)} title="Record Health Metric">
        <RecordMetricForm
          onSaved={() => { setMetricModalOpen(false); load(); }}
          onCancel={() => setMetricModalOpen(false)}
        />
      </Modal>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Latest Weight" value={summary?.latest_weight != null ? `${summary.latest_weight} kg` : null} icon="weight" color="orange" />
        <StatCard label="Active Goals" value={summary?.active_goals ?? 0} icon="goal" color="emerald" />
        <StatCard label="Classes Enrolled" value={summary?.classes_attended ?? 0} icon="class" color="violet" />
        <StatCard label="Upcoming Sessions" value={summary?.upcoming_sessions ?? 0} icon="session" color="amber" />
      </div>

      {/* Health trend chart */}
      {chartData.length > 1 ? (
        <ChartCard title="Health Trend" subtitle="Weight and heart rate over time">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={t.chartPrimary} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={t.chartPrimary} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="hrGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={t.chartBar} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={t.chartBar} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: tickFill }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fontSize: 11, fill: tickFill }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: tickFill }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} cursor={tt.cursor} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area yAxisId="left" type="monotone" dataKey="weight" stroke={t.chartPrimary} strokeWidth={2.5} fill="url(#weightGrad)" dot={{ r: 3, fill: '#fff', stroke: t.chartPrimary, strokeWidth: 2 }} activeDot={{ r: 5, fill: t.chartPrimary, stroke: '#fff', strokeWidth: 2 }} name="Weight (kg)" />
              <Area yAxisId="right" type="monotone" dataKey="heartRate" stroke={t.chartBar} strokeWidth={2} fill="url(#hrGrad)" dot={{ r: 3, fill: '#fff', stroke: t.chartBar, strokeWidth: 2 }} activeDot={{ r: 5, fill: t.chartBar, stroke: '#fff', strokeWidth: 2 }} name="Heart Rate (bpm)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      ) : (
        <div className={`rounded-xl border ${t.cardBorder} ${t.cardBg} p-8 text-center`}>
          <p className={`text-sm ${t.pageTextMuted}`}>No health data recorded yet. Use the button above to start tracking.</p>
        </div>
      )}

      {/* Next Up */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200">Next Up</h2>
          <Link to="/member/schedule" className="text-sm font-medium text-orange-600 dark:text-orange-400 hover:underline">View full schedule</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <NextUpCard
            icon={<SessionIcon className="h-5 w-5 text-amber-500" />}
            label="Next Session"
            empty="No upcoming sessions."
            item={nextSession}
            renderContent={(s) => (
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <dt className="font-medium text-gray-500 dark:text-gray-400">Date</dt>
                <dd className="text-gray-800 dark:text-gray-100">{fmtDate(s.session_date)}</dd>
                <dt className="font-medium text-gray-500 dark:text-gray-400">Time</dt>
                <dd className="text-gray-800 dark:text-gray-100">{s.start_time} – {s.end_time}</dd>
                <dt className="font-medium text-gray-500 dark:text-gray-400">Trainer</dt>
                <dd className="text-gray-800 dark:text-gray-100">{s.trainer_name}</dd>
                <dt className="font-medium text-gray-500 dark:text-gray-400">Room</dt>
                <dd className="text-gray-800 dark:text-gray-100">{s.room_name}</dd>
              </dl>
            )}
          />
          <NextUpCard
            icon={<ClassIcon className="h-5 w-5 text-violet-500" />}
            label="Next Class"
            empty="No upcoming classes."
            item={nextClass}
            renderContent={(c) => (
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <dt className="font-medium text-gray-500 dark:text-gray-400">Class</dt>
                <dd className="text-gray-800 dark:text-gray-100">{c.class_name}</dd>
                <dt className="font-medium text-gray-500 dark:text-gray-400">Date</dt>
                <dd className="text-gray-800 dark:text-gray-100">{fmtDate(c.class_date)}</dd>
                <dt className="font-medium text-gray-500 dark:text-gray-400">Time</dt>
                <dd className="text-gray-800 dark:text-gray-100">{c.start_time} – {c.end_time}</dd>
                <dt className="font-medium text-gray-500 dark:text-gray-400">Room</dt>
                <dd className="text-gray-800 dark:text-gray-100">{c.room_name}</dd>
              </dl>
            )}
          />
        </div>
      </div>

      {/* Active Goals */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ChartIcon className="h-5 w-5 text-emerald-500" />
            <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200">Active Goals</h2>
          </div>
          <Link to="/member/goals" className="text-sm font-medium text-orange-600 dark:text-orange-400 hover:underline">Manage goals</Link>
        </div>
        {active_goals?.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {active_goals.map((g, i) => (
              <div key={i} className={`inline-flex items-center gap-3 rounded-lg border ${t.cardBorder} ${t.cardBg} px-4 py-3 shadow-sm`}>
                <TargetIcon className="h-4 w-4 text-emerald-500 shrink-0" />
                <div className="text-sm">
                  <span className="font-medium text-gray-800 dark:text-gray-100 capitalize">{(g.goal_type || '').replace(/_/g, ' ')}</span>
                  <span className="mx-1.5 text-gray-400 dark:text-gray-500">·</span>
                  <span className="text-gray-600 dark:text-gray-300">Target: {g.target_value}</span>
                  {g.end_date && (
                    <>
                      <span className="mx-1.5 text-gray-400 dark:text-gray-500">·</span>
                      <span className="text-gray-500 dark:text-gray-400">Due {fmtDate(g.end_date)}</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={`rounded-xl border ${t.cardBorder} ${t.cardBg} p-6 text-center`}>
            <p className={`text-sm ${t.pageTextMuted}`}>
              No active goals. <Link to="/member/goals" className="text-orange-600 dark:text-orange-400 hover:underline">Add one now.</Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function NextUpCard({ icon, label, empty, item, renderContent }) {
  return (
    <div className={`rounded-xl border ${t.cardBorder} ${t.cardBg} p-5 shadow-sm`}>
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{label}</h3>
      </div>
      {item ? renderContent(item) : (
        <p className={`text-sm ${t.pageTextMuted}`}>{empty}</p>
      )}
    </div>
  );
}

function ChartCard({ title, subtitle, children }) {
  return (
    <div className={`rounded-xl border ${t.cardBorder} ${t.cardBg} p-6 shadow-sm`}>
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
      <div className="h-72 rounded-xl bg-gray-200 dark:bg-gray-700" />
      <div className="grid gap-4 sm:grid-cols-2">
        {[...Array(2)].map((_, i) => <div key={i} className="h-36 rounded-xl bg-gray-200 dark:bg-gray-700" />)}
      </div>
    </div>
  );
}
