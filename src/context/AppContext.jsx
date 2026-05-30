import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import {
  doc, onSnapshot, setDoc, updateDoc, getDoc, collection, getDocs
} from 'firebase/firestore';
import { auth, db } from '../firebase';

export const DEFAULT_CONFIG = {
  usuarios: ['Miguel', 'Mamá'],
  gallinasIniciales: 36,
  precioPorPieza: 2.5,
  precioPorDocena: 28,
  umbralStockBajo: 50,
};

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [toasts, setToasts] = useState([]);

  // Step 1 – watch Firebase Auth
  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setUserProfile(null);
        setAuthLoading(false);
      }
    });
  }, []);

  // Step 2 – when auth user is known, load / create Firestore profile
  useEffect(() => {
    if (!user) return;

    const profileRef = doc(db, 'usuarios', user.uid);

    // Create profile on first login
    (async () => {
      const snap = await getDoc(profileRef);
      if (!snap.exists()) {
        const allUsers = await getDocs(collection(db, 'usuarios'));
        await setDoc(profileRef, {
          nombre: user.displayName || user.email.split('@')[0],
          email: user.email,
          rol: allUsers.empty ? 'admin' : 'colaborador',
          activo: true,
        });
      }
    })();

    // Real-time profile subscription
    return onSnapshot(profileRef, (snap) => {
      if (snap.exists()) {
        setUserProfile(snap.data());
        setAuthLoading(false);
      }
    });
  }, [user]);

  // Step 3 – config document (shared, real-time)
  useEffect(() => {
    if (!user) return;
    const configRef = doc(db, 'config', 'app');
    return onSnapshot(configRef, (snap) => {
      if (snap.exists()) setConfig(snap.data());
    });
  }, [user]);

  const updateConfig = useCallback(async (partial) => {
    const configRef = doc(db, 'config', 'app');
    const snap = await getDoc(configRef);
    if (snap.exists()) {
      await updateDoc(configRef, partial);
    } else {
      await setDoc(configRef, { ...DEFAULT_CONFIG, ...partial });
    }
  }, []);

  const toast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3000);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((p) => p.filter((t) => t.id !== id));
  }, []);

  return (
    <AppContext.Provider value={{
      user,
      userProfile,
      authLoading,
      isAdmin:       userProfile?.rol === 'admin',
      isColaborador: userProfile?.rol === 'colaborador',
      config,
      updateConfig,
      toasts,
      toast,
      dismissToast,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
