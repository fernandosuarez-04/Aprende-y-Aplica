import { NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger'
import { createClient } from '@/lib/supabase/server'
import { requireInstructor } from '@/lib/auth/requireAdmin'

export async function GET() {
  try {
    // ✅ SEGURIDAD: Verificar autenticación y autorización de instructor
    const auth = await requireInstructor()
    if (auth instanceof NextResponse) return auth
    
    const instructorId = auth.userId
    const supabase = await createClient()

    logger.log('🔄 Obteniendo estadísticas de comunidades del instructor:', instructorId)

    // Obtener solo las comunidades del instructor actual
    const { data, error } = await supabase
      .from('community_stats')
      .select('*')
      .eq('creator_id', instructorId) // ✅ Solo comunidades del instructor

    if (error) {
      logger.error('❌ Error fetching instructor community stats:', error)
      return NextResponse.json(
        { error: 'Failed to fetch community stats' },
        { status: 500 }
      )
    }

    // Calcular estadísticas solo para las comunidades del instructor
    const stats = (data || []).reduce(
      (acc, row) => ({
        totalCommunities: acc.totalCommunities + 1,
        activeCommunities: acc.activeCommunities + (row.is_active ? 1 : 0),
        totalMembers: acc.totalMembers + (row.members_count || 0),
        totalPosts: acc.totalPosts + (row.posts_count || 0),
        totalComments: acc.totalComments + (row.comments_count || 0),
        totalVideos: acc.totalVideos + (row.videos_count || 0),
        totalAccessRequests: acc.totalAccessRequests + (row.pending_requests_count || 0)
      }),
      {
        totalCommunities: 0,
        activeCommunities: 0,
        totalMembers: 0,
        totalPosts: 0,
        totalComments: 0,
        totalVideos: 0,
        totalAccessRequests: 0
      }
    )

    logger.log('✅ Estadísticas de comunidades del instructor calculadas:', stats)
    return NextResponse.json({ stats }, { status: 200 })
  } catch (error) {
    logger.error('💥 Error fetching instructor community stats:', error)
    return NextResponse.json(
      { message: 'Error fetching community stats' },
      { status: 500 }
    )
  }
}

