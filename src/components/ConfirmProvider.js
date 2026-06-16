'use client';
import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Aceptar',
    cancelText: 'Cancelar',
    alternateText: null,
    type: 'danger',
    initialFocus: 'cancel',
    closeOnBackdrop: false,
    loading: false,
  });

  const queue = useRef([]);
  const activeResolve = useRef(null);
  const previousElement = useRef(null);
  const resolvedRef = useRef(false);
  const modalRef = useRef(null);

  const processQueue = useCallback(() => {
    if (queue.current.length === 0 || confirmState.isOpen) return;

    const next = queue.current.shift();
    resolvedRef.current = false;
    activeResolve.current = next.resolve;
    previousElement.current = document.activeElement;

    setConfirmState({
      isOpen: true,
      title: next.title,
      message: next.message,
      confirmText: next.confirmText,
      cancelText: next.cancelText,
      alternateText: next.alternateText,
      type: next.type,
      initialFocus: next.initialFocus,
      closeOnBackdrop: next.closeOnBackdrop,
      loading: next.loading,
    });
  }, [confirmState.isOpen]);

  const showConfirm = useCallback(({
    title,
    message,
    confirmText = 'Aceptar',
    cancelText = 'Cancelar',
    alternateText = null,
    type = 'danger',
    initialFocus = 'cancel',
    closeOnBackdrop = false,
    loading = false,
  }) => {
    return new Promise((resolve) => {
      queue.current.push({
        title,
        message,
        confirmText,
        cancelText,
        alternateText,
        type,
        initialFocus,
        closeOnBackdrop,
        loading,
        resolve,
      });
      processQueue();
    });
  }, [processQueue]);

  const closeModal = useCallback(() => {
    setConfirmState((prev) => ({ ...prev, isOpen: false }));
    
    // Restore focus safely to the original element or a navigable fallback
    setTimeout(() => {
      if (previousElement.current && document.body.contains(previousElement.current)) {
        previousElement.current.focus();
      } else {
        const fallback = document.querySelector('main') || document.querySelector('header');
        if (fallback) {
          if (!fallback.hasAttribute('tabIndex')) {
            fallback.setAttribute('tabIndex', '-1');
          }
          fallback.focus();
        } else {
          document.body.focus();
        }
      }
      
      // Process next item in queue
      processQueue();
    }, 50);
  }, [processQueue]);

  const handleConfirm = useCallback(() => {
    if (resolvedRef.current || confirmState.loading) return;
    resolvedRef.current = true;
    if (activeResolve.current) activeResolve.current(confirmState.alternateText ? 'confirm' : true);
    closeModal();
  }, [confirmState.loading, confirmState.alternateText, closeModal]);

  const handleAlternate = useCallback(() => {
    if (resolvedRef.current || confirmState.loading) return;
    resolvedRef.current = true;
    if (activeResolve.current) activeResolve.current('alternate');
    closeModal();
  }, [confirmState.loading, closeModal]);

  const handleCancel = useCallback(() => {
    if (resolvedRef.current || confirmState.loading) return;
    resolvedRef.current = true;
    if (activeResolve.current) activeResolve.current(false);
    closeModal();
  }, [confirmState.loading, closeModal]);

  useEffect(() => {
    if (!confirmState.isOpen) return;

    // Focus initial element
    const focusableElements = modalRef.current?.querySelectorAll('button') || [];
    if (focusableElements.length > 0) {
      const initialFocusType = confirmState.initialFocus || 'cancel';
      const target = Array.from(focusableElements).find(
        (el) => el.getAttribute('data-type') === initialFocusType
      );
      if (target) {
        target.focus();
      } else {
        focusableElements[0].focus();
      }
    }

    const handleKeyDown = (e) => {
      if (confirmState.loading) return; // Prevent any interaction if loading is active

      if (e.key === 'Tab') {
        const elements = Array.from(focusableElements);
        if (elements.length === 0) return;
        const first = elements[0];
        const last = elements[elements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            last.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === last) {
            first.focus();
            e.preventDefault();
          }
        }
      } else if (e.key === 'Escape') {
        handleCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [confirmState.isOpen, confirmState.initialFocus, confirmState.loading, handleCancel]);

  return (
    <ConfirmContext.Provider value={{ showConfirm }}>
      {children}
      {confirmState.isOpen && (
        <div
          onClick={() => {
            if (confirmState.closeOnBackdrop && !confirmState.loading) {
              handleCancel();
            }
          }}
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in"
        >
          <div
            ref={modalRef}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby="confirm-message"
            className="w-full max-w-md p-6 glass-premium border-white/10 rounded-2xl shadow-2xl animate-slide-up"
          >
            <h3
              id="confirm-title"
              className="text-lg font-black text-white mb-2 tracking-tight"
            >
              {confirmState.title}
            </h3>
            <p
              id="confirm-message"
              className="text-xs text-slate-300 font-semibold mb-6 leading-relaxed"
            >
              {confirmState.message}
            </p>
            <div className="flex justify-end items-center gap-3">
              <button
                data-type="cancel"
                onClick={handleCancel}
                disabled={confirmState.loading}
                className="px-4 py-2.5 text-xs font-bold text-slate-400 hover:text-white glass-premium hover:bg-white/10 rounded-xl transition duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {confirmState.cancelText}
              </button>

              {confirmState.alternateText && (
                <button
                  data-type="alternate"
                  onClick={handleAlternate}
                  disabled={confirmState.loading}
                  className="px-4 py-2.5 text-xs font-bold text-slate-300 hover:text-white glass-premium hover:bg-white/15 rounded-xl transition duration-200 active:scale-[0.98] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {confirmState.alternateText}
                </button>
              )}

              <button
                data-type="confirm"
                onClick={handleConfirm}
                disabled={confirmState.loading}
                className={`px-4 py-2.5 text-xs font-bold text-white rounded-xl transition duration-200 active:scale-[0.98] cursor-pointer shadow-lg disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 ${
                  confirmState.type === 'danger'
                    ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/10'
                    : 'bg-sky-600 hover:bg-sky-500 shadow-sky-600/10'
                }`}
              >
                {confirmState.loading && (
                  <svg
                    className="animate-spin h-3 w-3 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                )}
                {confirmState.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
}
