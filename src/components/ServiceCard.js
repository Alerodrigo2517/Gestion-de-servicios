'use client';
import { formatCurrency } from '@/lib/utils';

const months = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

// Contextual categorization helper
const getCategoryIconAndColor = (name, type) => {
  const n = name.toLowerCase();
  
  if (type === 'income') {
    return {
      colorClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 glow-emerald',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="12" y1="19" x2="12" y2="5"></line>
          <polyline points="5 12 12 5 19 12"></polyline>
        </svg>
      )
    };
  }
  
  if (type === 'loan') {
    return {
      colorClass: 'text-purple-400 bg-purple-500/10 border-purple-500/20 glow-purple',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
      )
    };
  }

  // Regular services keyword mapping
  if (n.includes('luz') || n.includes('edesur') || n.includes('edenor') || n.includes('electricidad') || n.includes('energia')) {
    return {
      colorClass: 'text-amber-400 bg-amber-500/10 border-amber-500/20 glow-amber',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
        </svg>
      )
    };
  }
  if (n.includes('gas') || n.includes('metrogas') || n.includes('camuzzi')) {
    return {
      colorClass: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M12 2c0 0-4 4.5-4 7.5a4 4 0 0 0 8 0c0-3-4-7.5-4-7.5z"></path>
        </svg>
      )
    };
  }
  if (n.includes('agua') || n.includes('aysa') || n.includes('cloaca') || n.includes('irrigacion')) {
    return {
      colorClass: 'text-sky-400 bg-sky-500/10 border-sky-500/20 glow-sky',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
        </svg>
      )
    };
  }
  if (n.includes('internet') || n.includes('wifi') || n.includes('cable') || n.includes('fibertel') || n.includes('flow') || n.includes('telecentro') || n.includes('telefono') || n.includes('movistar') || n.includes('personal') || n.includes('claro')) {
    return {
      colorClass: 'text-blue-400 bg-blue-500/10 border-blue-500/20 glow-sky',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M5 12.55a11 11 0 0 1 14.08 0"></path>
          <path d="M1.42 9a16 16 0 0 1 21.16 0"></path>
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
          <circle cx="12" cy="20" r="1"></circle>
        </svg>
      )
    };
  }
  if (n.includes('netflix') || n.includes('spotify') || n.includes('disney') || n.includes('prime') || n.includes('hbo') || n.includes('sub') || n.includes('youtube') || n.includes('crunchyroll') || n.includes('streaming')) {
    return {
      colorClass: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20 glow-purple',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polygon points="23 7 16 12 23 17 23 7"></polygon>
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
        </svg>
      )
    };
  }
  if (n.includes('tarjeta') || n.includes('visa') || n.includes('master') || n.includes('mastercard') || n.includes('amex') || n.includes('banco') || n.includes('nacion') || n.includes('provincia') || n.includes('galicia') || n.includes('santander') || n.includes('bbva')) {
    return {
      colorClass: 'text-violet-400 bg-violet-500/10 border-violet-500/20 glow-purple',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
          <line x1="1" y1="10" x2="23" y2="10"></line>
        </svg>
      )
    };
  }
  if (n.includes('alquiler') || n.includes('expensas') || n.includes('cochera') || n.includes('renta') || n.includes('inmobiliaria')) {
    return {
      colorClass: 'text-rose-400 bg-rose-500/10 border-rose-500/20 glow-rose',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
      )
    };
  }
  if (n.includes('super') || n.includes('carrefour') || n.includes('coto') || n.includes('comida') || n.includes('alimento') || n.includes('compras') || n.includes('dia') || n.includes('jumbo') || n.includes('disco')) {
    return {
      colorClass: 'text-teal-400 bg-teal-500/10 border-teal-500/20 glow-emerald',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="9" cy="21" r="1"></circle>
          <circle cx="20" cy="21" r="1"></circle>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
        </svg>
      )
    };
  }
  return {
    colorClass: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
      </svg>
    )
  };
};

