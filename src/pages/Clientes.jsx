import { useState, useEffect, useCallback, useMemo } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useApp } from '../context/AppContext';
import ConfirmDialog from '../components/common/ConfirmDialog';

const qClientes = query(collection(db, 'clientes'), orderBy('nombre', 'asc'));
const qVentas   = query(collection(db, 'ventas'),   orderBy('fecha', 'desc'));

const EMPTY = { nombre: '', telefono: '', unidadNormal: 'docenas', cantidadNormal: '', notas: '' };

export default function Clientes() {
  const { isAdmin, toast } = useApp();
  const [clientes, setClientes] = useState([]);
  const [ventas, setVentas]     = useState([]);
  const [form, setForm]         = useState({ ...EMPTY });
  const [confirmId, setConfirmId] = useState(null);
  const [showForm, setShowForm]   = useState(false);
  const [editId, setEditId]       = useState(null);

  useEffect(() => onSnapshot(qClientes, (s) => setClientes(s.docs.map(d => ({ id: d.id, ...d.data() })))), []);
  useEffect(() => onSnapshot(qVentas,   (s) => setVentas(s.docs.map(d => ({ id: d.id, ...d.data() })))), []);

  // Map clienteId → pending amount
  const pendientesPorCliente = useMemo(() => {
    const map = {};
    ventas
      .filter((v) => !v.cobrado && v.clienteId)
      .forEach((v) => {
        map[v.clienteId] = (map[v.clienteId] || 0) + (v.total || 0);
      });
    return map;
  }, [ventas]);

  const save = useCallback(async () => {
    if (!form.nombre.trim()) { toast('Ingresa el nombre del cliente', 'error'); return; }
    try {
      if (editId) {
        await updateDoc(doc(db, 'clientes', editId), {
          nombre:         form.nombre.trim(),
          telefono:       form.telefono.trim(),
          unidadNormal:   form.unidadNormal,
          cantidadNormal: Number(form.cantidadNormal) || 0,
          notas:          form.notas.trim(),
        });
        toast('Cliente actualizado ✓');
        setEditId(null);
      } else {
        await addDoc(collection(db, 'clientes'), {
          nombre:         form.nombre.trim(),
          telefono:       form.telefono.trim(),
          unidadNormal:   form.unidadNormal,
          cantidadNormal: Number(form.cantidadNormal) || 0,
          notas:          form.notas.trim(),
          creadoEn:       serverTimestamp(),
        });
        toast('Cliente agregado ✓');
      }
      setForm({ ...EMPTY });
      setShowForm(false);
    } catch { toast('Error al guardar', 'error'); }
  }, [form, editId, toast]);

  const startEdit = (c) => {
    setForm({ nombre: c.nombre, telefono: c.telefono || '', unidadNormal: c.unidadNormal || 'docenas', cantidadNormal: String(c.cantidadNormal || ''), notas: c.notas || '' });
    setEditId(c.id);
    setShowForm(true);
  };

  const remove = useCallback(async (id) => {
    try { await deleteDoc(doc(db, 'clientes', id)); toast('Cliente eliminado', 'warning'); }
    catch { toast('Error al eliminar', 'error'); }
    setConfirmId(null);
  }, [toast]);

  const cancelForm = () => { setShowForm(false); setEditId(null); setForm({ ...EMPTY }); };

  return (
    <div className="px-4 pt-4 pb-2 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-stone-800">Clientes 👥</h2>
        <button onClick={() => { cancelForm(); setShowForm((v) => !v); }}
          className="bg-brand-500 text-white text-sm font-semibold px-4 py-2 rounded-2xl active:bg-brand-600">
          + Cliente
        </button>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-4">
          <p className="text-2xl">👤</p>
          <p className="text-2xl font-bold text-stone-800 mt-1">{clientes.length}</p>
          <p className="text-xs text-stone-500">clientes</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-4">
          <p className="text-2xl">💳</p>
          <p className="text-2xl font-bold text-red-500 mt-1">
            ${Object.values(pendientesPorCliente).reduce((s, v) => s + v, 0).toFixed(2)}
          </p>
          <p className="text-xs text-stone-500">saldo pendiente</p>
        </div>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-4 space-y-3">
          <p className="font-semibold text-stone-700">{editId ? 'Editar cliente' : 'Nuevo cliente'}</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-stone-500 font-medium">Nombre *</label>
              <input type="text" value={form.nombre} placeholder="Nombre..."
                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} className="input mt-0.5" />
            </div>
            <div>
              <label className="text-xs text-stone-500 font-medium">Teléfono</label>
              <input type="tel" value={form.telefono} placeholder="555-1234"
                onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))} className="input mt-0.5" />
            </div>
          </div>
          <div>
            <label className="text-xs text-stone-500 font-medium">Compra habitual</label>
            <div className="flex gap-2 mt-0.5">
              {[['piezas','🥚 Piezas'],['docenas','📦 Docenas']].map(([v,l]) => (
                <button key={v} onClick={() => setForm((f) => ({ ...f, unidadNormal: v }))}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors
                    ${form.unidadNormal === v ? 'bg-brand-500 text-white border-brand-500' : 'border-stone-200 text-stone-600'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-stone-500 font-medium">Cantidad habitual</label>
            <input type="number" min="0" value={form.cantidadNormal} placeholder="ej. 2"
              onChange={(e) => setForm((f) => ({ ...f, cantidadNormal: e.target.value }))} className="input mt-0.5" />
          </div>
          <div>
            <label className="text-xs text-stone-500 font-medium">Notas</label>
            <input type="text" value={form.notas} placeholder="Preferencias, dirección..."
              onChange={(e) => setForm((f) => ({ ...f, notas: e.target.value }))} className="input mt-0.5" />
          </div>
          <div className="flex gap-2">
            <button onClick={cancelForm} className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-600 text-sm">Cancelar</button>
            <button onClick={save} className="flex-1 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-semibold">
              {editId ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        </div>
      )}

      {/* Lista */}
      <div className="space-y-2">
        {clientes.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-12">
            <span className="text-5xl">👥</span>
            <p className="text-stone-500 font-medium">Sin clientes registrados</p>
            <p className="text-stone-400 text-sm text-center">Agrega clientes frecuentes para usarlos al registrar ventas</p>
          </div>
        )}
        {clientes.map((c) => {
          const pendiente = pendientesPorCliente[c.id] || 0;
          return (
            <div key={c.id} className="bg-white rounded-2xl shadow-sm border border-stone-100 px-4 py-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-base font-bold text-amber-700 flex-shrink-0">
                  {c.nombre[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-stone-800">{c.nombre}</p>
                    {pendiente > 0 && (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
                        ${pendiente.toFixed(2)} pendiente
                      </span>
                    )}
                  </div>
                  {c.telefono && (
                    <p className="text-xs text-stone-400 mt-0.5">📞 {c.telefono}</p>
                  )}
                  <p className="text-xs text-stone-500 mt-0.5">
                    Habitual: {c.cantidadNormal || '—'} {c.unidadNormal || 'piezas'}
                    {c.notas ? ` · ${c.notas}` : ''}
                  </p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => startEdit(c)}
                    className="w-8 h-8 flex items-center justify-center rounded-xl bg-stone-100 text-stone-500 active:bg-amber-100 text-sm">
                    ✏️
                  </button>
                  {isAdmin && (
                    <button onClick={() => setConfirmId(c.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-xl bg-stone-100 text-stone-400 active:bg-red-100 active:text-red-500 text-lg">
                      ×
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {confirmId && (
        <ConfirmDialog message="¿Eliminar este cliente?" onConfirm={() => remove(confirmId)} onCancel={() => setConfirmId(null)} />
      )}
    </div>
  );
}
