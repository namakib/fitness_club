import { Link } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import t from '../theme';

export default function Home() {
  return (
    <div className={`flex min-h-screen flex-col ${t.authBg} transition-colors duration-200`}>
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        <div className="flex flex-col items-center text-center">
          <img src="/logo.png" alt="Fitness Club" className="mb-6 h-32 w-auto drop-shadow-sm dark:[filter:drop-shadow(0_0_1px_white)_drop-shadow(0_0_2px_white)]" />
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-5xl">
            Fitness Club
          </h1>
          <p className="mt-3 max-w-md text-lg text-gray-600 dark:text-gray-400">
            Track your goals, join classes, and train with the best. Your journey starts here.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:gap-4">
            <Link
              to="/login"
              className={`inline-flex items-center justify-center rounded-xl px-6 py-3 text-base font-semibold shadow-lg transition ${t.btn}`}
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center justify-center rounded-xl border-2 border-orange-600 px-6 py-3 text-base font-semibold text-orange-600 transition hover:bg-orange-50 dark:border-orange-400 dark:text-orange-400 dark:hover:bg-orange-900/20"
            >
              Create Account
            </Link>
          </div>
        </div>
      </main>

      <footer className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
        Health & Fitness Club Management
      </footer>
    </div>
  );
}
