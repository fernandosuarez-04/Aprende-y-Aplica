/**
 * Servicio para gestionar equipos de trabajo
 */

export interface WorkTeam {
  team_id: string
  organization_id: string
  name: string
  description: string | null
  team_leader_id: string | null
  created_by: string
  course_id: string | null
  status: 'active' | 'inactive' | 'archived'
  metadata: Record<string, any>
  created_at: string
  updated_at: string
  // Relaciones opcionales
  team_leader?: {
    id: string
    name: string
    email: string
    profile_picture_url: string | null
  }
  course?: {
    id: string
    title: string
    thumbnail_url: string | null
  }
  member_count?: number
  active_member_count?: number
}

export interface WorkTeamMember {
  id: string
  team_id: string
  user_id: string
  role: 'member' | 'leader' | 'co-leader'
  joined_at: string
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
  // Relaciones opcionales
  user?: {
    id: string
    name: string
    email: string
    profile_picture_url: string | null
    display_name: string | null
  }
}

export interface WorkTeamCourseAssignment {
  id: string
  team_id: string
  course_id: string
  assigned_by: string
  assigned_at: string
  due_date: string | null
  message: string | null
  status: 'assigned' | 'in_progress' | 'completed'
  created_at: string
  updated_at: string
  // Relaciones opcionales
  course?: {
    id: string
    title: string
    thumbnail_url: string | null
    price: number | null
  }
  assigned_by_user?: {
    id: string
    name: string
    email: string
  }
}

export interface WorkTeamObjective {
  objective_id: string
  team_id: string
  course_id: string | null
  title: string
  description: string | null
  target_value: number
  current_value: number
  metric_type: 'completion_percentage' | 'average_score' | 'participation_rate' | 'engagement_rate' | 'custom'
  deadline: string | null
  status: 'pending' | 'in_progress' | 'achieved' | 'failed'
  created_by: string
  created_at: string
  updated_at: string
  // Relaciones opcionales
  course?: {
    id: string
    title: string
  }
  created_by_user?: {
    id: string
    name: string
  }
  progress_percentage?: number
}

export interface WorkTeamMessage {
  message_id: string
  team_id: string
  course_id: string | null
  sender_id: string
  content: string
  message_type: 'text' | 'file' | 'link' | 'achievement'
  reply_to_message_id: string | null
  is_pinned: boolean
  created_at: string
  updated_at: string
  // Relaciones opcionales
  sender?: {
    id: string
    name: string
    email: string
    profile_picture_url: string | null
    display_name: string | null
  }
  reply_to?: WorkTeamMessage
  course?: {
    id: string
    title: string
  }
}

export interface WorkTeamFeedback {
  feedback_id: string
  team_id: string
  from_user_id: string
  to_user_id: string
  course_id: string | null
  feedback_type: 'peer_review' | 'achievement' | 'suggestion' | 'question'
  content: string
  rating: number | null
  is_anonymous: boolean
  created_at: string
  updated_at: string
  // Relaciones opcionales
  from_user?: {
    id: string
    name: string
    email: string
    profile_picture_url: string | null
  }
  to_user?: {
    id: string
    name: string
    email: string
    profile_picture_url: string | null
  }
  course?: {
    id: string
    title: string
  }
}

export interface WorkTeamStatistics {
  stat_id: string
  team_id: string
  course_id: string | null
  stat_date: string
  total_members: number
  active_members: number
  average_completion_percentage: number
  average_score: number
  total_interactions: number
  total_messages: number
  total_feedback_given: number
  metadata: Record<string, any>
  calculated_at: string
}

// Interfaces para auditoría detallada
export interface LessonTimeData {
  lesson_id: string
  lesson_title: string
  time_spent_minutes: number
  completion_status: string
  course_id: string
  course_title: string
}

export interface LessonTimeByCourse {
  course_id: string
  course_title: string
  lessons: LessonTimeData[]
}

