// ui.js
// Manipulación del DOM, Componentes de Vista y Seguridad (Capa de Presentación)

// Referencias del DOM
const monthsTabs = document.getElementById('months-tabs');
const currentMonthTitle = document.getElementById('current-month-title');
const totalIncomeEl = document.getElementById('total-income');
const totalGeneralEl = document.getElementById('total-general');
const totalRemainingEl = document.getElementById('total-remaining');
const totalLiquidityEl = document.getElementById('total-liquidity');
const totalDebtEl = document.getElementById('total-debt');
const totalPaidEl = document.getElementById('total-paid');
const totalOverdueEl = document.getElementById('total-overdue');

const insightsPanel = document.getElementById('insights-panel');
const remindersPanel = document.getElementById('reminders-panel');
const remindersList = document.getElementById('reminders-list');

const incomesList = document.getElementById('incomes-list');
const servicesList = document.getElementById('services-list');
const loansList = document.getElementById('loans-list');
const overdueList = document.getElementById('overdue-list');

// --- SEGURIDAD Y UTILIDADES ---

function formatCurrency(value) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(value);
}

// Evita inyección XSS convirtiendo caracteres especiales a HTML Entities
function escapeHTML(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// --- RENDERIZADO PRINCIPAL ---

function renderTabs() {
  monthsTabs.innerHTML = '';
  const fragment = document.createDocumentFragment();

  months.forEach((month, index) => {
    const btn = document.createElement('button');
    btn.textContent = month.substring(0, 3);

    if (index === currentMonthIndex) {
      btn.className =
        'flex-1 min-w-[70px] sm:min-w-[80px] py-3 text-center text-xs sm:text-sm font-bold border-t-2 border-sky-500 bg-slate-900/40 text-slate-100 backdrop-blur-md rounded-t-xl transition-all duration-200';
    } else {
      btn.className =
        'flex-1 min-w-[70px] sm:min-w-[80px] py-3 text-center text-xs sm:text-sm font-semibold border-t-2 border-transparent bg-slate-900/10 text-slate-400 hover:bg-slate-900/30 hover:text-slate-200 rounded-t-xl transition-all duration-200';
    }

    btn.onclick = () => {
      currentMonthIndex = index;
      renderTabs();
      renderApp();
    };
    fragment.appendChild(btn);
  });

  monthsTabs.appendChild(fragment);
}

function renderApp() {
  currentMonthTitle.textContent = months[currentMonthIndex];

  // Configura meses de consumo por defecto (si existen en el form)
  const consMonthSelect = document.getElementById('consumption-month');
  const consMonthEndSelect = document.getElementById('consumption-month-end');
  if (consMonthSelect) consMonthSelect.value = currentMonthIndex;
  if (consMonthEndSelect) consMonthEndSelect.value = '';

  const currentItems = services.filter(
    (s) => s.paymentMonth === currentMonthIndex
  );

  let totalPending = 0;
  let totalPaid = 0;
  let totalLoans = 0;
  let totalOverdue = 0;
  let totalIncome = 0;

  // DocumentFragments para mejorar el rendimiento
  const fragIncomes = document.createDocumentFragment();
  const fragServices = document.createDocumentFragment();
  const fragLoans = document.createDocumentFragment();
  const fragOverdue = document.createDocumentFragment();

  let hasIncomes = false;
  let hasRegularServices = false;
  let hasLoans = false;
  let hasOverdue = false;

  currentItems.forEach((item) => {
    if (item.type === 'income') {
      hasIncomes = true;
      totalIncome += item.amount;
      fragIncomes.appendChild(createItemCard(item));
    } else if (item.type === 'loan') {
      hasLoans = true;
      if (!item.isPaid) {
        totalLoans += item.amount;
      } else {
        totalPaid += item.amount;
      }
      fragLoans.appendChild(createItemCard(item));
    } else if (item.type === 'overdue') {
      hasOverdue = true;
      if (item.isPaid) {
        totalPaid += item.amount;
      } else {
        totalOverdue += item.amount;
      }
      fragOverdue.appendChild(createItemCard(item));
    } else {
      hasRegularServices = true;
      if (item.isPaid) {
        totalPaid += item.amount;
      } else {
        totalPending += item.amount;
      }
      fragServices.appendChild(createItemCard(item));
    }
  });

  // Vaciamos listas
  if (incomesList) incomesList.innerHTML = '';
  servicesList.innerHTML = '';
  loansList.innerHTML = '';
  overdueList.innerHTML = '';

  // Añadimos Fragmentos al DOM
  if (incomesList) {
    if (!hasIncomes) {
      incomesList.innerHTML =
        '<p class="text-sm text-slate-500 italic py-1">No hay ingresos registrados.</p>';
    } else {
      incomesList.appendChild(fragIncomes);
    }
  }
  if (!hasRegularServices) {
    servicesList.innerHTML =
      '<p class="text-sm text-slate-500 italic py-1">No hay servicios registrados.</p>';
  } else {
    servicesList.appendChild(fragServices);
  }

  if (!hasLoans) {
    loansList.innerHTML =
      '<p class="text-sm text-slate-500 italic py-1">No hay préstamos activos.</p>';
  } else {
    loansList.appendChild(fragLoans);
  }

  if (!hasOverdue) {
    overdueList.innerHTML =
      '<p class="text-sm text-slate-500 italic py-1">No hay servicios atrasados.</p>';
  } else {
    overdueList.appendChild(fragOverdue);
  }

  const totalGeneral = totalPending + totalPaid + totalLoans + totalOverdue;
  const totalDebt = totalPending + totalLoans + totalOverdue;
  const remaining = totalIncome - totalGeneral;
  const liquidity = totalIncome - totalPaid;

  if (totalIncomeEl) totalIncomeEl.textContent = formatCurrency(totalIncome);
  if (totalGeneralEl) totalGeneralEl.textContent = formatCurrency(totalGeneral);

  if (totalRemainingEl) {
    totalRemainingEl.textContent = formatCurrency(remaining);
    totalRemainingEl.style.color = remaining < 0 ? '#ef4444' : '#38bdf8';
  }

  if (totalLiquidityEl) {
    totalLiquidityEl.textContent = formatCurrency(liquidity);
    totalLiquidityEl.style.color = liquidity < 0 ? '#ef4444' : '#f59e0b';
  }

  if (totalDebtEl) totalDebtEl.textContent = formatCurrency(totalDebt);
  if (totalPaidEl) totalPaidEl.textContent = formatCurrency(totalPaid);
  if (totalOverdueEl) totalOverdueEl.textContent = formatCurrency(totalOverdue);

  renderInsightsAndReminders(currentItems);
  renderImportPrevButton();
}

function createItemCard(item) {
  const div = document.createElement('div');
  if (item.isPaid) {
    div.className =
      'flex justify-between items-center bg-slate-900/10 border border-white/5 p-4 rounded-xl opacity-60 hover:bg-slate-900/20 transition-all duration-300';
  } else {
    div.className =
      'flex justify-between items-center bg-white/5 border border-white/10 p-4 rounded-xl hover:bg-white/10 hover:-translate-y-0.5 transition-all duration-300 shadow-md';
  }

  // Sanitizamos los textos libres
  const safeName = escapeHTML(item.name);

  let metaText = '';
  let nameHtml = '';
  let progressBarHtml = '';

  if (item.type === 'loan') {
    const safeCreditor = escapeHTML(item.creditor);
    const safeTitular = escapeHTML(item.titular);
    const progressPercent = Math.min(
      100,
      Math.round((item.currentInstallment / item.totalInstallments) * 100)
    );

    nameHtml = `
            <div class="flex justify-between items-center w-full">
                <div class="text-white font-semibold text-base">${safeName} <span class="text-xs text-slate-400 font-normal">(${safeCreditor})</span></div>
                <div class="text-white font-bold text-lg">${formatCurrency(item.amount)}</div>
            </div>`;

    metaText = `Titular: ${safeTitular || 'N/A'} | Cuota ${item.currentInstallment} de ${item.totalInstallments}`;
    progressBarHtml = `
            <div class="w-full bg-black/30 rounded-full h-1.5 mt-2 overflow-hidden">
                <div class="h-full bg-gradient-to-r from-purple-500 to-sky-400 transition-all duration-300" style="width: ${progressPercent}%"></div>
            </div>`;
  } else if (item.type === 'income') {
    metaText = `Ingreso reportado en ${months[item.paymentMonth]}`;
    nameHtml = `<div class="font-semibold text-base text-emerald-400">${safeName}</div>`;
  } else {
    metaText = `Consumo: ${months[item.consumptionMonth]}`;
    if (
      item.consumptionMonthEnd !== null &&
      item.consumptionMonthEnd !== item.consumptionMonth
    ) {
      metaText += ` a ${months[item.consumptionMonthEnd]}`;
    }
    if (item.consumptionUnit) {
      metaText += ` | ${item.consumptionUnit} und.`;
    }

    if (item.isPaid) {
      nameHtml = `<div class="text-slate-500 line-through font-semibold text-base">${safeName}</div>`;
    } else {
      nameHtml = `<div class="text-white font-semibold text-base">${safeName}</div>`;
    }
  }

  if (item.isPaid && item.paymentDate) {
    metaText += ` | Pagado el: ${item.paymentDate}`;
  }

  div.innerHTML = `
        <div class="flex-1 ${item.type === 'loan' ? 'w-full' : ''}">
            ${nameHtml}
            <div class="text-xs text-slate-400 mt-1 flex flex-wrap gap-2 items-center">${metaText}</div>
            ${progressBarHtml}
        </div>
        ${item.type !== 'loan' ? `<div class="text-lg font-bold text-slate-100 shrink-0 mr-5 ${item.type === 'income' ? 'text-emerald-400' : ''}">${formatCurrency(item.amount)}</div>` : ''}
        <div class="flex items-center gap-2 shrink-0 ${item.type === 'loan' ? 'ml-4' : ''}">
            ${
              item.type !== 'income'
                ? `
            <button class="p-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition duration-150 active:scale-95" onclick="simulateCancellation('${item.id}')" title="Simular Baja">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="8" y1="12" x2="16" y2="12"></line></svg>
            </button>
            `
                : ''
            }
            <button class="p-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition duration-150 active:scale-95" onclick="editItem('${item.id}')" title="Editar">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
            ${
              item.type !== 'income'
                ? `
            <button class="p-2 ${item.isPaid ? 'bg-slate-700 hover:bg-slate-600' : 'bg-emerald-500 hover:bg-emerald-600'} text-white rounded-lg transition duration-150 active:scale-95" onclick="togglePaid('${item.id}')" title="${item.isPaid ? 'Marcar como pendiente' : 'Marcar como pagado'}">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </button>
            `
                : ''
            }
            <button class="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition duration-150 active:scale-95" onclick="deleteItem('${item.id}')" title="Eliminar">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
        </div>
    `;
  return div;
}

function renderImportPrevButton() {
  const container = document.getElementById('import-prev-container');
  container.innerHTML = '';

  if (currentMonthIndex === 0) return;

  const prevItems = services.filter(
    (s) => s.paymentMonth === currentMonthIndex - 1
  );
  if (prevItems.length === 0) return;

  const currentNames = services
    .filter((s) => s.paymentMonth === currentMonthIndex)
    .map((s) => s.name.toLowerCase());
  const importableItems = prevItems.filter(
    (s) => !currentNames.includes(s.name.toLowerCase())
  );

  if (importableItems.length > 0) {
    const btn = document.createElement('button');
    btn.className =
      'w-full py-2.5 px-4 rounded-xl text-sm font-medium border border-white/10 bg-slate-900/40 hover:bg-white/10 text-slate-300 transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.99] shadow-md';
    btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> Importar ${importableItems.length} registros de ${months[currentMonthIndex - 1]}`;

    btn.onclick = () => {
      importableItems.forEach((item) => {
        let newItem = { ...item };
        newItem.id =
          Date.now().toString() + Math.random().toString(36).substr(2, 5);
        newItem.paymentMonth = currentMonthIndex;
        newItem.isPaid = false;

        if (newItem.type === 'service' || newItem.type === 'overdue') {
          if (newItem.consumptionMonth !== null) {
            newItem.consumptionMonth = currentMonthIndex;
            newItem.consumptionMonthEnd = null;
          }
          delete newItem.consumptionUnit;
        } else if (newItem.type === 'loan') {
          if (newItem.currentInstallment < newItem.totalInstallments) {
            newItem.currentInstallment += 1;
          }
        }
        services.push(newItem);
      });
      saveData();
      renderApp();
    };
    container.appendChild(btn);
  }
}

function renderInsightsAndReminders(currentItems) {
  let reminders = [];
  currentItems.forEach((item) => {
    const safeName = escapeHTML(item.name);
    if (item.nextMeasurementDate) {
      reminders.push(
        `El día <strong>${item.nextMeasurementDate}</strong> pasarán a medir: ${safeName}`
      );
    }
    if (item.billingCloseDate) {
      reminders.push(
        `El día <strong>${item.billingCloseDate}</strong> cierra la facturación de: ${safeName}`
      );
    }
  });

  if (reminders.length > 0) {
    remindersPanel.classList.remove('hidden');
    remindersList.innerHTML = reminders.map((r) => `<li>${r}</li>`).join('');
  } else {
    remindersPanel.classList.add('hidden');
  }

  if (currentMonthIndex === 0) {
    insightsPanel.classList.add('hidden');
    return;
  }

  const prevItems = services.filter(
    (s) => s.paymentMonth === currentMonthIndex - 1 && s.type === 'service'
  );
  const currServices = currentItems.filter((s) => s.type === 'service');

  if (prevItems.length === 0) {
    insightsPanel.classList.add('hidden');
    return;
  }

  const prevTotal = prevItems.reduce((sum, item) => sum + item.amount, 0);
  const currTotal = currServices.reduce((sum, item) => sum + item.amount, 0);

  let html = `<h4 class="flex items-center gap-2 font-semibold text-sky-400 mb-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                    Análisis Inteligente
                </h4>`;

  const diff = currTotal - prevTotal;
  if (Math.abs(diff) > 100) {
    if (diff > 0) {
      html += `<p class="mt-2 text-slate-300">Tus gastos regulares subieron <strong class="text-red-400 font-semibold">${formatCurrency(diff)}</strong> respecto a ${months[currentMonthIndex - 1]}.</p>`;
    } else {
      html += `<p class="mt-2 text-emerald-400">¡Excelente! Tus gastos bajaron <strong class="font-semibold text-emerald-300">${formatCurrency(Math.abs(diff))}</strong> respecto a ${months[currentMonthIndex - 1]}.</p>`;
    }
  } else {
    html += `<p class="mt-2 text-slate-300">Tus gastos se mantienen estables respecto al mes anterior.</p>`;
  }

  insightsPanel.innerHTML = html;
  insightsPanel.classList.remove('hidden');
}

function updateSimulationView() {
  const currentMonthItems = services.filter(
    (s) => s.paymentMonth === currentMonthIndex && s.type !== 'income'
  );
  const totalGeneral = currentMonthItems.reduce((sum, s) => sum + s.amount, 0);

  const simulatedItemsData = simulationCart
    .map((cartItem) => {
      const originalItem = currentMonthItems.find((s) => s.id === cartItem.id);
      return originalItem
        ? { ...originalItem, simulatedAmount: cartItem.simulatedAmount }
        : null;
    })
    .filter((s) => s !== null);

  let totalSaved = 0;
  simulatedItemsData.forEach((s) => {
    totalSaved += s.amount - s.simulatedAmount;
  });

  let totalNewExpenses = 0;
  simulatedNewItems.forEach((s) => {
    totalNewExpenses += s.amount;
  });

  const netSaved = totalSaved - totalNewExpenses;
  const percentage =
    totalGeneral > 0
      ? ((Math.abs(netSaved) / totalGeneral) * 100).toFixed(1)
      : 0;

  const newTotalGeneral = totalGeneral - netSaved;

  const savedAmountEl = document.getElementById('sim-saved-amount');
  const percentageTextEl = document.getElementById('sim-percentage-text');
  const newTotalAmountEl = document.getElementById('sim-new-total-amount');

  newTotalAmountEl.textContent = formatCurrency(newTotalGeneral);

  if (netSaved >= 0) {
    savedAmountEl.textContent = formatCurrency(netSaved) + ' (Ahorro)';
    savedAmountEl.style.color = '#10b981'; // emerald-500
    percentageTextEl.innerHTML = `El ahorro representa el <strong>${percentage}%</strong> de tus gastos de este mes.`;
  } else {
    savedAmountEl.textContent =
      formatCurrency(Math.abs(netSaved)) + ' (Aumento)';
    savedAmountEl.style.color = '#ef4444'; // red-500
    percentageTextEl.innerHTML = `Tus gastos aumentarán un <strong>${percentage}%</strong> este mes.`;
  }

  const selectedList = document.getElementById('sim-selected-list');
  selectedList.innerHTML = '';

  // Fragmentos
  const simFrag = document.createDocumentFragment();

  simulatedItemsData.forEach((s) => {
    const li = document.createElement('li');
    li.className =
      'flex flex-col p-3 bg-white/5 border-l-4 border-emerald-500 rounded-lg mb-2.5 space-y-2';
    li.innerHTML = `
                <div class="flex justify-between items-center text-sm">
                    <span class="text-slate-200 font-medium">${escapeHTML(s.name)} <span class="text-xs text-slate-400">(Original: ${formatCurrency(s.amount)})</span></span>
                    <button class="p-1 text-slate-400 hover:text-red-400 transition" onclick="removeServiceFromSimulation('${s.id}')" title="Quitar de la simulación">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
                <div class="flex items-center gap-3">
                    <label class="text-xs text-slate-400 font-medium whitespace-nowrap m-0">Nuevo Valor ($):</label>
                    <input type="number" step="0.01" min="0" value="${s.simulatedAmount}" oninput="updateSimulatedAmount('${s.id}', this.value)" class="flex-1 px-3 py-1 rounded bg-slate-950/60 border border-white/10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-sky-500/50">
                </div>
        `;
    simFrag.appendChild(li);
  });

  simulatedNewItems.forEach((s) => {
    const li = document.createElement('li');
    li.className =
      'flex justify-between items-center p-3 bg-white/5 border-l-4 border-red-500 rounded-lg mb-2.5';
    li.innerHTML = `
                <span class="text-sm text-slate-200">${escapeHTML(s.name)} <span class="text-xs text-red-400 font-semibold">[Alta Nueva]</span></span>
                <div class="flex items-center gap-3">
                    <strong class="text-red-400 text-sm font-bold">${formatCurrency(s.amount)}</strong>
                    <button class="p-1 text-slate-400 hover:text-red-400 transition" onclick="removeNewServiceFromSimulation('${s.id}')" title="Quitar Alta">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
        `;
    simFrag.appendChild(li);
  });

  selectedList.appendChild(simFrag);

  const select = document.getElementById('sim-add-select');
  const availableItems = currentMonthItems.filter(
    (s) => !simulationCart.some((item) => item.id === s.id)
  );

  select.innerHTML =
    '<option value="" class="bg-slate-950 text-white">-- Seleccionar otro servicio --</option>';
  const optFrag = document.createDocumentFragment();
  availableItems.forEach((s) => {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.className = 'bg-slate-950 text-white';
    opt.textContent = `${s.name} - ${formatCurrency(s.amount)}`;
    optFrag.appendChild(opt);
  });
  select.appendChild(optFrag);

  const suggestionsContainer = document.getElementById('sim-suggestions');
  suggestionsContainer.innerHTML = '';

  if (netSaved <= 0) {
    suggestionsContainer.innerHTML =
      '<p class="text-sm text-red-400 font-semibold text-center py-2">Tu balance es negativo o nulo. El aumento de gastos no permite cubrir otras deudas.</p>';
    return;
  }

  const otherPending = currentMonthItems.filter(
    (s) => !simulationCart.some((item) => item.id === s.id)
  );
  otherPending.sort((a, b) => a.amount - b.amount);

  let remainingAmount = netSaved;
  let suggestedItems = [];
  let partialItems = [];

  if (totalSaved > 0) {
    for (const pendingItem of otherPending) {
      if (pendingItem.amount <= remainingAmount) {
        suggestedItems.push(pendingItem);
        remainingAmount -= pendingItem.amount;
      } else {
        partialItems.push(pendingItem);
      }
    }
  }

  if (
    suggestedItems.length > 0 ||
    (partialItems.length > 0 && remainingAmount > 0)
  ) {
    let html = '<ul class="space-y-1.5">';

    if (suggestedItems.length > 0) {
      suggestedItems.forEach((s) => {
        const statusBadge = s.isPaid
          ? ' <span class="text-xs text-emerald-500 font-medium">(Pagado)</span>'
          : '';
        html += `<li class="py-2 px-3 bg-white/5 border border-white/5 rounded-lg flex justify-between items-center text-sm text-slate-200">
                            <span>${escapeHTML(s.name)}${statusBadge}</span>
                            <span class="font-bold text-red-400">${formatCurrency(s.amount)}</span>
                         </li>`;
      });
      if (remainingAmount > 0) {
        html += `<li class="text-right text-xs text-slate-500 py-1">Sobra: ${formatCurrency(remainingAmount)}</li>`;
      }
    }

    if (remainingAmount > 0 && partialItems.length > 0) {
      const title =
        suggestedItems.length > 0
          ? 'Con el sobrante también podrías cubrir:'
          : 'Tu ahorro cubre este porcentaje de tus otros servicios:';
      html += `<li class="text-xs font-semibold text-slate-400 pt-2 pb-1 border-t border-dashed border-white/10 mt-2">${title}</li>`;

      const displayPartials = partialItems.slice(0, 5);
      displayPartials.forEach((s) => {
        const partialPercent = Math.round((remainingAmount / s.amount) * 100);
        const statusBadge = s.isPaid
          ? ' <span class="text-xs text-emerald-500 font-medium">(Pagado)</span>'
          : '';
        html += `<li class="py-1.5 px-3 bg-white/5 border border-white/5 rounded-lg flex justify-between items-center text-xs text-slate-300">
                            <span>${escapeHTML(s.name)}${statusBadge}</span>
                            <span class="text-amber-400 font-semibold">${partialPercent}%</span>
                         </li>`;
      });

      if (partialItems.length > 5) {
        html += `<li class="text-center text-[10px] text-slate-500 pt-1">...y otros ${partialItems.length - 5} servicios más.</li>`;
      }
    }

    html += '</ul>';
    suggestionsContainer.innerHTML = html;
  } else {
    if (otherPending.length === 0) {
      suggestionsContainer.innerHTML =
        '<p class="text-sm text-slate-500 italic">No tienes otros servicios registrados este mes.</p>';
    } else {
      suggestionsContainer.innerHTML =
        '<p class="text-sm text-slate-500 italic">No hay ahorro suficiente para simular.</p>';
    }
  }
}
