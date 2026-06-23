import { Inter } from 'next/font/google';
import { ToastProvider } from '@/components/ToastProvider';
import { ConfirmProvider } from '@/components/ConfirmProvider';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata = {
  title: 'ServiTrack - Gestión de Servicios',
  description:
    'Gestión y organización de servicios del hogar con insights y gráficos interactivos.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${inter.variable} h-full scroll-smooth`}>
      <body className="bg-slate-50 text-slate-900 min-h-screen relative overflow-x-hidden font-sans antialiased">
        <ToastProvider>
          <ConfirmProvider>
            {/* Background Effects */}
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-slate-200/50 via-transparent to-transparent pointer-events-none z-[-1]"></div>
            {children}
          </ConfirmProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
