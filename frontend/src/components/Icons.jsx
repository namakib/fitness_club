/**
 * Centralized icon components. All accept optional className and variant="svg"|"fa".
 * Default variant is DEFAULT_ICON_VARIANT; set to 'fa' or 'svg' to switch globally. ChevronUpDownIcon also accepts open.
 */
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronLeft,
  faChevronRight,
  faChevronUp,
  faChevronDown,
  faAnglesLeft,
  faAnglesRight,
  faCheck,
  faXmark,
  faPlus,
  faMinus,
  faMagnifyingGlass,
  faSun,
  faMoon,
  faRightFromBracket,
  faGauge,
  faThLarge,
  faCalendarDays,
  faClock,
  faUser,
  faUsers,
  faPhone,
  faHeart,
  faChartColumn,
  faBullseye,
  faTag,
  faVenusMars,
  faDumbbell,
  faWeightScale,
  faPeopleGroup,
  faCalendarCheck,
  faWrench,
  faBuilding,
} from '@fortawesome/free-solid-svg-icons';
import { faEye, faEyeSlash } from '@fortawesome/free-regular-svg-icons';
import t from '../theme';

// Set to 'svg' to use inline SVGs; 'fa' for Font Awesome.
export const DEFAULT_ICON_VARIANT = 'fa';

const cn = (base, className) => (className ? `${base} ${className}`.trim() : base);

const FaIcon = ({ icon, className = 'h-4 w-4', ...props }) => (
  <FontAwesomeIcon icon={icon} className={cn('shrink-0', className)} {...props} />
);

const CHEVRON_FA = { left: faChevronLeft, right: faChevronRight, up: faChevronUp, down: faChevronDown };

// ─── Chevrons (Single Reusable Component) ──────────────────────────────────
export function ChevronIcon({ variant = DEFAULT_ICON_VARIANT, direction = 'right', className, ...props }) {
  if (variant === 'fa') {
    return <FaIcon icon={CHEVRON_FA[direction]} className={cn('h-4 w-4', className)} {...props} />;
  }
  const rotation = {
    right: '',
    left: 'rotate-180',
    up: '-rotate-90',
    down: 'rotate-90',
  }[direction];
  return (
    <svg
      {...props}
      className={cn(`h-4 w-4 shrink-0 transition-transform ${rotation}`, className)}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 6l6 6-6 6" />
    </svg>
  );
}

export const ChevronLeftIcon = (props) => <ChevronIcon direction="left" {...props} />;
export const ChevronRightIcon = (props) => <ChevronIcon direction="right" {...props} />;
export const ChevronUpIcon = (props) => <ChevronIcon direction="up" {...props} />;
export const ChevronDownIcon = (props) => <ChevronIcon direction="down" {...props} />;

export function ChevronUpDownIcon({ variant = DEFAULT_ICON_VARIANT, open = false, className, ...props }) {
  if (variant === 'fa') {
    return <FaIcon icon={open ? faChevronUp : faChevronDown} className={cn('h-4 w-4', className)} {...props} />;
  }
  return (
    <ChevronIcon direction={open ? 'up' : 'down'} className={className} {...props} />
  );
}

// ─── Double Chevrons ───────────────────────────────────────────────────────
export function ChevronDoubleIcon({ variant = DEFAULT_ICON_VARIANT, direction = 'right', className, ...props }) {
  if (variant === 'fa') {
    const icon = direction === 'left' ? faAnglesLeft : faAnglesRight;
    return <FaIcon icon={icon} className={cn('h-4 w-4', className)} {...props} />;
  }
  return (
    <span className={cn('inline-flex shrink-0 items-center', className)} {...props}>
      <ChevronIcon direction={direction} className="-mr-0.5" />
      <ChevronIcon direction={direction} />
    </span>
  );
}

export const ChevronDoubleLeftIcon = (props) => <ChevronDoubleIcon direction="left" {...props} />;
export const ChevronDoubleRightIcon = (props) => <ChevronDoubleIcon direction="right" {...props} />;

