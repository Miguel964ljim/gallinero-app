import { useState, useEffect, useCallback } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { todayISO, fmtDate, isSameDay } from '../utils/dates';
import { useApp } from '../context/AppContext';
import ConfirmDialog from '../components/common/ConfirmDialog';

const q = query(collection(db, 'produccion'), orderBy('fecha', 'desc'));
const EMPTY = { fecha: '', turno: 'mañana', cantidad: '', usuario: '', notas: '' };

export default function Produccion() {
  const { config, isAdmin, toast } = useApp();
  const [records, setRecords] = useState([]);
  const [form, setForm]       = useState({ ...EMPTY, fecha: todayISO() });
  const [confirmId, setConfirmId] = useState(null);
  const [showForm, setShowForm]   = useState(false);

  useEffect(() => onSnapshot(q, (s) => setRecords(s.docs.map(d => ({ id: d.id, ...d.data() })))), []);

  // Sync first user into form when config loads
  useEffect(() => {
    if (config?.usuarios?.[0] && !form.usuario)
      setForm((f) => ({ ...f, usuario: config.usuarios[0] }));
  }, [config]);

  const save = useCallback(async () => {
    const n = Number(form.cantidad);
    if (!n || n < 0) { toast('Ingresa una cantidad válida', 'error'); return; }
    try {
      await addDoc(collection(db, 'produccion'), {
        fecha:    form.fecha || todayISO(),
        turno:    form.turno,
        cantidad: n,
        usuario:  form.usuario,
        notas:    form.notas,
        creadoEn: serverTimestamp(),
      });
      setForm({ ...EMPTY, fecha: todayISO(), usuario: config?.usuarios?.[0] || '' });
      setShowForm(false);
      toast('Producción registrada ✓');
    } catch { toast('Error al guardar', 'error'); }
  }, [form, config, toast]);

  const remove = useCallback(async (id) => {
    try { await deleteDoc(doc(db, 'produccion', id)); toast('Registro eliminado', 'warning'); }
    catch { toast('Error al eliminar', 'error'); }
    setConfirmId(null);
  }, [toast]);

  const today = todayISO();
  const todayRecords = records.filter((r) => isSameDay(r.fecha, today));
  const totalHoy = todayRecords.reduce((s, r) => s + r.cantidad, 0);

  return (
    <div className="px-4 pt-4 pb-2 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-stone-800">Producción 🥚</h2>
        <button onClick={() => setShowForm((v) => !v)}
          className="bg-brand-500 text-white text-sm font-semibold px-4 py-2 rounded-2xl active:bg-brand-600">
          + Registrar
        </button>
      </div>

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
                {(config?.usuarios || []).map((u) => <option key={u}>{u}</option>)}
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

      <div className="space-y-2">
        <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Historial</p>
        {records.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-10">
            <span className="text-5xl">🥚</span>
            <p className="text-stone-400 text-sm">Sin registros aún</p>
          </div>
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
            {isAdmin && (
              <button onClick={() => setConfirmId(r.id)} className="text-stone-300 text-xl px-1 active:text-red-400">×</button>
            )}
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
