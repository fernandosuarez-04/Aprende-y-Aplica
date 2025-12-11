/**
 * Script para verificar el progreso de lecciones de un usuario
 * Ejecutar con: node verify-progress.js
 */

const { createClient } = require('@supabase/supabase-js');

// Configurar cliente de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Faltan variables de entorno');
  console.log('Asegúrate de tener NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const courseId = 'a26fa16b-4e08-493d-a78b-877bad789f38';

async function verifyProgress() {
  console.log('🔍 Verificando progreso de lecciones...\n');
  console.log(`Curso ID: ${courseId}\n`);

  // 1. Obtener información del curso
  const { data: course } = await supabase
    .from('courses')
    .select('id, title, slug')
    .eq('id', courseId)
    .single();

  if (!course) {
    console.error('❌ Curso no encontrado');
    return;
  }

  console.log(`📚 Curso: ${course.title}`);
  console.log(`   Slug: ${course.slug}\n`);

  // 2. Obtener enrollments de este curso
  const { data: enrollments } = await supabase
    .from('user_course_enrollments')
    .select('enrollment_id, user_id, overall_progress_percentage, enrollment_status')
    .eq('course_id', courseId);

  console.log(`👥 Enrollments encontrados: ${enrollments?.length || 0}\n`);

  if (!enrollments || enrollments.length === 0) {
    console.log('⚠️ No hay usuarios inscritos en este curso');
    return;
  }

  // 3. Para cada enrollment, verificar lecciones completadas
  for (const enrollment of enrollments) {
    console.log(`\n📊 Usuario ID: ${enrollment.user_id}`);
    console.log(`   Enrollment ID: ${enrollment.enrollment_id}`);
    console.log(`   Progreso general: ${enrollment.overall_progress_percentage}%`);
    console.log(`   Estado: ${enrollment.enrollment_status}`);

    // Obtener lecciones completadas
    const { data: completedLessons } = await supabase
      .from('user_lesson_progress')
      .select('lesson_id, is_completed, lesson_status, completed_at')
      .eq('enrollment_id', enrollment.enrollment_id)
      .eq('is_completed', true);

    console.log(`   ✅ Lecciones completadas: ${completedLessons?.length || 0}`);

    if (completedLessons && completedLessons.length > 0) {
      console.log(`   Primeras 5 lecciones completadas:`);
      completedLessons.slice(0, 5).forEach((lesson, i) => {
        console.log(`      ${i + 1}. ${lesson.lesson_id} - Completada: ${lesson.completed_at}`);
      });
    }

    // Verificar total de lecciones del curso
    const { data: modules } = await supabase
      .from('course_modules')
      .select('module_id')
      .eq('course_id', courseId)
      .eq('is_published', true);

    if (modules && modules.length > 0) {
      const moduleIds = modules.map(m => m.module_id);
      const { data: lessons } = await supabase
        .from('course_lessons')
        .select('lesson_id')
        .in('module_id', moduleIds)
        .eq('is_published', true);

      console.log(`   📖 Total lecciones en el curso: ${lessons?.length || 0}`);
    }
  }
}

verifyProgress().catch(console.error);
