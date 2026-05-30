import { useState, useEffect } from 'react';
import { AppProvider } from './context/AppContext';
import BottomNav from './components/layout/BottomNav';
import MoreMenu from './components/layout/MoreMenu';
import Toast from './components/layout/Toast';
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
};

const MAIN_TABS = ['dashboard', 'produccion', 'inventario', 'ventas'];

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [showMore, setShowMore] = useState(false);

  const navigate = (target) => {
    if (target === 'more') {
      setShowMore(true);
    } else {
      setPage(target);
      setShowMore(false);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [page]);

  const PageComponent = PAGES[page] || Dashboard;

  return (
    <AppProvider>
      <div className="min-h-screen flex flex-col">
        <div className="pt-safe bg-amber-50" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }} />
        <main className="flex-1 overflow-y-auto pb-28">
          <PageComponent onNavigate={navigate} />
        </main>
        <BottomNav
          active={MAIN_TABS.includes(page) ? page : 'more'}
          onNavigate={navigate}
        />
        {showMore && <MoreMenu onNavigate={navigate} onClose={() => setShowMore(false)} />}
        <Toast />
      </div>
    </AppProvider>
  );
}
