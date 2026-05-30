import { useState, useEffect, useMemo } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { todayISO, lastNDays, fmtDateShort, isSameDay, isSameMonth } from '../utils/dates';
import { useApp } from '../context/AppContext';
import BarChart from '../components/charts/BarChart';
import logo from '../assets/logo.png';

const qProd  = query(collection(db, 'produccion'),  orderBy('fecha', 'desc'));
const qVentas = query(collection(db, 'ventas'),     orderBy('fecha', 'desc'));
const qMort  = query(collection(db, 'mortalidad'),  orderBy('fecha', 'desc'));
const qVac   = query(collection(db, 'vacunas'),     orderBy('proximaDosis', 'asc'));
const qGastos = query(collection(db, 'gastos'),     orderBy('fecha', 'desc'));

export default function Dashboard({ onNavigate }) {
  const { config, userProfile, isAdmin } = useApp();
  const [produccion, setProduccion]   = useState([]);
  const [ventas, setVentas]           = useState([]);
  const [mortalidad, setMortalidad]   = useState([]);
  const [vacunas, setVacunas]         = useState([]);
  const [gastos, setGastos]           = useState([]);

  useEffect(() => onSnapshot(qProd,   (s) => setProduccion(s.docs.map(d => ({ id: d.id, ...d.data() })))), []);
  useEffect(() => onSnapshot(qVentas, (s) => setVentas(s.docs.map(d => ({ id: d.id, ...d.data() })))), []);
  useEffect(() => onSnapshot(qMort,   (s) => setMortalidad(s.docs.map(d => ({ id: d.id, ...d.data() })))), []);
  useEffect(() => onSnapshot(qVac,    (s) => setVacunas(s.docs.map(d => ({ id: d.id, ...d.data() })))), []);
  useEffect(() => onSnapshot(qGastos, (s) => setGastos(s.docs.map(d => ({ id: d.id, ...d.data() })))), []);

  const today = todayISO();

  const metrics = useMemo(() => {
    const bajas = mortalidad.reduce((s, r) => s + (r.cantidad || 1), 0);
    const gallinas = (config.gallinasIniciales || 36) - bajas;

    const hoy = produccion.filter((r) => isSameDay(r.fecha, today));
    const produccionHoy = hoy.reduce((s, r) => s + r.cantidad, 0);
    const hasProduccion = produccion.length > 0;

    const totalProduccion = produccion.reduce((s, r) => s + r.cantidad, 0);
    const totalVendidas   = ventas.reduce((s, v) => s + (v.cantidadPiezas || 0), 0);
    const stock = totalProduccion - totalVendidas;

    // 7-day chart
    const days = lastNDays(7);
    const chartData = days.map((d) => ({
      label: fmtDateShort(d),
      value: produccion.filter((r) => isSameDay(r.fecha, d)).reduce((s, r) => s + r.cantidad, 0),
      isToday: d === today,
    }));

    // Weekly average (excl. today)
    const pastVals = chartData.slice(0, 6).map((d) => d.value).filter((v) => v > 0);
    const promedio = pastVals.length ? pastVals.reduce((a, b) => a + b, 0) / pastVals.length : 0;
    const alertaProd = produccionHoy > 0 && promedio > 0 && produccionHoy < promedio * 0.8;

    // Stock alert — only when there is at least one production record
    // (prevents false alarm on a brand-new empty app)
    const umbral = typeof config.umbralStockBajo === 'number' ? config.umbralStockBajo : 50;
    const alertaStock = hasProduccion && stock >= 0 && stock <= umbral;

    // Vaccines due in next 7 days
    const vacunasProximas = vacunas.filter((v) => {
      if (!v.proximaDosis) return false;
      const diff = new Date(v.proximaDosis) - new Date(today);
      return diff >= 0 && diff <= 7 * 86400000;
    });

    // Rentabilidad del mes
    const ingresosDelMes = ventas
      .filter((v) => isSameMonth(v.fecha) && v.cobrado)
      .reduce((s, v) => s + (v.total || 0), 0);
    const gastosDelMes = gastos
      .filter((g) => isSameMonth(g.fecha))
      .reduce((s, g) => s + (g.monto || 0), 0);
    const utilidad = ingresosDelMes - gastosDelMes;

    return {
      gallinas, produccionHoy, stock, chartData,
      alertaProd, alertaStock, vacunasProximas,
      ingresosDelMes, gastosDelMes, utilidad,
    };
  }, [produccion, ventas, mortalidad, vacunas, gastos, config, today]);

  return (
    <div className="px-4 pt-4 pb-2 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center overflow-hidden flex-shrink-0">
            <img src={logo} alt="" className="w-7 h-7 object-contain" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-stone-800 leading-tight">Mi Gallinero</h1>
            <p className="text-xs text-stone-500">
              {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-amber-100 rounded-2xl px-3 py-1.5 text-center">
            <p className="text-xl font-bold text-amber-700">{metrics.gallinas}</p>
            <p className="text-[10px] text-amber-600 font-medium">gallinas</p>
          </div>
          <button
            onClick={() => signOut(auth)}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-stone-100 text-stone-500 active:bg-stone-200"
            title="Cerrar sesión"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>

      {/* Saludo */}
      {userProfile?.nombre && (
        <p className="text-sm text-stone-500">Hola, <strong className="text-stone-700">{userProfile.nombre}</strong> 👋</p>
      )}

      {/* Alertas */}
      {metrics.alertaProd && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-3 flex items-start gap-2">
          <span className="text-xl">⚠️</span>
          <p className="text-sm text-red-700 font-medium">
            Producción de hoy ({metrics.produccionHoy} huevos) está por debajo del promedio semanal
          </p>
        </div>
      )}
      {metrics.alertaStock && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-3 flex items-start gap-2">
          <span className="text-xl">📦</span>
          <p className="text-sm text-orange-700 font-medium">
            Stock bajo: solo {metrics.stock} huevos en inventario
          </p>
        </div>
      )}
      {metrics.vacunasProximas.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 flex items-start gap-2">
          <span className="text-xl">💉</span>
          <div>
            <p className="text-sm text-blue-700 font-semibold">Vacuna próxima</p>
            {metrics.vacunasProximas.map((v) => (
              <p key={v.id} className="text-xs text-blue-600">{v.nombre} — {v.proximaDosis}</p>
            ))}
          </div>
        </div>
      )}

      {/* Tarjetas huevos / stock */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => onNavigate('produccion')}
          className="bg-white rounded-2xl shadow-sm p-4 text-left border border-stone-100 active:bg-amber-50">
          <p className="text-3xl">🥚</p>
          <p className="text-3xl font-bold text-stone-800 mt-1">{metrics.produccionHoy}</p>
          <p className="text-xs text-stone-500 mt-0.5">huevos hoy</p>
        </button>
        <button onClick={() => onNavigate('inventario')}
          className="bg-white rounded-2xl shadow-sm p-4 text-left border border-stone-100 active:bg-amber-50">
          <p className="text-3xl">📦</p>
          <p className="text-3xl font-bold text-stone-800 mt-1">{metrics.stock}</p>
          <p className="text-xs text-stone-500 mt-0.5">en stock · {Math.floor(metrics.stock / 12)} doc</p>
        </button>
      </div>

      {/* Rentabilidad del mes */}
      <div
        className={`rounded-2xl p-4 ${metrics.utilidad >= 0 ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-red-400 to-rose-500'} text-white`}
      >
        <p className="text-xs font-medium opacity-90">Rentabilidad del mes</p>
        <p className="text-3xl font-bold">${metrics.utilidad.toFixed(2)}</p>
        <div className="flex gap-4 mt-1.5 text-xs opacity-80">
          <span>Ingresos ${metrics.ingresosDelMes.toFixed(2)}</span>
          <span>Gastos ${metrics.gastosDelMes.toFixed(2)}</span>
        </div>
      </div>

      {/* Gráfica 7 días */}
      <div className="bg-white rounded-2xl shadow-sm p-4 border border-stone-100">
        <p className="text-sm font-semibold text-stone-700 mb-3">Producción últimos 7 días</p>
        <BarChart data={metrics.chartData} height={160} />
      </div>

      {/* Accesos rápidos */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
        <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider px-4 pt-3 pb-2">Acceso rápido</p>
        {[
          { icon: '🥚', label: 'Registrar huevos', page: 'produccion' },
          { icon: '💰', label: 'Nueva venta',       page: 'ventas' },
          { icon: '🌾', label: 'Alimentación',      page: 'alimentacion' },
          { icon: '💸', label: 'Registrar gasto',   page: 'gastos' },
        ].map((item, i) => (
          <button key={item.page} onClick={() => onNavigate(item.page)}
            className={`w-full flex items-center gap-3 px-4 py-3 active:bg-amber-50 ${i > 0 ? 'border-t border-stone-50' : ''}`}>
            <span className="text-xl">{item.icon}</span>
            <span className="text-sm font-medium text-stone-700">{item.label}</span>
            <span className="ml-auto text-stone-300">›</span>
          </button>
        ))}
      </div>
    </div>
  );
}
