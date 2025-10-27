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
    return NextResponse.redirect(new URL('/dashboard', request.url));
  } catch (error) {
    console.error('Error en callback route:', error);

    return NextResponse.redirect(
      new URL('/auth?error=callback_error', request.url)
    );
  }
}
