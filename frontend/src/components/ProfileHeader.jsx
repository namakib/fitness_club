import t from '../theme';

const roleLabels = {
  member: 'Member',
  trainer: 'Trainer',
  admin: 'Administrator',
};

export default function ProfileHeader({ name, email, role, meta = [] }) {
  const initials = (name || '')
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
      {/* Gradient banner: orange fading to white (light) / orange fading to black (dark) */}
      <div className="h-24 bg-gradient-to-b from-orange-500 to-white dark:from-orange-600 dark:to-gray-800" />

      <div className="flex flex-col items-center px-6 pb-6">
        {/* Avatar */}
        <div className="-mt-12 flex h-24 w-24 items-center justify-center rounded-full border-4 border-white dark:border-gray-800 bg-gradient-to-br from-orange-500 to-amber-400 dark:from-orange-600 dark:to-amber-500 text-3xl font-bold text-white shadow-lg select-none">
          {initials}
        </div>

        <h2 className="mt-3 text-lg font-bold text-gray-900 dark:text-gray-100 text-center truncate max-w-full">{name}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-full">{email}</p>

        <span className={`mt-3 inline-flex items-center rounded-full px-3 py-0.5 text-xs font-semibold capitalize ${t.roleBadge}`}>
          {roleLabels[role] || role}
        </span>

        {meta.length > 0 && (
          <div className="mt-5 w-full space-y-3 border-t border-gray-100 dark:border-gray-700 pt-5">
            {meta.map(({ icon, label, value }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                  {icon}
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">{label}</p>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{value || '—'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
