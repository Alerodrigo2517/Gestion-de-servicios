// app.js
// Controlador Principal

// Elementos de formulario
const form = document.getElementById('item-form');
const tabBtns = document.querySelectorAll('.tab-btn');
const itemTypeInput = document.getElementById('item-type');
const serviceFields = document.getElementById('service-fields');
const loanFields = document.getElementById('loan-fields');
const dynamicFields = document.getElementById('dynamic-fields');

const itemNameInput = document.getElementById('item-name');
const itemAmountInput = document.getElementById('item-amount');
const consMonthSelect = document.getElementById('consumption-month');
const consMonthEndSelect = document.getElementById('consumption-month-end');

const consUnitInput = document.getElementById('consumption-unit');
const nextVisitInput = document.getElementById('next-visit-date');
const internetCloseInput = document.getElementById('internet-close-date');

function init() {
  removeDuplicates();
  populateMonthSelects();
  renderTabs();
  setupEventListeners();
  renderApp();
}

function removeDuplicates() {
  const unique = [];
  const seen = new Set();
  let hasDuplicates = false;

  services.forEach((item) => {
    const creditorPart = item.creditor
      ? `-${item.creditor.toLowerCase().trim()}`
      : '';
    const key = `${item.paymentMonth}-${item.type}-${item.name.toLowerCase().trim()}${creditorPart}-${item.amount}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(item);
    } else {
      hasDuplicates = true;
    }
  });

  if (hasDuplicates) {
    services = unique;
    saveData();
  }
}

function populateMonthSelects() {
  if (!consMonthSelect || !consMonthEndSelect) return;
  months.forEach((month, index) => {
    const option1 = new Option(month, index);
    const option2 = new Option(month, index);
    consMonthSelect.add(option1);
    consMonthEndSelect.add(option2);
  });
}

function setupEventListeners() {
  // Form Tabs
  tabBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      tabBtns.forEach((b) => b.classList.remove('active'));
      e.target.classList.add('active');
      const type = e.target.dataset.type;
      itemTypeInput.value = type;

      const nameLabel = document.getElementById('label-name');
      const amountLabel = document.getElementById('label-amount');

      if (type === 'service' || type === 'overdue') {
        serviceFields.classList.remove('hidden');
        loanFields.classList.add('hidden');
        dynamicFields.classList.add('hidden');
        nameLabel.textContent = 'Nombre del Servicio';
        amountLabel.textContent = 'Monto Estimado ($)';
      } else if (type === 'loan') {
        serviceFields.classList.add('hidden');
        loanFields.classList.remove('hidden');
        dynamicFields.classList.add('hidden');
        nameLabel.textContent = 'Nombre del Préstamo';
        amountLabel.textContent = 'Monto de la Cuota ($)';
      } else if (type === 'income') {
        serviceFields.classList.add('hidden');
        loanFields.classList.add('hidden');
        dynamicFields.classList.add('hidden');
        nameLabel.textContent = 'Origen del Ingreso (Ej: Sueldo, Venta)';
        amountLabel.textContent = 'Monto Ingresado ($)';
      }
    });
  });

  // Dynamic Fields detection
  itemNameInput.addEventListener('input', (e) => {
    if (itemTypeInput.value !== 'service' && itemTypeInput.value !== 'overdue')
      return;

    const name = e.target.value.toLowerCase();
    let showDynamic = false;

    document.getElementById('field-measurement').style.display = 'none';
    document.getElementById('field-next-visit').style.display = 'none';
    document.getElementById('field-internet-close').style.display = 'none';

    if (
      name.includes('luz') ||
      name.includes('gas') ||
      name.includes('energia')
    ) {
      showDynamic = true;
      document.getElementById('field-measurement').style.display = 'block';
      document.getElementById('field-next-visit').style.display = 'block';
      document.getElementById('btn-consumption').style.display = 'inline-flex';
    }
    if (
      name.includes('internet') ||
      name.includes('wifi') ||
      name.includes('cable')
    ) {
      showDynamic = true;
      document.getElementById('field-internet-close').style.display = 'block';
    }

    if (showDynamic) {
      dynamicFields.classList.remove('hidden');
    } else {
      dynamicFields.classList.add('hidden');
    }
  });

  // Form Submit
  form.addEventListener('submit', handleFormSubmit);

  // Modals
  document.getElementById('btn-projection').addEventListener('click', () => {
    document.getElementById('chart-modal').classList.remove('hidden');
    renderProjectionChart();
  });

  document.getElementById('btn-consumption').addEventListener('click', () => {
    document.getElementById('consumption-modal').classList.remove('hidden');
    renderConsumptionChart();
  });

  document.querySelectorAll('.close-modal').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.target.closest('.modal').classList.add('hidden');
    });
  });

  // Excel Export/Import
  document
    .getElementById('btn-export')
    .addEventListener('click', exportToExcel);
  document
    .getElementById('import-excel')
    .addEventListener('change', importFromExcel);
}

function handleFormSubmit(e) {
  e.preventDefault();

  const id = document.getElementById('item-id').value;
  const type = itemTypeInput.value;
  const name = itemNameInput.value.trim();
  const amount = parseFloat(itemAmountInput.value);

  let itemData = {
    type: type,
    name: name,
    amount: amount,
    paymentMonth: currentMonthIndex,
  };

  if (type === 'service' || type === 'overdue') {
    itemData.consumptionMonth = parseInt(consMonthSelect.value);
    itemData.consumptionMonthEnd = consMonthEndSelect.value
      ? parseInt(consMonthEndSelect.value)
      : null;

    if (consUnitInput.value)
      itemData.consumptionUnit = parseFloat(consUnitInput.value);
    if (nextVisitInput.value)
      itemData.nextMeasurementDate = parseInt(nextVisitInput.value);
    if (internetCloseInput.value)
      itemData.billingCloseDate = parseInt(internetCloseInput.value);
  } else if (type === 'loan') {
    itemData.creditor = document.getElementById('loan-creditor').value.trim();
    itemData.currentInstallment =
      parseInt(document.getElementById('loan-current-installment').value) || 1;
    itemData.totalInstallments =
      parseInt(document.getElementById('loan-total-installments').value) || 1;
    itemData.titular = document.getElementById('loan-titular').value.trim();
  }

  if (id) {
    const index = services.findIndex((s) => s.id === id);
    if (index !== -1) {
      itemData.id = id;
      itemData.isPaid = services[index].isPaid;
      if (services[index].paymentDate)
        itemData.paymentDate = services[index].paymentDate;
      services[index] = itemData;
    }
    document.getElementById('item-id').value = '';
    form.querySelector('button[type="submit"]').textContent = 'Guardar';
  } else {
    itemData.id = Date.now().toString();
    itemData.isPaid = false;
    services.push(itemData);
  }

  saveData(itemData);
  renderApp();
  form.reset();
  itemNameInput.dispatchEvent(new Event('input'));
}

window.editItem = function (id) {
  const item = services.find((s) => s.id === id);
  if (!item) return;

  document.getElementById('item-id').value = item.id;

  const typeBtn = Array.from(tabBtns).find((b) => b.dataset.type === item.type);
  if (typeBtn) typeBtn.click();

  itemNameInput.value = item.name;
  itemAmountInput.value = item.amount;

  if (item.type === 'service' || item.type === 'overdue') {
    consMonthSelect.value = item.consumptionMonth;
    consMonthEndSelect.value =
      item.consumptionMonthEnd !== null ? item.consumptionMonthEnd : '';

    itemNameInput.dispatchEvent(new Event('input'));

    if (item.consumptionUnit) consUnitInput.value = item.consumptionUnit;
    if (item.nextMeasurementDate)
      nextVisitInput.value = item.nextMeasurementDate;
    if (item.billingCloseDate) internetCloseInput.value = item.billingCloseDate;
  } else if (item.type === 'loan') {
    document.getElementById('loan-creditor').value = item.creditor || '';
    document.getElementById('loan-current-installment').value =
      item.currentInstallment || 1;
    document.getElementById('loan-total-installments').value =
      item.totalInstallments || 1;
    document.getElementById('loan-titular').value = item.titular || '';
  }

  document
    .querySelector('.form-section')
    .scrollIntoView({ behavior: 'smooth' });
  form.querySelector('button[type="submit"]').textContent = 'Actualizar';
};

window.togglePaid = function (id) {
  const item = services.find((s) => s.id === id);
  if (item && item.type !== 'income') {
    item.isPaid = !item.isPaid;
    if (item.isPaid) {
      item.paymentDate = new Date().toLocaleDateString('es-AR');
    } else {
      delete item.paymentDate;
    }
    saveData(item);
    renderApp();
  }
};

window.deleteItem = function (id) {
  if (confirm('¿Estás seguro de eliminar este registro?')) {
    const itemToDelete = services.find((s) => s.id === id);
    services = services.filter((s) => s.id !== id);
    if (itemToDelete) {
      saveData(itemToDelete, true);
    } else {
      saveData();
    }
    renderApp();
  }
};

window.simulateCancellation = function (id) {
  simulationCart = [{ id: id, simulatedAmount: 0 }];
  simulatedNewItems = [];
  document.getElementById('sim-new-name').value = '';
  document.getElementById('sim-new-amount').value = '';
  updateSimulationView();
  document.getElementById('cancel-simulation-modal').classList.remove('hidden');
};

window.openEmptySimulation = function () {
  simulationCart = [];
  simulatedNewItems = [];
  document.getElementById('sim-new-name').value = '';
  document.getElementById('sim-new-amount').value = '';
  updateSimulationView();
  document.getElementById('cancel-simulation-modal').classList.remove('hidden');
};

window.addServiceToSimulation = function () {
  const select = document.getElementById('sim-add-select');
  const id = select.value;
  if (id && !simulationCart.some((item) => item.id === id)) {
    simulationCart.push({ id: id, simulatedAmount: 0 });
    updateSimulationView();
  }
};

window.addNewServiceToSimulation = function () {
  const nameInput = document.getElementById('sim-new-name');
  const amountInput = document.getElementById('sim-new-amount');
  const name = nameInput.value.trim();
  const amount = parseFloat(amountInput.value);

  if (name && !isNaN(amount) && amount >= 0) {
    simulatedNewItems.push({
      id: 'temp_' + Date.now(),
      name: name,
      amount: amount,
    });
    nameInput.value = '';
    amountInput.value = '';
    updateSimulationView();
  }
};

window.removeServiceFromSimulation = function (id) {
  simulationCart = simulationCart.filter((item) => item.id !== id);
  if (simulationCart.length === 0 && simulatedNewItems.length === 0) {
    document.getElementById('cancel-simulation-modal').classList.add('hidden');
  } else {
    updateSimulationView();
  }
};

window.removeNewServiceFromSimulation = function (id) {
  simulatedNewItems = simulatedNewItems.filter((item) => item.id !== id);
  if (simulationCart.length === 0 && simulatedNewItems.length === 0) {
    document.getElementById('cancel-simulation-modal').classList.add('hidden');
  } else {
    updateSimulationView();
  }
};

window.updateSimulatedAmount = function (id, value) {
  const cartItem = simulationCart.find((item) => item.id === id);
  if (cartItem) {
    cartItem.simulatedAmount = parseFloat(value) || 0;
    updateSimulationView();
  }
};

// Start application
init();
