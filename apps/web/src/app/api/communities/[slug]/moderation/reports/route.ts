import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { SessionService } from '@/features/auth/services/session.service'
import { canModerateCommunity } from '@/lib/auth/communityPermissions'
import { logger } from '@/lib/logger'
import type { Database } from '@/lib/supabase/types'

/**
 * GET /api/communities/[slug]/moderation/reports
 * Obtiene reportes de una comunidad (solo owners y moderadores)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    console.log('📥 GET /api/communities/[slug]/moderation/reports - Request received')
    const supabase = await createClient()
    const { slug } = await params
    console.log('📋 Route params:', { slug })
    const user = await SessionService.getCurrentUser()

    if (!user) {
      console.error('❌ User not authenticated')
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    console.log('✅ User authenticated:', user.id)

    const { searchParams } = new URL(request.url)
    
    // Filtros opcionales
    const status = searchParams.get('status') // pending, reviewed, resolved, ignored
    const reasonCategory = searchParams.get('reason_category')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    console.log('🔍 Filters:', { status, reasonCategory, limit, offset })

    // Obtener la comunidad por slug
    const { data: community, error: communityError } = await supabase
      .from('communities')
      .select('id')
      .eq('slug', slug)
      .single()

    if (communityError || !community) {
      console.error('❌ Error fetching community:', communityError)
      return NextResponse.json(
        { error: 'Comunidad no encontrada' },
        { status: 404 }
      )
    }

    console.log('✅ Community found:', { communityId: community.id, slug })

    // Verificar permisos de moderación
    const canModerate = await canModerateCommunity(user.id, community.id)
    console.log('🔐 Can moderate:', canModerate)
    if (!canModerate) {
      console.error('❌ User does not have moderation permissions')
      return NextResponse.json(
        { error: 'No tienes permisos para moderar esta comunidad' },
        { status: 403 }
      )
    }

    // Usar cliente admin para bypass RLS ya que el proyecto usa autenticación personalizada
    // La validación de permisos ya se hizo arriba con canModerateCommunity
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseServiceKey) {
      console.error('❌ SUPABASE_SERVICE_ROLE_KEY no está configurada')
      return NextResponse.json(
        { 
          error: 'Error de configuración del servidor',
          details: 'Service role key no configurada'
        },
        { status: 500 }
      )
    }

    const adminSupabase = createServiceClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseServiceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Construir query base - simplificada primero
    console.log('🔍 Querying reports for community:', {
      communityId: community.id,
      slug,
      status,
      reasonCategory,
      limit,
      offset
    })

    // Primero verificar si hay reportes sin filtros para debug
    const { data: allReports, error: allReportsError } = await adminSupabase
      .from('community_post_reports')
      .select('id, community_id, post_id, status')
      .eq('community_id', community.id)

    console.log('📊 All reports for community (debug):', {
      count: allReports?.length || 0,
      reports: allReports,
      error: allReportsError
    })

    let query = adminSupabase
      .from('community_post_reports')
      .select('*')
      .eq('community_id', community.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Aplicar filtros
    if (status) {
      query = query.eq('status', status)
    }
    if (reasonCategory) {
      query = query.eq('reason_category', reasonCategory)
    }

    const { data: reports, error: reportsError } = await query

    if (reportsError) {
      console.error('❌ Error fetching reports:', {
        error: reportsError,
        message: reportsError.message,
        code: reportsError.code,
        details: reportsError.details,
        hint: reportsError.hint
      })
      
      return NextResponse.json(
        { 
          error: 'Error al obtener reportes',
          details: reportsError.message || 'Error desconocido',
          code: reportsError.code
        },
        { status: 500 }
      )
    }

    console.log('📊 Reports found:', reports?.length || 0)

    // Enriquecer reportes con información relacionada
    const enrichedReports = await Promise.all(
      (reports || []).map(async (report) => {
        const enriched: any = { ...report }

        // Obtener información del post con todos los detalles
        if (report.post_id) {
          const { data: post } = await adminSupabase
            .from('community_posts')
            .select('id, content, created_at, updated_at, user_id, attachment_url, attachment_type, attachment_data, likes_count, comment_count, reaction_count, is_pinned, is_hidden, is_edited')
            .eq('id', report.post_id)
            .single()

          if (post) {
            enriched.post = post

            // Obtener información del autor del post
            if (post.user_id) {
              const { data: author } = await adminSupabase
                .from('users')
                .select('id, username, first_name, last_name, profile_picture_url, email')
                .eq('id', post.user_id)
                .single()

              if (author) {
                enriched.post.author = author
              }
            }

            // Procesar attachments si existen
            if (post.attachment_url || post.attachment_type) {
              enriched.post.attachments = []
              
              // Si hay attachment_url, agregarlo a attachments
              if (post.attachment_url) {
                enriched.post.attachments.push({
                  url: post.attachment_url,
                  type: post.attachment_type || 'unknown',
                  name: post.attachment_data?.name || 'Archivo adjunto'
                })
              }

              // Si attachment_data tiene múltiples attachments
              if (post.attachment_data?.isMultiple && post.attachment_data?.attachments) {
                enriched.post.attachments = post.attachment_data.attachments.map((att: any) => ({
                  url: att.attachment_url,
                  type: att.attachment_type || 'unknown',
                  name: att.attachment_data?.name || 'Archivo adjunto'
                }))
              }
            }

            // Extraer links del contenido si existen
            if (post.content) {
              const urlRegex = /(https?:\/\/[^\s]+)/g
              const links = post.content.match(urlRegex) || []
              if (links.length > 0) {
                enriched.post.links = links.map((url: string) => ({
                  url,
                  title: url
                }))
              }
            }
          }
        }

        // Obtener información del usuario que reportó
        if (report.reported_by_user_id) {
          const { data: reportedBy } = await adminSupabase
            .from('users')
            .select('id, username, first_name, last_name, profile_picture_url, email')
            .eq('id', report.reported_by_user_id)
            .single()

          if (reportedBy) {
            enriched.reported_by = reportedBy
          }
        }

        // Obtener información del usuario que revisó
        if (report.reviewed_by_user_id) {
          const { data: reviewedBy } = await adminSupabase
            .from('users')
            .select('id, username, first_name, last_name, email')
            .eq('id', report.reviewed_by_user_id)
            .single()

          if (reviewedBy) {
            enriched.reviewed_by = reviewedBy
          }
        }

        return enriched
      })
    )

    // Obtener total de reportes para paginación
    let countQuery = adminSupabase
      .from('community_post_reports')
      .select('id', { count: 'exact', head: true })
      .eq('community_id', community.id)

    if (status) {
      countQuery = countQuery.eq('status', status)
    }
    if (reasonCategory) {
      countQuery = countQuery.eq('reason_category', reasonCategory)
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      console.error('❌ Error counting reports:', countError)
    }

    console.log('✅ Returning reports:', {
      count: enrichedReports?.length || 0,
      total: count || 0,
      hasMore: (count || 0) > offset + limit
    })

    return NextResponse.json({
      success: true,
      reports: enrichedReports || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    })
  } catch (error) {
    logger.error('Error in GET moderation reports API:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

