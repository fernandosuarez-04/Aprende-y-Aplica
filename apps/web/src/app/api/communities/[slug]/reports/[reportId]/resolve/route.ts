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
  resolution_action: z.enum(['delete_post', 'hide_post', 'unhide_post', 'ignore_report', 'warn_user', 'false_report', 'warn_reporter']).optional().nullable(),
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
        .select('id, community_id, user_id, is_hidden')
        .eq('id', report.post_id)
        .single()
      
      if (postError) {
        console.error('❌ Error fetching post:', postError)
        // Si la acción requiere el post y no se puede obtener, retornar error
        if (resolution_action === 'delete_post' || resolution_action === 'hide_post') {
          return NextResponse.json(
            { error: 'No se pudo obtener el post asociado al reporte', details: postError.message },
            { status: 404 }
          )
        }
      } else {
        post = postData
        console.log('✅ Post found:', { postId: post.id, is_hidden: post.is_hidden })
      }
    }

    // Revertir acción previa si el reporte ya tenía una resolución diferente
    const previousAction = report.resolution_action
    if (previousAction && post) {
      console.log('🔄 Reverting previous action:', previousAction, 'to:', resolution_action)
      
      // Si el post estaba oculto (hide_post) y se cambia a otra acción que no es hide_post ni unhide_post, mostrarlo de nuevo
      if (previousAction === 'hide_post' && resolution_action !== 'hide_post' && resolution_action !== 'unhide_post' && post.is_hidden) {
        console.log('👁️ Showing previously hidden post:', post.id)
        const { error: unhideError } = await adminSupabase
          .from('community_posts')
          .update({ is_hidden: false, updated_at: new Date().toISOString() })
          .eq('id', post.id)

        if (unhideError) {
          console.error('❌ Error showing post:', unhideError)
          // No fallar la operación, solo loguear el error
        } else {
          console.log('✅ Post shown successfully')
          // Actualizar el objeto post local
          post.is_hidden = false
        }
      }
      
      // Si el reporte tenía unhide_post y se cambia a hide_post, no necesitamos revertir nada
      // porque hide_post manejará el ocultamiento del post
      // Si el reporte tenía hide_post y se cambia a unhide_post, no necesitamos revertir nada
      // porque unhide_post manejará el mostrado del post
      
      // Si el reporte tenía unhide_post y se cambia a otra acción (no hide_post), no hacer nada
      // porque el post ya está visible
      
      // Nota: Si el post fue eliminado (delete_post), no se puede revertir
      // ya que el post ya no existe en la base de datos
      // En ese caso, solo se puede cambiar el estado del reporte, no la acción
    } else if (previousAction === 'delete_post' && !post && resolution_action !== 'delete_post') {
      // Si el post fue eliminado previamente y se intenta cambiar a otra acción,
      // informar que no es posible porque el post ya no existe
      console.warn('⚠️ Cannot change verdict: post was previously deleted')
      return NextResponse.json(
        { error: 'No se puede cambiar el veredicto: el post ya fue eliminado y no se puede revertir esta acción' },
        { status: 400 }
      )
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
    if (resolution_action === 'delete_post') {
      if (!post) {
        return NextResponse.json(
          { error: 'El post asociado al reporte no existe o ya fue eliminado' },
          { status: 404 }
        )
      }
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
    } else if (resolution_action === 'hide_post') {
      if (!post) {
        return NextResponse.json(
          { error: 'El post asociado al reporte no existe o ya fue eliminado' },
          { status: 404 }
        )
      }
      console.log('👁️ Hiding post:', post.id, 'Current state:', { is_hidden: post.is_hidden, previousAction })
      // Ocultar el post (siempre, incluso si ya está oculto, para asegurar el estado correcto)
      // Esto permite cambiar de unhide_post a hide_post
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
      // Actualizar el objeto post local
      post.is_hidden = true
    } else if (resolution_action === 'unhide_post') {
      if (!post) {
        return NextResponse.json(
          { error: 'El post asociado al reporte no existe o ya fue eliminado' },
          { status: 404 }
        )
      }
      console.log('👁️ Unhiding post:', post.id, 'Current state:', { is_hidden: post.is_hidden, previousAction })
      // Mostrar el post (siempre, incluso si ya está visible, para asegurar el estado correcto)
      // Esto permite cambiar de hide_post a unhide_post
      const { error: unhideError } = await adminSupabase
        .from('community_posts')
        .update({ is_hidden: false, updated_at: new Date().toISOString() })
        .eq('id', post.id)

      if (unhideError) {
        console.error('❌ Error unhiding post:', unhideError)
        return NextResponse.json(
          { error: 'Error al mostrar el post', details: unhideError.message },
          { status: 500 }
        )
      }
      console.log('✅ Post unhidden successfully')
      // Actualizar el objeto post local
      post.is_hidden = false
    } else if (resolution_action === 'warn_reporter') {
      // Manejar reporte falso con advertencia: advertir al usuario que reportó
      console.log('⚠️ Handling false report with warning, warning reporter:', report.reported_by_user_id)
      
      // Importar función de moderación para registrar advertencia
      const { registerWarning } = await import('@/lib/moderation')
      
      // Registrar advertencia al usuario que hizo el reporte falso
      const warningMessage = 'Reporte falso: Has reportado contenido que no viola las normas de la comunidad. Los reportes falsos repetidos pueden resultar en restricciones.'
      
      try {
        const warningResult = await registerWarning(
          report.reported_by_user_id,
          warningMessage,
          'report',
          adminSupabase
        )
        
        console.log('✅ Warning registered for false report:', {
          userId: report.reported_by_user_id,
          warningCount: warningResult.warningCount,
          userBanned: warningResult.userBanned
        })
        
        // Si el usuario fue baneado por múltiples reportes falsos
        if (warningResult.userBanned) {
          console.log('🚫 User banned due to multiple false reports')
        }
      } catch (warningError) {
        console.error('❌ Error registering warning for false report:', warningError)
        // No fallar la operación si hay error al registrar la advertencia
        // pero loguear el error
      }
    } else if (resolution_action === 'false_report') {
      // Manejar reporte falso sin advertencia: solo marcar como falso, sin penalizar
      console.log('ℹ️ Marking report as false (no warning):', report.id)
      // No registrar advertencia, solo actualizar el estado del reporte
    }

    // Actualizar el reporte
    const updateData: any = {
      status,
      reviewed_by_user_id: user.id,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Siempre actualizar resolution_action, incluso si es null (para permitir limpiar el veredicto)
    // Usar undefined si no se proporciona, para no sobrescribir si no se quiere cambiar
    if (resolution_action !== undefined) {
      updateData.resolution_action = resolution_action
    }
    // Siempre actualizar resolution_notes, incluso si es null (para permitir limpiar las notas)
    if (resolution_notes !== undefined) {
      updateData.resolution_notes = resolution_notes ? resolution_notes.trim() : null
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
      
      // Detectar si es un error de constraint
      const isConstraintError = updateError.message?.includes('check constraint') || 
                                updateError.message?.includes('resolution_action_check') ||
                                updateError.code === '23514'
      
      let errorMessage = 'Error al actualizar el reporte'
      let errorDetails = updateError.message || 'Error desconocido'
      
      if (isConstraintError && resolution_action === 'unhide_post') {
        errorMessage = 'Error: La acción "unhide_post" no está permitida en la base de datos'
        errorDetails = 'Es necesario actualizar el constraint de la base de datos. Ejecuta el script: scripts/supabase/update-resolution-action-constraint.sql'
      }
      
      return NextResponse.json(
        { 
          error: errorMessage,
          details: errorDetails,
          code: updateError.code,
          constraintError: isConstraintError
        },
        { status: 500 }
      )
    }

    console.log('✅ Report updated successfully:', { reportId, status })

    // Obtener el post actualizado después de cualquier cambio de visibilidad
    let updatedPost = post
    try {
      if (report.post_id && (resolution_action === 'hide_post' || resolution_action === 'unhide_post')) {
        const { data: freshPost, error: freshPostError } = await adminSupabase
          .from('community_posts')
          .select('id, content, created_at, updated_at, user_id, attachment_url, attachment_type, attachment_data, likes_count, comment_count, reaction_count, is_pinned, is_hidden, is_edited')
          .eq('id', report.post_id)
          .single()
        
        if (freshPostError) {
          console.error('❌ Error fetching fresh post:', freshPostError)
          // Continuar con el post original si hay error
        } else if (freshPost) {
          updatedPost = freshPost
        }
      }
    } catch (error) {
      console.error('❌ Error getting updated post:', error)
      // Continuar con el post original si hay error
    }

    // Enriquecer el reporte con información relacionada
    const enrichedReport: any = { ...updatedReport }

    // Obtener información del post
    try {
      if (updatedPost) {
        enrichedReport.post = updatedPost

        // Obtener información del autor del post
        if (updatedPost.user_id) {
          try {
            const { data: author, error: authorError } = await adminSupabase
              .from('users')
              .select('id, username, first_name, last_name, profile_picture_url, email')
              .eq('id', updatedPost.user_id)
              .single()

            if (authorError) {
              console.error('❌ Error fetching post author:', authorError)
            } else if (author) {
              enrichedReport.post.author = author
            }
          } catch (error) {
            console.error('❌ Error getting post author:', error)
          }
        }
      }
    } catch (error) {
      console.error('❌ Error enriching post data:', error)
    }

    // Obtener información del usuario que reportó
    try {
      if (updatedReport.reported_by_user_id) {
        const { data: reportedBy, error: reportedByError } = await adminSupabase
          .from('users')
          .select('id, username, first_name, last_name, profile_picture_url, email')
          .eq('id', updatedReport.reported_by_user_id)
          .single()
        
        if (reportedByError) {
          console.error('❌ Error fetching reported by user:', reportedByError)
        } else if (reportedBy) {
          enrichedReport.reported_by = reportedBy
        }
      }
    } catch (error) {
      console.error('❌ Error getting reported by user:', error)
    }

    // Obtener información del usuario que revisó
    try {
      if (updatedReport.reviewed_by_user_id) {
        const { data: reviewedBy, error: reviewedByError } = await adminSupabase
          .from('users')
          .select('id, username, first_name, last_name, email')
          .eq('id', updatedReport.reviewed_by_user_id)
          .single()
        
        if (reviewedByError) {
          console.error('❌ Error fetching reviewed by user:', reviewedByError)
        } else if (reviewedBy) {
          enrichedReport.reviewed_by = reviewedBy
        }
      }
    } catch (error) {
      console.error('❌ Error getting reviewed by user:', error)
    }

    logger.info('Report resolved successfully', {
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
    console.error('❌ Unexpected error in resolve report:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}

