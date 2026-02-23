import { useEffect, useState } from 'react';
import api from '../../api';
import DataTable from '../../components/DataTable';

export default function Schedule() {
  const [data, setData] = useState(null);

  useEffect(() => { api.get('/trainer/schedule').then(setData); }, []);

  if (!data) return <div className="animate-pulse space-y-6">{[...Array(3)].map((_, i) => <div key={i} className="h-40 rounded-xl bg-gray-200" />)}</div>;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Schedule</h1>

      <Section title="Upcoming Personal Sessions">
        <DataTable
          columns={[
            { key: 'session_date', label: 'Date', render: (r) => fmtDate(r.session_date) },
            { key: 'time', label: 'Time', render: (r) => `${r.start_time} – ${r.end_time}` },
            { key: 'member_name', label: 'Member' },
            { key: 'room_name', label: 'Room' },
          ]}
          data={data.sessions}
          emptyMessage="No upcoming personal sessions."
        />
      </Section>

      <Section title="Upcoming Group Classes">
        <DataTable
          columns={[
            { key: 'class_name', label: 'Class' },
            { key: 'class_date', label: 'Date', render: (r) => fmtDate(r.class_date) },
            { key: 'time', label: 'Time', render: (r) => `${r.start_time} – ${r.end_time}` },
            { key: 'room_name', label: 'Room' },
            { key: 'enrolled', label: 'Enrolled', render: (r) => `${r.enrolled_count} / ${r.max_participants}` },
          ]}
          data={data.classes}
          emptyMessage="No upcoming group classes."
        />
      </Section>

      <Section title="Member Health Data">
        <DataTable
          columns={[
            { key: 'name', label: 'Member' },
            { key: 'email', label: 'Email' },
            { key: 'weight', label: 'Weight (kg)' },
            { key: 'body_fat_pct', label: 'Body Fat %' },
            { key: 'blood_pressure', label: 'BP' },
            { key: 'heart_rate', label: 'HR' },
            { key: 'recorded_at', label: 'Recorded', render: (r) => fmtDate(r.recorded_at) },
          ]}
          data={data.member_health}
          emptyMessage="No member health data available."
        />
      </Section>
    </div>
  );
}

function Section({ title, children }) {
  return <div><h2 className="mb-3 text-lg font-semibold text-gray-800">{title}</h2>{children}</div>;
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
