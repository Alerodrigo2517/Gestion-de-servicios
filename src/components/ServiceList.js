'use client';
import ServiceCard from './ServiceCard';

export default function ServiceList({ title, items, type, onEdit, onDelete, onTogglePaid, onSimulate }) {
  const filteredItems = items.filter((item) => {
    if (type === 'service') {
      return item.type === 'service' || (item.type !== 'income' && item.type !== 'loan' && item.type !== 'overdue');
    }
    return item.type === type;
  });

  return (
    <div>
      <div className="border-b border-white/10 pb-2 mb-4">
        <h3 className="text-lg font-bold text-white tracking-wide">{title}</h3>
      </div>
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <p className="text-sm text-slate-500 italic py-1">
            {type === 'income' && 'No hay ingresos registrados.'}
            {type === 'service' && 'No hay servicios registrados.'}
            {type === 'loan' && 'No hay préstamos activos.'}
            {type === 'overdue' && 'No hay servicios atrasados.'}
          </p>
        ) : (
          filteredItems.map((item) => (
            <ServiceCard
              key={item.id}
              item={item}
              onEdit={onEdit}
              onDelete={onDelete}
              onTogglePaid={onTogglePaid}
              onSimulate={onSimulate}
            />
          ))
        )}
      </div>
    </div>
  );
}
