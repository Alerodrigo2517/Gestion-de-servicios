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
      <header className="w-full px-8 py-8 flex flex-col sm:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter">
            Hola, {userName} 👋
          </h2>
          <p className="text-sm font-semibold text-slate-400 mt-1">
            Aquí tienes el resumen y control de tus finanzas.
          </p>
        </div>

        {/* Action buttons (Import, Excel) - Sleek Ghost Style */}
        <div className="flex items-center gap-3">
          <input
            type="file"
            id="import-excel"
            accept=".xlsx"
            ref={fileInputRef}
            onChange={handleImportExcel}
            className="hidden"
          />

          <button
            className="group px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 bg-transparent hover:bg-slate-100 rounded-xl flex items-center gap-2 transition-all cursor-pointer"
            onClick={() => fileInputRef.current.click()}
            type="button"
            title="Importar Excel"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="transition-transform group-hover:-translate-y-0.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            <span className="hidden sm:inline">Importar</span>
          </button>

          <button
            className="group px-4 py-2.5 text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-xl flex items-center gap-2 transition-all cursor-pointer"
            onClick={handleExportExcel}
            type="button"
            title="Exportar a Excel"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="transition-transform group-hover:translate-y-0.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span className="hidden sm:inline">Exportar</span>
          </button>
        </div>
      </header>

      {/* Month Navigation (Sleek Tabs) */}
      <nav className="w-full px-8 pb-4 sticky top-0 z-20 lg:static bg-[#f8fafc]/80 backdrop-blur-md">
        <div className="flex gap-1 overflow-x-auto scrollbar-none w-full bg-slate-200/50 p-1.5 rounded-2xl">
          {months.map((month, index) => {
            const isActive = index === currentMonthIndex;
            const pendingCount = getPendingCountForMonth(index);
            
            const btnClass = isActive
              ? 'px-5 py-2 text-center text-[11px] font-black bg-white text-slate-800 rounded-xl shadow-sm transition-all duration-300'
              : 'px-5 py-2 text-center text-[11px] font-bold text-slate-500 hover:text-slate-700 hover:bg-white/40 rounded-xl transition-all duration-300';

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
                  <span className={`absolute top-1 right-1 flex h-1.5 w-1.5 rounded-full ${isActive ? 'bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.6)] animate-pulse' : 'bg-rose-400'}`}>
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
