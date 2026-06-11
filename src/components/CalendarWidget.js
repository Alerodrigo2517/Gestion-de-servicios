'use client';
import { getServiceDueDate, getServiceStatus } from '@/lib/statusHelper';

const weekDays = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'];

export default function CalendarWidget({
  services,
  currentMonthIndex,
  selectedDay,
  onSelectDay
}) {
  const year = new Date().getFullYear();
  
  // Calculate days and layout of current month
  const daysInMonth = new Date(year, currentMonthIndex + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, currentMonthIndex, 1).getDay(); // 0 = Sunday, 1 = Monday, etc.

  const paddingSlots = Array.from({ length: firstDayOfWeek }, (_, i) => null);
  const daySlots = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const gridSlots = [...paddingSlots, ...daySlots];

  // Group unpaid services by due day
  const unpaidServicesByDay = {};
  
  services.forEach(s => {
    if (s.isPaid || s.type === 'income') return;
    const dueDate = getServiceDueDate(s);
    if (dueDate.getMonth() === currentMonthIndex && dueDate.getFullYear() === year) {
      const day = dueDate.getDate();
      if (!unpaidServicesByDay[day]) {
        unpaidServicesByDay[day] = [];
      }
      unpaidServicesByDay[day].push(s);
    }
  });

  const handleDayClick = (day) => {
    if (selectedDay === day) {
      onSelectDay(null); // Toggle off
    } else {
      onSelectDay(day);
    }
  };

  return (
    <div className="glass-premium rounded-2xl p-5 shadow-2xl relative overflow-hidden transition-all duration-300 hover:border-white/10 w-full animate-slide-up">
      {/* Decorative background glow */}
      <div className="absolute -right-10 -top-10 w-20 h-20 bg-sky-500/5 rounded-full blur-xl pointer-events-none"></div>
      
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xs font-black text-slate-200 tracking-wider uppercase flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-sky-400">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          Mapa de Vencimientos
        </h3>
        {selectedDay !== null && (
          <button
            onClick={() => onSelectDay(null)}
            className="text-[10px] text-sky-400 hover:text-sky-300 font-bold uppercase tracking-wider transition cursor-pointer"
          >
            Limpiar filtro
          </button>
        )}
      </div>

      {/* Week Header */}
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {weekDays.map((d, idx) => (
          <span
            key={idx}
            className={`text-[10px] font-bold tracking-wider uppercase ${
              idx === 0 || idx === 6 ? 'text-rose-400/70' : 'text-slate-500'
            }`}
          >
            {d}
          </span>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1.5 text-center">
        {gridSlots.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} className="h-9"></div>;
          }

          const dayServices = unpaidServicesByDay[day] || [];
          const isSelected = selectedDay === day;
          
          let hasHigh = false;
          let hasMedium = false;
          let hasLow = false;

          dayServices.forEach(s => {
            const status = getServiceStatus(s);
            if (status.severity === 'high') hasHigh = true;
            else if (status.severity === 'medium') hasMedium = true;
            else if (status.severity === 'low') hasLow = true;
          });

          // Day cell class
          let cellClass = "h-9 flex flex-col items-center justify-center rounded-lg text-xs transition-all duration-200 select-none cursor-pointer border ";
          
          if (isSelected) {
            cellClass += "bg-sky-500/20 text-sky-400 border-sky-500/40 font-bold shadow-[0_0_10px_rgba(14,165,233,0.15)]";
          } else {
            cellClass += "text-slate-300 border-transparent hover:bg-white/5 hover:border-white/10";
          }

          return (
            <button
              key={`day-${day}`}
              onClick={() => handleDayClick(day)}
              className={cellClass}
              type="button"
            >
              <span className="font-semibold leading-none">{day}</span>
              <div className="h-3 flex items-center justify-center mt-0.5">
                {dayServices.length > 0 && (
                  <span className={`text-[8px] font-extrabold px-1 rounded-md scale-95 ${
                    hasHigh ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-[0_0_8px_rgba(244,63,94,0.15)] animate-pulse' :
                    hasMedium ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                    'bg-slate-500/20 text-slate-400 border border-white/5'
                  }`}>
                    {dayServices.length}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