export interface LIAMessageData {
  message_id: string
  content: string
  created_at: string
  conversation_id: string
  role: 'user' | 'assistant' | 'system'
  message_sequence?: number
}

export interface LIAConversation {
  conversation_id: string
  started_at: string
  duration_seconds: number
  messages: LIAMessageData[]
}

export interface LIAInteractionData {
  total_conversations: number
  total_messages: number
  total_duration_seconds: number
  conversations: LIAConversation[]
}

export interface ChatMessageData {
  message_id: string
  content: string
  created_at: string
}

export interface ChatActivityData {
  total_messages: number
  messages: ChatMessageData[]
}

export interface NoteData {
  note_id: string
  note_title: string
  note_content: string
  lesson_title: string
  created_at: string
}

export interface QuizAttemptData {
  submission_id: string
  lesson_title: string
  lesson_id: string
  score: number
  percentage_score: number
  is_passed: boolean
  completed_at: string
  attempt_number: number
  total_attempts_for_lesson: number
}

export interface QuizSummary {
  total_attempts: number
  best_score: number
  average_score: number
  passed_count: number
}

export interface UserDetailedAudit {
  user_id: string
  user_name: string
  user_email: string
  profile_picture_url: string | null
  lesson_time: LessonTimeByCourse[]
  lia_interactions: LIAInteractionData
  chat_activity: ChatActivityData
  notes: NoteData[]
  quiz_attempts: QuizAttemptData[]
  quiz_summary: QuizSummary
}

// Request interfaces
export interface CreateWorkTeamRequest {
  name: string
  description?: string
  team_leader_id?: string
  course_id?: string
  member_ids?: string[]
  metadata?: Record<string, any>
}

export interface UpdateWorkTeamRequest {
  name?: string
  description?: string
  team_leader_id?: string
  course_id?: string
  status?: 'active' | 'inactive' | 'archived'
  metadata?: Record<string, any>
}

export interface AddTeamMembersRequest {
  user_ids: string[]
  role?: 'member' | 'leader' | 'co-leader'
}

export interface AssignCourseToTeamRequest {
  course_id: string
  due_date?: string
  message?: string
}

export interface CreateTeamObjectiveRequest {
  title: string
  description?: string
  course_id?: string
  target_value: number
  metric_type: 'completion_percentage' | 'average_score' | 'participation_rate' | 'engagement_rate' | 'custom'
  deadline?: string
}

export interface UpdateTeamObjectiveRequest {
  title?: string
  description?: string
  target_value?: number
  current_value?: number
  metric_type?: 'completion_percentage' | 'average_score' | 'participation_rate' | 'engagement_rate' | 'custom'
  deadline?: string
  status?: 'pending' | 'in_progress' | 'achieved' | 'failed'
}

export interface CreateTeamMessageRequest {
  content: string
  course_id?: string
  message_type?: 'text' | 'file' | 'link' | 'achievement'
  reply_to_message_id?: string
}

export interface CreateTeamFeedbackRequest {
  to_user_id: string
  course_id?: string
  feedback_type: 'peer_review' | 'achievement' | 'suggestion' | 'question'
  content: string
  rating?: number
  is_anonymous?: boolean
}

/**
 * Servicio para gestionar equipos de trabajo
 */
