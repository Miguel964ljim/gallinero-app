import { useState, useEffect, useCallback } from 'react';
import { getItem, setItem, KEYS } from '../utils/storage';
import { todayISO, fmtDate, uid, isSameDay } from '../utils/dates';
import { useApp } from '../context/AppContext';
import ConfirmDialog from '../components/common/ConfirmDialog';

const EMPTY_FORM = { fecha: '', turno: 'mañana', cantidad: '', usuario: '', notas: '' };

export default function Produccion() {
  const { config, toast } = useApp();
  const [records, setRecords] = useState(() => getItem(KEYS.PRODUCCION, []));
  const [form, setForm] = useState({ ...EMPTY_FORM, fecha: todayISO(), usuario: config.usuarios[0] });
  const [confirmId, setConfirmId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => setItem(KEYS.PRODUCCION, records), [records]);

  const save = useCallback(() => {
    if (!form.cantidad || isNaN(Number(form.cantidad)) || Number(form.cantidad) < 0) {
      toast('Ingresa una cantidad válida', 'error');
      return;
    }
    const rec = { ...form, id: uid(), cantidad: Number(form.cantidad), fecha: form.fecha || todayISO() };
    setRecords((prev) => [rec, ...prev]);
    setForm({ ...EMPTY_FORM, fecha: todayISO(), usuario: config.usuarios[0] });
    setShowForm(false);
    toast('Producción registrada ✓');
  }, [form, config, toast]);

  const remove = useCallback((id) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
    setConfirmId(null);
    toast('Registro eliminado', 'warning');
  }, [toast]);

  const todayRecords = records.filter((r) => isSameDay(r.fecha, todayISO()));
  const totalHoy = todayRecords.reduce((s, r) => s + r.cantidad, 0);

  return (
    <div className="px-4 pt-4 pb-2 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-stone-800">Producción 🥚</h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-brand-500 text-white text-sm font-semibold px-4 py-2 rounded-2xl active:bg-brand-600"
        >
          + Registrar
        </button>
      </div>

      {/* Resumen del día */}
      <div className="bg-gradient-to-r from-amber-400 to-orange-500 rounded-2xl p-4 text-white">
        <p className="text-sm font-medium opacity-90">Total hoy</p>
        <p className="text-5xl font-bold">{totalHoy}</p>
        <p className="text-sm opacity-75">huevos recolectados</p>
        <div className="flex gap-3 mt-2">
          {['mañana', 'tarde'].map((t) => {
            const n = todayRecords.filter((r) => r.turno === t).reduce((s, r) => s + r.cantidad, 0);
            return (
              <div key={t} className="bg-white/20 rounded-xl px-3 py-1">
                <span className="text-xs font-medium">{t === 'mañana' ? '☀️' : '🌙'} {t}: {n}</span>
              </div>
            );
          })}
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
              <label className="text-xs text-stone-500 font-medium">Cantidad</label>
              <input type="number" min="0" value={form.cantidad} placeholder="0"
                onChange={(e) => setForm((f) => ({ ...f, cantidad: e.target.value }))}
                className="input mt-0.5" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-stone-500 font-medium">Turno</label>
              <select value={form.turno}
                onChange={(e) => setForm((f) => ({ ...f, turno: e.target.value }))}
                className="input mt-0.5">
                <option value="mañana">☀️ Mañana</option>
                <option value="tarde">🌙 Tarde</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-stone-500 font-medium">Quién registra</label>
              <select value={form.usuario}
                onChange={(e) => setForm((f) => ({ ...f, usuario: e.target.value }))}
                className="input mt-0.5">
                {config.usuarios.map((u) => <option key={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-stone-500 font-medium">Notas (opcional)</label>
            <input type="text" value={form.notas} placeholder="Observaciones..."
              onChange={(e) => setForm((f) => ({ ...f, notas: e.target.value }))}
              className="input mt-0.5" />
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={() => setShowForm(false)}
              className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-600 text-sm font-medium active:bg-stone-50">
              Cancelar
            </button>
            <button onClick={save}
              className="flex-1 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-semibold active:bg-brand-600">
              Guardar
            </button>
          </div>
        </div>
      )}

      {/* Historial */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Historial</p>
        {records.length === 0 && (
          <p className="text-center text-stone-400 py-8">Sin registros aún</p>
        )}
        {records.map((r) => (
          <div key={r.id} className="bg-white rounded-2xl shadow-sm border border-stone-100 px-4 py-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-lg flex-shrink-0">
              {r.turno === 'mañana' ? '☀️' : '🌙'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-stone-800">{r.cantidad}</span>
                <span className="text-xs text-stone-500">huevos</span>
              </div>
              <p className="text-xs text-stone-400">
                {fmtDate(r.fecha)} · {r.turno} · {r.usuario}
                {r.notas ? ` · ${r.notas}` : ''}
              </p>
            </div>
            <button onClick={() => setConfirmId(r.id)} className="text-stone-300 text-xl px-1 active:text-red-400">×</button>
          </div>
        ))}
      </div>

      {confirmId && (
        <ConfirmDialog
          message="¿Eliminar este registro de producción?"
          onConfirm={() => remove(confirmId)}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  );
}
