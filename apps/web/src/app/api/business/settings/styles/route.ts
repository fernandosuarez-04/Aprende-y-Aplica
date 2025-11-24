import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireBusiness } from '@/lib/auth/requireBusiness';
import { PRESET_THEMES, getThemeById, generateBrandingTheme } from '@/features/business-panel/config/preset-themes';

export async function GET(request: NextRequest) {
  try {
    console.log('📡 [API /business/settings/styles GET] Request recibida');

    const auth = await requireBusiness();
    if (auth instanceof NextResponse) {
      console.log('❌ [API] requireBusiness falló - usuario no autorizado');
      return auth;
    }

    const { userId, organizationId } = auth;
    console.log('👤 [API] Auth info:', { userId, organizationId });

    const supabase = await createClient();

    if (!organizationId) {
      console.log('❌ [API] organizationId es undefined/null');
      return NextResponse.json(
        { success: false, error: 'Organización no encontrada' },
        { status: 404 }
      );
    }

    // Obtener estilos de la organización
    console.log('🔍 [API] Consultando estilos para organization:', organizationId);
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('panel_styles, user_dashboard_styles, login_styles, selected_theme')
      .eq('id', organizationId)
      .single();

    if (orgError || !organization) {
      console.log('❌ [API] Error al consultar BD:', orgError);
      return NextResponse.json(
        { success: false, error: 'Error al obtener estilos' },
        { status: 500 }
      );
    }

    console.log('✅ [API] Estilos obtenidos desde BD:', {
      selectedTheme: organization.selected_theme,
      hasPanelStyles: !!organization.panel_styles,
      hasUserDashboardStyles: !!organization.user_dashboard_styles,
      hasLoginStyles: !!organization.login_styles
    });

    return NextResponse.json({
      success: true,
      styles: {
        panel: organization.panel_styles || null,
        userDashboard: organization.user_dashboard_styles || null,
        login: organization.login_styles || null,
        selectedTheme: organization.selected_theme || null
      }
    });
  } catch (error: any) {
    console.error('❌ [API] Error en GET /api/business/settings/styles:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener estilos' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireBusiness();
    if (auth instanceof NextResponse) return auth;

    const { userId, organizationId } = auth;
    const supabase = await createClient();

    const body = await request.json();
    const { panel, userDashboard, login } = body;

    // Validar estructura de estilos
    const validateStyle = (style: any): boolean => {
      if (!style || typeof style !== 'object') return false;
      
      const requiredFields = ['background_type', 'background_value', 'primary_button_color', 'secondary_button_color', 'accent_color'];
      for (const field of requiredFields) {
        if (!style[field] || typeof style[field] !== 'string') {
          return false;
        }
      }

      // Validar formato de color hex
      const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
      if (!hexColorRegex.test(style.primary_button_color)) return false;
      if (!hexColorRegex.test(style.secondary_button_color)) return false;
      if (!hexColorRegex.test(style.accent_color)) return false;

      // Validar background_type
      if (!['image', 'color', 'gradient'].includes(style.background_type)) return false;

      return true;
    };

    // Validar estilos si se proporcionan
    if (panel && !validateStyle(panel)) {
      return NextResponse.json(
        { success: false, error: 'Estilos del panel inválidos' },
        { status: 400 }
      );
    }

    if (userDashboard && !validateStyle(userDashboard)) {
      return NextResponse.json(
        { success: false, error: 'Estilos del dashboard de usuario inválidos' },
        { status: 400 }
      );
    }

    if (login && !validateStyle(login)) {
      return NextResponse.json(
        { success: false, error: 'Estilos del login inválidos' },
        { status: 400 }
      );
    }

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'Organización no encontrada' },
        { status: 404 }
      );
    }

    // Construir objeto de actualización
    const updateData: any = {};
    if (panel !== undefined) updateData.panel_styles = panel;
    if (userDashboard !== undefined) updateData.user_dashboard_styles = userDashboard;
    if (login !== undefined) updateData.login_styles = login;

    // Actualizar estilos
    const { data: updatedOrg, error: updateError } = await supabase
      .from('organizations')
      .update(updateData)
      .eq('id', organizationId)
      .select('panel_styles, user_dashboard_styles, login_styles, selected_theme')
      .single();

    if (updateError || !updatedOrg) {
      return NextResponse.json(
        { success: false, error: 'Error al actualizar estilos' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      styles: {
        panel: updatedOrg.panel_styles || null,
        userDashboard: updatedOrg.user_dashboard_styles || null,
        login: updatedOrg.login_styles || null,
        selectedTheme: updatedOrg.selected_theme || null
      }
    });
  } catch (error: any) {
    // console.error('Error en PUT /api/business/settings/styles:', error);
    return NextResponse.json(
      { success: false, error: 'Error al actualizar estilos' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireBusiness();
    if (auth instanceof NextResponse) return auth;

    const { userId, organizationId } = auth;
    const supabase = await createClient();

    const body = await request.json();
    const { themeId } = body;

    if (!themeId || typeof themeId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'ID de tema requerido' },
        { status: 400 }
      );
    }

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'Organización no encontrada' },
        { status: 404 }
      );
    }

    // Obtener tema predefinido o generar tema de branding
    let theme;

    if (themeId === 'branding-personalizado') {
      // Para tema de branding, necesitamos obtener los colores de branding primero
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('brand_color_primary, brand_color_secondary, brand_color_accent')
        .eq('id', organizationId)
        .single();

      if (orgError || !orgData) {
        return NextResponse.json(
          { success: false, error: 'No se pudieron obtener los colores de branding' },
          { status: 500 }
        );
      }

      // Generar tema desde colores de branding
      theme = generateBrandingTheme({
        color_primary: orgData.brand_color_primary || '#3b82f6',
        color_secondary: orgData.brand_color_secondary || '#10b981',
        color_accent: orgData.brand_color_accent || '#8b5cf6'
      });
    } else {
      // Obtener tema predefinido
      theme = getThemeById(themeId);
      if (!theme) {
        return NextResponse.json(
          { success: false, error: 'Tema no encontrado' },
          { status: 404 }
        );
      }
    }

    // Aplicar tema
    const { data: updatedOrg, error: updateError } = await supabase
      .from('organizations')
      .update({
        panel_styles: theme.panel,
        user_dashboard_styles: theme.userDashboard,
        login_styles: theme.login,
        selected_theme: themeId
      })
      .eq('id', organizationId)
      .select('panel_styles, user_dashboard_styles, login_styles, selected_theme')
      .single();

    if (updateError || !updatedOrg) {
      return NextResponse.json(
        { success: false, error: 'Error al aplicar tema' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      styles: {
        panel: updatedOrg.panel_styles || null,
        userDashboard: updatedOrg.user_dashboard_styles || null,
        login: updatedOrg.login_styles || null,
        selectedTheme: updatedOrg.selected_theme || null
      }
    });
  } catch (error: any) {
    // console.error('Error en POST /api/business/settings/styles:', error);
    return NextResponse.json(
      { success: false, error: 'Error al aplicar tema' },
      { status: 500 }
    );
  }
}

