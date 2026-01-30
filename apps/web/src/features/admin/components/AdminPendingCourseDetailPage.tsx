
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
                                <LessonItem key={lesson.lesson_id} lesson={lesson} />
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

function LessonItem({ lesson }: { lesson: any }) {
    const [isExpanded, setIsExpanded] = useState(false)
    const [activeTab, setActiveTab] = useState<'summary' | 'transcript' | 'activities' | 'materials'>('summary')

    return (
        <div className="border-b border-gray-100 dark:border-gray-800 last:border-0">
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer flex items-center gap-3"
            >
                <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                    <PlayCircleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">{lesson.lesson_title}</h4>
                    <p className="text-xs text-gray-500">{lesson.duration_seconds} seg • {lesson.video_provider}</p>
                </div>
                {/* Indicadores de contenido */}
                <div className="flex gap-2 mr-4">
                    {lesson.transcript_content && <span title="Transcripción" className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-500">T</span>}
                    {lesson.summary_content && <span title="Resumen" className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-500">R</span>}
                    {lesson.activities?.length > 0 && <span title="Actividades" className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-500">A:{lesson.activities.length}</span>}
                </div>
                <ChevronLeftIcon className={`h-4 w-4 text-gray-400 transition-transform ${isExpanded ? '-rotate-90' : 'rotate-180'}`} />
            </div>

            {isExpanded && (
                <div className="bg-gray-50 dark:bg-gray-800/30 p-4 border-t border-gray-100 dark:border-gray-800">
                    {/* Video Preview */}
                    <div className="mb-6 bg-black rounded-lg overflow-hidden aspect-video max-w-2xl mx-auto">
                        <iframe
                            src={`https://www.youtube.com/embed/${getYouTubeID(lesson.video_provider_id || '')}`}
                            className="w-full h-full"
                            frameBorder="0"
                            allowFullScreen
                        />
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
                        <button onClick={() => setActiveTab('summary')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'summary' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Resumen</button>
                        <button onClick={() => setActiveTab('transcript')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'transcript' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Transcripción</button>
                        <button onClick={() => setActiveTab('activities')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'activities' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Actividades ({lesson.activities?.length || 0})</button>
                        <button onClick={() => setActiveTab('materials')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'materials' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Materiales ({lesson.materials?.length || 0})</button>
                    </div>

                    {/* Content */}
                    <div className="bg-white dark:bg-[#1E2329] p-4 rounded-lg border border-gray-200 dark:border-gray-700 min-h-[150px]">
                        {activeTab === 'summary' && (
                            <div className="prose dark:prose-invert max-w-none text-sm">
                                {lesson.summary_content ? lesson.summary_content : <p className="text-gray-400 italic">No hay resumen disponible.</p>}
                            </div>
                        )}
                        {activeTab === 'transcript' && (
                            <div className="h-64 overflow-y-auto p-2 bg-gray-50 dark:bg-gray-900 rounded text-sm font-mono text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                                {lesson.transcript_content || 'No hay transcripción disponible.'}
                            </div>
                        )}
                        {activeTab === 'activities' && (
                            <div className="space-y-3">
                                {lesson.activities?.length > 0 ? lesson.activities.map((act: any) => (
                                    <div key={act.activity_id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-xs font-bold uppercase bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{act.activity_type}</span>
                                            <h5 className="font-semibold text-sm">{act.activity_title}</h5>
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-300">{act.activity_content}</p>
                                    </div>
                                )) : <p className="text-gray-400 italic">No hay actividades creadas.</p>}
                            </div>
                        )}
                        {activeTab === 'materials' && (
                            <div className="space-y-2">
                                {lesson.materials?.length > 0 ? lesson.materials.map((mat: any) => (
                                    <a key={mat.material_id} href={mat.file_url || mat.external_url} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 transition-colors group">
                                        <DocumentTextIcon className="h-5 w-5 text-gray-400 group-hover:text-blue-500" />
                                        <span className="text-sm text-gray-700 dark:text-gray-200">{mat.material_title}</span>
                                        <span className="text-xs ml-auto text-gray-400 uppercase">{mat.material_type}</span>
                                    </a>
                                )) : <p className="text-gray-400 italic">No hay materiales adicionales.</p>}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

function getYouTubeID(url: string) {
    // Simple parser for demonstration. Enhancements needed for robustness.
    // Assuming the provider_id stored is the ID itself or handle basic URL
    if (!url) return '' // Guardar contra undefined
    if (url.length === 11) return url;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : url;
}
