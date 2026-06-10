'use client';
import { formatCurrency } from '@/lib/utils';

const months = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function ServiceCard({ item, onEdit, onDelete, onTogglePaid, onSimulate }) {
  const isPaid = item.isPaid;
  const type = item.type;
  
  let cardClass = '';
  if (isPaid) {
    cardClass = 'flex justify-between items-center bg-slate-900/10 border border-white/5 p-4 rounded-xl opacity-60 hover:bg-slate-900/20 transition-all duration-300';
  } else {
    cardClass = 'flex justify-between items-center bg-white/5 border border-white/10 p-4 rounded-xl hover:bg-white/10 hover:-translate-y-0.5 transition-all duration-300 shadow-md';
  }

  let metaText = '';
  let nameHtml = null;
  let progressBarHtml = null;

  if (type === 'loan') {
    const progressPercent = Math.min(
      100,
      Math.round(((item.currentInstallment || 1) / (item.totalInstallments || 1)) * 100)
    );

    nameHtml = (
      <div className="flex justify-between items-center w-full">
        <div className="text-white font-semibold text-base">
          {item.name} <span className="text-xs text-slate-400 font-normal">({item.creditor || 'N/A'})</span>
        </div>
        <div className="text-white font-bold text-lg">{formatCurrency(item.amount)}</div>
      </div>
    );

    metaText = `Titular: ${item.titular || 'N/A'} | Cuota ${item.currentInstallment || 1} de ${item.totalInstallments || 1}`;
    progressBarHtml = (
      <div className="w-full bg-black/30 rounded-full h-1.5 mt-2 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-purple-500 to-sky-400 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        ></div>
      </div>
    );
  } else if (type === 'income') {
    metaText = `Ingreso reportado en ${months[item.paymentMonth]}`;
    nameHtml = <div className="font-semibold text-base text-emerald-400">{item.name}</div>;
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
      metaText += ` | ${item.consumptionUnit} und.`;
    }

    if (isPaid) {
      nameHtml = <div className="text-slate-500 line-through font-semibold text-base">{item.name}</div>;
    } else {
      nameHtml = <div className="text-white font-semibold text-base">{item.name}</div>;
    }
  }

  if (isPaid && item.paymentDate) {
    metaText += ` | Pagado el: ${item.paymentDate}`;
  }

  return (
    <div className={cardClass}>
      <div className={`flex-1 ${type === 'loan' ? 'w-full' : ''}`}>
        {nameHtml}
        <div className="text-xs text-slate-400 mt-1 flex flex-wrap gap-2 items-center">{metaText}</div>
        {progressBarHtml}
      </div>
      
      {type !== 'loan' && (
        <div className={`text-lg font-bold text-slate-100 shrink-0 mr-5 ${type === 'income' ? 'text-emerald-400' : ''}`}>
          {formatCurrency(item.amount)}
        </div>
      )}
      
      <div className={`flex items-center gap-2 shrink-0 ${type === 'loan' ? 'ml-4' : ''}`}>
        {type !== 'income' && (
          <button
            className="p-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition duration-150 active:scale-95"
            onClick={() => onSimulate(item.id)}
            title="Simular Baja"
            type="button"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="8" y1="12" x2="16" y2="12"></line>
            </svg>
          </button>
        )}
        
        <button
          className="p-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition duration-150 active:scale-95"
          onClick={() => onEdit(item.id)}
          title="Editar"
          type="button"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        </button>
        
        {type !== 'income' && (
          <button
            className={`p-2 ${isPaid ? 'bg-slate-700 hover:bg-slate-600' : 'bg-emerald-500 hover:bg-emerald-600'} text-white rounded-lg transition duration-150 active:scale-95`}
            onClick={() => onTogglePaid(item.id)}
            title={isPaid ? 'Marcar como pendiente' : 'Marcar como pagado'}
            type="button"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </button>
        )}
        
        <button
          className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition duration-150 active:scale-95"
          onClick={() => onDelete(item.id)}
          title="Eliminar"
          type="button"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    </div>
  );
}
