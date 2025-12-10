/**
 * Servicio de Días Festivos
 *
 * Proporciona funcionalidades para verificar si una fecha es festivo,
 * obtener festivos en un rango de fechas, etc.
 *
 * Incluye cache de performance para evitar recalcular festivos.
 */

import { Holiday, CountryHolidays, HOLIDAYS_BY_COUNTRY } from './holidays.config';

export class HolidayService {
  // Cache de festivos por año y país
  private static holidayCache = new Map<string, Set<string>>();

  // Mapeo de normalización de códigos de país
  private static readonly COUNTRY_NORMALIZATION: Record<string, string> = {
    // México
    'mexico': 'MX',
    'méxico': 'MX',
    'mx': 'MX',
    'mex': 'MX',

    // España
    'españa': 'ES',
    'espana': 'ES',
    'spain': 'ES',
    'es': 'ES',
    'esp': 'ES',

    // Estados Unidos
    'usa': 'US',
    'us': 'US',
    'estados unidos': 'US',
    'united states': 'US',
    'america': 'US',

    // Colombia
    'colombia': 'CO',
    'co': 'CO',
    'col': 'CO',

    // Argentina
    'argentina': 'AR',
    'ar': 'AR',
    'arg': 'AR',

    // Chile
    'chile': 'CL',
    'cl': 'CL',
    'chi': 'CL',

    // Perú
    'peru': 'PE',
    'perú': 'PE',
    'pe': 'PE',
    'per': 'PE',
  };

  /**
   * Normaliza un código de país a formato ISO 3166-1 alpha-2
   * @param countryInput - Código de país en cualquier formato
   * @returns Código de país normalizado (ej: "MX", "ES", "US")
   */
  static normalizeCountryCode(countryInput: string | undefined | null): string {
    if (!countryInput) {
      return 'MX'; // Default a México
    }

    const normalized = this.COUNTRY_NORMALIZATION[countryInput.toLowerCase().trim()];
    return normalized || 'MX'; // Default a México si no se encuentra
  }

  /**
   * Obtiene un Set de fechas festivas para un país y año específico
   * Usa cache para mejorar performance
   *
   * @param countryCode - Código del país (ej: "MX", "ES", "US")
   * @param year - Año
   * @returns Set de fechas en formato "YYYY-MM-DD"
   */
  static getHolidayDatesForYear(countryCode: string, year: number): Set<string> {
    const normalizedCountry = this.normalizeCountryCode(countryCode);
    const cacheKey = `${normalizedCountry}-${year}`;

    // Verificar cache
    if (this.holidayCache.has(cacheKey)) {
      return this.holidayCache.get(cacheKey)!;
    }

    // Generar set de fechas festivas
    const holidaySet = new Set<string>();
    const countryHolidays = HOLIDAYS_BY_COUNTRY[normalizedCountry];

    if (!countryHolidays) {
      console.warn(`No hay festivos configurados para el país: ${normalizedCountry}`);
      this.holidayCache.set(cacheKey, holidaySet);
      return holidaySet;
    }

    for (const holiday of countryHolidays.holidays) {
      let dateStr: string | null = null;

      if (holiday.type === 'fixed' && holiday.date) {
        // Festivo fijo: "MM-DD" → "YYYY-MM-DD"
        dateStr = `${year}-${holiday.date}`;
      } else if (holiday.type === 'variable' && holiday.calculator) {
        // Festivo variable: calcular usando función
        try {
          const calculatedDate = holiday.calculator(year);
          dateStr = this.formatDate(calculatedDate);
        } catch (error) {
          console.error(`Error calculando festivo variable "${holiday.name}" para ${year}:`, error);
        }
      }

      if (dateStr) {
        holidaySet.add(dateStr);
      }
    }

    // Guardar en cache
    this.holidayCache.set(cacheKey, holidaySet);
    return holidaySet;
  }

  /**
   * Verifica si una fecha es festivo en un país específico
   *
   * @param date - Fecha a verificar
   * @param countryCode - Código del país
   * @returns true si es festivo, false en caso contrario
   */
  static isHoliday(date: Date, countryCode: string): boolean {
    const year = date.getFullYear();
    const dateStr = this.formatDate(date);
    const holidays = this.getHolidayDatesForYear(countryCode, year);
    return holidays.has(dateStr);
  }

