'use client';

import { usePathname } from 'next/navigation';
import { AIChatAgent } from '../AIChatAgent/AIChatAgent';

/**
 * Wrapper condicional para AIChatAgent que lo oculta en páginas de lecciones
 * donde ya existe una implementación específica de Lia, en la página principal y en auth
 */
export function ConditionalAIChatAgent() {
  const pathname = usePathname();

  // Verificación de pathname (puede ser null durante SSG/prerendering)
  if (!pathname) {
    return null;
  }

  // No mostrar en páginas de lecciones (learn) donde ya existe Lia propia
  // Tampoco mostrar en la página principal (/) ni en auth
  const shouldHideAgent = pathname.includes('/learn') || pathname === '/' || pathname.startsWith('/auth');

  // Si debe ocultarse, no renderizar nada
  if (shouldHideAgent) {
    return null;
  }

  // Renderizar normalmente en el resto de páginas
  return (
    <AIChatAgent
      assistantName="Lia"
      initialMessage="¡Hola! 👋 Soy Lia, tu asistente de IA. Estoy aquí para ayudarte con cualquier pregunta que tengas."
    />
  );
}
