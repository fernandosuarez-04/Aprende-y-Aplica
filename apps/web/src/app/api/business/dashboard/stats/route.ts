import { NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger';
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const auth = await requireBusiness()
    if (auth instanceof NextResponse) return auth
    
    if (!auth.organizationId) {
      return NextResponse.json(
        {
          success: false,
          error: 'No tienes una organización asignada'
        },
        { status: 403 }
      )
    }
    
    const supabase = await createClient()
    const organizationId = auth.organizationId

    // Obtener estadísticas de usuarios activos
    const { data: orgUsers, error: usersError } = await supabase
      .from('organization_users')
      .select('status, joined_at')
      .eq('organization_id', organizationId)
      .eq('status', 'active')

    if (usersError) {
      logger.error('Error fetching active users:', usersError)
    }

    const activeUsers = orgUsers?.length || 0

    // Calcular cambio de usuarios activos (últimos 30 días vs anteriores)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const { data: recentUsers } = await supabase
      .from('organization_users')
      .select('joined_at')
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .gte('joined_at', thirtyDaysAgo.toISOString())

    const previousPeriodStart = new Date()
    previousPeriodStart.setDate(previousPeriodStart.getDate() - 60)
    
    const { data: previousUsers } = await supabase
      .from('organization_users')
      .select('joined_at')
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .gte('joined_at', previousPeriodStart.toISOString())
      .lt('joined_at', thirtyDaysAgo.toISOString())

    const recentCount = recentUsers?.length || 0
    const previousCount = previousUsers?.length || 0
    const usersChange = previousCount > 0 
      ? `${((recentCount - previousCount) / previousCount * 100).toFixed(0)}%`
      : recentCount > 0 ? '+100%' : '0%'
    const usersChangeType = recentCount >= previousCount ? 'positive' : 'negative'

    // Obtener estadísticas de cursos asignados
    const { data: assignments, error: assignmentsError } = await supabase
      .from('organization_course_assignments')
      .select('id, status, completion_percentage, assigned_at, completed_at')
      .eq('organization_id', organizationId)

    if (assignmentsError) {
      logger.error('Error fetching course assignments:', assignmentsError)
    }

    const totalAssignments = assignments?.length || 0

    // Calcular cursos completados
    const completedAssignments = assignments?.filter((a: any) => 
      a.status === 'completed' || (a.completion_percentage >= 100)
    ).length || 0

    // Calcular cursos en progreso
    const inProgressAssignments = assignments?.filter((a: any) => {
      const completion = a.completion_percentage || 0
      return a.status === 'in_progress' || (completion > 0 && completion < 100)
    }).length || 0

    // Calcular porcentaje promedio en progreso
    const totalProgress = assignments?.reduce((sum: number, a: any) => {
      return sum + (a.completion_percentage || 0)
    }, 0) || 0
    const averageProgress = totalAssignments > 0 
      ? Math.round(totalProgress / totalAssignments)
      : 0

    // Cambio en cursos asignados (últimos 30 días)
    const recentAssignments = assignments?.filter((a: any) => {
      const assignedDate = new Date(a.assigned_at)
      return assignedDate >= thirtyDaysAgo
    }).length || 0

    const previousAssignments = assignments?.filter((a: any) => {
      const assignedDate = new Date(a.assigned_at)
      return assignedDate >= previousPeriodStart && assignedDate < thirtyDaysAgo
    }).length || 0

    const assignmentsChange = previousAssignments > 0
      ? `+${recentAssignments - previousAssignments}`
      : recentAssignments > 0 ? `+${recentAssignments}` : '0'

    // Cambio en completados
    const recentCompleted = assignments?.filter((a: any) => {
      const completedDate = a.completed_at ? new Date(a.completed_at) : null
      return completedDate && completedDate >= thirtyDaysAgo && 
             (a.status === 'completed' || a.completion_percentage >= 100)
    }).length || 0

    const previousCompleted = assignments?.filter((a: any) => {
      const completedDate = a.completed_at ? new Date(a.completed_at) : null
      return completedDate && completedDate >= previousPeriodStart && completedDate < thirtyDaysAgo &&
             (a.status === 'completed' || a.completion_percentage >= 100)
    }).length || 0

    const completedChange = previousCompleted > 0
      ? `${((recentCompleted - previousCompleted) / previousCompleted * 100).toFixed(0)}%`
      : recentCompleted > 0 ? '+100%' : '0%'

    // Cambio en progreso promedio
    const recentProgressSum = assignments?.filter((a: any) => {
      const assignedDate = new Date(a.assigned_at)
      return assignedDate >= thirtyDaysAgo
    }).reduce((sum: number, a: any) => sum + (a.completion_percentage || 0), 0) || 0

    const recentProgressCount = assignments?.filter((a: any) => {
      const assignedDate = new Date(a.assigned_at)
      return assignedDate >= thirtyDaysAgo
    }).length || 0

    const previousProgressSum = assignments?.filter((a: any) => {
      const assignedDate = new Date(a.assigned_at)
      return assignedDate >= previousPeriodStart && assignedDate < thirtyDaysAgo
    }).reduce((sum: number, a: any) => sum + (a.completion_percentage || 0), 0) || 0

    const previousProgressCount = assignments?.filter((a: any) => {
      const assignedDate = new Date(a.assigned_at)
      return assignedDate >= previousPeriodStart && assignedDate < thirtyDaysAgo
    }).length || 0

    const recentAvgProgress = recentProgressCount > 0 ? recentProgressSum / recentProgressCount : 0
    const previousAvgProgress = previousProgressCount > 0 ? previousProgressSum / previousProgressCount : 0

    const progressChange = previousAvgProgress > 0
      ? `${((recentAvgProgress - previousAvgProgress) / previousAvgProgress * 100).toFixed(0)}%`
      : recentAvgProgress > 0 ? '+100%' : '0%'

    return NextResponse.json({
      success: true,
      stats: {
        activeUsers: {
          value: activeUsers.toString(),
          change: usersChange.startsWith('-') ? usersChange : `+${usersChange}`,
          changeType: usersChangeType
        },
        assignedCourses: {
          value: totalAssignments.toString(),
          change: assignmentsChange,
          changeType: 'positive' as const
        },
        completed: {
          value: completedAssignments.toString(),
          change: completedChange.startsWith('-') ? completedChange : `+${completedChange}`,
          changeType: recentCompleted >= previousCompleted ? 'positive' : 'negative'
        },
        inProgress: {
          value: `${averageProgress}%`,
          change: progressChange.startsWith('-') ? progressChange : `+${progressChange}`,
          changeType: recentAvgProgress >= previousAvgProgress ? 'positive' : 'negative'
        }
      }
    })
  } catch (error) {
    logger.error('💥 Error in /api/business/dashboard/stats:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Error al obtener estadísticas del dashboard'
      },
      { status: 500 }
    )
  }
}
