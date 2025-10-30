import { Metadata } from 'next'
import { InstructorCourseManagementPage } from '@/features/instructor/components/InstructorCourseManagementPage'

export const metadata: Metadata = {
  title: 'Gestión de Curso | Panel de Instructor',
  description: 'Administra módulos, lecciones, materiales y actividades del taller.',
}

export default async function InstructorWorkshopDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <InstructorCourseManagementPage courseId={id} />
}


