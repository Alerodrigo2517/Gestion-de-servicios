'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import MobileHeader from './layout/MobileHeader';
import Sidebar from './layout/Sidebar';
import Header from './layout/Header';
import HomeView from './views/HomeView';
import AccountsView from './views/AccountsView';

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

export default function Dashboard({
  services,
  onSaveItem,
  onDeleteItem,
  onTogglePaid,
  onImportPrevious,
  onSignOut,
  currentMonthIndex,
  setCurrentMonthIndex,
  editingItem,
  setEditingItem,
  onOpenModal,
  onBulkImport,
  onEdit,
  onGenerateDemoData,
  onDeleteDemoData,
  onChangePassword,
  onShowWelcome,
  isRemembered,
  onForgetDevice,
  onChangePassphraseClick,
  onRememberDevice,
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeView, setActiveView] = useState('inicio');
  const [userName, setUserName] = useState('Alejandro');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) {
        const namePart = session.user.email.split('@')[0];
        setUserName(namePart.charAt(0).toUpperCase() + namePart.slice(1));
      }
    });
  }, []);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row animate-fade-in text-slate-800 bg-[#f8fafc]">
      <MobileHeader 
        userName={userName} 
        setIsMobileMenuOpen={setIsMobileMenuOpen} 
      />

      <Sidebar
        userName={userName}
        activeView={activeView}
        setActiveView={setActiveView}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        services={services}
        currentItems={services.filter((s) => s.paymentMonth === currentMonthIndex)}
        onOpenModal={onOpenModal}
        onGenerateDemoData={onGenerateDemoData}
        onDeleteDemoData={onDeleteDemoData}
        onChangePassword={onChangePassword}
        onChangePassphraseClick={onChangePassphraseClick}
        onShowWelcome={onShowWelcome}
        onSignOut={onSignOut}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          userName={userName}
          services={services}
          currentMonthIndex={currentMonthIndex}
          setCurrentMonthIndex={setCurrentMonthIndex}
          setEditingItem={setEditingItem}
          onBulkImport={onBulkImport}
        />

        <main className="flex-1 p-6 md:p-8 space-y-8 max-w-7xl w-full mx-auto">
          {activeView === 'inicio' && (
            <HomeView
              services={services}
              currentMonthIndex={currentMonthIndex}
              months={months}
              onGenerateDemoData={onGenerateDemoData}
              onDeleteDemoData={onDeleteDemoData}
            />
          )}

          {activeView === 'cuentas' && (
            <AccountsView
              services={services}
              currentMonthIndex={currentMonthIndex}
              months={months}
              onSaveItem={onSaveItem}
              editingItem={editingItem}
              setEditingItem={setEditingItem}
              onImportPrevious={onImportPrevious}
              onEdit={onEdit}
              onDeleteItem={onDeleteItem}
              onTogglePaid={onTogglePaid}
              onOpenModal={onOpenModal}
            />
          )}
        </main>

        <footer className="w-full text-center py-6 text-[10px] text-slate-400 font-semibold border-t border-slate-200/50 mt-12 bg-white flex flex-col sm:flex-row justify-center items-center gap-1">
          <span>ServiTrack v1.3.0</span>
          <span className="hidden sm:inline">|</span>
          <span>
            Creado por{' '}
            <span className="text-slate-600">
              Rodrigo Alejandro Aguirre Tevez
            </span>
          </span>
        </footer>
      </div>
    </div>
  );
}
