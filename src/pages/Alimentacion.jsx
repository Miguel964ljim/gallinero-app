import { useState, useEffect, useCallback, useMemo } from 'react';
import { getItem, setItem, KEYS } from '../utils/storage';
import { todayISO, fmtDate, uid, isSameMonth } from '../utils/dates';
import { useApp } from '../context/AppContext';
import ConfirmDialog from '../components/common/ConfirmDialog';

const EMPTY = { fecha: '', tipoAlimento: 'Ponedora comercial', cantidadKg: '', costoPorKg: '', notas: '' };

export default function Alimentacion() {
  const { toast } = useApp();
  const [records, setRecords] = useState(() => getItem(KEYS.ALIMENTACION, []));
  const [form, setForm] = useState({ ...EMPTY, fecha: todayISO() });
  const [confirmId, setConfirmId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => setItem(KEYS.ALIMENTACION, records), [records]);

  const save = useCallback(() => {
    if (!form.cantidadKg || Number(form.cantidadKg) <= 0) { toast('Ingresa kg válidos', 'error'); return; }
    if (!form.costoPorKg || Number(form.costoPorKg) <= 0) { toast('Ingresa costo por kg', 'error'); return; }
    const costoTotal = Number(form.cantidadKg) * Number(form.costoPorKg);
    const rec = { ...form, id: uid(), fecha: form.fecha || todayISO(), cantidadKg: Number(form.cantidadKg), costoPorKg: Number(form.costoPorKg), costoTotal };
    setRecords((prev) => [rec, ...prev]);
    setForm({ ...EMPTY, fecha: todayISO() });
    setShowForm(false);
    toast('Consumo registrado ✓');
  }, [form, toast]);

  const remove = useCallback((id) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
    setConfirmId(null);
    toast('Registro eliminado', 'warning');
  }, [toast]);

  const stats = useMemo(() => {
    const mesActual = records.filter((r) => isSameMonth(r.fecha));
    const totalKgMes = mesActual.reduce((s, r) => s + r.cantidadKg, 0);
    const totalCostoMes = mesActual.reduce((s, r) => s + r.costoTotal, 0);
    return { totalKgMes, totalCostoMes };
  }, [records]);

  return (
    <div className="px-4 pt-4 pb-2 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-stone-800">Alimentación 🌾</h2>
        <button onClick={() => setShowForm((v) => !v)}
          className="bg-brand-500 text-white text-sm font-semibold px-4 py-2 rounded-2xl active:bg-brand-600">
          + Registrar
        </button>
      </div>

      {/* Resumen mes */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-r from-amber-400 to-orange-500 rounded-2xl p-4 text-white">
          <p className="text-xs opacity-80">Consumo este mes</p>
          <p className="text-2xl font-bold">{stats.totalKgMes.toFixed(1)} kg</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-4">
          <p className="text-xs text-stone-500">Costo del mes</p>
          <p className="text-2xl font-bold text-amber-700">${stats.totalCostoMes.toFixed(2)}</p>
        </div>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-4 space-y-3">
          <p className="font-semibold text-stone-700">Nuevo registro</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-stone-500 font-medium">Fecha</label>
              <input type="date" value={form.fecha}
                onChange={(e) => setForm((f) => ({ ...f, fecha: e.target.value }))}
                className="input mt-0.5" />
            </div>
            <div>
              <label className="text-xs text-stone-500 font-medium">Tipo de alimento</label>
              <input type="text" value={form.tipoAlimento}
                onChange={(e) => setForm((f) => ({ ...f, tipoAlimento: e.target.value }))}
                className="input mt-0.5" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-stone-500 font-medium">Cantidad (kg)</label>
              <input type="number" min="0" step="0.1" value={form.cantidadKg} placeholder="0"
                onChange={(e) => setForm((f) => ({ ...f, cantidadKg: e.target.value }))}
                className="input mt-0.5" />
            </div>
            <div>
              <label className="text-xs text-stone-500 font-medium">Costo por kg ($)</label>
              <input type="number" min="0" step="0.01" value={form.costoPorKg} placeholder="0.00"
                onChange={(e) => setForm((f) => ({ ...f, costoPorKg: e.target.value }))}
                className="input mt-0.5" />
            </div>
          </div>
          {form.cantidadKg && form.costoPorKg && (
            <div className="bg-amber-50 rounded-xl p-3 flex justify-between">
              <span className="text-sm text-stone-600">Costo total</span>
              <span className="font-bold text-amber-700">${(Number(form.cantidadKg) * Number(form.costoPorKg)).toFixed(2)}</span>
            </div>
          )}
          <div>
            <label className="text-xs text-stone-500 font-medium">Notas</label>
            <input type="text" value={form.notas} placeholder="Opcional..."
              onChange={(e) => setForm((f) => ({ ...f, notas: e.target.value }))}
              className="input mt-0.5" />
          </div>
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

      {/* Historial */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Historial</p>
        {records.length === 0 && <p className="text-center text-stone-400 py-8">Sin registros aún</p>}
        {records.map((r) => (
          <div key={r.id} className="bg-white rounded-2xl shadow-sm border border-stone-100 px-4 py-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-lg flex-shrink-0">🌾</div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-stone-800">{r.tipoAlimento}</p>
              <p className="text-xs text-stone-400">{fmtDate(r.fecha)} · {r.cantidadKg} kg · ${r.costoPorKg}/kg</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-amber-700">${r.costoTotal.toFixed(2)}</p>
              <button onClick={() => setConfirmId(r.id)} className="text-stone-300 text-sm active:text-red-400">× eliminar</button>
            </div>
          </div>
        ))}
      </div>

      {confirmId && (
        <ConfirmDialog message="¿Eliminar este registro?" onConfirm={() => remove(confirmId)} onCancel={() => setConfirmId(null)} />
      )}
    </div>
  );
}
