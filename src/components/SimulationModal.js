'use client';
import { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/utils';

export default function SimulationModal({ isOpen, onClose, services, currentMonthIndex }) {
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

  if (!isOpen) return null;

  // Filter current month items (excluding incomes)
  const currentMonthExpenses = services.filter(
    (s) => s.paymentMonth === currentMonthIndex && s.type !== 'income'
  );
  
  const totalOriginalExpenses = currentMonthExpenses.reduce((sum, s) => sum + s.amount, 0);

  // Map simulation cart to actual service data
  const simulatedExpensesData = simulationCart
    .map((cartItem) => {
      const originalItem = currentMonthExpenses.find((s) => s.id === cartItem.id);
      return originalItem ? { ...originalItem, simulatedAmount: cartItem.simulatedAmount } : null;
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
  const percentage = totalOriginalExpenses > 0 ? ((Math.abs(netSaved) / totalOriginalExpenses) * 100).toFixed(1) : 0;
  const newTotalGeneral = totalOriginalExpenses - netSaved;

  // Add a service to the simulation cart
  const handleAddService = () => {
    if (selectedAddId && !simulationCart.some((item) => item.id === selectedAddId)) {
      setSimulationCart((prev) => [...prev, { id: selectedAddId, simulatedAmount: 0 }]);
      setSelectedAddId('');
    }
  };

  // Add a new fictive service
  const handleAddNewService = () => {
    const amountVal = parseFloat(newAmount);
    if (newName.trim() && !isNaN(amountVal) && amountVal >= 0) {
      setSimulatedNewItems((prev) => [
        ...prev,
        { id: 'temp_' + Date.now(), name: newName.trim(), amount: amountVal }
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
      prev.map((item) => (item.id === id ? { ...item, simulatedAmount: amountVal } : item))
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
    <div id="cancel-simulation-modal" className="modal fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
      <div className="backdrop-blur-md bg-slate-900/90 border border-white/10 rounded-2xl shadow-2xl p-6 md:p-8 max-w-xl w-full relative overflow-y-auto max-h-[90vh]">
        <button
          className="close-modal absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer transition-colors text-2xl"
          onClick={onClose}
          type="button"
        >
          &times;
        </button>
        <h2 className="text-xl font-bold text-white mb-5">Simulación de Baja Múltiple</h2>

        <div className="space-y-4 mb-6">
          <h4 className="text-sm font-semibold text-slate-300">Servicios en esta simulación:</h4>
          
          {simulationCart.length === 0 && simulatedNewItems.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-2">No hay servicios en simulación. Añade uno abajo.</p>
          ) : (
            <ul id="sim-selected-list" className="space-y-2.5 max-h-[180px] overflow-y-auto pr-1">
              {simulatedExpensesData.map((s) => (
                <li key={s.id} className="flex flex-col p-3 bg-white/5 border-l-4 border-emerald-500 rounded-lg space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-200 font-medium">
                      {s.name} <span className="text-xs text-slate-400">(Original: {formatCurrency(s.amount)})</span>
                    </span>
                    <button
                      className="p-1 text-slate-400 hover:text-red-400 transition"
                      onClick={() => handleRemoveService(s.id)}
                      title="Quitar de la simulación"
                      type="button"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-xs text-slate-400 font-medium whitespace-nowrap m-0">Nuevo Valor ($):</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={s.simulatedAmount}
                      onChange={(e) => handleUpdateSimulatedAmount(s.id, e.target.value)}
                      className="flex-1 px-3 py-1 rounded bg-slate-950/60 border border-white/10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-sky-500/50"
                    />
                  </div>
                </li>
              ))}

              {simulatedNewItems.map((s) => (
                <li key={s.id} className="flex justify-between items-center p-3 bg-white/5 border-l-4 border-red-500 rounded-lg">
                  <span className="text-sm text-slate-200">
                    {s.name} <span className="text-xs text-red-400 font-semibold">[Alta Nueva]</span>
                  </span>
                  <div className="flex items-center gap-3">
                    <strong className="text-red-400 text-sm font-bold">{formatCurrency(s.amount)}</strong>
                    <button
                      className="p-1 text-slate-400 hover:text-red-400 transition"
                      onClick={() => handleRemoveNewService(s.id)}
                      title="Quitar Alta"
                      type="button"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
          <div className="flex flex-col sm:flex-row gap-2.5 mt-4">
            <select
              id="sim-add-select"
              value={selectedAddId}
              onChange={(e) => setSelectedAddId(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg bg-slate-950/60 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50"
            >
              <option value="" className="bg-slate-950 text-white">-- Seleccionar otro servicio --</option>
              {availableOptions.map((s) => (
                <option key={s.id} value={s.id} className="bg-slate-950 text-white">
                  {s.name} - {formatCurrency(s.amount)}
                </option>
              ))}
            </select>
            <button
              className="px-4 py-2 text-sm font-semibold border border-white/10 bg-slate-900/40 hover:bg-white/10 text-white rounded-lg transition duration-200 whitespace-nowrap active:scale-[0.98]"
              onClick={handleAddService}
              type="button"
            >
              Añadir Baja
            </button>
          </div>

          {/* Add fictive item inputs */}
          <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
            <input
              type="text"
              placeholder="Alta Ficticia (Ej. Netflix)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="flex-[2] px-3 py-2 rounded-lg bg-slate-950/60 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50"
            />
            <input
              type="number"
              placeholder="$ Monto"
              min="0"
              step="0.01"
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg bg-slate-950/60 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50"
            />
            <button
              className="px-4 py-2 text-sm font-semibold border border-white/10 bg-slate-900/40 hover:bg-white/10 text-white rounded-lg transition duration-200 whitespace-nowrap active:scale-[0.98]"
              onClick={handleAddNewService}
              type="button"
            >
              Añadir Alta
            </button>
          </div>
        </div>

        {/* Totales de simulación */}
        <div className="bg-white/5 border border-white/10 p-4 rounded-xl space-y-2 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-400">Balance Final:</span>
            <strong
              className="text-base font-bold"
              style={{ color: netSaved >= 0 ? '#10b981' : '#ef4444' }}
            >
              {formatCurrency(Math.abs(netSaved))} {netSaved >= 0 ? '(Ahorro)' : '(Aumento)'}
            </strong>
          </div>
          <p className="text-xs text-slate-400">
            {netSaved >= 0 ? (
              <>El ahorro representa el <strong>{percentage}%</strong> de tus gastos de este mes.</>
            ) : (
              <>Tus gastos aumentarán un <strong>{percentage}%</strong> este mes.</>
            )}
          </p>
          <div className="border-t border-white/5 pt-2 mt-2 flex justify-between items-center">
            <span className="text-sm text-slate-400">Nuevo Total Mensual Estimado:</span>
            <strong className="text-base font-bold text-sky-400">{formatCurrency(newTotalGeneral)}</strong>
          </div>
        </div>

        {/* Recomendaciones de cobertura */}
        <h4 className="text-sm font-semibold text-slate-300 mb-3">Con este saldo podrías cubrir (sugerencia):</h4>
        <div id="sim-suggestions" className="max-h-[160px] overflow-y-auto pr-1">
          {netSaved <= 0 ? (
            <p className="text-sm text-red-400 font-semibold text-center py-2">
              Tu balance es negativo o nulo. El aumento de gastos no permite cubrir otras deudas.
            </p>
          ) : (suggestedItems.length === 0 && partialItems.length === 0) ? (
            <p className="text-sm text-slate-500 italic">
              {currentMonthExpenses.filter(s => !s.isPaid).length === 0
                ? 'No tienes otros servicios pendientes registrados este mes.'
                : 'No hay ahorro suficiente para cubrir otros servicios.'}
            </p>
          ) : (
            <ul className="space-y-1.5">
              {suggestedItems.map((s) => (
                <li key={s.id} className="py-2 px-3 bg-white/5 border border-white/5 rounded-lg flex justify-between items-center text-sm text-slate-200">
                  <span>{s.name}</span>
                  <span className="font-bold text-red-400">{formatCurrency(s.amount)}</span>
                </li>
              ))}
              
              {remainingBudget > 0 && (
                <li className="text-right text-xs text-slate-500 py-1">Sobra: {formatCurrency(remainingBudget)}</li>
              )}

              {remainingBudget > 0 && partialItems.length > 0 && (
                <>
                  <li className="text-xs font-semibold text-slate-400 pt-2 pb-1 border-t border-dashed border-white/10 mt-2">
                    {suggestedItems.length > 0 ? 'Con el sobrante también podrías cubrir:' : 'Tu ahorro cubre este porcentaje de tus otros servicios:'}
                  </li>
                  {partialItems.slice(0, 5).map((s) => {
                    const partialPercent = Math.round((remainingBudget / s.amount) * 100);
                    return (
                      <li key={s.id} className="py-1.5 px-3 bg-white/5 border border-white/5 rounded-lg flex justify-between items-center text-xs text-slate-300">
                        <span>{s.name}</span>
                        <span className="text-amber-400 font-semibold">{partialPercent}%</span>
                      </li>
                    );
                  })}
                  {partialItems.length > 5 && (
                    <li className="text-center text-[10px] text-slate-500 pt-1">...y otros {partialItems.length - 5} servicios más.</li>
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
