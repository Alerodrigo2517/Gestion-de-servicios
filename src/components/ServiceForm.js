'use client';
import { useState, useEffect } from 'react';

const months = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function ServiceForm({ onSubmit, editingItem, onCancelEdit, currentMonthIndex, onImportPrevious, showImportButton, previousMonthName }) {
  const [type, setType] = useState('service');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  
  // Service-specific states
  const [consumptionMonth, setConsumptionMonth] = useState(currentMonthIndex);
  const [consumptionMonthEnd, setConsumptionMonthEnd] = useState('');
  const [consumptionUnit, setConsumptionUnit] = useState('');
  const [nextMeasurementDate, setNextMeasurementDate] = useState('');
  const [billingCloseDate, setBillingCloseDate] = useState('');

  // Loan-specific states
  const [creditor, setCreditor] = useState('');
  const [currentInstallment, setCurrentInstallment] = useState('1');
  const [totalInstallments, setTotalInstallments] = useState('1');
  const [titular, setTitular] = useState('');

  // Detect dynamic fields based on name text
  const isEnergyRelated = name.toLowerCase().includes('luz') || name.toLowerCase().includes('gas') || name.toLowerCase().includes('energia');
  const isInternetRelated = name.toLowerCase().includes('internet') || name.toLowerCase().includes('wifi') || name.toLowerCase().includes('cable');
  const showDynamicFields = (type === 'service' || type === 'overdue') && (isEnergyRelated || isInternetRelated);

  // Sync state if editingItem changes
  useEffect(() => {
    if (editingItem) {
      setType(editingItem.type || 'service');
      setName(editingItem.name || '');
      setAmount(editingItem.amount ? String(editingItem.amount) : '');
      
      if (editingItem.type === 'service' || editingItem.type === 'overdue') {
        setConsumptionMonth(editingItem.consumptionMonth !== undefined ? editingItem.consumptionMonth : currentMonthIndex);
        setConsumptionMonthEnd(editingItem.consumptionMonthEnd !== null && editingItem.consumptionMonthEnd !== undefined ? String(editingItem.consumptionMonthEnd) : '');
        setConsumptionUnit(editingItem.consumptionUnit ? String(editingItem.consumptionUnit) : '');
        setNextMeasurementDate(editingItem.nextMeasurementDate ? String(editingItem.nextMeasurementDate) : '');
        setBillingCloseDate(editingItem.billingCloseDate ? String(editingItem.billingCloseDate) : '');
      } else if (editingItem.type === 'loan') {
        setCreditor(editingItem.creditor || '');
        setCurrentInstallment(editingItem.currentInstallment ? String(editingItem.currentInstallment) : '1');
        setTotalInstallments(editingItem.totalInstallments ? String(editingItem.totalInstallments) : '1');
        setTitular(editingItem.titular || '');
      }
    } else {
      // Reset form (except keep tab type and current month)
      setName('');
      setAmount('');
      setConsumptionMonth(currentMonthIndex);
      setConsumptionMonthEnd('');
      setConsumptionUnit('');
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !amount) return;

    const parsedAmount = parseFloat(amount);
    let itemData = {
      type,
      name: name.trim(),
      amount: parsedAmount,
      paymentMonth: currentMonthIndex,
    };

    if (type === 'service' || type === 'overdue') {
      itemData.consumptionMonth = parseInt(consumptionMonth);
      itemData.consumptionMonthEnd = consumptionMonthEnd ? parseInt(consumptionMonthEnd) : null;
      if (isEnergyRelated) {
        if (consumptionUnit) itemData.consumptionUnit = parseFloat(consumptionUnit);
        if (nextMeasurementDate) itemData.nextMeasurementDate = parseInt(nextMeasurementDate);
      }
      if (isInternetRelated && billingCloseDate) {
        itemData.billingCloseDate = parseInt(billingCloseDate);
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
      if (editingItem.paymentDate) itemData.paymentDate = editingItem.paymentDate;
    }

    onSubmit(itemData);

    // Reset fields if not editing
    if (!editingItem) {
      setName('');
      setAmount('');
      setConsumptionMonthEnd('');
      setConsumptionUnit('');
      setNextMeasurementDate('');
      setBillingCloseDate('');
      setCreditor('');
      setCurrentInstallment('1');
      setTotalInstallments('1');
      setTitular('');
    }
  };

  return (
    <section className="bg-slate-900/20 border border-white/5 rounded-2xl p-6 self-start shadow-xl">
      <div className="flex p-1 bg-black/20 rounded-xl mb-6 gap-1">
        {[
          { key: 'service', label: 'Servicio' },
          { key: 'loan', label: 'Préstamo' },
          { key: 'overdue', label: 'Atrasado' },
          { key: 'income', label: 'Ingreso', styleClass: 'text-emerald-400 hover:text-emerald-300' }
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setType(tab.key)}
            className={`tab-btn flex-1 py-2 text-center text-xs font-semibold rounded-lg transition-all ${
              type === tab.key ? 'active' : ''
            } ${tab.styleClass || ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nombre del Registro */}
        <div>
          <label htmlFor="item-name" className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
            {type === 'income' ? 'Origen del Ingreso (Ej: Sueldo, Venta)' : (type === 'loan' ? 'Nombre del Préstamo' : 'Nombre del Servicio')}
          </label>
          <input
            type="text"
            id="item-name"
            placeholder={type === 'income' ? 'Ej. Sueldo Principal...' : (type === 'loan' ? 'Ej. Auto, Celular...' : 'Ej. Luz, Agua, Tarjeta Visa...')}
            required
            autoComplete="off"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-950/60 border border-white/10 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-transparent transition-all"
          />
        </div>

        {/* Monto del Registro */}
        <div>
          <label htmlFor="item-amount" className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
            {type === 'income' ? 'Monto Ingresado ($)' : (type === 'loan' ? 'Monto de la Cuota ($)' : 'Monto Estimado ($)')}
          </label>
          <input
            type="number"
            id="item-amount"
            placeholder="0.00"
            required
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-950/60 border border-white/10 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-transparent transition-all"
          />
        </div>

        {/* Campos de Servicio / Atrasado */}
        {(type === 'service' || type === 'overdue') && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="consumption-month" className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                  Mes Consumo
                </label>
                <select
                  id="consumption-month"
                  value={consumptionMonth}
                  onChange={(e) => setConsumptionMonth(parseInt(e.target.value))}
                  className="w-full px-4 py-2.5 bg-slate-950/60 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-transparent transition-all"
                >
                  {months.map((m, idx) => (
                    <option key={idx} value={idx} className="bg-slate-950 text-white">
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="consumption-month-end" className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                  Hasta (Opcional)
                </label>
                <select
                  id="consumption-month-end"
                  value={consumptionMonthEnd}
                  onChange={(e) => setConsumptionMonthEnd(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950/60 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-transparent transition-all"
                >
                  <option value="" className="bg-slate-950 text-white">-- Mismo mes --</option>
                  {months.map((m, idx) => (
                    <option key={idx} value={idx} className="bg-slate-950 text-white">
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Campos Dinámicos (Luz, Gas, Internet) */}
            {showDynamicFields && (
              <div className="space-y-4 pt-2 border-t border-white/5">
                {isEnergyRelated && (
                  <>
                    <div>
                      <label htmlFor="consumption-unit" className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                        Consumo Físico (kWh / m³)
                      </label>
                      <input
                        type="number"
                        id="consumption-unit"
                        placeholder="Ej. 150"
                        step="0.1"
                        value={consumptionUnit}
                        onChange={(e) => setConsumptionUnit(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-950/60 border border-white/10 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label htmlFor="next-visit-date" className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                        Día Medición (1-31)
                      </label>
                      <input
                        type="number"
                        id="next-visit-date"
                        min="1"
                        max="31"
                        placeholder="Ej. 15"
                        value={nextMeasurementDate}
                        onChange={(e) => setNextMeasurementDate(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-950/60 border border-white/10 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-transparent transition-all"
                      />
                    </div>
                  </>
                )}
                {isInternetRelated && (
                  <div>
                    <label htmlFor="internet-close-date" className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                      Día Cierre Factura (1-31)
                    </label>
                    <input
                      type="number"
                      id="internet-close-date"
                      min="1"
                      max="31"
                      placeholder="Ej. 20"
                      value={billingCloseDate}
                      onChange={(e) => setBillingCloseDate(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-950/60 border border-white/10 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-transparent transition-all"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Campos de Préstamo */}
        {type === 'loan' && (
          <div className="space-y-4">
            <div>
              <label htmlFor="loan-creditor" className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                Acreedor / Entidad
              </label>
              <input
                type="text"
                id="loan-creditor"
                placeholder="Ej. Banco Galicia, Juan..."
                value={creditor}
                onChange={(e) => setCreditor(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950/60 border border-white/10 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-transparent transition-all"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="loan-current-installment" className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                  Cuota Actual
                </label>
                <input
                  type="number"
                  id="loan-current-installment"
                  min="1"
                  placeholder="1"
                  value={currentInstallment}
                  onChange={(e) => setCurrentInstallment(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950/60 border border-white/10 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label htmlFor="loan-total-installments" className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                  Total de Cuotas
                </label>
                <input
                  type="number"
                  id="loan-total-installments"
                  min="1"
                  placeholder="12"
                  value={totalInstallments}
                  onChange={(e) => setTotalInstallments(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950/60 border border-white/10 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-transparent transition-all"
                />
              </div>
            </div>
            <div>
              <label htmlFor="loan-titular" className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                Titular
              </label>
              <input
                type="text"
                id="loan-titular"
                placeholder="Ej. Rodrigo"
                value={titular}
                onChange={(e) => setTitular(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950/60 border border-white/10 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-transparent transition-all"
              />
            </div>
          </div>
        )}

        <div className="flex gap-2">
          {editingItem && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="flex-1 py-3 border border-white/10 hover:bg-white/5 text-slate-300 font-semibold rounded-lg transition-all"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            className="flex-[2] py-3 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold rounded-lg shadow-lg shadow-sky-500/20 active:scale-[0.98] transition-all"
          >
            {editingItem ? 'Actualizar' : 'Guardar'}
          </button>
        </div>
      </form>

      {showImportButton && (
        <div id="import-prev-container" className="mt-6">
          <button
            onClick={onImportPrevious}
            type="button"
            className="w-full py-2.5 px-4 rounded-xl text-sm font-medium border border-white/10 bg-slate-900/40 hover:bg-white/10 text-slate-300 transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.99] shadow-md"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Importar registros de {previousMonthName}
          </button>
        </div>
      )}
    </section>
  );
}
