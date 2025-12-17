'use client';

import { usePathname } from 'next/navigation';
import { EmbeddedLiaPanel } from '../EmbeddedLiaPanel/EmbeddedLiaPanel';

/**
 * Wrapper condicional para EmbeddedLiaPanel que lo oculta en páginas de lecciones
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
  // No mostrar en el planificador de estudios donde hay un LIA específico
  // No mostrar en la página inicial de business
  // No mostrar en la página de conocer-lia
  const shouldHideAgent = pathname.includes('/learn') || pathname === '/' || pathname.startsWith('/auth') || pathname.startsWith('/study-planner') || pathname === '/business' || pathname.startsWith('/conocer-lia');

  // Si debe ocultarse, no renderizar nada
  if (shouldHideAgent) {
    return null;
  }

  // Renderizar el nuevo componente embebido con diseño de panel derecho
  return (
    <EmbeddedLiaPanel
      assistantName="LIA"
      assistantAvatar="/lia-avatar.png"
    />
  );
}
