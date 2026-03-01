import t from '../theme';

export default function StatusBadge({ status }) {
  const cls = t.statusBadge[status] ?? t.statusBadge.default;
  const display = (status || '').replace(/_/g, ' ');
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${cls}`}>
      {display}
    </span>
  );
}
