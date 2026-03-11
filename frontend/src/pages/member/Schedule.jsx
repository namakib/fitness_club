import { useEffect, useState, useCallback } from 'react';
import api from '../../api';
import { toastError, toastSuccess } from '../../toastUtil';
import DataTable from '../../components/DataTable';
import ConfirmDialog from '../../components/ConfirmDialog';
import ScheduleCalendar from '../../components/ScheduleCalendar';
import Modal from '../../components/Modal';
import { SessionIcon, ClassIcon } from '../../components/Icons';
import { BookSessionForm } from './BookSession';
import { ClassesBrowser } from './Classes';
import t from '../../theme';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function Skeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="flex justify-between items-center">
        <div>
          <div className={`h-8 w-40 rounded ${t.skeletonBg}`} />
          <div className="mt-2 h-4 w-72 rounded bg-gray-100 dark:bg-gray-700/50" />
        </div>
        <div className={`h-10 w-32 rounded-lg ${t.skeletonBg}`} />
      </div>
      <div className={`h-96 rounded-xl ${t.skeletonBg}`} />
      <div className="grid gap-6">
        <div className={`h-48 rounded-xl ${t.skeletonBg}`} />
        <div className={`h-48 rounded-xl ${t.skeletonBg}`} />
      </div>
      <div className={`h-64 rounded-xl ${t.skeletonBg}`} />
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

export default function Schedule() {
  const [data, setData] = useState(null);
  const [cancelSession, setCancelSession] = useState(null);
  const [dropClass, setDropClass] = useState(null);
  const [busy, setBusy] = useState(false);
  const [showBookModal, setShowBookModal] = useState(false);
  const [jumpToDate, setJumpToDate] = useState(null);
  const [browseRefresh, setBrowseRefresh] = useState(0);

  const load = useCallback(() => api.get('/member/dashboard').then(setData).catch(() => setData({ summary: null, active_goals: [], recent_metrics: [], all_metrics: [], upcoming_sessions: [], upcoming_classes: [] })), []);
  useEffect(() => { load(); }, [load]);

  function handleBookSuccess() {
    setShowBookModal(false);
    load();
  }

  if (!data) return <Skeleton />;

  const { upcoming_sessions, upcoming_classes } = data;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Schedule</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Your upcoming sessions, enrolled classes, and available classes to join.</p>
        </div>
        <button type="button" onClick={() => setShowBookModal(true)} className={t.btn}>
          + Book Session
        </button>
      </div>

      <Modal open={showBookModal} onClose={() => setShowBookModal(false)} title="Book Personal Session" size="2xl">
        <BookSessionForm onSuccess={handleBookSuccess} />
      </Modal>

      <ConfirmDialog
        open={!!cancelSession}
        onClose={() => setCancelSession(null)}
        title="Cancel Session"
        message={cancelSession ? `Do you want to cancel your session on ${fmtDate(cancelSession.session_date)} at ${cancelSession.start_time}?` : ''}
        confirmLabel="Cancel Session"
        variant="danger"
        loading={busy}
        onConfirm={async () => {
          setBusy(true);
          try {
            await api.put(`/member/sessions/${cancelSession.session_id}`, { status: 'cancelled' });
            toastSuccess('Session cancelled.');
            load();
          } catch (err) {
            toastError(err.message, err.details);
          } finally {
            setBusy(false);
          }
        }}
      />

      <ConfirmDialog
        open={!!dropClass}
        onClose={() => setDropClass(null)}
        title="Drop Class"
        message={dropClass ? `Do you want to drop from ${dropClass.class_name} on ${fmtDate(dropClass.class_date)}?` : ''}
        confirmLabel="Drop"
        variant="danger"
        loading={busy}
        onConfirm={async () => {
          setBusy(true);
          try {
            await api.delete(`/member/classes/${dropClass.class_id}/enroll`);
            toastSuccess('Dropped from class.');
            await load();
            setBrowseRefresh(n => n + 1);
          } catch (err) {
            toastError(err.message, err.details);
          } finally {
            setBusy(false);
          }
        }}
      />

      <ScheduleCalendar
        events={{ sessions: upcoming_sessions || [], classes: upcoming_classes || [] }}
        jumpToDate={jumpToDate}
        onEventClick={(ev) => {
          if (ev.event_type === 'session') setCancelSession(ev);
          else setDropClass(ev);
        }}
        legend={[
          <span key="s" className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-orange-500" />Personal session</span>,
          <span key="c" className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-violet-500" />Group class</span>,
          'Click an event to cancel or drop.',
        ]}
      />

      <div className="grid gap-6">
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
            data={upcoming_sessions || []}
            emptyMessage="No upcoming sessions."
          />
        </Section>

        <Section title="Upcoming Classes" icon={<ClassIcon className="h-5 w-5 text-violet-500" />}>
          <DataTable
            columns={[
              { key: 'class_name', label: 'Class', filter: 'enum' },
              { key: 'class_date', label: 'Date', filter: 'date', render: (r) => fmtDate(r.class_date) },
              { key: 'time', label: 'Time', render: (r) => `${r.start_time} – ${r.end_time}` },
              { key: 'spots', label: 'Spots', render: (r) => `${r.enrolled_count ?? 0} / ${r.max_participants}` },
              { key: 'room_name', label: 'Room', filter: 'enum' },
              { key: 'actions', label: '', render: (r) => (
                <button type="button" onClick={() => setDropClass(r)} className={`text-sm ${t.dangerText} hover:underline`}>
                  Drop
                </button>
              ) },
            ]}
            data={upcoming_classes || []}
            emptyMessage="No upcoming classes."
          />
        </Section>
      </div>

      <div className={`rounded-xl border ${t.cardBorder} ${t.cardBg} p-6 shadow-sm`}>
        <Section title="Browse Classes" icon={<ClassIcon className="h-5 w-5 text-emerald-500" />}>
          <ClassesBrowser refreshTrigger={browseRefresh} onSuccess={(enrolledClass) => {
            if (enrolledClass?.class_date) setJumpToDate(enrolledClass.class_date);
            return load();
          }} />
        </Section>
      </div>
    </div>
  );
}
