import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SessionService } from '@/features/auth/services/session.service';
import { randomUUID } from 'crypto';

/**
 * GET /api/study-planner/calendar-integrations/subscription-token
 * Obtiene o crea un token de suscripción ICS para el usuario
 */
export async function GET(request: NextRequest) {
  try {
    const currentUser = await SessionService.getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const supabase = await createClient();

    // Buscar token existente
    const { data: existingToken, error: findError } = await supabase
      .from('calendar_subscription_tokens')
      .select('token')
      .eq('user_id', currentUser.id)
      .single();

    if (findError && findError.code !== 'PGRST116') {
      console.error('Error finding token:', findError);
      return NextResponse.json(
        { error: 'Error al obtener token' },
        { status: 500 }
      );
    }

    if (existingToken) {
      return NextResponse.json({ token: existingToken.token });
    }

    // Crear nuevo token
    const token = randomUUID();
    const { error: insertError } = await supabase
      .from('calendar_subscription_tokens')
      .insert({
        user_id: currentUser.id,
        token,
      });

    if (insertError) {
      console.error('Error creating token:', insertError);
      return NextResponse.json(
        { error: 'Error al crear token' },
        { status: 500 }
      );
    }

    return NextResponse.json({ token });
  } catch (error) {
    console.error('Error in subscription token API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/study-planner/calendar-integrations/subscription-token
 * Regenera el token de suscripción (invalida el anterior)
 */
export async function POST(request: NextRequest) {
  try {
    const currentUser = await SessionService.getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const supabase = await createClient();

    // Generar nuevo token
    const token = randomUUID();

    // Actualizar o insertar token
    const { error: upsertError } = await supabase
      .from('calendar_subscription_tokens')
      .upsert({
        user_id: currentUser.id,
        token,
        last_used_at: null,
        usage_count: 0,
      }, {
        onConflict: 'user_id',
      });

    if (upsertError) {
      console.error('Error regenerating token:', upsertError);
      return NextResponse.json(
        { error: 'Error al regenerar token' },
        { status: 500 }
      );
    }

    return NextResponse.json({ token });
  } catch (error) {
    console.error('Error in regenerate token API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}


