'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AuthComponent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('login'); // 'login' or 'signup'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleMode = (e) => {
    e.preventDefault();
    setError('');
    setMode((prev) => (prev === 'login' ? 'signup' : 'login'));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;

        if (data.user && data.session === null) {
          alert(
            '¡Registro exitoso! Por favor, verifica tu correo electrónico para confirmar la cuenta (si está configurada la confirmación por correo) o intenta iniciar sesión directamente.'
          );
          setMode('login');
        }
      } else if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/`,
        });
        if (error) throw error;
        alert('Se ha enviado un enlace para restablecer tu contraseña a tu correo electrónico.');
        setMode('login');
      }
    } catch (err) {
      setError(err.message || 'Ocurrió un error inesperado durante la autenticación.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="auth-container" className="flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md p-8 backdrop-blur-md bg-slate-900/60 border border-white/10 rounded-2xl shadow-2xl transition-all duration-300">
        {/* Logo y Encabezado */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-2 mb-3">
            <svg
              className="text-sky-400 animate-pulse"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-sky-400 to-indigo-500 bg-clip-text text-transparent">
              ServiTrack
            </h2>
          </div>
          <p id="auth-subtitle" className="text-slate-400 text-sm font-medium">
            {mode === 'login' && 'Inicia sesión para gestionar tus servicios'}
            {mode === 'signup' && 'Crea una cuenta nueva en ServiTrack'}
            {mode === 'forgot' && 'Ingresa tu correo para restablecer la contraseña'}
          </p>
        </div>

        {/* Alerta de Error */}
        {error && (
          <div
            id="auth-error-alert"
            className="mb-5 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-300 text-sm"
          >
            {error}
          </div>
        )}

        {/* Formulario de Autenticación */}
        <form id="auth-form" onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1.5" htmlFor="auth-email">
              Correo Electrónico
            </label>
            <input
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-transparent transition-all"
              type="email"
              id="auth-email"
              placeholder="ejemplo@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-slate-300 text-sm font-medium" htmlFor="auth-password">
                  Contraseña
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => { setError(''); setMode('forgot'); }}
                    className="text-xs text-sky-400 hover:text-sky-300 transition-colors"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                )}
              </div>
              <input
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-transparent transition-all"
                type="password"
                id="auth-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            id="auth-submit-btn"
            className="w-full py-3 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold rounded-lg shadow-lg shadow-sky-500/20 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading
              ? mode === 'login'
                ? 'Iniciando sesión...'
                : mode === 'signup'
                ? 'Registrando cuenta...'
                : 'Enviando enlace...'
              : mode === 'login'
              ? 'Iniciar Sesión'
              : mode === 'signup'
              ? 'Registrarse'
              : 'Restablecer Contraseña'}
          </button>
        </form>

        {/* Toggle de Vista */}
        <div className="mt-6 text-center text-sm text-slate-400">
          {mode === 'forgot' ? (
            <button
              onClick={() => { setError(''); setMode('login'); }}
              className="text-sky-400 hover:text-sky-300 font-semibold focus:outline-none underline decoration-sky-400/30"
            >
              Volver al inicio de sesión
            </button>
          ) : (
            <>
              <span>{mode === 'login' ? '¿No tienes una cuenta?' : '¿Ya tienes una cuenta?'}</span>
              <button
                id="auth-toggle-btn"
                onClick={toggleMode}
                className="text-sky-400 hover:text-sky-300 font-semibold ml-1 focus:outline-none underline decoration-sky-400/30"
              >
                {mode === 'login' ? 'Regístrate' : 'Inicia sesión'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
