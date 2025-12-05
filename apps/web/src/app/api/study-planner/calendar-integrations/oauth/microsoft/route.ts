import { NextRequest, NextResponse } from 'next/server';
import { SessionService } from '@/features/auth/services/session.service';
import { randomBytes } from 'crypto';

/**
 * GET /api/study-planner/calendar-integrations/oauth/microsoft
 * Inicia el flujo OAuth con Microsoft Calendar
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Iniciando OAuth de Microsoft Calendar...');
    
    const currentUser = await SessionService.getCurrentUser();
    
    if (!currentUser) {
      console.error('❌ Usuario no autenticado');
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    console.log('✅ Usuario autenticado:', currentUser.id);

    // Verificar variables de entorno con logging detallado
    // Aceptar tanto MICROSOFT_CALENDAR_CLIENT_ID como MICROSOFT_CLIENT_ID (fallback)
    const clientId = process.env.MICROSOFT_CALENDAR_CLIENT_ID || process.env.MICROSOFT_CLIENT_ID;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const redirectUri = `${appUrl}/api/study-planner/calendar-integrations/oauth/microsoft/callback`;
    const scope = 'Calendars.ReadWrite offline_access';
    
    console.log('🔑 Variables de entorno:', {
      hasClientId: !!clientId,
      clientIdLength: clientId?.length || 0,
      usingMICROSOFT_CALENDAR_CLIENT_ID: !!process.env.MICROSOFT_CALENDAR_CLIENT_ID,
      usingMICROSOFT_CLIENT_ID: !!process.env.MICROSOFT_CLIENT_ID && !process.env.MICROSOFT_CALENDAR_CLIENT_ID,
      appUrl,
      redirectUri,
    });
    
    if (!clientId) {
      console.error('❌ No se encontró MICROSOFT_CALENDAR_CLIENT_ID ni MICROSOFT_CLIENT_ID');
      console.error('📋 Variables de entorno disponibles relacionadas con Microsoft:', {
        MICROSOFT_CALENDAR_CLIENT_ID: process.env.MICROSOFT_CALENDAR_CLIENT_ID ? 'definida' : 'undefined',
        MICROSOFT_CLIENT_ID: process.env.MICROSOFT_CLIENT_ID ? 'definida' : 'undefined',
        NEXT_PUBLIC_MICROSOFT_CLIENT_ID: process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID ? 'definida' : 'undefined',
      });
      
      return NextResponse.json(
        { 
          error: 'Microsoft Calendar no está configurado',
          details: 'No se encontró MICROSOFT_CALENDAR_CLIENT_ID ni MICROSOFT_CLIENT_ID. Por favor, verifica tu archivo .env.local',
          requiredEnvVars: [
            'MICROSOFT_CALENDAR_CLIENT_ID (o MICROSOFT_CLIENT_ID como alternativa)',
            'MICROSOFT_CALENDAR_CLIENT_SECRET (o MICROSOFT_CLIENT_SECRET como alternativa)',
          ]
        },
        { status: 500 }
      );
    }

    // Generar state para seguridad
    const state = randomBytes(32).toString('hex');
    
    const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
      `client_id=${encodeURIComponent(clientId)}&` +
      `response_type=code&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_mode=query&` +
      `scope=${encodeURIComponent(scope)}&` +
      `state=${state}`;
    
    console.log('✅ URL de autorización generada:', {
      hasAuthUrl: !!authUrl,
      redirectUri,
    });
    
    const response = NextResponse.json({
      authorization_url: authUrl,
      state,
    });

    // Guardar state en cookie
    response.cookies.set('oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutos
    });

    console.log('✅ Respuesta OAuth preparada correctamente');
    return response;
  } catch (error: any) {
    console.error('❌ Error in Microsoft OAuth init:', error);
    console.error('Stack trace:', error?.stack);
    
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error?.message || 'Error desconocido',
        ...(process.env.NODE_ENV === 'development' && { stack: error?.stack })
      },
      { status: 500 }
    );
  }
}

