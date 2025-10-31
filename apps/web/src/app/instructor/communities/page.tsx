import { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { AdminLoadingSpinner } from '@/features/admin/components/AdminLoadingSpinner'

// Lazy loading del componente pesado de administración de comunidades para Instructor
// Esto reduce el bundle inicial en ~100-150 KB
const InstructorCommunitiesPage = dynamic(
  () => import('@/features/instructor/components/InstructorCommunitiesPage').then(mod => ({ default: mod.InstructorCommunitiesPage })),
  {
    loading: () => <AdminLoadingSpinner />
  }
)

export const metadata: Metadata = {
  title: 'Gestión de Comunidades | Panel de Instructor',
  description: 'Gestiona todas las comunidades de la plataforma.',
}

export default function CommunitiesPage() {
  return <InstructorCommunitiesPage />
}

