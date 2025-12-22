/**
 * Utilidades para calcular el tiempo estimado de lectura basado en el conteo de palabras.
 * 
 * Referencias de velocidad de lectura (palabras por minuto - PPM):
 * - Lector promedio: 200–220 ppm
 * - Lector cuidadoso / "en modo aprendizaje": 160–190 ppm
 * - Lector rápido: 240–280 ppm
 * 
 * Para contenido educativo, usamos el modo "aprendizaje" (más lento) como referencia.
 */

export type ReadingSpeed = 'slow' | 'average' | 'fast';

interface ReadingSpeedConfig {
    wordsPerMinute: number;
    label: string;
    description: string;
}

export const READING_SPEEDS: Record<ReadingSpeed, ReadingSpeedConfig> = {
    slow: {
        wordsPerMinute: 180,
        label: 'Lectura cuidadosa',
        description: 'Para contenido técnico o que requiere reflexión (160-190 ppm)'
    },
    average: {
        wordsPerMinute: 200,
        label: 'Lectura promedio',
        description: 'Velocidad estándar para textos informativos (200-220 ppm)'
    },
    fast: {
        wordsPerMinute: 250,
        label: 'Lectura rápida',
        description: 'Para lectores experimentados o repaso (240-280 ppm)'
    }
};

// Velocidad por defecto para contenido educativo (lectura reflexiva/aprendizaje)
export const DEFAULT_READING_SPEED: ReadingSpeed = 'slow';

/**
 * Cuenta el número de palabras en un texto.
 * Maneja correctamente espacios múltiples, saltos de línea, tabulaciones, etc.
 */
export function countWords(text: string): number {
    if (!text || typeof text !== 'string') return 0;

    // Limpiar el texto: normalizar espacios en blanco
    const cleanedText = text
        .trim()
        .replace(/[\r\n\t]+/g, ' ')  // Reemplazar saltos de línea y tabs por espacios
        .replace(/\s+/g, ' ');        // Colapsar múltiples espacios en uno

    if (cleanedText.length === 0) return 0;

    // Dividir por espacios y filtrar elementos vacíos
    const words = cleanedText.split(' ').filter(word => word.length > 0);

    return words.length;
}

/**
 * Calcula el tiempo de lectura en minutos.
 * 
 * @param text - El texto a analizar
 * @param speed - Velocidad de lectura a usar ('slow' | 'average' | 'fast')
 * @returns Tiempo en minutos (redondeado al entero más cercano, mínimo 1)
 */
export function calculateReadingTimeMinutes(
    text: string,
    speed: ReadingSpeed = DEFAULT_READING_SPEED
): number {
    const wordCount = countWords(text);

    if (wordCount === 0) return 1; // Mínimo 1 minuto

    const wordsPerMinute = READING_SPEEDS[speed].wordsPerMinute;
    const rawMinutes = wordCount / wordsPerMinute;

    // Redondear al entero más cercano, con un mínimo de 1 minuto
    const roundedMinutes = Math.round(rawMinutes);

    return Math.max(1, roundedMinutes);
}

/**
 * Calcula el tiempo de lectura con detalle adicional.
 * Retorna información más completa sobre el cálculo.
 */
export function calculateReadingTimeDetailed(
    text: string,
    speed: ReadingSpeed = DEFAULT_READING_SPEED
): {
    wordCount: number;
    estimatedMinutes: number;
    exactMinutes: number;
    formattedTime: string;
    speedUsed: ReadingSpeedConfig;
} {
    const wordCount = countWords(text);
    const speedConfig = READING_SPEEDS[speed];

    if (wordCount === 0) {
        return {
            wordCount: 0,
            estimatedMinutes: 1,
            exactMinutes: 0,
            formattedTime: '~1 min',
            speedUsed: speedConfig
        };
    }

    const exactMinutes = wordCount / speedConfig.wordsPerMinute;
    const estimatedMinutes = Math.max(1, Math.round(exactMinutes));

    // Formatear tiempo de manera amigable
    let formattedTime: string;
    if (estimatedMinutes < 60) {
        formattedTime = `~${estimatedMinutes} min`;
    } else {
        const hours = Math.floor(estimatedMinutes / 60);
        const mins = estimatedMinutes % 60;
        formattedTime = mins > 0 ? `~${hours}h ${mins}min` : `~${hours}h`;
    }

    return {
        wordCount,
        estimatedMinutes,
        exactMinutes: Math.round(exactMinutes * 100) / 100, // 2 decimales
        formattedTime,
        speedUsed: speedConfig
    };
}

/**
 * Hook-friendly: calcula tiempo de lectura y retorna un objeto con toda la info.
 * Útil para mostrar feedback en tiempo real mientras el usuario escribe.
 */
export function getReadingTimeInfo(text: string) {
    return calculateReadingTimeDetailed(text, DEFAULT_READING_SPEED);
}
