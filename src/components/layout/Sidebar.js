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
          className="fixed inset-0 bg-[#090f1d]/80 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* Sidebar: Glass Left Column on Desktop, Drawer on Mobile */}
      <aside
        className={`fixed inset-y-0 left-0 w-[260px] bg-white/60 backdrop-blur-2xl text-slate-600 shrink-0 flex flex-col border-r border-white/60 shadow-[4px_0_24px_-10px_rgba(0,0,0,0.05)] z-50 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand/Logo Section */}
        <div className="px-6 py-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 relative">
              <div className="absolute inset-0 bg-white/20 rounded-2xl blur-[2px] pointer-events-none"></div>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="relative z-10">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tighter text-slate-800 flex items-center gap-1">
                <span>FINANZAS</span>
                <span className="text-emerald-500">YA</span>
              </h1>
              <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">
                ServiTrack Panel
              </p>
            </div>
          </div>
          {/* Close button on mobile */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100/50 transition cursor-pointer"
            aria-label="Cerrar menú"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto scrollbar-none">
          <button
            type="button"
            onClick={() => {
              setActiveView('inicio');
              setIsMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-2xl transition-all duration-300 group ${activeView === 'inicio' ? 'text-emerald-700 bg-emerald-50 shadow-inner' : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`transition-transform duration-300 group-hover:scale-110 ${activeView === 'inicio' ? 'text-emerald-600' : ''}`}>
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Inicio
            {activeView === 'inicio' && (
              <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveView('cuentas');
              setIsMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-2xl transition-all duration-300 group ${activeView === 'cuentas' ? 'text-emerald-700 bg-emerald-50 shadow-inner' : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`transition-transform duration-300 group-hover:scale-110 ${activeView === 'cuentas' ? 'text-emerald-600' : ''}`}>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            Obligaciones
            {activeView === 'cuentas' && (
              <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
            )}
          </button>

          <div className="pt-4 pb-2">
            <p className="px-4 text-[9px] font-black text-slate-400 tracking-widest uppercase mb-1">
              Herramientas
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              onOpenModal('projection');
              setIsMobileMenuOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-white/50 rounded-2xl transition-all duration-300 group"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="transition-transform duration-300 group-hover:scale-110">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            Presupuestos
          </button>

          <button
            type="button"
            onClick={() => {
              onOpenModal('simulation');
              setIsMobileMenuOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-white/50 rounded-2xl transition-all duration-300 group"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="transition-transform duration-300 group-hover:scale-110">
               <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
            Simulador
          </button>

          {currentItems && currentItems.some((item) => item.consumptionUnit !== undefined && item.consumptionUnit !== null) && (
            <button
              onClick={() => {
                onOpenModal('consumption');
                setIsMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-white/50 rounded-2xl transition-all duration-300 group"
              type="button"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="transition-transform duration-300 group-hover:scale-110">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
              Consumo Físico
            </button>
          )}
        </nav>

        {/* Sidebar Bottom Profile/Settings */}
        <div className="p-4 relative">
          {/* Profile options menu floating */}
          {isProfileOpen && (
            <div className="absolute bottom-full left-4 right-4 mb-2 bg-white/90 backdrop-blur-xl border border-white shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] rounded-2xl p-2 animate-slide-up z-50">
              <button
                className="w-full text-left px-4 py-2.5 text-[11px] font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100/50 rounded-xl transition-colors"
                onClick={() => {
                  onGenerateDemoData();
                  setIsProfileOpen(false);
                  setIsMobileMenuOpen(false);
                }}
                type="button"
              >
                Cargar Demo Anual
              </button>
              {services && services.some((s) => s.is_demo) && (
                <button
                  className="w-full text-left px-4 py-2.5 text-[11px] font-bold text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors"
                  onClick={() => {
                    onDeleteDemoData();
                    setIsProfileOpen(false);
                    setIsMobileMenuOpen(false);
                  }}
                  type="button"
                >
                  Eliminar Demo
                </button>
              )}
              <div className="h-px w-full bg-slate-100 my-1"></div>
              <button
                className="w-full text-left px-4 py-2.5 text-[11px] font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100/50 rounded-xl transition-colors"
                onClick={() => {
                  onChangePassword();
                  setIsProfileOpen(false);
                  setIsMobileMenuOpen(false);
                }}
                type="button"
              >
                Cambiar Contraseña
              </button>
              <button
                className="w-full text-left px-4 py-2.5 text-[11px] font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100/50 rounded-xl transition-colors"
                onClick={() => {
                  onChangePassphraseClick();
                  setIsProfileOpen(false);
                  setIsMobileMenuOpen(false);
                }}
                type="button"
              >
                Frase Maestra
              </button>
              <button
                className="w-full text-left px-4 py-2.5 text-[11px] font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100/50 rounded-xl transition-colors"
                onClick={() => {
                  onShowWelcome();
                  setIsProfileOpen(false);
                  setIsMobileMenuOpen(false);
                }}
                type="button"
              >
                Ayuda / Privacidad
              </button>
              <div className="h-px w-full bg-slate-100 my-1"></div>
              <button
                className="w-full text-left px-4 py-2.5 text-[11px] font-black text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                onClick={onSignOut}
                type="button"
              >
                Cerrar Sesión
              </button>
            </div>
          )}

          <div 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer transition-all duration-300 ${isProfileOpen ? 'bg-white shadow-sm ring-1 ring-slate-100' : 'bg-white/40 border border-white/60 hover:bg-white/80 hover:shadow-sm'}`}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-400 to-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-md">
              {userName.substring(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] text-slate-800 font-black truncate">Mi Cuenta</p>
              <p className="text-[10px] text-slate-500 truncate font-semibold">{userName}</p>
            </div>
            <svg
              className={`text-slate-500 transition-transform duration-300 ${isProfileOpen ? 'rotate-180' : ''}`}
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        </div>
      </aside>
    </>
  );
}
