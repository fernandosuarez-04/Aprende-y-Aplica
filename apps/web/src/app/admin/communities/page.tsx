import { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { AdminLoadingSpinner } from '@/features/admin/components/AdminLoadingSpinner'

// Lazy loading del componente pesado de administración de comunidades
// Esto reduce el bundle inicial en ~100-150 KB
const AdminCommunitiesPage = dynamic(
  () => import('@/features/admin/components').then(mod => ({ default: mod.AdminCommunitiesPage })),
  {
    loading: () => <AdminLoadingSpinner />,
    ssr: false // Las páginas de admin no necesitan SSR
  }
)

export const metadata: Metadata = {
  title: 'Gestión de Comunidades | Panel de Administración',
  description: 'Gestiona todas las comunidades de la plataforma.',
}

export default function CommunitiesPage() {
  return <AdminCommunitiesPage />
}
