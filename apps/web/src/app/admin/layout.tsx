import { Metadata } from 'next'
import { AdminLayout } from '@/features/admin/components'

export const metadata: Metadata = {
  title: 'Panel de Administración | Aprende y Aplica',
  description: 'Panel de administración para gestionar la plataforma.',
}

export default function AdminLayoutPage({
  children,
}: {
  children: React.ReactNode
}) {
  return <AdminLayout>{children}</AdminLayout>
}