export default function ServiceCard({ item, onEdit, onDelete, onTogglePaid, onSimulate }) {
  const isPaid = item.isPaid;
  const type = item.type;
  
  let cardClass = 'flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 rounded-2xl transition-all duration-300 gap-4 ';
  if (isPaid) {
    cardClass += 'bg-slate-950/20 border border-white/5 opacity-60 hover:opacity-100 hover:bg-slate-900/40';
  } else {
    cardClass += 'glass-premium border-white/10 hover:border-white/20 hover:bg-slate-900/60 hover:-translate-y-0.5 shadow-lg';
  }

  let metaText = '';
  let progressBarHtml = null;

  if (type === 'loan') {
    const progressPercent = Math.min(
      100,
      Math.round(((item.currentInstallment || 1) / (item.totalInstallments || 1)) * 100)
    );

    metaText = `Titular: ${item.titular || 'N/A'} | Cuota ${item.currentInstallment || 1} de ${item.totalInstallments || 1}`;
    progressBarHtml = (
      <div className="w-full bg-black/40 rounded-full h-1.5 mt-2.5 overflow-hidden border border-white/5 flex">
        <div
          className="h-full bg-gradient-to-r from-purple-500 to-sky-400 rounded-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        ></div>
        <span className="text-[9px] text-slate-400 font-bold ml-2 -mt-1 select-none">
          {progressPercent}%
        </span>
      </div>
    );
  } else if (type === 'income') {
    metaText = `Ingreso reportado en ${months[item.paymentMonth]}`;
  } else {
    metaText = `Consumo: ${months[item.consumptionMonth]}`;
    if (
      item.consumptionMonthEnd !== undefined &&
      item.consumptionMonthEnd !== null &&
      item.consumptionMonthEnd !== item.consumptionMonth
    ) {
      metaText += ` a ${months[item.consumptionMonthEnd]}`;
    }
    if (item.consumptionUnit) {
      metaText += ` | ${item.consumptionUnit} unds.`;
    }
    const dueDay = item.nextMeasurementDate || item.billingCloseDate;
    if (dueDay) {
      metaText += ` | Vence el día ${dueDay}`;
    }
  }

  if (isPaid && item.paymentDate) {
    metaText += ` | Pagado: ${item.paymentDate}`;
  }

  const { colorClass, icon } = getCategoryIconAndColor(item.name, type);

  return (
    <div className={cardClass}>
      <div className="flex-1 min-w-0 w-full flex items-start gap-3.5">
        {/* Category Icon Badge */}
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${colorClass}`}>
          {icon}
        </div>
        
        {/* Texts */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {type === 'loan' ? (
              <h4 className="text-white font-bold text-sm tracking-tight truncate">
                {item.name} <span className="text-[10px] text-slate-400 font-normal">({item.creditor || 'N/A'})</span>
              </h4>
            ) : type === 'income' ? (
              <h4 className="text-emerald-400 font-extrabold text-sm tracking-tight truncate">{item.name}</h4>
            ) : (
              <h4 className={`text-sm font-bold tracking-tight truncate ${isPaid ? 'text-slate-500 line-through' : 'text-white'}`}>
                {item.name}
              </h4>
            )}

            {/* Status Badge */}
            {type !== 'income' && (
              isPaid ? (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-0.5 shrink-0">
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  PAGADO
                </span>
              ) : (
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border flex items-center gap-1 shrink-0 ${
                  type === 'overdue' 
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse' 
                    : 'bg-slate-500/10 text-slate-400 border-slate-500/15'
                }`}>
                  {type === 'overdue' ? 'VENCIDO' : 'PENDIENTE'}
                </span>
              )
            )}
          </div>

          <p className="text-[11px] text-slate-400 mt-1 font-medium truncate">
            {metaText}
          </p>

          {progressBarHtml}
        </div>
      </div>

      {/* Amount and Actions wrapper */}
      <div className="flex items-center justify-between sm:justify-end gap-5 w-full sm:w-auto shrink-0 border-t border-white/5 sm:border-0 pt-3 sm:pt-0">
        {/* Amount */}
        <div className={`text-base font-extrabold text-slate-100 ${type === 'income' ? 'text-emerald-400' : ''}`}>
          {formatCurrency(item.amount)}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          {type !== 'income' && (
            <button
              className="w-9 h-9 rounded-xl bg-sky-500/10 hover:bg-sky-500 text-sky-400 hover:text-white border border-sky-500/20 flex items-center justify-center transition-all duration-200 active:scale-90 cursor-pointer"
              onClick={() => onSimulate(item.id)}
              title="Simular Baja"
              type="button"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
            </button>
          )}
          
          <button
            className="w-9 h-9 rounded-xl bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-white border border-amber-500/20 flex items-center justify-center transition-all duration-200 active:scale-90 cursor-pointer"
            onClick={() => onEdit(item.id)}
            title="Editar"
            type="button"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          
          {type !== 'income' && (
            <button
              className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all duration-200 active:scale-90 cursor-pointer ${
                isPaid 
                  ? 'bg-slate-500/10 hover:bg-slate-500 text-slate-400 hover:text-white border-slate-500/20' 
                  : 'bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white border-emerald-500/25'
              }`}
              onClick={() => onTogglePaid(item.id)}
              title={isPaid ? 'Marcar como pendiente' : 'Marcar como pagado'}
              type="button"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </button>
          )}
          
          <button
            className="w-9 h-9 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/20 flex items-center justify-center transition-all duration-200 active:scale-90 cursor-pointer"
            onClick={() => onDelete(item.id)}
            title="Eliminar"
            type="button"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
