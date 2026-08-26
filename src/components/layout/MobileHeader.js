import React from 'react';

export default function MobileHeader({ onToggleMenu, onSignOut }) {
  return (
    <header className="md:hidden flex items-center justify-between p-4 bg-slate-950/80 backdrop-blur-3xl border-b border-white/10 sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMenu}
          className="p-2 text-slate-400 hover:bg-slate-800/80 rounded-lg transition-colors"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        <h1 className="text-xl font-black bg-gradient-to-r from-sky-500 to-indigo-600 bg-clip-text text-transparent tracking-tight">
          ServiTrack
        </h1>
      </div>
      
      <button
        onClick={onSignOut}
        className="w-8 h-8 rounded-full bg-slate-800/50 flex items-center justify-center text-slate-400 hover:bg-rose-500/20 hover:text-rose-400 transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
          <polyline points="16 17 21 12 16 7"></polyline>
          <line x1="21" y1="12" x2="9" y2="12"></line>
        </svg>
      </button>
    </header>
  );
}
