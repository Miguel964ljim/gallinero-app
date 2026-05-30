import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import logo from '../assets/logo.png';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err) {
      const msgs = {
        'auth/user-not-found':    'Usuario no encontrado.',
        'auth/wrong-password':    'Contraseña incorrecta.',
        'auth/invalid-email':     'Correo inválido.',
        'auth/too-many-requests': 'Demasiados intentos. Espera unos minutos.',
        'auth/invalid-credential':'Correo o contraseña incorrectos.',
      };
      setError(msgs[err.code] || 'Error al iniciar sesión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-amber-50 flex flex-col items-center justify-center px-6"
         style={{ paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>

      {/* Logo + título */}
      <div className="flex flex-col items-center gap-3 mb-10">
        <div className="w-24 h-24 rounded-3xl bg-brand-500 shadow-lg flex items-center justify-center overflow-hidden">
          <img src={logo} alt="Mi Gallinero" className="w-20 h-20 object-contain" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-stone-800">Mi Gallinero</h1>
          <p className="text-sm text-stone-500 mt-0.5">Ponedoras Lohmann Brown</p>
        </div>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Correo</label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              className="input mt-1.5"
              disabled={loading}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Contraseña</label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input mt-1.5"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full py-3.5 rounded-2xl bg-brand-500 text-white font-semibold text-base
                       active:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center justify-center gap-2 transition-opacity"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Conectando...
              </>
            ) : (
              'Iniciar sesión'
            )}
          </button>
        </div>

        <p className="text-center text-xs text-stone-400">
          Acceso solo para usuarios autorizados
        </p>
      </form>
    </div>
  );
}
