import { NextResponse } from 'next/server';
import { SessionService } from '../../../../features/auth/services/session.service';
import { cacheHeaders } from '../../../../lib/utils/cache-headers';

export async function GET() {
  try {
    const user = await SessionService.getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'No autenticado' 
      }, { 
        status: 401,
        headers: cacheHeaders.private // NO cachear - datos sensibles
      });
    }

    return NextResponse.json({ 
      success: true, 
      user: user 
    }, {
      headers: cacheHeaders.private // NO cachear - datos de usuario
    });
  } catch (error) {
    console.error('Error getting current user:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno' 
    }, { status: 500 });
  }
}
