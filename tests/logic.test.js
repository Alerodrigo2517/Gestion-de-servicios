import { getSafeDate, getServiceDueDate, getServiceStatus, affectsLiquidity } from '../src/lib/statusHelper';

describe('Pruebas de Calendario y Fechas (statusHelper)', () => {
  describe('getSafeDate - Ajuste de días máximos del mes', () => {
    test('Conserva un día válido normal (15 de Junio)', () => {
      const date = getSafeDate(2026, 5, 15); // Junio = 5
      expect(date.getFullYear()).toBe(2026);
      expect(date.getMonth()).toBe(5);
      expect(date.getDate()).toBe(15);
    });

    test('Año Bisiesto: 29 de Febrero de 2024 es válido', () => {
      const date = getSafeDate(2024, 1, 29); // Febrero = 1
      expect(date.getFullYear()).toBe(2024);
      expect(date.getMonth()).toBe(1);
      expect(date.getDate()).toBe(29);
    });

    test('Año No Bisiesto: 29 de Febrero de 2026 ajusta a 28 de Febrero', () => {
      const date = getSafeDate(2026, 1, 29); // Febrero = 1
      expect(date.getFullYear()).toBe(2026);
      expect(date.getMonth()).toBe(1);
      expect(date.getDate()).toBe(28);
    });

    test('Mes con 30 días: 31 de Abril ajusta a 30 de Abril', () => {
      const date = getSafeDate(2026, 3, 31); // Abril = 3
      expect(date.getFullYear()).toBe(2026);
      expect(date.getMonth()).toBe(3);
      expect(date.getDate()).toBe(30);
    });
  });

  describe('getServiceDueDate - Resolución de dueDate', () => {
    test('Usa el campo dueDate nativo si existe', () => {
      const service = { dueDate: '2026-06-22' };
      const date = getServiceDueDate(service);
      expect(date.getFullYear()).toBe(2026);
      expect(date.getMonth()).toBe(5); // Junio = 5
      expect(date.getDate()).toBe(22);
    });

    test('Crea fecha virtual para registro legacy sin dueDate usando nextMeasurementDate', () => {
      const service = {
        paymentMonth: 5, // Junio = 5
        nextMeasurementDate: 15
      };
      const date = getServiceDueDate(service);
      expect(date.getFullYear()).toBe(new Date().getFullYear());
      expect(date.getMonth()).toBe(5);
      expect(date.getDate()).toBe(15);
    });

    test('Aplica getSafeDate en fecha virtual legacy (Febrero 31 de 2026 -> Febrero 28)', () => {
      const service = {
        paymentMonth: 1, // Febrero = 1
        billingCloseDate: 31
      };
      const date = getServiceDueDate(service);
      expect(date.getMonth()).toBe(1);
      expect(date.getDate()).toBe(28);
    });
  });

  describe('getServiceStatus - Cálculo de estados de vencimiento', () => {
    test('Servicio ya PAGADO retorna estado AL_DIA', () => {
      const service = {
        isPaid: true,
        dueDate: '2026-06-15',
        type: 'service'
      };
      const status = getServiceStatus(service);
      expect(status.status).toBe('AL_DIA');
      expect(status.severity).toBe('none');
      expect(status.badgeText).toBe('Pagado');
    });

    test('Tipo INCOME retorna estado AL_DIA y severidad none', () => {
      const service = {
        isPaid: false,
        type: 'income',
        amount: 5000
      };
      const status = getServiceStatus(service);
      expect(status.status).toBe('AL_DIA');
      expect(status.severity).toBe('none');
    });

    test('Servicio con vencimiento en el pasado retorna VENCIDO con severidad alta', () => {
      const today = new Date();
      const pastDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 5);
      const y = pastDate.getFullYear();
      const m = String(pastDate.getMonth() + 1).padStart(2, '0');
      const d = String(pastDate.getDate()).padStart(2, '0');
      
      const service = {
        isPaid: false,
        type: 'service',
        dueDate: `${y}-${m}-${d}`
      };
      const status = getServiceStatus(service);
      expect(status.status).toBe('VENCIDO');
      expect(status.severity).toBe('high');
      expect(status.daysRemaining).toBe(-5);
    });

    test('Servicio que vence hoy retorna VENCE_HOY con severidad alta', () => {
      const today = new Date();
      const y = today.getFullYear();
      const m = String(today.getMonth() + 1).padStart(2, '0');
      const d = String(today.getDate()).padStart(2, '0');

      const service = {
        isPaid: false,
        type: 'service',
        dueDate: `${y}-${m}-${d}`
      };
      const status = getServiceStatus(service);
      expect(status.status).toBe('VENCE_HOY');
      expect(status.severity).toBe('high');
      expect(status.daysRemaining).toBe(0);
    });

    test('Servicio que vence en 2 días retorna PROXIMO con severidad media', () => {
      const today = new Date();
      const futureDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2);
      const y = futureDate.getFullYear();
      const m = String(futureDate.getMonth() + 1).padStart(2, '0');
      const d = String(futureDate.getDate()).padStart(2, '0');

      const service = {
        isPaid: false,
        type: 'service',
        dueDate: `${y}-${m}-${d}`
      };
      const status = getServiceStatus(service);
      expect(status.status).toBe('PROXIMO');
      expect(status.severity).toBe('medium');
      expect(status.daysRemaining).toBe(2);
    });

    test('Servicio que vence en 10 días retorna PENDIENTE con severidad baja', () => {
      const today = new Date();
      const futureDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 10);
      const y = futureDate.getFullYear();
      const m = String(futureDate.getMonth() + 1).padStart(2, '0');
      const d = String(futureDate.getDate()).padStart(2, '0');

      const service = {
        isPaid: false,
        type: 'service',
        dueDate: `${y}-${m}-${d}`
      };
      const status = getServiceStatus(service);
      expect(status.status).toBe('PENDIENTE');
      expect(status.severity).toBe('low');
      expect(status.daysRemaining).toBe(10);
    });
  });

  describe('affectsLiquidity - Reglas de origen de fondos y cálculo de liquidez', () => {
    test('Si isPaid = true y paymentSource = SELF, afecta la liquidez (retorna true)', () => {
      const service = { isPaid: true, paymentSource: 'SELF', type: 'service' };
      expect(affectsLiquidity(service)).toBe(true);
    });

    test('Si isPaid = true y paymentSource = THIRD_PARTY, NO afecta la liquidez (retorna false)', () => {
      const service = { isPaid: true, paymentSource: 'THIRD_PARTY', type: 'service' };
      expect(affectsLiquidity(service)).toBe(false);
    });

    test('Si isPaid = false y paymentSource = SELF, NO afecta la liquidez (retorna false)', () => {
      const service = { isPaid: false, paymentSource: 'SELF', type: 'service' };
      expect(affectsLiquidity(service)).toBe(false);
    });

    test('Compatibilidad legacy: Si paymentSource no está definido (null/undefined) y isPaid = true, afecta la liquidez (retorna true)', () => {
      const service1 = { isPaid: true, type: 'service' };
      const service2 = { isPaid: true, paymentSource: null, type: 'service' };
      expect(affectsLiquidity(service1)).toBe(true);
      expect(affectsLiquidity(service2)).toBe(true);
    });

    test('Simulación de edición de origen de pago: de SELF a THIRD_PARTY recalcula la afectación', () => {
      let service = { isPaid: true, paymentSource: 'SELF', type: 'service' };
      expect(affectsLiquidity(service)).toBe(true);

      // El usuario edita el origen de fondos a Otra persona (THIRD_PARTY)
      service.paymentSource = 'THIRD_PARTY';
      expect(affectsLiquidity(service)).toBe(false);
    });
  });
});
