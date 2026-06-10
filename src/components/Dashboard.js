'use client';
import { useRef, useState, useEffect } from 'react';
import ServiceForm from './ServiceForm';
import ServiceList from './ServiceList';
import { formatCurrency } from '@/lib/utils';
import { exportToExcel, importFromExcel } from '@/lib/excelHelper';

const months = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function Dashboard({
  services,
  onSaveItem,
  onDeleteItem,
  onTogglePaid,
  onImportPrevious,
  onSignOut,
  currentMonthIndex,
  setCurrentMonthIndex,
  editingItem,
  setEditingItem,
  onOpenModal,
  onBulkImport,
  onEdit,
  onGenerateDemoData,
  onChangePassword
}) {
  const fileInputRef = useRef(null);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const toolsRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (toolsRef.current && !toolsRef.current.contains(event.target)) {
        setIsToolsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter current month items
  const currentItems = services.filter((s) => s.paymentMonth === currentMonthIndex);

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
      } else {
        totalPaid += item.amount;
      }
    } else if (item.type === 'overdue') {
      if (item.isPaid) {
        totalPaid += item.amount;
      } else {
        totalOverdue += item.amount;
      }
    } else {
      if (item.isPaid) {
        totalPaid += item.amount;
      } else {
        totalPending += item.amount;
      }
    }
  });

  const totalGeneral = totalPending + totalPaid + totalLoans + totalOverdue;
  const totalDebt = totalPending + totalLoans + totalOverdue;
  const remaining = totalIncome - totalGeneral;
  const liquidity = totalIncome - totalPaid;

  // Reminders scanning
  const reminders = [];
  currentItems.forEach((item) => {
    if (item.nextMeasurementDate) {
      reminders.push(
        <span key={`meas-${item.id}`}>
          El día <strong>{item.nextMeasurementDate}</strong> pasarán a medir: {item.name}
        </span>
      );
    }
    if (item.billingCloseDate) {
      reminders.push(
        <span key={`close-${item.id}`}>
          El día <strong>{item.billingCloseDate}</strong> cierra la facturación de: {item.name}
        </span>
      );
    }
  });

  // Insights calculation
  let showInsights = false;
  let insightContent = null;
  if (currentMonthIndex > 0) {
    const prevItems = services.filter(
      (s) => s.paymentMonth === currentMonthIndex - 1 && (s.type === 'service' || (s.type !== 'income' && s.type !== 'loan' && s.type !== 'overdue'))
    );
    const currServices = currentItems.filter(
      (s) => s.type === 'service' || (s.type !== 'income' && s.type !== 'loan' && s.type !== 'overdue')
    );

    if (prevItems.length > 0) {
      showInsights = true;
      const prevTotal = prevItems.reduce((sum, item) => sum + item.amount, 0);
      const currTotal = currServices.reduce((sum, item) => sum + item.amount, 0);
      const diff = currTotal - prevTotal;

      insightContent = (
        <div>
          <h4 className="flex items-center gap-2 font-semibold text-sky-400 mb-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            Análisis Inteligente
          </h4>
          {Math.abs(diff) > 100 ? (
            diff > 0 ? (
              <p className="mt-2 text-slate-300">
                Tus gastos regulares subieron <strong className="text-red-400 font-semibold">{formatCurrency(diff)}</strong> respecto a {months[currentMonthIndex - 1]}.
              </p>
            ) : (
              <p className="mt-2 text-emerald-400">
                ¡Excelente! Tus gastos bajaron <strong className="font-semibold text-emerald-300">{formatCurrency(Math.abs(diff))}</strong> respecto a {months[currentMonthIndex - 1]}.
              </p>
            )
          ) : (
            <p className="mt-2 text-slate-300">Tus gastos se mantienen estables respecto al mes anterior.</p>
          )}
        </div>
      );
    }
  }

  // Check if we show "Import from previous month" button
  let showImportButton = false;
  let previousMonthName = '';
  if (currentMonthIndex > 0) {
    previousMonthName = months[currentMonthIndex - 1];
    const prevMonthItems = services.filter((s) => s.paymentMonth === currentMonthIndex - 1);
    if (prevMonthItems.length > 0) {
      const currentNames = services
        .filter((s) => s.paymentMonth === currentMonthIndex)
        .map((s) => s.name.toLowerCase());
      const importableItems = prevMonthItems.filter((s) => !currentNames.includes(s.name.toLowerCase()));
      showImportButton = importableItems.length > 0;
    }
  }

  // Handle Excel actions
  const handleExportExcel = () => {
    exportToExcel(services);
  };

  const handleImportExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const newItems = await importFromExcel(file, services);
      if (newItems && newItems.length > 0) {
        onBulkImport(newItems);
        alert(`¡Éxito! Se importaron ${newItems.length} registros nuevos.`);
      } else {
        alert('No se importó nada. Puede que los registros ya existan o el archivo esté vacío.');
      }
    } catch (err) {
      console.error(err);
      alert('Error al leer el archivo Excel. Verifica el formato.');
    }
    e.target.value = ''; // Reset input
  };

  return (
    <div className="w-full">
      <header className="w-full max-w-7xl mx-auto px-4 md:px-6 py-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <svg className="text-sky-400" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-sky-400 to-indigo-500 bg-clip-text text-transparent">
            ServiTrack
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="file"
            id="import-excel"
            accept=".xlsx"
            ref={fileInputRef}
            onChange={handleImportExcel}
            className="hidden"
          />
          
          <button
            className="px-4 py-2 text-sm font-medium backdrop-blur-md bg-slate-900/40 border border-white/10 hover:bg-white/10 text-slate-300 rounded-lg flex items-center gap-2 transition duration-200"
            onClick={() => fileInputRef.current.click()}
            type="button"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            Importar
          </button>
          
          <button
            className="px-4 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-2 transition duration-200 shadow-md shadow-emerald-600/10 active:scale-[0.98]"
            onClick={handleExportExcel}
            type="button"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Excel
          </button>

          {/* Menú de Herramientas de Análisis */}
          <div className="relative" ref={toolsRef}>
            <button
              onClick={() => setIsToolsOpen(!isToolsOpen)}
              className="px-4 py-2 text-sm font-medium backdrop-blur-md bg-slate-900/40 border border-white/10 hover:bg-white/10 text-slate-300 rounded-lg flex items-center gap-2 transition duration-200"
              type="button"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
              </svg>
              Herramientas
              <svg className={`transition-transform duration-200 ${isToolsOpen ? 'rotate-180' : ''}`} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>

            {isToolsOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-950 border border-white/10 backdrop-blur-md p-1.5 shadow-2xl z-[500]">
                <button
                  className="w-full text-left px-3.5 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-lg flex items-center gap-2.5 transition"
                  onClick={() => { onOpenModal('projection'); setIsToolsOpen(false); }}
                  type="button"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="20" x2="18" y2="10"></line>
                    <line x1="12" y1="20" x2="12" y2="4"></line>
                    <line x1="6" y1="20" x2="6" y2="14"></line>
                  </svg>
                  Proyección Anual
                </button>
                <button
                  className="w-full text-left px-3.5 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-lg flex items-center gap-2.5 transition"
                  onClick={() => { onOpenModal('simulation'); setIsToolsOpen(false); }}
                  type="button"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="16"></line>
                    <line x1="8" y1="12" x2="16" y2="12"></line>
                  </svg>
                  Simulador de Bajas
                </button>
                {currentItems.some(item => item.consumptionUnit !== undefined && item.consumptionUnit !== null) && (
                  <button
                    className="w-full text-left px-3.5 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-lg flex items-center gap-2.5 transition"
                    onClick={() => { onOpenModal('consumption'); setIsToolsOpen(false); }}
                    type="button"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                    </svg>
                    Consumo Físico
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Menú de Perfil / Cuenta */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-400 to-indigo-600 border border-white/20 flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-all duration-200 shadow-lg"
              type="button"
              title="Mi Cuenta"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-950 border border-white/10 backdrop-blur-md p-1.5 shadow-2xl z-[500]">
                <div className="px-3.5 py-2 border-b border-white/5 mb-1">
                  <p className="text-xs font-semibold text-slate-500 tracking-wider uppercase">Sesión activa</p>
                  <p className="text-xs text-slate-200 truncate font-medium">Mi Cuenta</p>
                </div>
                <button
                  className="w-full text-left px-3.5 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-lg flex items-center gap-2.5 transition"
                  onClick={() => { onGenerateDemoData(); setIsProfileOpen(false); }}
                  type="button"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                  Cargar Demo Anual
                </button>
                <button
                  className="w-full text-left px-3.5 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-lg flex items-center gap-2.5 transition"
                  onClick={() => { onChangePassword(); setIsProfileOpen(false); }}
                  type="button"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  Cambiar Contraseña
                </button>
                <div className="border-t border-white/5 my-1"></div>
                <button
                  className="w-full text-left px-3.5 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg flex items-center gap-2.5 transition font-semibold"
                  onClick={() => { onSignOut(); setIsProfileOpen(false); }}
                  type="button"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Navegación de Meses (Estilo Carpeta) */}
      <nav className="w-full max-w-7xl mx-auto px-4 md:px-6 flex gap-1 overflow-x-auto">
        {months.map((month, index) => {
          const isActive = index === currentMonthIndex;
          const btnClass = isActive
            ? 'flex-1 min-w-[70px] sm:min-w-[80px] py-3 text-center text-xs sm:text-sm font-bold border-t-2 border-sky-500 bg-slate-900/40 text-slate-100 backdrop-blur-md rounded-t-xl transition-all duration-200'
            : 'flex-1 min-w-[70px] sm:min-w-[80px] py-3 text-center text-xs sm:text-sm font-semibold border-t-2 border-transparent bg-slate-900/10 text-slate-400 hover:bg-slate-900/30 hover:text-slate-200 rounded-t-xl transition-all duration-200';

          return (
            <button
              key={month}
              className={btnClass}
              onClick={() => {
                setCurrentMonthIndex(index);
                setEditingItem(null);
              }}
              type="button"
            >
              {month.substring(0, 3)}
            </button>
          );
        })}
      </nav>

      {/* Dashboard Principal */}
      <main className="w-full max-w-7xl mx-auto px-4 md:px-6 py-8 backdrop-blur-md bg-slate-900/40 border border-white/10 rounded-b-2xl shadow-2xl mb-12">
        <div className="flex flex-col items-center gap-6 mb-8 pb-6 border-b border-white/10">
          <h2 className="text-3xl font-extrabold text-white tracking-wide">
            {months[currentMonthIndex]}
          </h2>

          <div className="w-full flex flex-col gap-6">
            {/* Tarjetas de Hero */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative overflow-hidden backdrop-blur-md bg-gradient-to-br from-slate-900/80 to-slate-950/80 border border-white/10 rounded-2xl p-6 flex items-center gap-5 shadow-lg group hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-amber-500/10 border border-amber-500/20 text-amber-500 relative z-10">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="6" width="20" height="12" rx="2"></rect>
                    <circle cx="12" cy="12" r="2"></circle>
                    <path d="M6 12h.01M18 12h.01"></path>
                  </svg>
                </div>
                <div className="flex flex-col relative z-10">
                  <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase">Liquidez (Dinero en Mano)</span>
                  <h3 className="text-3xl font-bold text-white mt-1">
                    {formatCurrency(liquidity)}
                  </h3>
                </div>
              </div>

              <div className="relative overflow-hidden backdrop-blur-md bg-gradient-to-br from-slate-900/80 to-slate-950/80 border border-white/10 rounded-2xl p-6 flex items-center gap-5 shadow-lg group hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-r from-sky-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-sky-500/10 border border-sky-500/20 text-sky-400 relative z-10">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                  </svg>
                </div>
                <div className="flex flex-col relative z-10">
                  <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase">Proyección Fin de Mes</span>
                  <h3 className="text-3xl font-bold mt-1" style={{ color: remaining < 0 ? '#ef4444' : '#38bdf8' }}>
                    {formatCurrency(remaining)}
                  </h3>
                </div>
              </div>
            </div>

            {/* Indicadores Secundarios */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              <div className="backdrop-blur-md bg-slate-900/30 border border-white/5 rounded-xl p-4 flex flex-col justify-center hover:bg-slate-900/50 hover:border-white/10 transition-all duration-300">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                  <span className="text-xs font-semibold text-slate-400">Ingresos Netos</span>
                </div>
                <h4 className="text-lg font-bold text-white">{formatCurrency(totalIncome)}</h4>
              </div>

              <div className="backdrop-blur-md bg-slate-900/30 border border-white/5 rounded-xl p-4 flex flex-col justify-center hover:bg-slate-900/50 hover:border-white/10 transition-all duration-300">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.5)]"></span>
                  <span className="text-xs font-semibold text-slate-400">Gastos Totales</span>
                </div>
                <h4 className="text-lg font-bold text-white">{formatCurrency(totalGeneral)}</h4>
              </div>

              <div className="backdrop-blur-md bg-slate-900/30 border border-white/5 rounded-xl p-4 flex flex-col justify-center hover:bg-slate-900/50 hover:border-white/10 transition-all duration-300">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]"></span>
                  <span className="text-xs font-semibold text-slate-400">Deuda Pendiente</span>
                </div>
                <h4 className="text-lg font-bold text-white">{formatCurrency(totalDebt)}</h4>
              </div>

              <div className="backdrop-blur-md bg-slate-900/30 border border-white/5 rounded-xl p-4 flex flex-col justify-center hover:bg-slate-900/50 hover:border-white/10 transition-all duration-300">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                  <span className="text-xs font-semibold text-slate-400">Total Pagado</span>
                </div>
                <h4 className="text-lg font-bold text-white">{formatCurrency(totalPaid)}</h4>
              </div>

              <div className="col-span-2 sm:col-span-1 backdrop-blur-md bg-red-500/5 border border-red-500/20 rounded-xl p-4 flex flex-col justify-center hover:bg-red-500/10 hover:border-red-500/30 transition-all duration-300">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></span>
                  <span className="text-xs font-semibold text-red-400">Serv. Atrasados</span>
                </div>
                <h4 className="text-lg font-bold text-red-400">{formatCurrency(totalOverdue)}</h4>
              </div>
            </div>
          </div>
        </div>

        {/* Alertas e Insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {showInsights && (
            <div id="insights-panel" className="p-5 rounded-xl text-sm backdrop-blur-md bg-sky-500/5 border-l-4 border-sky-500 text-sky-200">
              {insightContent}
            </div>
          )}

          {reminders.length > 0 && (
            <div id="reminders-panel" className="p-5 rounded-xl text-sm backdrop-blur-md bg-amber-500/5 border-l-4 border-amber-500">
              <h4 className="flex items-center gap-2 font-semibold text-amber-400 mb-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                Recordatorios del Mes
              </h4>
              <ul id="reminders-list" className="space-y-2 text-amber-200/80 list-disc pl-5">
                {reminders.map((r, index) => (
                  <li key={index}>{r}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Grid de Formulario y Listas */}
        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-8">
          <ServiceForm
            onSubmit={onSaveItem}
            editingItem={editingItem}
            onCancelEdit={() => setEditingItem(null)}
            currentMonthIndex={currentMonthIndex}
            onImportPrevious={onImportPrevious}
            showImportButton={showImportButton}
            previousMonthName={previousMonthName}
          />

          <section className="space-y-8">
            <ServiceList
              title="Ingresos del Mes"
              items={currentItems}
              type="income"
              onEdit={onEdit}
              onDelete={onDeleteItem}
              onTogglePaid={onTogglePaid}
              onSimulate={onOpenModal}
            />

            <ServiceList
              title="Servicios Regulares"
              items={currentItems}
              type="service"
              onEdit={onEdit}
              onDelete={onDeleteItem}
              onTogglePaid={onTogglePaid}
              onSimulate={onOpenModal}
            />

            <ServiceList
              title="Préstamos Activos"
              items={currentItems}
              type="loan"
              onEdit={onEdit}
              onDelete={onDeleteItem}
              onTogglePaid={onTogglePaid}
              onSimulate={onOpenModal}
            />

            <ServiceList
              title="Servicios Atrasados"
              items={currentItems}
              type="overdue"
              onEdit={onEdit}
              onDelete={onDeleteItem}
              onTogglePaid={onTogglePaid}
              onSimulate={onOpenModal}
            />
          </section>
        </div>
      </main>
    </div>
  );
}
