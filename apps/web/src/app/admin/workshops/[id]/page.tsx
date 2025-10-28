import { Metadata } from 'next'
import { CourseManagementPage } from '@/features/admin/components/CourseManagementPage'

export const metadata: Metadata = {
  title: 'Gestión de Curso | Panel de Administración',
  description: 'Gestiona módulos, lecciones, materiales y actividades del curso.',
}

export default async function WorkshopDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <CourseManagementPage courseId={id} />
}

