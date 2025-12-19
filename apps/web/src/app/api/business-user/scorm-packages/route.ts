import { NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger'
import { requireBusinessUser } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'

interface ScormPackageStats {
  total: number
  in_progress: number
  completed: number
}

interface AssignedScormPackage {
  id: string
  title: string
  description?: string
  version: 'SCORM_1.2' | 'SCORM_2004'
  progress: number
  status: 'Asignado' | 'En progreso' | 'Completado'
  thumbnail?: string
  storage_path: string
  entry_point: string
  assigned_at: string
  manifest_data: any
  objectives_count: number
}

export async function GET() {
  try {
    const auth = await requireBusinessUser()
    if (auth instanceof NextResponse) {
      logger.error('Auth failed in business-user/scorm-packages:', auth.status)
      return auth
    }

    if (!auth.userId) {
      logger.error('No userId in auth object')
      return NextResponse.json(
        {
          success: false,
          error: 'Usuario no autenticado'
        },
        { status: 401 }
      )
    }

    const supabase = await createClient()
    const userId = auth.userId

    logger.log('📦 Fetching SCORM packages for user:', userId)

    // Obtener la organización del usuario
    const { data: userOrg, error: userOrgError } = await supabase
      .from('organization_users')
      .select('organization_id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('joined_at', { ascending: false })
      .limit(1)
      .single()

    if (userOrgError || !userOrg) {
      logger.error('❌ Error fetching user organization:', userOrgError)
      return NextResponse.json({
        success: true,
        packages: [],
        stats: {
          total: 0,
          in_progress: 0,
          completed: 0
        }
      })
    }

    const organizationId = userOrg.organization_id

    // Obtener paquetes SCORM de la organización
    const { data: packages, error: packagesError } = await supabase
      .from('scorm_packages')
      .select(`
        id,
        title,
        description,
        version,
        manifest_data,
        entry_point,
        storage_path,
        status,
        created_at
      `)
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (packagesError) {
      logger.error('❌ Error fetching SCORM packages:', packagesError)
      return NextResponse.json({
        success: true,
        error: packagesError.message,
        packages: [],
        stats: {
          total: 0,
          in_progress: 0,
          completed: 0
        }
      })
    }

    logger.log('✅ SCORM packages fetched:', packages?.length || 0)

    // Obtener los intentos del usuario para estos paquetes
    const packageIds = (packages || []).map(p => p.id)
    let attemptsMap = new Map<string, any>()

    if (packageIds.length > 0) {
      const { data: attempts, error: attemptsError } = await supabase
        .from('scorm_attempts')
        .select('id, package_id, lesson_status, score_raw, score_max, started_at, completed_at')
        .eq('user_id', userId)
        .in('package_id', packageIds)
        .order('started_at', { ascending: false })

      if (!attemptsError && attempts) {
        // Agrupar por package_id y tomar el intento más reciente
        attempts.forEach((attempt: any) => {
          if (!attemptsMap.has(attempt.package_id)) {
            attemptsMap.set(attempt.package_id, attempt)
          }
        })
        logger.log('✅ SCORM attempts fetched:', attempts.length)
      } else if (attemptsError) {
        logger.error('❌ Error fetching SCORM attempts:', attemptsError)
      }
    }

    // Transformar paquetes al formato esperado
    const transformedPackages: AssignedScormPackage[] = (packages || []).map((pkg: any) => {
      const attempt = attemptsMap.get(pkg.id)
      const manifestData = pkg.manifest_data || {}
      const objectives = manifestData.objectives || []

      // Calcular progreso basado en lesson_status
      let progress = 0
      let status: 'Asignado' | 'En progreso' | 'Completado' = 'Asignado'

      if (attempt) {
        const lessonStatus = attempt.lesson_status?.toLowerCase() || ''

        if (lessonStatus === 'completed' || lessonStatus === 'passed') {
          progress = 100
          status = 'Completado'
        } else if (lessonStatus === 'incomplete' || lessonStatus === 'browsed' || lessonStatus === 'not attempted') {
          // Estimar progreso basado en score si está disponible
          if (attempt.score_raw !== null && attempt.score_max !== null && attempt.score_max > 0) {
            progress = Math.round((attempt.score_raw / attempt.score_max) * 100)
          } else {
            progress = lessonStatus === 'not attempted' ? 0 : 25 // Valor por defecto para "browsed" o "incomplete"
          }
          status = progress > 0 ? 'En progreso' : 'Asignado'
        } else if (lessonStatus === 'failed') {
          progress = attempt.score_raw !== null && attempt.score_max !== null && attempt.score_max > 0
            ? Math.round((attempt.score_raw / attempt.score_max) * 100)
            : 50
          status = 'En progreso'
        }
      }

      // Generar thumbnail basado en el título
      let thumbnail = '📦'
      const title = pkg.title?.toLowerCase() || ''
      if (title.includes('seguridad') || title.includes('security')) thumbnail = '🔒'
      else if (title.includes('liderazgo') || title.includes('leadership')) thumbnail = '👔'
      else if (title.includes('ventas') || title.includes('sales')) thumbnail = '💼'
      else if (title.includes('comunicación') || title.includes('communication')) thumbnail = '💬'
      else if (title.includes('compliance') || title.includes('cumplimiento')) thumbnail = '📋'
      else if (title.includes('ética') || title.includes('ethics')) thumbnail = '⚖️'
      else if (title.includes('onboarding') || title.includes('inducción')) thumbnail = '🎯'
      else if (title.includes('técnico') || title.includes('technical')) thumbnail = '⚙️'

      return {
        id: pkg.id,
        title: pkg.title || 'Paquete SCORM sin título',
        description: pkg.description || manifestData.description || undefined,
        version: pkg.version as 'SCORM_1.2' | 'SCORM_2004',
        progress: progress,
        status: status,
        thumbnail: thumbnail,
        storage_path: pkg.storage_path,
        entry_point: pkg.entry_point,
        assigned_at: pkg.created_at,
        manifest_data: manifestData,
        objectives_count: objectives.length
      }
    })

    // Calcular estadísticas
    const stats: ScormPackageStats = {
      total: transformedPackages.length,
      in_progress: transformedPackages.filter(p => p.status === 'En progreso').length,
      completed: transformedPackages.filter(p => p.status === 'Completado').length
    }

    logger.log('✅ SCORM packages data prepared:', {
      stats,
      packagesCount: transformedPackages.length
    })

    return NextResponse.json({
      success: true,
      packages: transformedPackages,
      stats: stats
    })
  } catch (error) {
    logger.error('💥 Error in /api/business-user/scorm-packages:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener paquetes SCORM',
        packages: [],
        stats: {
          total: 0,
          in_progress: 0,
          completed: 0
        }
      },
      { status: 500 }
    )
  }
}
