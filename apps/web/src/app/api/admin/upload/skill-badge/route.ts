import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import { requireAuth } from '@/lib/auth/requireAuth'

/**
 * POST /api/admin/upload/skill-badge
 * Subir imagen de badge para un nivel específico de skill
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    // Verificar que es administrador
    if (auth.user.cargo_rol !== 'Administrador') {
      return NextResponse.json({
        success: false,
        error: 'No tienes permisos para subir badges'
      }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const skillId = formData.get('skillId') as string
    const level = formData.get('level') as string
    const skillSlug = formData.get('skillSlug') as string

    if (!file || !skillId || !level || !skillSlug) {
      return NextResponse.json({
        success: false,
        error: 'Faltan parámetros requeridos (file, skillId, level, skillSlug)'
      }, { status: 400 })
    }

    // Validar tipo de archivo (solo PNG)
    if (file.type !== 'image/png') {
      return NextResponse.json({
        success: false,
        error: 'Solo se permiten archivos PNG'
      }, { status: 400 })
    }

    // Validar tamaño (máximo 2MB)
    const maxSize = 2 * 1024 * 1024 // 2MB
    if (file.size > maxSize) {
      return NextResponse.json({
        success: false,
        error: 'El archivo no puede ser mayor a 2MB'
      }, { status: 400 })
    }

    // Validar nivel
    const validLevels = ['green', 'bronze', 'silver', 'gold', 'diamond']
    if (!validLevels.includes(level)) {
      return NextResponse.json({
        success: false,
        error: 'Nivel inválido'
      }, { status: 400 })
    }

    const supabase = await createClient()

    // Generar nombre de archivo: {skill-slug}-{level}.png
    const fileName = `${skillSlug}-${level}.png`

    // Convertir File a Buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Subir el archivo al bucket Skills
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('Skills')
      .upload(fileName, buffer, {
        cacheControl: '3600',
        upsert: true, // Permitir sobrescribir si existe
        contentType: 'image/png'
      })

    if (uploadError) {
      logger.error('Error uploading badge to storage:', uploadError)
      return NextResponse.json({
        success: false,
        error: 'Error al subir el badge al storage'
      }, { status: 500 })
    }

    // Obtener la URL pública del archivo
    const { data: urlData } = supabase.storage
      .from('Skills')
      .getPublicUrl(fileName)

    // Guardar o actualizar en la tabla skill_badges
    const { data: badgeData, error: badgeError } = await supabase
      .from('skill_badges')
      .upsert({
        skill_id: skillId,
        level: level,
        badge_url: urlData.publicUrl,
        storage_path: fileName,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'skill_id,level'
      })
      .select()
      .single()

    if (badgeError) {
      logger.error('Error saving badge to database:', badgeError)
      // Intentar eliminar el archivo subido si falla la BD
      await supabase.storage.from('Skills').remove([fileName])
      return NextResponse.json({
        success: false,
        error: 'Error al guardar el badge en la base de datos'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      badge: {
        id: badgeData.id,
        skill_id: badgeData.skill_id,
        level: badgeData.level,
        badge_url: badgeData.badge_url,
        storage_path: badgeData.storage_path
      }
    })
  } catch (error) {
    logger.error('💥 Error in /api/admin/upload/skill-badge POST:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}

