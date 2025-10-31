import { Metadata } from 'next'
import { InstructorDashboard } from '@/features/instructor/components'

export const metadata: Metadata = {
  title: 'Dashboard Instructor | Aprende y Aplica',
  description: 'Dashboard del panel de instructor con estadísticas y acciones rápidas.',
}

export default function InstructorDashboardPage() {
  return <InstructorDashboard />
}

