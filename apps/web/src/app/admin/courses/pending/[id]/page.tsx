
import { AdminPendingCourseDetailPage } from '@/features/admin/components/AdminPendingCourseDetailPage'

interface PageProps {
    params: {
        id: string
    }
}

export default function Page({ params }: PageProps) {
    return <AdminPendingCourseDetailPage courseId={params.id} />
}
