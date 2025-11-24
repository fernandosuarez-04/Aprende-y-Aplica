'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Plus, Calendar, Users, TrendingUp, Clock, CheckCircle2 } from 'lucide-react'
import { Button } from '@aprende-y-aplica/ui'
import { useOrganizationStylesContext } from '../contexts/OrganizationStylesContext'
import { TeamsService, WorkTeamCourseAssignment } from '../services/teams.service'
import { BusinessAssignCourseToTeamModal } from './BusinessAssignCourseToTeamModal'
import { WorkTeamMember } from '../services/teams.service'

interface TeamCoursesTabProps {
  teamId: string
  teamName: string
  teamMembers: WorkTeamMember[]
}

export function TeamCoursesTab({ teamId, teamName, teamMembers }: TeamCoursesTabProps) {
  const { styles } = useOrganizationStylesContext()
  const panelStyles = styles?.panel
  
  const cardBg = panelStyles?.card_background || 'rgba(30, 41, 59, 0.8)'
  const cardBorder = panelStyles?.border_color || 'rgba(51, 65, 85, 0.3)'
  const textColor = panelStyles?.text_color || '#f8fafc'
  const primaryColor = panelStyles?.primary_button_color || '#3b82f6'

  const [assignments, setAssignments] = useState<WorkTeamCourseAssignment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)

  useEffect(() => {
    fetchAssignments()
  }, [teamId])

  const fetchAssignments = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const courses = await TeamsService.getTeamCourses(teamId)
      setAssignments(courses)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar cursos')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAssignSuccess = () => {
    fetchAssignments()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12" style={{ color: textColor }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-2" style={{ borderColor: primaryColor }}></div>
          <p className="text-sm font-body">Cargando cursos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header con botón de asignar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-heading font-semibold mb-1" style={{ color: textColor }}>
            Cursos Asignados
          </h2>
          <p className="text-sm font-body opacity-70">
            {assignments.length} curso(s) asignado(s) al equipo
          </p>
        </div>
        <Button
          onClick={() => setIsAssignModalOpen(true)}
          variant="gradient"
          size="lg"
          className="font-body"
          style={{
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${panelStyles?.secondary_button_color || '#8b5cf6'} 100%)`,
            boxShadow: `0 4px 14px 0 ${primaryColor}40`
          }}
        >
          <Plus className="w-5 h-5 mr-2" />
          Asignar Curso
        </Button>
      </div>

      {error && (
        <div 
          className="p-4 rounded-xl border text-red-400"
          style={{ backgroundColor: cardBg, borderColor: 'rgba(220, 38, 38, 0.3)' }}
        >
          <p className="font-body text-sm">{error}</p>
        </div>
      )}

      {assignments.length === 0 ? (
        <div 
          className="p-12 rounded-2xl border text-center backdrop-blur-sm"
          style={{ backgroundColor: cardBg, borderColor: cardBorder }}
        >
          <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-heading mb-2">No hay cursos asignados</p>
          <p className="text-sm font-body opacity-70 mb-4">
            Asigna un curso al equipo para comenzar
          </p>
          <Button
            onClick={() => setIsAssignModalOpen(true)}
            variant="gradient"
            className="font-body"
            style={{
              background: `linear-gradient(135deg, ${primaryColor} 0%, ${panelStyles?.secondary_button_color || '#8b5cf6'} 100%)`,
              boxShadow: `0 4px 14px 0 ${primaryColor}40`
            }}
          >
            <Plus className="w-5 h-5 mr-2" />
            Asignar Primer Curso
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assignments.map((assignment, index) => (
            <motion.div
              key={assignment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-5 rounded-2xl border backdrop-blur-sm"
              style={{ backgroundColor: cardBg, borderColor: cardBorder }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${primaryColor}20` }}
                  >
                    <BookOpen className="w-6 h-6" style={{ color: primaryColor }} />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-lg mb-1">
                      {assignment.course?.title || 'Curso'}
                    </h3>
                    <p className="text-xs font-body opacity-70">
                      Asignado {new Date(assignment.assigned_at).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                </div>
                <span 
                  className={`px-2 py-1 rounded-lg text-xs font-body ${
                    assignment.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                    assignment.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-yellow-500/20 text-yellow-400'
                  }`}
                >
                  {assignment.status === 'completed' ? 'Completado' :
                   assignment.status === 'in_progress' ? 'En Progreso' : 'Asignado'}
                </span>
              </div>

              {assignment.message && (
                <p className="text-sm font-body opacity-70 mb-3 line-clamp-2">
                  {assignment.message}
                </p>
              )}

              <div className="flex items-center gap-4 text-sm font-body">
                {assignment.due_date && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4 opacity-50" />
                    <span>Vence: {new Date(assignment.due_date).toLocaleDateString('es-ES')}</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal de Asignación */}
      <BusinessAssignCourseToTeamModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        teamId={teamId}
        teamName={teamName}
        teamMembers={teamMembers}
        onAssignComplete={handleAssignSuccess}
      />
    </div>
  )
}

