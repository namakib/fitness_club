import { useEffect, useState } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import api from '../../api';
import StatCard from '../../components/StatCard';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import t from '../../theme';

const PIE_COLORS = ['#16a34a', '#d97706', '#dc2626'];

export default function AdminDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => { api.get('/admin/dashboard').then(setData); }, []);

  if (!data) return <Skeleton />;

  const pieData = (data.equipment_status || []).map(s => ({
    name: s.status.replace(/_/g, ' '),
    value: s.count,
  }));

  const bookingData = (data.booking_trend || []).map(r => ({ month: r.month, count: r.count }));
  const maint = data.maintenance_summary || { open: 0, resolved: 0 };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Club-wide overview of members, trainers, equipment, and bookings.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Members" value={data.total_members} icon="users" color="orange" />
        <StatCard label="Total Trainers" value={data.total_trainers} icon="trainer" color="emerald" />
        <StatCard label="Equipment" value={data.total_equipment} icon="wrench" color="violet" />
        <StatCard label="Rooms" value={data.total_rooms} icon="building" color="amber" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {pieData.length > 0 && (
          <ChartCard title="Equipment Status" subtitle="Breakdown by condition">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value" nameKey="name" label={({ name, value }) => `${name} (${value})`}>
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 13 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {bookingData.length > 0 && (
          <ChartCard title="Bookings per Month" subtitle="Sessions + Classes, last 6 months">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={bookingData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 13 }} />
                <Bar dataKey="count" fill={t.chartPrimary} radius={[6, 6, 0, 0]} name="Bookings" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm">
          <p className="text-xs font-semibold tracking-wider text-gray-400 dark:text-gray-500 uppercase">Open Issues</p>
          <p className="mt-3 text-3xl font-bold text-amber-600 dark:text-amber-400">{maint.open}</p>
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">reported + in progress</p>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm">
          <p className="text-xs font-semibold tracking-wider text-gray-400 dark:text-gray-500 uppercase">Resolved</p>
          <p className="mt-3 text-3xl font-bold text-emerald-600 dark:text-emerald-400">{maint.resolved}</p>
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">maintenance completed</p>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-base font-semibold text-gray-800 dark:text-gray-200">Next Upcoming Bookings</h2>
        <DataTable
          columns={[
            { key: 'room_name', label: 'Room' },
            { key: 'booking_type', label: 'Type', render: r => (
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
                r.booking_type === 'Personal Session'
                  ? 'bg-violet-50 text-violet-700 ring-violet-600/20 dark:bg-violet-900/30 dark:text-violet-400 dark:ring-violet-500/30'
                  : 'bg-teal-50 text-teal-700 ring-teal-600/20 dark:bg-teal-900/30 dark:text-teal-400 dark:ring-teal-500/30'
              }`}>{r.booking_type}</span>
            )},
            { key: 'event_date', label: 'Date', render: r => fmtDate(r.event_date) },
            { key: 'time', label: 'Time', render: r => `${r.start_time} – ${r.end_time}` },
            { key: 'participant', label: 'Participant / Class' },
            { key: 'trainer_name', label: 'Trainer' },
            { key: 'status', label: 'Status', render: r => <StatusBadge status={r.status} /> },
          ]}
          data={data.upcoming_bookings}
          searchable={false}
          pageSize={5}
          emptyMessage="No upcoming bookings."
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
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function Skeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div><div className="h-8 w-56 rounded bg-gray-200 dark:bg-gray-700" /><div className="mt-2 h-4 w-80 rounded bg-gray-100 dark:bg-gray-700/50" /></div>
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
