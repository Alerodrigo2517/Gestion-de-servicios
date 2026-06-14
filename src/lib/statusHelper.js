/**
 * Utility functions for centralizing service due dates, status calculations,
 * and date boundary handling (e.g. leap years, month-end roll-overs).
 *
 * Created by Rodrigo Alejandro Aguirre Tevez
 */

/**
 * Returns a Date object adjusted to the maximum valid day of that month
 * to prevent calendar roll-over (e.g. Feb 31 -> Feb 28).
 *
 * @param {number} year - Full year (e.g. 2026)
 * @param {number} month - 0-indexed month (0 = January, 11 = December)
 * @param {number} day - Day of month (1-31)
 * @returns {Date}
 */
export function getSafeDate(year, month, day) {
  const lastDay = new Date(year, month + 1, 0).getDate();
  const safeDay = Math.min(day, lastDay);
  return new Date(year, month, safeDay);
}

/**
 * Resolves the due date of a service.
 * Supports legacy records using nextMeasurementDate or billingCloseDate fallbacks.
 *
 * @param {Object} service - The service object from DB
 * @returns {Date}
 */
export function getServiceDueDate(service) {
  if (service.dueDate) {
    const [year, month, day] = service.dueDate.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  // Legacy fallback
  const year = new Date().getFullYear();
  const month =
    service.paymentMonth !== undefined
      ? service.paymentMonth
      : new Date().getMonth();
  const day = service.nextMeasurementDate || service.billingCloseDate || 1;

  return getSafeDate(year, month, day);
}

/**
 * Formats a Date object to YYYY-MM-DD string in local time.
 *
 * @param {Date} date
 * @returns {string} YYYY-MM-DD
 */
export function formatDateToString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Calculates the status of a service based on its payment state and due date.
 *
 * @param {Object} service
 * @returns {Object} { status, daysRemaining, colorClass, badgeText, severity }
 */
export function getServiceStatus(service) {
  if (service.isPaid) {
    return {
      status: 'AL_DIA',
      daysRemaining: null,
      colorClass: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
      badgeText: 'Pagado',
      severity: 'none',
    };
  }

  if (service.type === 'income') {
    return {
      status: 'AL_DIA',
      daysRemaining: null,
      colorClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      badgeText: 'Recibido',
      severity: 'none',
    };
  }

  const dueDateObj = getServiceDueDate(service);

  // Normalize both dates to midnight local time for precise date comparison
  const today = new Date();
  const todayMidnight = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const dueMidnight = new Date(
    dueDateObj.getFullYear(),
    dueDateObj.getMonth(),
    dueDateObj.getDate()
  );

  const diffTime = dueMidnight.getTime() - todayMidnight.getTime();
  const daysRemaining = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (daysRemaining < 0) {
    return {
      status: 'VENCIDO',
      daysRemaining,
      colorClass:
        'text-rose-400 bg-rose-500/10 border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.15)] animate-pulse',
      badgeText: 'Vencido',
      severity: 'high',
    };
  } else if (daysRemaining === 0) {
    return {
      status: 'VENCE_HOY',
      daysRemaining,
      colorClass:
        'text-orange-400 bg-orange-500/10 border-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.15)] animate-pulse',
      badgeText: 'Vence hoy',
      severity: 'high',
    };
  } else if (daysRemaining <= 3) {
    return {
      status: 'PROXIMO',
      daysRemaining,
      colorClass: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      badgeText: `Vence en ${daysRemaining} ${daysRemaining === 1 ? 'día' : 'días'}`,
      severity: 'medium',
    };
  } else {
    return {
      status: 'PENDIENTE',
      daysRemaining,
      colorClass: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
      badgeText: 'Pendiente',
      severity: 'low',
    };
  }
}

/**
 * Determines if a service payment affects the user's cash/liquidity.
 * Under architect MVP rules:
 * - Must be paid (isPaid === true).
 * - Payment source must be SELF or undefined/null (legacy default).
 *
 * @param {Object} service
 * @returns {boolean}
 */
export function affectsLiquidity(service) {
  return (
    service.isPaid === true &&
    (service.paymentSource === 'SELF' || !service.paymentSource)
  );
}
