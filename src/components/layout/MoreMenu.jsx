const MORE_ITEMS = [
  { id: 'alimentacion', label: 'Alimentación',   emoji: '🌾' },
  { id: 'sanidad',      label: 'Sanidad',         emoji: '💉' },
  { id: 'mortalidad',   label: 'Bajas',           emoji: '📋' },
  { id: 'gastos',       label: 'Gastos',          emoji: '💸' },
  { id: 'configuracion',label: 'Configuración',   emoji: '⚙️' },
  { id: 'sensores',     label: 'Sensores / IoT',  emoji: '📡' },
];

export default function MoreMenu({ onNavigate, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
      <div
        className="w-full bg-white rounded-t-3xl shadow-2xl p-4 pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-stone-200 rounded-full mx-auto mb-4" />
        <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider px-2 mb-3">Más módulos</p>
        <div className="grid grid-cols-3 gap-3">
          {MORE_ITEMS.map((item) => (
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
