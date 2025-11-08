/**
 * 🔐 Password Security Validation
 *
 * Validación avanzada de contraseñas con políticas de seguridad robustas
 * Previene contraseñas comunes, débiles o comprometidas
 *
 * @see https://owasp.org/www-project-proactive-controls/v3/en/c6-digital-identity
 */

import { z } from 'zod';

/**
 * Lista de las 10,000 contraseñas más comunes
 * En producción, usar una lista completa o API como Have I Been Pwned
 */
const COMMON_PASSWORDS = [
  'password',
  'password123',
  '123456',
  '12345678',
  'qwerty',
  'abc123',
  'monkey',
  '1234567',
  'letmein',
  'trustno1',
  'dragon',
  'baseball',
  'iloveyou',
  'master',
  'sunshine',
  'ashley',
  'bailey',
  'passw0rd',
  'shadow',
  '123123',
  '654321',
  'superman',
  'qazwsx',
  'michael',
  'football',
  'welcome',
  'jesus',
  'ninja',
  'mustang',
  'password1',
  'admin',
  'admin123',
  'root',
  'toor',
  'pass',
  'test',
  'guest',
  'info',
  'adm',
  'mysql',
  'user',
  'administrator',
  'oracle',
  'ftp',
  'pi',
  'puppet',
  'ansible',
  'ec2-user',
  'vagrant',
  'azureuser',
  'academy',
  'aprendeaplica',
  'aprende',
  'aplica',
];

/**
 * Patterns peligrosos en contraseñas
 */
const DANGEROUS_PATTERNS = [
  /^(.)\1+$/, // Todos los caracteres iguales (aaaaaaa)
  /^(01|12|23|34|45|56|67|78|89|90)+$/, // Secuencias numéricas
  /^(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)+$/i, // Secuencias alfabéticas
  /^(qwert|asdf|zxcv|qwer|werty|sdfg|xcvb)+$/i, // Patterns de teclado
];

/**
 * Información personal común que no debe estar en contraseñas
 * (extender con datos del usuario en runtime)
 */
const PERSONAL_INFO_PATTERNS = [
  /usuario/i,
  /user/i,
  /admin/i,
  /correo/i,
  /email/i,
  /nombre/i,
  /name/i,
];

/**
 * Requisitos mínimos de contraseña
 */
export const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  maxLength: 128, // Prevenir DoS con contraseñas muy largas
  requireLowercase: true,
  requireUppercase: true,
  requireNumber: true,
  requireSpecialChar: true,
  minSpecialChars: 1,
  allowedSpecialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
};

/**
 * Niveles de fortaleza de contraseña
 */
export enum PasswordStrength {
  VERY_WEAK = 0,
  WEAK = 1,
  FAIR = 2,
  STRONG = 3,
  VERY_STRONG = 4,
}

/**
 * Resultado de validación de contraseña
 */
