import type { Metadata } from 'next';
import { Inter, Montserrat } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '../core/components/ThemeProvider';
import { ConditionalNavbar } from '../core/components/ConditionalNavbar';
import { PrefetchManager } from '../core/components/PrefetchManager';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  weight: ['400', '500', '700', '800'],
});

export const metadata: Metadata = {
  title: 'Aprende y Aplica',
  description: 'Plataforma educativa de inteligencia artificial con asistente virtual LIA. Capacitación, comunidad y adopción de IA en el entorno laboral.',
  keywords: ['educación', 'inteligencia artificial', 'chatbot', 'capacitación', 'IA', 'LIA'],
  authors: [{ name: 'Equipo Aprende y Aplica' }],
  robots: 'index, follow',
  icons: {
    icon: '/icono.ico',
  },
  openGraph: {
    title: 'Aprende y Aplica',
    description: 'Plataforma educativa de inteligencia artificial con asistente virtual LIA',
    type: 'website',
    locale: 'es_ES',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${inter.variable} ${montserrat.variable}`}>
      <body className={`${inter.className} antialiased`} style={{ backgroundColor: 'var(--color-bg-dark)', color: 'var(--color-contrast)' }}>
        <ThemeProvider>
          <PrefetchManager />
          <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg-dark)' }}>
            <ConditionalNavbar>
              {children}
            </ConditionalNavbar>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
