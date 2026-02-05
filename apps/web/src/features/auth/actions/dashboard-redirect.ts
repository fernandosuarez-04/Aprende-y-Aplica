'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SessionService } from '../services/session.service';
import { logger } from '@/lib/logger';

/**
 * Redirige al usuario al dashboard apropiado según su cargo_rol y rol en la organización
 * - Administrador â†’ /admin/dashboard
 * - Instructor â†’ /instructor/dashboard (Panel de Instructor)
 * - Business (owner/admin en org) â†’ /{orgSlug}/business-panel/dashboard (Panel Admin Empresas)
 * - Business User (member en org) â†’ /{orgSlug}/business-user/dashboard (Dashboard Usuario Business)
 * - Usuario (o cualquier otro) â†’ /dashboard (Tour SOFLIA + Planes)
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
      // Obtener organización activa con slug y rol
      const { data: userOrg, error: orgError } = await supabase
        .from('organization_users')
        .select('organization_id, role, status, organizations!inner(slug)')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (orgError || !userOrg) {
        logger.warn(`Usuario Business sin organización activa, redirigiendo a /dashboard`);
        redirect('/dashboard');
      } else {
        const orgSlug = (userOrg.organizations as any)?.slug;
        const orgRole = userOrg.role; // Rol en la organización: 'owner', 'admin', 'member', etc.
        
        if (orgSlug) {
          // Determinar destino según el rol en la organización
          // owner y admin van a business-panel, member va a business-user
          if (orgRole === 'owner' || orgRole === 'admin') {
            redirect(`/${orgSlug}/business-panel/dashboard`);
          } else {
            redirect(`/${orgSlug}/business-user/dashboard`);
          }
        } else {
          // Fallback sin slug
          redirect('/dashboard');
        }
      }
    } else {
      // Usuario normal (cargo_rol === 'usuario' o cualquier otro) â†’ Tour de SOFLIA + Planes
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