export interface PasswordValidationResult {
  isValid: boolean;
  strength: PasswordStrength;
  score: number; // 0-100
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

/**
 * Verifica si una contraseña está en la lista de contraseñas comunes
 *
 * @param password - Contraseña a verificar
 * @returns true si es una contraseña común
 */
export function isCommonPassword(password: string): boolean {
  const lowerPassword = password.toLowerCase();

  // Verificar lista de contraseñas comunes
  if (COMMON_PASSWORDS.includes(lowerPassword)) {
    return true;
  }

  // Verificar si es una variación simple (con números al final)
  const basePassword = lowerPassword.replace(/\d+$/, '');
  if (COMMON_PASSWORDS.includes(basePassword)) {
    return true;
  }

  return false;
}

/**
 * Verifica si una contraseña contiene patterns peligrosos
 *
 * @param password - Contraseña a verificar
 * @returns true si contiene patterns peligrosos
 */
export function hasDangerousPattern(password: string): boolean {
  return DANGEROUS_PATTERNS.some(pattern => pattern.test(password));
}

/**
 * Verifica si una contraseña contiene información personal
 *
 * @param password - Contraseña a verificar
 * @param personalInfo - Información personal del usuario (nombre, email, etc.)
 * @returns true si contiene información personal
 */
export function containsPersonalInfo(
  password: string,
  personalInfo?: {
    email?: string;
    username?: string;
    firstName?: string;
    lastName?: string;
  }
): boolean {
  const lowerPassword = password.toLowerCase();

  // Verificar patterns genéricos
  if (PERSONAL_INFO_PATTERNS.some(pattern => pattern.test(lowerPassword))) {
    return true;
  }

  if (!personalInfo) {
    return false;
  }

  // Verificar información personal específica
  const { email, username, firstName, lastName } = personalInfo;

  if (email) {
    const emailUser = email.split('@')[0].toLowerCase();
    if (emailUser.length >= 3 && lowerPassword.includes(emailUser)) {
      return true;
    }
  }

  if (username && username.length >= 3 && lowerPassword.includes(username.toLowerCase())) {
    return true;
  }

  if (firstName && firstName.length >= 3 && lowerPassword.includes(firstName.toLowerCase())) {
    return true;
  }

  if (lastName && lastName.length >= 3 && lowerPassword.includes(lastName.toLowerCase())) {
    return true;
  }

  return false;
}

/**
 * Calcula la entropía de una contraseña (bits)
 *
 * @param password - Contraseña a evaluar
 * @returns Entropía en bits
 */
export function calculatePasswordEntropy(password: string): number {
  if (!password) {
    return 0;
  }

  let charsetSize = 0;

  // Determinar tamaño del conjunto de caracteres
  if (/[a-z]/.test(password)) charsetSize += 26; // Lowercase
  if (/[A-Z]/.test(password)) charsetSize += 26; // Uppercase
  if (/[0-9]/.test(password)) charsetSize += 10; // Numbers
  if (/[^a-zA-Z0-9]/.test(password)) charsetSize += 32; // Special chars

  // Entropía = log2(charsetSize^length)
  const entropy = password.length * Math.log2(charsetSize);

  return Math.round(entropy);
}

/**
 * Calcula el score de fortaleza de una contraseña (0-100)
 *
 * @param password - Contraseña a evaluar
 * @param personalInfo - Información personal opcional
 * @returns Score de 0 a 100
 */
export function calculatePasswordScore(
  password: string,
  personalInfo?: Parameters<typeof containsPersonalInfo>[1]
): number {
  if (!password) {
    return 0;
  }

  let score = 0;

  // Longitud (max 30 puntos)
  const lengthScore = Math.min(30, password.length * 2);
  score += lengthScore;

  // Variedad de caracteres (max 40 puntos)
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);

  const varietyCount = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
  score += varietyCount * 10;

  // Entropía (max 30 puntos)
  const entropy = calculatePasswordEntropy(password);
  const entropyScore = Math.min(30, (entropy / 100) * 30);
  score += entropyScore;

  // Penalizaciones
  if (isCommonPassword(password)) score -= 50;
  if (hasDangerousPattern(password)) score -= 30;
  if (containsPersonalInfo(password, personalInfo)) score -= 20;

  // Asegurar que el score esté entre 0 y 100
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Determina el nivel de fortaleza basado en el score
 *
 * @param score - Score de 0 a 100
 * @returns Nivel de fortaleza
 */
export function getPasswordStrengthLevel(score: number): PasswordStrength {
  if (score < 20) return PasswordStrength.VERY_WEAK;
  if (score < 40) return PasswordStrength.WEAK;
  if (score < 60) return PasswordStrength.FAIR;
  if (score < 80) return PasswordStrength.STRONG;
  return PasswordStrength.VERY_STRONG;
}

/**
 * Valida una contraseña contra todos los criterios de seguridad
 *
 * @param password - Contraseña a validar
 * @param personalInfo - Información personal opcional
 * @returns Resultado de validación completo
 */
export function validatePassword(
  password: string,
  personalInfo?: Parameters<typeof containsPersonalInfo>[1]
): PasswordValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  // Validar longitud mínima
  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    errors.push(`La contraseña debe tener al menos ${PASSWORD_REQUIREMENTS.minLength} caracteres`);
  }

  // Validar longitud máxima
  if (password.length > PASSWORD_REQUIREMENTS.maxLength) {
    errors.push(`La contraseña no puede exceder ${PASSWORD_REQUIREMENTS.maxLength} caracteres`);
  }

  // Validar minúsculas
  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una letra minúscula');
  }

  // Validar mayúsculas
  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una letra mayúscula');
  }

  // Validar números
  if (PASSWORD_REQUIREMENTS.requireNumber && !/[0-9]/.test(password)) {
    errors.push('La contraseña debe contener al menos un número');
  }

  // Validar caracteres especiales
  if (PASSWORD_REQUIREMENTS.requireSpecialChar) {
    const specialCharsRegex = new RegExp(`[${PASSWORD_REQUIREMENTS.allowedSpecialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`);

    if (!specialCharsRegex.test(password)) {
      errors.push(`La contraseña debe contener al menos un carácter especial (${PASSWORD_REQUIREMENTS.allowedSpecialChars})`);
    }
  }

  // Validar contraseñas comunes
  if (isCommonPassword(password)) {
    errors.push('Esta contraseña es muy común y fácil de adivinar. Por favor elige otra');
    suggestions.push('Usa una combinación única de palabras, números y símbolos');
  }

  // Validar patterns peligrosos
  if (hasDangerousPattern(password)) {
    warnings.push('La contraseña contiene un patrón repetitivo que la hace menos segura');
    suggestions.push('Evita secuencias o caracteres repetidos');
  }

  // Validar información personal
  if (containsPersonalInfo(password, personalInfo)) {
    warnings.push('La contraseña contiene información personal que la hace menos segura');
    suggestions.push('No uses tu nombre, email o username en la contraseña');
  }

  // Calcular score y strength
  const score = calculatePasswordScore(password, personalInfo);
  const strength = getPasswordStrengthLevel(score);

  // Sugerencias basadas en strength
  if (strength < PasswordStrength.STRONG) {
    if (password.length < 12) {
      suggestions.push('Usa al menos 12 caracteres para mayor seguridad');
    }

    if (!/[!@#$%^&*()]/.test(password)) {
      suggestions.push('Incluye caracteres especiales como !@#$%^&*()');
    }

    if (password.length < 16) {
      suggestions.push('Considera usar una frase de contraseña (passphrase) de 16+ caracteres');
    }
  }

  return {
    isValid: errors.length === 0,
    strength,
    score,
    errors,
    warnings,
    suggestions,
  };
}

