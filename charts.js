// charts.js
// Manejo de Gráficos (Chart.js)

let projectionChartInstance = null;
let consumptionChartInstance = null;

function renderProjectionChart() {
    const ctx = document.getElementById('projectionChart').getContext('2d');
    if (projectionChartInstance) projectionChartInstance.destroy();

    const datasets = [];
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];
    let colorIndex = 0;

    // Agrupar items activos por nombre
    const itemNames = [...new Set(services.filter(s => !s.isPaid).map(s => s.name))];

    itemNames.forEach(name => {
        const data = months.map((_, mIndex) => {
            const itemsInMonth = services.filter(s => s.paymentMonth === mIndex && s.name === name && !s.isPaid);
            return itemsInMonth.reduce((sum, item) => sum + item.amount, 0);
        });

        if (data.some(val => val > 0)) {
            datasets.push({
                label: escapeHTML(name),
                data: data,
                backgroundColor: colors[colorIndex % colors.length]
            });
            colorIndex++;
        }
    });

    projectionChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: months.map(m => m.substring(0,3)),
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { stacked: true },
                y: { stacked: true }
            },
            plugins: {
                legend: { labels: { color: '#f8fafc' } }
            }
        }
    });
}

function renderConsumptionChart() {
    const ctx = document.getElementById('consumptionChart').getContext('2d');
    if (consumptionChartInstance) consumptionChartInstance.destroy();

    // Filtra servicios que tengan unidad de consumo
    const physicalServices = services.filter(s => s.consumptionUnit !== undefined && s.consumptionUnit !== null);
    
    const serviceNames = [...new Set(physicalServices.map(s => s.name))];
    const datasets = [];
    const colors = ['#f59e0b', '#38bdf8', '#ef4444']; 

    serviceNames.forEach((name, index) => {
        const data = months.map((_, mIndex) => {
            const item = physicalServices.find(s => s.paymentMonth === mIndex && s.name === name);
            return item ? item.consumptionUnit : null;
        });

        if (data.some(val => val !== null)) {
            datasets.push({
                label: `${escapeHTML(name)} (Consumo Físico)`,
                data: data,
                borderColor: colors[index % colors.length],
                backgroundColor: colors[index % colors.length],
                tension: 0.3,
                spanGaps: true
            });
        }
    });

    consumptionChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: months.map(m => m.substring(0,3)),
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: '#f8fafc' } }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255,255,255,0.1)' },
                    ticks: { color: '#94a3b8' }
                },
                x: {
                    grid: { color: 'rgba(255,255,255,0.1)' },
                    ticks: { color: '#94a3b8' }
                }
            }
        }
    });
}
