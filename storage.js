// Configuración de Supabase
const SUPABASE_URL = 'https://akhkkrtciiatyzvdrpji.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Q7GGBQO6XHmAXN9LZbTx7Q_b3axHkXN';

const STORAGE_KEY = 'household_services_v3';
const INCOME_STORAGE_KEY = 'household_incomes_v1';

let supabaseClient = null;
if (typeof supabase !== 'undefined' && supabase.createClient) {
  supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else if (typeof Supabase !== 'undefined' && Supabase.createClient) {
  supabaseClient = Supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Variables de Estado Globales
let services = [];
let monthlyIncomes = {}; // { 0: 50000, 1: 52000, ... }
let currentMonthIndex = new Date().getMonth(); // Default to current month
let simulationCart = [];
let simulatedNewItems = [];

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

// Carga inicial (desde LocalStorage de respaldo y luego Supabase)
async function loadData() {
  // Carga rápida local (optimista)
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    services = data ? JSON.parse(data) : [];

    const incomeData = localStorage.getItem(INCOME_STORAGE_KEY);
    monthlyIncomes = incomeData ? JSON.parse(incomeData) : {};
  } catch (err) {
    console.error('Error cargando de localStorage:', err);
  }

  if (!supabaseClient || SUPABASE_URL === 'YOUR_SUPABASE_URL') {
    console.warn('Supabase no configurado o no cargado. Usando localStorage.');
    return;
  }

  try {
    const {
      data: { session },
    } = await supabaseClient.auth.getSession();
    if (!session) {
      console.log('No hay sesión activa de Supabase. Limpiando datos locales.');
      services = [];
      return;
    }

    const { data, error } = await supabaseClient.from('services').select('*');

    if (error) {
      console.error('Error al obtener datos de Supabase:', error);
    } else if (data) {
      services = data;
      // Guardamos localmente para respaldo
      localStorage.setItem(STORAGE_KEY, JSON.stringify(services));
      if (typeof renderApp === 'function') {
        renderApp();
      }
    }
  } catch (err) {
    console.error('Error de conexión con Supabase:', err);
  }
}

// Sincronizar datos
async function saveData(item = null, isDelete = false) {
  // Respaldo local rápido
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(services));
    localStorage.setItem(INCOME_STORAGE_KEY, JSON.stringify(monthlyIncomes));
  } catch (err) {
    console.error('Error guardando datos en localStorage:', err);
  }

  if (!supabaseClient || SUPABASE_URL === 'YOUR_SUPABASE_URL') return;

  try {
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();
    if (!user) {
      console.warn('Intento de guardar sin un usuario autenticado.');
      return;
    }

    if (isDelete && item && item.id) {
      const { error } = await supabaseClient
        .from('services')
        .delete()
        .eq('id', item.id);
      if (error) console.error('Error eliminando item en Supabase:', error);
    } else if (item) {
      item.user_id = user.id; // Asignar el ID del usuario autenticado
      const { error } = await supabaseClient.from('services').upsert(item);
      if (error) console.error('Error guardando item en Supabase:', error);
    } else {
      // Sincronización masiva (añadir user_id a cada servicio)
      const servicesWithUser = services.map((s) => {
        s.user_id = user.id;
        return s;
      });
      const { error } = await supabaseClient
        .from('services')
        .upsert(servicesWithUser);
      if (error)
        console.error('Error en sincronización masiva en Supabase:', error);
    }
  } catch (err) {
    console.error('Error al conectar con Supabase:', err);
  }
}

// Inicializamos la carga al importar el script
loadData();
