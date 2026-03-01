import { useEffect, useState, useCallback } from 'react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import api from '../../api';
import toast from 'react-hot-toast';
import StatCard from '../../components/StatCard';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import RecordMetricForm from '../../components/RecordMetricForm';
import { HeartIcon, ChartIcon, SessionIcon, ClassIcon } from '../../components/Icons';
import { useTheme } from '../../context/ThemeContext';
import t from '../../theme';

export default function Dashboard() {
  const { isDark } = useTheme();
  const [data, setData] = useState(null);
  const [metricModalOpen, setMetricModalOpen] = useState(false);
  const [cancelSession, setCancelSession] = useState(null);
  const [dropClass, setDropClass] = useState(null);
  const [busy, setBusy] = useState(false);
  const gridStroke = t.chartGridStroke[isDark ? 'dark' : 'light'];
  const tickFill = t.chartTickFill[isDark ? 'dark' : 'light'];
  const tt = t.chartTooltip[isDark ? 'dark' : 'light'];
  const tooltipStyle = { ...tt.content, borderRadius: 12, fontSize: 13 };
  const tooltipLabelStyle = tt.label;
  const tooltipItemStyle = tt.item;

  const load = useCallback(() => api.get('/member/dashboard').then(setData), []);
  useEffect(() => { load(); }, [load]);

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
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Welcome back! Here's your fitness overview.</p>
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

      <ConfirmDialog
        open={!!cancelSession}
        onClose={() => setCancelSession(null)}
        title="Cancel Session"
        message={cancelSession ? `Cancel your session on ${fmtDate(cancelSession.session_date)} at ${cancelSession.start_time}?` : ''}
        confirmLabel="Cancel Session"
        variant="danger"
        loading={busy}
        onConfirm={async () => {
          setBusy(true);
          try {
            await api.put(`/member/sessions/${cancelSession.session_id}`, { status: 'cancelled' });
            toast.success('Session cancelled.');
            load();
          } catch (err) {
            toast.error(err.message);
          } finally {
            setBusy(false);
          }
        }}
      />

      <ConfirmDialog
        open={!!dropClass}
        onClose={() => setDropClass(null)}
        title="Drop Class"
        message={dropClass ? `Drop from ${dropClass.class_name} on ${fmtDate(dropClass.class_date)}?` : ''}
        confirmLabel="Drop"
        variant="danger"
        loading={busy}
        onConfirm={async () => {
          setBusy(true);
          try {
            await api.delete(`/member/classes/${dropClass.class_id}/enroll`);
            toast.success('Dropped from class.');
            load();
          } catch (err) {
            toast.error(err.message);
          } finally {
            setBusy(false);
          }
        }}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Latest Weight" value={summary?.latest_weight != null ? `${summary.latest_weight} kg` : null} icon="weight" color="orange" />
        <StatCard label="Active Goals" value={summary?.active_goals ?? 0} icon="goal" color="emerald" />
        <StatCard label="Classes Enrolled" value={summary?.classes_attended ?? 0} icon="class" color="violet" />
        <StatCard label="Upcoming Sessions" value={summary?.upcoming_sessions ?? 0} icon="session" color="amber" />
      </div>

      {chartData.length > 1 && (
        <div className="grid gap-6 lg:grid-cols-2">
          <ChartCard title="Weight Trend" subtitle="kg over time">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={t.chartPrimary} stopOpacity={0.45} />
                    <stop offset="60%" stopColor={t.chartGradientFrom} stopOpacity={0.15} />
                    <stop offset="100%" stopColor={t.chartGradientFrom} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: tickFill }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: tickFill }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} cursor={tt.cursor} />
                <Area type="monotone" dataKey="weight" stroke={t.chartPrimary} strokeWidth={2.5} fill="url(#weightGrad)" dot={{ r: 4, fill: '#fff', stroke: t.chartPrimary, strokeWidth: 2 }} activeDot={{ r: 6, fill: t.chartPrimary, stroke: '#fff', strokeWidth: 2 }} name="Weight (kg)" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Heart Rate" subtitle="bpm per reading">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData}>
                <defs>
                  <linearGradient id="hrBarGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={t.chartBar} stopOpacity={1} />
                    <stop offset="100%" stopColor={t.chartBar} stopOpacity={0.4} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: tickFill }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: tickFill }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} cursor={tt.cursor} />
                <Bar dataKey="heartRate" activeBar={{ fill: 'url(#hrBarGrad)' }} fill="url(#hrBarGrad)" radius={[8, 8, 0, 0]} name="Heart Rate (bpm)" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Recent Health Metrics" icon={<HeartIcon className="h-5 w-5 text-orange-500" />}>
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

        <Section title="Active Goals" icon={<ChartIcon className="h-5 w-5 text-emerald-500" />}>
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
        <Section title="Upcoming Sessions" icon={<SessionIcon className="h-5 w-5 text-amber-500" />}>
          <DataTable
            columns={[
              { key: 'session_date', label: 'Date', filter: 'date', render: (r) => fmtDate(r.session_date) },
              { key: 'time', label: 'Time', render: (r) => `${r.start_time} – ${r.end_time}` },
              { key: 'trainer_name', label: 'Trainer', filter: 'enum' },
              { key: 'room_name', label: 'Room', filter: 'enum' },
              { key: 'actions', label: '', render: (r) => (
                <button type="button" onClick={() => setCancelSession(r)} className={`text-sm ${t.dangerText} hover:underline`}>
                  Cancel
                </button>
              ) },
            ]}
            data={upcoming_sessions}
            emptyMessage="No upcoming sessions."
          />
        </Section>

        <Section title="Upcoming Classes" icon={<ClassIcon className="h-5 w-5 text-violet-500" />}>
          <DataTable
            columns={[
              { key: 'class_name', label: 'Class', filter: 'enum' },
              { key: 'class_date', label: 'Date', filter: 'date', render: (r) => fmtDate(r.class_date) },
              { key: 'time', label: 'Time', render: (r) => `${r.start_time} – ${r.end_time}` },
              { key: 'room_name', label: 'Room', filter: 'enum' },
              { key: 'actions', label: '', render: (r) => (
                <button type="button" onClick={() => setDropClass(r)} className={`text-sm ${t.dangerText} hover:underline`}>
                  Drop
                </button>
              ) },
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
