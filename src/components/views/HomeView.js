import { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { formatCurrency } from '@/lib/utils';
import {
  getServiceDueDate,
  getServiceStatus,
  affectsLiquidity,
} from '@/lib/statusHelper';
import ServiceCard from '../ServiceCard';

export default function HomeView({
  services,
  currentMonthIndex,
  months,
  onGenerateDemoData,
  onDeleteDemoData,
  onTogglePaid,
  onEdit,
  onSimulate
}) {
  const chartCanvasRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const [showAllVencimientos, setShowAllVencimientos] = useState(false);

  const currentItems = services.filter(
    (s) => s.paymentMonth === currentMonthIndex
  );

  let totalPending = 0;
  let totalPaid = 0;
  let totalLoans = 0;
  let totalOverdue = 0;
  let totalIncome = 0;

  currentItems.forEach((item) => {
    if (item.type === 'income') {
      totalIncome += item.amount;
    } else if (item.type === 'loan') {
      if (!item.isPaid) {
        totalLoans += item.amount;
      } else if (affectsLiquidity(item)) {
        totalPaid += item.amount;
      }
    } else if (item.type === 'overdue') {
      if (!item.isPaid) {
        totalOverdue += item.amount;
      } else if (affectsLiquidity(item)) {
        totalPaid += item.amount;
      }
    } else {
      if (!item.isPaid) {
        totalPending += item.amount;
      } else if (affectsLiquidity(item)) {
        totalPaid += item.amount;
      }
    }
  });

  const totalGeneral = totalPending + totalPaid + totalLoans + totalOverdue;
  const totalDebt = totalPending + totalLoans + totalOverdue;
  const remaining = totalIncome - totalGeneral;
  const liquidity = totalIncome - totalPaid;

  const unpaidServices = currentItems
    .filter((item) => item.type !== 'income' && !item.isPaid)
    .map((item) => {
      const dueDateObj = getServiceDueDate(item);
      const statusInfo = getServiceStatus(item);
      return { ...item, dueDateObj, statusInfo };
    });

  unpaidServices.sort(
    (a, b) => a.dueDateObj.getTime() - b.dueDateObj.getTime()
  );

  const displayedVencimientos = showAllVencimientos
    ? unpaidServices
    : unpaidServices.slice(0, 4);

  // Group expenses by category
  const expenseItems = currentItems.filter((item) => item.type !== 'income');
  const categoriesMap = {
    comida: { name: 'Comida', amount: 0, color: '#f59e0b' },
    transporte: { name: 'Transporte', amount: 0, color: '#0ea5e9' },
    servicios: { name: 'Servicios', amount: 0, color: '#8b5cf6' },
    ocio: { name: 'Ocio', amount: 0, color: '#10b981' },
    otros: { name: 'Otros', amount: 0, color: '#64748b' }
  };

  expenseItems.forEach(item => {
    const n = item.name.toLowerCase();
    if (n.includes('coto') || n.includes('super') || n.includes('comida') || n.includes('dia') || n.includes('jumbo')) {
      categoriesMap.comida.amount += item.amount;
    } else if (n.includes('transporte') || n.includes('subte') || n.includes('nafta') || n.includes('auto') || n.includes('uber')) {
      categoriesMap.transporte.amount += item.amount;
    } else if (n.includes('luz') || n.includes('gas') || n.includes('agua') || n.includes('internet') || n.includes('flow')) {
      categoriesMap.servicios.amount += item.amount;
    } else if (n.includes('netflix') || n.includes('spotify') || n.includes('cine') || n.includes('ocio')) {
      categoriesMap.ocio.amount += item.amount;
    } else {
      categoriesMap.otros.amount += item.amount;
    }
  });

  const activeCategories = Object.values(categoriesMap).filter(c => c.amount > 0);

  useEffect(() => {
    if (!chartCanvasRef.current) return;
    
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    if (activeCategories.length === 0) return;

    const ctx = chartCanvasRef.current.getContext('2d');
    chartInstanceRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: activeCategories.map(c => c.name),
        datasets: [{
          data: activeCategories.map(c => c.amount),
          backgroundColor: activeCategories.map(c => c.color),
          borderRadius: 6,
          borderWidth: 0,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            titleFont: { family: 'var(--font-inter)', size: 12, weight: 'bold' },
            bodyFont: { family: 'var(--font-inter)', size: 11 },
            padding: 12,
            cornerRadius: 8,
            callbacks: {
              label: function(context) {
                return ` ${formatCurrency(context.parsed.y)}`;
              }
            }
          }
        },
        scales: {
          y: { display: false, beginAtZero: true },
          x: {
            grid: { display: false, drawBorder: false },
            ticks: { font: { family: 'var(--font-inter)', size: 11, weight: '600' }, color: '#94a3b8' }
          }
        }
      }
    });

    return () => {
      if (chartInstanceRef.current) chartInstanceRef.current.destroy();
    };
  }, [currentMonthIndex, services, activeCategories]);

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome Banner */}
      {services && services.length === 0 && (
        <div className="p-6 rounded-2xl glass-premium bg-slate-900/40 border border-white/5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h4 className="text-lg font-black text-white tracking-tight">¡Bienvenido a ServiTrack! 👋</h4>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl font-medium">
              Te recomendamos cargar los datos de demostración anual para ver cómo funciona el panel.
            </p>
          </div>
          <button
            onClick={onGenerateDemoData}
            className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-sm font-bold text-white transition-all shadow-lg active:scale-95 shrink-0"
          >
            Cargar Demo
          </button>
        </div>
      )}

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-slide-up">
        
        {/* Main Hero Card (8 cols) */}
        <div className="col-span-1 md:col-span-8 glass-premium bg-slate-900/40 border border-white/5 shadow-lg rounded-3xl p-8 flex flex-col justify-between min-h-[280px] relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 via-indigo-500/5 to-emerald-500/10 opacity-50 group-hover:opacity-70 transition-opacity duration-700 pointer-events-none"></div>
          
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
                <span className="text-xs font-black text-slate-400 tracking-widest uppercase">Balance Disponible</span>
              </div>
              <h3 className="text-5xl sm:text-6xl font-black text-white tracking-tighter mt-1">
                {formatCurrency(liquidity)}
              </h3>
            </div>
            
            <div className="bg-slate-950/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 shadow-sm flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${remaining >= 0 ? 'bg-emerald-400' : 'bg-rose-400 animate-pulse'}`}></span>
              <span className="text-xs font-bold text-slate-300">
                A fin de mes: {formatCurrency(remaining)}
              </span>
            </div>
          </div>

          <div className="relative z-10 flex gap-4 mt-8">
            <button className="flex-1 bg-slate-800/50 backdrop-blur-md border border-white/10 shadow-sm text-white font-bold text-sm py-3.5 rounded-xl hover:bg-slate-700 transition-all hover:-translate-y-0.5 active:scale-95">
              Enviar Dinero
            </button>
            <button className="flex-1 bg-slate-800/50 backdrop-blur-md border border-white/10 shadow-sm text-white font-bold text-sm py-3.5 rounded-xl hover:bg-slate-700 transition-all hover:-translate-y-0.5 active:scale-95">
              Ingresar Fondos
            </button>
          </div>
        </div>

        {/* Savings Goal / Progress (4 cols) */}
        <div className="col-span-1 md:col-span-4 glass-premium bg-slate-900/40 border border-white/5 shadow-lg rounded-3xl p-8 flex flex-col justify-between hover:-translate-y-1 transition-all">
          <div>
            <div className="font-black text-[10px] text-slate-500 uppercase tracking-widest mb-1">Gastos Totales (Pagado vs Pendiente)</div>
            <div className="font-black text-3xl text-white tracking-tight">{formatCurrency(totalGeneral)}</div>
            <div className="font-bold text-xs text-rose-500 mt-2">Por pagar: {formatCurrency(totalDebt)}</div>
          </div>
          
          <div className="mt-6">
            <div className="flex justify-between text-xs font-bold text-slate-400 mb-2">
              <span>Pagado</span>
              <span className="text-emerald-400">{totalGeneral > 0 ? Math.round((totalPaid / totalGeneral) * 100) : 0}%</span>
            </div>
            <div className="w-full bg-slate-800/50 rounded-full h-3 overflow-hidden flex border border-white/5">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-sky-500 h-full rounded-full transition-all duration-1000" 
                style={{ width: `${totalGeneral > 0 ? (totalPaid / totalGeneral) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Bar Chart (7 cols) */}
        <div className="col-span-1 md:col-span-7 glass-premium bg-slate-900/40 border border-white/5 shadow-lg rounded-3xl p-8 flex flex-col hover:-translate-y-1 transition-all min-h-[300px]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-black text-white tracking-wide">Desglose de Gastos</h3>
            <span className="px-3 py-1 bg-slate-800 text-slate-400 rounded-full text-[10px] font-bold uppercase tracking-wider">Categorías</span>
          </div>
          <div className="flex-1 relative w-full pt-2">
            {activeCategories.length > 0 ? (
              <canvas ref={chartCanvasRef} className="w-full h-full max-h-[220px]"></canvas>
            ) : (
              <div className="flex h-full items-center justify-center text-slate-500 font-bold text-sm">Sin gastos registrados</div>
            )}
          </div>
        </div>

        {/* Upcoming Bills (5 cols) */}
        <div className="col-span-1 md:col-span-5 glass-premium bg-slate-900/40 border border-white/5 shadow-lg rounded-3xl p-8 flex flex-col hover:-translate-y-1 transition-all">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-black text-white tracking-wide">Próximos Pagos</h3>
          </div>
          <div className="flex-1 flex flex-col space-y-3">
            {displayedVencimientos.length > 0 ? (
              displayedVencimientos.map((item, idx) => (
                <ServiceCard
                  key={idx}
                  item={item}
                  onEdit={onEdit}
                  onTogglePaid={onTogglePaid}
                  onSimulate={onSimulate}
                  onDelete={() => {}}
                />
              ))
            ) : (
              <div className="flex h-full items-center justify-center text-slate-400 font-bold text-sm">Todo al día</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
