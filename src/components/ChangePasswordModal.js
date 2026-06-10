'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function ChangePasswordModal({ isOpen, onClose }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setPassword('');
      setConfirmPassword('');
      setError('');
      setSuccess('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

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
      setSuccess('¡Contraseña actualizada con éxito!');
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.message || 'Ocurrió un error al actualizar la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
      <div className="backdrop-blur-md bg-slate-900/90 border border-white/10 rounded-2xl shadow-2xl p-6 md:p-8 max-w-md w-full relative">
        <button
          className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer transition-colors text-2xl"
          onClick={onClose}
          type="button"
        >
          &times;
        </button>
        
        <h2 className="text-xl font-bold text-white mb-5">Cambiar Contraseña</h2>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-300 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-sm">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-300 text-xs font-semibold mb-1.5 uppercase tracking-wider" htmlFor="change-pass">
              Nueva Contraseña
            </label>
            <input
              type="password"
              id="change-pass"
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950/60 border border-white/10 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-slate-300 text-xs font-semibold mb-1.5 uppercase tracking-wider" htmlFor="confirm-change-pass">
              Confirmar Nueva Contraseña
            </label>
            <input
              type="password"
              id="confirm-change-pass"
              placeholder="••••••••"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950/60 border border-white/10 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-transparent transition-all"
            />
          </div>

          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-white/10 hover:bg-white/5 text-slate-300 font-semibold rounded-lg transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] py-3 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold rounded-lg shadow-lg shadow-sky-500/20 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Actualizar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
