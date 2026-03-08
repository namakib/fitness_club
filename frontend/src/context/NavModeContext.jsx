import { createContext, useContext, useState, useCallback } from 'react';

const NavModeContext = createContext(null);

const KEY = 'navMode';
const MODES = ['sidebar', 'dropdown'];

function getInitial() {
  if (typeof window === 'undefined') return 'dropdown';
  try {
    const stored = localStorage.getItem(KEY);
    return MODES.includes(stored) ? stored : 'dropdown';
  } catch {
    return 'dropdown';
  }
}

export function NavModeProvider({ children }) {
  const [navMode, setNavModeState] = useState(getInitial);

  const setNavMode = useCallback((mode) => {
    if (!MODES.includes(mode)) return;
    setNavModeState(mode);
    try { localStorage.setItem(KEY, mode); } catch { /* noop */ }
  }, []);

  return (
    <NavModeContext.Provider value={{ navMode, setNavMode }}>
      {children}
    </NavModeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useNavMode() {
  const ctx = useContext(NavModeContext);
  if (!ctx) throw new Error('useNavMode must be used within NavModeProvider');
  return ctx;
}
