import { useEffect, useState, useCallback } from 'react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import api from '../../api';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import RecordMetricForm from '../../components/RecordMetricForm';
import { useTheme } from '../../context/ThemeContext';
import t from '../../theme';

export default function HealthHistory() {
  const { isDark } = useTheme();
  const [metrics, setMetrics] = useState(null);
  const [metricModalOpen, setMetricModalOpen] = useState(false);

  const load = useCallback(() => api.get('/member/health-history').then(d => setMetrics(d.metrics)), []);
  useEffect(() => { load(); }, [load]);

  if (metrics === null) return <div className="animate-pulse h-64 rounded-xl bg-gray-200 dark:bg-gray-700" />;

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
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Health History</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Track your metrics over time.</p>
        </div>
        <button onClick={() => setMetricModalOpen(true)} className={t.btnSmall}>
          + Record Metric
        </button>
      </div>

      <Modal open={metricModalOpen} onClose={() => setMetricModalOpen(false)} title="Record Health Metric">
        <RecordMetricForm
          onSaved={() => { setMetricModalOpen(false); load(); }}
          onCancel={() => setMetricModalOpen(false)}
        />
      </Modal>

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

      <div>
        <h2 className="mb-3 text-base font-semibold text-gray-800 dark:text-gray-200">All records</h2>
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

function shortDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function parseBloodPressure(bp) {
  if (bp == null || typeof bp !== 'string') return { systolic: undefined, diastolic: undefined };
  const parts = bp.trim().split(/\s*\/\s*/);
  if (parts.length < 2) return { systolic: undefined, diastolic: undefined };
  const s = parseInt(parts[0], 10);
  const d = parseInt(parts[1], 10);
  return { systolic: Number.isNaN(s) ? undefined : s, diastolic: Number.isNaN(d) ? undefined : d };
}

function fmtDateTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}
