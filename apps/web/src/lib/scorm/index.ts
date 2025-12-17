// Parser y validación
export { parseScormManifest, validateScormPackage } from './parser';
export type { ScormManifest } from './parser';

export { validatePackageSecurity, validateManifestExists, getPackageSize } from './validator';

// Tipos
export type {
  SCORMVersion,
  ScormPackage,
  ScormAttempt,
  ScormInteraction,
  ScormObjective,
  SCORMAdapterConfig,
  SCORMPlayerProps,
  SCORMUploaderProps,
  CMIData,
  ScormUploadResponse,
  ScormInitializeResponse,
  ScormRuntimeResponse,
  ScormPackagesResponse,
} from './types';

// Sanitización y validación de datos CMI
export {
  sanitizeCMIValue,
  validateCMIKey,
  parseLessonStatus,
  parseScore,
  parseScaledScore,
} from './sanitize';

// Rate limiting
export { rateLimit, getRateLimitHeaders, rateLimitUpload } from './rate-limit';

// Session cache (solo para uso interno en APIs)
export {
  getSessionCache,
  setSessionValue,
  getSessionValue,
  clearSessionCache,
  hasSessionCache,
} from './session-cache';
