
'use client'

import { AdminPendingCoursesPage } from '@/features/admin/components/AdminPendingCoursesPage'
import { useParams } from 'next/navigation'

export default function BusinessReviewsPage() {
    const params = useParams()
    const orgSlug = params?.orgSlug as string
    const basePath = `/${orgSlug}/business-panel/reviews`

    return <AdminPendingCoursesPage basePath={basePath} />
}
