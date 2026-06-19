'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import AuthComponent from '@/components/AuthComponent';
import Dashboard from '@/components/Dashboard';
import SimulationModal from '@/components/SimulationModal';
import ChartsModal from '@/components/ChartsModal';
import ResetPasswordView from '@/components/ResetPasswordView';
import ChangePasswordModal from '@/components/ChangePasswordModal';
import logger from '@/lib/logger';
import { getSafeDate, formatDateToString } from '@/lib/statusHelper';
import { useToast } from '@/components/ToastProvider';
import { useConfirm } from '@/components/ConfirmProvider';
import WelcomeModal from '@/components/WelcomeModal';
import EncryptionKeyModal from '@/components/EncryptionKeyModal';
import { deriveKey, encryptData, decryptData } from '@/lib/crypto';

export default function Home() {
  const { showToast } = useToast();
  const { showConfirm } = useConfirm();
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
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(false);

  // Client-Side Encryption States
  const [encryptionKey, setEncryptionKey] = useState(null);
  const [showKeyPrompt, setShowKeyPrompt] = useState(false);

  // 1. Authenticate user and setup session listener (Runs once on mount)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (session) {
        const hasSeenOnboarding = session.user?.user_metadata?.has_seen_onboarding;
        if (!hasSeenOnboarding) {
          setIsWelcomeOpen(true);
        }
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
        const hasSeenOnboarding = session.user?.user_metadata?.has_seen_onboarding;
        if (!hasSeenOnboarding) {
          setIsWelcomeOpen(true);
        }
      } else {
        setServices([]);
        setEditingItem(null);
        setActiveModal(null);
        setIsRecovering(false);
        setEncryptionKey(null);
        setShowKeyPrompt(false);
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

  // 1.1 Trigger key prompt modal when session is active but no key is derived
  useEffect(() => {
    if (session && !encryptionKey && !isRecovering) {
      setShowKeyPrompt(true);
    } else {
      setShowKeyPrompt(false);
    }
  }, [session, encryptionKey, isRecovering]);

  // 1.2 Load data only when session and encryption key are both derived
  useEffect(() => {
    if (session && encryptionKey) {
      loadData(session, encryptionKey);
    }
  }, [session, encryptionKey, loadData]);

  // 2. Load data from remote database (No client cache for financial data)
  const loadData = useCallback(async (activeSession, activeKey) => {
    const userSession = activeSession || session;
    if (!userSession) return;
    const key = activeKey || encryptionKey;
    if (!key) return; // Wait for encryption key derivation

    try {
      const { data, error } = await supabase.from('services').select('*');
      if (error) throw error;
      if (data) {
        // Decrypt services client-side if they are encrypted
        const decryptedData = await Promise.all(
          data.map(async (item) => {
            if (item.encrypted_data) {
              try {
                const decryptedPayload = await decryptData(item.encrypted_data, key);
                return {
                  ...item,
                  ...decryptedPayload,
                };
              } catch (decryptionError) {
                logger.error('Error al desencriptar registro:', decryptionError);
                return {
                  ...item,
                  name: '[Error de Desencriptación]',
                  amount: 0,
                  _decryptionError: true,
                };
              }
            }
            return item; // Legacy unencrypted item
          })
        );
        setServices(decryptedData);
      }
    } catch (err) {
      logger.error('Error cargando de Supabase:', err);
    }
  }, [session, encryptionKey]);

  const handleKeySubmitted = async (passphrase) => {
    if (!session) return;
    const userId = session.user.id;
    try {
      const key = await deriveKey(passphrase, userId);
      setEncryptionKey(key);
      setShowKeyPrompt(false);
      await loadData(session, key);
    } catch (err) {
      logger.error('Error al derivar clave:', err);
      throw err;
    }
  };

  const handleSaveItem = async (itemData) => {
    if (!session) return;
    const userId = session.user.id;

    // Prepare data copy
    const plainItem = { ...itemData };
    let dbItem = { ...itemData, user_id: userId };

    // Encrypt sensitive fields locally if key is configured
    if (encryptionKey) {
      const sensitivePayload = {
        name: plainItem.name,
        amount: parseFloat(plainItem.amount) || 0,
        dueDate: plainItem.dueDate || null,
        consumptionMonth: plainItem.consumptionMonth !== undefined ? plainItem.consumptionMonth : null,
        consumptionMonthEnd: plainItem.consumptionMonthEnd !== undefined ? plainItem.consumptionMonthEnd : null,
        consumptionUnit: plainItem.consumptionUnit !== undefined ? plainItem.consumptionUnit : null,
        nextMeasurementDate: plainItem.nextMeasurementDate || null,
        billingCloseDate: plainItem.billingCloseDate || null,
        creditor: plainItem.creditor || null,
        currentInstallment: plainItem.currentInstallment || null,
        totalInstallments: plainItem.totalInstallments || null,
        titular: plainItem.titular || null,
        paymentDate: plainItem.paymentDate || null,
      };

      try {
        const encryptedString = await encryptData(sensitivePayload, encryptionKey);
        
        dbItem = {
          id: plainItem.id,
          user_id: userId,
          type: plainItem.type,
          paymentMonth: plainItem.paymentMonth,
          isPaid: plainItem.isPaid,
          is_demo: plainItem.is_demo || false,
          paymentSource: plainItem.paymentSource || 'SELF',
          // Mask database text columns
          name: 'Servicio Encriptado',
          amount: 0,
          encrypted_data: encryptedString,
          // Set plain structural fields to defaults/nulls
          dueDate: null,
          consumptionMonth: null,
          consumptionMonthEnd: null,
          consumptionUnit: null,
          nextMeasurementDate: null,
          billingCloseDate: null,
          creditor: null,
          currentInstallment: null,
          totalInstallments: null,
          titular: null,
          paymentDate: null,
        };
      } catch (encryptError) {
        logger.error('Error al encriptar registro:', encryptError);
        showToast({
          type: 'error',
          message: 'Error de encriptación local. No se pudo guardar el registro.'
        });
        return;
      }
    }

    if (itemData.id) {
      // Edit mode
      const updatedServices = services.map((s) =>
        s.id === itemData.id ? itemData : s
      );
      setServices(updatedServices);
      setEditingItem(null);
      showToast({
        type: 'success',
        message: 'Registro actualizado correctamente.'
      });

      try {
        const { error } = await supabase.from('services').upsert(dbItem);
        if (error) throw error;
      } catch (err) {
        logger.error('Error al actualizar item en Supabase:', err);
        showToast({
          type: 'error',
          message: 'Hubo un error al guardar el registro en el servidor. Los cambios locales podrían perderse.'
        });
      }
    } else {
      // Create mode
      if (services.length >= 1000) {
        showToast({
          type: 'warning',
          message: 'Has alcanzado el límite de almacenamiento de 1000 registros. Elimina algunos para agregar nuevos.'
        });
        return;
      }

      try {
        delete dbItem.id;

        const { data, error } = await supabase
          .from('services')
          .insert(dbItem)
          .select()
          .single();

        if (error) throw error;
        if (data) {
          // Keep decrypted version in state, merge database generated ID
          const mergedItem = {
            ...itemData,
            id: data.id,
            created_at: data.created_at,
          };
          setServices((prev) => [...prev, mergedItem]);
          showToast({
            type: 'success',
            message: 'Registro creado correctamente.'
          });
        }
      } catch (err) {
        logger.error('Error al insertar item en Supabase:', err);
        const msg = err.message || '';
        if (msg.includes('Límite de almacenamiento') || msg.includes('limit')) {
          showToast({
            type: 'error',
            message: 'Error: Se ha excedido el límite de almacenamiento de 1000 registros en el servidor.'
          });
        } else {
          showToast({
            type: 'error',
            message: 'Hubo un error al guardar el registro en el servidor.'
          });
        }
      }
    }
  };

  const handleDeleteItem = async (id) => {
    const confirmed = await showConfirm({
      title: 'Eliminar Registro',
      message: '¿Estás seguro de eliminar este registro? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      type: 'danger',
      initialFocus: 'cancel',
      closeOnBackdrop: false
    });
    if (!confirmed) return;
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
      showToast({
        type: 'success',
        message: 'Registro eliminado correctamente.'
      });
    } catch (err) {
      logger.error('Error eliminando item en Supabase:', err);
      showToast({
        type: 'error',
        message: 'Hubo un error al eliminar el registro en el servidor. Los cambios locales podrían perderse.'
      });
    }
  };

  const handleTogglePaid = async (id) => {
    if (!session) return;

    let itemToUpdate = null;
    let decryptedItemCopy = null;
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
        decryptedItemCopy = updatedItem;

        // Basic payload structural update
        itemToUpdate = {
          id: item.id,
          user_id: session.user.id,
          isPaid: nextPaidState,
          paymentSource: item.paymentSource || 'SELF',
        };
        return updatedItem;
      }
      return item;
    });

    if (!itemToUpdate || !decryptedItemCopy) return;

    setServices(updatedServices);

    try {
      const originalDbItem = services.find((s) => s.id === id);
      // Re-encrypt to update paymentDate inside the client-side cipher payload
      if (originalDbItem && encryptionKey) {
        const sensitivePayload = {
          name: decryptedItemCopy.name,
          amount: parseFloat(decryptedItemCopy.amount) || 0,
          dueDate: decryptedItemCopy.dueDate || null,
          consumptionMonth: decryptedItemCopy.consumptionMonth !== undefined ? decryptedItemCopy.consumptionMonth : null,
          consumptionMonthEnd: decryptedItemCopy.consumptionMonthEnd !== undefined ? decryptedItemCopy.consumptionMonthEnd : null,
          consumptionUnit: decryptedItemCopy.consumptionUnit !== undefined ? decryptedItemCopy.consumptionUnit : null,
          nextMeasurementDate: decryptedItemCopy.nextMeasurementDate || null,
          billingCloseDate: decryptedItemCopy.billingCloseDate || null,
          creditor: decryptedItemCopy.creditor || null,
          currentInstallment: decryptedItemCopy.currentInstallment || null,
          totalInstallments: decryptedItemCopy.totalInstallments || null,
          titular: decryptedItemCopy.titular || null,
          paymentDate: decryptedItemCopy.paymentDate || null,
        };
        const encryptedString = await encryptData(sensitivePayload, encryptionKey);
        
        itemToUpdate = {
          ...itemToUpdate,
          name: 'Servicio Encriptado',
          amount: 0,
          encrypted_data: encryptedString,
        };
      } else {
        // Plaintext legacy fallback
        itemToUpdate = {
          ...decryptedItemCopy,
          user_id: session.user.id
        };
      }

      const { error } = await supabase
        .from('services')
        .upsert(itemToUpdate);
      if (error) throw error;
      showToast({
        type: 'success',
        message: decryptedItemCopy.isPaid ? 'Pago registrado correctamente.' : 'Pago cancelado correctamente.'
      });
    } catch (err) {
      logger.error('Error al actualizar estado de pago:', err);
      showToast({
        type: 'error',
        message: 'Hubo un error al actualizar el pago en el servidor. Los cambios locales podrían perderse.'
      });
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

    // Encrypt each imported record locally before insertion
    const encryptedItemsToInsert = await Promise.all(
      importedItems.map(async (plainItem) => {
        const dbItem = {
          user_id: session.user.id,
          type: plainItem.type,
          paymentMonth: plainItem.paymentMonth,
          isPaid: plainItem.isPaid,
          is_demo: plainItem.is_demo || false,
          paymentSource: plainItem.paymentSource || 'SELF',
        };

        if (encryptionKey) {
          const sensitivePayload = {
            name: plainItem.name,
            amount: parseFloat(plainItem.amount) || 0,
            dueDate: plainItem.dueDate || null,
            consumptionMonth: plainItem.consumptionMonth !== undefined ? plainItem.consumptionMonth : null,
            consumptionMonthEnd: plainItem.consumptionMonthEnd !== undefined ? plainItem.consumptionMonthEnd : null,
            consumptionUnit: plainItem.consumptionUnit !== undefined ? plainItem.consumptionUnit : null,
            nextMeasurementDate: plainItem.nextMeasurementDate || null,
            billingCloseDate: plainItem.billingCloseDate || null,
            creditor: plainItem.creditor || null,
            currentInstallment: plainItem.currentInstallment || null,
            totalInstallments: plainItem.totalInstallments || null,
            titular: plainItem.titular || null,
            paymentDate: plainItem.paymentDate || null,
          };
          const encryptedString = await encryptData(sensitivePayload, encryptionKey);

          return {
            ...dbItem,
            name: 'Servicio Encriptado',
            amount: 0,
            encrypted_data: encryptedString,
          };
        } else {
          return {
            ...plainItem,
            user_id: session.user.id,
          };
        }
      })
    );

    if (services.length + encryptedItemsToInsert.length > 1000) {
      showToast({
        type: 'warning',
        message: `No se pueden importar los registros. Superaría el límite de 1000 registros (tienes ${services.length} e intentas importar ${encryptedItemsToInsert.length}).`
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('services')
        .insert(encryptedItemsToInsert)
        .select();

      if (error) throw error;
      if (data) {
        // Map created IDs back to decrypted local items
        const decryptedImported = data.map((dbRow, idx) => {
          return {
            ...importedItems[idx],
            id: dbRow.id,
            created_at: dbRow.created_at,
          };
        });
        setServices((prev) => [...prev, ...decryptedImported]);
        showToast({
          type: 'success',
          message: `¡Éxito! Se importaron ${data.length} registros del mes anterior.`
        });
      }
    } catch (err) {
      logger.error('Error al importar servicios del mes anterior:', err);
      const msg = err.message || '';
      if (msg.includes('Límite de almacenamiento') || msg.includes('limit')) {
        showToast({
          type: 'error',
          message: 'Error: No se pudo importar. Se ha excedido el límite de almacenamiento de 1000 registros en el servidor.'
        });
      } else {
        showToast({
          type: 'error',
          message: 'Hubo un error al guardar los servicios importados en el servidor.'
        });
      }
    }
  };

  const handleBulkImport = async (newItems) => {
    if (!session) return;
    const userId = session.user.id;

    // Encrypt each item in bulk locally
    const encryptedItemsToInsert = await Promise.all(
      newItems.map(async (plainItem) => {
        const dbItem = {
          user_id: userId,
          type: plainItem.type,
          paymentMonth: plainItem.paymentMonth,
          isPaid: plainItem.isPaid,
          is_demo: plainItem.is_demo || false,
          paymentSource: plainItem.paymentSource || 'SELF',
        };

        if (encryptionKey) {
          const sensitivePayload = {
            name: plainItem.name,
            amount: parseFloat(plainItem.amount) || 0,
            dueDate: plainItem.dueDate || null,
            consumptionMonth: plainItem.consumptionMonth !== undefined ? plainItem.consumptionMonth : null,
            consumptionMonthEnd: plainItem.consumptionMonthEnd !== undefined ? plainItem.consumptionMonthEnd : null,
            consumptionUnit: plainItem.consumptionUnit !== undefined ? plainItem.consumptionUnit : null,
            nextMeasurementDate: plainItem.nextMeasurementDate || null,
            billingCloseDate: plainItem.billingCloseDate || null,
            creditor: plainItem.creditor || null,
            currentInstallment: plainItem.currentInstallment || null,
            totalInstallments: plainItem.totalInstallments || null,
            titular: plainItem.titular || null,
            paymentDate: plainItem.paymentDate || null,
          };
          const encryptedString = await encryptData(sensitivePayload, encryptionKey);

          return {
            ...dbItem,
            name: 'Servicio Encriptado',
            amount: 0,
            encrypted_data: encryptedString,
          };
        } else {
          return {
            ...plainItem,
            user_id: userId,
          };
        }
      })
    );

    if (services.length + encryptedItemsToInsert.length > 1000) {
      showToast({
        type: 'warning',
        message: `No se puede realizar la importación masiva. Superaría el límite de 1000 registros (tienes ${services.length} e intentas importar ${encryptedItemsToInsert.length}).`
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('services')
        .insert(encryptedItemsToInsert)
        .select();

      if (error) throw error;
      if (data) {
        const decryptedImported = data.map((dbRow, idx) => {
          return {
            ...newItems[idx],
            id: dbRow.id,
            created_at: dbRow.created_at,
          };
        });
        setServices((prev) => [...prev, ...decryptedImported]);
      }
    } catch (err) {
      logger.error('Error al importar registros en Supabase:', err);
      const msg = err.message || '';
      if (msg.includes('Límite de almacenamiento') || msg.includes('limit')) {
        showToast({
          type: 'error',
          message: 'Error: No se pudo importar. Se ha excedido el límite de almacenamiento de 1000 registros en el servidor.'
        });
      } else {
        showToast({
          type: 'error',
          message: 'Hubo un error al guardar los registros importados en el servidor.'
        });
      }
    }
  };

  const handleGenerateDemoData = async () => {
    if (!session) return;
    const userId = session.user.id;

    const choice = await showConfirm({
      title: 'Cargar Datos Demo',
      message: '¿Deseas vaciar la base de datos antes de cargar los servicios de demo anual?',
      confirmText: 'Vaciar y Cargar',
      alternateText: 'Conservar y Añadir',
      cancelText: 'Cancelar',
      type: 'primary',
      initialFocus: 'alternate',
      closeOnBackdrop: true
    });
    if (choice === false) return;

    const cleanFirst = choice === 'confirm';

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
        showToast({
          type: 'error',
          message: 'Hubo un error al limpiar la base de datos. Intenta nuevamente.'
        });
        return;
      }
    } else {
      updatedServices = [...services];
    }

    const demoServices = [];
    const currentYear = new Date().getFullYear();
    const currentMonthIndex = new Date().getMonth();

    const getVariedAmount = (base) => {
      const variation = 0.95 + Math.random() * 0.1; // ±5%
      return Math.round(base * variation);
    };

    const getDemoPaymentDate = (m, dueDay) => {
      const payDay = Math.max(1, dueDay - Math.floor(Math.random() * 4)); // 0-3 días antes
      return `${String(payDay).padStart(2, '0')}/${String(m + 1).padStart(2, '0')}/${currentYear}`;
    };

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
        type: 'income',
        name: 'Sueldo',
        amount: getVariedAmount(150000),
        paymentMonth: month,
        isPaid: false,
        is_demo: true,
      });

      // Occasional freelance income (every 4 months)
      if (month === 0 || month === 4 || month === 8) {
        demoServices.push({
          type: 'income',
          name: 'Freelance Desarrollo',
          amount: getVariedAmount(35000),
          paymentMonth: month,
          isPaid: false,
          is_demo: true,
        });
      }

      // Aguinaldo in June and December
      if (month === 5 || month === 11) {
        demoServices.push({
          type: 'income',
          name: 'Aguinaldo',
          amount: getVariedAmount(75000),
          paymentMonth: month,
          isPaid: false,
          is_demo: true,
        });
      }

      // 2. Luz (Service - due on 15th)
      const isLuzPaid = month < currentMonthIndex;
      demoServices.push({
        type: 'service',
        name: 'Luz Edesur',
        amount: getVariedAmount(luzPrices[month]),
        paymentMonth: month,
        isPaid: isLuzPaid,
        paymentDate: isLuzPaid ? getDemoPaymentDate(month, 15) : null,
        dueDate: formatDateToString(getSafeDate(currentYear, month, 15)),
        consumptionMonth: month,
        consumptionMonthEnd: null,
        consumptionUnit: luzKwh[month],
        nextMeasurementDate: 15,
        is_demo: true,
      });

      // 3. Gas (Service - due on 20th)
      const isGasPaid = month < currentMonthIndex;
      demoServices.push({
        type: 'service',
        name: 'Gas Metrogas',
        amount: getVariedAmount(gasPrices[month]),
        paymentMonth: month,
        isPaid: isGasPaid,
        paymentDate: isGasPaid ? getDemoPaymentDate(month, 20) : null,
        dueDate: formatDateToString(getSafeDate(currentYear, month, 20)),
        consumptionMonth: month,
        consumptionMonthEnd: null,
        consumptionUnit: gasM3[month],
        nextMeasurementDate: 20,
        is_demo: true,
      });

      // 4. Agua (Service - due on 10th)
      const isAguaPaid = month < currentMonthIndex;
      demoServices.push({
        type: 'service',
        name: 'Agua AySA',
        amount: getVariedAmount(aguaPrices[month]),
        paymentMonth: month,
        isPaid: isAguaPaid,
        paymentDate: isAguaPaid ? getDemoPaymentDate(month, 10) : null,
        dueDate: formatDateToString(getSafeDate(currentYear, month, 10)),
        consumptionMonth: month,
        consumptionMonthEnd: null,
        is_demo: true,
      });

      // 5. Internet (Service - due on 22nd)
      const isInternetPaid = month <= currentMonthIndex;
      demoServices.push({
        type: 'service',
        name: 'Internet Fibertel',
        amount: getVariedAmount(12000),
        paymentMonth: month,
        isPaid: isInternetPaid,
        paymentDate: isInternetPaid ? getDemoPaymentDate(month, 22) : null,
        dueDate: formatDateToString(getSafeDate(currentYear, month, 22)),
        consumptionMonth: month,
        consumptionMonthEnd: null,
        billingCloseDate: 22,
        is_demo: true,
      });

      // 6. TV/Cable (Service - due on 10th)
      const isCablePaid = month <= currentMonthIndex;
      demoServices.push({
        type: 'service',
        name: 'Cablevisión Flow',
        amount: getVariedAmount(8500),
        paymentMonth: month,
        isPaid: isCablePaid,
        paymentDate: isCablePaid ? getDemoPaymentDate(month, 10) : null,
        dueDate: formatDateToString(getSafeDate(currentYear, month, 10)),
        consumptionMonth: month,
        consumptionMonthEnd: null,
        is_demo: true,
      });
    }

    const targetCount =
      (cleanFirst ? 0 : services.length) + demoServices.length;
    if (targetCount > 1000) {
      showToast({
        type: 'warning',
        message: 'No se pueden generar los datos de demostración. Superaría el límite de 1000 registros.'
      });
      return;
    }

    // Encrypt demo payload before saving to DB
    const encryptedDemo = await Promise.all(
      demoServices.map(async (plainItem) => {
        const dbItem = {
          user_id: userId,
          type: plainItem.type,
          paymentMonth: plainItem.paymentMonth,
          isPaid: plainItem.isPaid,
          is_demo: true,
          paymentSource: 'SELF',
        };

        if (encryptionKey) {
          const sensitivePayload = {
            name: plainItem.name,
            amount: parseFloat(plainItem.amount) || 0,
            dueDate: plainItem.dueDate || null,
            consumptionMonth: plainItem.consumptionMonth !== undefined ? plainItem.consumptionMonth : null,
            consumptionMonthEnd: plainItem.consumptionMonthEnd !== undefined ? plainItem.consumptionMonthEnd : null,
            consumptionUnit: plainItem.consumptionUnit !== undefined ? plainItem.consumptionUnit : null,
            nextMeasurementDate: plainItem.nextMeasurementDate || null,
            billingCloseDate: plainItem.billingCloseDate || null,
            creditor: plainItem.creditor || null,
            currentInstallment: plainItem.currentInstallment || null,
            totalInstallments: plainItem.totalInstallments || null,
            titular: plainItem.titular || null,
            paymentDate: plainItem.paymentDate || null,
          };
          const encryptedString = await encryptData(sensitivePayload, encryptionKey);

          return {
            ...dbItem,
            name: 'Servicio Encriptado',
            amount: 0,
            encrypted_data: encryptedString,
          };
        } else {
          return {
            ...plainItem,
            user_id: userId,
          };
        }
      })
    );

    try {
      const { data, error } = await supabase
        .from('services')
        .insert(encryptedDemo)
        .select();
      if (error) throw error;

      if (data) {
        const decryptedDemo = data.map((dbRow, idx) => {
          return {
            ...demoServices[idx],
            id: dbRow.id,
            created_at: dbRow.created_at,
          };
        });
        const finalServices = [...updatedServices, ...decryptedDemo];
        setServices(finalServices);
        showToast({
          type: 'success',
          message: '¡Demo cargada exitosamente! Se generaron servicios e ingresos dinámicos para todo el año con precios realistas.'
        });
      }
    } catch (err) {
      logger.error('Error al guardar la demo en Supabase:', err);
      const msg = err.message || '';
      if (msg.includes('Límite de almacenamiento') || msg.includes('limit')) {
        showToast({
          type: 'error',
          message: 'Error: Se ha excedido el límite de almacenamiento de 1000 registros en el servidor.'
        });
      } else {
        showToast({
          type: 'error',
          message: 'Hubo un error al guardar la demo en la base de datos.'
        });
      }
    }
  };

  const handleDeleteDemoData = async () => {
    if (!session) return;
    const userId = session.user.id;

    const confirmed = await showConfirm({
      title: 'Eliminar Datos Demo',
      message: '¿Estás seguro de que deseas eliminar todos los servicios cargados por la demo anual? Tus registros reales no serán afectados.',
      confirmText: 'Eliminar Demo',
      cancelText: 'Cancelar',
      type: 'danger',
    });
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('user_id', userId)
        .eq('is_demo', true);
      if (error) throw error;

      setServices((prev) => prev.filter((s) => !s.is_demo));
      showToast({
        type: 'success',
        message: '¡Datos demo eliminados correctamente!'
      });
    } catch (err) {
      logger.error('Error al eliminar demo de Supabase:', err);
      showToast({
        type: 'error',
        message: 'Hubo un error al eliminar los datos de demostración.'
      });
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

  const handleCloseWelcome = () => {
    setIsWelcomeOpen(false);
  };

  const handleCompleteOnboarding = async () => {
    setIsWelcomeOpen(false);
    if (!session) return;
    try {
      const { error } = await supabase.auth.updateUser({
        data: { has_seen_onboarding: true },
      });
      if (error) throw error;
      setSession((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          user: {
            ...prev.user,
            user_metadata: {
              ...prev.user.user_metadata,
              has_seen_onboarding: true,
            },
          },
        };
      });
    } catch (err) {
      logger.error('Error actualizando user_metadata:', err);
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
        onDeleteDemoData={handleDeleteDemoData}
        onChangePassword={() => setIsChangePasswordOpen(true)}
        onShowWelcome={() => setIsWelcomeOpen(true)}
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

      {/* Modal de Bienvenida y Privacidad */}
      <WelcomeModal
        isOpen={isWelcomeOpen}
        onClose={handleCloseWelcome}
        onComplete={handleCompleteOnboarding}
      />

      {/* Prompt modal for Master Passphrase */}
      <EncryptionKeyModal
        isOpen={showKeyPrompt}
        onSubmitKey={handleKeySubmitted}
        onSignOut={handleSignOut}
      />
    </>
  );
}
