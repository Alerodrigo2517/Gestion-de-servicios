'use client';
import { useState, useEffect, useRef } from 'react';
import { getSafeDate, formatDateToString } from '@/lib/statusHelper';

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

export default function ServiceForm({
  onSubmit,
  editingItem,
  onCancelEdit,
  currentMonthIndex,
  onImportPrevious,
  showImportButton,
  previousMonthName,
}) {
  const formRef = useRef(null);
  const [type, setType] = useState('income');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [amountError, setAmountError] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(true);

  // Auto-scroll to form when editing on mobile/tablet layout
  useEffect(() => {
    if (!editingItem || !formRef.current) return;

    const isMobileOrTablet = window.matchMedia('(max-width: 1023px)').matches;
    if (!isMobileOrTablet) return;

    requestAnimationFrame(() => {
      const rect = formRef.current?.getBoundingClientRect();
      // Only scroll if the top of the form is not already in the visible viewport
      const alreadyVisible = rect && rect.top >= 0 && rect.top <= window.innerHeight;

      if (!alreadyVisible) {
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        formRef.current?.scrollIntoView({
          behavior: reduceMotion ? 'auto' : 'smooth',
          block: 'start',
        });
      }
    });
  }, [editingItem]);

  const handleAmountChange = (val) => {
    setAmount(val);
    if (val === '') {
      setAmountError('');
      return;
    }
    const num = parseFloat(val);
    if (isNaN(num)) {
      setAmountError('El monto debe ser un número válido.');
    } else if (num < 0) {
      setAmountError('El monto no puede ser negativo.');
    } else if (num > 1000000000) {
      setAmountError('El monto no puede superar los 1.000 millones.');
    } else {
      setAmountError('');
    }
  };

  // Service-specific states
  const [consumptionMonth, setConsumptionMonth] = useState(currentMonthIndex);
  const [consumptionMonthEnd, setConsumptionMonthEnd] = useState('');
  const [consumptionUnit, setConsumptionUnit] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [nextMeasurementDate, setNextMeasurementDate] = useState('');
  const [billingCloseDate, setBillingCloseDate] = useState('');
  const [paymentSource, setPaymentSource] = useState('SELF');

  // Loan-specific states
  const [creditor, setCreditor] = useState('');
  const [currentInstallment, setCurrentInstallment] = useState('1');
  const [totalInstallments, setTotalInstallments] = useState('1');
  const [titular, setTitular] = useState('');

  // Detect dynamic fields based on name text
  useEffect(() => {
    if (editingItem) {
      setType(editingItem.type || 'income');
      setName(editingItem.name || '');
      setAmount(editingItem.amount ? String(editingItem.amount) : '');
      setPaymentSource(editingItem.paymentSource || 'SELF');
      setAmountError('');

      if (editingItem.type === 'service' || editingItem.type === 'overdue') {
        setConsumptionMonth(
          editingItem.consumptionMonth !== undefined
            ? editingItem.consumptionMonth
            : currentMonthIndex
        );
        setConsumptionMonthEnd(
          editingItem.consumptionMonthEnd !== null &&
            editingItem.consumptionMonthEnd !== undefined
            ? String(editingItem.consumptionMonthEnd)
            : ''
        );
        setConsumptionUnit(
          editingItem.consumptionUnit ? String(editingItem.consumptionUnit) : ''
        );

        if (editingItem.dueDate) {
          setDueDate(editingItem.dueDate);
        } else {
          // Construct virtual date for legacy items
          const year = new Date().getFullYear();
          const month =
            editingItem.paymentMonth !== undefined
              ? editingItem.paymentMonth
              : currentMonthIndex;
          const day =
            editingItem.nextMeasurementDate ||
            editingItem.billingCloseDate ||
            '';
          if (day) {
            const safeDateObj = getSafeDate(year, month, parseInt(day));
            setDueDate(formatDateToString(safeDateObj));
          } else {
            setDueDate('');
          }
        }
        setNextMeasurementDate(
          editingItem.nextMeasurementDate
            ? String(editingItem.nextMeasurementDate)
            : ''
        );
        setBillingCloseDate(
          editingItem.billingCloseDate
            ? String(editingItem.billingCloseDate)
            : ''
        );
      } else if (editingItem.type === 'loan') {
        setCreditor(editingItem.creditor || '');
        setCurrentInstallment(
          editingItem.currentInstallment
            ? String(editingItem.currentInstallment)
            : '1'
        );
        setTotalInstallments(
          editingItem.totalInstallments
            ? String(editingItem.totalInstallments)
            : '1'
        );
        setTitular(editingItem.titular || '');
      }
    } else {
      // Reset form (except keep tab type and current month)
      setName('');
      setAmount('');
      setPaymentSource('SELF');
      setAmountError('');
      setConsumptionMonth(currentMonthIndex);
      setConsumptionMonthEnd('');
      setConsumptionUnit('');
      setDueDate('');
      setNextMeasurementDate('');
      setBillingCloseDate('');
      setCreditor('');
      setCurrentInstallment('1');
      setTotalInstallments('1');
      setTitular('');
    }
  }, [editingItem, currentMonthIndex]);

  // Sync default consumption month if active month tab changes
  useEffect(() => {
    if (!editingItem) {
      setConsumptionMonth(currentMonthIndex);
    }
  }, [currentMonthIndex, editingItem]);

  // Resize listener to expand form on desktop automatically
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsCollapsed(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Force expand on editing state
  useEffect(() => {
    if (editingItem) {
      setIsCollapsed(false);
    }
  }, [editingItem]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !amount) return;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount < 0 || parsedAmount > 1000000000) {
      if (parsedAmount < 0) setAmountError('El monto no puede ser negativo.');
      else if (parsedAmount > 1000000000)
        setAmountError('El monto no puede superar los 1.000 millones.');
      else setAmountError('El monto debe ser un número válido.');
      return;
    }
    setAmountError('');

    let itemData = {
      type,
      name: name.trim(),
      amount: parsedAmount,
      paymentMonth: currentMonthIndex,
      paymentSource: type !== 'income' ? paymentSource : 'SELF',
    };

    if (type === 'service' || type === 'overdue') {
      itemData.consumptionMonth = parseInt(consumptionMonth);
      itemData.consumptionMonthEnd = consumptionMonthEnd
        ? parseInt(consumptionMonthEnd)
        : null;
      itemData.dueDate = dueDate || null;

      itemData.nextMeasurementDate = nextMeasurementDate ? parseInt(nextMeasurementDate) : null;
      itemData.billingCloseDate = billingCloseDate ? parseInt(billingCloseDate) : null;

      if (consumptionUnit) {
        itemData.consumptionUnit = parseFloat(consumptionUnit);
      }
    } else if (type === 'loan') {
      itemData.creditor = creditor.trim();
      itemData.currentInstallment = parseInt(currentInstallment) || 1;
      itemData.totalInstallments = parseInt(totalInstallments) || 1;
      itemData.titular = titular.trim();
    }

    if (editingItem) {
      itemData.id = editingItem.id;
      itemData.isPaid = editingItem.isPaid;
      if (editingItem.paymentDate)
        itemData.paymentDate = editingItem.paymentDate;
    }

    onSubmit(itemData);

    // Reset fields if not editing
    if (!editingItem) {
      setName('');
      setAmount('');
      setPaymentSource('SELF');
      setConsumptionMonthEnd('');
      setConsumptionUnit('');
      setDueDate('');
      setNextMeasurementDate('');
      setBillingCloseDate('');
      setCreditor('');
      setCurrentInstallment('1');
      setTotalInstallments('1');
      setTitular('');
      setAmountError('');
    }
  };

  const getFocusRing = () => {
    switch (type) {
      case 'income':
        return 'focus:ring-emerald-500/20 focus:border-emerald-500 hover:border-emerald-500/40 focus:bg-emerald-50/10';
      case 'service':
        return 'focus:ring-sky-500/20 focus:border-sky-500 hover:border-sky-500/40 focus:bg-sky-50/10';
      case 'loan':
        return 'focus:ring-purple-500/20 focus:border-purple-500 hover:border-purple-500/40 focus:bg-purple-50/10';
      case 'overdue':
        return 'focus:ring-rose-500/20 focus:border-rose-500 hover:border-rose-500/40 focus:bg-rose-50/10';
      default:
        return 'focus:ring-sky-500/20 focus:border-sky-500';
    }
  };

  const getSubmitBtnClass = () => {
    const base =
      'flex-[2] py-3 text-xs font-bold text-white rounded-xl shadow-lg active:scale-[0.98] transition-all duration-300 cursor-pointer ';
    switch (type) {
      case 'income':
        return (
          base +
          'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 shadow-emerald-500/10'
        );
      case 'service':
        return (
          base +
          'bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 shadow-sky-500/10'
        );
      case 'loan':
        return (
          base +
          'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 shadow-purple-500/10'
        );
      case 'overdue':
        return (
          base +
          'bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 shadow-rose-500/10'
        );
      default:
        return (
          base +
          'bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 shadow-sky-500/10'
        );
    }
  };

  return (
    <section ref={formRef} className="bg-white/80 backdrop-blur-2xl border border-white rounded-3xl p-8 self-start shadow-[0_8px_30px_-5px_rgba(6,81,237,0.1)] hover:shadow-[0_8px_40px_-5px_rgba(6,81,237,0.15)] transition-all duration-500 w-full animate-slide-up relative overflow-hidden">
      {/* Glow Line indicator on top */}
      <div
        className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r transition-all duration-500 ${
          type === 'income'
            ? 'from-emerald-400 to-teal-500'
            : type === 'service'
              ? 'from-sky-400 to-indigo-500'
              : type === 'loan'
                ? 'from-purple-400 to-indigo-500'
                : 'from-rose-400 to-red-500'
        }`}
      ></div>

      {/* Collapsible Header */}
      <div
        className="flex items-center justify-between cursor-pointer lg:cursor-default lg:pointer-events-none select-none"
        onClick={() => {
          if (window.innerWidth < 1024) {
            setIsCollapsed(!isCollapsed);
          }
        }}
      >
        <h3 className="text-sm font-black text-slate-800 tracking-wider uppercase flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full transition-all duration-500 bg-gradient-to-r ${
              type === 'income'
                ? 'from-emerald-400 to-teal-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                : type === 'service'
                  ? 'from-sky-400 to-indigo-500 shadow-[0_0_8px_rgba(56,189,248,0.5)]'
                  : type === 'loan'
                    ? 'from-purple-400 to-indigo-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]'
                    : 'from-rose-400 to-red-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'
            }`}
          ></span>
          {editingItem ? 'Editar Registro' : 'Nuevo Registro'}
        </h3>
        <span className="lg:hidden text-slate-400 p-1 hover:text-slate-600 transition">
          {isCollapsed ? (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              aria-hidden="true"
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          ) : (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              aria-hidden="true"
            >
              <polyline points="18 15 12 9 6 15"></polyline>
            </svg>
          )}
        </span>
      </div>

      {/* Collapsible Body */}
      <div
        className={`${isCollapsed ? 'hidden lg:block' : 'block'} mt-5 animate-fade-in`}
      >
        {/* Tabs Selector Segmented Control */}
        <div className="flex p-1.5 bg-slate-100/50 backdrop-blur-sm rounded-2xl mb-8 gap-1 border border-slate-200/50 shadow-inner">
          {[
            {
              key: 'income',
              label: 'Ingreso',
              activeClass:
                'bg-white border-white text-emerald-600 font-black shadow-[0_2px_10px_-3px_rgba(16,185,129,0.3)]',
            },
            {
              key: 'service',
              label: 'Servicio',
              activeClass:
                'bg-white border-white text-sky-600 font-black shadow-[0_2px_10px_-3px_rgba(14,165,233,0.3)]',
            },
            {
              key: 'loan',
              label: 'Préstamo',
              activeClass:
                'bg-white border-white text-purple-600 font-black shadow-[0_2px_10px_-3px_rgba(168,85,247,0.3)]',
            },
            {
              key: 'overdue',
              label: 'Atrasado',
              activeClass:
                'bg-white border-white text-rose-600 font-black shadow-[0_2px_10px_-3px_rgba(244,63,94,0.3)]',
            },
          ].map((tab) => {
            const isActive = type === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setType(tab.key)}
                className={`flex-1 py-2.5 text-center text-[11px] font-bold rounded-xl transition-all duration-300 border border-transparent cursor-pointer ${
                  isActive
                    ? tab.activeClass + ' scale-[1.02]'
                    : 'text-slate-400 hover:text-slate-600 hover:bg-white/40'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Field */}
          <div>
            <label
              htmlFor="item-name"
              className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-widest"
            >
              {type === 'income'
                ? 'Origen del Ingreso'
                : type === 'loan'
                  ? 'Detalle Préstamo'
                  : 'Nombre Servicio'}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  aria-hidden="true"
                >
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                  <line x1="7" y1="7" x2="7.01" y2="7"></line>
                </svg>
              </span>
              <input
                type="text"
                id="item-name"
                placeholder={
                  type === 'income'
                    ? 'Ej. Sueldo Principal...'
                    : type === 'loan'
                      ? 'Ej. Cuota Auto...'
                      : 'Ej. Luz Edesur, Internet...'
                }
                required
                autoComplete="off"
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full pl-11 pr-4 py-3.5 bg-white/70 border border-slate-200/80 rounded-2xl text-slate-800 text-xs font-semibold placeholder-slate-400 focus:outline-none focus:ring-2 transition-all duration-300 shadow-inner ${getFocusRing()}`}
              />
            </div>
          </div>

          {/* Amount Field */}
          <div>
            <label
              htmlFor="item-amount"
              className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-widest"
            >
              {type === 'income'
                ? 'Monto neto ($)'
                : type === 'loan'
                  ? 'Monto de la Cuota ($)'
                  : 'Monto Estimado ($)'}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold text-xs select-none">
                $
              </span>
              <input
                type="number"
                id="item-amount"
                placeholder="0.00"
                required
                step="0.01"
                min="0"
                max="1000000000"
                aria-invalid={!!amountError}
                aria-describedby={amountError ? 'amount-error' : undefined}
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                className={`w-full pl-11 pr-4 py-3.5 bg-white/70 border border-slate-200/80 rounded-2xl text-slate-800 text-xs font-semibold placeholder-slate-400 focus:outline-none focus:ring-2 transition-all duration-300 shadow-inner ${getFocusRing()}`}
              />
            </div>
            {amountError && (
              <div
                id="amount-error"
                role="alert"
                className="mt-1.5 text-[10px] text-rose-500 font-bold"
              >
                {amountError}
              </div>
            )}
          </div>

          {/* Service/Overdue Specific Fields */}
          {(type === 'service' || type === 'overdue') && (
            <div className="space-y-4 pt-2 border-t border-slate-100 animate-fade-in">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="consumption-month"
                    className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-widest"
                  >
                    Consumo De
                  </label>
                  <select
                    id="consumption-month"
                    value={consumptionMonth}
                    onChange={(e) =>
                      setConsumptionMonth(parseInt(e.target.value))
                    }
                    className={`w-full px-3 py-2.5 bg-white border border-slate-200/80 rounded-xl text-slate-800 text-xs focus:outline-none focus:ring-2 transition-all duration-200 ${getFocusRing()}`}
                  >
                    {months.map((m, idx) => (
                      <option
                        key={idx}
                        value={idx}
                        className="bg-white text-slate-800"
                      >
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="consumption-month-end"
                    className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-widest"
                  >
                    Hasta (Opc.)
                  </label>
                  <select
                    id="consumption-month-end"
                    value={consumptionMonthEnd}
                    onChange={(e) => setConsumptionMonthEnd(e.target.value)}
                    className={`w-full px-3 py-2.5 bg-white border border-slate-200/80 rounded-xl text-slate-800 text-xs focus:outline-none focus:ring-2 transition-all duration-200 ${getFocusRing()}`}
                  >
                    <option value="" className="bg-white text-slate-800">
                      -- Mismo mes --
                    </option>
                    {months.map((m, idx) => (
                      <option
                        key={idx}
                        value={idx}
                        className="bg-white text-slate-800"
                      >
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Vencimientos y consumo */}
              <div className="space-y-3 pt-3 border-t border-slate-100 animate-slide-up">
                <div>
                  <label
                    htmlFor="consumption-unit"
                    className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-widest"
                  >
                    Consumo Físico (kWh / m³ / etc. - Opcional)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        aria-hidden="true"
                      >
                        <line x1="19" y1="5" x2="5" y2="19"></line>
                        <circle cx="6.5" cy="6.5" r="2.5"></circle>
                        <circle cx="17.5" cy="17.5" r="2.5"></circle>
                      </svg>
                    </span>
                    <input
                      type="number"
                      id="consumption-unit"
                      placeholder="Ej. 320"
                      step="0.1"
                      value={consumptionUnit}
                      onChange={(e) => setConsumptionUnit(e.target.value)}
                      className={`w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-200/80 rounded-xl text-slate-800 text-xs placeholder-slate-400 focus:outline-none focus:ring-2 transition-all duration-200 ${getFocusRing()}`}
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="due-date"
                    className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-widest"
                  >
                    Fecha de Vencimiento
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        aria-hidden="true"
                      >
                        <rect
                          x="3"
                          y="4"
                          width="18"
                          height="18"
                          rx="2"
                          ry="2"
                        ></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                      </svg>
                    </span>
                    <input
                      type="date"
                      id="due-date"
                      required
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className={`w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-200/80 rounded-xl text-slate-800 text-xs focus:outline-none focus:ring-2 transition-all duration-200 ${getFocusRing()}`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="next-measurement-date"
                      className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-widest"
                    >
                      Día Medición (1-31, Opc.)
                    </label>
                    <input
                      type="number"
                      id="next-measurement-date"
                      min="1"
                      max="31"
                      placeholder="Ej. 15"
                      value={nextMeasurementDate}
                      onChange={(e) => setNextMeasurementDate(e.target.value)}
                      className={`w-full px-3 py-2.5 bg-slate-50/50 border border-slate-200/80 rounded-xl text-slate-800 text-xs placeholder-slate-400 focus:outline-none focus:ring-2 transition-all duration-200 ${getFocusRing()}`}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="billing-close-date"
                      className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-widest"
                    >
                      Día Cierre (1-31, Opc.)
                    </label>
                    <input
                      type="number"
                      id="billing-close-date"
                      min="1"
                      max="31"
                      placeholder="Ej. 27"
                      value={billingCloseDate}
                      onChange={(e) => setBillingCloseDate(e.target.value)}
                      className={`w-full px-3 py-2.5 bg-slate-50/50 border border-slate-200/80 rounded-xl text-slate-800 text-xs placeholder-slate-400 focus:outline-none focus:ring-2 transition-all duration-200 ${getFocusRing()}`}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Loan specific fields */}
          {type === 'loan' && (
            <div className="space-y-4 pt-2 border-t border-slate-100 animate-fade-in">
              <div>
                <label
                  htmlFor="loan-creditor"
                  className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-widest"
                >
                  Entidad / Acreedor
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      aria-hidden="true"
                    >
                      <rect
                        x="3"
                        y="3"
                        width="18"
                        height="18"
                        rx="2"
                        ry="2"
                      ></rect>
                      <line x1="9" y1="21" x2="9" y2="9"></line>
                      <line x1="15" y1="21" x2="15" y2="9"></line>
                      <line x1="3" y1="9" x2="21" y2="9"></line>
                    </svg>
                  </span>
                  <input
                    type="text"
                    id="loan-creditor"
                    placeholder="Ej. Banco Galicia, Amigo..."
                    maxLength={100}
                    value={creditor}
                    onChange={(e) => setCreditor(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-200/80 rounded-xl text-slate-800 text-xs placeholder-slate-400 focus:outline-none focus:ring-2 transition-all duration-200 ${getFocusRing()}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="loan-current-installment"
                    className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-widest"
                  >
                    Cuota N°
                  </label>
                  <input
                    type="number"
                    id="loan-current-installment"
                    min="1"
                    placeholder="1"
                    value={currentInstallment}
                    onChange={(e) => setCurrentInstallment(e.target.value)}
                    className={`w-full px-3 py-2.5 bg-slate-50/50 border border-slate-200/80 rounded-xl text-slate-800 text-xs placeholder-slate-400 focus:outline-none focus:ring-2 transition-all duration-200 ${getFocusRing()}`}
                  />
                </div>
                <div>
                  <label
                    htmlFor="loan-total-installments"
                    className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-widest"
                  >
                    Total Cuotas
                  </label>
                  <input
                    type="number"
                    id="loan-total-installments"
                    min="1"
                    placeholder="12"
                    value={totalInstallments}
                    onChange={(e) => setTotalInstallments(e.target.value)}
                    className={`w-full px-3 py-2.5 bg-slate-50/50 border border-slate-200/80 rounded-xl text-slate-800 text-xs placeholder-slate-400 focus:outline-none focus:ring-2 transition-all duration-200 ${getFocusRing()}`}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="loan-titular"
                  className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-widest"
                >
                  Nombre del Titular
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      aria-hidden="true"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </span>
                  <input
                    type="text"
                    id="loan-titular"
                    placeholder="Ej. Rodrigo..."
                    maxLength={100}
                    value={titular}
                    onChange={(e) => setTitular(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-200/80 rounded-xl text-slate-800 text-xs placeholder-slate-400 focus:outline-none focus:ring-2 transition-all duration-200 ${getFocusRing()}`}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Origen de Fondos Selector */}
          {type !== 'income' && (
            <div className="pt-4 border-t border-slate-100 animate-fade-in">
              <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-widest">
                ¿Quién pagó este servicio?
              </label>
              <div className="flex p-1 bg-slate-100 rounded-xl gap-1 border border-slate-200/50 mb-2">
                <button
                  type="button"
                  onClick={() => setPaymentSource('SELF')}
                  className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all duration-300 border border-transparent cursor-pointer ${
                    paymentSource === 'SELF'
                      ? 'bg-white border-slate-200/60 text-sky-600 font-black shadow-sm scale-[1.01]'
                      : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Yo
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentSource('THIRD_PARTY')}
                  className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all duration-300 border border-transparent cursor-pointer ${
                    paymentSource === 'THIRD_PARTY'
                      ? 'bg-white border-slate-200/60 text-sky-600 font-black shadow-sm scale-[1.01]'
                      : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Otra persona
                </button>
              </div>
              <span className="block text-[10px] text-slate-400 italic mt-1 font-semibold">
                *Esta opción solo afecta el cálculo de tu liquidez personal.
              </span>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            {editingItem && (
              <button
                type="button"
                onClick={onCancelEdit}
                className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-500 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm bg-white"
              >
                Cancelar
              </button>
            )}
            <button type="submit" className={getSubmitBtnClass()}>
              {editingItem ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        </form>

        {showImportButton && (
          <div
            id="import-prev-container"
            className="mt-6 border-t border-slate-100 pt-4"
          >
            <button
              onClick={onImportPrevious}
              type="button"
              className="w-full py-3 px-4 rounded-xl text-xs font-bold border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.99] shadow-sm cursor-pointer"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Importar de {previousMonthName}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
