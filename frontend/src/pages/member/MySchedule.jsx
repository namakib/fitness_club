import { useEffect, useState, useCallback } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import DataTable from '../../components/DataTable';
import ConfirmDialog from '../../components/ConfirmDialog';
import ScheduleCalendar from '../../components/ScheduleCalendar';
import { SessionIcon, ClassIcon } from '../../components/Icons';
import t from '../../theme';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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

export default function MySchedule() {
  const [data, setData] = useState(null);
  const [cancelSession, setCancelSession] = useState(null);
  const [dropClass, setDropClass] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => api.get('/member/dashboard').then(setData), []);
  useEffect(() => { load(); }, [load]);

  if (!data) return <div className="animate-pulse space-y-6">{[...Array(3)].map((_, i) => <div key={i} className="h-40 rounded-xl bg-gray-200 dark:bg-gray-700" />)}</div>;

  const { upcoming_sessions, upcoming_classes } = data;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">My Schedule</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Your upcoming personal sessions and enrolled classes.</p>
      </div>

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
        message={dropClass ? `Do you want to drop from ${dropClass.class_name} on ${fmtDate(dropClass.class_date)}?` : ''}
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

      <ScheduleCalendar
        events={{ sessions: upcoming_sessions || [], classes: upcoming_classes || [] }}
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
    </div>
  );
}
