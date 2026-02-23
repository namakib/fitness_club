const palette = {
  active: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  achieved: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  cancelled: 'bg-gray-100 text-gray-600 ring-gray-500/20',
  scheduled: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  completed: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  operational: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  under_repair: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  out_of_service: 'bg-red-50 text-red-700 ring-red-600/20',
  reported: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  in_progress: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  resolved: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
};

export default function StatusBadge({ status }) {
  const cls = palette[status] || 'bg-gray-100 text-gray-600 ring-gray-500/20';
  const display = (status || '').replace(/_/g, ' ');
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${cls}`}>
      {display}
    </span>
  );
}
