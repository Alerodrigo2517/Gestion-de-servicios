import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata = {
  title: 'ServiTrack - Gestión Premium',
  description: 'Gestión y organización de servicios del hogar con insights y gráficos interactivos.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${inter.variable} h-full scroll-smooth`}>
      <body className="bg-slate-950 text-slate-100 min-h-screen relative overflow-x-hidden font-sans antialiased">
        {/* Background Effects */}
        <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-sky-500/10 via-transparent to-transparent pointer-events-none z-[-1]"></div>
        <div className="fixed inset-0 bg-[radial-gradient(circle_at_bottom_right,_var(--tw-gradient-stops))] from-purple-500/10 via-transparent to-transparent pointer-events-none z-[-1]"></div>
        {children}
      </body>
    </html>
  );
}
