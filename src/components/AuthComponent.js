'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ToastProvider';

export default function AuthComponent() {
  const { showToast } = useToast();
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
          showToast({
            type: 'success',
            message: '¡Registro exitoso! Por favor, verifica tu correo electrónico para confirmar tu cuenta.'
          });
          setMode('login');
        }
      } else if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/`,
        });
        if (error) throw error;
        showToast({
          type: 'success',
          message: 'Se ha enviado un enlace para restablecer tu contraseña a tu correo electrónico.'
        });
        setMode('login');
      }
    } catch (err) {
      setError(
        err.message || 'Ocurrió un error inesperado durante la autenticación.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="auth-container"
      className="flex items-center justify-center min-h-screen p-4 animate-fade-in relative bg-[#f8fafc]"
    >
      {/* Decorative Glow Blobs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none animate-pulse-glow"></div>
      <div
        className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none animate-pulse-glow"
        style={{ animationDelay: '2s' }}
      ></div>

      <div className="w-full max-w-md p-8 bg-white border border-slate-100 rounded-2xl shadow-xl shadow-slate-200/50 relative z-10 hover:border-slate-200/80 transition-all duration-300">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-3 mb-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-400 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/10">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                aria-hidden="true"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
            </div>
            <h2 className="text-3xl font-black tracking-tight text-slate-800 flex items-center gap-1 select-none">
              <span className="text-emerald-500">FINANZAS</span>
              <span>YA</span>
            </h2>
          </div>
          <p
            id="auth-subtitle"
            className="text-slate-400 text-xs font-semibold uppercase tracking-wider"
          >
            {mode === 'login' && 'Gestión Financiera'}
            {mode === 'signup' && 'Crea tu Cuenta'}
            {mode === 'forgot' && 'Recuperación de Acceso'}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            id="auth-error-alert"
            role="alert"
            className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-semibold animate-fade-in"
          >
            {error}
          </div>
        )}

        {/* Authentication Form */}
        <form id="auth-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              className="block text-slate-500 text-[10px] font-bold mb-1.5 uppercase tracking-widest"
              htmlFor="auth-email"
            >
              Correo Electrónico
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  aria-hidden="true"
                >
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
              </span>
              <input
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-800 text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 hover:border-slate-300 transition-all duration-200"
                type="email"
                id="auth-email"
                placeholder="ejemplo@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label
                  className="text-slate-500 text-[10px] font-bold uppercase tracking-widest"
                  htmlFor="auth-password"
                >
                  Contraseña
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setError('');
                      setMode('forgot');
                    }}
                    className="text-[10px] font-bold text-emerald-600 hover:text-emerald-500 transition-colors cursor-pointer"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                )}
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    aria-hidden="true"
                  >
                    <rect
                      x="3"
                      y="11"
                      width="18"
                      height="11"
                      rx="2"
                      ry="2"
                    ></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </span>
                <input
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-800 text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 hover:border-slate-300 transition-all duration-200"
                  type="password"
                  id="auth-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            id="auth-submit-btn"
            className="w-full py-3 bg-gradient-to-tr from-emerald-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/10 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 cursor-pointer mt-2"
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

        {/* View toggles */}
        <div className="mt-6 text-center text-xs text-slate-400 font-semibold select-none border-t border-slate-100 pt-5">
          {mode === 'forgot' ? (
            <button
              onClick={() => {
                setError('');
                setMode('login');
              }}
              className="text-emerald-600 hover:text-emerald-500 font-bold focus:outline-none cursor-pointer"
            >
              Volver al inicio de sesión
            </button>
          ) : (
            <div className="flex justify-center gap-1.5">
              <span>
                {mode === 'login'
                  ? '¿No tienes una cuenta?'
                  : '¿Ya tienes una cuenta?'}
              </span>
              <button
                id="auth-toggle-btn"
                onClick={toggleMode}
                className="text-emerald-600 hover:text-emerald-500 font-bold focus:outline-none cursor-pointer"
              >
                {mode === 'login' ? 'Regístrate' : 'Inicia sesión'}
              </button>
            </div>
          )}
        </div>
        <footer className="w-full text-center mt-6 text-[10px] text-slate-400 font-semibold tracking-wider select-none flex flex-col sm:flex-row justify-center items-center gap-1">
          <span>ServiTrack v1.3.0</span>
          <span className="hidden sm:inline text-slate-300">|</span>
          <span>
            Creado por{' '}
            <span className="text-slate-500">
              Rodrigo Alejandro Aguirre Tevez
            </span>
          </span>
        </footer>
      </div>
    </div>
  );
}
