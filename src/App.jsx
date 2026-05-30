import { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from './firebase';
import { AppProvider, useApp } from './context/AppContext';
import BottomNav from './components/layout/BottomNav';
import MoreMenu from './components/layout/MoreMenu';
import Toast from './components/layout/Toast';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Produccion from './pages/Produccion';
import Inventario from './pages/Inventario';
import Ventas from './pages/Ventas';
import Alimentacion from './pages/Alimentacion';
import Sanidad from './pages/Sanidad';
import Mortalidad from './pages/Mortalidad';
import Gastos from './pages/Gastos';
import Configuracion from './pages/Configuracion';
import Sensores from './pages/Sensores';
import Clientes from './pages/Clientes';

const PAGES = {
  dashboard:     Dashboard,
  produccion:    Produccion,
  inventario:    Inventario,
  ventas:        Ventas,
  alimentacion:  Alimentacion,
  sanidad:       Sanidad,
  mortalidad:    Mortalidad,
  gastos:        Gastos,
  configuracion: Configuracion,
  sensores:      Sensores,
  clientes:      Clientes,
};

const MAIN_TABS = ['dashboard', 'produccion', 'inventario', 'ventas'];

function AppShell() {
  const { authLoading, user, userProfile } = useApp();
  const [page, setPage] = useState('dashboard');
  const [showMore, setShowMore] = useState(false);

  useEffect(() => { window.scrollTo(0, 0); }, [page]);

  // Loading spinner
  if (authLoading) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-amber-200 border-t-brand-500 rounded-full animate-spin" />
          <p className="text-stone-500 text-sm">Cargando...</p>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!user) return <Login />;

  // Deactivated account
  if (userProfile && userProfile.activo === false) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-4xl mb-4">🔒</p>
          <h2 className="text-lg font-bold text-stone-800">Cuenta desactivada</h2>
          <p className="text-stone-500 text-sm mt-2">Contacta al administrador para recuperar acceso.</p>
          <button
            onClick={() => signOut(auth)}
            className="mt-6 px-6 py-2.5 bg-stone-200 text-stone-700 rounded-xl text-sm font-medium"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    );
  }

  const navigate = (target) => {
    if (target === 'more') { setShowMore(true); return; }
    setPage(target);
    setShowMore(false);
  };

  const PageComponent = PAGES[page] || Dashboard;

  return (
    <div className="min-h-screen flex flex-col">
      <div style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }} className="bg-amber-50" />
      <main className="flex-1 overflow-y-auto pb-28">
        <PageComponent onNavigate={navigate} />
      </main>
      <BottomNav active={MAIN_TABS.includes(page) ? page : 'more'} onNavigate={navigate} />
      {showMore && <MoreMenu onNavigate={navigate} onClose={() => setShowMore(false)} />}
      <Toast />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
