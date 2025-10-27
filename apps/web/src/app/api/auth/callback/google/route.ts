import { NextRequest, NextResponse } from 'next/server';
import { handleGoogleCallback } from '@/features/auth/actions/oauth';

/**
 * GET /api/auth/callback/google
 *
 * Maneja el callback de Google OAuth después de la autorización
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // Llamar a la server action
    const result = await handleGoogleCallback({
      code: code || '',
      state: state || undefined,
      error: error || undefined,
      error_description: errorDescription || undefined,
    });

    // Si hay error, redirigir a login con mensaje de error
    if (result && 'error' in result) {
      return NextResponse.redirect(
        new URL(`/auth?error=${encodeURIComponent(result.error)}`, request.url)
      );
    }

    // El éxito se maneja con redirect en handleGoogleCallback
    // Si llegamos aquí, es porque no hubo redirección ni error
    return NextResponse.redirect(new URL('/dashboard', request.url));
  } catch (error) {
    // Verificar si es una redirección de Next.js (no es un error real)
    if (error && typeof error === 'object' && 'digest' in error) {
      const digest = (error as any).digest;
      if (typeof digest === 'string' && digest.startsWith('NEXT_REDIRECT')) {
        // Es una redirección exitosa, relanzar para que Next.js la maneje
        throw error;
      }
    }

    // Solo es un error real si llegamos aquí
    console.error('Error en callback route:', error);

    return NextResponse.redirect(
      new URL('/auth?error=callback_error', request.url)
    );
  }
}
