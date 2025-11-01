import { Metadata } from 'next'
import { BusinessPanelLayout } from '@/features/business-panel/components/BusinessPanelLayout'

export const metadata: Metadata = {
  title: 'Panel de Gestión Business | Aprende y Aplica',
  description: 'Panel de gestión empresarial para administrar tu organización.',
}

export default function BusinessPanelLayoutPage({
  children,
}: {
  children: React.ReactNode
}) {
  return <BusinessPanelLayout>{children}</BusinessPanelLayout>
}

