'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordView({ onComplete }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      alert('¡Contraseña restablecida correctamente! Ahora puedes usar la aplicación.');
      onComplete();
    } catch (err) {
      setError(err.message || 'Error al restablecer la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md p-8 backdrop-blur-md bg-slate-900/60 border border-white/10 rounded-2xl shadow-2xl transition-all duration-300">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-sky-400 to-indigo-500 bg-clip-text text-transparent mb-2">
            Restablecer Contraseña
          </h2>
          <p className="text-slate-400 text-sm font-medium">
            Ingresa tu nueva contraseña para ServiTrack
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-300 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1.5" htmlFor="new-password">
              Nueva Contraseña
            </label>
            <input
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-transparent transition-all"
              type="password"
              id="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1.5" htmlFor="confirm-password">
              Confirmar Contraseña
            </label>
            <input
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-transparent transition-all"
              type="password"
              id="confirm-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold rounded-lg shadow-lg shadow-sky-500/20 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? 'Restableciendo...' : 'Guardar Nueva Contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
}
