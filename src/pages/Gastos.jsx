import { useState, useEffect, useCallback, useMemo } from 'react';
import { getItem, setItem, KEYS } from '../utils/storage';
import { todayISO, fmtDate, uid, isSameWeek, isSameMonth } from '../utils/dates';
import { useApp } from '../context/AppContext';
import ConfirmDialog from '../components/common/ConfirmDialog';

const CATEGORIAS = ['alimento', 'medicamento', 'servicios', 'otros'];
const CAT_EMOJI = { alimento: '🌾', medicamento: '💊', servicios: '🔧', otros: '📌' };

const EMPTY = { fecha: '', categoria: 'alimento', monto: '', descripcion: '' };

export default function Gastos() {
  const { toast } = useApp();
  const [records, setRecords] = useState(() => getItem(KEYS.GASTOS, []));
  const [form, setForm] = useState({ ...EMPTY, fecha: todayISO() });
  const [confirmId, setConfirmId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [filtro, setFiltro] = useState('mes');

  useEffect(() => setItem(KEYS.GASTOS, records), [records]);

  const save = useCallback(() => {
    if (!form.monto || Number(form.monto) <= 0) { toast('Ingresa un monto válido', 'error'); return; }
    if (!form.descripcion.trim()) { toast('Agrega una descripción', 'error'); return; }
    const rec = { ...form, id: uid(), fecha: form.fecha || todayISO(), monto: Number(form.monto) };
    setRecords((prev) => [rec, ...prev]);
    setForm({ ...EMPTY, fecha: todayISO() });
    setShowForm(false);
    toast('Gasto registrado ✓');
  }, [form, toast]);

  const remove = useCallback((id) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
    setConfirmId(null);
    toast('Gasto eliminado', 'warning');
  }, [toast]);

  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (filtro === 'semana') return isSameWeek(r.fecha);
      return isSameMonth(r.fecha);
    });
  }, [records, filtro]);

  const totalPeriodo = filtered.reduce((s, r) => s + r.monto, 0);

  const porCategoria = useMemo(() => {
    return CATEGORIAS.map((cat) => ({
      cat,
      total: filtered.filter((r) => r.categoria === cat).reduce((s, r) => s + r.monto, 0),
    })).filter((c) => c.total > 0);
  }, [filtered]);

  return (
    <div className="px-4 pt-4 pb-2 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-stone-800">Gastos 💸</h2>
        <button onClick={() => setShowForm((v) => !v)}
          className="bg-brand-500 text-white text-sm font-semibold px-4 py-2 rounded-2xl active:bg-brand-600">
          + Gasto
        </button>
      </div>

      {/* Filtro */}
      <div className="flex bg-stone-100 rounded-2xl p-1 gap-1">
        {[['semana', 'Esta semana'], ['mes', 'Este mes']].map(([k, l]) => (
          <button key={k} onClick={() => setFiltro(k)}
            className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-colors
              ${filtro === k ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* Resumen */}
      <div className="bg-gradient-to-r from-amber-400 to-orange-500 rounded-2xl p-4 text-white">
        <p className="text-sm opacity-90">Total {filtro === 'semana' ? 'esta semana' : 'este mes'}</p>
        <p className="text-4xl font-bold">${totalPeriodo.toFixed(2)}</p>
        <p className="text-sm opacity-75">{filtered.length} gastos</p>
      </div>

      {/* Por categoría */}
      {porCategoria.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-4">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">Por categoría</p>
          <div className="space-y-2">
            {porCategoria.map((c) => (
              <div key={c.cat} className="flex items-center gap-3">
                <span className="text-lg w-7">{CAT_EMOJI[c.cat]}</span>
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-0.5">
                    <span className="capitalize text-stone-700">{c.cat}</span>
                    <span className="font-semibold text-stone-800">${c.total.toFixed(2)}</span>
                  </div>
                  <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: `${(c.total / totalPeriodo) * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Formulario */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-4 space-y-3">
          <p className="font-semibold text-stone-700">Nuevo gasto</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-stone-500 font-medium">Fecha</label>
              <input type="date" value={form.fecha}
                onChange={(e) => setForm((f) => ({ ...f, fecha: e.target.value }))}
                className="input mt-0.5" />
            </div>
            <div>
              <label className="text-xs text-stone-500 font-medium">Monto ($)</label>
              <input type="number" min="0" step="0.01" value={form.monto} placeholder="0.00"
                onChange={(e) => setForm((f) => ({ ...f, monto: e.target.value }))}
                className="input mt-0.5" />
            </div>
          </div>
          <div>
            <label className="text-xs text-stone-500 font-medium">Categoría</label>
            <div className="grid grid-cols-2 gap-2 mt-0.5">
              {CATEGORIAS.map((cat) => (
                <button key={cat} onClick={() => setForm((f) => ({ ...f, categoria: cat }))}
                  className={`py-2 rounded-xl text-sm flex items-center justify-center gap-1.5 border transition-colors
                    ${form.categoria === cat ? 'bg-brand-500 text-white border-brand-500' : 'border-stone-200 text-stone-600'}`}>
                  {CAT_EMOJI[cat]} <span className="capitalize">{cat}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-stone-500 font-medium">Descripción</label>
            <input type="text" value={form.descripcion} placeholder="¿En qué se gastó?"
              onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
              className="input mt-0.5" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-600 text-sm">Cancelar</button>
            <button onClick={save} className="flex-1 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-semibold">Guardar</button>
          </div>
        </div>
      )}

      {/* Lista */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Detalle</p>
        {filtered.length === 0 && <p className="text-center text-stone-400 py-8">Sin gastos en este período</p>}
        {filtered.map((r) => (
          <div key={r.id} className="bg-white rounded-2xl shadow-sm border border-stone-100 px-4 py-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-lg flex-shrink-0">
              {CAT_EMOJI[r.categoria]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-stone-800 truncate">{r.descripcion}</p>
              <p className="text-xs text-stone-400">{fmtDate(r.fecha)} · {r.categoria}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-stone-800">${r.monto.toFixed(2)}</span>
              <button onClick={() => setConfirmId(r.id)} className="text-stone-300 text-xl px-0.5 active:text-red-400">×</button>
            </div>
          </div>
        ))}
      </div>

      {confirmId && (
        <ConfirmDialog message="¿Eliminar este gasto?" onConfirm={() => remove(confirmId)} onCancel={() => setConfirmId(null)} />
      )}
    </div>
  );
}
