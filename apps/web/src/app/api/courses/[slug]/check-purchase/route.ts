import { NextRequest, NextResponse } from 'next/server';
import { SessionService } from '@/features/auth/services/session.service';
import { PurchasedCoursesService } from '@/features/courses/services/purchased-courses.service';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/courses/[slug]/check-purchase
 * Verifica si el usuario actual ha comprado un curso específico
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const supabase = await createClient();

    // Await params (requerido en Next.js 15)
    const { slug } = await params;

    // Obtener usuario usando el sistema de sesiones
    const currentUser = await SessionService.getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ isPurchased: false });
    }

    // Obtener el curso por slug
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id')
      .eq('slug', slug)
      .single();

    if (courseError || !course) {
      return NextResponse.json({ isPurchased: false });
    }

    // Verificar si el usuario ha comprado el curso
    const isPurchased = await PurchasedCoursesService.isCoursePurchased(
      currentUser.id,
      course.id
    );

    if (isPurchased) {
      return NextResponse.json({ isPurchased: true });
    }

    // Verificar si el usuario tiene el curso asignado por su organización
    const { data: assignment } = await supabase
      .from('organization_course_assignments')
      .select('id')
      .eq('user_id', currentUser.id)
      .eq('course_id', course.id)
      .in('status', ['assigned', 'in_progress', 'completed'])
      .single();

    return NextResponse.json({ isPurchased: !!assignment });
  } catch (error) {
    return NextResponse.json({ isPurchased: false });
  }
}

