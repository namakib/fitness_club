import { useEffect, useState, useCallback } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import DataTable from '../../components/DataTable';
import t from '../../theme';

export default function Classes() {
  const [classes, setClasses] = useState(null);
  const [enrolling, setEnrolling] = useState(null);

  const load = useCallback(() => api.get('/member/available-classes').then(d => setClasses(d.classes || [])), []);
  useEffect(() => { load(); }, [load]);

  async function handleEnroll(classId) {
    setEnrolling(classId);
    try {
      await api.post(`/member/classes/${classId}/enroll`);
      toast.success('Enrolled in class.');
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setEnrolling(null);
    }
  }

  if (classes === null) return <div className="animate-pulse space-y-6">{[...Array(3)].map((_, i) => <div key={i} className="h-40 rounded-xl bg-gray-200 dark:bg-gray-700" />)}</div>;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Browse Classes</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Available upcoming classes you can enroll in. Classes shown have open spots.
      </p>
      <DataTable
        columns={[
          { key: 'class_name', label: 'Class', filter: 'enum' },
          { key: 'class_date', label: 'Date', filter: 'date', render: (r) => fmtDate(r.class_date) },
          { key: 'time', label: 'Time', render: (r) => `${r.start_time} – ${r.end_time}` },
          { key: 'trainer_name', label: 'Trainer', filter: 'enum' },
          { key: 'room_name', label: 'Room', filter: 'enum' },
          { key: 'spots', label: 'Spots', render: (r) => `${r.enrolled_count || 0} / ${r.max_participants}` },
          {
            key: 'actions',
            label: '',
            render: (r) => (
              <button
                type="button"
                onClick={() => handleEnroll(r.class_id)}
                disabled={enrolling === r.class_id}
                className={t.btnSmall}
              >
                {enrolling === r.class_id ? 'Enrolling...' : 'Enroll'}
              </button>
            ),
          },
        ]}
        data={classes}
        emptyMessage="No available classes. Check back later."
      />
    </div>
  );
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
