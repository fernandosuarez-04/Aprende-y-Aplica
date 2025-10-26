import { Metadata } from 'next'
import { AdminCommunityDetailPage } from '@/features/admin/components/AdminCommunityDetailPage'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  
  return {
    title: `Gestión de Comunidad - ${slug} | Panel de Administración`,
    description: `Administra la comunidad ${slug}: posts, miembros, reacciones y más.`
  }
}

export default async function CommunityDetailPage({ params }: PageProps) {
  const { slug } = await params
  
  return <AdminCommunityDetailPage slug={slug} />
}
