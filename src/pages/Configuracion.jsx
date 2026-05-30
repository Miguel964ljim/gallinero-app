import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { exportAll } from '../utils/storage';

export default function Configuracion() {
  const { config, updateConfig, toast } = useApp();
  const [form, setForm] = useState({ ...config });

  const save = () => {
    if (!form.usuarios[0]?.trim() || !form.usuarios[1]?.trim()) {
      toast('Los nombres de usuario no pueden estar vacíos', 'error');
      return;
    }
    if (Number(form.gallinasIniciales) <= 0) {
      toast('El número de gallinas debe ser mayor a 0', 'error');
      return;
    }
    updateConfig({
      ...form,
      gallinasIniciales: Number(form.gallinasIniciales),
      precioPorPieza: Number(form.precioPorPieza),
      precioPorDocena: Number(form.precioPorDocena),
      umbralStockBajo: Number(form.umbralStockBajo),
    });
    toast('Configuración guardada ✓');
  };

  const handleExport = () => {
    const data = exportAll();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gallinero-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Datos exportados ✓');
  };

  return (
    <div className="px-4 pt-4 pb-2 space-y-4">
      <h2 className="text-xl font-bold text-stone-800">Configuración ⚙️</h2>

      {/* Usuarios */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-4 space-y-3">
        <p className="font-semibold text-stone-700">👥 Usuarios</p>
        <div>
          <label className="text-xs text-stone-500 font-medium">Usuario 1</label>
          <input type="text" value={form.usuarios[0]}
            onChange={(e) => setForm((f) => ({ ...f, usuarios: [e.target.value, f.usuarios[1]] }))}
            className="input mt-0.5" />
        </div>
        <div>
          <label className="text-xs text-stone-500 font-medium">Usuario 2</label>
          <input type="text" value={form.usuarios[1]}
            onChange={(e) => setForm((f) => ({ ...f, usuarios: [f.usuarios[0], e.target.value] }))}
            className="input mt-0.5" />
        </div>
      </div>

      {/* Gallinas */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-4 space-y-3">
        <p className="font-semibold text-stone-700">🐔 Gallinero</p>
        <div>
          <label className="text-xs text-stone-500 font-medium">Número inicial de gallinas</label>
          <input type="number" min="1" value={form.gallinasIniciales}
            onChange={(e) => setForm((f) => ({ ...f, gallinasIniciales: e.target.value }))}
            className="input mt-0.5" />
          <p className="text-xs text-stone-400 mt-1">
            Las bajas se restan automáticamente de este número.
          </p>
        </div>
      </div>

      {/* Precios */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-4 space-y-3">
        <p className="font-semibold text-stone-700">💰 Precios por defecto</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-stone-500 font-medium">Por pieza ($)</label>
            <input type="number" min="0" step="0.01" value={form.precioPorPieza}
              onChange={(e) => setForm((f) => ({ ...f, precioPorPieza: e.target.value }))}
              className="input mt-0.5" />
          </div>
          <div>
            <label className="text-xs text-stone-500 font-medium">Por docena ($)</label>
            <input type="number" min="0" step="0.01" value={form.precioPorDocena}
              onChange={(e) => setForm((f) => ({ ...f, precioPorDocena: e.target.value }))}
              className="input mt-0.5" />
          </div>
        </div>
      </div>

      {/* Alertas */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-4 space-y-3">
        <p className="font-semibold text-stone-700">🔔 Alertas</p>
        <div>
          <label className="text-xs text-stone-500 font-medium">Alerta de stock bajo (huevos)</label>
          <input type="number" min="0" value={form.umbralStockBajo}
            onChange={(e) => setForm((f) => ({ ...f, umbralStockBajo: e.target.value }))}
            className="input mt-0.5" />
          <p className="text-xs text-stone-400 mt-1">
            Se mostrará alerta cuando el stock sea igual o menor a este número.
          </p>
        </div>
      </div>

      <button onClick={save}
        className="w-full py-3.5 rounded-2xl bg-brand-500 text-white font-semibold text-base active:bg-brand-600 shadow-sm">
        Guardar configuración
      </button>

      {/* Exportar */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-4">
        <p className="font-semibold text-stone-700 mb-1">💾 Respaldo de datos</p>
        <p className="text-xs text-stone-500 mb-3">
          Descarga todos tus datos como archivo JSON. Guárdalo en un lugar seguro.
        </p>
        <button onClick={handleExport}
          className="w-full py-3 rounded-xl border-2 border-dashed border-amber-300 text-amber-700 font-medium text-sm active:bg-amber-50">
          Exportar datos JSON
        </button>
      </div>

      {/* Info */}
      <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200">
        <p className="text-xs font-semibold text-amber-800 mb-1">🐔 Mi Gallinero</p>
        <p className="text-xs text-amber-700">Gestión de ponedoras Lohmann Brown</p>
        <p className="text-xs text-amber-600 mt-1">Todos los datos se almacenan localmente en tu dispositivo.</p>
      </div>
    </div>
  );
}
