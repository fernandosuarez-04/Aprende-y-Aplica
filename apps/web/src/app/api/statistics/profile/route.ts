import { NextRequest, NextResponse } from 'next/server';
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
      console.error('Error fetching user profile:', profileError);
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
    console.error('Error in profile GET:', error);
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
        console.error('Error updating profile:', error);
        return NextResponse.json(
          { error: 'Error al actualizar el perfil' },
          { status: 500 }
        );
      }

      // También actualizar type_rol en la tabla users
      const { error: userError } = await supabase
        .from('users')
        .update({
          type_rol: cargo_titulo
        })
        .eq('id', user.id);

      if (userError) {
        console.error('Error updating user type_rol:', userError);
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
        console.error('Error creating profile:', error);
        return NextResponse.json(
          { error: 'Error al crear el perfil' },
          { status: 500 }
        );
      }

      // También actualizar type_rol en la tabla users
      const { error: userError } = await supabase
        .from('users')
        .update({
          type_rol: cargo_titulo
        })
        .eq('id', user.id);

      if (userError) {
        console.error('Error updating user type_rol:', userError);
        // No retornamos error aquí para no interrumpir el flujo principal
      }

      result = data;
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error in profile POST:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
