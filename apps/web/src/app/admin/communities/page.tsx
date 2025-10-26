import { Metadata } from 'next'
import { AdminCommunitiesPage } from '@/features/admin/components'

export const metadata: Metadata = {
  title: 'Gestión de Comunidades | Panel de Administración',
  description: 'Gestiona todas las comunidades de la plataforma.',
}

export default function CommunitiesPage() {
  return <AdminCommunitiesPage />
}
