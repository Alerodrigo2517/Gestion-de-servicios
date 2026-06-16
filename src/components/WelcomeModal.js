'use client';
import { useState, useEffect, useRef } from 'react';

export default function WelcomeModal({ isOpen, onClose, onComplete }) {
  const [step, setStep] = useState(1);
  const modalRef = useRef(null);
  const previousActiveElement = useRef(null);

  // Focus management when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      previousActiveElement.current = document.activeElement;
      setTimeout(() => {
        if (modalRef.current) {
          const focusableElements = modalRef.current.querySelectorAll(
            'button:not([disabled]), [tabindex]:not([tabindex="-1"])'
          );
          if (focusableElements.length > 0) {
            focusableElements[0].focus();
          }
        }
      }, 50);
    } else {
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    }
  }, [isOpen]);

  // Trap focus inside modal & Escape key handler
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
            'button:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        ).filter((el) => el.offsetParent !== null);

        if (focusableElements.length === 0) return;
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement || !focusableElements.includes(document.activeElement)) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement || !focusableElements.includes(document.activeElement)) {
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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-title"
      className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[1000] p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="glass-premium border-white/10 rounded-2xl shadow-2xl p-6 md:p-8 max-w-lg w-full relative overflow-y-auto max-h-[90vh] animate-slide-up"
      >
        {/* Glow corner effect */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 rounded-full blur-2xl pointer-events-none"></div>

        {/* Close Button ("X") - Just closes, does not save metadata */}
        <button
          className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer transition-colors text-2xl"
          onClick={onClose}
          aria-label="Cerrar"
          type="button"
        >
          &times;
        </button>

        {step === 1 ? (
          <div className="space-y-4">
            <h2
              id="welcome-title"
              className="text-2xl font-black text-white tracking-tight flex items-center gap-2"
            >
              ✨ Bienvenido a ServiTrack
            </h2>
            <div className="text-sm text-slate-300 space-y-3 leading-relaxed">
              <p>
                <strong>ServiTrack</strong> es tu organizador financiero personal, diseñado para planificar tus gastos, realizar un seguimiento de deudas e ingresos y automatizar el control de tus finanzas domésticas de forma inteligente.
              </p>
              <p>Con esta herramienta podrás:</p>
              <ul className="list-disc list-inside space-y-2 pl-2 text-slate-400">
                <li>Visualizar y proyectar tus consumos del mes en tiempo real.</li>
                <li>Simular decisiones de ahorro y bajas de servicios mediante un simulador inteligente.</li>
                <li>Recibir alertas preventivas sobre tus próximos vencimientos y días de medición.</li>
                <li>Exportar tus reportes a planillas Excel sin fórmulas inseguras.</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h2
              id="welcome-title"
              className="text-2xl font-black text-white tracking-tight flex items-center gap-2"
            >
              🔒 Privacidad y tratamiento de datos
            </h2>
            <div className="text-sm text-slate-300 space-y-3.5 leading-relaxed">
              <p>
                Cada cuenta solo puede acceder a sus propios datos. El sistema impide que un usuario consulte o modifique la información de otro. Esta protección se implementa mediante políticas de seguridad en la base de datos.
              </p>
              <p>
                La aplicación evita almacenar tu información financiera de forma permanente en el navegador cuando no es necesario.
              </p>
              
              <div className="bg-slate-900/60 border border-white/5 rounded-xl p-4 space-y-2.5">
                <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                  Acceso administrativo
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  El administrador técnico de ServiTrack puede acceder a la información almacenada en la base de datos, incluyendo ingresos, gastos, deudas, préstamos y demás registros financieros que el usuario cargue en la aplicación. Este acceso existe exclusivamente para tareas de mantenimiento, soporte técnico, resolución de incidencias, auditorías de seguridad y administración del servicio.
                </p>
                
                <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider pt-1.5">
                  Compromiso de confidencialidad
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Nos comprometemos a tratar la información con estricta confidencialidad y a utilizarla únicamente para tareas relacionadas con la operación, mantenimiento y soporte de la plataforma.
                </p>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                <strong>ServiTrack</strong> es una herramienta de organización y planificación financiera personal. No constituye asesoramiento financiero, contable, tributario ni legal.
              </p>

              <div className="border-t border-white/5 pt-2 text-[10px] text-slate-500 flex justify-between select-none">
                <span>Información y Privacidad – Versión 1.0</span>
                <span>Última actualización: junio de 2026</span>
              </div>
            </div>
          </div>
        )}

        {/* Footer Navigation */}
        <div className="flex items-center justify-between mt-8 pt-4 border-t border-white/5">
          {/* Dot Indicators */}
          <div className="flex gap-2.5" aria-hidden="true">
            <span
              className={`w-2 h-2 rounded-full transition-colors duration-200 ${step === 1 ? 'bg-sky-400' : 'bg-slate-700'}`}
            ></span>
            <span
              className={`w-2 h-2 rounded-full transition-colors duration-200 ${step === 2 ? 'bg-sky-400' : 'bg-slate-700'}`}
            ></span>
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            {step === 2 && (
              <button
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white glass-premium hover:bg-white/10 rounded-xl transition cursor-pointer"
                onClick={() => setStep(1)}
                type="button"
              >
                Anterior
              </button>
            )}

            {step === 1 ? (
              <button
                className="px-5 py-2 text-xs font-bold bg-gradient-to-r from-sky-400 to-indigo-500 hover:from-sky-500 hover:to-indigo-600 text-white rounded-xl transition shadow-lg shadow-sky-500/10 active:scale-[0.98] cursor-pointer"
                onClick={() => setStep(2)}
                type="button"
              >
                Siguiente
              </button>
            ) : (
              <button
                className="px-5 py-2 text-xs font-bold bg-gradient-to-r from-sky-400 to-indigo-500 hover:from-sky-500 hover:to-indigo-600 text-white rounded-xl transition shadow-lg shadow-sky-500/10 active:scale-[0.98] cursor-pointer"
                onClick={onComplete}
                type="button"
              >
                Entendido, continuar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
