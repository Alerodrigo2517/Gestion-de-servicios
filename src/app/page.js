'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import AuthComponent from '@/components/AuthComponent';
import Dashboard from '@/components/Dashboard';
import SimulationModal from '@/components/SimulationModal';
import ChartsModal from '@/components/ChartsModal';
import ResetPasswordView from '@/components/ResetPasswordView';
import ChangePasswordModal from '@/components/ChangePasswordModal';
import logger from '@/lib/logger';

const STORAGE_KEY = 'household_services_v3';

export default function Home() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState([]);
  const [currentMonthIndex, setCurrentMonthIndex] = useState(new Date().getMonth());
  const [editingItem, setEditingItem] = useState(null);
  const [activeModal, setActiveModal] = useState(null); // 'projection' | 'consumption' | 'simulation' | null
  const [isRecovering, setIsRecovering] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  // 1. Authenticate user and setup session listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (session) {
        loadData();
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovering(true);
      }
      if (session) {
        loadData();
      } else {
        setServices([]);
        setEditingItem(null);
        setActiveModal(null);
        setIsRecovering(false);
      }
    });

    if (typeof window !== 'undefined' && window.location.hash && window.location.hash.includes('type=recovery')) {
      setIsRecovering(true);
    }

    return () => subscription.unsubscribe();
  }, []);

  // 2. Load data from local cache and remote database
  const loadData = async () => {
    // Optimistic local cache load
    try {
      const cache = localStorage.getItem(STORAGE_KEY);
      if (cache) {
        setServices(JSON.parse(cache));
      }
    } catch (err) {
      logger.error('Error cargando del cache local:', err);
    }

    // Remote database load
    try {
      const { data, error } = await supabase.from('services').select('*');
      if (error) throw error;
      if (data) {
        setServices(data);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      }
    } catch (err) {
      logger.error('Error cargando de Supabase:', err);
    }
  };

  // 3. Save individual item change
  const saveItemToDatabase = async (item, isDelete = false, userId) => {
    try {
      if (isDelete) {
        const { error } = await supabase.from('services').delete().eq('id', item.id);
        if (error) logger.error('Error eliminando item en Supabase:', error);
      } else {
        const itemToSave = { ...item, user_id: userId };
        const { error } = await supabase.from('services').upsert(itemToSave);
        if (error) logger.error('Error guardando item en Supabase:', error);
      }
    } catch (err) {
      logger.error('Error al conectar con Supabase:', err);
    }
  };

  // 4. Save entire state backup locally
  const syncLocalBackup = (newServices) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newServices));
    } catch (err) {
      logger.error('Error guardando datos en cache local:', err);
    }
  };

  const handleSaveItem = (itemData) => {
    if (!session) return;
    const userId = session.user.id;
    let updatedServices = [];

    if (itemData.id) {
      // Edit mode
      updatedServices = services.map((s) => (s.id === itemData.id ? itemData : s));
      setEditingItem(null);
    } else {
      // Create mode
      const newItem = {
        ...itemData,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        isPaid: false,
      };
      updatedServices = [...services, newItem];
    }

    setServices(updatedServices);
    syncLocalBackup(updatedServices);
    saveItemToDatabase(itemData.id ? itemData : updatedServices[updatedServices.length - 1], false, userId);
  };

  const handleDeleteItem = (id) => {
    if (!confirm('¿Estás seguro de eliminar este registro?')) return;
    if (!session) return;

    const itemToDelete = services.find((s) => s.id === id);
    if (!itemToDelete) return;

    const updatedServices = services.filter((s) => s.id !== id);
    setServices(updatedServices);
    syncLocalBackup(updatedServices);
    saveItemToDatabase(itemToDelete, true, session.user.id);

    if (editingItem && editingItem.id === id) {
      setEditingItem(null);
    }
  };

  const handleTogglePaid = (id) => {
    if (!session) return;

    const updatedServices = services.map((item) => {
      if (item.id === id && item.type !== 'income') {
        const nextPaidState = !item.isPaid;
        const updatedItem = {
          ...item,
          isPaid: nextPaidState,
        };
        if (nextPaidState) {
          updatedItem.paymentDate = new Date().toLocaleDateString('es-AR');
        } else {
          delete updatedItem.paymentDate;
        }

        saveItemToDatabase(updatedItem, false, session.user.id);
        return updatedItem;
      }
      return item;
    });

    setServices(updatedServices);
    syncLocalBackup(updatedServices);
  };

  const handleImportPrevious = () => {
    if (currentMonthIndex === 0 || !session) return;

    const prevMonthItems = services.filter((s) => s.paymentMonth === currentMonthIndex - 1);
    const currentNames = services
      .filter((s) => s.paymentMonth === currentMonthIndex)
      .map((s) => s.name.toLowerCase());

    const importableItems = prevMonthItems.filter((s) => !currentNames.includes(s.name.toLowerCase()));

    if (importableItems.length === 0) return;

    const importedItems = importableItems.map((item) => {
      const newItem = {
        ...item,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        paymentMonth: currentMonthIndex,
        isPaid: false,
      };

      delete newItem.paymentDate;

      if (newItem.type === 'service' || newItem.type === 'overdue') {
        if (newItem.consumptionMonth !== undefined && newItem.consumptionMonth !== null) {
          newItem.consumptionMonth = currentMonthIndex;
          newItem.consumptionMonthEnd = null;
        }
        delete newItem.consumptionUnit;
      } else if (newItem.type === 'loan') {
        if ((newItem.currentInstallment || 1) < (newItem.totalInstallments || 1)) {
          newItem.currentInstallment = (newItem.currentInstallment || 1) + 1;
        }
      }
      return newItem;
    });

    const updatedServices = [...services, ...importedItems];
    setServices(updatedServices);
    syncLocalBackup(updatedServices);

    // Save batch to Supabase
    importedItems.forEach((item) => {
      saveItemToDatabase(item, false, session.user.id);
    });
  };

  const handleBulkImport = (newItems) => {
    if (!session) return;
    const updatedServices = [...services, ...newItems];
    setServices(updatedServices);
    syncLocalBackup(updatedServices);

    // Batch save
    newItems.forEach((item) => {
      saveItemToDatabase(item, false, session.user.id);
    });
  };

  const handleGenerateDemoData = async () => {
    if (!session) return;
    const userId = session.user.id;

    const cleanFirst = confirm(
      '¿Deseas vaciar la base de datos antes de cargar los servicios de demo anual?\n\n' +
      'Aceptar: Borrar todo y cargar demo limpia.\n' +
      'Cancelar: Conservar datos actuales y añadir demo.'
    );

    let updatedServices = [];
    if (cleanFirst) {
      try {
        const { error } = await supabase.from('services').delete().eq('user_id', userId);
        if (error) throw error;
        updatedServices = [];
      } catch (err) {
        logger.error('Error al limpiar base de datos:', err);
        alert('Hubo un error al limpiar la base de datos. Intenta nuevamente.');
        return;
      }
    } else {
      updatedServices = [...services];
    }

    const demoServices = [];
    const baseId = Date.now().toString();

    // Luz seasonal pricing (0: Enero to 11: Diciembre)
    const luzPrices = [18000, 17000, 10000, 9000, 11000, 14000, 16000, 15000, 10000, 9000, 9500, 15000];
    const luzKwh    = [350, 330, 200, 180, 220, 280, 320, 300, 200, 180, 190, 300];

    // Gas seasonal pricing
    const gasPrices = [3500, 3500, 4000, 6000, 14000, 22000, 25000, 23000, 12000, 6000, 4500, 3500];
    const gasM3     = [25, 25, 30, 50, 120, 200, 230, 210, 100, 50, 35, 25];

    // Agua seasonal pricing
    const aguaPrices = [6500, 6500, 5000, 4500, 4500, 4500, 4500, 4500, 4500, 4500, 5000, 6500];

    for (let month = 0; month < 12; month++) {
      // 1. Sueldo (Income)
      demoServices.push({
        id: `${baseId}-sueldo-${month}`,
        user_id: userId,
        type: 'income',
        name: 'Sueldo',
        amount: 150000,
        paymentMonth: month,
        isPaid: false,
      });

      // 2. Luz (Service)
      demoServices.push({
        id: `${baseId}-luz-${month}`,
        user_id: userId,
        type: 'service',
        name: 'Luz Edesur',
        amount: luzPrices[month],
        paymentMonth: month,
        isPaid: false,
        consumptionMonth: month,
        consumptionMonthEnd: null,
        consumptionUnit: luzKwh[month],
        nextMeasurementDate: 15,
      });

      // 3. Gas (Service)
      demoServices.push({
        id: `${baseId}-gas-${month}`,
        user_id: userId,
        type: 'service',
        name: 'Gas Metrogas',
        amount: gasPrices[month],
        paymentMonth: month,
        isPaid: false,
        consumptionMonth: month,
        consumptionMonthEnd: null,
        consumptionUnit: gasM3[month],
        nextMeasurementDate: 20,
      });

      // 4. Agua (Service)
      demoServices.push({
        id: `${baseId}-agua-${month}`,
        user_id: userId,
        type: 'service',
        name: 'Agua AySA',
        amount: aguaPrices[month],
        paymentMonth: month,
        isPaid: false,
        consumptionMonth: month,
        consumptionMonthEnd: null,
      });

      // 5. Internet (Service)
      demoServices.push({
        id: `${baseId}-internet-${month}`,
        user_id: userId,
        type: 'service',
        name: 'Internet Fibertel',
        amount: 12000,
        paymentMonth: month,
        isPaid: false,
        consumptionMonth: month,
        consumptionMonthEnd: null,
        billingCloseDate: 22,
      });

      // 6. TV/Cable (Service)
      demoServices.push({
        id: `${baseId}-tv-${month}`,
        user_id: userId,
        type: 'service',
        name: 'Cablevisión Flow',
        amount: 8500,
        paymentMonth: month,
        isPaid: false,
        consumptionMonth: month,
        consumptionMonthEnd: null,
      });
    }

    try {
      const { error } = await supabase.from('services').upsert(demoServices);
      if (error) throw error;

      const finalServices = [...updatedServices, ...demoServices];
      setServices(finalServices);
      syncLocalBackup(finalServices);
      alert('¡Demo cargada exitosamente! Se generaron 6 servicios mensuales (incluyendo ingresos) para todo el año con precios estacionales realistas.');
    } catch (err) {
      logger.error('Error al guardar la demo en Supabase:', err);
      alert('Ocurrió un error al guardar los datos en Supabase.');
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleEditItem = (id) => {
    const item = services.find((s) => s.id === id);
    if (item) {
      setEditingItem(item);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-slate-400">
        Cargando ServiTrack...
      </div>
    );
  }

  if (!session) {
    return <AuthComponent />;
  }

  if (isRecovering) {
    return (
      <ResetPasswordView
        onComplete={() => {
          setIsRecovering(false);
          if (typeof window !== 'undefined') {
            window.location.hash = '';
          }
        }}
      />
    );
  }

  return (
    <>
      <Dashboard
        services={services}
        onSaveItem={handleSaveItem}
        onDeleteItem={handleDeleteItem}
        onTogglePaid={handleTogglePaid}
        onImportPrevious={handleImportPrevious}
        onSignOut={handleSignOut}
        currentMonthIndex={currentMonthIndex}
        setCurrentMonthIndex={setCurrentMonthIndex}
        editingItem={editingItem}
        setEditingItem={setEditingItem}
        onOpenModal={(type) => setActiveModal(type)}
        onBulkImport={handleBulkImport}
        onEdit={handleEditItem}
        onGenerateDemoData={handleGenerateDemoData}
        onChangePassword={() => setIsChangePasswordOpen(true)}
      />

      {/* Simulador de Bajas Modal */}
      <SimulationModal
        isOpen={activeModal === 'simulation'}
        onClose={() => setActiveModal(null)}
        services={services}
        currentMonthIndex={currentMonthIndex}
      />

      {/* Gráficos Modal (Proyección / Consumo) */}
      <ChartsModal
        isOpen={activeModal === 'projection' || activeModal === 'consumption'}
        onClose={() => setActiveModal(null)}
        type={activeModal}
        services={services}
      />

      {/* Modal Cambiar Contraseña */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </>
  );
}
