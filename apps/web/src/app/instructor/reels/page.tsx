import dynamic from 'next/dynamic'
import { AdminLoadingSpinner } from '@/features/admin/components/AdminLoadingSpinner'

// Lazy loading de la página de gestión de reels para Instructor
// Reduce bundle inicial ~60-90 KB
const InstructorReelsPage = dynamic(
  () => import('@/features/instructor/components/InstructorReelsPage').then(mod => ({ default: mod.InstructorReelsPage })),
  {
    loading: () => <AdminLoadingSpinner />
  }
)

export default function ReelsPage() {
  return <InstructorReelsPage />
}

