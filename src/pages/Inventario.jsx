import { useMemo } from 'react';
import { getItem, KEYS } from '../utils/storage';
import { useApp } from '../context/AppContext';
import { fmtDate, isSameDay, todayISO, lastNDays } from '../utils/dates';
import BarChart from '../components/charts/BarChart';

export default function Inventario() {
  const { config } = useApp();

  const stats = useMemo(() => {
    const produccion = getItem(KEYS.PRODUCCION, []);
    const ventas = getItem(KEYS.VENTAS, []);

    const totalEntradas = produccion.reduce((s, r) => s + r.cantidad, 0);
    const totalSalidas = ventas.reduce((s, v) => s + v.cantidadPiezas, 0);
    const stock = totalEntradas - totalSalidas;
    const docenas = Math.floor(stock / 12);
    const sueltos = stock % 12;

    const today = todayISO();
    const days = lastNDays(7);
    const movimientos = days.map((d) => {
      const entrada = produccion.filter((r) => isSameDay(r.fecha, d)).reduce((s, r) => s + r.cantidad, 0);
      const salida = ventas.filter((v) => isSameDay(v.fecha, d)).reduce((s, v) => s + v.cantidadPiezas, 0);
      return { label: d.slice(5).replace('-', '/'), value: entrada, salida, isToday: d === today };
    });

    const ventasRecientes = ventas.slice(0, 10);
    const produccionReciente = produccion.slice(0, 10);

    return { stock, docenas, sueltos, movimientos, totalEntradas, totalSalidas, ventasRecientes, produccionReciente };
  }, [config]);

  const bajo = stats.stock <= config.umbralStockBajo;

  return (
    <div className="px-4 pt-4 pb-2 space-y-4">
      <h2 className="text-xl font-bold text-stone-800">Inventario 📦</h2>

      {/* Stock principal */}
      <div className={`rounded-2xl p-5 text-white ${bajo ? 'bg-red-500' : 'bg-gradient-to-r from-amber-400 to-orange-500'}`}>
        {bajo && (
          <div className="flex items-center gap-2 mb-2">
            <span>⚠️</span>
            <span className="text-sm font-semibold">Stock bajo</span>
          </div>
        )}
        <p className="text-sm font-medium opacity-90">Stock actual</p>
        <p className="text-5xl font-bold">{stats.stock}</p>
        <p className="text-sm opacity-75">huevos disponibles</p>
        <div className="flex gap-3 mt-3">
          <div className="bg-white/20 rounded-xl px-3 py-1.5 text-center">
            <p className="text-xl font-bold">{stats.docenas}</p>
            <p className="text-xs opacity-80">docenas</p>
          </div>
          <div className="bg-white/20 rounded-xl px-3 py-1.5 text-center">
            <p className="text-xl font-bold">{stats.sueltos}</p>
            <p className="text-xs opacity-80">sueltos</p>
          </div>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-4">
          <p className="text-2xl">📥</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{stats.totalEntradas}</p>
          <p className="text-xs text-stone-500">total producidos</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-4">
          <p className="text-2xl">📤</p>
          <p className="text-2xl font-bold text-red-500 mt-1">{stats.totalSalidas}</p>
          <p className="text-xs text-stone-500">total vendidos</p>
        </div>
      </div>

      {/* Gráfica */}
      <div className="bg-white rounded-2xl shadow-sm p-4 border border-stone-100">
        <p className="text-sm font-semibold text-stone-700 mb-3">Producción últimos 7 días</p>
        <BarChart data={stats.movimientos} height={70} />
      </div>

      {/* Movimientos recientes */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-100">
        <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider px-4 pt-3 pb-2">
          Últimos movimientos
        </p>
        {stats.produccionReciente.length === 0 && (
          <p className="text-center text-stone-400 py-6 text-sm">Sin movimientos</p>
        )}
        {stats.produccionReciente.map((r, i) => (
          <div key={r.id} className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? 'border-t border-stone-50' : ''}`}>
            <span className="text-xl">📥</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-stone-700">+{r.cantidad} huevos producidos</p>
              <p className="text-xs text-stone-400">{fmtDate(r.fecha)} · {r.turno}</p>
            </div>
            <span className="text-sm font-semibold text-green-600">+{r.cantidad}</span>
          </div>
        ))}
        {stats.ventasRecientes.map((v, i) => (
          <div key={v.id} className={`flex items-center gap-3 px-4 py-3 border-t border-stone-50`}>
            <span className="text-xl">📤</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-stone-700">{v.cantidadPiezas} vendidos — {v.cliente}</p>
              <p className="text-xs text-stone-400">{fmtDate(v.fecha)}</p>
            </div>
            <span className="text-sm font-semibold text-red-500">-{v.cantidadPiezas}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
