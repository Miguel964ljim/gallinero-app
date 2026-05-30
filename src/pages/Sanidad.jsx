import { useState, useEffect, useCallback } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { todayISO, fmtDate, daysBetween } from '../utils/dates';
import { useApp } from '../context/AppContext';
import ConfirmDialog from '../components/common/ConfirmDialog';

const qVac = query(collection(db, 'vacunas'),      orderBy('fechaAplicada', 'desc'));
const qEnf = query(collection(db, 'enfermedades'), orderBy('fecha', 'desc'));

const EMPTY_VAC = { nombre: '', fechaAplicada: '', proximaDosis: '', notas: '' };
const EMPTY_ENF = { fecha: '', descripcion: '', tratamiento: '', gallinasAfectadas: '', resuelta: false };

export default function Sanidad() {
  const { isAdmin, toast } = useApp();
  const [vacunas, setVacunas]           = useState([]);
  const [enfermedades, setEnfermedades] = useState([]);
  const [tab, setTab]       = useState('vacunas');
  const [showForm, setShowForm] = useState(false);
  const [formVac, setFormVac]   = useState({ ...EMPTY_VAC, fechaAplicada: todayISO() });
  const [formEnf, setFormEnf]   = useState({ ...EMPTY_ENF, fecha: todayISO() });
  const [confirmId, setConfirmId] = useState(null);

  useEffect(() => onSnapshot(qVac, (s) => setVacunas(s.docs.map(d => ({ id: d.id, ...d.data() })))), []);
  useEffect(() => onSnapshot(qEnf, (s) => setEnfermedades(s.docs.map(d => ({ id: d.id, ...d.data() })))), []);

  const saveVacuna = useCallback(async () => {
    if (!formVac.nombre.trim()) { toast('Ingresa el nombre de la vacuna', 'error'); return; }
    if (!formVac.fechaAplicada)  { toast('Ingresa la fecha de aplicación', 'error'); return; }
    try {
      await addDoc(collection(db, 'vacunas'), { ...formVac, creadoEn: serverTimestamp() });
      setFormVac({ ...EMPTY_VAC, fechaAplicada: todayISO() });
      setShowForm(false);
      toast('Vacuna registrada ✓');
    } catch { toast('Error al guardar', 'error'); }
  }, [formVac, toast]);

  const saveEnfermedad = useCallback(async () => {
    if (!formEnf.descripcion.trim()) { toast('Describe la enfermedad', 'error'); return; }
    try {
      await addDoc(collection(db, 'enfermedades'), {
        ...formEnf,
        fecha: formEnf.fecha || todayISO(),
        gallinasAfectadas: Number(formEnf.gallinasAfectadas) || 0,
        creadoEn: serverTimestamp(),
      });
      setFormEnf({ ...EMPTY_ENF, fecha: todayISO() });
      setShowForm(false);
      toast('Enfermedad registrada ✓');
    } catch { toast('Error al guardar', 'error'); }
  }, [formEnf, toast]);

  const remove = useCallback(async (rawId) => {
    const [col, id] = rawId.includes(':') ? rawId.split(':') : ['vacunas', rawId];
    try { await deleteDoc(doc(db, col, id)); toast('Eliminado', 'warning'); }
    catch { toast('Error al eliminar', 'error'); }
    setConfirmId(null);
  }, [toast]);

  const toggleResuelta = useCallback(async (id, current) => {
    try { await updateDoc(doc(db, 'enfermedades', id), { resuelta: !current }); }
    catch { toast('Error', 'error'); }
  }, [toast]);

  const today = todayISO();
  const vacunaStatus = (v) => {
    if (!v.proximaDosis) return null;
    const dias = daysBetween(today, v.proximaDosis);
    if (dias < 0)   return { label: 'Vencida', color: 'bg-red-100 text-red-600' };
    if (dias <= 7)  return { label: `${dias}d`, color: 'bg-orange-100 text-orange-600' };
    return           { label: `${dias}d`,        color: 'bg-green-100 text-green-600' };
  };

  return (
    <div className="px-4 pt-4 pb-2 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-stone-800">Sanidad 💉</h2>
        <button onClick={() => setShowForm((v) => !v)}
          className="bg-brand-500 text-white text-sm font-semibold px-4 py-2 rounded-2xl active:bg-brand-600">
          + Registrar
        </button>
      </div>

      <div className="flex bg-stone-100 rounded-2xl p-1 gap-1">
        {[['vacunas','💉 Vacunas'],['enfermedades','🤒 Enfermedades']].map(([k,l]) => (
          <button key={k} onClick={() => { setTab(k); setShowForm(false); }}
            className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-colors
              ${tab === k ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500'}`}>{l}</button>
        ))}
      </div>

      {/* Vacunas form */}
      {showForm && tab === 'vacunas' && (
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-4 space-y-3">
          <p className="font-semibold text-stone-700">Nueva vacuna</p>
          <div>
            <label className="text-xs text-stone-500 font-medium">Nombre</label>
            <input type="text" value={formVac.nombre} placeholder="ej. Newcastle, Marek..."
              onChange={(e) => setFormVac((f) => ({ ...f, nombre: e.target.value }))} className="input mt-0.5" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-stone-500 font-medium">Fecha aplicada</label>
              <input type="date" value={formVac.fechaAplicada}
                onChange={(e) => setFormVac((f) => ({ ...f, fechaAplicada: e.target.value }))} className="input mt-0.5" />
            </div>
            <div>
              <label className="text-xs text-stone-500 font-medium">Próxima dosis</label>
              <input type="date" value={formVac.proximaDosis}
                onChange={(e) => setFormVac((f) => ({ ...f, proximaDosis: e.target.value }))} className="input mt-0.5" />
            </div>
          </div>
          <div>
            <label className="text-xs text-stone-500 font-medium">Notas</label>
            <input type="text" value={formVac.notas} placeholder="Opcional..."
              onChange={(e) => setFormVac((f) => ({ ...f, notas: e.target.value }))} className="input mt-0.5" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-600 text-sm">Cancelar</button>
            <button onClick={saveVacuna} className="flex-1 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-semibold">Guardar</button>
          </div>
        </div>
      )}

      {/* Enfermedades form */}
      {showForm && tab === 'enfermedades' && (
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-4 space-y-3">
          <p className="font-semibold text-stone-700">Nueva enfermedad</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-stone-500 font-medium">Fecha</label>
              <input type="date" value={formEnf.fecha}
                onChange={(e) => setFormEnf((f) => ({ ...f, fecha: e.target.value }))} className="input mt-0.5" />
            </div>
            <div>
              <label className="text-xs text-stone-500 font-medium">Gallinas afectadas</label>
              <input type="number" min="0" value={formEnf.gallinasAfectadas} placeholder="0"
                onChange={(e) => setFormEnf((f) => ({ ...f, gallinasAfectadas: e.target.value }))} className="input mt-0.5" />
            </div>
          </div>
          <div>
            <label className="text-xs text-stone-500 font-medium">Descripción</label>
            <input type="text" value={formEnf.descripcion} placeholder="Síntomas..."
              onChange={(e) => setFormEnf((f) => ({ ...f, descripcion: e.target.value }))} className="input mt-0.5" />
          </div>
          <div>
            <label className="text-xs text-stone-500 font-medium">Tratamiento</label>
            <input type="text" value={formEnf.tratamiento} placeholder="Medicamento o acción..."
              onChange={(e) => setFormEnf((f) => ({ ...f, tratamiento: e.target.value }))} className="input mt-0.5" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-600 text-sm">Cancelar</button>
            <button onClick={saveEnfermedad} className="flex-1 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-semibold">Guardar</button>
          </div>
        </div>
      )}

      {/* Vacunas list */}
      {tab === 'vacunas' && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Vacunas registradas</p>
          {vacunas.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-10">
              <span className="text-5xl">💉</span>
              <p className="text-stone-400 text-sm">Sin vacunas registradas</p>
            </div>
          )}
          {vacunas.map((v) => {
            const st = vacunaStatus(v);
            return (
              <div key={v.id} className="bg-white rounded-2xl shadow-sm border border-stone-100 px-4 py-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-stone-800">{v.nombre}</p>
                    <p className="text-xs text-stone-400 mt-0.5">Aplicada: {fmtDate(v.fechaAplicada)}</p>
                    {v.proximaDosis && <p className="text-xs text-stone-400">Próxima: {fmtDate(v.proximaDosis)}</p>}
                    {v.notas && <p className="text-xs text-stone-400">{v.notas}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {st && <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.color}`}>prox. {st.label}</span>}
                    {isAdmin && <button onClick={() => setConfirmId(`vacunas:${v.id}`)} className="text-stone-300 text-xs active:text-red-400">× eliminar</button>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Enfermedades list */}
      {tab === 'enfermedades' && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Enfermedades</p>
          {enfermedades.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-10">
              <span className="text-5xl">🤒</span>
              <p className="text-stone-400 text-sm">Sin registros</p>
            </div>
          )}
          {enfermedades.map((e) => (
            <div key={e.id} className="bg-white rounded-2xl shadow-sm border border-stone-100 px-4 py-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-stone-800">{e.descripcion}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${e.resuelta ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                      {e.resuelta ? 'Resuelta' : 'Activa'}
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 mt-0.5">{fmtDate(e.fecha)} · {e.gallinasAfectadas} gallinas</p>
                  {e.tratamiento && <p className="text-xs text-stone-500 mt-0.5">Tto: {e.tratamiento}</p>}
                </div>
                {isAdmin && <button onClick={() => setConfirmId(`enfermedades:${e.id}`)} className="text-stone-300 text-xl px-1 active:text-red-400">×</button>}
              </div>
              <button onClick={() => toggleResuelta(e.id, e.resuelta)}
                className={`mt-2 w-full py-1.5 rounded-xl text-xs font-medium border
                  ${e.resuelta ? 'border-stone-200 text-stone-500' : 'border-green-200 text-green-600 bg-green-50'}`}>
                {e.resuelta ? 'Marcar como activa' : '✓ Marcar como resuelta'}
              </button>
            </div>
          ))}
        </div>
      )}

      {confirmId && (
        <ConfirmDialog message="¿Eliminar este registro?" onConfirm={() => remove(confirmId)} onCancel={() => setConfirmId(null)} />
      )}
    </div>
  );
}
