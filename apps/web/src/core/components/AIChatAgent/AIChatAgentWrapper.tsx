'use client'

import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'

/**
 * Client Component wrapper para lazy loading de AIChatAgent
 * Necesario porque `ssr: false` solo está permitido en Client Components
 */
const AIChatAgent = dynamic(
  () => import('./AIChatAgent').then(mod => ({ default: mod.AIChatAgent })),
  {
    ssr: false,
    loading: () => null,
  }
)

export function AIChatAgentWrapper() {
  const pathname = usePathname()
  
  // No mostrar AIChatAgent en la página de aprendizaje de cursos
  // porque ya hay un panel de LIA integrado en el lado derecho
  if (pathname?.includes('/courses/') && pathname?.includes('/learn')) {
    return null
  }
  
  return (
    <AIChatAgent
      assistantName="Lia"
      initialMessage="¡Hola! 👋 Soy Lia, tu asistente de IA. Estoy aquí para ayudarte con cualquier pregunta que tengas."
    />
  )
}
