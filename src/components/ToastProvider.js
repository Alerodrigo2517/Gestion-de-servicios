'use client';
import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

const ToastContext = createContext(null);

function generateToastId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  }

  return `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => {
      const toast = prev.find((t) => t.id === id);
      if (!toast || toast.isLeaving) return prev;

      // Mark it as leaving to trigger exit animation
      const next = prev.map((t) => (t.id === id ? { ...t, isLeaving: true } : t));

      // Schedule removal from array after animation completes
      setTimeout(() => {
        setToasts((current) => current.filter((t) => t.id !== id));
      }, 300);

      return next;
    });
  }, []);

  const showToast = useCallback(({ type = 'success', title, message, duration = 4000 }) => {
    setToasts((prev) => {
      // Deduplicate: skip if identical toast is already active and not leaving
      const isDuplicate = prev.some(
        (t) => t.message === message && t.type === type && !t.isLeaving
      );
      if (isDuplicate) return prev;

      const newToast = {
        id: generateToastId(),
        type,
        title,
        message,
        duration,
        isLeaving: false,
      };

      let nextToasts = [...prev];
      const activeToasts = nextToasts.filter((t) => !t.isLeaving);
      if (activeToasts.length >= 5) {
        const oldestActive = activeToasts[0];
        nextToasts = nextToasts.map((t) =>
          t.id === oldestActive.id ? { ...t, isLeaving: true } : t
        );
        
        // Schedule physical removal for the one we just set to isLeaving
        setTimeout(() => {
          setToasts((current) => current.filter((t) => t.id !== oldestActive.id));
        }, 300);
      }

      return [...nextToasts, newToast];
    });
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={dismissToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onClose }) {
  const { id, message, title, type, duration, isLeaving } = toast;
  const timeLeft = useRef(duration);
  const timerId = useRef(null);
  const startTime = useRef(null);

  const startTimer = useCallback(() => {
    startTime.current = Date.now();
    timerId.current = setTimeout(() => {
      onClose(id);
    }, timeLeft.current);
  }, [id, onClose]);

  const pauseTimer = useCallback(() => {
    if (timerId.current) {
      clearTimeout(timerId.current);
      timerId.current = null;
      timeLeft.current -= Date.now() - startTime.current;
    }
  }, []);

  useEffect(() => {
    if (!isLeaving) {
      startTimer();
    }
    return () => {
      if (timerId.current) {
        clearTimeout(timerId.current);
      }
    };
  }, [isLeaving, startTimer]);

  const role = type === 'error' ? 'alert' : 'status';
  const ariaLive = type === 'error' ? undefined : 'polite';

  return (
    <div
      onMouseEnter={pauseTimer}
      onMouseLeave={startTimer}
      role={role}
      aria-live={ariaLive}
      className={`pointer-events-auto flex items-start justify-between p-4 rounded-xl shadow-2xl border backdrop-blur-md transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${
        isLeaving ? 'animate-slide-out-right' : 'animate-slide-in-right'
      } ${
        type === 'error'
          ? 'bg-rose-950/80 border-rose-500/30 text-rose-200 glow-rose'
          : type === 'warning'
            ? 'bg-amber-950/80 border-amber-500/30 text-amber-200 glow-amber'
            : 'bg-emerald-950/80 border-emerald-500/30 text-emerald-200 glow-emerald'
      }`}
    >
      <div className="flex items-start gap-3 w-full">
        {type === 'error' ? (
          <svg
            className="w-5 h-5 text-rose-400 shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.5"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        ) : type === 'warning' ? (
          <svg
            className="w-5 h-5 text-amber-400 shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.5"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        ) : (
          <svg
            className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.5"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        )}
        <div className="flex flex-col gap-0.5 w-full">
          {title && <span className="text-xs font-black tracking-wide leading-none">{title}</span>}
          <span className="text-xs font-semibold leading-normal">{message}</span>
        </div>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose(id);
        }}
        aria-label="Cerrar notificación"
        className="text-slate-400 hover:text-white ml-3 select-none shrink-0 mt-0.5 transition-colors cursor-pointer"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
