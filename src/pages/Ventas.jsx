import { useState, useEffect, useCallback, useMemo } from 'react';
import { getItem, setItem, KEYS } from '../utils/storage';
import { todayISO, fmtDate, uid, isSameDay, isSameWeek, isSameMonth } from '../utils/dates';
import { useApp } from '../context/AppContext';
import ConfirmDialog from '../components/common/ConfirmDialog';

const EMPTY = { fecha: '', cliente: '', cantidad: '', unidad: 'piezas', precioUnitario: '', cobrado: false, notas: '' };

export default function Ventas() {
  const { config, toast } = useApp();
  const [records, setRecords] = useState(() => getItem(KEYS.VENTAS, []));
  const [form, setForm] = useState({ ...EMPTY, fecha: todayISO(), precioUnitario: config.precioPorPieza });
  const [confirmId, setConfirmId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [filtro, setFiltro] = useState('dia');

  useEffect(() => setItem(KEYS.VENTAS, records), [records]);

  const cantidadPiezas = useMemo(() => {
    const n = Number(form.cantidad) || 0;
    return form.unidad === 'docenas' ? n * 12 : n;
  }, [form.cantidad, form.unidad]);

  const total = useMemo(() => {
    return (Number(form.precioUnitario) || 0) * (Number(form.cantidad) || 0);
  }, [form.precioUnitario, form.cantidad]);

  const save = useCallback(() => {
    if (!form.cliente.trim()) { toast('Ingresa el nombre del cliente', 'error'); return; }
    if (!form.cantidad || Number(form.cantidad) <= 0) { toast('Ingresa una cantidad válida', 'error'); return; }
    if (!form.precioUnitario || Number(form.precioUnitario) <= 0) { toast('Ingresa un precio válido', 'error'); return; }
    const rec = {
      ...form,
      id: uid(),
      fecha: form.fecha || todayISO(),
      cantidad: Number(form.cantidad),
      cantidadPiezas,
      precioUnitario: Number(form.precioUnitario),
      total,
    };
    setRecords((prev) => [rec, ...prev]);
    setForm({ ...EMPTY, fecha: todayISO(), precioUnitario: config.precioPorPieza });
    setShowForm(false);
    toast('Venta registrada ✓');
  }, [form, cantidadPiezas, total, config, toast]);

  const remove = useCallback((id) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
    setConfirmId(null);
    toast('Venta eliminada', 'warning');
  }, [toast]);

  const toggleCobrado = useCallback((id) => {
    setRecords((prev) => prev.map((r) => r.id === id ? { ...r, cobrado: !r.cobrado } : r));
  }, []);

  const filtered = useMemo(() => {
    const today = todayISO();
    return records.filter((r) => {
      if (filtro === 'dia') return isSameDay(r.fecha, today);
      if (filtro === 'semana') return isSameWeek(r.fecha);
      return isSameMonth(r.fecha);
    });
  }, [records, filtro]);

  const totalPeriodo = filtered.reduce((s, r) => s + r.total, 0);
  const pendiente = filtered.filter((r) => !r.cobrado).reduce((s, r) => s + r.total, 0);

  const handleUnidadChange = (unidad) => {
    const precio = unidad === 'docenas' ? config.precioPorDocena : config.precioPorPieza;
    setForm((f) => ({ ...f, unidad, precioUnitario: precio }));
  };

  return (
    <div className="px-4 pt-4 pb-2 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-stone-800">Ventas 💰</h2>
        <button onClick={() => setShowForm((v) => !v)}
          className="bg-brand-500 text-white text-sm font-semibold px-4 py-2 rounded-2xl active:bg-brand-600">
          + Venta
        </button>
      </div>

      {/* Filtro */}
      <div className="flex bg-stone-100 rounded-2xl p-1 gap-1">
        {[['dia', 'Hoy'], ['semana', 'Semana'], ['mes', 'Mes']].map(([k, l]) => (
          <button key={k} onClick={() => setFiltro(k)}
            className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-colors
              ${filtro === k ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-r from-amber-400 to-orange-500 rounded-2xl p-4 text-white">
          <p className="text-xs opacity-80">Ingreso total</p>
          <p className="text-2xl font-bold">${totalPeriodo.toFixed(2)}</p>
          <p className="text-xs opacity-75">{filtered.length} ventas</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-4">
          <p className="text-xs text-stone-500">Por cobrar</p>
          <p className="text-2xl font-bold text-red-500">${pendiente.toFixed(2)}</p>
          <p className="text-xs text-stone-400">{filtered.filter((r) => !r.cobrado).length} pendientes</p>
        </div>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-4 space-y-3">
          <p className="font-semibold text-stone-700">Nueva venta</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-stone-500 font-medium">Fecha</label>
              <input type="date" value={form.fecha}
                onChange={(e) => setForm((f) => ({ ...f, fecha: e.target.value }))}
                className="input mt-0.5" />
            </div>
            <div>
              <label className="text-xs text-stone-500 font-medium">Cliente</label>
              <input type="text" value={form.cliente} placeholder="Nombre..."
                onChange={(e) => setForm((f) => ({ ...f, cliente: e.target.value }))}
                className="input mt-0.5" />
            </div>
          </div>
          <div>
            <label className="text-xs text-stone-500 font-medium">Unidad de venta</label>
            <div className="flex gap-2 mt-0.5">
              {[['piezas', '🥚 Piezas'], ['docenas', '📦 Docenas']].map(([v, l]) => (
                <button key={v} onClick={() => handleUnidadChange(v)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors
                    ${form.unidad === v ? 'bg-brand-500 text-white border-brand-500' : 'border-stone-200 text-stone-600'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-stone-500 font-medium">Cantidad</label>
              <input type="number" min="0" value={form.cantidad} placeholder="0"
                onChange={(e) => setForm((f) => ({ ...f, cantidad: e.target.value }))}
                className="input mt-0.5" />
              {form.unidad === 'docenas' && form.cantidad && (
                <p className="text-xs text-stone-400 mt-0.5">= {cantidadPiezas} piezas</p>
              )}
            </div>
            <div>
              <label className="text-xs text-stone-500 font-medium">Precio unitario</label>
              <input type="number" min="0" step="0.01" value={form.precioUnitario} placeholder="0.00"
                onChange={(e) => setForm((f) => ({ ...f, precioUnitario: e.target.value }))}
                className="input mt-0.5" />
            </div>
          </div>
          {form.cantidad && form.precioUnitario && (
            <div className="bg-amber-50 rounded-xl p-3 flex justify-between items-center">
              <span className="text-sm text-stone-600">Total</span>
              <span className="text-xl font-bold text-amber-700">${total.toFixed(2)}</span>
            </div>
          )}
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.cobrado}
              onChange={(e) => setForm((f) => ({ ...f, cobrado: e.target.checked }))}
              className="rounded" />
            <span className="text-sm text-stone-600">Ya fue cobrado</span>
          </label>
          <div className="flex gap-2 pt-1">
            <button onClick={() => setShowForm(false)}
              className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-600 text-sm font-medium">
              Cancelar
            </button>
            <button onClick={save}
              className="flex-1 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-semibold">
              Guardar
            </button>
          </div>
        </div>
      )}

      {/* Lista */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <p className="text-center text-stone-400 py-8">Sin ventas en este período</p>
        )}
        {filtered.map((r) => (
          <div key={r.id} className="bg-white rounded-2xl shadow-sm border border-stone-100 px-4 py-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-stone-800">{r.cliente}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                    ${r.cobrado ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                    {r.cobrado ? 'Cobrado' : 'Pendiente'}
                  </span>
                </div>
                <p className="text-xs text-stone-400 mt-0.5">
                  {fmtDate(r.fecha)} · {r.cantidadPiezas} piezas ({r.cantidad} {r.unidad})
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-amber-700">${r.total.toFixed(2)}</span>
                <button onClick={() => setConfirmId(r.id)} className="text-stone-300 text-xl px-0.5 active:text-red-400">×</button>
              </div>
            </div>
            <button onClick={() => toggleCobrado(r.id)}
              className={`mt-2 w-full py-1.5 rounded-xl text-xs font-medium border transition-colors
                ${r.cobrado ? 'border-green-200 text-green-600 bg-green-50' : 'border-stone-200 text-stone-500'}`}>
              {r.cobrado ? '✓ Marcar como pendiente' : 'Marcar como cobrado'}
            </button>
          </div>
        ))}
      </div>

      {confirmId && (
        <ConfirmDialog
          message="¿Eliminar esta venta?"
          onConfirm={() => remove(confirmId)}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  );
}
