import dynamic from 'next/dynamic'
import { AdminLoadingSpinner } from '@/features/admin/components/AdminLoadingSpinner'

// Lazy loading de la página de gestión de noticias
// Reduce bundle inicial ~80-120 KB
const AdminNewsPage = dynamic(
  () => import('@/features/admin/components/AdminNewsPage').then(mod => ({ default: mod.AdminNewsPage })),
  {
    loading: () => <AdminLoadingSpinner />,
    ssr: false
  }
)

export default function NewsPage() {
  return <AdminNewsPage />
}
