import { useMemo } from 'react';
import { getItem, KEYS } from '../utils/storage';
import { todayISO, lastNDays, fmtDateShort, isSameDay } from '../utils/dates';
import { useApp } from '../context/AppContext';
import BarChart from '../components/charts/BarChart';

export default function Dashboard({ onNavigate }) {
  const { config } = useApp();
  const today = todayISO();

  const { produccionHoy, stockActual, gallinas, chartData, alerta, vacunasProximas } = useMemo(() => {
    const produccion = getItem(KEYS.PRODUCCION, []);
    const ventas = getItem(KEYS.VENTAS, []);
    const mortalidad = getItem(KEYS.MORTALIDAD, []);
    const vacunas = getItem(KEYS.VACUNAS, []);

    const bajas = mortalidad.reduce((s, r) => s + (r.cantidad || 1), 0);
    const gallinas = config.gallinasIniciales - bajas;

    const hoyRecords = produccion.filter((r) => isSameDay(r.fecha, today));
    const produccionHoy = hoyRecords.reduce((s, r) => s + r.cantidad, 0);

    const totalProduccion = produccion.reduce((s, r) => s + r.cantidad, 0);
    const totalVendidas = ventas.reduce((s, v) => s + v.cantidadPiezas, 0);
    const stockActual = totalProduccion - totalVendidas;

    const days = lastNDays(7);
    const chartData = days.map((d) => ({
      label: fmtDateShort(d),
      value: produccion.filter((r) => isSameDay(r.fecha, d)).reduce((s, r) => s + r.cantidad, 0),
      isToday: d === today,
    }));

    const semanalValues = chartData.slice(0, 6).map((d) => d.value).filter((v) => v > 0);
    const promedio = semanalValues.length ? semanalValues.reduce((a, b) => a + b, 0) / semanalValues.length : 0;
    const alerta = produccionHoy > 0 && promedio > 0 && produccionHoy < promedio * 0.8;

    const vacunasProximas = vacunas
      .filter((v) => v.proximaDosis && v.proximaDosis >= today &&
        new Date(v.proximaDosis) - new Date(today) <= 7 * 86400000)
      .sort((a, b) => a.proximaDosis.localeCompare(b.proximaDosis));

    return { produccionHoy, stockActual, gallinas, chartData, alerta, vacunasProximas };
  }, [config, today]);

  return (
    <div className="px-4 pt-4 pb-2 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-stone-800">Mi Gallinero 🐔</h1>
          <p className="text-sm text-stone-500">
            {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div className="bg-amber-100 rounded-2xl px-3 py-1.5 text-center">
          <p className="text-2xl font-bold text-amber-700">{gallinas}</p>
          <p className="text-[10px] text-amber-600 font-medium">gallinas</p>
        </div>
      </div>

      {/* Alertas */}
      {alerta && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-3 flex items-start gap-2">
          <span className="text-xl">⚠️</span>
          <p className="text-sm text-red-700 font-medium">
            Producción de hoy ({produccionHoy} huevos) está por debajo del promedio semanal
          </p>
        </div>
      )}
      {stockActual <= config.umbralStockBajo && stockActual >= 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-3 flex items-start gap-2">
          <span className="text-xl">📦</span>
          <p className="text-sm text-orange-700 font-medium">
            Stock bajo: solo {stockActual} huevos en inventario
          </p>
        </div>
      )}
      {vacunasProximas.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 flex items-start gap-2">
          <span className="text-xl">💉</span>
          <div>
            <p className="text-sm text-blue-700 font-semibold">Vacuna próxima</p>
            {vacunasProximas.map((v) => (
              <p key={v.id} className="text-xs text-blue-600">{v.nombre} — {v.proximaDosis}</p>
            ))}
          </div>
        </div>
      )}

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onNavigate('produccion')}
          className="bg-white rounded-2xl shadow-sm p-4 text-left border border-stone-100 active:bg-amber-50"
        >
          <p className="text-3xl">🥚</p>
          <p className="text-3xl font-bold text-stone-800 mt-1">{produccionHoy}</p>
          <p className="text-xs text-stone-500 mt-0.5">huevos hoy</p>
        </button>
        <button
          onClick={() => onNavigate('inventario')}
          className="bg-white rounded-2xl shadow-sm p-4 text-left border border-stone-100 active:bg-amber-50"
        >
          <p className="text-3xl">📦</p>
          <p className="text-3xl font-bold text-stone-800 mt-1">{stockActual}</p>
          <p className="text-xs text-stone-500 mt-0.5">en stock • {Math.floor(stockActual / 12)} doc</p>
        </button>
      </div>

      {/* Gráfica 7 días */}
      <div className="bg-white rounded-2xl shadow-sm p-4 border border-stone-100">
        <p className="text-sm font-semibold text-stone-700 mb-3">Producción últimos 7 días</p>
        <BarChart data={chartData} height={80} />
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
          <button
            key={item.page}
            onClick={() => onNavigate(item.page)}
            className={`w-full flex items-center gap-3 px-4 py-3 active:bg-amber-50 ${i > 0 ? 'border-t border-stone-50' : ''}`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-sm font-medium text-stone-700">{item.label}</span>
            <span className="ml-auto text-stone-300">›</span>
          </button>
        ))}
      </div>
    </div>
  );
}
