import { Metadata } from 'next'
import { AdminWorkshopsPage } from '@/features/admin/components'

export const metadata: Metadata = {
  title: 'Gestión de Talleres | Panel de Administración',
  description: 'Gestiona todos los talleres de la plataforma.',
}

export default function WorkshopsPage() {
  return <AdminWorkshopsPage />
}