export class TeamsService {
  /**
   * Obtiene todos los equipos de la organización
   */
  static async getTeams(organizationId: string): Promise<WorkTeam[]> {
    const response = await fetch('/api/business/teams', {
      credentials: 'include'
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Error al obtener equipos' }))
      throw new Error(errorData.error || 'Error al obtener equipos')
    }

    const data = await response.json()
    if (!data.success) {
      throw new Error(data.error || 'Error al obtener equipos')
    }
    return data.teams || []
  }

  /**
   * Obtiene un equipo por ID
   */
  static async getTeam(teamId: string): Promise<WorkTeam> {
    const response = await fetch(`/api/business/teams/${teamId}`, {
      credentials: 'include'
    })

    if (!response.ok) {
      throw new Error('Error al obtener el equipo')
    }

    const data = await response.json()
    return data.team
  }

  /**
   * Crea un nuevo equipo
   */
  static async createTeam(request: CreateWorkTeamRequest): Promise<WorkTeam> {
    const response = await fetch('/api/business/teams', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(request)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Error al crear el equipo')
    }

    const data = await response.json()
    return data.team
  }

  /**
   * Actualiza un equipo
   */
  static async updateTeam(teamId: string, request: UpdateWorkTeamRequest): Promise<WorkTeam> {
    const response = await fetch(`/api/business/teams/${teamId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(request)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Error al actualizar el equipo')
    }

    const data = await response.json()
    return data.team
  }

  /**
   * Elimina un equipo (soft delete)
   */
  static async deleteTeam(teamId: string): Promise<void> {
    const response = await fetch(`/api/business/teams/${teamId}`, {
      method: 'DELETE',
      credentials: 'include'
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Error al eliminar el equipo')
    }
  }

  /**
   * Obtiene los miembros de un equipo
   */
  static async getTeamMembers(teamId: string): Promise<WorkTeamMember[]> {
    const response = await fetch(`/api/business/teams/${teamId}/members`, {
      credentials: 'include'
    })

    if (!response.ok) {
      throw new Error('Error al obtener miembros del equipo')
    }

    const data = await response.json()
    return data.members || []
  }

  /**
   * Agrega miembros a un equipo
   */
  static async addTeamMembers(teamId: string, request: AddTeamMembersRequest): Promise<WorkTeamMember[]> {
    const response = await fetch(`/api/business/teams/${teamId}/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(request)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Error al agregar miembros')
    }

    const data = await response.json()
    return data.members || []
  }

  /**
   * Remueve miembros de un equipo
   */
  static async removeTeamMember(teamId: string, memberId: string): Promise<void> {
    const response = await fetch(`/api/business/teams/${teamId}/members/${memberId}`, {
      method: 'DELETE',
      credentials: 'include'
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Error al remover miembro')
    }
  }

  /**
   * Asigna un curso a un equipo
   */
  static async assignCourseToTeam(teamId: string, request: AssignCourseToTeamRequest): Promise<WorkTeamCourseAssignment> {
    const response = await fetch(`/api/business/teams/${teamId}/assign-course`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(request)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Error al asignar curso al equipo')
    }

    const data = await response.json()
    return data.data?.assignment || data.assignment
  }

  /**
   * Obtiene los objetivos de un equipo
   */
  static async getTeamObjectives(teamId: string, courseId?: string): Promise<WorkTeamObjective[]> {
    const url = courseId
      ? `/api/business/teams/${teamId}/objectives?course_id=${courseId}`
      : `/api/business/teams/${teamId}/objectives`
    
    const response = await fetch(url, {
      credentials: 'include'
    })

    if (!response.ok) {
      throw new Error('Error al obtener objetivos')
    }

    const data = await response.json()
    return data.objectives || []
  }

  /**
   * Crea un objetivo para un equipo
   */
  static async createTeamObjective(teamId: string, request: CreateTeamObjectiveRequest): Promise<WorkTeamObjective> {
    const response = await fetch(`/api/business/teams/${teamId}/objectives`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(request)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Error al crear objetivo')
    }

    const data = await response.json()
    return data.objective
  }

  /**
   * Actualiza un objetivo
   */
  static async updateTeamObjective(teamId: string, objectiveId: string, request: UpdateTeamObjectiveRequest): Promise<WorkTeamObjective> {
    const response = await fetch(`/api/business/teams/${teamId}/objectives/${objectiveId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(request)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Error al actualizar objetivo')
    }

    const data = await response.json()
    return data.objective
  }

  /**
   * Elimina un objetivo
   */
  static async deleteTeamObjective(teamId: string, objectiveId: string): Promise<void> {
    const response = await fetch(`/api/business/teams/${teamId}/objectives/${objectiveId}`, {
      method: 'DELETE',
      credentials: 'include'
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Error al eliminar objetivo')
    }
  }

  /**
   * Obtiene los mensajes de un equipo
   */
  static async getTeamMessages(teamId: string, courseId?: string, limit = 50, offset = 0): Promise<WorkTeamMessage[]> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString()
    })
    if (courseId) {
      params.append('course_id', courseId)
    }

    const response = await fetch(`/api/business/teams/${teamId}/messages?${params}`, {
      credentials: 'include'
    })

    if (!response.ok) {
      throw new Error('Error al obtener mensajes')
    }

    const data = await response.json()
    return data.messages || []
  }

  /**
   * Crea un mensaje en el equipo
   */
  static async createTeamMessage(teamId: string, request: CreateTeamMessageRequest): Promise<WorkTeamMessage> {
    const response = await fetch(`/api/business/teams/${teamId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(request)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Error al enviar mensaje')
    }

    const data = await response.json()
    return data.message
  }

  /**
   * Obtiene el feedback de un equipo
   */
  static async getTeamFeedback(teamId: string, courseId?: string, toUserId?: string): Promise<WorkTeamFeedback[]> {
    const params = new URLSearchParams()
    if (courseId) params.append('course_id', courseId)
    if (toUserId) params.append('to_user_id', toUserId)

    const response = await fetch(`/api/business/teams/${teamId}/feedback?${params}`, {
      credentials: 'include'
    })

    if (!response.ok) {
      throw new Error('Error al obtener feedback')
    }

    const data = await response.json()
    return data.feedback || []
  }

  /**
   * Crea feedback en el equipo
   */
  static async createTeamFeedback(teamId: string, request: CreateTeamFeedbackRequest): Promise<WorkTeamFeedback> {
    const response = await fetch(`/api/business/teams/${teamId}/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(request)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Error al crear feedback')
    }

    const data = await response.json()
    return data.feedback
  }

  /**
   * Obtiene los cursos asignados a un equipo
   */
  static async getTeamCourses(teamId: string): Promise<WorkTeamCourseAssignment[]> {
    const response = await fetch(`/api/business/teams/${teamId}/courses`, {
      credentials: 'include'
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Error al obtener cursos' }))
      throw new Error(errorData.error || 'Error al obtener cursos')
    }

    const data = await response.json()
    if (!data.success) {
      throw new Error(data.error || 'Error al obtener cursos')
    }
    return data.assignments || []
  }

  /**
   * Obtiene estadísticas de un equipo
   */
  static async getTeamStatistics(teamId: string, courseId?: string, dateRange?: { start: string; end: string }): Promise<WorkTeamStatistics[]> {
    const params = new URLSearchParams()
    if (courseId) params.append('course_id', courseId)
    if (dateRange) {
      params.append('start_date', dateRange.start)
      params.append('end_date', dateRange.end)
    }

    const response = await fetch(`/api/business/teams/${teamId}/statistics?${params}`, {
      credentials: 'include'
    })

    if (!response.ok) {
      throw new Error('Error al obtener estadísticas')
    }

    const data = await response.json()
    return data.statistics || []
  }

  /**
   * Obtiene auditoría detallada por usuario de un equipo
   */
  static async getTeamDetailedAnalytics(teamId: string, courseId?: string): Promise<UserDetailedAudit[]> {
    const params = new URLSearchParams()
    if (courseId) params.append('course_id', courseId)

    const response = await fetch(`/api/business/teams/${teamId}/analytics/detailed?${params}`, {
      credentials: 'include'
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Error al obtener auditoría detallada' }))
      throw new Error(errorData.error || 'Error al obtener auditoría detallada')
    }

    const data = await response.json()
    if (!data.success) {
      throw new Error(data.error || 'Error al obtener auditoría detallada')
    }
    return data.users || []
  }
}

