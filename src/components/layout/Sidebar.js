import React from 'react';

export default function Sidebar({
  currentMonthIndex,
  setCurrentMonthIndex,
  months,
  onGenerateDemoData,
  onSignOut,
  userName = 'Usuario'
}) {
  return (
    <aside className="hidden md:flex flex-col w-64 h-screen fixed top-0 left-0 bg-slate-950/80 backdrop-blur-3xl border-r border-white/10 z-50">
      <div className="p-6">
        <h1 className="text-2xl font-black bg-gradient-to-r from-sky-500 to-indigo-600 bg-clip-text text-transparent tracking-tight">
          ServiTrack
        </h1>
        <p className="text-[10px] font-bold text-sky-500 tracking-widest uppercase">
          Finance Dashboard
        </p>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
        <div className="text-xs font-bold text-slate-400 mb-2 px-2 uppercase tracking-wider">Meses</div>
        {months.map((month, index) => {
          const isActive = index === currentMonthIndex;
          return (
            <button
              key={month}
              onClick={() => setCurrentMonthIndex(index)}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-3 transition-all ${
                isActive
                  ? 'bg-sky-500/10 text-sky-400 shadow-sm border border-sky-500/20'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              {month}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10 space-y-2">
        <button
          onClick={onGenerateDemoData}
          className="w-full px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-3 text-emerald-400 hover:bg-emerald-500/10 transition-all"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
          Demo Data
        </button>

        <button
          onClick={onSignOut}
          className="w-full px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-3 text-rose-400 hover:bg-rose-500/10 transition-all"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          Salir
        </button>

        <div className="flex items-center gap-3 px-4 py-2 mt-4 bg-slate-900/50 rounded-xl border border-white/5">
          <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-black border border-indigo-500/30">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-white truncate">{userName}</p>
            <p className="text-[10px] text-slate-400">Miembro Premium</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
