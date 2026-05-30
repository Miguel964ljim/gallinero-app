import { useApp } from '../../context/AppContext';

const MORE_ITEMS = [
  { id: 'alimentacion',  label: 'Alimentación',  emoji: '🌾' },
  { id: 'sanidad',       label: 'Sanidad',        emoji: '💉' },
  { id: 'mortalidad',    label: 'Bajas',          emoji: '📋' },
  { id: 'gastos',        label: 'Gastos',         emoji: '💸' },
  { id: 'clientes',      label: 'Clientes',       emoji: '👥' },
  { id: 'sensores',      label: 'Sensores / IoT', emoji: '📡' },
  { id: 'configuracion', label: 'Configuración',  emoji: '⚙️', adminOnly: true },
];

export default function MoreMenu({ onNavigate, onClose }) {
  const { isAdmin } = useApp();
  const items = MORE_ITEMS.filter((i) => !i.adminOnly || isAdmin);

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full bg-white rounded-t-3xl shadow-2xl p-4 pb-safe"
        onClick={(e) => e.stopPropagation()}
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}
      >
        <div className="w-10 h-1 bg-stone-200 rounded-full mx-auto mb-4" />
        <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider px-2 mb-3">Más módulos</p>
        <div className="grid grid-cols-3 gap-3">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => { onNavigate(item.id); onClose(); }}
              className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-amber-50 active:bg-amber-100 transition-colors"
            >
              <span className="text-2xl">{item.emoji}</span>
              <span className="text-xs font-medium text-stone-700 text-center leading-tight">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
