import { useApp } from '../../context/AppContext';

export default function Toast() {
  const { toasts, dismissToast } = useApp();

  if (!toasts.length) return null;

  return (
    <div className="fixed top-safe-top left-0 right-0 z-50 flex flex-col items-center gap-2 pt-4 px-4 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          onClick={() => dismissToast(t.id)}
          className={`pointer-events-auto w-full max-w-sm px-4 py-3 rounded-2xl shadow-lg text-white text-sm font-medium flex items-center gap-2 transition-all
            ${t.type === 'error' ? 'bg-red-500' : t.type === 'warning' ? 'bg-amber-500' : 'bg-green-500'}`}
        >
          <span>{t.type === 'error' ? '✕' : t.type === 'warning' ? '⚠' : '✓'}</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}
