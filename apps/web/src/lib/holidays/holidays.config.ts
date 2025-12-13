/**
 * Configuración de Días Festivos por País
 *
 * Este archivo contiene la definición de festivos para diferentes países,
 * incluyendo festivos fijos y variables.
 */

export interface Holiday {
  name: string;
  type: 'fixed' | 'variable';
  date?: string;                          // "MM-DD" para festivos fijos
  calculator?: (year: number) => Date;    // Para festivos variables (ej: Semana Santa)
  countryCode: string;
  observedOnWeekend?: 'substitute' | 'skip' | 'same';
  isOptional?: boolean;
}

export interface CountryHolidays {
  countryCode: string;
  countryName: string;
  timezone?: string;
  holidays: Holiday[];
  lastUpdated: Date;
}

/**
 * Calcula la fecha de Pascua usando el algoritmo de Computus
 * (Algoritmo de Gauss)
 */
function calculateEaster(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;

  return new Date(year, month - 1, day);
}

/**
 * Calcula Viernes Santo (2 días antes de Pascua)
 */
function calculateGoodFriday(year: number): Date {
  const easter = calculateEaster(year);
  const goodFriday = new Date(easter);
  goodFriday.setDate(easter.getDate() - 2);
  return goodFriday;
}

/**
 * Calcula Jueves Santo (3 días antes de Pascua)
 */
function calculateHolyThursday(year: number): Date {
  const easter = calculateEaster(year);
  const holyThursday = new Date(easter);
  holyThursday.setDate(easter.getDate() - 3);
  return holyThursday;
}

/**
 * Configuración de festivos por país
 */
