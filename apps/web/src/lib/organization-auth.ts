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
 * Requiere: Plan Team/Business/Enterprise y suscripción activa
 * @param organization Organización a validar
 * @returns true si puede usar login personalizado, false si no
 */
export function canUseCustomLogin(organization: Organization | null): boolean {
  if (!organization) {
    return false;
  }

  // La organización debe estar activa
  if (!organization.is_active) {
    return false;
  }

  // Debe tener un slug válido
  if (!organization.slug || organization.slug.trim() === '') {
    return false;
  }

  // Solo planes Team, Business y Enterprise pueden usar login personalizado
  const allowedPlans = ['team', 'business', 'enterprise'];
  if (!allowedPlans.includes(organization.subscription_plan)) {
    return false;
  }

  // La suscripción debe estar activa o en trial
  const activeStatuses = ['active', 'trial'];
  if (!activeStatuses.includes(organization.subscription_status)) {
    return false;
  }

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

  return `/auth/${organization.slug}`;
}

