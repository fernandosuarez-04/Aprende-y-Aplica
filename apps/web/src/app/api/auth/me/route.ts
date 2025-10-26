import { NextResponse } from 'next/server';
import { SessionService } from '../../../../features/auth/services/session.service';

export async function GET() {
  try {
    const user = await SessionService.getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'No autenticado' 
      }, { status: 401 });
    }

    return NextResponse.json({ 
      success: true, 
      user: user 
    });
  } catch (error) {
    console.error('Error getting current user:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno' 
    }, { status: 500 });
  }
}
