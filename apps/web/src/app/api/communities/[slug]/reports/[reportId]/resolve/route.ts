import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { SessionService } from '@/features/auth/services/session.service'
import { canModerateCommunity } from '@/lib/auth/communityPermissions'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { logger } from '@/lib/logger'
import { z } from 'zod'
import type { Database } from '@/lib/supabase/types'

// Schema de validación para la resolución
const resolveSchema = z.object({
  status: z.enum(['reviewed', 'resolved', 'ignored']),
  resolution_action: z.enum(['delete_post', 'hide_post', 'ignore_report', 'warn_user']).optional().nullable(),
  resolution_notes: z.string().optional().nullable(),
})

/**
 * PATCH /api/communities/[slug]/reports/[reportId]/resolve
 * Resuelve un reporte (solo admins, owners y moderadores)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; reportId: string }> }
) {
  try {
    console.log('📥 PATCH /api/communities/[slug]/reports/[reportId]/resolve - Request received')
    const supabase = await createClient()
    const { slug, reportId } = await params
    console.log('📋 Route params:', { slug, reportId })
    const user = await SessionService.getCurrentUser()

    if (!user) {
      console.error('❌ User not authenticated')
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    console.log('✅ User authenticated:', user.id)

    // Validar body
    const body = await request.json()
    console.log('📦 Request body:', body)
    const validationResult = resolveSchema.safeParse(body)

    if (!validationResult.success) {
      console.error('❌ Validation error:', validationResult.error.errors)
      return NextResponse.json(
        { error: 'Datos inválidos', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { status, resolution_action, resolution_notes } = validationResult.data
    console.log('✅ Validated data:', { status, resolution_action, resolution_notes })

    // Usar cliente admin para bypass RLS
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

    // Obtener el reporte
    const { data: report, error: reportError } = await adminSupabase
      .from('community_post_reports')
      .select('*')
      .eq('id', reportId)
      .single()

    if (reportError || !report) {
      console.error('❌ Error fetching report:', reportError)
      return NextResponse.json(
        { error: 'Reporte no encontrado' },
        { status: 404 }
      )
    }

    console.log('✅ Report found:', { reportId: report.id, communityId: report.community_id, postId: report.post_id })

    // Obtener la comunidad para verificar el slug
    const { data: community, error: communityError } = await adminSupabase
      .from('communities')
      .select('id, slug')
      .eq('id', report.community_id)
      .single()

    if (communityError || !community) {
      console.error('❌ Error fetching community:', communityError)
      return NextResponse.json(
        { error: 'Comunidad no encontrada' },
        { status: 404 }
      )
    }

    // Verificar que el slug coincida
    if (community.slug !== slug) {
      console.error('❌ Slug mismatch:', { expected: slug, actual: community.slug })
      return NextResponse.json(
        { error: 'El reporte no pertenece a esta comunidad' },
        { status: 400 }
      )
    }

    // Obtener el post si es necesario
    let post = null
    if (report.post_id) {
      const { data: postData, error: postError } = await adminSupabase
        .from('community_posts')
        .select('id, community_id, user_id')
        .eq('id', report.post_id)
        .single()
      
      if (postError) {
        console.error('❌ Error fetching post:', postError)
      } else {
        post = postData
        console.log('✅ Post found:', { postId: post.id })
      }
    }

    // Verificar permisos: admin global o moderador de la comunidad
    const isAdmin = user.cargo_rol?.toLowerCase() === 'administrador'
    let hasPermission = false

    if (isAdmin) {
      // Verificar que sea admin real
      const adminAuth = await requireAdmin()
      hasPermission = !(adminAuth instanceof NextResponse)
    } else {
      // Verificar permisos de moderación
      hasPermission = await canModerateCommunity(user.id, community.id)
    }

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'No tienes permisos para resolver este reporte' },
        { status: 403 }
      )
    }

    // Ejecutar acción según resolution_action
    if (resolution_action === 'delete_post' && post) {
      console.log('🗑️ Deleting post:', post.id)
      // Eliminar el post
      const { error: deleteError } = await adminSupabase
        .from('community_posts')
        .delete()
        .eq('id', post.id)

      if (deleteError) {
        console.error('❌ Error deleting post:', deleteError)
        return NextResponse.json(
          { error: 'Error al eliminar el post', details: deleteError.message },
          { status: 500 }
        )
      }
      console.log('✅ Post deleted successfully')
    } else if (resolution_action === 'hide_post' && post) {
      console.log('👁️ Hiding post:', post.id)
      // Ocultar el post
      const { error: hideError } = await adminSupabase
        .from('community_posts')
        .update({ is_hidden: true, updated_at: new Date().toISOString() })
        .eq('id', post.id)

      if (hideError) {
        console.error('❌ Error hiding post:', hideError)
        return NextResponse.json(
          { error: 'Error al ocultar el post', details: hideError.message },
          { status: 500 }
        )
      }
      console.log('✅ Post hidden successfully')
    }

    // Actualizar el reporte
    const updateData: any = {
      status,
      reviewed_by_user_id: user.id,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    if (resolution_action) {
      updateData.resolution_action = resolution_action
    }
    if (resolution_notes) {
      updateData.resolution_notes = resolution_notes.trim()
    }

    console.log('📝 Updating report with data:', updateData)

    const { data: updatedReport, error: updateError } = await adminSupabase
      .from('community_post_reports')
      .update(updateData)
      .eq('id', reportId)
      .select('*')
      .single()

    if (updateError) {
      console.error('❌ Error updating report:', {
        error: updateError,
        code: updateError.code,
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint
      })
      return NextResponse.json(
        { 
          error: 'Error al actualizar el reporte',
          details: updateError.message || 'Error desconocido',
          code: updateError.code
        },
        { status: 500 }
      )
    }

    console.log('✅ Report updated successfully:', { reportId, status })

    // Enriquecer el reporte con información relacionada
    const enrichedReport: any = { ...updatedReport }

    // Obtener información del post
    if (post) {
      enrichedReport.post = post
    }

    // Obtener información del post
    if (post) {
      enrichedReport.post = post

      // Obtener información del autor del post
      if (post.user_id) {
        const { data: author } = await adminSupabase
          .from('users')
          .select('id, username, first_name, last_name, profile_picture_url, email')
          .eq('id', post.user_id)
          .single()

        if (author) {
          enrichedReport.post.author = author
        }
      }
    }

    // Obtener información del usuario que reportó
    if (updatedReport.reported_by_user_id) {
      const { data: reportedBy } = await adminSupabase
        .from('users')
        .select('id, username, first_name, last_name, profile_picture_url, email')
        .eq('id', updatedReport.reported_by_user_id)
        .single()
      if (reportedBy) {
        enrichedReport.reported_by = reportedBy
      }
    }

    // Obtener información del usuario que revisó
    if (updatedReport.reviewed_by_user_id) {
      const { data: reviewedBy } = await adminSupabase
        .from('users')
        .select('id, username, first_name, last_name, email')
        .eq('id', updatedReport.reviewed_by_user_id)
        .single()
      if (reviewedBy) {
        enrichedReport.reviewed_by = reviewedBy
      }
    }

    logger.log('Report resolved successfully', {
      reportId,
      status,
      resolution_action,
      userId: user.id
    })

    return NextResponse.json({
      success: true,
      report: enrichedReport,
      message: 'Reporte resuelto exitosamente'
    })
  } catch (error) {
    logger.error('Error in PATCH resolve report API:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

