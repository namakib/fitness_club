import { useTheme } from '../context/ThemeContext';

const SunIcon = () => (
  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
  </svg>
);

const MoonIcon = () => (
  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
  </svg>
);

export default function ThemeToggle() {
  const { isDark, toggle } = useTheme();

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="relative inline-flex h-7 w-14 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 bg-gray-200 dark:bg-gray-600"
    >
      <span className="sr-only">{isDark ? 'Dark mode' : 'Light mode'}</span>

      <span className="pointer-events-none absolute left-1 text-amber-500 transition-opacity duration-200"
        style={{ opacity: isDark ? 0.4 : 0 }}>
        <SunIcon />
      </span>

      <span className="pointer-events-none absolute right-1 text-gray-400 transition-opacity duration-200"
        style={{ opacity: isDark ? 0 : 0.4 }}>
        <MoonIcon />
      </span>

      <span
        className={`pointer-events-none flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-md ring-0 transition-transform duration-300 ${isDark ? 'translate-x-7' : 'translate-x-0.5'}`}
      >
        {isDark
          ? <span className="text-indigo-500"><MoonIcon /></span>
          : <span className="text-amber-500"><SunIcon /></span>
        }
      </span>
    </button>
  );
}
