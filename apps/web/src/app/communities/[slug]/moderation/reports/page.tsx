'use client'

import { use } from 'react'
import dynamic from 'next/dynamic'

const ModerationReportsPage = dynamic(
  () => import('@/features/communities/components/ModerationPanel/ModerationReportsPage').then(
    mod => ({ default: mod.ModerationReportsPage })
  ),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-white dark:bg-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando panel de moderación...</p>
        </div>
      </div>
    )
  }
)

export default function ModerationReportsRoute({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = use(params)
  return <ModerationReportsPage communitySlug={slug} />
}

