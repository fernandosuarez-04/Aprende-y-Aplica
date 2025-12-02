import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SessionService } from '@/features/auth/services/session.service';

/**
 * GET /api/study-planner/routes
 * Obtiene todas las rutas de aprendizaje del usuario
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

    console.log('🔍 Buscando rutas para usuario:', {
      userId: currentUser.id,
      userIdType: typeof currentUser.id,
      userIdLength: currentUser.id?.length,
      userIdTrimmed: currentUser.id?.trim(),
    });

    // Verificar si el user_id coincide exactamente
    const userIdToSearch = String(currentUser.id).trim();
    console.log('🔍 User ID a buscar (trimmed):', userIdToSearch);

    // Primero, verificar si hay rutas sin filtrar para debug
    const { data: allRoutes, error: allRoutesError } = await supabase
      .from('learning_routes')
      .select('id, user_id, name, is_active')
      .limit(10);

    console.log('📊 Todas las rutas (primeras 10):', allRoutes?.map((r: any) => ({
      id: r.id,
      user_id: r.user_id,
      user_id_type: typeof r.user_id,
      user_id_length: r.user_id?.length,
      name: r.name,
      is_active: r.is_active,
    })));

    // Primero obtener las rutas
    const { data: routes, error: routesError } = await supabase
      .from('learning_routes')
      .select(`
        id,
        name,
        description,
        created_at,
        user_id,
        is_active
      `)
      .eq('user_id', userIdToSearch)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    // Si hay rutas, obtener el conteo de cursos para cada una
    if (routes && routes.length > 0) {
      for (const route of routes) {
        const { count, error: countError } = await supabase
          .from('learning_route_courses')
          .select('*', { count: 'exact', head: true })
          .eq('route_id', route.id);
        
        if (!countError) {
          (route as any).course_count = count || 0;
        } else {
          console.error(`Error contando cursos para ruta ${route.id}:`, countError);
          (route as any).course_count = 0;
        }
      }
    }

    console.log('🔍 Query ejecutada:', {
      userId: currentUser.id,
      routesFound: routes?.length || 0,
      error: routesError?.message,
    });

    if (routesError) {
      console.error('❌ Error fetching routes:', routesError);
      return NextResponse.json(
        { error: 'Error al obtener rutas', details: routesError.message },
        { status: 500 }
      );
    }

    console.log('✅ Rutas encontradas:', routes?.length || 0);
    if (routes && routes.length > 0) {
      console.log('📋 Rutas:', routes.map((r: any) => ({
        id: r.id,
        name: r.name,
        user_id: r.user_id,
        is_active: r.is_active,
        course_count: r.course_count,
      })));
    }

    // Formatear respuesta
    const formattedRoutes = (routes || []).map(route => ({
      id: route.id,
      name: route.name,
      description: route.description,
      course_count: (route as any).course_count || 0,
    }));

    return NextResponse.json({ routes: formattedRoutes });
  } catch (error) {
    console.error('Error in routes API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/study-planner/routes
 * Crea una nueva ruta de aprendizaje
 */
