import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  logger.warn('Supabase no configurado - usando datos mock');
}

const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return cookies().get(name)?.value;
        },
      },
    })
  : null;

export async function GET(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase no configurado. Por favor configura las variables de entorno.' },
        { status: 500 }
      );
    }

    // Obtener el usuario actual autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      logger.error('Error de autenticación:', authError);
      return NextResponse.json(
        { error: 'Error de autenticación. Por favor inicia sesión nuevamente.' },
        { status: 401 }
      );
    }
    
    if (!user) {
      logger.warn('Usuario no autenticado');
      return NextResponse.json(
        { error: 'Usuario no autenticado. Por favor inicia sesión.' },
        { status: 401 }
      );
    }
    
    logger.log('Usuario autenticado:', user.id);

    // Obtener perfil del usuario
    const { data: userProfile, error: profileError } = await supabase
      .from('user_perfil')
      .select('id, area_id, rol_id')
      .eq('user_id', user.id)
      .single();

    // Si no hay perfil, retornar error
    if (profileError || !userProfile) {
      logger.error('Error fetching user profile:', profileError);
      return NextResponse.json(
        { error: 'Perfil de usuario no encontrado. Por favor completa tu perfil profesional primero.' },
        { status: 404 }
      );
    }


    // Obtener preguntas filtradas por perfil
    const { data: questions, error: questionsError } = await supabase
      .from('preguntas')
      .select('*')
      .or(`area_id.eq.${userProfile.area_id},area_id.is.null`)
      .or(`exclusivo_rol_id.eq.${userProfile.rol_id},exclusivo_rol_id.is.null`)
      .order('section', { ascending: true })
      .order('bloque', { ascending: true })
      .order('id', { ascending: true });

    if (questionsError) {
      logger.error('Error fetching questions:', questionsError);
      return NextResponse.json(
        { error: 'Error al obtener las preguntas' },
        { status: 500 }
      );
    }

    // Obtener respuestas existentes del usuario usando user_perfil_id
    const { data: existingAnswers, error: answersError } = await supabase
      .from('respuestas')
      .select('pregunta_id, valor')
      .eq('user_perfil_id', userProfile.id);

    if (answersError) {
      logger.error('Error fetching existing answers:', answersError);
    }

    // Mapear respuestas existentes
    const answersMap = existingAnswers?.reduce((acc, answer) => {
      acc[answer.pregunta_id] = answer.valor;
      return acc;
    }, {} as Record<number, any>) || {};

    // Combinar preguntas con respuestas existentes
    const questionsWithAnswers = questions?.map(question => ({
      ...question,
      respuesta_existente: answersMap[question.id] || null
    })) || [];

    return NextResponse.json({
      questions: questionsWithAnswers,
      total: questionsWithAnswers.length,
      userProfile: {
        id: userProfile.id,
        area_id: userProfile.area_id,
        rol_id: userProfile.rol_id
      }
    });

  } catch (error) {
    logger.error('Error in questionnaire API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
