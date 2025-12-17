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
  // Solo permitir keys CMI válidas
  const validPatterns = [
    /^cmi\.core\./,
    /^cmi\.suspend_data$/,
    /^cmi\.launch_data$/,
    /^cmi\.comments$/,
    /^cmi\.comments_from_lms$/,
    /^cmi\.interactions\.\d+\./,
    /^cmi\.objectives\.\d+\./,
    /^cmi\.student_data\./,
    /^cmi\.student_preference\./,
    /^cmi\.completion_status$/,
    /^cmi\.success_status$/,
    /^cmi\.score\./,
    /^cmi\.location$/,
    /^cmi\.session_time$/,
    /^cmi\.total_time$/,
    /^cmi\.exit$/,
    /^cmi\.entry$/,
    /^cmi\.mode$/,
    /^cmi\.credit$/,
    /^cmi\.learner_id$/,
    /^cmi\.learner_name$/,
    /^cmi\.learner_preference\./,
    /^cmi\.progress_measure$/,
    /^cmi\.scaled_passing_score$/,
    /^cmi\.time_limit_action$/,
    /^cmi\.max_time_allowed$/,
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
