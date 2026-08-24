import { useState, useEffect } from 'react';
import ServiceForm from '@/components/ServiceForm';
import ServiceList from '@/components/ServiceList';
import { getServiceDueDate } from '@/lib/statusHelper';

export default function AccountsView({
  services,
  currentMonthIndex,
  months,
  onSaveItem,
  editingItem,
  setEditingItem,
  onImportPrevious,
  onEdit,
  onDeleteItem,
  onTogglePaid,
  onOpenModal,
}) {
  const [selectedDay, setSelectedDay] = useState(null);

  // Reset selected day filter when active month changes
  useEffect(() => {
    setSelectedDay(null);
  }, [currentMonthIndex]);

  const currentItems = services.filter(
    (s) => s.paymentMonth === currentMonthIndex
  );

  // Filter items by type and selected day
  const getFilteredItems = (type) => {
    return currentItems.filter((item) => {
      if (item.type !== type) return false;
      if (selectedDay === null) return true;
      if (type === 'income') return true;
      const dueDateObj = getServiceDueDate(item);
      return (
        dueDateObj.getDate() === selectedDay &&
        dueDateObj.getMonth() === currentMonthIndex
      );
    });
  };

  const getListTitle = (baseTitle, type) => {
    if (selectedDay !== null && type !== 'income') {
      return `${baseTitle} (Vence el día ${selectedDay})`;
    }
    return baseTitle;
  };

  // Check if we show "Import from previous month" button
  let showImportButton = false;
  let previousMonthName = '';
  if (currentMonthIndex > 0) {
    previousMonthName = months[currentMonthIndex - 1];
    const prevMonthItems = services.filter(
      (s) => s.paymentMonth === currentMonthIndex - 1
    );
    if (prevMonthItems.length > 0) {
      const currentNames = services
        .filter((s) => s.paymentMonth === currentMonthIndex)
        .map((s) => s.name.toLowerCase());
      const importableItems = prevMonthItems.filter(
        (s) => !currentNames.includes(s.name.toLowerCase())
      );
      showImportButton = importableItems.length > 0;
    }
  }

  return (
    <div id="services-list-container" className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-8 animate-fade-in pb-10">
      {/* Form card */}
      <div className="space-y-6">
        <ServiceForm
          onSubmit={onSaveItem}
          editingItem={editingItem}
          onCancelEdit={() => setEditingItem(null)}
          currentMonthIndex={currentMonthIndex}
          onImportPrevious={onImportPrevious}
          showImportButton={showImportButton}
          previousMonthName={previousMonthName}
        />
      </div>

      {/* List panels */}
      <section className="space-y-8">
        <ServiceList
          title={getListTitle('Ingresos del Mes', 'income')}
          items={getFilteredItems('income')}
          type="income"
          onEdit={onEdit}
          onDelete={onDeleteItem}
          onTogglePaid={onTogglePaid}
          onSimulate={onOpenModal}
        />

        <ServiceList
          title={getListTitle('Servicios Regulares', 'service')}
          items={getFilteredItems('service')}
          type="service"
          onEdit={onEdit}
          onDelete={onDeleteItem}
          onTogglePaid={onTogglePaid}
          onSimulate={onOpenModal}
        />

        <ServiceList
          title={getListTitle('Préstamos Activos', 'loan')}
          items={getFilteredItems('loan')}
          type="loan"
          onEdit={onEdit}
          onDelete={onDeleteItem}
          onTogglePaid={onTogglePaid}
          onSimulate={onOpenModal}
        />

        <ServiceList
          title={getListTitle('Servicios Atrasados', 'overdue')}
          items={getFilteredItems('overdue')}
          type="overdue"
          onEdit={onEdit}
          onDelete={onDeleteItem}
          onTogglePaid={onTogglePaid}
          onSimulate={onOpenModal}
        />
      </section>
    </div>
  );
}
