import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, updateDoc, doc, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useApp, DEFAULT_CONFIG } from '../context/AppContext';

const qUsuarios = query(collection(db, 'usuarios'));

export default function Configuracion() {
  const { config, updateConfig, isAdmin, userProfile, toast } = useApp();
  const [form, setForm]       = useState({ ...DEFAULT_CONFIG, ...config });
  const [usuarios, setUsuarios] = useState([]);
  const [saving, setSaving]   = useState(false);

  // Keep form in sync with Firestore config (real-time)
  useEffect(() => { setForm({ ...DEFAULT_CONFIG, ...config }); }, [config]);

  // Users list (admin only)
  useEffect(() => {
    if (!isAdmin) return;
    return onSnapshot(qUsuarios, (s) =>
      setUsuarios(s.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="px-4 pt-4 pb-2">
        <h2 className="text-xl font-bold text-stone-800 mb-6">Configuración ⚙️</h2>
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-8 text-center">
          <p className="text-4xl mb-3">🔒</p>
          <p className="font-semibold text-stone-700">Acceso restringido</p>
          <p className="text-sm text-stone-500 mt-1">Solo el administrador puede editar la configuración.</p>
        </div>
      </div>
    );
  }

  const save = async () => {
    setSaving(true);
    try {
      await updateConfig({
        usuarios:          form.usuarios,
        gallinasIniciales: Number(form.gallinasIniciales),
        precioPorPieza:    Number(form.precioPorPieza),
        precioPorDocena:   Number(form.precioPorDocena),
        umbralStockBajo:   Number(form.umbralStockBajo),
      });
      toast('Configuración guardada ✓');
    } catch { toast('Error al guardar', 'error'); }
    setSaving(false);
  };

  const changeRole = async (uid, newRol) => {
    try { await updateDoc(doc(db, 'usuarios', uid), { rol: newRol }); toast(`Rol actualizado a ${newRol}`); }
    catch { toast('Error al actualizar rol', 'error'); }
  };

  const toggleActivo = async (uid, current) => {
    try {
      await updateDoc(doc(db, 'usuarios', uid), { activo: !current });
      toast(!current ? 'Usuario reactivado' : 'Usuario desactivado', !current ? 'success' : 'warning');
    } catch { toast('Error', 'error'); }
  };

  const handleExport = async () => {
    try {
      const colecciones = ['produccion','ventas','alimentacion','vacunas','enfermedades','mortalidad','gastos','clientes','config'];
      const data = {};
      for (const col of colecciones) {
        const snap = await getDocs(collection(db, col));
        data[col] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      }
      const json = JSON.stringify(data, null, 2);
      const url  = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
      const a    = Object.assign(document.createElement('a'), { href: url, download: `gallinero-backup-${new Date().toISOString().split('T')[0]}.json` });
      a.click();
      URL.revokeObjectURL(url);
      toast('Datos exportados ✓');
    } catch { toast('Error al exportar', 'error'); }
  };

  return (
    <div className="px-4 pt-4 pb-2 space-y-4">
      <h2 className="text-xl font-bold text-stone-800">Configuración ⚙️</h2>

      {/* Usuarios del sistema */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-4 space-y-3">
        <p className="font-semibold text-stone-700">👥 Nombres de usuario</p>
        {[0, 1].map((i) => (
          <div key={i}>
            <label className="text-xs text-stone-500 font-medium">Usuario {i + 1}</label>
            <input type="text" value={form.usuarios?.[i] || ''}
              onChange={(e) => {
                const u = [...(form.usuarios || ['', ''])];
                u[i] = e.target.value;
                setForm((f) => ({ ...f, usuarios: u }));
              }}
              className="input mt-0.5" />
          </div>
        ))}
      </div>

      {/* Gallinero */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-4 space-y-3">
        <p className="font-semibold text-stone-700">🐔 Gallinero</p>
        <div>
          <label className="text-xs text-stone-500 font-medium">Número inicial de gallinas</label>
          <input type="number" min="1" value={form.gallinasIniciales}
            onChange={(e) => setForm((f) => ({ ...f, gallinasIniciales: e.target.value }))} className="input mt-0.5" />
        </div>
      </div>

      {/* Precios */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-4 space-y-3">
        <p className="font-semibold text-stone-700">💰 Precios por defecto</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-stone-500 font-medium">Por pieza ($)</label>
            <input type="number" min="0" step="0.01" value={form.precioPorPieza}
              onChange={(e) => setForm((f) => ({ ...f, precioPorPieza: e.target.value }))} className="input mt-0.5" />
          </div>
          <div>
            <label className="text-xs text-stone-500 font-medium">Por docena ($)</label>
            <input type="number" min="0" step="0.01" value={form.precioPorDocena}
              onChange={(e) => setForm((f) => ({ ...f, precioPorDocena: e.target.value }))} className="input mt-0.5" />
          </div>
        </div>
      </div>

      {/* Alertas */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-4 space-y-3">
        <p className="font-semibold text-stone-700">🔔 Alertas</p>
        <div>
          <label className="text-xs text-stone-500 font-medium">Alerta de stock bajo (huevos)</label>
          <input type="number" min="0" value={form.umbralStockBajo}
            onChange={(e) => setForm((f) => ({ ...f, umbralStockBajo: e.target.value }))} className="input mt-0.5" />
        </div>
      </div>

      <button onClick={save} disabled={saving}
        className="w-full py-3.5 rounded-2xl bg-brand-500 text-white font-semibold text-base active:bg-brand-600 disabled:opacity-60 shadow-sm">
        {saving ? 'Guardando...' : 'Guardar configuración'}
      </button>

      {/* Gestión de usuarios */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-100">
        <p className="font-semibold text-stone-700 px-4 pt-4 pb-2">👤 Usuarios registrados</p>
        {usuarios.length === 0 && (
          <p className="text-center text-stone-400 text-sm py-4">Sin usuarios</p>
        )}
        {usuarios.map((u, i) => (
          <div key={u.id} className={`px-4 py-3 flex items-center gap-3 ${i > 0 ? 'border-t border-stone-50' : ''}`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0
              ${u.activo ? 'bg-amber-100 text-amber-700' : 'bg-stone-100 text-stone-400'}`}>
              {(u.nombre || u.email || '?')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-stone-800 truncate">{u.nombre || u.email}</p>
              <p className="text-xs text-stone-400 truncate">{u.email}</p>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              {/* Role toggle */}
              {u.id !== userProfile?.uid && (
                <select
                  value={u.rol}
                  onChange={(e) => changeRole(u.id, e.target.value)}
                  className="text-xs border border-stone-200 rounded-lg px-2 py-1 bg-white text-stone-700"
                >
                  <option value="admin">Admin</option>
                  <option value="colaborador">Colaborador</option>
                </select>
              )}
              {u.id === userProfile?.uid && (
                <span className="text-xs text-brand-500 font-medium px-2">{u.rol} (tú)</span>
              )}
              {/* Active toggle */}
              {u.id !== userProfile?.uid && (
                <button
                  onClick={() => toggleActivo(u.id, u.activo)}
                  className={`text-xs px-2 py-0.5 rounded-full font-medium
                    ${u.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}
                >
                  {u.activo ? 'Activo' : 'Inactivo'}
                </button>
              )}
            </div>
          </div>
        ))}
        <p className="text-xs text-stone-400 px-4 pb-3 pt-1">
          Para crear nuevos usuarios, usa la consola de Firebase Authentication.
        </p>
      </div>

      {/* Exportar */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-4">
        <p className="font-semibold text-stone-700 mb-1">💾 Respaldo de datos</p>
        <p className="text-xs text-stone-500 mb-3">Descarga todos los datos como archivo JSON.</p>
        <button onClick={handleExport}
          className="w-full py-3 rounded-xl border-2 border-dashed border-amber-300 text-amber-700 font-medium text-sm active:bg-amber-50">
          Exportar datos JSON
        </button>
      </div>
    </div>
  );
}
