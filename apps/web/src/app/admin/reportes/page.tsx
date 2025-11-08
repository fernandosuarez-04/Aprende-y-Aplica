import dynamic from 'next/dynamic'
import { AdminLoadingSpinner } from '@/features/admin/components/AdminLoadingSpinner'

// Lazy loading de la página de gestión de reportes
const AdminReportesPage = dynamic(
  () => import('@/features/admin/components/AdminReportesPage').then(mod => ({ default: mod.AdminReportesPage })),
  {
    loading: () => <AdminLoadingSpinner />
  }
)

export default function ReportesPage() {
  return <AdminReportesPage />
}

