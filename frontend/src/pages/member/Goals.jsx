import { useEffect, useState, useCallback } from 'react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import api from '../../api';
import { toastError, toastSuccess } from '../../toastUtil';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import SelectDropdown from '../../components/SelectDropdown';
import DatePicker from '../../components/DatePicker';
import Modal from '../../components/Modal';
import RecordMetricForm from '../../components/RecordMetricForm';
import { TargetIcon, ChartIcon } from '../../components/Icons';
import { useTheme } from '../../context/ThemeContext';
import t from '../../theme';

const GOAL_TYPES = [
  { value: 'weight_loss', label: 'Weight Loss' },
  { value: 'muscle_gain', label: 'Muscle Gain' },
  { value: 'endurance', label: 'Endurance' },
  { value: 'flexibility', label: 'Flexibility' },
  { value: 'other', label: 'Other' },
];

const GOAL_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'achieved', label: 'Achieved' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function Goals() {
  const { isDark } = useTheme();
  const [profileData, setProfileData] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [metricModalOpen, setMetricModalOpen] = useState(false);
  const [form, setForm] = useState({ goal_type: 'weight_loss', target_value: '', start_date: '', end_date: '' });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const loadProfile = useCallback(() => api.get('/member/profile').then(setProfileData).catch(() => setProfileData({ member: null, goals: [] })), []);
  const loadMetrics = useCallback(() => api.get('/member/health-history').then(d => setMetrics(d.metrics)).catch(() => setMetrics([])), []);
  const loadAll = useCallback(() => { loadProfile(); loadMetrics(); }, [loadProfile, loadMetrics]);
  useEffect(() => { loadAll(); }, [loadAll]);

  async function submitGoal(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post('/member/goals', form);
      toastSuccess('Goal added.');
      setGoalModalOpen(false);
      setForm({ goal_type: 'weight_loss', target_value: '', start_date: '', end_date: '' });
      loadProfile();
    } catch (err) { toastError(err.message, err.details); }
    finally { setBusy(false); }
  }

  if (!profileData || metrics === null) return <Skeleton />;

  const goals = profileData.goals || [];

  const gridStroke = t.chartGridStroke[isDark ? 'dark' : 'light'];
  const tickFill = t.chartTickFill[isDark ? 'dark' : 'light'];
  const tt = t.chartTooltip[isDark ? 'dark' : 'light'];
  const tooltipStyle = { ...tt.content, borderRadius: 12, fontSize: 13 };
  const tooltipLabelStyle = tt.label;
  const tooltipItemStyle = tt.item;

  const chartData = [...(metrics || [])]
    .sort((a, b) => new Date(a.recorded_at) - new Date(b.recorded_at))
    .map(m => {
      const { systolic, diastolic } = parseBloodPressure(m.blood_pressure);
      return {
        date: shortDate(m.recorded_at),
        dateTime: m.recorded_at,
        weight: m.weight != null ? Number(m.weight) : null,
        bodyFat: m.body_fat_pct != null ? Number(m.body_fat_pct) : null,
        heartRate: m.heart_rate != null ? Number(m.heart_rate) : null,
        systolic: systolic ?? null,
        diastolic: diastolic ?? null,
      };
    })
    .filter(row => row.weight != null || row.bodyFat != null || row.heartRate != null || row.systolic != null || row.diastolic != null);

  const hasCharts = chartData.length >= 1;

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <TargetIcon className="h-6 w-6 text-emerald-500" />
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Health & Goals</h1>
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Track your metrics and fitness goals in one place.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setMetricModalOpen(true)} className={t.btnSmall}>+ Record Metric</button>
          <button onClick={() => setGoalModalOpen(true)} className={t.btnSmall}>+ Add Goal</button>
        </div>
      </div>

      {/* Record Metric modal */}
      <Modal open={metricModalOpen} onClose={() => setMetricModalOpen(false)} title="Record Health Metric">
        <RecordMetricForm
          onSaved={() => { setMetricModalOpen(false); loadMetrics(); }}
          onCancel={() => setMetricModalOpen(false)}
        />
      </Modal>

      {/* Add Goal modal */}
      <Modal open={goalModalOpen} onClose={() => setGoalModalOpen(false)} title="Add Fitness Goal">
        <form onSubmit={submitGoal} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <SelectDropdown
              label="Type"
              value={form.goal_type}
              options={GOAL_TYPES}
              onChange={(val) => setForm({ ...form, goal_type: val })}
              placeholder="Select type"
              searchable={false}
            />
            <Field label="Target" value={form.target_value} onChange={set('target_value')} required />
            <DatePicker
              label="Start Date"
              value={form.start_date}
              onChange={(val) => setForm({ ...form, start_date: val })}
              placeholder="Select start date"
              required
            />
            <DatePicker
              label="End Date"
              value={form.end_date}
              onChange={(val) => setForm({ ...form, end_date: val })}
              placeholder="Select end date"
              min={form.start_date || undefined}
            />
          </div>
          <button type="submit" disabled={busy} className={t.btn}>{busy ? 'Adding...' : 'Add Goal'}</button>
        </form>
      </Modal>

      {/* Health Metric Charts */}
      {hasCharts && (
        <div className="grid gap-6 lg:grid-cols-2">
          {chartData.some(r => r.weight != null) && (
            <ChartCard title="Weight" subtitle="kg over time">
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="hhWeightGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={t.chartColors.weight} stopOpacity={0.45} />
                      <stop offset="100%" stopColor={t.chartGradientFrom} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: tickFill }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: tickFill }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                  <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} cursor={tt.cursor} />
                  <Area type="monotone" dataKey="weight" stroke={t.chartColors.weight} strokeWidth={2.5} fill="url(#hhWeightGrad)" dot={{ r: 4, fill: '#fff', stroke: t.chartColors.weight, strokeWidth: 2 }} activeDot={{ r: 6, fill: t.chartColors.weight, stroke: '#fff', strokeWidth: 2 }} name="Weight (kg)" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {chartData.some(r => r.bodyFat != null) && (
            <ChartCard title="Body Fat %" subtitle="over time">
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="hhBodyFatGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={t.chartColors.bodyFat} stopOpacity={0.45} />
                      <stop offset="100%" stopColor={t.chartColors.bodyFatGradientTo} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: tickFill }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: tickFill }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                  <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} cursor={tt.cursor} />
                  <Area type="monotone" dataKey="bodyFat" stroke={t.chartColors.bodyFat} strokeWidth={2.5} fill="url(#hhBodyFatGrad)" dot={{ r: 4, fill: '#fff', stroke: t.chartColors.bodyFat, strokeWidth: 2 }} activeDot={{ r: 6, fill: t.chartColors.bodyFat, stroke: '#fff', strokeWidth: 2 }} name="Body Fat %" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {chartData.some(r => r.heartRate != null) && (
            <ChartCard title="Heart Rate" subtitle="bpm per reading">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData}>
                  <defs>
                    <linearGradient id="hhHrBarGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={t.chartColors.heartRate} stopOpacity={1} />
                      <stop offset="100%" stopColor={t.chartColors.heartRate} stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: tickFill }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: tickFill }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                  <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} cursor={tt.cursor} />
                  <Bar dataKey="heartRate" fill="url(#hhHrBarGrad)" radius={[8, 8, 0, 0]} name="Heart Rate (bpm)" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {chartData.some(r => r.systolic != null || r.diastolic != null) && (
            <ChartCard title="Blood Pressure" subtitle="systolic & diastolic (mmHg)">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="hhBpSystolicGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={t.chartColors.bpSystolic} stopOpacity={1} />
                      <stop offset="100%" stopColor={t.chartColors.bpSystolic} stopOpacity={0.4} />
                    </linearGradient>
                    <linearGradient id="hhBpDiastolicGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={t.chartColors.bpDiastolic} stopOpacity={1} />
                      <stop offset="100%" stopColor={t.chartColors.bpDiastolic} stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: tickFill }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: tickFill }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                  <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} cursor={tt.cursor} />
                  <Bar dataKey="systolic" fill="url(#hhBpSystolicGrad)" radius={[4, 4, 0, 0]} name="Systolic (mmHg)" />
                  <Bar dataKey="diastolic" fill="url(#hhBpDiastolicGrad)" radius={[4, 4, 0, 0]} name="Diastolic (mmHg)" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}
        </div>
      )}

      {/* Fitness Goals table */}
      <Section title="Fitness Goals" icon={<TargetIcon className="h-5 w-5 text-emerald-500" />}>
        <DataTable
          columns={[
            { key: 'goal_type', label: 'Type', filter: 'enum' },
            { key: 'target_value', label: 'Target' },
            { key: 'start_date', label: 'Start', render: (r) => fmtDate(r.start_date) },
            { key: 'end_date', label: 'End', render: (r) => fmtDate(r.end_date) },
            { key: 'status', label: 'Status', filter: 'enum', render: (r) => <StatusBadge status={r.status} /> },
            { key: 'action', label: '', render: (r) => r.status === 'active' && <GoalStatusSelect goal={r} onSaved={loadProfile} /> },
          ]}
          data={goals}
          emptyMessage="No goals yet. Add one to start tracking."
        />
      </Section>

      {/* All Health Records table */}
      <Section title="All Health Records" icon={<ChartIcon className="h-5 w-5 text-blue-500" />}>
        <DataTable
          columns={[
            { key: 'recorded_at', label: 'Date & Time', filter: 'date', filterLabel: 'Date', render: (r) => fmtDateTime(r.recorded_at) },
            { key: 'weight', label: 'Weight (kg)' },
            { key: 'body_fat_pct', label: 'Body Fat %' },
            { key: 'blood_pressure', label: 'Blood Pressure' },
            { key: 'heart_rate', label: 'Heart Rate (bpm)' },
          ]}
          data={metrics}
          emptyMessage="No health metrics recorded yet. Click + Record Metric to add one."
        />
      </Section>
    </div>
  );
}

