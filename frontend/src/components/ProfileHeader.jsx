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
    <div className={`rounded-2xl border shadow-sm overflow-hidden ${t.cardBorder} ${t.cardBg}`}>
      <div className={`h-24 ${t.profileBanner}`} />

      <div className="flex flex-col items-center px-6 pb-6">
        <div className={`-mt-12 flex h-24 w-24 items-center justify-center rounded-full border-4 ${t.profileAvatarRing} ${t.profileAvatarGradient} text-3xl font-bold shadow-lg select-none`}>
          {initials}
        </div>

        <h2 className={`mt-3 text-lg font-bold text-center truncate max-w-full ${t.pageText}`}>{name}</h2>
        <p className={`text-sm truncate max-w-full ${t.pageTextMuted}`}>{email}</p>

        <span className={`mt-3 inline-flex items-center rounded-full px-3 py-0.5 text-xs font-semibold capitalize ${t.roleBadge}`}>
          {roleLabels[role] || role}
        </span>

        {meta.length > 0 && (
          <div className={`mt-5 w-full space-y-3 border-t pt-5 ${t.cardBorderMuted}`}>
            {meta.map(({ icon, label, value }) => (
              <div key={label} className="flex items-center gap-3">
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${t.profileMetaIconBg} ${t.iconMuted}`}>
                  {icon}
                </span>
                <div className="min-w-0">
                  <p className={`text-[11px] font-medium uppercase tracking-wider ${t.pageTextSubtle}`}>{label}</p>
                  <p className={`text-sm font-medium truncate ${t.pageTextSecondary}`}>{value || '—'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
