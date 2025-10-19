import type { Metadata } from 'next';
import { Inter, Montserrat } from 'next/font/google';
import './globals.css';
import { Navbar } from '../core/components/Navbar';
import { ThemeProvider } from '../core/components/ThemeProvider';

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
  title: 'Aprende y Aplica - Chat-Bot-LIA',
  description: 'Plataforma educativa de inteligencia artificial con asistente virtual LIA. Capacitación, comunidad y adopción de IA en el entorno laboral.',
  keywords: ['educación', 'inteligencia artificial', 'chatbot', 'capacitación', 'IA', 'LIA'],
  authors: [{ name: 'Equipo Aprende y Aplica' }],
  viewport: 'width=device-width, initial-scale=1',
  robots: 'index, follow',
  openGraph: {
    title: 'Aprende y Aplica - Chat-Bot-LIA',
    description: 'Plataforma educativa de inteligencia artificial con asistente virtual LIA',
    type: 'website',
    locale: 'es_ES',
  },
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
          <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg-dark)' }}>
            <Navbar />
            <main className="pt-16 lg:pt-20">
              {children}
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
