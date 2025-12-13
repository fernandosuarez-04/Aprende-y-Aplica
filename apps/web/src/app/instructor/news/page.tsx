import dynamic from 'next/dynamic'
import { AdminLoadingSpinner } from '@/features/admin/components/AdminLoadingSpinner'

// Lazy loading de la página de gestión de noticias para Instructor
// Reduce bundle inicial ~80-120 KB
const InstructorNewsPage = dynamic(
  () => import('@/features/instructor/components/InstructorNewsPage').then(mod => ({ default: mod.InstructorNewsPage })),
  {
    loading: () => <AdminLoadingSpinner />
  }
)

export default function NewsPage() {
  return <InstructorNewsPage />
}

