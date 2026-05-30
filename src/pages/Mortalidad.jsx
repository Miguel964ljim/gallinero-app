import { useState, useEffect, useCallback, useMemo } from 'react';
import { getItem, setItem, KEYS } from '../utils/storage';
import { todayISO, fmtDate, uid } from '../utils/dates';
import { useApp } from '../context/AppContext';
import ConfirmDialog from '../components/common/ConfirmDialog';

const CAUSAS = ['muerte natural', 'enfermedad', 'accidente', 'vendida'];
const CAUSA_EMOJI = { 'muerte natural': '💀', enfermedad: '🤒', accidente: '⚡', vendida: '💰' };

const EMPTY = { fecha: '', causa: 'muerte natural', cantidad: '1', notas: '' };

export default function Mortalidad() {
  const { config, toast } = useApp();
  const [records, setRecords] = useState(() => getItem(KEYS.MORTALIDAD, []));
  const [form, setForm] = useState({ ...EMPTY, fecha: todayISO() });
  const [confirmId, setConfirmId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => setItem(KEYS.MORTALIDAD, records), [records]);

  const totalBajas = useMemo(() => records.reduce((s, r) => s + (r.cantidad || 1), 0), [records]);
  const gallinasActivas = config.gallinasIniciales - totalBajas;

  const save = useCallback(() => {
    const cantidad = Number(form.cantidad);
    if (!cantidad || cantidad <= 0) { toast('Ingresa una cantidad válida', 'error'); return; }
    if (cantidad > gallinasActivas) { toast('No hay suficientes gallinas activas', 'error'); return; }
    const rec = { ...form, id: uid(), fecha: form.fecha || todayISO(), cantidad };
    setRecords((prev) => [rec, ...prev]);
    setForm({ ...EMPTY, fecha: todayISO() });
    setShowForm(false);
    toast('Baja registrada');
  }, [form, gallinasActivas, toast]);

  const remove = useCallback((id) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
    setConfirmId(null);
    toast('Registro eliminado', 'warning');
  }, [toast]);

  const bycausa = useMemo(() => {
    return CAUSAS.map((c) => ({
      causa: c,
      total: records.filter((r) => r.causa === c).reduce((s, r) => s + (r.cantidad || 1), 0),
    }));
  }, [records]);

  return (
    <div className="px-4 pt-4 pb-2 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-stone-800">Bajas 📋</h2>
        <button onClick={() => setShowForm((v) => !v)}
          className="bg-brand-500 text-white text-sm font-semibold px-4 py-2 rounded-2xl active:bg-brand-600">
          + Registrar
        </button>
      </div>

      {/* Conteo de gallinas */}
      <div className="bg-gradient-to-r from-amber-400 to-orange-500 rounded-2xl p-5 text-white">
        <p className="text-sm opacity-90">Gallinas activas</p>
        <p className="text-5xl font-bold">{gallinasActivas}</p>
        <p className="text-sm opacity-75">de {config.gallinasIniciales} iniciales · {totalBajas} bajas totales</p>
      </div>

      {/* Por causa */}
      <div className="grid grid-cols-2 gap-3">
        {bycausa.map((c) => (
          <div key={c.causa} className="bg-white rounded-2xl shadow-sm border border-stone-100 p-3">
            <p className="text-xl">{CAUSA_EMOJI[c.causa]}</p>
            <p className="text-xl font-bold text-stone-800 mt-1">{c.total}</p>
            <p className="text-xs text-stone-500 capitalize">{c.causa}</p>
          </div>
        ))}
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-4 space-y-3">
          <p className="font-semibold text-stone-700">Nueva baja</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-stone-500 font-medium">Fecha</label>
              <input type="date" value={form.fecha}
                onChange={(e) => setForm((f) => ({ ...f, fecha: e.target.value }))}
                className="input mt-0.5" />
            </div>
            <div>
              <label className="text-xs text-stone-500 font-medium">Cantidad</label>
              <input type="number" min="1" value={form.cantidad}
                onChange={(e) => setForm((f) => ({ ...f, cantidad: e.target.value }))}
                className="input mt-0.5" />
            </div>
          </div>
          <div>
            <label className="text-xs text-stone-500 font-medium">Causa</label>
            <select value={form.causa}
              onChange={(e) => setForm((f) => ({ ...f, causa: e.target.value }))}
              className="input mt-0.5">
              {CAUSAS.map((c) => (
                <option key={c} value={c}>{CAUSA_EMOJI[c]} {c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-stone-500 font-medium">Notas</label>
            <input type="text" value={form.notas} placeholder="Descripción..."
              onChange={(e) => setForm((f) => ({ ...f, notas: e.target.value }))}
              className="input mt-0.5" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-600 text-sm">Cancelar</button>
            <button onClick={save} className="flex-1 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-semibold">Guardar</button>
          </div>
        </div>
      )}

      {/* Historial */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Historial de bajas</p>
        {records.length === 0 && <p className="text-center text-stone-400 py-8">Sin bajas registradas</p>}
        {records.map((r) => (
          <div key={r.id} className="bg-white rounded-2xl shadow-sm border border-stone-100 px-4 py-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-lg flex-shrink-0">
              {CAUSA_EMOJI[r.causa] || '📋'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-stone-800 capitalize">{r.causa}</p>
              <p className="text-xs text-stone-400">{fmtDate(r.fecha)} · {r.cantidad} {r.cantidad === 1 ? 'gallina' : 'gallinas'}</p>
              {r.notas && <p className="text-xs text-stone-500">{r.notas}</p>}
            </div>
            <button onClick={() => setConfirmId(r.id)} className="text-stone-300 text-xl px-1 active:text-red-400">×</button>
          </div>
        ))}
      </div>

      {confirmId && (
        <ConfirmDialog message="¿Eliminar esta baja?" onConfirm={() => remove(confirmId)} onCancel={() => setConfirmId(null)} />
      )}
    </div>
  );
}
