export default function MobileHeader({ userName, setIsMobileMenuOpen }) {
  return (
    <header className="lg:hidden w-full px-5 py-4 bg-[#090f1d] text-white flex items-center justify-between sticky top-0 z-30 shadow-md">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition cursor-pointer"
          aria-label="Abrir menú"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-emerald-400 to-indigo-600 flex items-center justify-center text-white font-black text-xs">
            F
          </div>
          <h1 className="text-sm font-black tracking-tight text-white flex items-center gap-1 select-none">
            <span className="text-emerald-400">FINANZAS</span>
            <span>YA</span>
          </h1>
        </div>
      </div>
      <div 
        onClick={() => setIsMobileMenuOpen(true)}
        className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-400 to-indigo-600 flex items-center justify-center text-white font-extrabold text-xs cursor-pointer select-none"
      >
        {userName.substring(0, 2).toUpperCase()}
      </div>
    </header>
  );
}
