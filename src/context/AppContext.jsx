import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { getConfig, setConfig, DEFAULT_CONFIG } from '../utils/storage';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [config, setConfigState] = useState(() => ({
    ...DEFAULT_CONFIG,
    ...getConfig(),
  }));
  const [toasts, setToasts] = useState([]);

  const updateConfig = useCallback((partial) => {
    setConfigState((prev) => {
      const next = { ...prev, ...partial };
      setConfig(next);
      return next;
    });
  }, []);

  const toast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <AppContext.Provider value={{ config, updateConfig, toasts, toast, dismissToast }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
