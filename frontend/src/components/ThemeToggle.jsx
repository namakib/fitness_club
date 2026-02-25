import { useTheme } from '../context/ThemeContext';
import { SunIcon, MoonIcon } from './Icons';

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
        <SunIcon variant="svg" />
      </span>

      <span className="pointer-events-none absolute right-1 text-gray-400 transition-opacity duration-200"
        style={{ opacity: isDark ? 0 : 0.4 }}>
        <MoonIcon variant="svg" />
      </span>

      <span
        className={`pointer-events-none flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-md ring-0 transition-transform duration-300 ${isDark ? 'translate-x-7' : 'translate-x-0.5'}`}
      >
        {isDark
          ? <span className="text-indigo-500"><MoonIcon variant="svg" /></span>
          : <span className="text-amber-500"><SunIcon variant="svg" /></span>
        }
      </span>
    </button>
  );
}
