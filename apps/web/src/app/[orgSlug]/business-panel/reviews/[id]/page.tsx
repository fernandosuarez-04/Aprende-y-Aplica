
'use client'

import { AdminPendingCourseDetailPage } from '@/features/admin/components/AdminPendingCourseDetailPage'
import { useParams } from 'next/navigation'

interface PageProps {
    params: {
        id: string
        orgSlug: string // Next.js passes parent dynamic params automatically
    }
}

export default function BusinessReviewDetailPage({ params }: PageProps) {
    // params in page component includes parent dynamic segments
    // but to be safe/consistent with client components logic:
    const orgSlug = params.orgSlug
    const successRedirectPath = `/${orgSlug}/business-panel/reviews`

    return <AdminPendingCourseDetailPage courseId={params.id} successRedirectPath={successRedirectPath} />
}