function GoalStatusSelect({ goal, onSaved }) {
  async function handleChange(val) {
    try { await api.put(`/member/goals/${goal.goal_id}`, { status: val }); toastSuccess('Goal updated.'); onSaved(); }
    catch (err) { toastError(err.message, err.details); }
  }
  return (
    <SelectDropdown
      value={goal.status}
      onChange={handleChange}
      options={GOAL_STATUS_OPTIONS}
      placeholder="Status"
      searchable={false}
      floating
    />
  );
}

function Section({ title, icon, children }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2 text-gray-800 dark:text-gray-200">
        {icon}
        <h2 className="text-base font-semibold">{title}</h2>
      </div>
      {children}
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

function Field({ label, ...props }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      <input className={t.input} {...props} />
    </div>
  );
}

function shortDate(d) {
  if (!d) return '';
  const str = String(d);
  const dt = /^\d{4}-\d{2}-\d{2}$/.test(str) ? new Date(str + 'T12:00:00') : new Date(str);
  return isNaN(dt) ? '' : dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function parseBloodPressure(bp) {
  if (bp == null || typeof bp !== 'string') return { systolic: undefined, diastolic: undefined };
  const parts = bp.trim().split(/\s*\/\s*/);
  if (parts.length < 2) return { systolic: undefined, diastolic: undefined };
  const s = parseInt(parts[0], 10);
  const d = parseInt(parts[1], 10);
  return { systolic: Number.isNaN(s) ? undefined : s, diastolic: Number.isNaN(d) ? undefined : d };
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtDateTime(d) {
  if (!d) return '—';
  const str = String(d);
  const dt = /^\d{4}-\d{2}-\d{2}$/.test(str) ? new Date(str + 'T12:00:00') : new Date(str);
  if (isNaN(dt)) return '—';
  const datePart = dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const timePart = dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return <><div>{datePart}</div><div className="text-xs text-gray-400">{timePart}</div></>;
}

function Skeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="flex justify-between"><div className="h-8 w-48 rounded bg-gray-200 dark:bg-gray-700" /><div className="h-8 w-24 rounded bg-gray-200 dark:bg-gray-700" /></div>
      <div className="grid gap-6 lg:grid-cols-2">{[...Array(4)].map((_, i) => <div key={i} className="h-64 rounded-xl bg-gray-200 dark:bg-gray-700" />)}</div>
      <div className="h-64 rounded-xl bg-gray-200 dark:bg-gray-700" />
    </div>
  );
}
