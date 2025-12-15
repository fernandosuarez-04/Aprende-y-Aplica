'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SessionService } from '../services/session.service';
import { logger } from '@/lib/logger';

/**
 * Verifica si el usuario pertenece a una organización y su type_rol,
 * luego redirige al dashboard apropiado
 */
export async function redirectToDashboard() {
  try {
    // Verificar si el usuario está autenticado
    const user = await SessionService.getCurrentUser();
    
    if (!user) {
      // Si no está autenticado, redirigir al login
      logger.warn('Dashboard redirect: Usuario no autenticado');
      redirect('/auth');
    }

    const supabase = await createClient();

    // Obtener información completa del usuario incluyendo type_rol
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, type_rol, organization_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      logger.error('Error obteniendo datos del usuario:', userError);
      // En caso de error, redirigir al dashboard principal
      redirect('/dashboard');
      return;
    }

    // Normalizar type_rol para comparación (case-insensitive)
    const typeRol = userData.type_rol?.toLowerCase().trim() || null;

    // PRIORIDAD 1: Verificar type_rol
    // Si type_rol es 'Business User', redirigir al dashboard de empresa
    if (typeRol === 'business user') {
      logger.log('Dashboard redirect: Usuario con type_rol = Business User → /business-user/dashboard');
      redirect('/business-user/dashboard');
      return;
    }

    // PRIORIDAD 2: Verificar si pertenece a una organización
    // Verificar en organization_users (más reciente)
    const { data: userOrgs, error: orgUsersError } = await supabase
      .from('organization_users')
      .select('organization_id, joined_at')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('joined_at', { ascending: false })
      .limit(1);

    // Verificar organization_id directo en users
    const hasOrganizationId = !!userData.organization_id;

    // Si hay error en la consulta pero tiene organization_id, continuar
    if (orgUsersError && !hasOrganizationId) {
      logger.error('Error verificando organización:', orgUsersError);
    }

    // Determinar si pertenece a una organización
    const belongsToOrganization = (userOrgs && userOrgs.length > 0) || hasOrganizationId;

    if (belongsToOrganization) {
      // Usuario pertenece a una organización → Dashboard de empresa
      logger.log('Dashboard redirect: Usuario con organización → /business-user/dashboard');
      redirect('/business-user/dashboard');
      return;
    }

    // PRIORIDAD 3: Si type_rol es NULL o 'Usuario', o no pertenece a organización
    // → Dashboard principal de talleres
    if (!typeRol || typeRol === 'usuario') {
      logger.log('Dashboard redirect: Usuario sin organización y type_rol NULL/Usuario → /dashboard');
      redirect('/dashboard');
      return;
    }

    // Por defecto, redirigir al dashboard principal
    logger.log('Dashboard redirect: Caso por defecto → /dashboard');
    redirect('/dashboard');
  } catch (error) {
    logger.error('Error en redirectToDashboard:', error);
    // En caso de error, redirigir al dashboard principal
    redirect('/dashboard');
  }
}

