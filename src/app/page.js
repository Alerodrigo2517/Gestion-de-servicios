'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import AuthComponent from '@/components/AuthComponent';
import Dashboard from '@/components/Dashboard';
import SimulationModal from '@/components/SimulationModal';
import ChartsModal from '@/components/ChartsModal';

const STORAGE_KEY = 'household_services_v3';

export default function Home() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState([]);
  const [currentMonthIndex, setCurrentMonthIndex] = useState(new Date().getMonth());
  const [editingItem, setEditingItem] = useState(null);
  const [activeModal, setActiveModal] = useState(null); // 'projection' | 'consumption' | 'simulation' | null

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
      if (session) {
        loadData();
      } else {
        setServices([]);
        setEditingItem(null);
        setActiveModal(null);
      }
    });

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
      console.error('Error cargando del cache local:', err);
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
      console.error('Error cargando de Supabase:', err);
    }
  };

  // 3. Save individual item change
  const saveItemToDatabase = async (item, isDelete = false, userId) => {
    try {
      if (isDelete) {
        const { error } = await supabase.from('services').delete().eq('id', item.id);
        if (error) console.error('Error eliminando item en Supabase:', error);
      } else {
        const itemToSave = { ...item, user_id: userId };
        const { error } = await supabase.from('services').upsert(itemToSave);
        if (error) console.error('Error guardando item en Supabase:', error);
      }
    } catch (err) {
      console.error('Error al conectar con Supabase:', err);
    }
  };

  // 4. Save entire state backup locally
  const syncLocalBackup = (newServices) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newServices));
    } catch (err) {
      console.error('Error guardando datos en cache local:', err);
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
    </>
  );
}
