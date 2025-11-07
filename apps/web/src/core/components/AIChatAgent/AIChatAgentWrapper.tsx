'use client'

import dynamic from 'next/dynamic'

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
  return (
    <AIChatAgent
      assistantName="Lia"
      initialMessage="¡Hola! 👋 Soy Lia, tu asistente de IA. Estoy aquí para ayudarte con cualquier pregunta que tengas."
    />
  )
}
