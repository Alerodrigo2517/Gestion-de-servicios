'use client';
import { useState, useEffect, useRef } from 'react';

export default function ChangePassphraseModal({ isOpen, onClose, onChangePassphrase }) {
  const [newPassphrase, setNewPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');
  const [rememberDevice, setRememberDevice] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const modalRef = useRef(null);

  // Focus management and escape/tab trapping
  useEffect(() => {
    if (isOpen) {
      setError('');
      setNewPassphrase('');
      setConfirmPassphrase('');
      setRememberDevice(true);
      setIsSubmitting(false);
      
      // Focus on first input
      setTimeout(() => {
        if (modalRef.current) {
          const input = modalRef.current.querySelector('input[type="password"]');
          if (input) input.focus();
        }
      }, 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'Tab') {
        if (!modalRef.current) return;
        const focusableElements = Array.from(
          modalRef.current.querySelectorAll(
            'input, button, [tabindex]:not([tabindex="-1"])'
          )
        ).filter((el) => !el.disabled && el.offsetParent !== null);

        if (focusableElements.length === 0) return;
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!newPassphrase.trim()) {
      setError('La nueva frase de paso no puede estar vacía.');
      return;
    }

    if (newPassphrase.length < 8) {
      setError('Por seguridad, la frase debe tener al menos 8 caracteres.');
      return;
    }

    if (newPassphrase !== confirmPassphrase) {
      setError('Las frases de encriptación ingresadas no coinciden.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onChangePassphrase(newPassphrase.trim(), rememberDevice);
      onClose();
    } catch (err) {
      setError('Error al migrar y encriptar tus datos. Inténtalo de nuevo.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[2000] p-4 animate-fade-in">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-crypto-title"
        className="glass-premium border-white/10 rounded-2xl shadow-2xl p-6 md:p-8 max-w-md w-full relative overflow-hidden animate-slide-up"
      >
        {/* Glow corner */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl pointer-events-none"></div>

        <button
          className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer transition-colors text-2xl"
          onClick={onClose}
          aria-label="Cerrar modal"
          type="button"
          disabled={isSubmitting}
        >
          &times;
        </button>

        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 bg-sky-500/10 border border-sky-500/30 rounded-xl flex items-center justify-center mb-4 text-sky-400">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
            </svg>
          </div>
          
          <h2
            id="change-crypto-title"
            className="text-lg font-black text-white mb-2 tracking-tight uppercase"
          >
            Cambiar Frase Maestra
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed font-semibold">
            Tus datos financieros actuales serán desencriptados con la clave antigua y re-encriptados con la nueva frase maestra.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">
              Nueva Frase Maestra
            </label>
            <input
              type="password"
              placeholder="Ingresa la nueva frase (mínimo 8 caracteres)"
              value={newPassphrase}
              onChange={(e) => setNewPassphrase(e.target.value)}
              className="w-full px-4 py-3 bg-slate-950/80 border border-white/10 rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all font-semibold"
              disabled={isSubmitting}
              autoComplete="new-password"
            />
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">
              Confirmar Nueva Frase Maestra
            </label>
            <input
              type="password"
              placeholder="Repite la nueva frase de paso"
              value={confirmPassphrase}
              onChange={(e) => setConfirmPassphrase(e.target.value)}
              className="w-full px-4 py-3 bg-slate-950/80 border border-white/10 rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all font-semibold"
              disabled={isSubmitting}
              autoComplete="new-password"
            />
          </div>

          <div className="flex items-center gap-2.5 px-1 py-1">
            <input
              id="change-remember-checkbox"
              type="checkbox"
              checked={rememberDevice}
              onChange={(e) => setRememberDevice(e.target.checked)}
              className="w-4 h-4 rounded bg-slate-950 border-white/10 text-sky-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
              disabled={isSubmitting}
            />
            <label
              htmlFor="change-remember-checkbox"
              className="text-[10px] text-slate-300 leading-relaxed font-bold cursor-pointer select-none"
            >
              Recordar esta nueva frase en este dispositivo
            </label>
          </div>

          {error && (
            <div className="text-center text-[11px] text-rose-400 font-bold bg-rose-500/5 border border-rose-500/10 p-2 rounded-lg">
              {error}
            </div>
          )}

          <div className="pt-2 flex flex-col gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-sky-500/10 hover:shadow-sky-500/25 transition duration-200 cursor-pointer active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed uppercase"
            >
              {isSubmitting ? 'Migrando y Cifrando...' : 'Actualizar Frase Clave'}
            </button>
            
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full py-2.5 bg-transparent border border-white/5 hover:bg-white/5 text-slate-400 hover:text-white font-bold text-xs rounded-xl transition duration-200 cursor-pointer active:scale-[0.98]"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
