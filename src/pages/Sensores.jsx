export default function Sensores() {
  return (
    <div className="px-4 pt-4 pb-2 space-y-4">
      <h2 className="text-xl font-bold text-stone-800">Sensores / IoT 📡</h2>

      <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6 text-center space-y-4">
        <div className="text-6xl">📡</div>
        <div>
          <p className="text-lg font-bold text-stone-800">Próximamente</p>
          <p className="text-sm text-stone-500 mt-2 leading-relaxed">
            Monitoreo en tiempo real desde tu gallinero
          </p>
        </div>

        <div className="space-y-3 text-left">
          {[
            { icon: '🌡️', title: 'Temperatura', desc: 'Monitoreo continuo del ambiente' },
            { icon: '💧', title: 'Humedad', desc: 'Control de humedad óptima' },
            { icon: '🪟', title: 'Cortinas inteligentes', desc: 'Apertura y cierre automático' },
            { icon: '🔔', title: 'Alertas automáticas', desc: 'Notificaciones en tiempo real' },
          ].map((item) => (
            <div key={item.title} className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl opacity-60">
              <span className="text-2xl flex-shrink-0">{item.icon}</span>
              <div>
                <p className="font-semibold text-stone-700 text-sm">{item.title}</p>
                <p className="text-xs text-stone-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-stone-400">
          Esta función estará disponible en una próxima versión con integración de sensores físicos.
        </p>
      </div>
    </div>
  );
}
