import dynamic from 'next/dynamic'
import { AdminLoadingSpinner } from '@/features/admin/components/AdminLoadingSpinner'

// Lazy loading de la página de gestión de prompts
// Reduce bundle inicial ~70-100 KB
const AdminPromptsPage = dynamic(
  () => import('@/features/admin/components/AdminPromptsPage').then(mod => ({ default: mod.AdminPromptsPage })),
  {
    loading: () => <AdminLoadingSpinner />,
    ssr: false
  }
)

export default function PromptsPage() {
  return <AdminPromptsPage />
}