import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { toastError, toastSuccess } from '../../toastUtil';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import t from '../../theme';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function ClassesBrowser({ onSuccess, refreshTrigger }) {
  const [classes, setClasses] = useState(null);
  const [enrolling, setEnrolling] = useState(null);
  const [confirmEnroll, setConfirmEnroll] = useState(null);

  const load = useCallback(() => api.get('/member/available-classes').then(d => setClasses(d.classes || [])).catch(() => setClasses([])), []);
  useEffect(() => { load(); }, [load, refreshTrigger]);

  async function handleEnroll(classObj) {
    const classId = classObj?.class_id;
    setEnrolling(classId);
    try {
      await api.post(`/member/classes/${classId}/enroll`);
      toastSuccess('Enrolled in class.');
      await load();
      await onSuccess?.(classObj);
    } catch (err) {
      toastError(err.message, err.details);
    } finally {
      setEnrolling(null);
    }
  }

  if (classes === null) return <div className="animate-pulse space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-16 rounded-lg bg-gray-200 dark:bg-gray-700" />)}</div>;

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Available upcoming classes you can enroll in. Classes shown have open spots.
      </p>
      <Modal open={!!confirmEnroll} onClose={() => setConfirmEnroll(null)} title="Enroll in Class">
        {confirmEnroll && (
          <div className="space-y-5">
            <p className={`text-sm ${t.pageTextMuted}`}>Do you want to enroll in this class?</p>
            <div className={`rounded-lg border ${t.cardBorder} ${t.pageBg} p-4 space-y-3`}>
              <div className="flex items-center gap-2">
                <span className="inline-flex rounded-full bg-violet-100 dark:bg-violet-900/50 px-2.5 py-0.5 text-xs font-medium text-violet-800 dark:text-violet-300">
                  Group Class
                </span>
              </div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <dt className="font-medium text-gray-500 dark:text-gray-400">Class</dt>
                <dd className="text-gray-800 dark:text-gray-100">{confirmEnroll.class_name}</dd>
                <dt className="font-medium text-gray-500 dark:text-gray-400">Date</dt>
                <dd className="text-gray-800 dark:text-gray-100">{fmtDate(confirmEnroll.class_date)}</dd>
                <dt className="font-medium text-gray-500 dark:text-gray-400">Time</dt>
                <dd className="text-gray-800 dark:text-gray-100">{confirmEnroll.start_time} – {confirmEnroll.end_time}</dd>
                <dt className="font-medium text-gray-500 dark:text-gray-400">Trainer</dt>
                <dd className="text-gray-800 dark:text-gray-100">{confirmEnroll.trainer_name}</dd>
                <dt className="font-medium text-gray-500 dark:text-gray-400">Room</dt>
                <dd className="text-gray-800 dark:text-gray-100">{confirmEnroll.room_name}</dd>
                <dt className="font-medium text-gray-500 dark:text-gray-400">Spots</dt>
                <dd className="text-gray-800 dark:text-gray-100">{confirmEnroll.enrolled_count || 0} / {confirmEnroll.max_participants}</dd>
              </dl>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setConfirmEnroll(null)} disabled={!!enrolling} className={t.cancelButton}>
                Cancel
              </button>
              <button
                type="button"
                disabled={!!enrolling}
                className={t.btn}
                onClick={async () => {
                  await handleEnroll(confirmEnroll);
                  setConfirmEnroll(null);
                }}
              >
                {enrolling ? 'Enrolling...' : 'Enroll'}
              </button>
            </div>
          </div>
        )}
      </Modal>
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
                onClick={() => setConfirmEnroll(r)}
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

export default function Classes() {
  const navigate = useNavigate();
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Browse Classes</h1>
      <ClassesBrowser onSuccess={() => navigate('/member/schedule')} />
    </div>
  );
}