  /**
   * Obtiene todos los festivos en un rango de fechas
   *
   * @param startDate - Fecha de inicio
   * @param endDate - Fecha de fin
   * @param countryCode - Código del país
   * @returns Array de objetos Date con los festivos en el rango
   */
  static getHolidaysInRange(
    startDate: Date,
    endDate: Date,
    countryCode: string
  ): Array<{ date: Date; name: string }> {
    const holidays: Array<{ date: Date; name: string }> = [];
    const normalizedCountry = this.normalizeCountryCode(countryCode);
    const countryHolidays = HOLIDAYS_BY_COUNTRY[normalizedCountry];

    if (!countryHolidays) {
      return holidays;
    }

    // Iterar por cada año en el rango
    const startYear = startDate.getFullYear();
    const endYear = endDate.getFullYear();

    for (let year = startYear; year <= endYear; year++) {
      const yearHolidays = this.getHolidayDatesForYear(normalizedCountry, year);

      for (const dateStr of yearHolidays) {
        const holidayDate = new Date(dateStr + 'T00:00:00');

        // Verificar si está en el rango
        if (holidayDate >= startDate && holidayDate <= endDate) {
          const holidayName = this.getHolidayName(holidayDate, normalizedCountry);
          holidays.push({
            date: holidayDate,
            name: holidayName || 'Festivo',
          });
        }
      }
    }

    // Ordenar por fecha
    holidays.sort((a, b) => a.date.getTime() - b.date.getTime());
    return holidays;
  }

  /**
   * Obtiene el nombre de un festivo para una fecha específica
   *
   * @param date - Fecha a consultar
   * @param countryCode - Código del país
   * @returns Nombre del festivo o null si no es festivo
   */
  static getHolidayName(date: Date, countryCode: string): string | null {
    const normalizedCountry = this.normalizeCountryCode(countryCode);
    const countryHolidays = HOLIDAYS_BY_COUNTRY[normalizedCountry];

    if (!countryHolidays) {
      return null;
    }

    const year = date.getFullYear();
    const dateStr = this.formatDate(date);

    for (const holiday of countryHolidays.holidays) {
      let holidayDateStr: string | null = null;

      if (holiday.type === 'fixed' && holiday.date) {
        holidayDateStr = `${year}-${holiday.date}`;
      } else if (holiday.type === 'variable' && holiday.calculator) {
        try {
          const calculatedDate = holiday.calculator(year);
          holidayDateStr = this.formatDate(calculatedDate);
        } catch (error) {
          // Ignorar errores de cálculo
        }
      }

      if (holidayDateStr === dateStr) {
        return holiday.name;
      }
    }

    return null;
  }

  /**
   * Limpia el cache de festivos
   * Útil para testing o para liberar memoria
   */
  static clearCache(): void {
    this.holidayCache.clear();
  }

  /**
   * Limpia el cache de festivos antiguos (años pasados)
   * Mantiene solo los últimos 2 años y los próximos 3 años
   */
  static cleanOldCache(): void {
    const currentYear = new Date().getFullYear();
    const keysToDelete: string[] = [];

    for (const key of this.holidayCache.keys()) {
      const year = parseInt(key.split('-')[1]);
      if (year < currentYear - 2 || year > currentYear + 3) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.holidayCache.delete(key));

    if (keysToDelete.length > 0) {
      console.log(`🗑️ Cache limpiado: ${keysToDelete.length} entradas antiguas eliminadas`);
    }
  }

  /**
   * Formatea una fecha a "YYYY-MM-DD"
   */
  private static formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Verifica si dos fechas son el mismo día
   */
  static isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  /**
   * Obtiene información de configuración de un país
   */
  static getCountryInfo(countryCode: string): CountryHolidays | null {
    const normalizedCountry = this.normalizeCountryCode(countryCode);
    return HOLIDAYS_BY_COUNTRY[normalizedCountry] || null;
  }

  /**
   * Cuenta el número de festivos en un rango de fechas
   */
  static countHolidaysInRange(
    startDate: Date,
    endDate: Date,
    countryCode: string
  ): number {
    return this.getHolidaysInRange(startDate, endDate, countryCode).length;
  }

  /**
   * Obtiene el próximo festivo desde una fecha dada
   */
  static getNextHoliday(
    fromDate: Date,
    countryCode: string
  ): { date: Date; name: string } | null {
    const year = fromDate.getFullYear();
    const holidays = this.getHolidaysInRange(
      fromDate,
      new Date(year, 11, 31), // Fin del año
      countryCode
    );

    if (holidays.length > 0) {
      return holidays[0];
    }

    // Si no hay festivos en lo que queda del año, buscar en el próximo año
    const nextYearHolidays = this.getHolidaysInRange(
      new Date(year + 1, 0, 1),
      new Date(year + 1, 11, 31),
      countryCode
    );

    return nextYearHolidays.length > 0 ? nextYearHolidays[0] : null;
  }
}
