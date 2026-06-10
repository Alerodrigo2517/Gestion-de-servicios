'use client';
import ServiceCard from './ServiceCard';

export default function ServiceList({ title, items, type, onEdit, onDelete, onTogglePaid, onSimulate }) {
  const filteredItems = items.filter((item) => {
    if (type === 'service') {
      return item.type === 'service' || (item.type !== 'income' && item.type !== 'loan' && item.type !== 'overdue');
    }
    return item.type === type;
  });

  const renderEmptyState = () => {
    switch (type) {
      case 'income':
        return (
          <div className="flex flex-col items-center justify-center p-8 rounded-2xl bg-slate-900/10 border border-dashed border-white/5 text-center animate-fade-in select-none">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-500/5 text-emerald-500/60 border border-emerald-500/10 mb-3.5">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="19" x2="12" y2="5"></line>
                <polyline points="5 12 12 5 19 12"></polyline>
              </svg>
            </div>
            <h5 className="text-xs font-bold text-slate-300">Sin Ingresos Registrados</h5>
            <p className="text-[10px] text-slate-500 max-w-[220px] mt-1">Registra tus ingresos mensuales para calcular tu liquidez.</p>
          </div>
        );
      case 'service':
        return (
          <div className="flex flex-col items-center justify-center p-8 rounded-2xl bg-slate-900/10 border border-dashed border-white/5 text-center animate-fade-in select-none">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-sky-500/5 text-sky-500/60 border border-sky-500/10 mb-3.5">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
              </svg>
            </div>
            <h5 className="text-xs font-bold text-slate-300">Sin Servicios Registrados</h5>
            <p className="text-[10px] text-slate-500 max-w-[220px] mt-1">Agrega servicios fijos del hogar como Luz, Gas o Internet.</p>
          </div>
        );
      case 'loan':
        return (
          <div className="flex flex-col items-center justify-center p-8 rounded-2xl bg-slate-900/10 border border-dashed border-white/5 text-center animate-fade-in select-none">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-purple-500/5 text-purple-500/60 border border-purple-500/10 mb-3.5">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>
            <h5 className="text-xs font-bold text-slate-300">Sin Préstamos Activos</h5>
            <p className="text-[10px] text-slate-500 max-w-[220px] mt-1">No hay planes de cuotas ni préstamos pendientes cargados.</p>
          </div>
        );
      case 'overdue':
        return (
          <div className="flex flex-col items-center justify-center p-8 rounded-2xl bg-emerald-500/5 border border-dashed border-emerald-500/20 text-center animate-fade-in select-none">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-3.5 glow-emerald">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <h5 className="text-xs font-bold text-emerald-400">¡Al día con las cuentas!</h5>
            <p className="text-[10px] text-emerald-500/80 max-w-[220px] mt-1">No tienes facturas vencidas o atrasadas registradas este mes.</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between border-b border-white/5 pb-2.5 mb-4 select-none">
        <h3 className="text-xs font-black text-slate-200 tracking-wider uppercase">{title}</h3>
        {filteredItems.length > 0 && (
          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
            type === 'income' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
            type === 'service' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' :
            type === 'loan' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
            'bg-rose-500/10 text-rose-400 border border-rose-500/20'
          }`}>
            {filteredItems.length} {filteredItems.length === 1 ? 'REGISTRO' : 'REGISTROS'}
          </span>
        )}
      </div>

      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          renderEmptyState()
        ) : (
          filteredItems.map((item) => (
            <ServiceCard
              key={item.id}
              item={item}
              onEdit={onEdit}
              onDelete={onDelete}
              onTogglePaid={onTogglePaid}
              onSimulate={onSimulate}
            />
          ))
        )}
      </div>
    </div>
  );
}