// ─── UI ──────────────────────────────────────────────────────────────────
export function CheckIcon({ variant = DEFAULT_ICON_VARIANT, className, ...props }) {
  if (variant === 'fa') {
    return <FaIcon icon={faCheck} className={cn('h-4 w-4', t.iconAccent, className)} {...props} />;
  }
  return (
    <svg className={cn('h-4 w-4 shrink-0', t.iconAccent, className)} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}

export function CloseIcon({ variant = DEFAULT_ICON_VARIANT, className, ...props }) {
  if (variant === 'fa') {
    return <FaIcon icon={faXmark} className={cn('h-3.5 w-3.5', className)} {...props} />;
  }
  return (
    <svg className={cn('h-3.5 w-3.5', className)} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}

export function SearchIcon({ variant = DEFAULT_ICON_VARIANT, className, ...props }) {
  if (variant === 'fa') {
    return <FaIcon icon={faMagnifyingGlass} className={cn('h-4 w-4', t.iconMuted, className)} {...props} />;
  }
  return (
    <svg className={cn('h-4 w-4', t.iconMuted, className)} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
  );
}

export function PlusIcon({ variant = DEFAULT_ICON_VARIANT, className, ...props }) {
  if (variant === 'fa') return <FaIcon icon={faPlus} className={cn('h-4 w-4', className)} {...props} />;
  return (
    <svg className={cn('h-4 w-4', className)} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

export function MinusIcon({ variant = DEFAULT_ICON_VARIANT, className, ...props }) {
  if (variant === 'fa') return <FaIcon icon={faMinus} className={cn('h-4 w-4', className)} {...props} />;
  return (
    <svg className={cn('h-4 w-4', className)} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
    </svg>
  );
}

// ─── Theme ────────────────────────────────────────────────────────────────
export function SunIcon({ variant = DEFAULT_ICON_VARIANT, className, ...props }) {
  if (variant === 'fa') return <FaIcon icon={faSun} className={cn('h-3.5 w-3.5', className)} {...props} />;
  return (
    <svg className={cn('h-3.5 w-3.5', className)} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
    </svg>
  );
}

export function MoonIcon({ variant = DEFAULT_ICON_VARIANT, className, ...props }) {
  if (variant === 'fa') return <FaIcon icon={faMoon} className={cn('h-3.5 w-3.5', className)} {...props} />;
  return (
    <svg className={cn('h-3.5 w-3.5', className)} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
    </svg>
  );
}

export function SignOutIcon({ variant = DEFAULT_ICON_VARIANT, className, ...props }) {
  if (variant === 'fa') return <FaIcon icon={faRightFromBracket} className={cn('h-4 w-4', className)} {...props} />;
  return (
    <svg className={cn('h-4 w-4', className)} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
    </svg>
  );
}

export function DashboardIcon({ variant = DEFAULT_ICON_VARIANT, className, ...props }) {
  if (variant === 'fa') return <FaIcon icon={faThLarge} className={cn('h-4 w-4 shrink-0', className)} {...props} />;
  return (
    <svg className={cn('h-4 w-4 shrink-0', className)} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
    </svg>
  );
}

// ─── Content ─────────────────────────────────────────────────────────────
export function CalendarIcon({ variant = DEFAULT_ICON_VARIANT, className, ...props }) {
  if (variant === 'fa') return <FaIcon icon={faCalendarDays} className={cn('h-4 w-4', t.iconMuted, className)} {...props} />;
  return (
    <svg className={cn('h-4 w-4', t.iconMuted, className)} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
    </svg>
  );
}

export function ClockIcon({ variant = DEFAULT_ICON_VARIANT, className, ...props }) {
  if (variant === 'fa') return <FaIcon icon={faClock} className={cn('h-4 w-4', t.iconMuted, className)} {...props} />;
  return (
    <svg className={cn('h-4 w-4', t.iconMuted, className)} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

export function UserIcon({ variant = DEFAULT_ICON_VARIANT, className, ...props }) {
  if (variant === 'fa') return <FaIcon icon={faUser} className={cn('h-4 w-4', className)} {...props} />;
  return (
    <svg className={cn('h-4 w-4', className)} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
  );
}

export function UsersIcon({ variant = DEFAULT_ICON_VARIANT, className, ...props }) {
  if (variant === 'fa') return <FaIcon icon={faUsers} className={cn('h-4 w-4', className)} {...props} />;
  return (
    <svg className={cn('h-4 w-4', className)} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  );
}

export function PhoneIcon({ variant = DEFAULT_ICON_VARIANT, className, ...props }) {
  if (variant === 'fa') return <FaIcon icon={faPhone} className={cn('h-4 w-4', className)} {...props} />;
  return (
    <svg className={cn('h-4 w-4', className)} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
    </svg>
  );
}

export function HeartIcon({ variant = DEFAULT_ICON_VARIANT, className, ...props }) {
  if (variant === 'fa') return <FaIcon icon={faHeart} className={cn('h-5 w-5', t.iconMuted, className)} {...props} />;
  return (
    <svg className={cn('h-5 w-5', t.iconMuted, className)} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
    </svg>
  );
}

export function ChartIcon({ variant = DEFAULT_ICON_VARIANT, className, ...props }) {
  if (variant === 'fa') return <FaIcon icon={faChartColumn} className={cn('h-5 w-5', t.iconMuted, className)} {...props} />;
  return (
    <svg className={cn('h-5 w-5', t.iconMuted, className)} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
    </svg>
  );
}

export function TargetIcon({ variant = DEFAULT_ICON_VARIANT, className, ...props }) {
  if (variant === 'fa') return <FaIcon icon={faBullseye} className={cn('h-5 w-5', t.iconMuted, className)} {...props} />;
  return (
    <svg className={cn('h-5 w-5', t.iconMuted, className)} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5" />
    </svg>
  );
}

export function TagIcon({ variant = DEFAULT_ICON_VARIANT, className, ...props }) {
  if (variant === 'fa') return <FaIcon icon={faTag} className={cn('h-4 w-4', className)} {...props} />;
  return (
    <svg className={cn('h-4 w-4', className)} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
    </svg>
  );
}

export function GenderIcon({ variant = DEFAULT_ICON_VARIANT, className, ...props }) {
  if (variant === 'fa') return <FaIcon icon={faVenusMars} className={cn('h-4 w-4', className)} {...props} />;
  return (
    <svg className={cn('h-4 w-4', className)} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
  );
}

export function TrainerIcon({ variant = DEFAULT_ICON_VARIANT, className, ...props }) {
  if (variant === 'fa') return <FaIcon icon={faDumbbell} className={cn('h-4 w-4', className)} {...props} />;
  return (
    <svg className={cn('h-4 w-4', className)} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a23.838 23.838 0 0 0-1.012 5.434 23.665 23.665 0 0 0-1.008-5.434m15.482 0a23.84 23.84 0 0 1 1.012 5.434c.327-1.818.51-3.627.551-5.434M12 3.75a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Z" />
    </svg>
  );
}

// ─── StatCard icons (h-5 w-5) ────────────────────────────────────────────
export function WeightIcon({ variant = DEFAULT_ICON_VARIANT, className, ...props }) {
  if (variant === 'fa') return <FaIcon icon={faWeightScale} className={cn('h-5 w-5', className)} {...props} />;
  return (
    <svg className={cn('h-5 w-5', className)} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0 0 12 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 0 1-2.031.352 5.988 5.988 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971Zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 0 1-2.031.352 5.989 5.989 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971Z" />
    </svg>
  );
}

export function GoalIcon({ variant = DEFAULT_ICON_VARIANT, className, ...props }) {
  if (variant === 'fa') return <FaIcon icon={faBullseye} className={cn('h-5 w-5', className)} {...props} />;
  return (
    <svg className={cn('h-5 w-5', className)} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
    </svg>
  );
}

export function ClassIcon({ variant = DEFAULT_ICON_VARIANT, className, ...props }) {
  if (variant === 'fa') return <FaIcon icon={faPeopleGroup} className={cn('h-5 w-5', className)} {...props} />;
  return (
    <svg className={cn('h-5 w-5', className)} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
    </svg>
  );
}

export function SessionIcon({ variant = DEFAULT_ICON_VARIANT, className, ...props }) {
  if (variant === 'fa') return <FaIcon icon={faCalendarCheck} className={cn('h-5 w-5', className)} {...props} />;
  return (
    <svg className={cn('h-5 w-5', className)} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
    </svg>
  );
}

export function WrenchIcon({ variant = DEFAULT_ICON_VARIANT, className, ...props }) {
  if (variant === 'fa') return <FaIcon icon={faWrench} className={cn('h-5 w-5', className)} {...props} />;
  return (
    <svg className={cn('h-5 w-5', className)} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437 1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008Z" />
    </svg>
  );
}

export function BuildingIcon({ variant = DEFAULT_ICON_VARIANT, className, ...props }) {
  if (variant === 'fa') return <FaIcon icon={faBuilding} className={cn('h-5 w-5', className)} {...props} />;
  return (
    <svg className={cn('h-5 w-5', className)} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
    </svg>
  );
}

// ─── Eye (password show/hide) ─────────────────────────────────────────────
export function EyeIcon({ variant = DEFAULT_ICON_VARIANT, className, ...props }) {
  if (variant === 'fa') return <FaIcon icon={faEye} className={cn('h-4 w-4', className)} {...props} />;
  return (
    <svg className={cn('h-4 w-4', className)} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  );
}

export function EyeSlashIcon({ variant = DEFAULT_ICON_VARIANT, className, ...props }) {
  if (variant === 'fa') return <FaIcon icon={faEyeSlash} className={cn('h-4 w-4', className)} {...props} />;
  return (
    <svg className={cn('h-4 w-4', className)} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  );
}

