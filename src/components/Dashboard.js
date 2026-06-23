'use client';
import { useRef, useState, useEffect } from 'react';
import ServiceForm from './ServiceForm';
import ServiceList from './ServiceList';
// import CalendarWidget from './CalendarWidget';
import { formatCurrency } from '@/lib/utils';
import { exportToExcel, importFromExcel } from '@/lib/excelHelper';
import {
  getServiceDueDate,
  getServiceStatus,
  affectsLiquidity,
} from '@/lib/statusHelper';
import logger from '@/lib/logger';
import { useToast } from '@/components/ToastProvider';
import Chart from 'chart.js/auto';
import { supabase } from '@/lib/supabase';

const months = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
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
  onDeleteDemoData,
  onChangePassword,
  onShowWelcome,
  isRemembered,
  onForgetDevice,
  onChangePassphraseClick,
  onRememberDevice,
}) {
  const { showToast } = useToast();
  const fileInputRef = useRef(null);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [showAllVencimientos, setShowAllVencimientos] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const toolsRef = useRef(null);
  const profileRef = useRef(null);
  const profileRefDesktop = useRef(null);

  const [userName, setUserName] = useState('Alejandro');
  const donutCanvasRef = useRef(null);
  const donutChartRef = useRef(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) {
        const namePart = session.user.email.split('@')[0];
        setUserName(namePart.charAt(0).toUpperCase() + namePart.slice(1));
      }
    });
  }, []);

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
      return (
        dueDateObj.getDate() === selectedDay &&
        dueDateObj.getMonth() === currentMonthIndex
      );
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
        profileRef.current &&
        !profileRef.current.contains(event.target) &&
        profileRefDesktop.current &&
        !profileRefDesktop.current.contains(event.target)
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

  // Scan function for monthly badges
  const getPendingCountForMonth = (monthIdx) => {
    return services.filter(
      (s) => s.paymentMonth === monthIdx && s.type !== 'income' && !s.isPaid
    ).length;
  };

  // Reminders scanning
  const reminders = [];
  currentItems.forEach((item) => {
    const isEnergy =
      item.name.toLowerCase().includes('luz') ||
      item.name.toLowerCase().includes('gas') ||
      item.name.toLowerCase().includes('energia') ||
      item.name.toLowerCase().includes('edesur') ||
      item.name.toLowerCase().includes('edenor') ||
      item.name.toLowerCase().includes('metrogas') ||
      item.name.toLowerCase().includes('camuzzi') ||
      item.name.toLowerCase().includes('aysa') ||
      item.name.toLowerCase().includes('agua');
    if (isEnergy && item.nextMeasurementDate) {
      reminders.push(
        <span key={`meas-${item.id}`}>
          El día <strong>{item.nextMeasurementDate}</strong> pasarán a medir:{' '}
          {item.name}
        </span>
      );
    }
    const isInternet =
      item.name.toLowerCase().includes('internet') ||
      item.name.toLowerCase().includes('wifi') ||
      item.name.toLowerCase().includes('cable') ||
      item.name.toLowerCase().includes('flow') ||
      item.name.toLowerCase().includes('fibertel') ||
      item.name.toLowerCase().includes('telecentro') ||
      item.name.toLowerCase().includes('netflix') ||
      item.name.toLowerCase().includes('spotify') ||
      item.name.toLowerCase().includes('disney');
    if (isInternet && item.billingCloseDate) {
      reminders.push(
        <span key={`close-${item.id}`}>
          El día <strong>{item.billingCloseDate}</strong> cierra la facturación
          de: {item.name}
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
          <h4 className="flex items-center gap-2 font-bold text-sky-400 mb-2">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            Análisis Inteligente
          </h4>
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

  // Check if we show "Import from previous month" button
  let showImportButton = false;
  let previousMonthName = '';
  if (currentMonthIndex > 0) {
    previousMonthName = months[currentMonthIndex - 1];
    const prevMonthItems = services.filter(
      (s) => s.paymentMonth === currentMonthIndex - 1
    );
    if (prevMonthItems.length > 0) {
      const currentNames = services
        .filter((s) => s.paymentMonth === currentMonthIndex)
        .map((s) => s.name.toLowerCase());
      const importableItems = prevMonthItems.filter(
        (s) => !currentNames.includes(s.name.toLowerCase())
      );
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
        showToast({
          type: 'success',
          message: `¡Éxito! Se importaron ${newItems.length} registros nuevos.`
        });
      } else {
        showToast({
          type: 'warning',
          message: 'No se importó nada. Puede que los registros ya existan o el archivo esté vacío.'
        });
      }
    } catch (err) {
      logger.error(err);
      showToast({
        type: 'error',
        message: 'Error al leer el archivo Excel. Verifica el formato.'
      });
    }
    e.target.value = ''; // Reset input
  };

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
  }, [currentMonthIndex, services]);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row animate-fade-in text-slate-800 bg-[#f8fafc]">
      {/* Mobile Top Header Bar */}
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

      {/* Overlay behind sidebar on mobile when open */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* Sidebar: Navy Left Column on Desktop, Drawer on Mobile */}
      <aside
        className={`fixed inset-y-0 left-0 w-64 bg-[#090f1d] text-slate-300 shrink-0 flex flex-col border-r border-slate-800/20 z-50 transition-transform duration-300 lg:static lg:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand/Logo Section */}
        <div className="px-6 py-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-400 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-emerald-500/10">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
            </div>
            <div>
              <h1 className="text-md font-black tracking-tight text-white flex items-center gap-1 select-none">
                <span className="text-emerald-400">FINANZAS</span>
                <span>YA</span>
              </h1>
              <p className="text-[9px] font-bold text-slate-500 tracking-wider uppercase select-none">
                ServiTrack Panel
              </p>
            </div>
          </div>
          {/* Close button on mobile */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition cursor-pointer"
            aria-label="Cerrar menú"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-4 py-6 space-y-1.5">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(false)}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold rounded-r-xl border-l-4 border-emerald-500 text-white bg-gradient-to-r from-emerald-500/10 to-slate-800/40 shadow-sm transition"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-400">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Inicio
          </button>

          <button
            type="button"
            onClick={() => {
              const el = document.getElementById('services-list-container');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
              setIsMobileMenuOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold rounded-r-xl border-l-4 border-transparent text-slate-400 hover:text-white hover:bg-white/5 transition"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            Cuentas
          </button>

          <button
            type="button"
            onClick={() => {
              onOpenModal('projection');
              setIsMobileMenuOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold rounded-r-xl border-l-4 border-transparent text-slate-400 hover:text-white hover:bg-white/5 transition"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            Presupuestos
          </button>

          <button
            type="button"
            onClick={() => {
              const el = document.getElementById('services-list-container');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
              setIsMobileMenuOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold rounded-r-xl border-l-4 border-transparent text-slate-400 hover:text-white hover:bg-white/5 transition"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M17 1l4 4-4 4" />
              <path d="M3 11V9a4 4 0 0 1 4-4h14" />
              <path d="M7 23l-4-4 4-4" />
              <path d="M21 13v2a4 4 0 0 1-4 4H3" />
            </svg>
            Transacciones
          </button>

          <button
            type="button"
            onClick={() => {
              const el = document.getElementById('services-list-container');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
              setIsMobileMenuOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold rounded-r-xl border-l-4 border-transparent text-slate-400 hover:text-white hover:bg-white/5 transition"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
            Metas
          </button>

          <button
            type="button"
            onClick={() => {
              onOpenModal('projection');
              setIsMobileMenuOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold rounded-r-xl border-l-4 border-transparent text-slate-400 hover:text-white hover:bg-white/5 transition"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            Reportes
          </button>
        </nav>

        {/* Sidebar Herramientas list */}
        <div className="px-4 py-4 border-t border-white/5">
          <p className="px-4 text-[10px] font-bold text-slate-500 tracking-wider uppercase mb-2 select-none">
            Análisis
          </p>
          <div className="space-y-1">
            <button
              onClick={() => {
                onOpenModal('projection');
                setIsMobileMenuOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 rounded-lg flex items-center gap-2 transition cursor-pointer"
              type="button"
            >
              Proyección Anual
            </button>
            <button
              onClick={() => {
                onOpenModal('simulation');
                setIsMobileMenuOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 rounded-lg flex items-center gap-2 transition cursor-pointer"
              type="button"
            >
              Simulador de Bajas
            </button>
            {currentItems.some((item) => item.consumptionUnit !== undefined && item.consumptionUnit !== null) && (
              <button
                onClick={() => {
                  onOpenModal('consumption');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 rounded-lg flex items-center gap-2 transition cursor-pointer"
                type="button"
              >
                Consumo Físico
              </button>
            )}
          </div>
        </div>

        {/* Sidebar Bottom Profile/Settings */}
        <div className="p-4 border-t border-white/5 space-y-2 mt-auto">
          <div 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10 transition"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-400 to-indigo-600 flex items-center justify-center text-white font-extrabold text-xs">
              {userName.substring(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-white font-bold truncate">Mi Cuenta</p>
              <p className="text-[10px] text-slate-500 truncate font-semibold">{userName}</p>
            </div>
            <svg
              className={`transition-transform duration-200 text-slate-500 ${isProfileOpen ? 'rotate-180' : ''}`}
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>

          {/* Profile options menu inside sidebar */}
          {isProfileOpen && (
            <div className="bg-slate-900/60 border border-white/5 rounded-xl p-1.5 space-y-1 text-slate-300">
              <button
                className="w-full text-left px-3 py-2 text-[11px] font-semibold text-slate-300 hover:text-white hover:bg-white/5 rounded-lg flex items-center gap-2 transition cursor-pointer"
                onClick={() => {
                  onGenerateDemoData();
                  setIsMobileMenuOpen(false);
                }}
                type="button"
              >
                Cargar Demo Anual
              </button>
              {services && services.some((s) => s.is_demo) && (
                <button
                  className="w-full text-left px-3 py-2 text-[11px] font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg flex items-center gap-2 transition cursor-pointer"
                  onClick={() => {
                    onDeleteDemoData();
                    setIsMobileMenuOpen(false);
                  }}
                  type="button"
                >
                  Eliminar Demo Anual
                </button>
              )}
              <button
                className="w-full text-left px-3 py-2 text-[11px] font-semibold text-slate-300 hover:text-white hover:bg-white/5 rounded-lg flex items-center gap-2 transition cursor-pointer"
                onClick={() => {
                  onChangePassword();
                  setIsMobileMenuOpen(false);
                }}
                type="button"
              >
                Cambiar Contraseña
              </button>
              <button
                className="w-full text-left px-3 py-2 text-[11px] font-semibold text-slate-300 hover:text-white hover:bg-white/5 rounded-lg flex items-center gap-2 transition cursor-pointer"
                onClick={() => {
                  onChangePassphraseClick();
                  setIsMobileMenuOpen(false);
                }}
                type="button"
              >
                Frase Maestra
              </button>
              <button
                className="w-full text-left px-3 py-2 text-[11px] font-semibold text-slate-300 hover:text-white hover:bg-white/5 rounded-lg flex items-center gap-2 transition cursor-pointer"
                onClick={() => {
                  onShowWelcome();
                  setIsMobileMenuOpen(false);
                }}
                type="button"
              >
                Ayuda / Privacidad
              </button>
              <div className="border-t border-white/5 my-1"></div>
              <button
                className="w-full text-left px-3 py-2 text-[11px] font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg flex items-center gap-2 transition cursor-pointer"
                onClick={onSignOut}
                type="button"
              >
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Main Header */}
        <header className="w-full px-6 py-6 bg-white border-b border-slate-200/60 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Hola, {userName}! 👋
            </h2>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Aquí tienes el resumen y control de tus finanzas para este mes.
            </p>
          </div>

          {/* Action buttons (Import, Excel) */}
          <div className="flex items-center gap-2">
            <input
              type="file"
              id="import-excel"
              accept=".xlsx"
              ref={fileInputRef}
              onChange={handleImportExcel}
              className="hidden"
            />

            <button
              className="px-4 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200/80 text-slate-700 rounded-xl flex items-center gap-2 border border-slate-200 transition duration-200 cursor-pointer"
              onClick={() => fileInputRef.current.click()}
              type="button"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
              Importar
            </button>

            <button
              className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl flex items-center gap-2 transition duration-200 shadow-sm active:scale-[0.98] cursor-pointer"
              onClick={handleExportExcel}
              type="button"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Excel
            </button>
          </div>
        </header>

        {/* Month Navigation */}
        <nav className="w-full px-6 flex py-3 bg-white border-b border-slate-200/60 sticky top-0 z-20 lg:py-4 lg:bg-slate-50/50 lg:border-b-0 lg:static lg:z-10 justify-center">
          <div className="flex gap-1.5 overflow-x-auto scrollbar-none w-full lg:w-auto lg:bg-slate-200/50 lg:border lg:border-slate-200/60 lg:p-1 lg:rounded-2xl lg:shadow-inner lg:shadow-slate-300/30">
            {months.map((month, index) => {
              const isActive = index === currentMonthIndex;
              const pendingCount = getPendingCountForMonth(index);
              const btnClass = isActive
                ? 'px-4 py-2.5 text-center text-xs font-black bg-slate-900 text-white rounded-xl shadow-sm lg:bg-white lg:text-slate-900 lg:shadow-md lg:shadow-slate-200/60 transition-all duration-200'
                : 'px-4 py-2.5 text-center text-xs font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-900 lg:hover:bg-white/40 lg:hover:text-slate-800 rounded-xl transition-all duration-200';

              return (
                <button
                  key={month}
                  className={`${btnClass} relative shrink-0`}
                  onClick={() => {
                    setCurrentMonthIndex(index);
                    setEditingItem(null);
                  }}
                  type="button"
                >
                  {month.substring(0, 3)}
                  {pendingCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[8px] font-black text-white shadow-sm shadow-rose-500/35 lg:top-0 lg:right-0 lg:translate-x-1 lg:-translate-y-1">
                      {pendingCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Main Body content wrapper */}
        <main className="flex-1 p-6 md:p-8 space-y-8 max-w-7xl w-full mx-auto">
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

          {/* Three Summary Cards (Balance, Income, Expenses) */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Balance Total Card */}
            <div className="bg-white border-l-4 border-l-emerald-500 border border-slate-200/60 rounded-2xl p-6 hover-lift transition duration-300 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <span className="text-xs font-black text-slate-500 tracking-wide uppercase">
                  Balance Total
                </span>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                  Liquidez total disponible
                </p>
                <h3 className="text-3xl font-extrabold text-emerald-600 tracking-tight mt-3 truncate">
                  {formatCurrency(liquidity)}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-emerald-50 text-emerald-600 border border-emerald-100 shrink-0 shadow-sm shadow-emerald-100/50">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"></path>
                  <path d="M4 6v12c0 1.1.9 2 2 2h14v-4"></path>
                  <path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z"></path>
                </svg>
              </div>
            </div>

            {/* Ingresos este Mes Card */}
            <div className="bg-white border-l-4 border-l-emerald-500 border border-slate-200/60 rounded-2xl p-6 hover-lift transition duration-300 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <span className="text-xs font-black text-slate-500 tracking-wide uppercase">
                  Ingresos este Mes
                </span>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                  Monto total reportado
                </p>
                <h3 className="text-3xl font-extrabold text-emerald-600 tracking-tight mt-3 truncate">
                  +{formatCurrency(totalIncome)}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-emerald-50 text-emerald-600 border border-emerald-100 shrink-0 shadow-sm shadow-emerald-100/50">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                  <polyline points="17 6 23 6 23 12"></polyline>
                </svg>
              </div>
            </div>

            {/* Gastos este Mes Card */}
            <div className="bg-white border-l-4 border-l-indigo-500 border border-slate-200/60 rounded-2xl p-6 hover-lift transition duration-300 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <span className="text-xs font-black text-slate-500 tracking-wide uppercase">
                  Gastos este Mes
                </span>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                  Servicios y obligaciones
                </p>
                <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-3 truncate">
                  -{formatCurrency(totalGeneral)}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-indigo-50 text-indigo-600 border border-indigo-100 shrink-0 shadow-sm shadow-indigo-100/50">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
                  <polyline points="17 18 23 18 23 12"></polyline>
                </svg>
              </div>
            </div>
          </section>

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

          {/* Form and Main lists layout */}
          <div id="services-list-container" className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-8">
            {/* Form card */}
            <div className="space-y-6">
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

            {/* List panels */}
            <section className="space-y-8">
              <ServiceList
                title={getListTitle('Ingresos del Mes', 'income')}
                items={getFilteredItems('income')}
                type="income"
                onEdit={onEdit}
                onDelete={onDeleteItem}
                onTogglePaid={onTogglePaid}
                onSimulate={onOpenModal}
              />

              <ServiceList
                title={getListTitle('Servicios Regulares', 'service')}
                items={getFilteredItems('service')}
                type="service"
                onEdit={onEdit}
                onDelete={onDeleteItem}
                onTogglePaid={onTogglePaid}
                onSimulate={onOpenModal}
              />

              <ServiceList
                title={getListTitle('Préstamos Activos', 'loan')}
                items={getFilteredItems('loan')}
                type="loan"
                onEdit={onEdit}
                onDelete={onDeleteItem}
                onTogglePaid={onTogglePaid}
                onSimulate={onOpenModal}
              />

              <ServiceList
                title={getListTitle('Servicios Atrasados', 'overdue')}
                items={getFilteredItems('overdue')}
                type="overdue"
                onEdit={onEdit}
                onDelete={onDeleteItem}
                onTogglePaid={onTogglePaid}
                onSimulate={onOpenModal}
              />
            </section>
          </div>
        </main>

        {/* Footer */}
        <footer className="w-full text-center py-6 text-[10px] text-slate-400 font-semibold border-t border-slate-200/50 mt-12 bg-white flex flex-col sm:flex-row justify-center items-center gap-1">
          <span>ServiTrack v1.3.0</span>
          <span className="hidden sm:inline">|</span>
          <span>
            Creado por{' '}
            <span className="text-slate-600">
              Rodrigo Alejandro Aguirre Tevez
            </span>
          </span>
        </footer>
      </div>
    </div>
  );
}

