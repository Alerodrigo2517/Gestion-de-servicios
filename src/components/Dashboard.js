'use client';
import { useRef, useState, useEffect } from 'react';
import ServiceForm from './ServiceForm';
import ServiceList from './ServiceList';
// import CalendarWidget from './CalendarWidget';
import { formatCurrency } from '@/lib/utils';
import { exportToExcel, importFromExcel } from '@/lib/excelHelper';
import { getServiceDueDate, getServiceStatus, affectsLiquidity } from '@/lib/statusHelper';
import logger from '@/lib/logger';

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
  const [selectedDay, setSelectedDay] = useState(null);
  const [showAllVencimientos, setShowAllVencimientos] = useState(false);
  const toolsRef = useRef(null);
  const profileRef = useRef(null);
  const profileRefDesktop = useRef(null);

  // Reset selected day filter when active month changes
  useEffect(() => {
    setSelectedDay(null);
  }, [currentMonthIndex]);

  // Scan all services across all months for unpaid overdues or today-due items (global banner)
  const globalAlertServices = services.filter((s) => {
    if (s.isPaid || s.type === 'income') return false;
    const statusInfo = getServiceStatus(s);
    return statusInfo.status === 'VENCIDO' || statusInfo.status === 'VENCE_HOY';
  });

  // Filter items by type and selected day
  const getFilteredItems = (type) => {
    return currentItems.filter((item) => {
      if (item.type !== type) return false;
      if (selectedDay === null) return true;
      if (type === 'income') return true;
      const dueDateObj = getServiceDueDate(item);
      return dueDateObj.getDate() === selectedDay && dueDateObj.getMonth() === currentMonthIndex;
    });
  };

  const getListTitle = (baseTitle, type) => {
    if (selectedDay !== null && type !== 'income') {
      return `${baseTitle} (Vence el día ${selectedDay})`;
    }
    return baseTitle;
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (toolsRef.current && !toolsRef.current.contains(event.target)) {
        setIsToolsOpen(false);
      }
      if (
        (profileRef.current && !profileRef.current.contains(event.target)) &&
        (profileRefDesktop.current && !profileRefDesktop.current.contains(event.target))
      ) {
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

  // Scan function for monthly badges
  const getPendingCountForMonth = (monthIdx) => {
    return services.filter(
      (s) => s.paymentMonth === monthIdx && s.type !== 'income' && !s.isPaid
    ).length;
  };

  // Reminders scanning
  const reminders = [];
  currentItems.forEach((item) => {
    const isEnergy = item.name.toLowerCase().includes('luz') || item.name.toLowerCase().includes('gas') || item.name.toLowerCase().includes('energia') || item.name.toLowerCase().includes('edesur') || item.name.toLowerCase().includes('edenor') || item.name.toLowerCase().includes('metrogas') || item.name.toLowerCase().includes('camuzzi') || item.name.toLowerCase().includes('aysa') || item.name.toLowerCase().includes('agua');
    if (isEnergy && item.nextMeasurementDate) {
      reminders.push(
        <span key={`meas-${item.id}`}>
          El día <strong>{item.nextMeasurementDate}</strong> pasarán a medir: {item.name}
        </span>
      );
    }
    const isInternet = item.name.toLowerCase().includes('internet') || item.name.toLowerCase().includes('wifi') || item.name.toLowerCase().includes('cable') || item.name.toLowerCase().includes('flow') || item.name.toLowerCase().includes('fibertel') || item.name.toLowerCase().includes('telecentro') || item.name.toLowerCase().includes('netflix') || item.name.toLowerCase().includes('spotify') || item.name.toLowerCase().includes('disney');
    if (isInternet && item.billingCloseDate) {
      reminders.push(
        <span key={`close-${item.id}`}>
          El día <strong>{item.billingCloseDate}</strong> cierra la facturación de: {item.name}
        </span>
      );
    }
  });

  // Chronological due dates scanning
  const unpaidServices = currentItems
    .filter((item) => item.type !== 'income' && !item.isPaid)
    .map((item) => {
      const dueDateObj = getServiceDueDate(item);
      const statusInfo = getServiceStatus(item);
      return { ...item, dueDateObj, statusInfo };
    });

  unpaidServices.sort((a, b) => a.dueDateObj.getTime() - b.dueDateObj.getTime());

  const displayedVencimientos = showAllVencimientos
    ? unpaidServices
    : unpaidServices.slice(0, 5);

  const nextVencimientos = displayedVencimientos.map((item) => {
    const isOverdue = item.statusInfo.status === 'VENCIDO';
    const dateFormatted = `${String(item.dueDateObj.getDate()).padStart(2, '0')}/${String(item.dueDateObj.getMonth() + 1).padStart(2, '0')}`;
    return (
      <li key={`venc-${item.id}`} className="flex justify-between items-center text-xs py-1.5 border-b border-white/5 last:border-0">
        <span className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${isOverdue ? 'bg-rose-500 animate-pulse' : 'bg-amber-400'}`}></span>
          <span className="text-slate-200 font-semibold">{item.name}</span>
        </span>
        <span className="text-slate-400 font-bold">
          {dateFormatted} ({formatCurrency(item.amount)})
        </span>
      </li>
    );
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
          <h4 className="flex items-center gap-2 font-bold text-sky-400 mb-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            Análisis Inteligente
          </h4>
          {Math.abs(diff) > 100 ? (
            diff > 0 ? (
              <p className="mt-2 text-slate-300 font-medium">
                Tus gastos regulares subieron <strong className="text-rose-400 font-bold">{formatCurrency(diff)}</strong> respecto a {months[currentMonthIndex - 1]}.
              </p>
            ) : (
              <p className="mt-2 text-emerald-400 font-medium">
                ¡Excelente! Tus gastos bajaron <strong className="font-bold text-emerald-300">{formatCurrency(Math.abs(diff))}</strong> respecto a {months[currentMonthIndex - 1]}.
              </p>
            )
          ) : (
            <p className="mt-2 text-slate-300 font-medium">Tus gastos se mantienen estables respecto al mes anterior.</p>
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
      logger.error(err);
      alert('Error al leer el archivo Excel. Verifica el formato.');
    }
    e.target.value = ''; // Reset input
  };

  return (
    <div className="w-full animate-fade-in">
      <header className="w-full max-w-7xl mx-auto px-4 md:px-6 py-6 flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-white/5">
        
        {/* Top Header Row (Logo on Left, Profile Avatar on Right for Mobile) */}
        <div className="w-full sm:w-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-400 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-black bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent tracking-tight">
                ServiTrack
              </h1>
              <p className="text-[10px] font-bold text-sky-400 tracking-widest uppercase">Premium Hub</p>
            </div>
          </div>

          {/* Profile Trigger - Mobile (visible only on mobile) */}
          <div className="sm:hidden relative" ref={profileRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-400 to-indigo-600 border border-white/20 flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-all duration-200 shadow-lg cursor-pointer"
              type="button"
              title="Mi Cuenta"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-950/95 border border-white/10 backdrop-blur-md p-1.5 shadow-2xl z-[500] animate-slide-up">
                <div className="px-3.5 py-2 border-b border-white/5 mb-1">
                  <p className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">Sesión activa</p>
                  <p className="text-xs text-slate-200 truncate font-semibold">Mi Cuenta</p>
                </div>
                <button
                  className="w-full text-left px-3.5 py-2.5 text-xs text-slate-300 hover:text-white hover:bg-white/5 rounded-lg flex items-center gap-2.5 transition cursor-pointer"
                  onClick={() => { onGenerateDemoData(); setIsProfileOpen(false); }}
                  type="button"
                >
                  <svg className="text-emerald-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                  Cargar Demo Anual
                </button>
                <button
                  className="w-full text-left px-3.5 py-2.5 text-xs text-slate-300 hover:text-white hover:bg-white/5 rounded-lg flex items-center gap-2.5 transition cursor-pointer"
                  onClick={() => { onChangePassword(); setIsProfileOpen(false); }}
                  type="button"
                >
                  <svg className="text-sky-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  Cambiar Contraseña
                </button>
                <div className="border-t border-white/5 my-1"></div>
                <button
                  className="w-full text-left px-3.5 py-2.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg flex items-center gap-2.5 transition font-bold cursor-pointer"
                  onClick={() => { onSignOut(); setIsProfileOpen(false); }}
                  type="button"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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

        {/* Action Controls list (Flex wrap layout, static on desktop) */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-start sm:justify-end py-1">
          <input
            type="file"
            id="import-excel"
            accept=".xlsx"
            ref={fileInputRef}
            onChange={handleImportExcel}
            className="hidden"
          />
          
          <button
            className="px-4 py-2.5 text-xs font-semibold glass-premium hover:bg-white/10 text-slate-300 rounded-xl flex items-center gap-2 transition duration-200 cursor-pointer shrink-0"
            onClick={() => fileInputRef.current.click()}
            type="button"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            Importar
          </button>
          
          <button
            className="px-4 py-2.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl flex items-center gap-2 transition duration-200 shadow-md shadow-emerald-600/10 active:scale-[0.98] cursor-pointer shrink-0"
            onClick={handleExportExcel}
            type="button"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Excel
          </button>

          {/* Menú de Herramientas de Análisis */}
          <div className="relative shrink-0" ref={toolsRef}>
            <button
              onClick={() => setIsToolsOpen(!isToolsOpen)}
              className="px-4 py-2.5 text-xs font-semibold glass-premium hover:bg-white/10 text-slate-300 rounded-xl flex items-center gap-2 transition duration-200 cursor-pointer"
              type="button"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
              </svg>
              Herramientas
              <svg className={`transition-transform duration-200 ${isToolsOpen ? 'rotate-180' : ''}`} width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>

            {isToolsOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-950/90 border border-white/10 backdrop-blur-md p-1.5 shadow-2xl z-[500] animate-slide-up">
                <button
                  className="w-full text-left px-3.5 py-2.5 text-xs text-slate-300 hover:text-white hover:bg-white/5 rounded-lg flex items-center gap-2.5 transition cursor-pointer"
                  onClick={() => { onOpenModal('projection'); setIsToolsOpen(false); }}
                  type="button"
                >
                  <svg className="text-sky-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="20" x2="18" y2="10"></line>
                    <line x1="12" y1="20" x2="12" y2="4"></line>
                    <line x1="6" y1="20" x2="6" y2="14"></line>
                  </svg>
                  Proyección Anual
                </button>
                <button
                  className="w-full text-left px-3.5 py-2.5 text-xs text-slate-300 hover:text-white hover:bg-white/5 rounded-lg flex items-center gap-2.5 transition cursor-pointer"
                  onClick={() => { onOpenModal('simulation'); setIsToolsOpen(false); }}
                  type="button"
                >
                  <svg className="text-purple-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="16"></line>
                    <line x1="8" y1="12" x2="16" y2="12"></line>
                  </svg>
                  Simulador de Bajas
                </button>
                {currentItems.some(item => item.consumptionUnit !== undefined && item.consumptionUnit !== null) && (
                  <button
                    className="w-full text-left px-3.5 py-2.5 text-xs text-slate-300 hover:text-white hover:bg-white/5 rounded-lg flex items-center gap-2.5 transition cursor-pointer"
                    onClick={() => { onOpenModal('consumption'); setIsToolsOpen(false); }}
                    type="button"
                  >
                    <svg className="text-amber-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                    </svg>
                    Consumo Físico
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Desktop Profile Trigger (hidden on mobile, visible on desktop) */}
          <div className="hidden sm:block relative shrink-0" ref={profileRefDesktop}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-400 to-indigo-600 border border-white/20 flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-all duration-200 shadow-lg cursor-pointer"
              type="button"
              title="Mi Cuenta"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-950/90 border border-white/10 backdrop-blur-md p-1.5 shadow-2xl z-[500] animate-slide-up">
                <div className="px-3.5 py-2 border-b border-white/5 mb-1">
                  <p className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">Sesión activa</p>
                  <p className="text-xs text-slate-200 truncate font-semibold">Mi Cuenta</p>
                </div>
                <button
                  className="w-full text-left px-3.5 py-2.5 text-xs text-slate-300 hover:text-white hover:bg-white/5 rounded-lg flex items-center gap-2.5 transition cursor-pointer"
                  onClick={() => { onGenerateDemoData(); setIsProfileOpen(false); }}
                  type="button"
                >
                  <svg className="text-emerald-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                  Cargar Demo Anual
                </button>
                <button
                  className="w-full text-left px-3.5 py-2.5 text-xs text-slate-300 hover:text-white hover:bg-white/5 rounded-lg flex items-center gap-2.5 transition cursor-pointer"
                  onClick={() => { onChangePassword(); setIsProfileOpen(false); }}
                  type="button"
                >
                  <svg className="text-sky-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  Cambiar Contraseña
                </button>
                <div className="border-t border-white/5 my-1"></div>
                <button
                  className="w-full text-left px-3.5 py-2.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg flex items-center gap-2.5 transition font-bold cursor-pointer"
                  onClick={() => { onSignOut(); setIsProfileOpen(false); }}
                  type="button"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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

      {/* Navegación de Meses */}
      <nav className="w-full max-w-7xl mx-auto px-4 md:px-6 flex gap-1.5 overflow-x-auto py-3 border-b border-white/5 scrollbar-none">
        {months.map((month, index) => {
          const isActive = index === currentMonthIndex;
          const pendingCount = getPendingCountForMonth(index);
          const btnClass = isActive
            ? 'flex-1 min-w-[75px] sm:min-w-[90px] py-3.5 text-center text-xs font-black bg-slate-900/60 border-b-2 border-sky-400 text-sky-400 rounded-t-xl transition-all duration-200'
            : 'flex-1 min-w-[75px] sm:min-w-[90px] py-3.5 text-center text-xs font-bold text-slate-400 hover:bg-slate-900/20 hover:text-slate-200 rounded-t-xl transition-all duration-200';

          return (
            <button
              key={month}
              className={`${btnClass} relative`}
              onClick={() => {
                setCurrentMonthIndex(index);
                setEditingItem(null);
              }}
              type="button"
            >
              {month.substring(0, 3)}
              {pendingCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[8px] font-black text-white shadow-sm shadow-rose-500/50">
                  {pendingCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Dashboard Principal */}
      <main className="w-full max-w-7xl mx-auto px-4 md:px-6 py-8 glass-premium border-t-0 rounded-b-2xl shadow-2xl mb-12 animate-fade-in">
        {/* Global header alert banner */}
        {globalAlertServices.length > 0 && (
          <div role="status" aria-live="polite" className="mb-8 p-5 rounded-2xl bg-gradient-to-r from-rose-500/20 via-orange-500/10 to-rose-950/20 border border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.15)] flex items-start gap-4 animate-slide-up relative z-10">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="animate-pulse" aria-hidden="true">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-black text-rose-400 uppercase tracking-widest">
                Atención: Vencimientos Inmediatos
              </h4>
              <p className="text-xs text-slate-300 font-semibold mt-1">
                Tienes {globalAlertServices.length} {globalAlertServices.length === 1 ? 'servicio vencido o que vence hoy' : 'servicios vencidos o que vencen hoy'}. Por favor, regístralo o realízalo cuanto antes:
              </p>
              <ul className="mt-3 flex flex-wrap gap-2 text-[10px] text-slate-400 font-bold">
                {globalAlertServices.map((s) => {
                  const statusInfo = getServiceStatus(s);
                  return (
                    <li
                      key={s.id}
                      className="px-2.5 py-1 rounded-md bg-black/40 border border-white/5 flex items-center gap-1.5 hover:border-white/10 transition duration-200"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.status === 'VENCIDO' ? 'bg-rose-500 animate-pulse' : 'bg-orange-500 animate-pulse'}`}></span>
                      <span className="text-slate-300">{s.name}</span>
                      <span className="text-slate-500 font-semibold">({months[s.paymentMonth]})</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        )}

        <div className="flex flex-col items-center gap-6 mb-8 pb-6 border-b border-white/10">
          <h2 className="text-3xl font-black text-white tracking-tight">
            {months[currentMonthIndex]}
          </h2>

          <div className="w-full flex flex-col gap-6">
            {/* Tarjetas de Hero */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slide-up">
              {/* Liquidez Card */}
              <div className="relative overflow-hidden glass-premium bg-gradient-to-br from-emerald-950/20 via-slate-900/60 to-slate-950 border border-emerald-500/20 hover:border-emerald-500/40 rounded-2xl p-6 flex items-center gap-5 shadow-lg glow-emerald group hover:-translate-y-1 hover:shadow-2xl transition-all duration-300">
                <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all duration-300"></div>
                <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 relative z-10 shrink-0">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <rect x="2" y="6" width="20" height="12" rx="2"></rect>
                    <circle cx="12" cy="12" r="2"></circle>
                    <path d="M6 12h.01M18 12h.01"></path>
                  </svg>
                </div>
                <div className="flex flex-col relative z-10 overflow-hidden">
                  <span className="text-xs font-bold text-emerald-400/80 tracking-wider uppercase">Liquidez (Dinero en Mano)</span>
                  <h3 className="text-3xl sm:text-4xl font-extrabold text-white mt-1.5 tracking-tight truncate">
                    {formatCurrency(liquidity)}
                  </h3>
                </div>
              </div>

              {/* Proyección Card */}
              <div className={`relative overflow-hidden glass-premium bg-gradient-to-br ${remaining < 0 ? 'from-rose-950/20 border-rose-500/20 hover:border-rose-500/40 glow-rose' : 'from-sky-950/20 border-sky-500/20 hover:border-sky-500/40 glow-sky'} via-slate-900/60 to-slate-950 rounded-2xl p-6 flex items-center gap-5 shadow-lg group hover:-translate-y-1 hover:shadow-2xl transition-all duration-300`}>
                <div className={`absolute -right-6 -bottom-6 w-24 h-24 ${remaining < 0 ? 'bg-rose-500/10 group-hover:bg-rose-500/20' : 'bg-sky-500/10 group-hover:bg-sky-500/20'} rounded-full blur-2xl transition-all duration-300`}></div>
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${remaining < 0 ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-sky-500/10 border-sky-500/20 text-sky-400'} relative z-10 shrink-0`}>
                  {remaining < 0 ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M22 17l-6-6-4 4-8-8"></path>
                      <polyline points="16 17 22 17 22 11"></polyline>
                    </svg>
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M22 7l-6 6-4-4-8 8"></path>
                      <polyline points="22 13 22 7 16 7"></polyline>
                    </svg>
                  )}
                </div>
                <div className="flex flex-col relative z-10 overflow-hidden">
                  <span className={`text-xs font-bold ${remaining < 0 ? 'text-rose-400/80' : 'text-sky-400/80'} tracking-wider uppercase`}>Proyección Fin de Mes</span>
                  <h3 className={`text-3xl sm:text-4xl font-extrabold mt-1.5 tracking-tight truncate ${remaining < 0 ? 'text-rose-400' : 'text-sky-400'}`}>
                    {formatCurrency(remaining)}
                  </h3>
                </div>
              </div>
            </div>

            {/* Indicadores Secundarios */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              {/* Ingresos */}
              <div className="glass-premium border-white/5 hover:border-emerald-500/30 hover:bg-slate-900/70 p-4 rounded-xl flex flex-col justify-between hover:shadow-lg hover:shadow-emerald-500/5 hover:-translate-y-0.5 transition-all duration-300">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Ingresos</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]"></span>
                </div>
                <h4 className="text-xl font-black text-white">{formatCurrency(totalIncome)}</h4>
              </div>

              {/* Gastos Totales */}
              <div className="glass-premium border-white/5 hover:border-sky-500/30 hover:bg-slate-900/70 p-4 rounded-xl flex flex-col justify-between hover:shadow-lg hover:shadow-sky-500/5 hover:-translate-y-0.5 transition-all duration-300">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Gastos</span>
                  <span className="w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.7)]"></span>
                </div>
                <h4 className="text-xl font-black text-white">{formatCurrency(totalGeneral)}</h4>
              </div>

              {/* Deuda Pendiente */}
              <div className="glass-premium border-white/5 hover:border-purple-500/30 hover:bg-slate-900/70 p-4 rounded-xl flex flex-col justify-between hover:shadow-lg hover:shadow-purple-500/5 hover:-translate-y-0.5 transition-all duration-300">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Por Pagar</span>
                  <span className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.7)]"></span>
                </div>
                <h4 className="text-xl font-black text-white">{formatCurrency(totalDebt)}</h4>
              </div>

              {/* Total Pagado */}
              <div className="glass-premium border-white/5 hover:border-teal-500/30 hover:bg-slate-900/70 p-4 rounded-xl flex flex-col justify-between hover:shadow-lg hover:shadow-teal-500/5 hover:-translate-y-0.5 transition-all duration-300">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Pagados</span>
                  <span className="w-2 h-2 rounded-full bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.7)]"></span>
                </div>
                <h4 className="text-xl font-black text-white">{formatCurrency(totalPaid)}</h4>
              </div>

              {/* Serv. Atrasados */}
              <div className="col-span-2 sm:col-span-1 glass-premium border-white/5 bg-rose-500/5 hover:border-rose-500/40 hover:bg-rose-500/10 p-4 rounded-xl flex flex-col justify-between hover:shadow-lg hover:shadow-rose-500/10 hover:-translate-y-0.5 transition-all duration-300">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-rose-400 tracking-wider uppercase">Atrasado</span>
                  <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.7)]"></span>
                </div>
                <h4 className="text-xl font-black text-rose-400">{formatCurrency(totalOverdue)}</h4>
              </div>
            </div>
          </div>
        </div>

        {/* Alertas e Insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {showInsights && (
            <div id="insights-panel" className="p-5 rounded-2xl text-sm glass-premium bg-sky-500/5 border-l-4 border-sky-500 text-sky-200 animate-slide-up">
              {insightContent}
            </div>
          )}

          {(nextVencimientos.length > 0 || reminders.length > 0) && (
            <div id="reminders-panel" className="p-5 rounded-2xl text-sm glass-premium bg-amber-500/5 border-l-4 border-amber-500 animate-slide-up flex flex-col gap-4">
              {nextVencimientos.length > 0 && (
                <div className="flex flex-col">
                  <h4 className="flex items-center gap-2 font-bold text-amber-400 mb-3">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    Próximos Vencimientos del Mes
                  </h4>
                  <ul className="space-y-1 text-slate-300 font-semibold mb-2 max-h-[150px] overflow-y-auto pr-1">
                    {nextVencimientos}
                  </ul>
                  {unpaidServices.length > 5 && (
                    <button
                      type="button"
                      onClick={() => setShowAllVencimientos(!showAllVencimientos)}
                      className="text-[10px] text-amber-400 hover:text-amber-300 font-bold uppercase tracking-wider mt-1.5 transition cursor-pointer self-start focus:outline-none"
                    >
                      {showAllVencimientos ? 'Mostrar menos' : `Ver todos (+${unpaidServices.length - 5})`}
                    </button>
                  )}
                </div>
              )}

              {reminders.length > 0 && (
                <div className={nextVencimientos.length > 0 ? "border-t border-white/5 pt-3" : ""}>
                  <h4 className="flex items-center gap-2 font-bold text-amber-400 mb-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                      <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                    </svg>
                    Recordatorios y Avisos
                  </h4>
                  <ul id="reminders-list" className="space-y-1.5 text-amber-200/80 list-disc pl-5 font-semibold">
                    {reminders.map((r, index) => (
                      <li key={index} className="marker:text-amber-500">{r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Grid de Formulario y Listas */}
        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-8">
          <div className="space-y-6">
            {/* <CalendarWidget
              services={services}
              currentMonthIndex={currentMonthIndex}
              selectedDay={selectedDay}
              onSelectDay={setSelectedDay}
            /> */}
            <ServiceForm
              onSubmit={onSaveItem}
              editingItem={editingItem}
              onCancelEdit={() => setEditingItem(null)}
              currentMonthIndex={currentMonthIndex}
              onImportPrevious={onImportPrevious}
              showImportButton={showImportButton}
              previousMonthName={previousMonthName}
            />
          </div>

          <section className="space-y-8">
            <ServiceList
              title={getListTitle("Ingresos del Mes", "income")}
              items={getFilteredItems("income")}
              type="income"
              onEdit={onEdit}
              onDelete={onDeleteItem}
              onTogglePaid={onTogglePaid}
              onSimulate={onOpenModal}
            />

            <ServiceList
              title={getListTitle("Servicios Regulares", "service")}
              items={getFilteredItems("service")}
              type="service"
              onEdit={onEdit}
              onDelete={onDeleteItem}
              onTogglePaid={onTogglePaid}
              onSimulate={onOpenModal}
            />

            <ServiceList
              title={getListTitle("Préstamos Activos", "loan")}
              items={getFilteredItems("loan")}
              type="loan"
              onEdit={onEdit}
              onDelete={onDeleteItem}
              onTogglePaid={onTogglePaid}
              onSimulate={onOpenModal}
            />

            <ServiceList
              title={getListTitle("Servicios Atrasados", "overdue")}
              items={getFilteredItems("overdue")}
              type="overdue"
              onEdit={onEdit}
              onDelete={onDeleteItem}
              onTogglePaid={onTogglePaid}
              onSimulate={onOpenModal}
            />
          </section>
        </div>
      </main>
      <footer className="w-full text-center py-6 text-[10px] text-slate-500 font-semibold tracking-wider select-none flex flex-col sm:flex-row justify-center items-center gap-1">
        <span>ServiTrack v1.3.0</span>
        <span className="hidden sm:inline">|</span>
        <span>Creado por <span className="text-slate-400">Rodrigo Alejandro Aguirre Tevez</span></span>
      </footer>
    </div>
  );
}
