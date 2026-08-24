import { useRef } from 'react';
import { exportToExcel, importFromExcel } from '@/lib/excelHelper';
import logger from '@/lib/logger';
import { useToast } from '@/components/ToastProvider';

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

export default function Header({
  userName,
  services,
  currentMonthIndex,
  setCurrentMonthIndex,
  setEditingItem,
  onBulkImport,
}) {
  const { showToast } = useToast();
  const fileInputRef = useRef(null);

  const getPendingCountForMonth = (monthIdx) => {
    return services.filter(
      (s) => s.paymentMonth === monthIdx && s.type !== 'income' && !s.isPaid
    ).length;
  };

  const handleExportExcel = () => {
    exportToExcel(services);
  };

  const handleImportExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const newItems = await importFromExcel(file, services);
      if (newItems && newItems.length > 0) {
        onBulkImport(newItems);
        showToast({
          type: 'success',
          message: `¡Éxito! Se importaron ${newItems.length} registros nuevos.`
        });
      } else {
        showToast({
          type: 'warning',
          message: 'No se importó nada. Puede que los registros ya existan o el archivo esté vacío.'
        });
      }
    } catch (err) {
      logger.error(err);
      showToast({
        type: 'error',
        message: 'Error al leer el archivo Excel. Verifica el formato.'
      });
    }
    e.target.value = ''; // Reset input
  };

  return (
    <>
      {/* Main Header */}
      <header className="w-full px-6 py-6 bg-white border-b border-slate-200/60 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Hola, {userName}! 👋
          </h2>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">
            Aquí tienes el resumen y control de tus finanzas para este mes.
          </p>
        </div>

        {/* Action buttons (Import, Excel) */}
        <div className="flex items-center gap-2">
          <input
            type="file"
            id="import-excel"
            accept=".xlsx"
            ref={fileInputRef}
            onChange={handleImportExcel}
            className="hidden"
          />

          <button
            className="px-4 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200/80 text-slate-700 rounded-xl flex items-center gap-2 border border-slate-200 transition duration-200 cursor-pointer"
            onClick={() => fileInputRef.current.click()}
            type="button"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            Importar
          </button>

          <button
            className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl flex items-center gap-2 transition duration-200 shadow-sm active:scale-[0.98] cursor-pointer"
            onClick={handleExportExcel}
            type="button"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Excel
          </button>
        </div>
      </header>

      {/* Month Navigation */}
      <nav className="w-full px-6 flex py-3 bg-white border-b border-slate-200/60 sticky top-0 z-20 lg:py-4 lg:bg-slate-50/50 lg:border-b-0 lg:static lg:z-10 justify-center">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none w-full lg:w-auto lg:bg-slate-200/50 lg:border lg:border-slate-200/60 lg:p-1 lg:rounded-2xl lg:shadow-inner lg:shadow-slate-300/30">
          {months.map((month, index) => {
            const isActive = index === currentMonthIndex;
            const pendingCount = getPendingCountForMonth(index);
            const btnClass = isActive
              ? 'px-4 py-2.5 text-center text-xs font-black bg-slate-900 text-white rounded-xl shadow-sm lg:bg-white lg:text-slate-900 lg:shadow-md lg:shadow-slate-200/60 transition-all duration-200'
              : 'px-4 py-2.5 text-center text-xs font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-900 lg:hover:bg-white/40 lg:hover:text-slate-800 rounded-xl transition-all duration-200';

            return (
              <button
                key={month}
                className={`${btnClass} relative shrink-0`}
                onClick={() => {
                  setCurrentMonthIndex(index);
                  setEditingItem(null);
                }}
                type="button"
              >
                {month.substring(0, 3)}
                {pendingCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[8px] font-black text-white shadow-sm shadow-rose-500/35 lg:top-0 lg:right-0 lg:translate-x-1 lg:-translate-y-1">
                    {pendingCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
