import { NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger';
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'

interface ActivityItem {
  user: string;
  action: string;
  time: string;
  icon: string;
}

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

    // Obtener nombre de la organización
    const { data: orgData } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', organizationId)
      .single()

    const orgName = orgData?.name || 'tu organización'
    const activities: ActivityItem[] = []

    // Obtener cursos completados recientes
    const { data: completedCourses } = await supabase
      .from('organization_course_assignments')
      .select(`
        completed_at,
        completion_percentage,
        user:users!inner (
          first_name,
          last_name,
          display_name
        ),
        course:courses!inner (
          title
        )
      `)
      .eq('organization_id', organizationId)
      .or('status.eq.completed,completion_percentage.gte.100')
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(5)

    if (completedCourses) {
      completedCourses.forEach((item: any) => {
        const userName = item.user?.display_name || 
          `${item.user?.first_name || ''} ${item.user?.last_name || ''}`.trim() || 
          'Usuario'
        const courseTitle = item.course?.title || 'curso'
        
        activities.push({
          user: userName,
          action: `completó el curso de ${courseTitle}`,
          time: formatTimeAgo(item.completed_at),
          icon: 'CheckCircle'
        })
      })
    }

    // Obtener usuarios que se unieron recientemente
    const { data: newUsers } = await supabase
      .from('organization_users')
      .select(`
        joined_at,
        user:users!inner (
          first_name,
          last_name,
          display_name
        )
      `)
      .eq('organization_id', organizationId)
      .not('joined_at', 'is', null)
      .order('joined_at', { ascending: false })
      .limit(3)

    if (newUsers) {
      newUsers.forEach((item: any) => {
        const userName = item.user?.display_name || 
          `${item.user?.first_name || ''} ${item.user?.last_name || ''}`.trim() || 
          'Usuario'
        
        activities.push({
          user: userName,
          action: `se unió a ${orgName}`,
          time: formatTimeAgo(item.joined_at),
          icon: 'Users'
        })
      })
    }

    // Obtener cursos iniciados recientemente
    const { data: startedCourses } = await supabase
      .from('organization_course_assignments')
      .select(`
        assigned_at,
        completion_percentage,
        user:users!inner (
          first_name,
          last_name,
          display_name
        ),
        course:courses!inner (
          title
        )
      `)
      .eq('organization_id', organizationId)
      .gt('completion_percentage', 0)
      .lt('completion_percentage', 100)
      .order('assigned_at', { ascending: false })
      .limit(3)

    if (startedCourses) {
      startedCourses.forEach((item: any) => {
        const userName = item.user?.display_name || 
          `${item.user?.first_name || ''} ${item.user?.last_name || ''}`.trim() || 
          'Usuario'
        const courseTitle = item.course?.title || 'curso'
        
        activities.push({
          user: userName,
          action: `inició el curso de ${courseTitle}`,
          time: formatTimeAgo(item.assigned_at),
          icon: 'BookOpen'
        })
      })
    }

    // Ordenar por fecha más reciente y limitar a 10
    activities.sort((a, b) => {
      // Ordenar por tiempo (más reciente primero)
      const timeOrder: Record<string, number> = {
        'hace 1 hora': 1,
        'hace 2 horas': 2,
        'hace 5 horas': 5,
        'hace 1 día': 24,
        'hace 2 días': 48,
        'hace 3 días': 72,
      }
      return (timeOrder[a.time] || 999) - (timeOrder[b.time] || 999)
    })

    return NextResponse.json({
      success: true,
      activities: activities.slice(0, 10)
    })
  } catch (error) {
    logger.error('💥 Error in /api/business/dashboard/activity:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Error al obtener actividad reciente',
        activities: []
      },
      { status: 500 }
    )
  }
}

function formatTimeAgo(dateString: string | null): string {
  if (!dateString) return 'hace mucho tiempo'
  
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)

  if (diffHours < 1) return 'hace menos de 1 hora'
  if (diffHours === 1) return 'hace 1 hora'
  if (diffHours < 24) return `hace ${diffHours} horas`
  if (diffDays === 1) return 'hace 1 día'
  if (diffDays < 7) return `hace ${diffDays} días`
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7)
    return weeks === 1 ? 'hace 1 semana' : `hace ${weeks} semanas`
  }
  const months = Math.floor(diffDays / 30)
  return months === 1 ? 'hace 1 mes' : `hace ${months} meses`
}