export const HOLIDAYS_BY_COUNTRY: Record<string, CountryHolidays> = {
  // MÉXICO
  'MX': {
    countryCode: 'MX',
    countryName: 'México',
    timezone: 'America/Mexico_City',
    holidays: [
      {
        name: 'Año Nuevo',
        type: 'fixed',
        date: '01-01',
        countryCode: 'MX',
      },
      {
        name: 'Día de la Constitución',
        type: 'fixed',
        date: '02-05',
        countryCode: 'MX',
      },
      {
        name: 'Natalicio de Benito Juárez',
        type: 'fixed',
        date: '03-21',
        countryCode: 'MX',
      },
      {
        name: 'Jueves Santo',
        type: 'variable',
        calculator: calculateHolyThursday,
        countryCode: 'MX',
      },
      {
        name: 'Viernes Santo',
        type: 'variable',
        calculator: calculateGoodFriday,
        countryCode: 'MX',
      },
      {
        name: 'Día del Trabajo',
        type: 'fixed',
        date: '05-01',
        countryCode: 'MX',
      },
      {
        name: 'Día de la Independencia',
        type: 'fixed',
        date: '09-16',
        countryCode: 'MX',
      },
      {
        name: 'Día de la Revolución',
        type: 'fixed',
        date: '11-20',
        countryCode: 'MX',
      },
      {
        name: 'Navidad',
        type: 'fixed',
        date: '12-25',
        countryCode: 'MX',
      },
      {
        name: 'Nochebuena',
        type: 'fixed',
        date: '12-24',
        countryCode: 'MX',
        isOptional: true,
      },
      {
        name: 'Fin de Año',
        type: 'fixed',
        date: '12-31',
        countryCode: 'MX',
        isOptional: true,
      },
    ],
    lastUpdated: new Date('2024-01-01'),
  },

  // ESPAÑA
  'ES': {
    countryCode: 'ES',
    countryName: 'España',
    timezone: 'Europe/Madrid',
    holidays: [
      {
        name: 'Año Nuevo',
        type: 'fixed',
        date: '01-01',
        countryCode: 'ES',
      },
      {
        name: 'Día de Reyes',
        type: 'fixed',
        date: '01-06',
        countryCode: 'ES',
      },
      {
        name: 'Viernes Santo',
        type: 'variable',
        calculator: calculateGoodFriday,
        countryCode: 'ES',
      },
      {
        name: 'Día del Trabajo',
        type: 'fixed',
        date: '05-01',
        countryCode: 'ES',
      },
      {
        name: 'Asunción de la Virgen',
        type: 'fixed',
        date: '08-15',
        countryCode: 'ES',
      },
      {
        name: 'Día de la Hispanidad',
        type: 'fixed',
        date: '10-12',
        countryCode: 'ES',
      },
      {
        name: 'Todos los Santos',
        type: 'fixed',
        date: '11-01',
        countryCode: 'ES',
      },
      {
        name: 'Día de la Constitución',
        type: 'fixed',
        date: '12-06',
        countryCode: 'ES',
      },
      {
        name: 'Inmaculada Concepción',
        type: 'fixed',
        date: '12-08',
        countryCode: 'ES',
      },
      {
        name: 'Navidad',
        type: 'fixed',
        date: '12-25',
        countryCode: 'ES',
      },
      {
        name: 'Nochebuena',
        type: 'fixed',
        date: '12-24',
        countryCode: 'ES',
        isOptional: true,
      },
      {
        name: 'Fin de Año',
        type: 'fixed',
        date: '12-31',
        countryCode: 'ES',
        isOptional: true,
      },
    ],
    lastUpdated: new Date('2024-01-01'),
  },

  // ESTADOS UNIDOS
  'US': {
    countryCode: 'US',
    countryName: 'United States',
    timezone: 'America/New_York',
    holidays: [
      {
        name: 'New Year\'s Day',
        type: 'fixed',
        date: '01-01',
        countryCode: 'US',
      },
      {
        name: 'Martin Luther King Jr. Day',
        type: 'fixed',
        date: '01-15', // Aproximado (tercer lunes de enero)
        countryCode: 'US',
      },
      {
        name: 'Presidents\' Day',
        type: 'fixed',
        date: '02-19', // Aproximado (tercer lunes de febrero)
        countryCode: 'US',
      },
      {
        name: 'Memorial Day',
        type: 'fixed',
        date: '05-27', // Aproximado (último lunes de mayo)
        countryCode: 'US',
      },
      {
        name: 'Independence Day',
        type: 'fixed',
        date: '07-04',
        countryCode: 'US',
      },
      {
        name: 'Labor Day',
        type: 'fixed',
        date: '09-02', // Aproximado (primer lunes de septiembre)
        countryCode: 'US',
      },
      {
        name: 'Columbus Day',
        type: 'fixed',
        date: '10-14', // Aproximado (segundo lunes de octubre)
        countryCode: 'US',
        isOptional: true,
      },
      {
        name: 'Veterans Day',
        type: 'fixed',
        date: '11-11',
        countryCode: 'US',
      },
      {
        name: 'Thanksgiving',
        type: 'fixed',
        date: '11-28', // Aproximado (cuarto jueves de noviembre)
        countryCode: 'US',
      },
      {
        name: 'Christmas Day',
        type: 'fixed',
        date: '12-25',
        countryCode: 'US',
      },
      {
        name: 'Christmas Eve',
        type: 'fixed',
        date: '12-24',
        countryCode: 'US',
        isOptional: true,
      },
      {
        name: 'New Year\'s Eve',
        type: 'fixed',
        date: '12-31',
        countryCode: 'US',
        isOptional: true,
      },
    ],
    lastUpdated: new Date('2024-01-01'),
  },

  // COLOMBIA
  'CO': {
    countryCode: 'CO',
    countryName: 'Colombia',
    timezone: 'America/Bogota',
    holidays: [
      {
        name: 'Año Nuevo',
        type: 'fixed',
        date: '01-01',
        countryCode: 'CO',
      },
      {
        name: 'Día de Reyes',
        type: 'fixed',
        date: '01-06',
        countryCode: 'CO',
        observedOnWeekend: 'substitute',
      },
      {
        name: 'Jueves Santo',
        type: 'variable',
        calculator: calculateHolyThursday,
        countryCode: 'CO',
      },
      {
        name: 'Viernes Santo',
        type: 'variable',
        calculator: calculateGoodFriday,
        countryCode: 'CO',
      },
      {
        name: 'Día del Trabajo',
        type: 'fixed',
        date: '05-01',
        countryCode: 'CO',
      },
      {
        name: 'Día de la Independencia',
        type: 'fixed',
        date: '07-20',
        countryCode: 'CO',
      },
      {
        name: 'Batalla de Boyacá',
        type: 'fixed',
        date: '08-07',
        countryCode: 'CO',
      },
      {
        name: 'Inmaculada Concepción',
        type: 'fixed',
        date: '12-08',
        countryCode: 'CO',
      },
      {
        name: 'Navidad',
        type: 'fixed',
        date: '12-25',
        countryCode: 'CO',
      },
      {
        name: 'Nochebuena',
        type: 'fixed',
        date: '12-24',
        countryCode: 'CO',
        isOptional: true,
      },
      {
        name: 'Fin de Año',
        type: 'fixed',
        date: '12-31',
        countryCode: 'CO',
        isOptional: true,
      },
    ],
    lastUpdated: new Date('2024-01-01'),
  },
};

/**
 * Lista de países soportados
 */
export const SUPPORTED_COUNTRIES = Object.keys(HOLIDAYS_BY_COUNTRY);

/**
 * Obtener configuración de festivos para un país
 */
export function getCountryHolidays(countryCode: string): CountryHolidays | null {
  return HOLIDAYS_BY_COUNTRY[countryCode.toUpperCase()] || null;
}