export async function POST(request: NextRequest) {
  try {
    const currentUser = await SessionService.getCurrentUser();
    
    if (!currentUser) {
      console.error('❌ Usuario no autenticado');
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, description, courseIds } = body;

    console.log('📥 Datos recibidos:', { name, description, courseIds, userId: currentUser.id });

    if (!name || !courseIds || !Array.isArray(courseIds) || courseIds.length === 0) {
      console.error('❌ Validación fallida:', { name: !!name, courseIds: courseIds?.length });
      return NextResponse.json(
        { error: 'Nombre y cursos son requeridos' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Crear la ruta
    console.log('🔄 Creando ruta en la base de datos...');
    const { data: route, error: routeError } = await supabase
      .from('learning_routes')
      .insert({
        user_id: currentUser.id,
        name: name.trim(),
        description: description?.trim() || null,
        is_active: true,
      })
      .select()
      .single();

    if (routeError || !route) {
      console.error('❌ Error creating route:', routeError);
      return NextResponse.json(
        { error: 'Error al crear ruta', details: routeError?.message },
        { status: 500 }
      );
    }

    console.log('✅ Ruta creada:', route.id);

    // Agregar cursos a la ruta
    const routeCourses = courseIds.map((courseId: string, index: number) => ({
      route_id: route.id,
      course_id: courseId,
      course_order: index,
    }));

    console.log('📝 Insertando cursos en la ruta:', {
      routeId: route.id,
      coursesToInsert: routeCourses.length,
      courseIds: routeCourses.map(rc => rc.course_id),
      routeCoursesData: routeCourses,
    });

    // Intentar insertar todos los cursos en batch primero
    console.log('📝 Intentando inserción en batch de', routeCourses.length, 'cursos');
    let insertedCourses: any[] = [];
    let errors: any[] = [];
    
    const { data: batchInserted, error: batchError } = await supabase
      .from('learning_route_courses')
      .insert(routeCourses)
      .select();

    if (batchError) {
      console.warn('⚠️ Inserción en batch falló, intentando uno por uno:', batchError);
      console.warn('⚠️ Detalles del error:', {
        message: batchError.message,
        details: batchError.details,
        hint: batchError.hint,
        code: batchError.code,
      });
      
      // Si falla el batch, intentar uno por uno
      for (const routeCourse of routeCourses) {
        console.log(`🔄 Insertando curso individual:`, routeCourse);
        const { data: inserted, error: insertError } = await supabase
          .from('learning_route_courses')
          .insert(routeCourse)
          .select()
          .single();

        if (insertError) {
          console.error(`❌ Error insertando curso ${routeCourse.course_id}:`, {
            error: insertError.message,
            details: insertError.details,
            hint: insertError.hint,
            code: insertError.code,
            courseData: routeCourse,
          });
          errors.push({ course_id: routeCourse.course_id, error: insertError });
        } else if (inserted) {
          insertedCourses.push(inserted);
          console.log(`✅ Curso ${routeCourse.course_id} insertado correctamente`);
        } else {
          console.warn(`⚠️ Curso ${routeCourse.course_id} no se insertó pero no hubo error`);
        }
      }
    } else {
      // Batch insert exitoso
      insertedCourses = batchInserted || [];
      console.log('✅ Inserción en batch exitosa:', insertedCourses.length, 'cursos insertados');
    }

    // Manejar errores de inserción
    if (errors.length > 0) {
      console.warn('⚠️ Algunos cursos no se pudieron insertar:', {
        totalErrors: errors.length,
        insertedSuccessfully: insertedCourses.length,
        errors: errors.map(e => ({ course_id: e.course_id, error: e.error.message })),
      });

      // Si ningún curso se insertó, eliminar la ruta
      if (insertedCourses.length === 0) {
        console.error('❌ Ningún curso se insertó, eliminando ruta');
        await supabase.from('learning_routes').delete().eq('id', route.id);
        return NextResponse.json(
          { 
            error: 'Error al agregar cursos a la ruta', 
            details: errors.map(e => e.error.message).join('; '),
          },
          { status: 500 }
        );
      } else {
        // Si al menos uno se insertó, continuar pero advertir
        console.warn(`⚠️ Solo ${insertedCourses.length} de ${routeCourses.length} cursos se insertaron`);
      }
    }

    console.log('✅ Cursos insertados:', {
      expected: routeCourses.length,
      actual: insertedCourses.length,
      inserted: insertedCourses.map((ic: any) => ({
        route_id: ic.route_id,
        course_id: ic.course_id,
        course_order: ic.course_order,
      })),
      errors: errors.length,
    });

    // Verificar que todos los cursos se insertaron correctamente
    if (insertedCourses.length !== routeCourses.length) {
      console.warn('⚠️ Advertencia: No todos los cursos se insertaron', {
        expected: routeCourses.length,
        actual: insertedCourses.length,
        missing: routeCourses.length - insertedCourses.length,
      });
    }

    // Verificar en la base de datos cuántos cursos realmente tiene la ruta
    const { count: actualCount, error: verifyError } = await supabase
      .from('learning_route_courses')
      .select('*', { count: 'exact', head: true })
      .eq('route_id', route.id);

    if (!verifyError) {
      console.log('🔍 Verificación en BD - Cursos en la ruta:', actualCount);
      if (actualCount !== insertedCourses.length) {
        console.warn('⚠️ Discrepancia: La BD muestra', actualCount, 'pero se insertaron', insertedCourses.length);
      }
    }

    // Obtener información completa de los cursos
    const { data: courses } = await supabase
      .from('courses')
      .select('id, title, description, thumbnail_url, slug, category, duration_total_minutes, level')
      .in('id', courseIds);

    return NextResponse.json({
      route: {
        id: route.id,
        name: route.name,
        description: route.description,
      },
      courses: courses || [],
    });
  } catch (error) {
    console.error('Error in create route API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}


