export default function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm px-4 pb-8">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="px-6 pt-6 pb-4">
          <p className="text-stone-800 text-base font-medium text-center">{message}</p>
        </div>
        <div className="flex border-t border-stone-100">
          <button
            onClick={onCancel}
            className="flex-1 py-4 text-stone-600 text-sm font-medium border-r border-stone-100 active:bg-stone-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-4 text-red-500 text-sm font-semibold active:bg-red-50"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}
