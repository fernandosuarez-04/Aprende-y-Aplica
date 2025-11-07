import { Metadata } from 'next'
import { InstructorCourseManagementPage } from '@/features/instructor/components/InstructorCourseManagementPage'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params

  return {
    title: 'Gestión de Curso | Panel de Instructor',
    description: 'Administra módulos, lecciones, materiales y actividades del taller.',
  }
}

export default async function InstructorWorkshopDetailPage({ params }: PageProps) {
  const { id } = await params
  return <InstructorCourseManagementPage courseId={id} />
}


