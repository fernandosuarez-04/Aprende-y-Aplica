import { NextRequest, NextResponse } from 'next/server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

/**
 * GET /api/business/settings/branding
 * Obtiene la configuración de branding de la organización
 */
export async function GET() {
  try {
    const auth = await requireBusiness()
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return NextResponse.json({
        success: false,
        error: 'Usuario no pertenece a ninguna organización'
      }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, logo_url, brand_color_primary, brand_color_secondary, brand_color_accent, brand_font_family, brand_logo_url, brand_favicon_url')
      .eq('id', auth.organizationId)
      .single()

    if (orgError || !organization) {
      logger.error('Error fetching organization branding:', orgError)
      return NextResponse.json({
        success: false,
        error: 'Error al obtener configuración de branding'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      branding: {
        logo_url: organization.brand_logo_url || organization.logo_url || null,
        favicon_url: organization.brand_favicon_url || null,
        color_primary: organization.brand_color_primary || '#3b82f6',
        color_secondary: organization.brand_color_secondary || '#10b981',
        color_accent: organization.brand_color_accent || '#8b5cf6',
        font_family: organization.brand_font_family || 'Inter'
      }
    })
  } catch (error) {
    logger.error('💥 Error in /api/business/settings/branding GET:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}

/**
 * PUT /api/business/settings/branding
 * Actualiza la configuración de branding de la organización
 */
export async function PUT(request: NextRequest) {
  try {
    const auth = await requireBusiness()
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return NextResponse.json({
        success: false,
        error: 'Usuario no pertenece a ninguna organización'
      }, { status: 400 })
    }

    const supabase = await createClient()
    const body = await request.json()
    const { logo_url, favicon_url, color_primary, color_secondary, color_accent, font_family } = body

    // Validar colores hexadecimales si se proporcionan
    const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
    
    if (color_primary && !colorRegex.test(color_primary)) {
      return NextResponse.json({
        success: false,
        error: 'El color primario debe ser un valor hexadecimal válido (ej: #3b82f6)'
      }, { status: 400 })
    }

    if (color_secondary && !colorRegex.test(color_secondary)) {
      return NextResponse.json({
        success: false,
        error: 'El color secundario debe ser un valor hexadecimal válido'
      }, { status: 400 })
    }

    if (color_accent && !colorRegex.test(color_accent)) {
      return NextResponse.json({
        success: false,
        error: 'El color de acento debe ser un valor hexadecimal válido'
      }, { status: 400 })
    }

    // Validar fuente (permitir fuentes comunes de Google Fonts o web-safe)
    const validFonts = ['Inter', 'Montserrat', 'Roboto', 'Open Sans', 'Lato', 'Poppins', 'Raleway', 'Source Sans Pro', 'Arial', 'Helvetica', 'Times New Roman', 'Georgia']
    if (font_family && !validFonts.includes(font_family) && !font_family.match(/^[a-zA-Z\s]+$/)) {
      return NextResponse.json({
        success: false,
        error: 'La fuente debe ser una fuente válida'
      }, { status: 400 })
    }

    // Preparar datos de actualización
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (logo_url !== undefined) updateData.brand_logo_url = logo_url || null
    if (favicon_url !== undefined) updateData.brand_favicon_url = favicon_url || null
    if (color_primary !== undefined) updateData.brand_color_primary = color_primary || '#3b82f6'
    if (color_secondary !== undefined) updateData.brand_color_secondary = color_secondary || '#10b981'
    if (color_accent !== undefined) updateData.brand_color_accent = color_accent || '#8b5cf6'
    if (font_family !== undefined) updateData.brand_font_family = font_family || 'Inter'

    // Actualizar organización
    const { data: updatedOrg, error: updateError } = await supabase
      .from('organizations')
      .update(updateData)
      .eq('id', auth.organizationId)
      .select('brand_logo_url, brand_favicon_url, brand_color_primary, brand_color_secondary, brand_color_accent, brand_font_family, logo_url')
      .single()

    if (updateError || !updatedOrg) {
      logger.error('Error updating branding:', updateError)
      return NextResponse.json({
        success: false,
        error: 'Error al actualizar configuración de branding'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      branding: {
        logo_url: updatedOrg.brand_logo_url || updatedOrg.logo_url || null,
        favicon_url: updatedOrg.brand_favicon_url || null,
        color_primary: updatedOrg.brand_color_primary || '#3b82f6',
        color_secondary: updatedOrg.brand_color_secondary || '#10b981',
        color_accent: updatedOrg.brand_color_accent || '#8b5cf6',
        font_family: updatedOrg.brand_font_family || 'Inter'
      }
    })
  } catch (error) {
    logger.error('💥 Error in /api/business/settings/branding PUT:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}

