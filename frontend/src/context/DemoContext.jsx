import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const DemoContext = createContext({ demoMode: false, demoAccounts: [] });

export function DemoProvider({ children }) {
  const [demoMode, setDemoMode] = useState(false);
  const [demoAccounts, setDemoAccounts] = useState([]);

  useEffect(() => {
    api.get('/config')
      .then((data) => {
        setDemoMode(data.demo_mode ?? false);
        setDemoAccounts(data.demo_accounts ?? []);
      })
      .catch(() => {});
  }, []);

  return (
    <DemoContext.Provider value={{ demoMode, demoAccounts }}>
      {children}
    </DemoContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useDemo() {
  return useContext(DemoContext);
}
