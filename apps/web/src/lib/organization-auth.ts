/**
 * Utilidades para validar acceso a login personalizado por organización
 */

interface Organization {
  id: string;
  name: string;
  slug: string | null;
  subscription_plan: 'team' | 'business' | 'enterprise';
  subscription_status: 'active' | 'expired' | 'cancelled' | 'trial' | 'pending';
  is_active: boolean;
}

/**
 * Verifica si una organización puede usar login personalizado
 * ✅ SOLO Plan Enterprise tiene acceso al auth personalizado
 * Los planes Team y Business usan el auth normal (/auth)
 * @param organization Organización a validar
 * @returns true si puede usar login personalizado, false si no
 */
export function canUseCustomLogin(organization: Organization | null): boolean {
  if (!organization) {
    console.log('🔒 [canUseCustomLogin] No organization provided');
    return false;
  }

  console.log('🔒 [canUseCustomLogin] Checking organization:', {
    id: organization.id,
    name: organization.name,
    slug: organization.slug,
    is_active: organization.is_active,
    subscription_plan: organization.subscription_plan,
    subscription_status: organization.subscription_status
  });

  // La organización debe estar activa
  if (!organization.is_active) {
    console.log('🔒 [canUseCustomLogin] DENIED: Organization is not active');
    return false;
  }

  // Debe tener un slug válido
  if (!organization.slug || organization.slug.trim() === '') {
    console.log('🔒 [canUseCustomLogin] DENIED: No valid slug');
    return false;
  }

  // ✅ SOLO plan Enterprise puede usar login personalizado
  // Los planes Team y Business usan el auth normal (/auth)
  if (organization.subscription_plan !== 'enterprise') {
    console.log('🔒 [canUseCustomLogin] DENIED: Not enterprise plan, is:', organization.subscription_plan);
    return false;
  }

  // La suscripción debe estar activa o en trial
  const activeStatuses = ['active', 'trial'];
  if (!activeStatuses.includes(organization.subscription_status)) {
    console.log('🔒 [canUseCustomLogin] DENIED: Subscription status not active/trial, is:', organization.subscription_status);
    return false;
  }

  console.log('🔒 [canUseCustomLogin] ALLOWED: All checks passed');
  return true;
}

/**
 * Verifica si una organización permite registro de nuevos usuarios
 * @param organization Organización a validar
 * @returns true si permite registro, false si no
 */
export function allowsNewUserRegistration(organization: Organization | null): boolean {
  if (!canUseCustomLogin(organization)) {
    return false;
  }

  // Por ahora, todas las organizaciones con login personalizado pueden registrar usuarios
  // En el futuro, esto podría ser un flag de configuración
  return true;
}

/**
 * Obtiene la URL de login personalizado para una organización
 * @param organization Organización
 * @returns URL de login personalizado o null si no está disponible
 */
export function getOrganizationLoginUrl(organization: Organization | null): string | null {
  if (!canUseCustomLogin(organization)) {
    return null;
  }

  // organization no puede ser null aquí porque canUseCustomLogin ya lo valida
  return `/auth/${organization!.slug}`;
}

