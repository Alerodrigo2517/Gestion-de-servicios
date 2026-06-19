'use client';
import { useState, useEffect, useRef } from 'react';

export default function EncryptionKeyModal({ isOpen, onSubmitKey, onSignOut }) {
  const [passphrase, setPassphrase] = useState('');
  const [error, setError] = useState('');
  const [acceptedWarning, setAcceptedWarning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const modalRef = useRef(null);

  // Focus management and escape/tab trapping
  useEffect(() => {
    if (isOpen) {
      setError('');
      setPassphrase('');
      setAcceptedWarning(false);
      setIsSubmitting(false);
      
      // Focus on input
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
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!passphrase.trim()) {
      setError('La frase de paso no puede estar vacía.');
      return;
    }

    if (passphrase.length < 8) {
      setError('Por seguridad, la frase debe tener al menos 8 caracteres.');
      return;
    }

    if (!acceptedWarning) {
      setError('Debes aceptar la advertencia de pérdida de datos.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmitKey(passphrase.trim());
    } catch (err) {
      setError('Error al procesar la clave de encriptación. Inténtalo de nuevo.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[2000] p-4 animate-fade-in">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="encryption-title"
        className="glass-premium border-white/10 rounded-2xl shadow-2xl p-6 md:p-8 max-w-md w-full relative overflow-hidden animate-slide-up"
      >
        {/* Glow corner */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none"></div>

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
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          
          <h2
            id="encryption-title"
            className="text-lg font-black text-white mb-2 tracking-tight uppercase"
          >
            Doble Encriptación Activa
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed font-semibold">
            Tus datos financieros serán encriptados en este navegador antes de ser guardados en la base de datos. Solo tú podrás verlos.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">
              Frase Clave de Encriptación
            </label>
            <input
              type="password"
              placeholder="Ingresa tu frase maestra (mínimo 8 caracteres)"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              className="w-full px-4 py-3 bg-slate-950/80 border border-white/10 rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all font-semibold"
              disabled={isSubmitting}
              autoComplete="new-password"
            />
          </div>

          <div className="p-3.5 bg-rose-500/5 border border-rose-500/15 rounded-xl space-y-2">
            <div className="flex items-start gap-2.5">
              <input
                id="warning-checkbox"
                type="checkbox"
                checked={acceptedWarning}
                onChange={(e) => setAcceptedWarning(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded bg-slate-950 border-white/10 text-rose-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                disabled={isSubmitting}
              />
              <label
                htmlFor="warning-checkbox"
                className="text-[10px] text-rose-300 leading-relaxed font-semibold cursor-pointer select-none"
              >
                <strong>ADVERTENCIA DE SEGURIDAD:</strong> Entiendo que si olvido mi frase clave, mis datos financieros se cifrarán permanentemente y serán irrecuperables. El administrador no puede restablecer esta clave.
              </label>
            </div>
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
              {isSubmitting ? 'Derivando claves...' : 'Activar Encriptación'}
            </button>
            
            <button
              type="button"
              onClick={onSignOut}
              disabled={isSubmitting}
              className="w-full py-2.5 bg-transparent border border-white/5 hover:bg-white/5 text-slate-400 hover:text-white font-bold text-xs rounded-xl transition duration-200 cursor-pointer active:scale-[0.98]"
            >
              Cerrar Sesión
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
