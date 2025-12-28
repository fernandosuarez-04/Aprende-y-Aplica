/**
 * Course Deadline Calculator
 *
 * Pure calculation utilities for deadline suggestions.
 * No server dependencies - can be used in client or server components.
 */

export interface CourseMetadata {
  duration_total_minutes: number;
  lesson_count: number;
  activity_count: number;
  material_count: number;
}

export interface ApproachSuggestion {
  approach: "fast" | "balanced" | "long";
  deadline_date: string; // ISO 8601
  duration_days: number;
  duration_weeks: number;
  hours_per_week: number;
  description: string;
  estimated_completion_rate: string;
}

export interface DeadlineSuggestionsResult {
  course_id: string;
  course_title: string;
  metadata: CourseMetadata;
  suggestions: ApproachSuggestion[];
  calculated_at: string;
}

/**
 * Applies complexity adjustments to the calculated days
 */
function applyComplexityAdjustments(
  days: number,
  metadata: CourseMetadata,
  approach: "fast" | "balanced" | "long"
): number {
  let adjusted = days;
  const totalHours = metadata.duration_total_minutes / 60;

  // Adjustment for high activity count
  if (metadata.activity_count > metadata.lesson_count * 2) {
    adjusted = Math.ceil(adjusted * 1.15); // +15% for interactive courses
  }

  // Adjustment for many materials
  if (metadata.material_count > metadata.lesson_count * 3) {
    adjusted = Math.ceil(adjusted * 1.1); // +10% for material-heavy courses
  }

  // Adjustment for extreme durations
  if (totalHours < 2) {
    // Very short courses
    const minimums = { fast: 3, balanced: 7, long: 14 };
    adjusted = Math.max(adjusted, minimums[approach]);
  } else if (totalHours > 50) {
    // Very long courses
    adjusted = Math.ceil(adjusted * 1.25); // +25% for extensive courses
  }

  return adjusted;
}

/**
 * Adds days to a date
 */
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  // Set to end of day (23:59:59)
  result.setHours(23, 59, 59, 999);
  return result;
}

/**
 * Calculates deadline suggestions for all three approaches
 * Pure function - no database calls
 */
export function calculateDeadlineSuggestions(
  courseId: string,
  courseTitle: string,
  metadata: CourseMetadata,
  startDate: Date = new Date()
): DeadlineSuggestionsResult {
  // Calculate base duration
  const totalHours = metadata.duration_total_minutes / 60;
  // Reduced overhead factor to be more realistic
  const overheadFactor = 1.1; 
  const adjustedHours = totalHours * overheadFactor;

  const suggestions: ApproachSuggestion[] = [];

  // FAST APPROACH
  // Intensivo: ~10-12 hours per week.
  // Goal: Finish ASAP.
  const fastHoursPerWeek = 12;
  let fastDays = Math.ceil((adjustedHours / fastHoursPerWeek) * 7);
  fastDays = applyComplexityAdjustments(fastDays, metadata, "fast");
  // Allow for shorter "sprints" (min 3 days instead of 7)
  fastDays = Math.max(3, Math.min(21, fastDays)); 

  suggestions.push({
    approach: "fast",
    deadline_date: addDays(startDate, fastDays).toISOString(),
    duration_days: fastDays,
    duration_weeks: Math.ceil(fastDays / 7),
    hours_per_week: fastHoursPerWeek,
    description: "Completa el curso rápidamente con dedicación intensiva",
    estimated_completion_rate: "85%",
  });

  // BALANCED APPROACH
  // ~4 hours per week (up from 2.5) to be more realistic for professional dev
  const balancedHoursPerWeek = 4;
  let balancedDays = Math.ceil((adjustedHours / balancedHoursPerWeek) * 7);
  balancedDays = applyComplexityAdjustments(balancedDays, metadata, "balanced");
  balancedDays = Math.max(7, Math.min(60, balancedDays)); 

  suggestions.push({
    approach: "balanced",
    deadline_date: addDays(startDate, balancedDays).toISOString(),
    duration_days: balancedDays,
    duration_weeks: Math.ceil(balancedDays / 7),
    hours_per_week: balancedHoursPerWeek,
    description: "Ritmo moderado y sostenible para profesionales",
    estimated_completion_rate: "92%",
  });

  // LONG APPROACH
  // ~2 hours per week
  const longHoursPerWeek = 2;
  let longDays = Math.ceil((adjustedHours / longHoursPerWeek) * 7);
  longDays = applyComplexityAdjustments(longDays, metadata, "long");
  longDays = Math.max(14, Math.min(120, longDays)); 

  suggestions.push({
    approach: "long",
    deadline_date: addDays(startDate, longDays).toISOString(),
    duration_days: longDays,
    duration_weeks: Math.ceil(longDays / 7),
    hours_per_week: longHoursPerWeek,
    description: "Aprendizaje profundo con tiempo para reflexión",
    estimated_completion_rate: "95%",
  });

  return {
    course_id: courseId,
    course_title: courseTitle,
    metadata,
    suggestions,
    calculated_at: new Date().toISOString(),
  };
}

/**
 * Formats duration for display
 */
export function formatDuration(days: number): string {
  if (days < 7) {
    return `${days} día${days !== 1 ? "s" : ""}`;
  }

  const weeks = Math.ceil(days / 7);
  if (weeks < 5) {
    return `${weeks} semana${weeks !== 1 ? "s" : ""}`;
  }

  const months = Math.ceil(days / 30);
  return `${months} mes${months !== 1 ? "es" : ""}`;
}
