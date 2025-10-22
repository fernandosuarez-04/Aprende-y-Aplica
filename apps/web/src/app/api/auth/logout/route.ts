import { NextResponse } from 'next/server';
import { SessionService } from '../../../../features/auth/services/session.service';

export async function POST() {
  try {
    await SessionService.destroySession();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error during logout:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
