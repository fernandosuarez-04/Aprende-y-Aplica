import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';

/**
 * POST /api/reportes
 * Crear un nuevo reporte de problema
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verificar autenticación
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    const {
      titulo,
      descripcion,
      categoria,
      prioridad = 'media',
      pagina_url,
      pathname,
      user_agent,
      screen_resolution,
      navegador,
      pasos_reproducir,
      comportamiento_esperado,
      screenshot_data,
      from_lia = false
    } = body;

    // Validaciones
    if (!titulo || !descripcion || !categoria) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: titulo, descripcion, categoria' },
        { status: 400 }
      );
    }

    // Validar categoría
    const categoriasValidas = ['bug', 'sugerencia', 'contenido', 'performance', 'ui-ux', 'otro'];
    if (!categoriasValidas.includes(categoria)) {
      return NextResponse.json(
        { error: `Categoría inválida. Debe ser una de: ${categoriasValidas.join(', ')}` },
        { status: 400 }
      );
    }

    // Validar prioridad
    const prioridadesValidas = ['baja', 'media', 'alta', 'critica'];
    if (!prioridadesValidas.includes(prioridad)) {
      return NextResponse.json(
        { error: `Prioridad inválida. Debe ser una de: ${prioridadesValidas.join(', ')}` },
        { status: 400 }
      );
    }

    console.log('📝 Creando reporte de problema:', {
      user_id: session.user.id,
      categoria,
      prioridad,
      titulo: titulo.substring(0, 50)
    });

    // Si hay screenshot, subirlo a Supabase Storage
    let screenshot_url = null;
    if (screenshot_data) {
      try {
        // Convertir base64 a blob
        const base64Data = screenshot_data.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Generar nombre único
        const fileName = `reporte-${session.user.id}-${Date.now()}.jpg`;
        
        // Subir a Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('reportes-screenshots')
          .upload(fileName, buffer, {
            contentType: 'image/jpeg',
            cacheControl: '3600',
          });

        if (uploadError) {
          console.error('Error subiendo screenshot:', uploadError);
        } else {
          // Obtener URL pública
          const { data: publicUrlData } = supabase.storage
            .from('reportes-screenshots')
            .getPublicUrl(fileName);
          
          screenshot_url = publicUrlData.publicUrl;
          console.log('📸 Screenshot subido:', screenshot_url);
        }
      } catch (error) {
        console.error('Error procesando screenshot:', error);
        // Continuar sin screenshot si falla
      }
    }

    // Insertar reporte en la base de datos
    const { data: reporte, error: insertError } = await supabase
      .from('reportes_problemas')
      .insert({
        user_id: session.user.id,
        titulo: titulo.trim().substring(0, 200),
        descripcion: descripcion.trim(),
        categoria,
        prioridad,
        pagina_url: pagina_url || '',
        pathname: pathname || '',
        user_agent: user_agent || '',
        screen_resolution: screen_resolution || '',
        navegador: navegador || '',
        pasos_reproducir: pasos_reproducir?.trim() || null,
        comportamiento_esperado: comportamiento_esperado?.trim() || null,
        screenshot_url,
        metadata: {
          from_lia,
          timestamp: new Date().toISOString()
        }
      } as any)
      .select()
      .single();

    if (insertError) {
      console.error('Error insertando reporte:', insertError);
      return NextResponse.json(
        { error: 'Error al crear el reporte', details: insertError.message },
        { status: 500 }
      );
    }

    console.log('✅ Reporte creado exitosamente:', (reporte as any)?.id);

    // TODO: Enviar notificación a administradores (opcional)
    // Puedes agregar aquí lógica para notificar por email o sistema de notificaciones

    return NextResponse.json({
      success: true,
      reporte: {
        id: (reporte as any).id,
        titulo: (reporte as any).titulo,
        categoria: (reporte as any).categoria,
        estado: (reporte as any).estado,
        created_at: (reporte as any).created_at
      },
      message: 'Reporte creado exitosamente'
    }, { status: 201 });

  } catch (error) {
    console.error('Error en POST /api/reportes:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/reportes
 * Obtener reportes del usuario o todos (si es admin)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verificar autenticación
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url);
    const estado = searchParams.get('estado');
    const categoria = searchParams.get('categoria');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Verificar si el usuario es admin
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    const isAdmin = (userProfile as any)?.role === 'Administrador';

    // Construir query
    let query = supabase
      .from('reportes_con_usuario')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Si no es admin, solo ver sus propios reportes
    if (!isAdmin) {
      query = query.eq('user_id', session.user.id);
    }

    // Aplicar filtros
    if (estado) {
      query = query.eq('estado', estado);
    }
    if (categoria) {
      query = query.eq('categoria', categoria);
    }

    // Paginación
    query = query.range(offset, offset + limit - 1);

    const { data: reportes, error: queryError, count } = await query;

    if (queryError) {
      console.error('Error obteniendo reportes:', queryError);
      return NextResponse.json(
        { error: 'Error al obtener reportes', details: queryError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      reportes,
      total: count,
      limit,
      offset,
      isAdmin
    });

  } catch (error) {
    console.error('Error en GET /api/reportes:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
