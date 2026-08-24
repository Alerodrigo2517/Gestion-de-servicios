import { useState } from 'react';

export default function Sidebar({
  userName,
  activeView,
  setActiveView,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  services,
  currentItems,
  onOpenModal,
  onGenerateDemoData,
  onDeleteDemoData,
  onChangePassword,
  onChangePassphraseClick,
  onShowWelcome,
  onSignOut,
}) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <>
      {/* Overlay behind sidebar on mobile when open */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* Sidebar: Navy Left Column on Desktop, Drawer on Mobile */}
      <aside
        className={`fixed inset-y-0 left-0 w-64 bg-[#090f1d] text-slate-300 shrink-0 flex flex-col border-r border-slate-800/20 z-50 transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand/Logo Section */}
        <div className="px-6 py-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-400 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-emerald-500/10">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
            </div>
            <div>
              <h1 className="text-md font-black tracking-tight text-white flex items-center gap-1 select-none">
                <span className="text-emerald-400">FINANZAS</span>
                <span>YA</span>
              </h1>
              <p className="text-[9px] font-bold text-slate-500 tracking-wider uppercase select-none">
                ServiTrack Panel
              </p>
            </div>
          </div>
          {/* Close button on mobile */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition cursor-pointer"
            aria-label="Cerrar menú"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-4 py-6 space-y-1.5">
          <button
            type="button"
            onClick={() => {
              setActiveView('inicio');
              setIsMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold rounded-r-xl border-l-4 transition ${activeView === 'inicio' ? 'border-emerald-500 text-white bg-gradient-to-r from-emerald-500/10 to-slate-800/40 shadow-sm' : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={activeView === 'inicio' ? 'text-emerald-400' : ''}>
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Inicio
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveView('cuentas');
              setIsMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold rounded-r-xl border-l-4 transition ${activeView === 'cuentas' ? 'border-emerald-500 text-white bg-gradient-to-r from-emerald-500/10 to-slate-800/40 shadow-sm' : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={activeView === 'cuentas' ? 'text-emerald-400' : ''}>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            Cuentas
          </button>

          <button
            type="button"
            onClick={() => {
              onOpenModal('projection');
              setIsMobileMenuOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold rounded-r-xl border-l-4 border-transparent text-slate-400 hover:text-white hover:bg-white/5 transition"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            Presupuestos
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveView('cuentas');
              setIsMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold rounded-r-xl border-l-4 transition ${activeView === 'cuentas' ? 'border-emerald-500 text-white bg-gradient-to-r from-emerald-500/10 to-slate-800/40 shadow-sm' : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={activeView === 'cuentas' ? 'text-emerald-400' : ''}>
              <path d="M17 1l4 4-4 4" />
              <path d="M3 11V9a4 4 0 0 1 4-4h14" />
              <path d="M7 23l-4-4 4-4" />
              <path d="M21 13v2a4 4 0 0 1-4 4H3" />
            </svg>
            Transacciones
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveView('cuentas');
              setIsMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold rounded-r-xl border-l-4 transition ${activeView === 'cuentas' ? 'border-emerald-500 text-white bg-gradient-to-r from-emerald-500/10 to-slate-800/40 shadow-sm' : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={activeView === 'cuentas' ? 'text-emerald-400' : ''}>
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
            Metas
          </button>

          <button
            type="button"
            onClick={() => {
              onOpenModal('projection');
              setIsMobileMenuOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold rounded-r-xl border-l-4 border-transparent text-slate-400 hover:text-white hover:bg-white/5 transition"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            Reportes
          </button>
        </nav>

        {/* Sidebar Herramientas list */}
        <div className="px-4 py-4 border-t border-white/5">
          <p className="px-4 text-[10px] font-bold text-slate-500 tracking-wider uppercase mb-2 select-none">
            Análisis
          </p>
          <div className="space-y-1">
            <button
              onClick={() => {
                onOpenModal('projection');
                setIsMobileMenuOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 rounded-lg flex items-center gap-2 transition cursor-pointer"
              type="button"
            >
              Proyección Anual
            </button>
            <button
              onClick={() => {
                onOpenModal('simulation');
                setIsMobileMenuOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 rounded-lg flex items-center gap-2 transition cursor-pointer"
              type="button"
            >
              Simulador de Bajas
            </button>
            {currentItems && currentItems.some((item) => item.consumptionUnit !== undefined && item.consumptionUnit !== null) && (
              <button
                onClick={() => {
                  onOpenModal('consumption');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 rounded-lg flex items-center gap-2 transition cursor-pointer"
                type="button"
              >
                Consumo Físico
              </button>
            )}
          </div>
        </div>

        {/* Sidebar Bottom Profile/Settings */}
        <div className="p-4 border-t border-white/5 space-y-2 mt-auto">
          <div 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10 transition"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-400 to-indigo-600 flex items-center justify-center text-white font-extrabold text-xs">
              {userName.substring(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-white font-bold truncate">Mi Cuenta</p>
              <p className="text-[10px] text-slate-500 truncate font-semibold">{userName}</p>
            </div>
            <svg
              className={`transition-transform duration-200 text-slate-500 ${isProfileOpen ? 'rotate-180' : ''}`}
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>

          {/* Profile options menu inside sidebar */}
          {isProfileOpen && (
            <div className="bg-slate-900/60 border border-white/5 rounded-xl p-1.5 space-y-1 text-slate-300">
              <button
                className="w-full text-left px-3 py-2 text-[11px] font-semibold text-slate-300 hover:text-white hover:bg-white/5 rounded-lg flex items-center gap-2 transition cursor-pointer"
                onClick={() => {
                  onGenerateDemoData();
                  setIsMobileMenuOpen(false);
                }}
                type="button"
              >
                Cargar Demo Anual
              </button>
              {services && services.some((s) => s.is_demo) && (
                <button
                  className="w-full text-left px-3 py-2 text-[11px] font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg flex items-center gap-2 transition cursor-pointer"
                  onClick={() => {
                    onDeleteDemoData();
                    setIsMobileMenuOpen(false);
                  }}
                  type="button"
                >
                  Eliminar Demo Anual
                </button>
              )}
              <button
                className="w-full text-left px-3 py-2 text-[11px] font-semibold text-slate-300 hover:text-white hover:bg-white/5 rounded-lg flex items-center gap-2 transition cursor-pointer"
                onClick={() => {
                  onChangePassword();
                  setIsMobileMenuOpen(false);
                }}
                type="button"
              >
                Cambiar Contraseña
              </button>
              <button
                className="w-full text-left px-3 py-2 text-[11px] font-semibold text-slate-300 hover:text-white hover:bg-white/5 rounded-lg flex items-center gap-2 transition cursor-pointer"
                onClick={() => {
                  onChangePassphraseClick();
                  setIsMobileMenuOpen(false);
                }}
                type="button"
              >
                Frase Maestra
              </button>
              <button
                className="w-full text-left px-3 py-2 text-[11px] font-semibold text-slate-300 hover:text-white hover:bg-white/5 rounded-lg flex items-center gap-2 transition cursor-pointer"
                onClick={() => {
                  onShowWelcome();
                  setIsMobileMenuOpen(false);
                }}
                type="button"
              >
                Ayuda / Privacidad
              </button>
              <div className="border-t border-white/5 my-1"></div>
              <button
                className="w-full text-left px-3 py-2 text-[11px] font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg flex items-center gap-2 transition cursor-pointer"
                onClick={onSignOut}
                type="button"
              >
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
