/**
 * Utilidad para manejar el guardado y restauración de credenciales
 * cuando el usuario marca "Recuérdame" en el formulario de login
 */

const REMEMBER_ME_KEY = 'aprende-y-aplica-remember-me';

export interface RememberedCredentials {
  emailOrUsername: string;
  password: string;
}

/**
 * Guarda las credenciales en localStorage
 */
export function saveCredentials(credentials: RememberedCredentials): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(REMEMBER_ME_KEY, JSON.stringify(credentials));
  } catch (error) {
    console.error('Error al guardar credenciales:', error);
  }
}

/**
 * Obtiene las credenciales guardadas de localStorage
 */
export function getSavedCredentials(): RememberedCredentials | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const saved = localStorage.getItem(REMEMBER_ME_KEY);
    if (!saved) return null;
    
    return JSON.parse(saved) as RememberedCredentials;
  } catch (error) {
    console.error('Error al obtener credenciales guardadas:', error);
    return null;
  }
}

/**
 * Elimina las credenciales guardadas de localStorage
 */
export function clearSavedCredentials(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(REMEMBER_ME_KEY);
  } catch (error) {
    console.error('Error al eliminar credenciales guardadas:', error);
  }
}

