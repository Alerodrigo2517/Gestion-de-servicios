'use client';
import { useRef, useState, useEffect } from 'react';
import ServiceForm from './ServiceForm';
import ServiceList from './ServiceList';
import Sidebar from './layout/Sidebar';
import MobileHeader from './layout/MobileHeader';
import HomeView from './views/HomeView';
import { formatCurrency } from '@/lib/utils';
import { exportToExcel, importFromExcel } from '@/lib/excelHelper';
import {
  getServiceDueDate,
  getServiceStatus,
  affectsLiquidity,
} from '@/lib/statusHelper';
import logger from '@/lib/logger';
import { useToast } from '@/components/ToastProvider';

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
}) {
  const { showToast } = useToast();
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

  const nextVencimientos = displayedVencimientos.map((item) => {
    const isOverdue = item.statusInfo.status === 'VENCIDO';
    const dateFormatted = `${String(item.dueDateObj.getDate()).padStart(2, '0')}/${String(item.dueDateObj.getMonth() + 1).padStart(2, '0')}`;
    return (
      <li
        key={`venc-${item.id}`}
        className="flex justify-between items-center text-xs py-1.5 border-b border-white/5 last:border-0"
      >
        <span className="flex items-center gap-2">
          <span
            className={`w-1.5 h-1.5 rounded-full ${isOverdue ? 'bg-rose-500 animate-pulse' : 'bg-amber-400'}`}
          ></span>
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
              <p className="mt-2 text-slate-300 font-medium">
                Tus gastos regulares subieron{' '}
                <strong className="text-rose-400 font-bold">
                  {formatCurrency(diff)}
                </strong>{' '}
                respecto a {months[currentMonthIndex - 1]}.
              </p>
            ) : (
              <p className="mt-2 text-emerald-400 font-medium">
                ¡Excelente! Tus gastos bajaron{' '}
                <strong className="font-bold text-emerald-300">
                  {formatCurrency(Math.abs(diff))}
                </strong>{' '}
                respecto a {months[currentMonthIndex - 1]}.
              </p>
            )
          ) : (
            <p className="mt-2 text-slate-300 font-medium">
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

  // Calculate active panels count for dynamic grid column allocation
  const activePanelsCount =
    (showInsights ? 1 : 0) +
    (nextVencimientos.length > 0 ? 1 : 0) +
    (reminders.length > 0 ? 1 : 0);

  const gridColsClass =
    activePanelsCount === 3
      ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
      : activePanelsCount === 2
      ? 'grid-cols-1 md:grid-cols-2'
      : 'grid-cols-1';

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden text-white bg-slate-950 font-body selection:bg-sky-500 selection:text-white">
      
      {/* Sidebar for Desktop */}
      <Sidebar 
        currentMonthIndex={currentMonthIndex}
        setCurrentMonthIndex={setCurrentMonthIndex}
        months={months}
        onGenerateDemoData={onGenerateDemoData}
        onSignOut={onSignOut}
      />

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="relative flex-1 max-w-xs w-full bg-white animate-slide-right">
            <Sidebar 
              currentMonthIndex={currentMonthIndex}
              setCurrentMonthIndex={setCurrentMonthIndex}
              months={months}
              onGenerateDemoData={onGenerateDemoData}
              onSignOut={onSignOut}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 md:ml-64 relative min-h-screen flex flex-col">
        {/* Background Mesh (subtle) */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-sky-900/20 via-slate-950 to-emerald-900/10 pointer-events-none opacity-60"></div>
        
        <MobileHeader 
          onToggleMenu={() => setIsMobileMenuOpen(true)}
          onSignOut={onSignOut}
        />

        <main className="flex-1 h-full overflow-y-auto p-4 md:p-8 relative z-10 space-y-12">
          
          <div className="flex justify-between items-end mb-2">
            <div>
              <h2 className="text-3xl font-black text-white tracking-tight">
                {months[currentMonthIndex]}
              </h2>
              <p className="text-xs text-slate-400 font-bold mt-1">Resumen financiero mensual</p>
            </div>
            
            <div className="flex gap-2">
              <input type="file" id="import-excel" accept=".xlsx" ref={fileInputRef} onChange={handleImportExcel} className="hidden" />
              <button onClick={() => fileInputRef.current.click()} className="px-4 py-2.5 text-xs font-bold bg-slate-900/60 hover:bg-slate-800 text-slate-300 border border-white/10 rounded-xl transition-all shadow-sm">
                Importar
              </button>
              <button onClick={handleExportExcel} className="px-4 py-2.5 text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-xl transition-all shadow-sm">
                Exportar Excel
              </button>
            </div>
          </div>

          <HomeView 
            services={services}
            currentMonthIndex={currentMonthIndex}
            months={months}
            onGenerateDemoData={onGenerateDemoData}
            onDeleteDemoData={onDeleteDemoData}
            onTogglePaid={onTogglePaid}
            onEdit={onEdit}
            onSimulate={onOpenModal}
          />

          <div className="border-t border-white/10 pt-10 grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-8">
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
      </div>
    </div>
  );
