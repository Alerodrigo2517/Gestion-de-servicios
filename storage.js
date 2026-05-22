// storage.js
// Manejo de Estado y Persistencia (Capa de Datos)

const STORAGE_KEY = 'household_services_v3';
const INCOME_STORAGE_KEY = 'household_incomes_v1';

// Variables de Estado Globales
let services = [];
let monthlyIncomes = {}; // { 0: 50000, 1: 52000, ... }
let currentMonthIndex = new Date().getMonth(); // Default to current month
let simulationCart = [];
let simulatedNewItems = [];

const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

function loadData() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        services = data ? JSON.parse(data) : [];
        
        const incomeData = localStorage.getItem(INCOME_STORAGE_KEY);
        monthlyIncomes = incomeData ? JSON.parse(incomeData) : {};
    } catch (err) {
        console.error("Error cargando datos de localStorage:", err);
        alert("Atención: Hubo un error al cargar tus datos. El navegador podría estar bloqueando el almacenamiento local.");
        services = [];
        monthlyIncomes = {};
    }
}

function saveData() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(services));
        localStorage.setItem(INCOME_STORAGE_KEY, JSON.stringify(monthlyIncomes));
    } catch (err) {
        console.error("Error guardando datos en localStorage:", err);
        if (err.name === 'QuotaExceededError' || err.code === 22) {
            alert("¡Error de Espacio crítico! Has alcanzado el límite de memoria del navegador (aprox 5MB).");
        } else {
            alert("Error al guardar tus cambios. Asegúrate de que tu navegador permita el almacenamiento local.");
        }
    }
}

// Inicializamos la carga al importar el script
loadData();
