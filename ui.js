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
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value);
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
        if (index === currentMonthIndex) btn.classList.add('active');
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
    if(consMonthSelect) consMonthSelect.value = currentMonthIndex;
    if(consMonthEndSelect) consMonthEndSelect.value = "";

    const currentItems = services.filter(s => s.paymentMonth === currentMonthIndex);
    
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

    currentItems.forEach(item => {
        if (item.type === 'income') {
            hasIncomes = true;
            totalIncome += item.amount;
            fragIncomes.appendChild(createItemCard(item));
        } else if (item.type === 'loan') {
            hasLoans = true;
            if (!item.isPaid) totalLoans += item.amount;
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
    if(incomesList) incomesList.innerHTML = '';
    servicesList.innerHTML = '';
    loansList.innerHTML = '';
    overdueList.innerHTML = '';

    // Añadimos Fragmentos al DOM
    if (incomesList) {
        if (!hasIncomes) {
            incomesList.innerHTML = '<p style="color: var(--text-muted)">No hay ingresos registrados.</p>';
        } else {
            incomesList.appendChild(fragIncomes);
        }
    }
    if (!hasRegularServices) {
        servicesList.innerHTML = '<p style="color: var(--text-muted)">No hay servicios registrados.</p>';
    } else {
        servicesList.appendChild(fragServices);
    }

    if (!hasLoans) {
        loansList.innerHTML = '<p style="color: var(--text-muted)">No hay préstamos activos.</p>';
    } else {
        loansList.appendChild(fragLoans);
    }

    if (!hasOverdue) {
        overdueList.innerHTML = '<p style="color: var(--text-muted)">No hay servicios atrasados.</p>';
    } else {
        overdueList.appendChild(fragOverdue);
    }

    const totalGeneral = totalPending + totalPaid + totalLoans + totalOverdue;
    const totalDebt = totalPending + totalLoans + totalOverdue;
    const remaining = totalIncome - totalGeneral;
    const liquidity = totalIncome - totalPaid;

    if(totalIncomeEl) totalIncomeEl.textContent = formatCurrency(totalIncome);
    if(totalGeneralEl) totalGeneralEl.textContent = formatCurrency(totalGeneral);
    
    if(totalRemainingEl) {
        totalRemainingEl.textContent = formatCurrency(remaining);
        if (remaining < 0) {
            totalRemainingEl.style.color = 'var(--danger)';
        } else {
            totalRemainingEl.style.color = '#38bdf8';
        }
    }

    if(totalLiquidityEl) {
        totalLiquidityEl.textContent = formatCurrency(liquidity);
        if (liquidity < 0) {
            totalLiquidityEl.style.color = 'var(--danger)';
        } else {
            totalLiquidityEl.style.color = 'var(--warning)';
        }
    }

    if(totalDebtEl) totalDebtEl.textContent = formatCurrency(totalDebt);
    if(totalPaidEl) totalPaidEl.textContent = formatCurrency(totalPaid);
    if(totalOverdueEl) totalOverdueEl.textContent = formatCurrency(totalOverdue);

    renderInsightsAndReminders(currentItems);
    renderImportPrevButton();
}

function createItemCard(item) {
    const div = document.createElement('div');
    div.className = `item-card ${item.isPaid ? 'paid-item' : ''}`;
    
    // Sanitizamos los textos libres
    const safeName = escapeHTML(item.name);
    
    let metaText = '';
    let nameHtml = `<div class="item-name">${safeName}</div>`;
    let progressBarHtml = '';

    if (item.type === 'loan') {
        const safeCreditor = escapeHTML(item.creditor);
        const safeTitular = escapeHTML(item.titular);
        const progressPercent = Math.min(100, Math.round((item.currentInstallment / item.totalInstallments) * 100));
        
        nameHtml = `
            <div style="display:flex; justify-content:space-between">
                <div class="item-name">${safeName} <span style="font-size:0.8rem; color:var(--text-muted); font-weight:normal">(${safeCreditor})</span></div>
                <div class="item-amount" style="margin:0">${formatCurrency(item.amount)}</div>
            </div>`;
        
        metaText = `Titular: ${safeTitular || 'N/A'} | Cuota ${item.currentInstallment} de ${item.totalInstallments}`;
        progressBarHtml = `
            <div class="loan-progress-container">
                <div class="loan-progress-bar" style="width: ${progressPercent}%"></div>
            </div>`;
    } else if (item.type === 'income') {
        metaText = `Ingreso reportado en ${months[item.paymentMonth]}`;
        nameHtml = `<div class="item-name" style="color: var(--success);">${safeName}</div>`;
    } else {
        metaText = `Consumo: ${months[item.consumptionMonth]}`;
        if (item.consumptionMonthEnd !== null && item.consumptionMonthEnd !== item.consumptionMonth) {
            metaText += ` a ${months[item.consumptionMonthEnd]}`;
        }
        if (item.consumptionUnit) {
            metaText += ` | ${item.consumptionUnit} und.`;
        }
    }

    if (item.isPaid && item.paymentDate) {
        metaText += ` | Pagado el: ${item.paymentDate}`;
    }

    div.innerHTML = `
        <div class="item-info" ${item.type === 'loan' ? 'style="width: 100%"' : ''}>
            ${nameHtml}
            <div class="item-meta">${metaText}</div>
            ${progressBarHtml}
        </div>
        ${item.type !== 'loan' ? `<div class="item-amount" ${item.type === 'income' ? 'style="color: var(--success);"' : ''}>${formatCurrency(item.amount)}</div>` : ''}
        <div class="item-actions" ${item.type === 'loan' ? 'style="margin-left: 15px"' : ''}>
            ${item.type !== 'income' ? `
            <button class="btn btn-info" onclick="simulateCancellation('${item.id}')" title="Simular Baja" style="background-color: #0ea5e9; border-color: #0ea5e9; color: white;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="8" y1="12" x2="16" y2="12"></line></svg>
            </button>
            ` : ''}
            <button class="btn btn-warning" onclick="editItem('${item.id}')" title="Editar">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
            ${item.type !== 'income' ? `
            <button class="btn ${item.isPaid ? 'btn-secondary' : 'btn-success'}" onclick="togglePaid('${item.id}')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </button>
            ` : ''}
            <button class="btn btn-danger" onclick="deleteItem('${item.id}')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
        </div>
    `;
    return div;
}

function renderImportPrevButton() {
    const container = document.getElementById('import-prev-container');
    container.innerHTML = '';

    if (currentMonthIndex === 0) return;

    const prevItems = services.filter(s => s.paymentMonth === currentMonthIndex - 1);
    if (prevItems.length === 0) return;

    const currentNames = services.filter(s => s.paymentMonth === currentMonthIndex).map(s => s.name.toLowerCase());
    const importableItems = prevItems.filter(s => !currentNames.includes(s.name.toLowerCase()));

    if (importableItems.length > 0) {
        const btn = document.createElement('button');
        btn.className = 'btn btn-secondary w-100';
        btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:8px; vertical-align:middle"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> Importar ${importableItems.length} registros de ${months[currentMonthIndex - 1]}`;
        
        btn.onclick = () => {
            importableItems.forEach(item => {
                let newItem = { ...item };
                newItem.id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
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
    currentItems.forEach(item => {
        const safeName = escapeHTML(item.name);
        if (item.nextMeasurementDate) {
            reminders.push(`El día <strong>${item.nextMeasurementDate}</strong> pasarán a medir: ${safeName}`);
        }
        if (item.billingCloseDate) {
            reminders.push(`El día <strong>${item.billingCloseDate}</strong> cierra la facturación de: ${safeName}`);
        }
    });

    if (reminders.length > 0) {
        remindersPanel.classList.remove('hidden');
        remindersList.innerHTML = reminders.map(r => `<li>${r}</li>`).join('');
    } else {
        remindersPanel.classList.add('hidden');
    }

    if (currentMonthIndex === 0) {
        insightsPanel.classList.add('hidden');
        return;
    }

    const prevItems = services.filter(s => s.paymentMonth === currentMonthIndex - 1 && s.type === 'service');
    const currServices = currentItems.filter(s => s.type === 'service');

    if (prevItems.length === 0) {
        insightsPanel.classList.add('hidden');
        return;
    }

    const prevTotal = prevItems.reduce((sum, item) => sum + item.amount, 0);
    const currTotal = currServices.reduce((sum, item) => sum + item.amount, 0);
    
    let html = `<h4><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg> Análisis Inteligente</h4>`;
    
    const diff = currTotal - prevTotal;
    if (Math.abs(diff) > 100) {
        if (diff > 0) {
            html += `<p style="margin-top:8px">Tus gastos regulares subieron <strong>${formatCurrency(diff)}</strong> respecto a ${months[currentMonthIndex-1]}.</p>`;
        } else {
            html += `<p style="margin-top:8px; color:var(--success)">¡Excelente! Tus gastos bajaron <strong>${formatCurrency(Math.abs(diff))}</strong> respecto a ${months[currentMonthIndex-1]}.</p>`;
        }
    } else {
        html += `<p style="margin-top:8px">Tus gastos se mantienen estables respecto al mes anterior.</p>`;
    }

    insightsPanel.innerHTML = html;
    insightsPanel.classList.remove('hidden');
}

function updateSimulationView() {
    const currentMonthItems = services.filter(s => s.paymentMonth === currentMonthIndex && s.type !== 'income');
    const totalGeneral = currentMonthItems.reduce((sum, s) => sum + s.amount, 0);
    
    const simulatedItemsData = simulationCart.map(cartItem => {
        const originalItem = currentMonthItems.find(s => s.id === cartItem.id);
        return originalItem ? { ...originalItem, simulatedAmount: cartItem.simulatedAmount } : null;
    }).filter(s => s !== null);

    let totalSaved = 0;
    simulatedItemsData.forEach(s => {
        totalSaved += (s.amount - s.simulatedAmount);
    });

    let totalNewExpenses = 0;
    simulatedNewItems.forEach(s => {
        totalNewExpenses += s.amount;
    });

    const netSaved = totalSaved - totalNewExpenses;
    const percentage = totalGeneral > 0 ? ((Math.abs(netSaved) / totalGeneral) * 100).toFixed(1) : 0;
    
    const newTotalGeneral = totalGeneral - netSaved;
    
    const savedAmountEl = document.getElementById('sim-saved-amount');
    const percentageTextEl = document.getElementById('sim-percentage-text');
    const newTotalAmountEl = document.getElementById('sim-new-total-amount');

    newTotalAmountEl.textContent = formatCurrency(newTotalGeneral);

    if (netSaved >= 0) {
        savedAmountEl.textContent = formatCurrency(netSaved) + " (Ahorro)";
        savedAmountEl.style.color = 'var(--success)';
        percentageTextEl.innerHTML = `El ahorro representa el <strong>${percentage}%</strong> de tus gastos de este mes.`;
    } else {
        savedAmountEl.textContent = formatCurrency(Math.abs(netSaved)) + " (Aumento)";
        savedAmountEl.style.color = 'var(--danger)';
        percentageTextEl.innerHTML = `Tus gastos aumentarán un <strong>${percentage}%</strong> este mes.`;
    }

    const selectedList = document.getElementById('sim-selected-list');
    selectedList.innerHTML = '';
    
    // Fragmentos
    const simFrag = document.createDocumentFragment();

    simulatedItemsData.forEach(s => {
        const li = document.createElement('li');
        li.style.cssText = "display: flex; flex-direction: column; padding: 10px; background: rgba(255,255,255,0.05); margin-bottom: 8px; border-radius: 6px; border-left: 3px solid var(--success);";
        li.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <span>${escapeHTML(s.name)} <span style="color: var(--text-muted); font-size: 0.9em;">(Original: ${formatCurrency(s.amount)})</span></span>
                    <button class="btn btn-danger" onclick="removeServiceFromSimulation('${s.id}')" style="padding: 4px 8px; min-width: auto; background: transparent; border: none; color: #ef4444;" title="Quitar de la simulación">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <label style="font-size: 0.9em; color: var(--text-light); margin: 0; white-space: nowrap;">Nuevo Valor ($):</label>
                    <input type="number" step="0.01" min="0" value="${s.simulatedAmount}" oninput="updateSimulatedAmount('${s.id}', this.value)" style="flex: 1; padding: 6px 10px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.2); color: white;">
                </div>
        `;
        simFrag.appendChild(li);
    });

    simulatedNewItems.forEach(s => {
        const li = document.createElement('li');
        li.style.cssText = "display: flex; justify-content: space-between; align-items: center; padding: 10px; background: rgba(255,255,255,0.05); margin-bottom: 8px; border-radius: 6px; border-left: 3px solid var(--danger);";
        li.innerHTML = `
                <span>${escapeHTML(s.name)} <span style="font-size: 0.8em; color: var(--danger);">[Alta Nueva]</span></span>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <strong style="color: var(--danger);">${formatCurrency(s.amount)}</strong>
                    <button class="btn btn-danger" onclick="removeNewServiceFromSimulation('${s.id}')" style="padding: 4px 8px; min-width: auto; background: transparent; border: none; color: #ef4444;" title="Quitar Alta">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
        `;
        simFrag.appendChild(li);
    });

    selectedList.appendChild(simFrag);

    const select = document.getElementById('sim-add-select');
    const availableItems = currentMonthItems.filter(s => !simulationCart.some(item => item.id === s.id));
    
    select.innerHTML = '<option value="" style="background: #1f2937; color: white;">-- Seleccionar otro servicio --</option>';
    const optFrag = document.createDocumentFragment();
    availableItems.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.style.cssText = "background: #1f2937; color: white;";
        opt.textContent = `${s.name} - ${formatCurrency(s.amount)}`;
        optFrag.appendChild(opt);
    });
    select.appendChild(optFrag);

    const suggestionsContainer = document.getElementById('sim-suggestions');
    suggestionsContainer.innerHTML = '';

    if (netSaved <= 0) {
        suggestionsContainer.innerHTML = '<p style="color: var(--danger); font-weight: bold;">Tu balance es negativo o nulo. El aumento de gastos no permite cubrir otras deudas.</p>';
        return;
    }

    const otherPending = currentMonthItems.filter(s => !simulationCart.some(item => item.id === s.id));
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

    if (suggestedItems.length > 0 || (partialItems.length > 0 && remainingAmount > 0)) {
        let html = '<ul style="list-style-type: none; padding-left: 0;">';
        
        if (suggestedItems.length > 0) {
            suggestedItems.forEach(s => {
                const statusBadge = s.isPaid ? ' <span style="font-size: 0.8em; color: var(--success);">(Pagado)</span>' : '';
                html += `<li style="padding: 8px; border-bottom: 1px solid rgba(255,255,255,0.1); display: flex; justify-content: space-between;">
                            <span>${escapeHTML(s.name)}${statusBadge}</span>
                            <span style="font-weight: bold; color: var(--danger);">${formatCurrency(s.amount)}</span>
                         </li>`;
            });
            if (remainingAmount > 0) {
                html += `<li style="padding: 8px; text-align: right; color: var(--text-muted); font-size: 0.9em; margin-bottom: 5px;">Sobra: ${formatCurrency(remainingAmount)}</li>`;
            }
        }

        if (remainingAmount > 0 && partialItems.length > 0) {
            const title = suggestedItems.length > 0 ? 'Con el sobrante también podrías cubrir:' : 'Tu ahorro cubre este porcentaje de tus otros servicios:';
            html += `<li style="padding: 8px; font-size: 0.9em; border-top: 1px dashed rgba(255,255,255,0.2); color: var(--text-light);">${title}</li>`;
            
            const displayPartials = partialItems.slice(0, 5);
            displayPartials.forEach(s => {
                const partialPercent = Math.round((remainingAmount / s.amount) * 100);
                const statusBadge = s.isPaid ? ' <span style="font-size: 0.8em; color: var(--success);">(Pagado)</span>' : '';
                html += `<li style="padding: 4px 8px; display: flex; justify-content: space-between; font-size: 0.85em; color: var(--text-light);">
                            <span>${escapeHTML(s.name)}${statusBadge}</span>
                            <span style="color: var(--warning); font-weight: 500;">${partialPercent}%</span>
                         </li>`;
            });
            
            if (partialItems.length > 5) {
                html += `<li style="padding: 4px 8px; font-size: 0.8em; color: var(--text-muted); text-align: center;">...y otros ${partialItems.length - 5} servicios más.</li>`;
            }
        }
        
        html += '</ul>';
        suggestionsContainer.innerHTML = html;
    } else {
        if (otherPending.length === 0) {
            suggestionsContainer.innerHTML = '<p style="color: var(--text-muted);">No tienes otros servicios registrados este mes.</p>';
        } else {
            suggestionsContainer.innerHTML = '<p style="color: var(--text-muted);">No hay ahorro suficiente para simular.</p>';
        }
    }
}
