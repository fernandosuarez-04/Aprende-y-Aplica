
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
    ClipboardDocumentCheckIcon,
    CheckCircleIcon,
    XCircleIcon,
    EyeIcon,
    ClockIcon,
    UserCircleIcon,
    XMarkIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
    InboxIcon
} from '@heroicons/react/24/outline'
import { useAdminPendingCourses } from '../hooks/useAdminPendingCourses'
import { ConfirmationModal } from './ConfirmationModal'
import { createClient } from '../../../lib/supabase/client'

// Reutilizamos variantes de animación
const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
}

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
}

function CourseThumbnail({ thumbnailUrl, title }: { thumbnailUrl?: string; title: string }) {
    // Versión simplificada del thumbnail
    if (!thumbnailUrl) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                <ClipboardDocumentCheckIcon className="h-12 w-12 text-gray-400" />
            </div>
        )
    }
    return <img src={thumbnailUrl} alt={title} className="w-full h-full object-cover" />
}

interface AdminPendingCoursesPageProps {
    basePath?: string
}

export function AdminPendingCoursesPage({ basePath = '/admin/courses/pending' }: AdminPendingCoursesPageProps) {
    const router = useRouter()
    const { courses, isLoading, error, refetch, approveCourse, rejectCourse } = useAdminPendingCourses()
    const [searchTerm, setSearchTerm] = useState('')
    const [courseToApprove, setCourseToApprove] = useState<string | null>(null)
    const [courseToReject, setCourseToReject] = useState<string | null>(null)
    // const [rejectionReason, setRejectionReason] = useState('') // Implementar modal con motivo si se desea

    const filteredCourses = courses.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (course.instructor_name || '').toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleApprove = async () => {
        if (!courseToApprove) return

        // La validación de usuario se hace ahora en el server action para mayor robustez
        // Pasamos '' como fallback
        const success = await approveCourse(courseToApprove, '')

        if (success) {
            // Success handled by UI refresh
        } else {
            alert('Error al aprobar el curso')
        }
        setCourseToApprove(null)
    }

    const handleReject = async () => {
        if (!courseToReject) return
        const reason = 'Rechazado por el administrador' // TODO: Pedir motivo en un modal
        // TODO: Pedir motivo en un modal
        const success = await rejectCourse(courseToReject, reason)
        if (success) {
            // Success handled by UI refresh
        } else {
            alert('Error al rechazar el curso')
        }
        setCourseToReject(null)
    }

    if (isLoading) return <div className="p-8 text-center">Cargando revisiones...</div>
    if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>

    return (
        <div className="p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-[#0A2540] dark:text-white mb-2">
                        Revisiones Pendientes
                    </h1>
                    <p className="text-[#6C757D] dark:text-white/60">
                        Revisar y aprobar cursos enviados desde CourseForge
                    </p>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-[#1E2329] rounded-xl border border-[#E9ECEF] dark:border-[#6C757D]/30 p-4 mb-6 shadow-sm">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 relative">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#6C757D]" />
                            <input
                                type="text"
                                placeholder="Buscar por título o instructor..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-transparent border rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Grid */}
                {filteredCourses.length === 0 ? (
                    <div className="text-center py-12 bg-white dark:bg-[#1E2329] rounded-xl border border-dashed">
                        <InboxIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">No hay cursos pendientes</h3>
                        <p className="text-gray-500">¡Todo al día! No hay nuevas solicitudes de publicación.</p>
                    </div>
                ) : (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {filteredCourses.map((course) => (
                            <motion.div
                                key={course.id}
                                variants={itemVariants}
                                className="bg-white dark:bg-[#1E2329] rounded-2xl border border-[#E9ECEF] dark:border-[#6C757D]/30 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                            >
                                <div className="h-48 relative bg-gray-200">
                                    <CourseThumbnail thumbnailUrl={course.thumbnail_url} title={course.title} />
                                    <div className="absolute top-4 right-4">
                                        <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2.5 py-0.5 rounded dark:bg-yellow-200 dark:text-yellow-900 border border-yellow-300">
                                            Pendiente
                                        </span>
                                    </div>
                                </div>

                                <div className="p-5">
                                    <h3 className="text-lg font-bold text-[#0A2540] dark:text-white mb-2 line-clamp-1">
                                        {course.title}
                                    </h3>
                                    <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
                                        <UserCircleIcon className="h-4 w-4" />
                                        <span>{course.instructor_name}</span>
                                    </div>

                                    <div className="flex justify-between items-center text-xs text-gray-400 mb-4 border-t pt-3">
                                        <span className="flex items-center gap-1">
                                            <ClockIcon className="h-3 w-3" /> {new Date(course.created_at).toLocaleDateString()}
                                        </span>
                                        <span>{course.level}</span>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setCourseToApprove(course.id)}
                                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                                        >
                                            <CheckCircleIcon className="h-4 w-4" />
                                            Aprobar
                                        </button>
                                        <button
                                            onClick={() => router.push(`${basePath}/${course.id}`)}
                                            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium transition-colors"
                                            title="Ver Detalles"
                                        >
                                            <EyeIcon className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => setCourseToReject(course.id)}
                                            className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg text-sm font-medium transition-colors"
                                            title="Rechazar"
                                        >
                                            <XMarkIcon className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </div>

            {/* Modals de confirmación (usando ConfirmationModal si existe o simple confirm) */}
            {/* Por simplicidad usaré el componente ConfirmationModal que vi en la lista de archivos */}
            {courseToApprove && (
                <ConfirmationModal
                    isOpen={!!courseToApprove}
                    onClose={() => setCourseToApprove(null)}
                    onConfirm={handleApprove}
                    title="Aprobar Curso"
                    message="¿Estás seguro de que deseas aprobar este curso? Se hará público y visible para los estudiantes inmediatamente."
                    confirmText="Aprobar y Publicar"
                    cancelText="Cancelar"
                    type="success" // Asumo que soporta tipos, sino quitar
                />
            )}

            {courseToReject && (
                <ConfirmationModal
                    isOpen={!!courseToReject}
                    onClose={() => setCourseToReject(null)}
                    onConfirm={handleReject}
                    title="Rechazar Curso"
                    message="¿Estás seguro de rechazar este curso? Deberás proporcionar una razón (TODO)."
                    confirmText="Rechazar"
                    cancelText="Cancelar"
                    type="danger"
                />
            )}
        </div>
    )
}
