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
import { getSafeDate, formatDateToString } from '@/lib/statusHelper';

export default function Home() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState([]);
  const [currentMonthIndex, setCurrentMonthIndex] = useState(
    new Date().getMonth()
  );
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
        loadData(session);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovering(true);
      }
      if (session) {
        loadData(session);
      } else {
        setServices([]);
        setEditingItem(null);
        setActiveModal(null);
        setIsRecovering(false);
      }
    });

    if (
      typeof window !== 'undefined' &&
      window.location.hash &&
      window.location.hash.includes('type=recovery')
    ) {
      setIsRecovering(true);
    }

    return () => subscription.unsubscribe();
  }, []);

  // 2. Load data from remote database (No client cache for financial data)
  const loadData = async (activeSession) => {
    const userSession = activeSession || session;
    if (!userSession) return;

    try {
      const { data, error } = await supabase.from('services').select('*');
      if (error) throw error;
      if (data) {
        setServices(data);
      }
    } catch (err) {
      logger.error('Error cargando de Supabase:', err);
    }
  };

  const handleSaveItem = async (itemData) => {
    if (!session) return;
    const userId = session.user.id;

    if (itemData.id) {
      // Edit mode
      const updatedServices = services.map((s) =>
        s.id === itemData.id ? itemData : s
      );
      setServices(updatedServices);
      setEditingItem(null);

      try {
        const itemToSave = { ...itemData, user_id: userId };
        const { error } = await supabase.from('services').upsert(itemToSave);
        if (error) throw error;
      } catch (err) {
        logger.error('Error al actualizar item en Supabase:', err);
        alert(
          'Hubo un error al guardar el registro en el servidor. Los cambios locales podrían perderse.'
        );
      }
    } else {
      // Create mode (PostgreSQL generates UUID)
      if (services.length >= 1000) {
        alert(
          'Has alcanzado el límite de almacenamiento de 1000 registros para evitar sobrecarga en el servidor. Por favor, elimina algunos registros existentes antes de agregar nuevos.'
        );
        return;
      }

      try {
        const itemToSave = { ...itemData, user_id: userId };
        delete itemToSave.id;

        const { data, error } = await supabase
          .from('services')
          .insert(itemToSave)
          .select()
          .single();

        if (error) throw error;
        if (data) {
          setServices((prev) => [...prev, data]);
        }
      } catch (err) {
        logger.error('Error al insertar item en Supabase:', err);
        const msg = err.message || '';
        if (msg.includes('Límite de almacenamiento') || msg.includes('limit')) {
          alert(
            'Error: Se ha excedido el límite de almacenamiento de 1000 registros en el servidor.'
          );
        } else {
          alert('Hubo un error al guardar el registro en el servidor.');
        }
      }
    }
  };

  const handleDeleteItem = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este registro?')) return;
    if (!session) return;

    const itemToDelete = services.find((s) => s.id === id);
    if (!itemToDelete) return;

    const updatedServices = services.filter((s) => s.id !== id);
    setServices(updatedServices);

    if (editingItem && editingItem.id === id) {
      setEditingItem(null);
    }

    try {
      const { error } = await supabase.from('services').delete().eq('id', id);
      if (error) throw error;
    } catch (err) {
      logger.error('Error eliminando item en Supabase:', err);
      alert(
        'Hubo un error al eliminar el registro en el servidor. Los cambios locales podrían perderse.'
      );
    }
  };

  const handleTogglePaid = async (id) => {
    if (!session) return;

    let itemToUpdate = null;
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
        itemToUpdate = updatedItem;
        return updatedItem;
      }
      return item;
    });

    if (!itemToUpdate) return;

    setServices(updatedServices);

    try {
      const { error } = await supabase
        .from('services')
        .upsert({ ...itemToUpdate, user_id: session.user.id });
      if (error) throw error;
    } catch (err) {
      logger.error('Error al actualizar estado de pago:', err);
      alert(
        'Hubo un error al actualizar el pago en el servidor. Los cambios locales podrían perderse.'
      );
    }
  };

  const handleImportPrevious = async () => {
    if (currentMonthIndex === 0 || !session) return;

    const prevMonthItems = services.filter(
      (s) => s.paymentMonth === currentMonthIndex - 1
    );
    const currentNames = services
      .filter((s) => s.paymentMonth === currentMonthIndex)
      .map((s) => s.name.toLowerCase());

    const importableItems = prevMonthItems.filter(
      (s) => !currentNames.includes(s.name.toLowerCase())
    );

    if (importableItems.length === 0) return;

    const importedItems = importableItems.map((item) => {
      const newItem = {
        ...item,
        paymentMonth: currentMonthIndex,
        isPaid: false,
      };

      delete newItem.id;
      delete newItem.created_at;
      delete newItem.paymentDate;

      if (newItem.type === 'service' || newItem.type === 'overdue') {
        if (
          newItem.consumptionMonth !== undefined &&
          newItem.consumptionMonth !== null
        ) {
          newItem.consumptionMonth = currentMonthIndex;
          newItem.consumptionMonthEnd = null;
        }
        delete newItem.consumptionUnit;

        // Handle dueDate import/generation
        if (newItem.dueDate) {
          const [oldYear, , dayStr] = newItem.dueDate.split('-');
          let destYear = parseInt(oldYear);
          if (currentMonthIndex === 0 && item.paymentMonth === 11) {
            destYear += 1;
          }
          const safeDateObj = getSafeDate(
            destYear,
            currentMonthIndex,
            parseInt(dayStr)
          );
          newItem.dueDate = formatDateToString(safeDateObj);
        } else {
          // Legacy items: construct a safe dueDate for this month using legacy day columns
          const day = newItem.nextMeasurementDate || newItem.billingCloseDate;
          if (day) {
            const destYear = new Date().getFullYear();
            const safeDateObj = getSafeDate(destYear, currentMonthIndex, day);
            newItem.dueDate = formatDateToString(safeDateObj);
          }
        }
      } else if (newItem.type === 'loan') {
        if (
          (newItem.currentInstallment || 1) < (newItem.totalInstallments || 1)
        ) {
          newItem.currentInstallment = (newItem.currentInstallment || 1) + 1;
        }
      }
      return newItem;
    });

    const itemsToInsert = importedItems.map((item) => ({
      ...item,
      user_id: session.user.id,
    }));

    if (services.length + itemsToInsert.length > 1000) {
      alert(
        `No se pueden importar los registros. Esta operación superaría el límite de almacenamiento de 1000 registros (tienes ${services.length} y deseas importar ${itemsToInsert.length}).`
      );
      return;
    }

    try {
      const { data, error } = await supabase
        .from('services')
        .insert(itemsToInsert)
        .select();

      if (error) throw error;
      if (data) {
        setServices((prev) => [...prev, ...data]);
      }
    } catch (err) {
      logger.error('Error al importar servicios del mes anterior:', err);
      const msg = err.message || '';
      if (msg.includes('Límite de almacenamiento') || msg.includes('limit')) {
        alert(
          'Error: No se pudo importar. Se ha excedido el límite de almacenamiento de 1000 registros en el servidor.'
        );
      } else {
        alert(
          'Hubo un error al guardar los servicios importados en el servidor.'
        );
      }
    }
  };

  const handleBulkImport = async (newItems) => {
    if (!session) return;
    const userId = session.user.id;

    const itemsToInsert = newItems.map((item) => {
      const itemCopy = { ...item, user_id: userId };
      delete itemCopy.id;
      delete itemCopy.created_at;
      return itemCopy;
    });

    if (services.length + itemsToInsert.length > 1000) {
      alert(
        `No se puede realizar la importación masiva. Superaría el límite de almacenamiento de 1000 registros (tienes ${services.length} y deseas importar ${itemsToInsert.length}).`
      );
      return;
    }

    try {
      const { data, error } = await supabase
        .from('services')
        .insert(itemsToInsert)
        .select();

      if (error) throw error;
      if (data) {
        setServices((prev) => [...prev, ...data]);
      }
    } catch (err) {
      logger.error('Error al importar registros en Supabase:', err);
      const msg = err.message || '';
      if (msg.includes('Límite de almacenamiento') || msg.includes('limit')) {
        alert(
          'Error: No se pudo importar. Se ha excedido el límite de almacenamiento de 1000 registros en el servidor.'
        );
      } else {
        alert(
          'Hubo un error al guardar los registros importados en el servidor.'
        );
      }
    }
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
        const { error } = await supabase
          .from('services')
          .delete()
          .eq('user_id', userId);
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

    // Luz seasonal pricing (0: Enero to 11: Diciembre)
    const luzPrices = [
      18000, 17000, 10000, 9000, 11000, 14000, 16000, 15000, 10000, 9000, 9500,
      15000,
    ];
    const luzKwh = [350, 330, 200, 180, 220, 280, 320, 300, 200, 180, 190, 300];

    // Gas seasonal pricing
    const gasPrices = [
      3500, 3500, 4000, 6000, 14000, 22000, 25000, 23000, 12000, 6000, 4500,
      3500,
    ];
    const gasM3 = [25, 25, 30, 50, 120, 200, 230, 210, 100, 50, 35, 25];

    // Agua seasonal pricing
    const aguaPrices = [
      6500, 6500, 5000, 4500, 4500, 4500, 4500, 4500, 4500, 4500, 5000, 6500,
    ];

    for (let month = 0; month < 12; month++) {
      // 1. Sueldo (Income)
      demoServices.push({
        user_id: userId,
        type: 'income',
        name: 'Sueldo',
        amount: 150000,
        paymentMonth: month,
        isPaid: false,
      });

      // 2. Luz (Service)
      demoServices.push({
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

    const targetCount =
      (cleanFirst ? 0 : services.length) + demoServices.length;
    if (targetCount > 1000) {
      alert(
        `No se pueden generar los datos de demostración. Esta operación superaría el límite de almacenamiento de 1000 registros.`
      );
      return;
    }

    try {
      const { data, error } = await supabase
        .from('services')
        .insert(demoServices)
        .select();
      if (error) throw error;

      if (data) {
        const finalServices = [...updatedServices, ...data];
        setServices(finalServices);
        alert(
          '¡Demo cargada exitosamente! Se generaron 6 servicios mensuales (incluyendo ingresos) para todo el año con precios estacionales realistas.'
        );
      }
    } catch (err) {
      logger.error('Error al guardar la demo en Supabase:', err);
      const msg = err.message || '';
      if (msg.includes('Límite de almacenamiento') || msg.includes('limit')) {
        alert(
          'Error: Se ha excedido el límite de almacenamiento de 1000 registros en el servidor.'
        );
      } else {
        alert('Ocurrió un error al guardar los datos en Supabase.');
      }
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
