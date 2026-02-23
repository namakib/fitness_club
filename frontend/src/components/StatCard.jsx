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
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold tracking-wider text-gray-400 dark:text-gray-500 uppercase">{label}</p>
        {iconEl && <div className={`rounded-lg p-2 ${colorCls}`}>{iconEl}</div>}
      </div>
      <p className="mt-3 text-3xl font-bold text-gray-900 dark:text-gray-100">{value ?? '—'}</p>
      {sub && <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{sub}</p>}
    </div>
  );
}
