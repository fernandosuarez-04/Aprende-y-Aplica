import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { createClient } from '../../../../lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Obtener el usuario actual
    const { SessionService } = await import('../../../../features/auth/services/session.service');
    const user = await SessionService.getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Buscar perfil del usuario
    const { data: profile, error: profileError } = await supabase
      .from('user_perfil')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      logger.error('Error fetching user profile:', profileError);
      return NextResponse.json(
        { error: 'Error al obtener el perfil' },
        { status: 500 }
      );
    }

    // Si no existe perfil, retornar null
    if (!profile) {
      return NextResponse.json(null);
    }

    return NextResponse.json(profile);

  } catch (error) {
    logger.error('Error in profile GET:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Obtener el usuario actual
    const { SessionService } = await import('../../../../features/auth/services/session.service');
    const user = await SessionService.getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      cargo_titulo,
      rol_id,
      nivel_id,
      area_id,
      relacion_id,
      tamano_id,
      sector_id,
      pais
    } = body;

    // Validar datos requeridos
    if (!cargo_titulo || !nivel_id || !area_id || !relacion_id) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: cargo_titulo, nivel_id, area_id, relacion_id son obligatorios' },
        { status: 400 }
      );
    }

    // Verificar si ya existe un perfil
    const { data: existingProfile } = await supabase
      .from('user_perfil')
      .select('id')
      .eq('user_id', user.id)
      .single();

    let result;

    if (existingProfile) {
      // Actualizar perfil existente en user_perfil
      const { data, error } = await supabase
        .from('user_perfil')
        .update({
          cargo_titulo,
          rol_id: rol_id && rol_id > 0 ? rol_id : null,
          nivel_id,
          area_id,
          relacion_id,
          tamano_id: tamano_id && tamano_id > 0 ? tamano_id : null,
          sector_id: sector_id && sector_id > 0 ? sector_id : null,
          pais: pais && pais.trim() !== '' ? pais.trim() : null,
          actualizado_en: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        logger.error('Error updating profile:', error);
        return NextResponse.json(
          { error: 'Error al actualizar el perfil' },
          { status: 500 }
        );
      }

      // También actualizar type_rol en la tabla users con el cargo_titulo del cuestionario
      // type_rol almacena el cargo profesional del usuario obtenido del cuestionario
      const { error: userError } = await supabase
        .from('users')
        .update({
          type_rol: cargo_titulo,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (userError) {
        logger.error('Error updating user type_rol:', userError);
        // No retornamos error aquí para no interrumpir el flujo principal
      }

      result = data;
    } else {
      // Crear nuevo perfil en user_perfil
      const { data, error } = await supabase
        .from('user_perfil')
        .insert({
          user_id: user.id,
          cargo_titulo,
          rol_id: rol_id && rol_id > 0 ? rol_id : null,
          nivel_id,
          area_id,
          relacion_id,
          tamano_id: tamano_id && tamano_id > 0 ? tamano_id : null,
          sector_id: sector_id && sector_id > 0 ? sector_id : null,
          pais: pais && pais.trim() !== '' ? pais.trim() : null,
          creado_en: new Date().toISOString(),
          actualizado_en: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating profile:', error);
        return NextResponse.json(
          { error: 'Error al crear el perfil' },
          { status: 500 }
        );
      }

      // También actualizar type_rol en la tabla users con el cargo_titulo del cuestionario
      // type_rol almacena el cargo profesional del usuario obtenido del cuestionario
      const { error: userError } = await supabase
        .from('users')
        .update({
          type_rol: cargo_titulo,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (userError) {
        logger.error('Error updating user type_rol:', userError);
        // No retornamos error aquí para no interrumpir el flujo principal
      }

      result = data;
    }

    return NextResponse.json(result);

  } catch (error) {
    logger.error('Error in profile POST:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
