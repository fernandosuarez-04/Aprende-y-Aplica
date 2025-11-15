import type { Metadata } from 'next';
import { Inter, Montserrat } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '../core/components/ThemeProvider';
import { ConditionalNavbar } from '../core/components/ConditionalNavbar';
import { PrefetchManager } from '../core/components/PrefetchManager';
import { SWRProvider } from '../core/providers/SWRProvider';
import { NotificationProvider } from '../features/notifications/context/NotificationContext';
import { ConditionalAIChatAgent } from '../core/components/ConditionalAIChatAgent/ConditionalAIChatAgent';
import { GlobalRecorderProvider } from '../core/components/GlobalRecorderProvider';
import { I18nProvider } from '../core/providers/I18nProvider';

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
    apple: '/icono.png',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Aprende y Aplica',
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
    <html lang="es" className={`${inter.variable} ${montserrat.variable}`} suppressHydrationWarning>
      <head>
        {/* 🎨 Script para aplicar tema antes del render (evita flash) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var themeStorage = localStorage.getItem('theme-storage');
                  var resolvedTheme = 'dark';
                  
                  if (themeStorage) {
                    try {
                      var parsed = JSON.parse(themeStorage);
                      // Zustand persist guarda como { state: { theme: '...' }, version: 0 }
                      var savedTheme = parsed.state?.theme || parsed.theme || 'system';
                      
                      if (savedTheme === 'system') {
                        // Detectar preferencia del sistema
                        var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                        resolvedTheme = prefersDark ? 'dark' : 'light';
                      } else if (savedTheme === 'dark' || savedTheme === 'light') {
                        resolvedTheme = savedTheme;
                      } else {
                        // Si el tema guardado no es válido, usar sistema
                        var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                        resolvedTheme = prefersDark ? 'dark' : 'light';
                      }
                    } catch (e) {
                      // Si hay error al parsear, usar preferencia del sistema
                      var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                      resolvedTheme = prefersDark ? 'dark' : 'light';
                    }
                  } else {
                    // Si no hay tema guardado, usar preferencia del sistema por defecto
                    var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                    resolvedTheme = prefersDark ? 'dark' : 'light';
                  }
                  
                  // Aplicar el tema al documento
                  var root = document.documentElement;
                  root.classList.remove('light', 'dark');
                  root.classList.add(resolvedTheme);
                  root.style.colorScheme = resolvedTheme;
                } catch (e) {
                  // Fallback a dark si hay algún error
                  var root = document.documentElement;
                  root.classList.add('dark');
                  root.style.colorScheme = 'dark';
                }
              })();
            `,
          }}
        />
        
        {/* 🚀 Resource Hints - Mejora conexión a APIs externas 20-30% */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://odbxqmhbnkfledqcqujl.supabase.co" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://odbxqmhbnkfledqcqujl.supabase.co" />
        
        {/* 📱 PWA Meta Tags */}
        <meta name="application-name" content="Aprende y Aplica" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Aprende y Aplica" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#3b82f6" />
        
        {/* 🎨 Splash Screens iOS */}
        <link rel="apple-touch-startup-image" href="/icon-512x512.png" />
      </head>
      <body className={`${inter.className} antialiased bg-[var(--color-bg-dark)] text-[var(--color-contrast)] transition-colors duration-300`}>
        <GlobalRecorderProvider>
          <SWRProvider>
            <I18nProvider>
              <ThemeProvider>
                <NotificationProvider pollingInterval={60000}>
                  <PrefetchManager />
                  <div className="min-h-screen bg-[var(--color-bg-dark)] transition-colors duration-300">
                    <ConditionalNavbar>
                      {children}
                    </ConditionalNavbar>
                  </div>
                  {/* AI Chat Agent - Lia - Disponible en todas las páginas excepto lessons */}
                  <ConditionalAIChatAgent />
                </NotificationProvider>
              </ThemeProvider>
            </I18nProvider>
          </SWRProvider>
        </GlobalRecorderProvider>
      </body>
    </html>
  );
}
