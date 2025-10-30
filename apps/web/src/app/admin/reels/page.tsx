import dynamic from 'next/dynamic'
import { AdminLoadingSpinner } from '@/features/admin/components/AdminLoadingSpinner'

// Lazy loading de la página de gestión de reels
// Reduce bundle inicial ~60-90 KB
const AdminReelsPage = dynamic(
  () => import('@/features/admin/components/AdminReelsPage').then(mod => ({ default: mod.AdminReelsPage })),
  {
    loading: () => <AdminLoadingSpinner />,
    ssr: false
  }
)

export default function ReelsPage() {
  return <AdminReelsPage />
}