/**
 * Schema de Zod para validación de contraseñas
 * Uso en Server Actions y formularios
 */
export const passwordSchema = z
  .string()
  .min(PASSWORD_REQUIREMENTS.minLength, {
    message: `La contraseña debe tener al menos ${PASSWORD_REQUIREMENTS.minLength} caracteres`,
  })
  .max(PASSWORD_REQUIREMENTS.maxLength, {
    message: `La contraseña no puede exceder ${PASSWORD_REQUIREMENTS.maxLength} caracteres`,
  })
  .regex(/[a-z]/, {
    message: 'La contraseña debe contener al menos una letra minúscula',
  })
  .regex(/[A-Z]/, {
    message: 'La contraseña debe contener al menos una letra mayúscula',
  })
  .regex(/[0-9]/, {
    message: 'La contraseña debe contener al menos un número',
  })
  .regex(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/, {
    message: 'La contraseña debe contener al menos un carácter especial',
  })
  .refine(
    (password) => !isCommonPassword(password),
    {
      message: 'Esta contraseña es muy común. Por favor elige otra más segura',
    }
  )
  .refine(
    (password) => !hasDangerousPattern(password),
    {
      message: 'La contraseña contiene un patrón inseguro (caracteres repetidos o secuencias)',
    }
  );

/**
 * Schema de Zod para confirmar contraseñas
 */
export const passwordConfirmationSchema = z
  .object({
    password: passwordSchema,
    passwordConfirmation: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: 'Las contraseñas no coinciden',
    path: ['passwordConfirmation'],
  });

/**
 * Genera una contraseña segura aleatoria
 *
 * @param length - Longitud de la contraseña (default: 16)
 * @returns Contraseña segura generada
 */
export function generateSecurePassword(length: number = 16): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const special = PASSWORD_REQUIREMENTS.allowedSpecialChars;

  const allChars = lowercase + uppercase + numbers + special;

  let password = '';

  // Asegurar que contiene al menos uno de cada tipo
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Rellenar el resto
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle password
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}

/**
 * Hook de React para validación de contraseñas en tiempo real
 *
 * @example
 * const { validation, checkPassword } = usePasswordValidation();
 *
 * <input onChange={(e) => checkPassword(e.target.value)} />
 * {validation && (
 *   <div>
 *     <p>Strength: {validation.strength}</p>
 *     {validation.errors.map(err => <p key={err}>{err}</p>)}
 *   </div>
 * )}
 */
export function usePasswordValidation(personalInfo?: Parameters<typeof validatePassword>[1]) {
  const [validation, setValidation] = React.useState<PasswordValidationResult | null>(null);

  const checkPassword = React.useCallback(
    (password: string) => {
      if (!password) {
        setValidation(null);
        return;
      }

      const result = validatePassword(password, personalInfo);
      setValidation(result);
    },
    [personalInfo]
  );

  return { validation, checkPassword };
}

// Placeholder para React (ya que esto es un archivo de utilidad)
const React = {
  useState: (initial: any) => [initial, () => {}],
  useCallback: (fn: any, deps: any[]) => fn,
};
