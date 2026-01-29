
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
    ChevronLeftIcon,
    CheckCircleIcon,
    XCircleIcon,
    BookOpenIcon,
    PlayCircleIcon,
    DocumentTextIcon,
    QuestionMarkCircleIcon,
    ClockIcon
} from '@heroicons/react/24/outline'
import { useAdminCourseDetail } from '../hooks/useAdminCourseDetail'
import { ConfirmationModal } from './ConfirmationModal'
import { createClient } from '../../../lib/supabase/client'

interface AdminPendingCourseDetailPageProps {
    courseId: string
    successRedirectPath?: string
}

export function AdminPendingCourseDetailPage({
    courseId,
    successRedirectPath = '/admin/courses/pending'
}: AdminPendingCourseDetailPageProps) {
    const router = useRouter()
    const { course, isLoading, error, approveCourse, rejectCourse } = useAdminCourseDetail(courseId)
    const [showApproveModal, setShowApproveModal] = useState(false)
    const [showRejectModal, setShowRejectModal] = useState(false)

    const handleApprove = async () => {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            alert('Sesión inválida')
            return
        }

        const success = await approveCourse(user.id)
        if (success) {
            router.push(successRedirectPath)
        } else {
            alert('Error al aprobar')
        }
        setShowApproveModal(false)
    }

    const handleReject = async () => {
        const success = await rejectCourse('Rechazado desde panel de detalle')
        if (success) {
            router.push(successRedirectPath)
        } else {
            alert('Error al rechazar')
        }
        setShowRejectModal(false)
    }

    if (isLoading) return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
    if (error) return <div className="p-8 text-red-500">Error: {error}</div>
    if (!course) return <div className="p-8">Curso no encontrado</div>

    return (
        <div className="p-6 max-w-5xl mx-auto">
            {/* Navbar de navegación simple */}
            <button
                onClick={() => router.back()}
                className="flex items-center text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mb-6 transition-colors"
            >
                <ChevronLeftIcon className="h-4 w-4 mr-1" />
                Volver a pendientes
            </button>

            {/* Cabecera del Curso */}
            <div className="bg-white dark:bg-[#1E2329] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 mb-6">
                <div className="flex flex-col md:flex-row gap-6">
                    <div className="w-full md:w-1/3 aspect-video bg-gray-200 rounded-xl overflow-hidden relative">
                        {course.thumbnail_url && (
                            <img src={course.thumbnail_url} alt="Portada" className="w-full h-full object-cover" />
                        )}
                        <div className="absolute top-2 right-2 px-2 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded">
                            {course.approval_status?.toUpperCase()}
                        </div>
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{course.title}</h1>
                                <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">{course.description}</p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-300">
                            <span className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                                <ClockIcon className="h-4 w-4" />
                                {Math.round(course.duration_total_minutes / 60 * 10) / 10} horas
                            </span>
                            <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full capitalize">
                                Nivel: {course.level}
                            </span>
                            <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full capitalize">
                                Categoría: {course.category}
                            </span>
                        </div>

                        <div className="mt-6 flex items-center gap-3 pt-4 border-t dark:border-gray-700">
                            {course.instructor?.profile_picture_url ? (
                                <img src={course.instructor.profile_picture_url} className="w-8 h-8 rounded-full" />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">
                                    I
                                </div>
                            )}
                            <div>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {course.instructor?.display_name || 'Instructor'}
                                </p>
                                <p className="text-xs text-gray-500">{course.instructor?.first_name} {course.instructor?.last_name}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Contenido (Syllabus) */}
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <BookOpenIcon className="h-6 w-6 text-blue-500" />
                Contenido del Curso
            </h2>

            <div className="space-y-4 mb-8">
                {course.modules?.map((mod: any) => (
                    <div key={mod.module_id} className="bg-white dark:bg-[#1E2329] rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                                Módulo {mod.module_order_index}: {mod.module_title}
                            </h3>
                        </div>
                        <div className="divide-y divide-gray-100 dark:divide-gray-800">
                            {mod.lessons?.map((lesson: any) => (
                                <div key={lesson.lesson_id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                                            <PlayCircleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-medium text-gray-900 dark:text-gray-100">{lesson.lesson_title}</h4>
                                            <p className="text-xs text-gray-500">{lesson.duration_seconds} seg • {lesson.video_provider}</p>
                                        </div>
                                        {lesson.materials && lesson.materials.length > 0 && (
                                            <div className="flex gap-1">
                                                {lesson.materials.map((mat: any) => (
                                                    <span key={mat.material_id} title={mat.material_title} className="p-1 bg-gray-100 dark:bg-gray-700 rounded text-gray-500">
                                                        {mat.material_type === 'quiz' ? <QuestionMarkCircleIcon className="h-4 w-4" /> : <DocumentTextIcon className="h-4 w-4" />}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Barra de Acciones Fija (o al final) */}
            <div className="flex gap-4 justify-end sticky bottom-6 bg-white/80 dark:bg-[#0A0D12]/90 backdrop-blur-md p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl z-20">
                <button
                    onClick={() => setShowRejectModal(true)}
                    className="px-6 py-2.5 bg-red-100 hover:bg-red-200 text-red-700 font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                    <XCircleIcon className="h-5 w-5" />
                    Rechazar Curso
                </button>
                <button
                    onClick={() => setShowApproveModal(true)}
                    className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg shadow-lg shadow-green-600/20 transition-all hover:scale-105 flex items-center gap-2"
                >
                    <CheckCircleIcon className="h-5 w-5" />
                    Aprobar y Publicar
                </button>
            </div>

            {/* Modales */}
            <ConfirmationModal
                isOpen={showApproveModal}
                onClose={() => setShowApproveModal(false)}
                onConfirm={handleApprove}
                title="Confirmar Publicación"
                message="¿Estás seguro de publicar este curso? Será visible inmediatamente para los estudiantes."
                confirmText="Sí, Publicar"
                cancelText="Cancelar"
                type="success"
            />
            <ConfirmationModal
                isOpen={showRejectModal}
                onClose={() => setShowRejectModal(false)}
                onConfirm={handleReject}
                title="Rechazar Curso"
                message="Esta acción no se puede deshacer fácilmente. El curso pasará a estado 'rejected'."
                confirmText="Sí, Rechazar"
                cancelText="Cancelar"
                type="danger"
            />

        </div>
    )
}
