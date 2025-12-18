const MAX_SUSPEND_DATA = 64000; // 64KB (SCORM 2004 limit)
const MAX_LOCATION = 1000;
const MAX_GENERAL = 4096;

export function sanitizeCMIValue(key: string, value: string): string {
  // Truncar según límites SCORM
  if (key === 'cmi.suspend_data' || key === 'cmi.core.suspend_data') {
    return value.slice(0, MAX_SUSPEND_DATA);
  }

  if (key.includes('lesson_location') || key === 'cmi.location') {
    return value.slice(0, MAX_LOCATION);
  }

  // Sanitizar strings generales - remover caracteres potencialmente peligrosos
  return value
    .replace(/[<>]/g, '') // Prevenir XSS básico
    .slice(0, MAX_GENERAL);
}

export function validateCMIKey(key: string): boolean {
  // Solo permitir keys CMI y ADL válidas (SCORM 1.2 y 2004)
  const validPatterns = [
    // SCORM 1.2 - cmi.core.*
    /^cmi\.core\./,

    // SCORM 1.2 & 2004 - datos de suspensión y lanzamiento
    /^cmi\.suspend_data$/,
    /^cmi\.launch_data$/,

    // SCORM 1.2 - comentarios
    /^cmi\.comments$/,
    /^cmi\.comments_from_lms$/,

    // SCORM 2004 - comentarios del learner y LMS
    /^cmi\.comments_from_learner\./,
    /^cmi\.comments_from_lms\./,

    // Interacciones (SCORM 1.2 y 2004)
    /^cmi\.interactions\./,
    /^cmi\.interactions$/,

    // Objetivos (SCORM 1.2 y 2004)
    /^cmi\.objectives\./,
    /^cmi\.objectives$/,

    // SCORM 1.2 - student data/preferences
    /^cmi\.student_data\./,
    /^cmi\.student_preference\./,

    // SCORM 2004 - estados
    /^cmi\.completion_status$/,
    /^cmi\.success_status$/,
    /^cmi\.completion_threshold$/,

    // SCORM 2004 - score
    /^cmi\.score\./,
    /^cmi\.score$/,

    // SCORM 2004 - ubicación y tiempo
    /^cmi\.location$/,
    /^cmi\.session_time$/,
    /^cmi\.total_time$/,

    // SCORM 2004 - exit, entry, mode, credit
    /^cmi\.exit$/,
    /^cmi\.entry$/,
    /^cmi\.mode$/,
    /^cmi\.credit$/,

    // SCORM 2004 - learner info
    /^cmi\.learner_id$/,
    /^cmi\.learner_name$/,
    /^cmi\.learner_preference\./,
    /^cmi\.learner_preference$/,

    // SCORM 2004 - progreso y límites
    /^cmi\.progress_measure$/,
    /^cmi\.scaled_passing_score$/,
    /^cmi\.time_limit_action$/,
    /^cmi\.max_time_allowed$/,

    // SCORM 2004 - ADL namespace (navegación)
    /^adl\.nav\./,
    /^adl\.data\./,

    // Contadores y children (read-only pero pueden ser solicitados)
    /^cmi\._version$/,
    /^cmi\..*\._count$/,
    /^cmi\..*\._children$/,
  ];

  return validPatterns.some((pattern) => pattern.test(key));
}

export function parseLessonStatus(value: string): string {
  const validStatuses = [
    'passed',
    'completed',
    'failed',
    'incomplete',
    'browsed',
    'not attempted',
  ];

  const normalized = value.toLowerCase().trim();
  return validStatuses.includes(normalized) ? normalized : 'incomplete';
}

export function parseScore(value: string): number | null {
  const num = parseFloat(value);
  if (isNaN(num)) return null;
  // Limitar a rango válido
  return Math.max(0, Math.min(100, num));
}

export function parseScaledScore(value: string): number | null {
  const num = parseFloat(value);
  if (isNaN(num)) return null;
  // SCORM 2004 scaled score debe estar entre -1 y 1
  return Math.max(-1, Math.min(1, num));
}
