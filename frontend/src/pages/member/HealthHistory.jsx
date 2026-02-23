import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';
import DataTable from '../../components/DataTable';

export default function HealthHistory() {
  const [metrics, setMetrics] = useState(null);

  useEffect(() => { api.get('/member/health-history').then(d => setMetrics(d.metrics)); }, []);

  if (metrics === null) return <div className="animate-pulse h-64 rounded-xl bg-gray-200" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Health History</h1>
        <Link to="/member/profile" className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 transition">
          + Record Metric
        </Link>
      </div>

      <DataTable
        columns={[
          { key: 'recorded_at', label: 'Date & Time', render: (r) => fmtDateTime(r.recorded_at) },
          { key: 'weight', label: 'Weight (kg)' },
          { key: 'body_fat_pct', label: 'Body Fat %' },
          { key: 'blood_pressure', label: 'Blood Pressure' },
          { key: 'heart_rate', label: 'Heart Rate (bpm)' },
        ]}
        data={metrics}
        emptyMessage="No health metrics recorded yet. Go to your profile to add one."
      />
    </div>
  );
}

function fmtDateTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}
