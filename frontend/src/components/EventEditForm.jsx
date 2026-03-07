import { useState, useEffect } from 'react';
import api from '../api';
import { toastError, toastSuccess } from '../toastUtil';
import DatePicker from './DatePicker';
import TimePicker from './TimePicker';
import SelectDropdown from './SelectDropdown';
import NumberInput from './NumberInput';
import ConfirmDialog from './ConfirmDialog';
import t from '../theme';

/**
 * Trainer-specific form for editing or deleting a session/class from the calendar.
 * Designed to be passed as `renderEventModal` to ScheduleCalendar.
 */
export default function EventEditForm({ event, onClose, onSaved, rooms, onRoomsLoad }) {
  const [form, setForm] = useState(() => {
    const eventDate = typeof event.event_date === 'string'
      ? event.event_date
      : (event.date?.toISOString?.()?.slice(0, 10) ?? '');
    return {
      event_date: eventDate,
      start_time: event.start_time || '',
      end_time: event.end_time || '',
      room_id: event.room_id ?? '',
      class_name: event.event_type === 'class' ? event.title : '',
      max_participants: event.max_participants ?? '',
    };
  });
  const [busy, setBusy] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmDeleteBusy, setConfirmDeleteBusy] = useState(false);

  useEffect(() => { onRoomsLoad(); }, [onRoomsLoad]);

  const roomOptions = rooms.map((r) => ({ value: r.room_id, label: r.room_name }));
  const label = event.event_type === 'session' ? 'session' : 'class';

  async function handleConfirmDelete() {
    setConfirmDeleteBusy(true);
    try {
      if (event.event_type === 'session') {
        await api.delete(`/trainer/sessions/${event.session_id}`);
        toastSuccess('Session deleted.');
      } else {
        await api.delete(`/trainer/classes/${event.class_id}`);
        toastSuccess('Class deleted.');
      }
      onSaved();
    } catch (err) {
      toastError(err.message, err.details);
    } finally {
      setConfirmDeleteBusy(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      if (event.event_type === 'session') {
        await api.put(`/trainer/sessions/${event.session_id}`, {
          session_date: form.event_date,
          start_time: form.start_time,
          end_time: form.end_time,
          room_id: form.room_id || undefined,
        });
        toastSuccess('Session updated.');
      } else {
        await api.put(`/trainer/classes/${event.class_id}`, {
          class_date: form.event_date,
          start_time: form.start_time,
          end_time: form.end_time,
          room_id: form.room_id || undefined,
          class_name: form.class_name || undefined,
          max_participants: form.max_participants ? Number(form.max_participants) : undefined,
        });
        toastSuccess('Class updated.');
      }
      onSaved();
    } catch (err) {
      toastError(err.message, err.details);
    } finally {
      setBusy(false);
    }
  }

  const eventDate = typeof event.event_date === 'string'
    ? event.event_date
    : (event.event_date?.toISOString?.()?.slice(0, 10));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${event.event_type === 'session' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300' : 'bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-300'}`}>
          {event.event_type === 'session' ? 'Personal Session' : 'Group Class'}
        </span>
      </div>
      {event.event_type === 'session' && (
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Member</label>
          <p className="text-gray-800 dark:text-gray-100">{event.title}</p>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <DatePicker
          label="Date"
          value={form.event_date || eventDate}
          onChange={(val) => setForm({ ...form, event_date: val })}
          placeholder="Select date"
          required
        />
        <div className="flex flex-col gap-4 sm:col-span-2">
          <TimePicker
            label="Start"
            value={form.start_time}
            onChange={(val) => setForm({ ...form, start_time: val })}
            placeholder="Start"
            required
          />
          <TimePicker
            label="End"
            value={form.end_time}
            onChange={(val) => setForm({ ...form, end_time: val })}
            placeholder="End"
            required
          />
        </div>
      </div>
      <SelectDropdown
        label="Room"
        value={form.room_id}
        options={roomOptions}
        onChange={(val) => setForm({ ...form, room_id: val })}
        placeholder="Select room"
        searchable={false}
      />
      {event.event_type === 'class' && (
        <>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Class Name</label>
            <input
              type="text"
              value={form.class_name}
              onChange={(e) => setForm({ ...form, class_name: e.target.value })}
              className={t.input}
              placeholder="Class name"
            />
          </div>
          <NumberInput
            label="Max Participants"
            value={form.max_participants}
            onChange={(e) => setForm({ ...form, max_participants: e.target.value })}
            min={1}
          />
        </>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
        <div className="flex gap-2">
          <button type="submit" disabled={busy} className={t.btn}>
            {busy ? 'Saving...' : 'Save Changes'}
          </button>
          <button type="button" onClick={onClose} className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
            Cancel
          </button>
        </div>
        <button
          type="button"
          onClick={() => setConfirmDeleteOpen(true)}
          disabled={busy}
          className="rounded-lg px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition disabled:opacity-50"
        >
          Delete
        </button>
      </div>

      <ConfirmDialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        title={`Delete ${label.charAt(0).toUpperCase() + label.slice(1)}?`}
        message={`Are you sure you want to delete this ${label}? This cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        loading={confirmDeleteBusy}
        onConfirm={handleConfirmDelete}
      />
    </form>
  );
}
