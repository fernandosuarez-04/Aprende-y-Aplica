'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SessionService } from '../services/session.service';
import { logger } from '@/lib/logger';

/**
 * Redirige al usuario al dashboard apropiado según su cargo_rol (Enfoque B2B)
 * - Administrador → /admin/dashboard
 * - Instructor → /instructor/dashboard (Panel de Instructor)
 * - Business → /business-panel/dashboard (Panel Admin Empresas)
 * - Business User → /business-user/dashboard (Dashboard Usuario Business)
 * - Usuario (o cualquier otro) → /dashboard (Tour SOFIA + Planes)
 */
export async function redirectToDashboard() {
  try {
    // Verificar si el usuario está autenticado
    const user = await SessionService.getCurrentUser();

    if (!user) {
      logger.warn('Dashboard redirect: Usuario no autenticado');
      redirect('/auth');
    }

    const supabase = await createClient();

    // Obtener cargo_rol del usuario
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, cargo_rol')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      logger.error('Error obteniendo datos del usuario:', userError);
      redirect('/dashboard');
      return;
    }

    // Redirección basada en cargo_rol (normalizado a minúsculas)
    const normalizedRole = userData.cargo_rol?.toLowerCase().trim();
    logger.log(`Dashboard redirect: cargo_rol = ${userData.cargo_rol}, normalizedRole = ${normalizedRole}`);

    if (normalizedRole === 'administrador') {
      redirect('/admin/dashboard');
    } else if (normalizedRole === 'instructor') {
      redirect('/instructor/dashboard');
    } else if (normalizedRole === 'business' || normalizedRole === 'business user') {
      
      if (normalizedRole === 'business') {
        // Redirigir siempre al panel de negocios
        redirect('/business-panel/dashboard');
      } else {
        // Para Business User (empleados), verificar organización
        const { data: userOrg, error: orgError } = await supabase
          .from('organization_users')
          .select('organization_id, status')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single();

        if (orgError || !userOrg) {
          logger.warn(`Usuario Business User sin organización activa, redirigiendo a /dashboard`);
          redirect('/dashboard');
        } else {
          redirect('/business-user/dashboard');
        }
      }
    } else {
      // Usuario normal (cargo_rol === 'usuario' o cualquier otro) → Tour de SOFIA + Planes
      redirect('/dashboard');
    }
  } catch (error) {
    // Manejar redirect de Next.js (no es un error real)
    if (error && typeof error === 'object' && 'digest' in error) {
      const digest = (error as any).digest;
      if (typeof digest === 'string' && digest.startsWith('NEXT_REDIRECT')) {
        throw error;
      }
    }

    logger.error('Error en redirectToDashboard:', error);
    redirect('/dashboard');
  }
}
