import { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import t from '../theme';
import { ChevronUpDownIcon, CheckIcon, SearchIcon } from './Icons';

const DURATION_MS = 150;

export default function SelectDropdown({ label, value, options, onChange, placeholder = 'Select…', searchable = true, floating = false }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [query, setQuery] = useState('');
  const [position, setPosition] = useState({ top: 0, left: 0, bottom: undefined, minWidth: 0 });
  const ref = useRef(null);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      const inTrigger = ref.current?.contains(e.target);
      const inPanel = floating && panelRef.current?.contains(e.target);
      if (open && !inTrigger && !inPanel) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, floating]);

  useEffect(() => {
    if (open) {
      setExiting(false);
      setMounted(true);
    } else if (mounted) {
      setExiting(true);
      const t = setTimeout(() => {
        setExiting(false);
        setMounted(false);
        setQuery('');
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
    if (open && mounted && searchable && searchRef.current) {
      searchRef.current.focus();
    }
  }, [open, mounted, searchable]);

  const PANEL_MAX_HEIGHT = 220;

  useEffect(() => {
    if (floating && open && mounted && triggerRef.current) {
      const updatePosition = () => {
        if (triggerRef.current) {
          const rect = triggerRef.current.getBoundingClientRect();
          const spaceBelow = window.innerHeight - rect.bottom;
          const openAbove = spaceBelow < PANEL_MAX_HEIGHT && rect.top > spaceBelow;
          if (openAbove) {
            setPosition({ top: undefined, bottom: window.innerHeight - rect.top + 6, left: rect.left, minWidth: rect.width });
          } else {
            setPosition({ top: rect.bottom + 6, bottom: undefined, left: rect.left, minWidth: rect.width });
          }
        }
      };
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [floating, open, mounted]);

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.toLowerCase();
    return options.filter(o => o.label.toLowerCase().includes(q));
  }, [options, query]);

  const selected = options.find(o => o.value === value);
  const show = visible && !exiting;

  return (
    <div>
      {label && <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>}

      <div className="relative" ref={ref}>
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen(prev => !prev)}
          className={`${t.input} flex items-center justify-between gap-4 text-left ${!selected ? 'text-gray-400 dark:text-gray-500' : ''}`}
        >
          <span className="truncate">{selected ? selected.label : placeholder}</span>
          <ChevronUpDownIcon open={open} />
        </button>

        {mounted && (() => {
          const floatingStyle = floating ? {
            position: 'fixed',
            ...(position.top != null ? { top: position.top } : { bottom: position.bottom }),
            left: position.left,
            minWidth: position.minWidth,
            zIndex: 9998,
          } : {};
          const opensAbove = position.bottom != null;
          const floatingAnimClass = floating
            ? (show ? 'opacity-100 translate-y-0' : opensAbove ? 'opacity-0 translate-y-2' : 'opacity-0 -translate-y-2')
            : '';
          const inlineAnimClass = !floating
            ? `origin-top ${show ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-1'}`
            : '';
          const panelContent = (
            <div
              ref={floating ? panelRef : undefined}
              className={`rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black/5 dark:ring-white/5 transition-all duration-150 ease-out ${
                floating ? floatingAnimClass : inlineAnimClass
              }`}
              style={floating ? floatingStyle : {}}
            >
              {searchable && (
                <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 px-3 py-2">
                  <SearchIcon />
                  <input
                    ref={searchRef}
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Search…"
                    className="w-full bg-transparent text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 outline-none"
                  />
                </div>
              )}

              <div className="max-h-52 overflow-auto py-1">
                {filtered.length === 0 ? (
                  <p className="px-3 py-2 text-sm text-gray-400 dark:text-gray-500">No results</p>
                ) : (
                  filtered.map(opt => {
                    const active = opt.value === value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => { onChange(opt.value); setOpen(false); }}
                        className={`
                          flex w-full items-center justify-between px-3 py-2 text-left text-sm transition
                          ${active
                            ? 'bg-orange-50 text-orange-700 font-medium dark:bg-orange-900/30 dark:text-orange-400'
                            : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'}
                        `}
                      >
                        <span className="truncate pr-2">{opt.label}</span>
                        {active && <CheckIcon />}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          );
          if (floating) {
            return createPortal(panelContent, document.body);
          }
          return (
            <div className="absolute left-0 right-0 z-50 mt-1.5">
              {panelContent}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
