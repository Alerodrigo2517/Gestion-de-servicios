import { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { formatCurrency } from '@/lib/utils';
import {
  getServiceDueDate,
  getServiceStatus,
  affectsLiquidity,
} from '@/lib/statusHelper';

export default function HomeView({
  services,
  currentMonthIndex,
  months,
  onGenerateDemoData,
  onDeleteDemoData,
}) {
  const donutCanvasRef = useRef(null);
  const donutChartRef = useRef(null);
  const [showAllVencimientos, setShowAllVencimientos] = useState(false);

  // Scan all services across all months for unpaid overdues or today-due items (global banner)
  const globalAlertServices = services.filter((s) => {
    if (s.isPaid || s.type === 'income') return false;
    const statusInfo = getServiceStatus(s);
    return statusInfo.status === 'VENCIDO' || statusInfo.status === 'VENCE_HOY';
  });

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

  // Chronological due dates scanning
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
    : unpaidServices.slice(0, 5);

  // Insights calculation
  let showInsights = false;
  let insightContent = null;
  if (currentMonthIndex > 0) {
    const prevItems = services.filter(
      (s) =>
        s.paymentMonth === currentMonthIndex - 1 &&
        (s.type === 'service' ||
          (s.type !== 'income' && s.type !== 'loan' && s.type !== 'overdue'))
    );
    const currServices = currentItems.filter(
      (s) =>
        s.type === 'service' ||
        (s.type !== 'income' && s.type !== 'loan' && s.type !== 'overdue')
    );

    if (prevItems.length > 0) {
      showInsights = true;
      const prevTotal = prevItems.reduce((sum, item) => sum + item.amount, 0);
      const currTotal = currServices.reduce(
        (sum, item) => sum + item.amount,
        0
      );
      const diff = currTotal - prevTotal;

      insightContent = (
        <div>
          {Math.abs(diff) > 100 ? (
            diff > 0 ? (
              <p className="mt-1 text-slate-600 font-medium">
                Subieron{' '}
                <strong className="text-rose-600 font-extrabold">
                  {formatCurrency(diff)}
                </strong>{' '}
                vs {months[currentMonthIndex - 1]}.
              </p>
            ) : (
              <p className="mt-1 text-emerald-700 font-medium">
                Bajaron{' '}
                <strong className="font-extrabold text-emerald-600">
                  {formatCurrency(Math.abs(diff))}
                </strong>{' '}
                vs {months[currentMonthIndex - 1]}.
              </p>
            )
          ) : (
            <p className="mt-1 text-slate-500 font-medium text-xs">
              Mantenidos estables.
            </p>
          )}
        </div>
      );
    }
  }

  // Group expenses by category
  const expenseItems = currentItems.filter((item) => item.type !== 'income');
  const totalExpenses = expenseItems.reduce((sum, item) => sum + item.amount, 0);

  const categoriesMap = {
    comida: { name: 'Comida', amount: 0, color: '#2e3b85', count: 0 },
    transporte: { name: 'Transporte', amount: 0, color: '#0d9488', count: 0 },
    servicios: { name: 'Servicios', amount: 0, color: '#0ea5e9', count: 0 },
    ocio: { name: 'Ocio', amount: 0, color: '#10b981', count: 0 },
    otros: { name: 'Otros', amount: 0, color: '#6366f1', count: 0 }
  };

  expenseItems.forEach(item => {
    const n = item.name.toLowerCase();
    if (n.includes('coto') || n.includes('super') || n.includes('comida') || n.includes('carrefour') || n.includes('alimento') || n.includes('dia') || n.includes('jumbo') || n.includes('disco') || n.includes('cencosud') || n.includes('mercado') || n.includes('almacen')) {
      categoriesMap.comida.amount += item.amount;
      categoriesMap.comida.count++;
    } else if (n.includes('transporte') || n.includes('subte') || n.includes('nafta') || n.includes('auto') || n.includes('colectivo') || n.includes('uber') || n.includes('cabify') || n.includes('peaje') || n.includes('estacionamiento') || n.includes('cochera')) {
      categoriesMap.transporte.amount += item.amount;
      categoriesMap.transporte.count++;
    } else if (n.includes('luz') || n.includes('gas') || n.includes('agua') || n.includes('aysa') || n.includes('internet') || n.includes('wifi') || n.includes('telefono') || n.includes('celular') || n.includes('edenor') || n.includes('edesur') || n.includes('metrogas') || n.includes('camuzzi') || n.includes('aysa') || n.includes('flow') || n.includes('telecentro') || n.includes('cable') || n.includes('fibertel')) {
      categoriesMap.servicios.amount += item.amount;
      categoriesMap.servicios.count++;
    } else if (n.includes('netflix') || n.includes('spotify') || n.includes('disney') || n.includes('cine') || n.includes('salida') || n.includes('ocio') || n.includes('prime') || n.includes('hbo') || n.includes('youtube') || n.includes('streaming') || n.includes('club') || n.includes('gimnasio')) {
      categoriesMap.ocio.amount += item.amount;
      categoriesMap.ocio.count++;
    } else {
      categoriesMap.otros.amount += item.amount;
      categoriesMap.otros.count++;
    }
  });

  const activeCategories = Object.values(categoriesMap)
    .filter(cat => cat.amount > 0)
    .map(cat => ({
      ...cat,
      percentage: totalExpenses > 0 ? Math.round((cat.amount / totalExpenses) * 100) : 0
    }));

  useEffect(() => {
    if (!donutCanvasRef.current) return;
    
    // Destroy previous chart
    if (donutChartRef.current) {
      donutChartRef.current.destroy();
      donutChartRef.current = null;
    }

    if (activeCategories.length === 0) return;

    const ctx = donutCanvasRef.current.getContext('2d');
    donutChartRef.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: activeCategories.map(c => c.name),
        datasets: [{
          data: activeCategories.map(c => c.amount),
          backgroundColor: activeCategories.map(c => c.color),
          borderWidth: 0,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(9, 15, 29, 0.95)',
            titleFont: { family: 'var(--font-inter)', size: 12, weight: 'bold' },
            bodyFont: { family: 'var(--font-inter)', size: 11 },
            padding: 12,
            cornerRadius: 12,
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.parsed || 0;
                const percent = totalExpenses > 0 ? Math.round((value / totalExpenses) * 100) : 0;
                return ` ${label}: ${formatCurrency(value)} (${percent}%)`;
              }
            }
          }
        },
        cutout: '75%'
      }
    });

    return () => {
      if (donutChartRef.current) {
        donutChartRef.current.destroy();
        donutChartRef.current = null;
      }
    };
  }, [currentMonthIndex, services, activeCategories, totalExpenses]);

  return (
    <div className="space-y-8 pb-10">
      {/* Welcome Onboarding Banner */}
      {services && services.length === 0 && (
        <div className="p-6 rounded-3xl bg-gradient-to-br from-white to-slate-50 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 transition-all">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-sky-500/10 text-sky-600 shrink-0">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            </div>
            <div>
              <h4 className="text-lg font-black text-slate-800 tracking-tight">¡Te damos la bienvenida a ServiTrack! 👋</h4>
              <p className="text-sm text-slate-500 mt-1 max-w-2xl font-medium leading-relaxed">
                Para explorar los gráficos interactivos, alertas de vencimiento, cálculos de liquidez y simular bajas de gastos, te recomendamos cargar nuestro conjunto de datos de demostración anual.
              </p>
            </div>
          </div>
          <button
            onClick={onGenerateDemoData}
            className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-sm font-bold text-white transition-all shadow-lg shadow-emerald-500/20 active:scale-95 shrink-0 whitespace-nowrap"
            type="button"
          >
            Cargar Demo Anual
          </button>
        </div>
      )}

      {/* Demo Active Notice */}
      {services && services.length > 0 && services.some((s) => s.is_demo) && (
        <div className="px-5 py-4 rounded-2xl bg-amber-50/50 border border-amber-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-2.5 w-2.5 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            </span>
            <p className="text-sm text-amber-800/80 font-semibold">
              Visualizando <strong>datos de demostración</strong>.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={onGenerateDemoData}
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm"
              type="button"
            >
              Recargar Demo
            </button>
            <button
              onClick={onDeleteDemoData}
              className="px-4 py-2 rounded-xl bg-white border border-rose-100 text-xs font-bold text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-all shadow-sm"
              type="button"
            >
              Eliminar Demo
            </button>
          </div>
        </div>
      )}

      {/* Global immediate overdue alerts */}
      {globalAlertServices.length > 0 && (
        <div className="p-5 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-xl shadow-rose-500/20 flex items-start gap-4 animate-fade-in relative overflow-hidden">
          {/* Decorator circle */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/20 backdrop-blur-sm shrink-0 border border-white/20">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="animate-pulse">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </div>
          <div className="flex-1 min-w-0 z-10">
            <h4 className="text-sm font-black tracking-wide">
              Atención: Tienes {globalAlertServices.length} {globalAlertServices.length === 1 ? 'servicio por vencer' : 'servicios por vencer'}
            </h4>
            <div className="mt-3 flex flex-wrap gap-2">
              {globalAlertServices.map((s) => (
                <span key={s.id} className="px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                  {s.name} <span className="opacity-70 font-medium">({months[s.paymentMonth]})</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tarjetas de Hero (Liquidez y Proyección) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slide-up">
        {/* Liquidez Card */}
        <div className="relative overflow-hidden bg-white rounded-3xl p-8 flex flex-col justify-between shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-500 group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity duration-500 transform group-hover:scale-110">
            <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.7c.09 1.28 1.07 1.67 2.18 1.67 1.2 0 2.49-.61 2.49-1.95 0-1.71-3.95-1.4-3.95-4.11 0-1.58 1.2-2.58 2.85-2.93V5.41h2.67v1.95c1.4.3 2.5 1.23 2.65 2.9h-1.65c-.14-.99-.95-1.51-2.14-1.51-1.04 0-2.11.45-2.11 1.7 0 1.58 3.95 1.48 3.95 4.14 0 1.72-1.28 2.62-2.85 2.9z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
              <span className="text-xs font-black text-slate-400 tracking-widest uppercase">Liquidez Actual</span>
            </div>
            <h3 className="text-4xl sm:text-5xl font-black text-slate-800 tracking-tighter mt-1">
              {formatCurrency(liquidity)}
            </h3>
          </div>
          <p className="text-sm text-slate-500 font-medium mt-6 max-w-[200px] leading-snug">
            Dinero real disponible en tus cuentas.
          </p>
        </div>

        {/* Proyección Card */}
        <div className="relative overflow-hidden bg-white rounded-3xl p-8 flex flex-col justify-between shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-sky-500/10 transition-all duration-500 group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity duration-500 transform group-hover:scale-110">
             <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`w-2.5 h-2.5 rounded-full ${remaining < 0 ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]' : 'bg-sky-500 shadow-[0_0_10px_rgba(14,165,233,0.5)]'}`}></span>
              <span className="text-xs font-black text-slate-400 tracking-widest uppercase">Proyección a Fin de Mes</span>
            </div>
            <h3 className={`text-4xl sm:text-5xl font-black tracking-tighter mt-1 ${remaining < 0 ? 'text-rose-600' : 'text-slate-800'}`}>
              {formatCurrency(remaining)}
            </h3>
          </div>
          <p className="text-sm text-slate-500 font-medium mt-6 max-w-[200px] leading-snug">
            Estimación de saldo tras pagar todas tus obligaciones.
          </p>
        </div>
      </div>

      {/* Indicadores Secundarios (Clean Minimalist Row) */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 animate-slide-up flex flex-wrap lg:flex-nowrap divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
        <div className="flex-1 min-w-[140px] px-4 py-3 lg:py-0">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Ingresos</p>
          <p className="text-xl font-black text-slate-800">{formatCurrency(totalIncome)}</p>
        </div>
        <div className="flex-1 min-w-[140px] px-4 py-3 lg:py-0">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Gastos Totales</p>
          <p className="text-xl font-black text-slate-800">{formatCurrency(totalGeneral)}</p>
        </div>
        <div className="flex-1 min-w-[140px] px-4 py-3 lg:py-0">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pagados</p>
          <p className="text-xl font-black text-emerald-600">{formatCurrency(totalPaid)}</p>
        </div>
        <div className="flex-1 min-w-[140px] px-4 py-3 lg:py-0">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pendiente</p>
          <p className="text-xl font-black text-slate-800">{formatCurrency(totalDebt)}</p>
        </div>
        <div className="flex-1 min-w-[140px] px-4 py-3 lg:py-0">
          <p className="text-[11px] font-bold text-rose-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span> Atrasado
          </p>
          <p className="text-xl font-black text-rose-600">{formatCurrency(totalOverdue)}</p>
        </div>
      </div>

      {/* Donut Chart & Alerts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Expenses Donut Chart Card */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex flex-col transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-black text-slate-800 tracking-wide">Gastos por Categoría</h3>
            <span className="px-3 py-1 bg-slate-50 text-slate-500 rounded-full text-[10px] font-bold uppercase tracking-wider">Este Mes</span>
          </div>
          
          {activeCategories.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-10">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mb-3 opacity-50">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p className="text-sm font-bold text-slate-500">Sin datos registrados</p>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-10 flex-1">
              {/* Canvas Container */}
              <div className="relative w-48 h-48 shrink-0 drop-shadow-md">
                <canvas ref={donutCanvasRef}></canvas>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Total</span>
                  <span className="text-lg font-black text-slate-800 mt-0.5">{formatCurrency(totalExpenses)}</span>
                </div>
              </div>

              {/* Legend list */}
              <ul className="flex-1 w-full space-y-3">
                {activeCategories.map((cat, idx) => (
                  <li key={idx} className="flex justify-between items-center group cursor-default">
                    <span className="flex items-center gap-3">
                      <span className="w-3 h-3 rounded-full shrink-0 shadow-sm transition-transform group-hover:scale-125" style={{ backgroundColor: cat.color }}></span>
                      <span className="text-xs font-bold text-slate-600">{cat.name}</span>
                    </span>
                    <span className="text-xs text-slate-800 font-black">
                      {cat.percentage}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Resumen de Cuentas (Vencimientos & Insights) */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex flex-col transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-black text-slate-800 tracking-wide">Próximos Vencimientos</h3>
            {showInsights && insightContent && (
              <span className="flex items-center gap-1 text-[11px] font-bold text-sky-600 bg-sky-50 px-3 py-1 rounded-full">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                </svg>
                {insightContent}
              </span>
            )}
          </div>

          {/* Vencimientos list */}
          {unpaidServices.length > 0 ? (
            <div className="flex-1 flex flex-col">
              <ul className="space-y-3 flex-1">
                {displayedVencimientos.map((item, idx) => {
                  const isOverdue = item.statusInfo.status === 'VENCIDO';
                  const dateFormatted = item.dueDate ? item.dueDate.split('-').reverse().slice(0,2).join('/') : '';
                  return (
                    <li key={idx} className="flex justify-between items-center p-3 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${isOverdue ? 'bg-rose-100 text-rose-500' : 'bg-white shadow-sm text-slate-400'}`}>
                           <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                              <line x1="16" y1="2" x2="16" y2="6"></line>
                              <line x1="8" y1="2" x2="8" y2="6"></line>
                              <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">{item.name}</p>
                          <p className={`text-[10px] font-bold mt-0.5 uppercase tracking-wide ${isOverdue ? 'text-rose-500' : 'text-slate-400'}`}>
                            {isOverdue ? 'Vencido' : `Vence: ${dateFormatted}`}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm text-slate-900 font-black shrink-0 pl-4">
                        {formatCurrency(item.amount)}
                      </span>
                    </li>
                  );
                })}
              </ul>
              {unpaidServices.length > 5 && (
                <button
                  onClick={() => setShowAllVencimientos(!showAllVencimientos)}
                  className="w-full mt-4 text-center text-xs font-bold text-slate-500 hover:text-slate-800 transition py-3 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 cursor-pointer shadow-sm active:scale-95"
                  type="button"
                >
                  {showAllVencimientos ? 'Mostrar menos' : `Ver todos los pendientes (${unpaidServices.length})`}
                </button>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-10">
               <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mb-3 opacity-50">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              <p className="text-sm font-bold text-slate-500">Todo al día</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
