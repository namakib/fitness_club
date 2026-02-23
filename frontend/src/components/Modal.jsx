import { useEffect, useState } from 'react';
import { CloseIcon } from './Icons';

const SIZE_CLASSES = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
};

const DURATION_MS = 200;

export default function Modal({ open, onClose, title, children, size = 'md' }) {
  const [mounted, setMounted] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setExiting(false);
      setMounted(true);
    } else if (mounted) {
      setExiting(true);
      const t = setTimeout(() => {
        setExiting(false);
        setMounted(false);
      }, DURATION_MS);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (open && mounted) {
      const raf = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(raf);
    }
    setVisible(false);
  }, [open, mounted]);

  useEffect(() => {
    if (mounted) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [mounted]);

  if (!mounted) return null;

  const maxWidth = SIZE_CLASSES[size] ?? SIZE_CLASSES.md;
  const show = visible && !exiting;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div
        className={`absolute inset-0 bg-black/50 dark:bg-black/60 transition-opacity duration-200 ${show ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
        aria-hidden
      />
      <div
        className={`relative w-full ${maxWidth} rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-xl transition-all duration-200 ease-out ${show ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition"
            aria-label="Close"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
