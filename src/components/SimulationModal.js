'use client';
import { useState, useEffect, useRef } from 'react';
import { formatCurrency } from '@/lib/utils';

export default function SimulationModal({
  isOpen,
  onClose,
  services,
  currentMonthIndex,
}) {
  const modalRef = useRef(null);
  const previousActiveElement = useRef(null);
  const [simulationCart, setSimulationCart] = useState([]); // Array of { id, simulatedAmount }
  const [simulatedNewItems, setSimulatedNewItems] = useState([]); // Array of { id, name, amount }

  // Select state
  const [selectedAddId, setSelectedAddId] = useState('');

  // New item inputs
  const [newName, setNewName] = useState('');
  const [newAmount, setNewAmount] = useState('');

  // Clear states when closed or when active month changes
  useEffect(() => {
    if (!isOpen) {
      setSimulationCart([]);
      setSimulatedNewItems([]);
      setSelectedAddId('');
      setNewName('');
      setNewAmount('');
    }
  }, [isOpen, currentMonthIndex]);

  // Focus management when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement;
      setTimeout(() => {
        if (modalRef.current) {
          const focusableElements = modalRef.current.querySelectorAll(
            'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex]:not([tabindex="-1"]), [contenteditable]'
          );
          if (focusableElements.length > 0) {
            focusableElements[0].focus();
          }
        }
      }, 50);
    } else {
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    }
  }, [isOpen]);

  // Trap focus inside modal & Escape key handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'Tab') {
        if (!modalRef.current) return;
        const focusableElements = Array.from(
          modalRef.current.querySelectorAll(
            'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex]:not([tabindex="-1"]), [contenteditable]'
          )
        ).filter((el) => el.tabIndex !== -1 && el.offsetParent !== null);

        if (focusableElements.length === 0) return;
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (
            document.activeElement === firstElement ||
            !focusableElements.includes(document.activeElement)
          ) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (
            document.activeElement === lastElement ||
            !focusableElements.includes(document.activeElement)
          ) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Filter current month items (excluding incomes)
  const currentMonthExpenses = services.filter(
    (s) => s.paymentMonth === currentMonthIndex && s.type !== 'income'
  );

  const totalOriginalExpenses = currentMonthExpenses.reduce(
    (sum, s) => sum + s.amount,
    0
  );

  // Map simulation cart to actual service data
  const simulatedExpensesData = simulationCart
    .map((cartItem) => {
      const originalItem = currentMonthExpenses.find(
        (s) => s.id === cartItem.id
      );
      return originalItem
        ? { ...originalItem, simulatedAmount: cartItem.simulatedAmount }
        : null;
    })
    .filter((s) => s !== null);

  // Math calculations
  let totalSaved = 0;
  simulatedExpensesData.forEach((s) => {
    totalSaved += s.amount - s.simulatedAmount;
  });

  let totalNewExpenses = 0;
  simulatedNewItems.forEach((s) => {
    totalNewExpenses += s.amount;
  });

  const netSaved = totalSaved - totalNewExpenses;
  const percentage =
    totalOriginalExpenses > 0
      ? ((Math.abs(netSaved) / totalOriginalExpenses) * 100).toFixed(1)
      : 0;
  const newTotalGeneral = totalOriginalExpenses - netSaved;

  // Add a service to the simulation cart
  const handleAddService = () => {
    if (
      selectedAddId &&
      !simulationCart.some((item) => item.id === selectedAddId)
    ) {
      setSimulationCart((prev) => [
        ...prev,
        { id: selectedAddId, simulatedAmount: 0 },
      ]);
      setSelectedAddId('');
    }
  };

  // Add a new fictive service
  const handleAddNewService = () => {
    const amountVal = parseFloat(newAmount);
    if (newName.trim() && !isNaN(amountVal) && amountVal >= 0) {
      setSimulatedNewItems((prev) => [
        ...prev,
        { id: 'temp_' + Date.now(), name: newName.trim(), amount: amountVal },
      ]);
      setNewName('');
      setNewAmount('');
    }
  };

  // Remove service from simulation
  const handleRemoveService = (id) => {
    setSimulationCart((prev) => prev.filter((item) => item.id !== id));
  };

  // Remove fictive new service
  const handleRemoveNewService = (id) => {
    setSimulatedNewItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Update simulated amount for an item
  const handleUpdateSimulatedAmount = (id, val) => {
    const amountVal = parseFloat(val) || 0;
    setSimulationCart((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, simulatedAmount: amountVal } : item
      )
    );
  };

  // Generate suggestions (Greedy Algorithm)
  // Remaining unpaid services NOT in the simulation cart
  const otherPendingExpenses = currentMonthExpenses.filter(
    (s) => !s.isPaid && !simulationCart.some((item) => item.id === s.id)
  );
  // Sort from smallest to largest
  otherPendingExpenses.sort((a, b) => a.amount - b.amount);

  let remainingBudget = netSaved;
  const suggestedItems = [];
  const partialItems = [];

  if (netSaved > 0) {
    for (const pendingItem of otherPendingExpenses) {
      if (pendingItem.amount <= remainingBudget) {
        suggestedItems.push(pendingItem);
        remainingBudget -= pendingItem.amount;
      } else {
        partialItems.push(pendingItem);
      }
    }
  }

  // Filter out select options (available options are non-income items not in the cart)
  const availableOptions = currentMonthExpenses.filter(
    (s) => !simulationCart.some((item) => item.id === s.id)
  );

  return (
    <div
      id="cancel-simulation-modal"
      className="modal fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[1000] p-4 animate-fade-in"
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="simulation-title"
        aria-describedby="simulation-description"
        className="glass-premium border-white/10 rounded-2xl shadow-2xl p-6 md:p-8 max-w-xl w-full relative overflow-y-auto max-h-[90vh] animate-slide-up"
      >
        {/* Glow corner */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 rounded-full blur-2xl pointer-events-none"></div>

        <button
          className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer transition-colors text-2xl"
          onClick={onClose}
          aria-label="Cerrar modal"
          type="button"
        >
          &times;
        </button>
        <h2
          id="simulation-title"
          className="text-xl font-black text-white mb-2 tracking-tight flex items-center gap-2"
        >
          <svg
            className="text-sky-400 animate-pulse"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            aria-hidden="true"
          >
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
          </svg>
          Simulador de Bajas / Altas
        </h2>
        <p
          id="simulation-description"
          className="text-[11px] text-slate-400 mb-5 font-semibold"
        >
          Proyecta altas y bajas ficticias en tus gastos fijos de este mes para
          evaluar su impacto en tu liquidez antes de aplicarlos.
        </p>

        <div className="space-y-4 mb-6">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Servicios en simulación:
          </h4>

          {simulationCart.length === 0 && simulatedNewItems.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-3 text-center bg-slate-900/20 rounded-xl border border-white/5 select-none">
              No hay servicios en simulación. Agrega bajas o altas a
              continuación.
            </p>
          ) : (
            <ul
              id="sim-selected-list"
              className="space-y-2.5 max-h-[190px] overflow-y-auto pr-1"
            >
              {simulatedExpensesData.map((s) => (
                <li
                  key={s.id}
                  className="flex flex-col p-3.5 bg-slate-950/40 border border-white/5 border-l-4 border-emerald-500 rounded-xl space-y-2"
                >
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-200 font-bold">
                      {s.name}{' '}
                      <span className="text-[10px] text-slate-400 font-normal">
                        (Original: {formatCurrency(s.amount)})
                      </span>
                    </span>
                    <button
                      className="p-1 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                      onClick={() => handleRemoveService(s.id)}
                      title="Quitar de la simulación"
                      aria-label={`Quitar ${s.name} de la simulación`}
                      type="button"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        aria-hidden="true"
                      >
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-[10px] text-slate-400 font-bold whitespace-nowrap uppercase m-0">
                      Simulado ($):
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={s.simulatedAmount}
                      onChange={(e) =>
                        handleUpdateSimulatedAmount(s.id, e.target.value)
                      }
                      className="flex-1 px-3 py-1 bg-slate-950/80 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-sky-500/50"
                    />
                  </div>
                </li>
              ))}

              {simulatedNewItems.map((s) => (
                <li
                  key={s.id}
                  className="flex justify-between items-center p-3.5 bg-slate-950/40 border border-white/5 border-l-4 border-rose-500 rounded-xl"
                >
                  <span className="text-xs font-bold text-slate-200">
                    {s.name}{' '}
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/25 ml-2 font-extrabold uppercase">
                      ALTA NUEVA
                    </span>
                  </span>
                  <div className="flex items-center gap-3">
                    <strong className="text-rose-400 text-sm font-black">
                      {formatCurrency(s.amount)}
                    </strong>
                    <button
                      className="p-1 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                      onClick={() => handleRemoveNewService(s.id)}
                      title="Quitar Alta"
                      aria-label={`Quitar alta ficticia de ${s.name}`}
                      type="button"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        aria-hidden="true"
                      >
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Add existing service selector */}
          <div className="flex flex-col sm:flex-row gap-2 mt-4 pt-3 border-t border-white/5">
            <select
              id="sim-add-select"
              value={selectedAddId}
              onChange={(e) => setSelectedAddId(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl bg-slate-950/60 border border-white/10 text-white text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/50 cursor-pointer"
            >
              <option value="" className="bg-slate-950 text-white">
                -- Seleccionar servicio existente --
              </option>
              {availableOptions.map((s) => (
                <option
                  key={s.id}
                  value={s.id}
                  className="bg-slate-950 text-white"
                >
                  {s.name} ({formatCurrency(s.amount)})
                </option>
              ))}
            </select>
            <button
              className="px-4 py-2 text-xs font-bold bg-slate-900 border border-white/10 hover:bg-white/10 text-white rounded-xl transition duration-200 whitespace-nowrap active:scale-[0.98] cursor-pointer"
              onClick={handleAddService}
              type="button"
            >
              Añadir Baja
            </button>
          </div>

          {/* Add fictive item inputs */}
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="Alta Ficticia (Ej. Netflix)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="flex-[2] px-3 py-2 rounded-xl bg-slate-950/60 border border-white/10 text-white text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/50"
            />
            <input
              type="number"
              placeholder="$ Cuota"
              min="0"
              step="0.01"
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl bg-slate-950/60 border border-white/10 text-white text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/50"
            />
            <button
              className="px-4 py-2 text-xs font-bold bg-slate-900 border border-white/10 hover:bg-white/10 text-white rounded-xl transition duration-200 whitespace-nowrap active:scale-[0.98] cursor-pointer"
              onClick={handleAddNewService}
              type="button"
            >
              Añadir Alta
            </button>
          </div>
        </div>

        {/* Totales de simulación */}
        <div className="glass-premium bg-gradient-to-br from-slate-900/60 to-slate-950 border border-white/15 p-4 rounded-xl space-y-3 mb-6 glow-sky">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Balance Final:
            </span>
            <strong
              className="text-base font-black flex items-center gap-1.5"
              style={{ color: netSaved >= 0 ? '#10b981' : '#f43f5e' }}
            >
              {netSaved >= 0 ? (
                <>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  >
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                    <polyline points="17 6 23 6 23 12"></polyline>
                  </svg>
                  {formatCurrency(Math.abs(netSaved))} (Ahorro)
                </>
              ) : (
                <>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  >
                    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
                    <polyline points="17 18 23 18 23 12"></polyline>
                  </svg>
                  {formatCurrency(Math.abs(netSaved))} (Aumento)
                </>
              )}
            </strong>
          </div>

          <div className="w-full bg-black/40 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${netSaved >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}
              style={{ width: `${Math.min(100, Math.round(percentage))}%` }}
            ></div>
          </div>

          <p className="text-[10px] text-slate-400 font-medium">
            {netSaved >= 0 ? (
              <>
                El ahorro representa el{' '}
                <strong className="text-emerald-400 font-extrabold">
                  {percentage}%
                </strong>{' '}
                de tus gastos fijos de este mes.
              </>
            ) : (
              <>
                Los nuevos gastos aumentarán un{' '}
                <strong className="text-rose-400 font-extrabold">
                  {percentage}%
                </strong>{' '}
                de tus gastos de este mes.
              </>
            )}
          </p>
          <div className="border-t border-white/5 pt-2 mt-2 flex justify-between items-center text-xs">
            <span className="text-slate-400 font-bold uppercase tracking-wider">
              Total Estimado Simulado:
            </span>
            <strong className="text-sm font-black text-sky-400">
              {formatCurrency(newTotalGeneral)}
            </strong>
          </div>
        </div>

        {/* Recomendaciones de cobertura */}
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          Con el ahorro sugerimos cubrir:
        </h4>
        <div
          id="sim-suggestions"
          className="max-h-[160px] overflow-y-auto pr-1"
        >
          {netSaved <= 0 ? (
            <p className="text-xs text-rose-400 font-bold text-center py-3 bg-rose-500/5 rounded-xl border border-rose-500/10">
              Tu balance es negativo o neutro. No hay margen de cobertura
              disponible.
            </p>
          ) : suggestedItems.length === 0 && partialItems.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-2 text-center">
              {currentMonthExpenses.filter((s) => !s.isPaid).length === 0
                ? 'No quedan otros servicios pendientes por pagar este mes.'
                : 'No hay margen suficiente para cubrir otros servicios.'}
            </p>
          ) : (
            <ul className="space-y-2">
              {suggestedItems.map((s) => (
                <li
                  key={s.id}
                  className="py-2.5 px-3.5 bg-slate-950/30 border border-white/5 rounded-xl flex justify-between items-center text-xs"
                >
                  <span className="text-slate-300 font-bold">{s.name}</span>
                  <span className="font-extrabold text-rose-400">
                    {formatCurrency(s.amount)}
                  </span>
                </li>
              ))}

              {remainingBudget > 0 && (
                <li className="text-right text-[10px] text-slate-500 font-bold">
                  Excedente sobrante: {formatCurrency(remainingBudget)}
                </li>
              )}

              {remainingBudget > 0 && partialItems.length > 0 && (
                <>
                  <li className="text-[10px] font-bold text-slate-500 pt-2 pb-1 border-t border-dashed border-white/10 mt-2 select-none uppercase tracking-wider">
                    {suggestedItems.length > 0
                      ? 'Con el sobrante también podrías abonar:'
                      : 'Tu ahorro puede abonar parcialmente:'}
                  </li>
                  {partialItems.slice(0, 3).map((s) => {
                    const partialPercent = Math.round(
                      (remainingBudget / s.amount) * 100
                    );
                    return (
                      <li
                        key={s.id}
                        className="py-2 px-3.5 bg-slate-950/20 border border-white/5 rounded-xl flex justify-between items-center text-[11px] text-slate-400"
                      >
                        <span>{s.name}</span>
                        <span className="text-amber-400 font-extrabold">
                          {partialPercent}% cubierto
                        </span>
                      </li>
                    );
                  })}
                  {partialItems.length > 3 && (
                    <li className="text-center text-[9px] text-slate-600 font-medium">
                      ... y otros {partialItems.length - 3} servicios.
                    </li>
                  )}
                </>
              )}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
