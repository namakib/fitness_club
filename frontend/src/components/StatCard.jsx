import t from '../theme';
import { WeightIcon, GoalIcon, ClassIcon, SessionIcon, UsersIcon, WrenchIcon, BuildingIcon, ClockIcon, TrainerIcon } from './Icons';

const iconMap = {
  weight: <WeightIcon className="h-5 w-5" />,
  goal: <GoalIcon className="h-5 w-5" />,
  class: <ClassIcon className="h-5 w-5" />,
  session: <SessionIcon className="h-5 w-5" />,
  users: <UsersIcon className="h-5 w-5" />,
  wrench: <WrenchIcon className="h-5 w-5" />,
  building: <BuildingIcon className="h-5 w-5" />,
  clock: <ClockIcon className="h-5 w-5" />,
  trainer: <TrainerIcon className="h-5 w-5" />,
};

export default function StatCard({ label, value, icon, color = 'orange', sub }) {
  const iconEl = iconMap[icon];
  const colorCls = t.statIcon[color] || t.statIcon.orange;

  return (
    <div className={`rounded-xl border p-5 shadow-sm ${t.cardBorder} ${t.cardBg}`}>
      <div className="flex items-center justify-between">
        <p className={`text-xs font-semibold tracking-wider uppercase ${t.pageTextSubtle}`}>{label}</p>
        {iconEl && <div className={`rounded-lg p-2 ${colorCls}`}>{iconEl}</div>}
      </div>
      <p className={`mt-3 text-3xl font-bold ${t.pageText}`}>{value ?? '—'}</p>
      {sub && <p className={`mt-1 text-xs ${t.pageTextSubtle}`}>{sub}</p>}
    </div>
  );
}
