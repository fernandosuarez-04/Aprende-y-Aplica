import dynamic from 'next/dynamic'
import { AdminLoadingSpinner } from '@/features/admin/components/AdminLoadingSpinner'

// Lazy loading de la página de estadísticas de usuarios
// Reduce bundle inicial ~80-110 KB
const AdminUserStatsPage = dynamic(
  () => import('@/features/admin/components/AdminUserStatsPage').then(mod => ({ default: mod.AdminUserStatsPage })),
  {
    loading: () => <AdminLoadingSpinner />,
    ssr: false
  }
)

export default function UserStatsPage() {
  return <AdminUserStatsPage />
}
