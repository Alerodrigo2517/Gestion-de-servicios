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
              <p className="mt-2 text-slate-600 font-medium">
                Tus gastos regulares subieron{' '}
                <strong className="text-rose-600 font-extrabold">
                  {formatCurrency(diff)}
                </strong>{' '}
                respecto a {months[currentMonthIndex - 1]}.
              </p>
            ) : (
              <p className="mt-2 text-emerald-700 font-medium">
                ¡Excelente! Tus gastos bajaron{' '}
                <strong className="font-extrabold text-emerald-600">
                  {formatCurrency(Math.abs(diff))}
                </strong>{' '}
                respecto a {months[currentMonthIndex - 1]}.
              </p>
            )
          ) : (
            <p className="mt-2 text-slate-600 font-medium">
              Tus gastos se mantienen estables respecto al mes anterior.
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
          borderWidth: 2,
          borderColor: '#ffffff',
          hoverOffset: 4
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
            padding: 10,
            cornerRadius: 8,
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
        cutout: '70%'
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
    <>
      {/* Welcome Onboarding Banner */}
      {services && services.length === 0 && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 animate-fade-in">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-sky-500/10 text-sky-600 border border-sky-100 shrink-0">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            </div>
            <div>
              <h4 className="text-base font-black text-slate-900">¡Te damos la bienvenida a ServiTrack! 👋</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed font-semibold">
                Para explorar los gráficos interactivos, alertas de vencimiento, cálculos de liquidez y simular bajas de gastos, te recomendamos cargar nuestro conjunto de **datos de demostración anual**.
              </p>
            </div>
          </div>
          <button
            onClick={onGenerateDemoData}
            className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition duration-300 shadow-md shadow-emerald-600/10 active:scale-95 shrink-0 flex items-center gap-2 cursor-pointer"
            type="button"
          >
            Cargar Demo Anual
          </button>
        </div>
      )}

      {/* Demo Active Notice */}
      {services && services.length > 0 && services.some((s) => s.is_demo) && (
        <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-3">
            <span className="flex h-2.5 w-2.5 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            </span>
            <p className="text-xs text-amber-800 font-semibold leading-relaxed">
              Estás visualizando los **datos de demostración anual**. Puedes explorar libremente o borrarlos para cargar tus propios gastos.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={onGenerateDemoData}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition duration-200 cursor-pointer shadow-sm"
              type="button"
            >
              Recargar Demo
            </button>
            <button
              onClick={onDeleteDemoData}
              className="px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-[11px] font-bold text-rose-600 hover:bg-rose-100/50 transition duration-200 cursor-pointer flex items-center gap-1.5 shadow-sm"
              type="button"
            >
              Eliminar Demo
            </button>
          </div>
        </div>
      )}

      {/* Global immediate overdue alerts */}
      {globalAlertServices.length > 0 && (
        <div
          role="status"
          aria-live="polite"
          className="p-5 rounded-2xl bg-white border border-rose-100 shadow-sm flex items-start gap-4 animate-slide-up relative z-10"
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-rose-50 text-rose-500 border border-rose-100 shrink-0">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className="animate-pulse"
              aria-hidden="true"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-black text-rose-600 uppercase tracking-wider">
              Atención: Vencimientos Inmediatos
            </h4>
            <p className="text-xs text-slate-600 font-semibold mt-1">
              Tienes {globalAlertServices.length}{' '}
              {globalAlertServices.length === 1
                ? 'servicio vencido o que vence hoy'
                : 'servicios vencidos o que vencen hoy'}
              . Regístralo o realízalo cuanto antes:
            </p>
            <ul className="mt-3 flex flex-wrap gap-2 text-[10px] text-slate-500 font-bold">
              {globalAlertServices.map((s) => {
                const statusInfo = getServiceStatus(s);
                return (
                  <li
                    key={s.id}
                    className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center gap-1.5 hover:border-slate-300 transition duration-200"
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${statusInfo.status === 'VENCIDO' ? 'bg-rose-500 animate-pulse' : 'bg-orange-500 animate-pulse'}`}
                    ></span>
                    <span className="text-slate-700">{s.name}</span>
                    <span className="text-slate-400 font-semibold">
                      ({months[s.paymentMonth]})
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      {/* Tarjetas de Hero (Liquidez y Proyección) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slide-up">
        {/* Liquidez Card */}
        <div className="relative overflow-hidden bg-white border-l-4 border-l-emerald-500 border border-slate-200/60 rounded-2xl p-6 flex items-center justify-between gap-5 hover-lift transition duration-300">
          <div className="min-w-0 flex-1">
            <span className="text-xs font-black text-slate-500 tracking-wider uppercase">
              Liquidez (Dinero en Mano)
            </span>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
              Liquidez total disponible
            </p>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-emerald-600 mt-1.5 tracking-tight truncate">
              {formatCurrency(liquidity)}
            </h3>
          </div>
          <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-emerald-50 border border-emerald-100 text-emerald-600 relative z-10 shrink-0 shadow-sm shadow-emerald-100/50">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <rect x="2" y="6" width="20" height="12" rx="2"></rect>
              <circle cx="12" cy="12" r="2"></circle>
              <path d="M6 12h.01M18 12h.01"></path>
            </svg>
          </div>
        </div>

        {/* Proyección Card */}
        <div
          className={`relative overflow-hidden bg-white border-l-4 border border-slate-200/60 rounded-2xl p-6 flex items-center justify-between gap-5 hover-lift transition duration-300 ${
            remaining < 0 ? 'border-l-rose-500' : 'border-l-sky-500'
          }`}
        >
          <div className="min-w-0 flex-1">
            <span
              className={`text-xs font-black tracking-wider uppercase ${
                remaining < 0 ? 'text-rose-500/80' : 'text-sky-500/80'
              }`}
            >
              Proyección Fin de Mes
            </span>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
              Estimación de saldo neto
            </p>
            <h3
              className={`text-3xl sm:text-4xl font-extrabold mt-1.5 tracking-tight truncate ${
                remaining < 0 ? 'text-rose-600' : 'text-sky-600'
              }`}
            >
              {formatCurrency(remaining)}
            </h3>
          </div>
          <div
            className={`w-14 h-14 rounded-xl flex items-center justify-center relative z-10 shrink-0 shadow-sm ${
              remaining < 0
                ? 'bg-rose-50 border border-rose-100 text-rose-600 shadow-rose-100/50'
                : 'bg-sky-50 border border-sky-100 text-sky-600 shadow-sky-100/50'
            }`}
          >
            {remaining < 0 ? (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M22 17l-6-6-4 4-8-8"></path>
                <polyline points="16 17 22 17 22 11"></polyline>
              </svg>
            ) : (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M22 7l-6 6-4-4-8 8"></path>
                <polyline points="22 13 22 7 16 7"></polyline>
              </svg>
            )}
          </div>
        </div>
      </div>

      {/* Indicadores Secundarios */}
      <div
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 animate-slide-up"
      >
        {/* Ingresos */}
        <div className="bg-white border border-slate-200/60 p-4 rounded-xl flex flex-col justify-between hover-lift transition-all duration-300 min-h-[96px]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">
              Ingresos
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></span>
          </div>
          <h4 className="text-xl font-black text-slate-900 truncate">
            {formatCurrency(totalIncome)}
          </h4>
        </div>

        {/* Gastos Totales */}
        <div className="bg-white border border-slate-200/60 p-4 rounded-xl flex flex-col justify-between hover-lift transition-all duration-300 min-h-[96px]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">
              Gastos
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.4)]"></span>
          </div>
          <h4 className="text-xl font-black text-slate-900 truncate">
            {formatCurrency(totalGeneral)}
          </h4>
        </div>

        {/* Deuda Pendiente */}
        <div className="bg-white border border-slate-200/60 p-4 rounded-xl flex flex-col justify-between hover-lift transition-all duration-300 min-h-[96px]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">
              Por Pagar
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.4)]"></span>
          </div>
          <h4 className="text-xl font-black text-slate-900 truncate">
            {formatCurrency(totalDebt)}
          </h4>
        </div>

        {/* Total Pagado */}
        <div className="bg-white border border-slate-200/60 p-4 rounded-xl flex flex-col justify-between hover-lift transition-all duration-300 min-h-[96px]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">
              Pagados
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.4)]"></span>
          </div>
          <h4 className="text-xl font-black text-slate-900 truncate">
            {formatCurrency(totalPaid)}
          </h4>
        </div>

        {/* Serv. Atrasados */}
        <div className="bg-white border border-slate-200/60 p-4 rounded-xl flex flex-col justify-between hover-lift transition-all duration-300 min-h-[96px]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-rose-500 tracking-wider uppercase">
              Atrasado
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)] animate-pulse"></span>
          </div>
          <h4 className="text-xl font-black text-rose-600 truncate">
            {formatCurrency(totalOverdue)}
          </h4>
        </div>
      </div>

      {/* Donut Chart & Alerts Row */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Category Expenses Donut Chart Card */}
        <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm hover:shadow-md transition duration-300">
          <h3 className="text-sm font-bold text-slate-800 tracking-wider uppercase mb-6 flex items-center justify-between">
            <span>Gráfico de Gastos por Categoría</span>
            <span className="text-[10px] text-slate-400 font-semibold">Este Mes</span>
          </h3>
          
          {activeCategories.length === 0 ? (
            <div className="h-[200px] flex flex-col items-center justify-center text-slate-400 select-none border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="mb-2 text-slate-300">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p className="text-xs font-bold">Sin Gastos Registrados</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Agrega servicios para ver el gráfico.</p>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 min-h-[200px]">
              {/* Canvas Container */}
              <div className="relative w-40 h-40 shrink-0">
                <canvas ref={donutCanvasRef}></canvas>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Total</span>
                  <span className="text-sm font-extrabold text-slate-800">{formatCurrency(totalExpenses)}</span>
                </div>
              </div>

              {/* Legend list */}
              <ul className="flex-1 w-full space-y-2 text-xs font-semibold text-slate-600">
                {activeCategories.map((cat, idx) => (
                  <li key={idx} className="flex justify-between items-center py-1 border-b border-slate-50 last:border-b-0">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }}></span>
                      <span>{cat.name}</span>
                    </span>
                    <span className="text-slate-800 font-bold">
                      {cat.percentage}% ({formatCurrency(cat.amount)})
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Resumen de Cuentas (Vencimientos & Insights) */}
        <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm hover:shadow-md transition duration-300 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 tracking-wider uppercase mb-4 flex items-center justify-between">
              <span>Resumen de Cuentas</span>
              <span className="text-[10px] text-slate-400 font-semibold">Obligaciones</span>
            </h3>

            {/* Vencimientos list */}
            {unpaidServices.length > 0 ? (
              <div className="space-y-2">
                <ul className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                  {displayedVencimientos.map((item, idx) => {
                    const isOverdue = item.statusInfo.status === 'VENCIDO';
                    const dateFormatted = item.dueDate ? item.dueDate.split('-').reverse().slice(0,2).join('/') : '';
                    return (
                      <li key={idx} className="py-2.5 flex justify-between items-center hover:bg-slate-50/80 px-2 rounded-xl transition duration-150">
                        <span className="flex items-center gap-2.5 min-w-0">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${isOverdue ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'}`}></span>
                          <span className="text-slate-850 font-bold truncate">{item.name}</span>
                        </span>
                        <span className="flex items-center gap-2 shrink-0">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                            isOverdue ? 'bg-rose-50 text-rose-700 border border-rose-100' : 'bg-slate-100 text-slate-650 border border-slate-200'
                          }`}>
                            {isOverdue ? 'Vencido' : dateFormatted}
                          </span>
                          <span className="text-slate-900 font-black">
                            {formatCurrency(item.amount)}
                          </span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
                {unpaidServices.length > 5 && (
                  <button
                    onClick={() => setShowAllVencimientos(!showAllVencimientos)}
                    className="w-full mt-2 text-center text-[10px] font-bold text-slate-500 hover:text-slate-800 transition py-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200/50 cursor-pointer"
                    type="button"
                  >
                    {showAllVencimientos ? 'Mostrar menos' : `Ver todos (${unpaidServices.length})`}
                  </button>
                )}
              </div>
            ) : (
              <div className="py-8 text-center text-xs font-bold text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                Ninguna cuenta o vencimiento pendiente
              </div>
            )}
          </div>

          {/* Insights / Inteligencia block */}
          {showInsights && (
            <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
              <h4 className="flex items-center gap-2 font-bold text-slate-800 mb-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-sky-500">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                Análisis Inteligente
              </h4>
              {insightContent}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
