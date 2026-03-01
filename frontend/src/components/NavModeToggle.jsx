import { useNavMode } from '../context/NavModeContext';
import t from '../theme';

function SidebarIcon({ active }) {
  const stroke = active ? 'stroke-orange-600 dark:stroke-orange-400' : 'stroke-gray-400 dark:stroke-gray-500';
  const fill = active ? 'fill-orange-100 dark:fill-orange-900/40' : 'fill-gray-100 dark:fill-gray-700';
  return (
    <svg viewBox="0 0 64 44" className="h-12 w-auto" aria-hidden="true">
      <rect x="1" y="1" width="62" height="42" rx="4" className={`${fill} ${stroke}`} strokeWidth="1.5" />
      <rect x="1" y="1" width="18" height="42" rx="4" className={`${active ? 'fill-orange-200 dark:fill-orange-800/40' : 'fill-gray-200 dark:fill-gray-600'} ${stroke}`} strokeWidth="1.5" />
      <line x1="6" y1="10" x2="14" y2="10" className={stroke} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="6" y1="16" x2="14" y2="16" className={stroke} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="6" y1="22" x2="14" y2="22" className={stroke} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="6" y1="28" x2="14" y2="28" className={stroke} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function DropdownIcon({ active }) {
  const stroke = active ? 'stroke-orange-600 dark:stroke-orange-400' : 'stroke-gray-400 dark:stroke-gray-500';
  const fill = active ? 'fill-orange-100 dark:fill-orange-900/40' : 'fill-gray-100 dark:fill-gray-700';
  return (
    <svg viewBox="0 0 64 44" className="h-12 w-auto" aria-hidden="true">
      <rect x="1" y="1" width="62" height="42" rx="4" className={`${fill} ${stroke}`} strokeWidth="1.5" />
      <rect x="1" y="1" width="62" height="10" rx="4" className={`${active ? 'fill-orange-200 dark:fill-orange-800/40' : 'fill-gray-200 dark:fill-gray-600'} ${stroke}`} strokeWidth="1.5" />
      <circle cx="56" cy="6" r="3" className={`${active ? 'fill-orange-400 dark:fill-orange-500' : 'fill-gray-400 dark:fill-gray-500'}`} />
      <rect x="42" y="13" width="20" height="22" rx="3" className={`${active ? 'fill-orange-200 dark:fill-orange-800/40' : 'fill-gray-200 dark:fill-gray-600'} ${stroke}`} strokeWidth="1" />
      <line x1="46" y1="19" x2="58" y2="19" className={stroke} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="46" y1="24" x2="58" y2="24" className={stroke} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="46" y1="29" x2="58" y2="29" className={stroke} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

const icons = { sidebar: SidebarIcon, dropdown: DropdownIcon };

const options = [
  { value: 'sidebar', label: 'Sidebar', desc: 'Hamburger menu that slides in from the left' },
  { value: 'dropdown', label: 'Dropdown', desc: 'All pages listed under the avatar menu' },
];

export default function NavModeToggle() {
  const { navMode, setNavMode } = useNavMode();

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2 text-gray-800 dark:text-gray-200">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
        </svg>
        <h3 className="text-base font-semibold">Navigation Style</h3>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {options.map(({ value, label, desc }) => {
          const active = navMode === value;
          const IconComp = icons[value];
          return (
            <button
              key={value}
              type="button"
              onClick={() => setNavMode(value)}
              className={`flex flex-col items-center rounded-lg border-2 p-4 text-center transition-all ${
                active
                  ? 'border-orange-500 bg-orange-50 dark:border-orange-400 dark:bg-orange-900/20'
                  : `${t.cardBorder} ${t.interactiveHover}`
              }`}
            >
              <IconComp active={active} />
              <span className={`mt-3 text-sm font-semibold ${active ? 'text-orange-700 dark:text-orange-300' : t.pageText}`}>
                {label}
              </span>
              <span className={`mt-1 text-xs ${active ? 'text-orange-600/80 dark:text-orange-400/80' : t.pageTextMuted}`}>
                {desc}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
