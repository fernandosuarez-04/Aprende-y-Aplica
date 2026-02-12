
export interface ParsedLesson {
  lessonTitle: string;
  durationMinutes: number;
  courseTitle?: string;
  lessonOrderIndex?: number;
}

export interface ParsedSchedule {
  dateStr: string;
  startTime: string;
  endTime: string;
  lessons: ParsedLesson[];
}

/**
 * Parsea la respuesta de texto de SofLIA/Generador para extraer una estructura de calendario estructurada.
 * Soporta formatos con emojis (📅, ⏰) y Markdown (**Negrita**).
 * Es robusto para detectar múltiples días y bloques horarios.
 */
export function parseSofLIAResponseToSchedules(text: string): ParsedSchedule[] {
  const schedules: ParsedSchedule[] = [];
  const lines = text.split('\n');

  let currentDate = '';
  // let currentTimeRange = ''; 
  let currentStartTime = '';
  let currentEndTime = '';
  let currentLessons: ParsedLesson[] = [];
  
  // Regex patterns
  // Detects: "📅 Lunes 20...", "Lunes 20...", "**Lunes 20...**", "*Lunes 20...*"
  // Use loose matching for days to catch Spanish variations
  const datePattern = /^(?:\*|_|#|📅)?\s*(?:📅)?\s*\*?\*?\s*(Lunes|Martes|Miércoles|Miercoles|Jueves|Viernes|Sábado|Sabado|Domingo)\s+\d+/i;
  
  // Detects time range: "14:00 - 15:00", "⏰ 14:00 - 15:00", "09:00 AM - 10:00 AM"
  // Handles optional AM/PM
  const timePattern = /(\d{1,2}:\d{2}(?:\s?[AaPp][Mm])?)\s*(?:-|a|to)\s*(\d{1,2}:\d{2}(?:\s?[AaPp][Mm])?)/i;
  
  // Detects lessons: "- Lección...", "1. Lección..."
  // Group 1: Title, Group 2: Duration (optional)
  const lessonPattern = /^[-•*]?\s*(?:(?:\d+(?:\.\d+)*)\.?\s+)?(.+?)(?:\s*\((\d+)\s*min\))?$/i;

  const flushCurrent = () => {
    if (currentDate && currentStartTime && currentLessons.length > 0) {
      schedules.push({
        dateStr: normalizeDateString(currentDate),
        startTime: normalizeTime(currentStartTime),
        endTime: normalizeTime(currentEndTime || currentStartTime),
        lessons: [...currentLessons]
      });
    } else {
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const dateMatch = line.match(datePattern);
    const timeMatch = line.match(timePattern);

    // Prioridad 1: Detección de Fecha
    if (dateMatch) {
       // Si teníamos un slot abierto, lo cerramos y guardamos
       if (currentDate && currentStartTime) {
           flushCurrent();
           currentLessons = [];
           currentStartTime = ''; // Reset time for new date
           currentEndTime = '';
       } else if (currentLessons.length > 0) {
           // Caso raro: Lecciones huérfanas sin hora anterior? Las descartamos o asumimos error.
           currentLessons = []; 
       }
       
       // Capturamos la nueva fecha
       currentDate = line;
       continue;
    }

    // Prioridad 2: Detección de Hora
    if (timeMatch) {
       // Si teníamos slot abierto (con fecha y hora anterior), lo cerramos
       if (currentDate && currentStartTime) {
          flushCurrent();
          currentLessons = [];
       }
       // Actualizamos hora
       currentStartTime = timeMatch[1];
       currentEndTime = timeMatch[2];
       continue;
    }

    // Prioridad 3: Detección de Lecciones
    // Solo si tenemos contexto activo (fecha + hora)
    if (currentDate && currentStartTime) {
        // Ignorar líneas de metadatos o totales
        if (line.toLowerCase().includes('total agrupado') || 
            line.toLowerCase().includes('sesion de estudio') || 
            line.toLowerCase().includes('sesión de estudio')) continue;

        // Validar que parece una lección y no basura
        const lessonMatch = line.match(lessonPattern);
        if (lessonMatch) {
            const potentialTitle = lessonMatch[1].trim();
            // Filtrar falsos positivos
            // No debe ser muy corta, no debe ser un separador
            if (potentialTitle.length > 3 && !potentialTitle.match(/^semama|^dia|^bloque/i) && !line.includes('---')) {
               currentLessons.push({
                   lessonTitle: potentialTitle,
                   durationMinutes: parseInt(lessonMatch[2] || '0', 10)
               });
            }
        }
    }
  }
  
  // Flush del último bloque pendiente al terminar el archivo
  flushCurrent();

  return schedules;
}

function normalizeDateString(raw: string): string {
    // Intentar limpiar markdown y emojis para dejar texto plano
    // Ej: "📅 **Lunes 20**" -> "Lunes 20"
    return raw.replace(/[📅⏰]/g, '').replace(/\*\*/g, '').trim();
}

function normalizeTime(raw: string): string {
    return raw.trim();
}
