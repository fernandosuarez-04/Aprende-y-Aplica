import { NextRequest, NextResponse } from 'next/server';
import { RefreshTokenService } from '@/lib/auth/refreshToken.service';
import { logger } from '@/lib/utils/logger';

/**
 * POST /api/auth/refresh
 *
 * Renueva el access token usando el refresh token
 * Este endpoint permite al cliente renovar manualmente su access token
 * cuando detecte que está por expirar o ya expiró
 */
export async function POST(request: NextRequest) {
  try {
    logger.log('🔄 API Refresh: Iniciando renovación de token');
    
    // Intentar refrescar la sesión
    const sessionInfo = await RefreshTokenService.refreshSession(request);
    
    logger.log('✅ API Refresh: Token renovado exitosamente', {
      userId: sessionInfo.userId,
      accessExpiresAt: sessionInfo.accessExpiresAt
    });
    
    // Devolver información de la nueva sesión (sin los tokens, que están en cookies)
    return NextResponse.json({
      success: true,
      message: 'Token renovado exitosamente',
      expiresAt: sessionInfo.accessExpiresAt
    });
    
  } catch (error) {
    logger.error('💥 API Refresh Error:', error);
    
    // Si el error es por token inválido o expirado, devolver 401
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    
    if (
      errorMessage.includes('Refresh token no encontrado') ||
      errorMessage.includes('Token inválido') ||
      errorMessage.includes('Token expirado') ||
      errorMessage.includes('Token revocado') ||
      errorMessage.includes('Sesión inactiva')
    ) {
      // Limpiar cookies inválidas
      const response = NextResponse.json(
        {
          success: false,
          error: 'Sesión expirada',
          code: 'SESSION_EXPIRED'
        },
        { status: 401 }
      );
      
      response.cookies.delete('access_token');
      response.cookies.delete('refresh_token');
      response.cookies.delete('aprende-y-aplica-session');
      
      return response;
    }
    
    // Otros errores
    return NextResponse.json(
      {
        success: false,
        error: 'Error al renovar token',
        message: errorMessage
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/refresh
 *
 * Obtiene información sobre el estado de la sesión actual
 */
export async function GET(request: NextRequest) {
  try {
    logger.log('📊 API Refresh: Obteniendo estado de sesión');
    
    const accessToken = request.cookies.get('access_token')?.value;
    const refreshToken = request.cookies.get('refresh_token')?.value;
    
    if (!accessToken && !refreshToken) {
      return NextResponse.json({
        success: false,
        authenticated: false,
        message: 'No hay sesión activa'
      });
    }
    
    // Verificar si hay refresh token activo
    if (refreshToken) {
      try {
        // Intentar obtener información del usuario (esto validará el token)
        const sessionInfo = await RefreshTokenService.refreshSession(request);
        
        return NextResponse.json({
          success: true,
          authenticated: true,
          userId: sessionInfo.userId,
          accessExpiresAt: sessionInfo.accessExpiresAt,
          refreshExpiresAt: sessionInfo.refreshExpiresAt
        });
      } catch (error) {
        return NextResponse.json({
          success: false,
          authenticated: false,
          message: 'Sesión inválida o expirada'
        });
      }
    }
    
    return NextResponse.json({
      success: false,
      authenticated: false,
      message: 'Token de sesión incompleto'
    });
    
  } catch (error) {
    logger.error('💥 API Refresh GET Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener estado de sesión'
      },
      { status: 500 }
    );
  }
}
