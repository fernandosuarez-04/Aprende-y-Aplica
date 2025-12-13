import { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { AdminLoadingSpinner } from '@/features/admin/components/AdminLoadingSpinner'

// Lazy loading del componente de detalle de comunidad para Instructor
const InstructorCommunityDetailPage = dynamic(
  () => import('@/features/instructor/components/InstructorCommunityDetailPage').then(mod => ({ default: mod.InstructorCommunityDetailPage })),
  {
    loading: () => <AdminLoadingSpinner />
  }
)

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  
  return {
    title: `Gestión de Comunidad - ${slug} | Panel de Instructor`,
    description: `Administra la comunidad ${slug}: posts, miembros, reacciones y más.`
  }
}

export default async function CommunityDetailPage({ params }: PageProps) {
  const { slug } = await params
  
  return <InstructorCommunityDetailPage slug={slug} />
}

