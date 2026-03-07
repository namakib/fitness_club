import { useEffect, useState } from 'react';
import { CloseIcon } from './Icons';
import t from '../theme';

const SIZE_CLASSES = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
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
      const timeout = setTimeout(() => {
        setExiting(false);
        setMounted(false);
      }, DURATION_MS);
      return () => clearTimeout(timeout);
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

  useEffect(() => {
    if (!open || !mounted) return;
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, mounted, onClose]);

  if (!mounted) return null;

  const maxWidth = SIZE_CLASSES[size] ?? SIZE_CLASSES.md;
  const show = visible && !exiting;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div
        className={`absolute inset-0 ${t.overlay} transition-opacity duration-200 ${show ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
        aria-hidden
      />
      <div
        className={`relative w-full ${maxWidth} rounded-xl border ${t.cardBorder} ${t.cardBg} shadow-xl transition-all duration-200 ease-out ${show ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
        onClick={e => e.stopPropagation()}
      >
        <div className={`flex items-center justify-between border-b ${t.cardBorderMuted} px-6 py-4`}>
          <h2 className={`text-lg font-semibold ${t.pageText}`}>{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className={`rounded-lg p-1.5 transition ${t.iconMuted} ${t.interactiveHover}`}
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
