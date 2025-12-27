
import { NextRequest, NextResponse } from 'next/server';

interface Lesson {
  lessonId: string;
  lessonTitle: string;
  moduleTitle: string;
  durationMinutes: number;
}

interface Preferences {
  days: string[]; // ['lunes', 'martes', ...]
  times: string[]; // ['mañana', 'tarde', 'noche']
  startDate?: string;
}

interface StudyBlock {
  lessons: Lesson[];
  totalDuration: number;
  mainLessonNum?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lessons, preferences, deadlineDate } = body;

    if (!lessons || !preferences) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 });
    }

    const result = generateDeterministicPlan(lessons as Lesson[], preferences as Preferences, deadlineDate, body.maxSessionMinutes || 50);

    if (typeof result !== 'string') {
       return NextResponse.json(result);
    }

    return NextResponse.json({ plan: result });
  } catch (error) {
    console.error('Error generando plan:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

function generateDeterministicPlan(lessons: Lesson[], preferences: Preferences, deadlineDate?: string, maxSessionMinutes: number = 50): string |  { exceedsDeadline: boolean, endDate: string, deadline: string, daysExcess: number, plan: null } {
  // 1. Agrupar lecciones (Lógica Indivisible X + X.1)
  const blocks = groupLessons(lessons);

  // 2. Generar slots de tiempo disponibles
  // Calculamos slots asumiendo el peor caso (1 bloque por slot), pero luego optimizaremos
  const slots = generateTimeSlots(preferences, blocks.length);

  // 3. Asignar bloques a slots (Optimización de llenado)
  let currentBlockIndex = 0;
  
  // Mapeo de slots por semana
  const weeks: { [key: number]: { date: Date, slots: any[] }[] } = {};

  for (const slot of slots) {
    if (currentBlockIndex >= blocks.length) break;

    // Intentar meter tantos bloques como quepan en este slot
    let slotDuration = 0;
    const slotBlocks: StudyBlock[] = [];
    
    while (currentBlockIndex < blocks.length) {
      const candidateBlock = blocks[currentBlockIndex];
      // Si cabe en la sesión O si es el primer bloque (siempre debe entrar al menos uno aunque sea largo)
      if (slotDuration + candidateBlock.totalDuration <= maxSessionMinutes + 10 || slotBlocks.length === 0) {
         slotBlocks.push(candidateBlock);
         slotDuration += candidateBlock.totalDuration;
         currentBlockIndex++;
      } else {
         // Ya no cabe, pasar al siguiente slot
         break;
      }
    }

    const weekNum = getWeekNumber(slot.date, new Date(preferences.startDate || new Date()));
    
    if (!weeks[weekNum]) weeks[weekNum] = [];
    
    let dayEntry = weeks[weekNum].find(d => d.date.toDateString() === slot.date.toDateString());
    if (!dayEntry) {
      dayEntry = { date: slot.date, slots: [] };
      weeks[weekNum].push(dayEntry);
    }

    // Calcular hora fin real
    const startTimeParts = slot.time.split(':');
    const startHour = parseInt(startTimeParts[0]);
    const startMin = parseInt(startTimeParts[1]);
    
    const endDate = new Date(slot.date);
    endDate.setHours(startHour, startMin + slotDuration);
    
    const endHourStr = endDate.getHours().toString().padStart(2, '0');
    const endMinStr = endDate.getMinutes().toString().padStart(2, '0');

    dayEntry.slots.push({
      start: slot.time,
      end: `${endHourStr}:${endMinStr}`,
      period: slot.period,
      blocks: slotBlocks, // Ahora guardamos lista de bloques
      totalDuration: slotDuration
    });
  }

  // 4. Formatear salida texto
  const sortedWeeks = Object.keys(weeks).sort((a,b) => Number(a)-Number(b));
  
  if (sortedWeeks.length === 0) return "No se pudo generar un plan con las preferencias dadas.";

  const startDate = weeks[Number(sortedWeeks[0])][0].date;
  // Obtener la última fecha de la última semana
  const lastWeekNum = Number(sortedWeeks[sortedWeeks.length - 1]);
  const lastWeekDays = weeks[lastWeekNum];
  const lastDate = lastWeekDays[lastWeekDays.length - 1].date;

  const startStr = startDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
  const endStr = lastDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  
  let planString = '';

  // VALIDACIÓN DE FECHA LÍMITE
  let deadlineWarning = '';
  if (deadlineDate) {
    const deadline = new Date(deadlineDate);
    // Comparar fechas (ignorando horas)
    const checkDate = new Date(lastDate);
    checkDate.setHours(0,0,0,0);
    deadline.setHours(0,0,0,0); // Asegurar comparacion justa

    if (checkDate > deadline) {
      const deadlineStr = deadline.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
      
      // NO devolvemos el plan, solo los datos de validación
      // Esto fuerza al frontend a pedir nuevos horarios
      return {
        exceedsDeadline: true,
        endDate: endStr,
        deadline: deadlineStr,
        daysExcess: Math.ceil((checkDate.getTime() - deadline.getTime()) / (1000 * 3600 * 24)),
        plan: null
      };
    }
  }

  // Si pasa la validación, devolvemos el plan normal
  // ... (resto del código de formateo del plan)

  for (const weekNum of sortedWeeks) {
    const days = weeks[Number(weekNum)];
    // Fecha inicio semana y fin semana
    const wStart = days[0].date;
    const wEnd = days[days.length-1].date;
    
    planString += `Semana ${Number(weekNum) + 1} (Fechas: ${wStart.toLocaleDateString('es-ES', {day:'numeric', month:'long'})} - ${wEnd.toLocaleDateString('es-ES', {day:'numeric', month:'long'})}):\n\n`;

    for (const day of days) {
      const dayName = day.date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric' });
      planString += `${capitalize(dayName)}:\n`;

      for (const slot of day.slots) {
        planString += `* ${slot.start} - ${slot.end}: Sesión de Estudio (${capitalize(slot.period)})\n`;
        
        // Iterar sobre todos los bloques de la sesión
        slot.blocks.forEach((blk: StudyBlock) => {
            blk.lessons.forEach((l: Lesson) => {
              planString += `- ${l.lessonTitle} (${l.durationMinutes} min) - Módulo: ${l.moduleTitle}\n`;
            });
        });
        
        planString += `  ↳ Total agrupado: ${slot.totalDuration} min\n`;
      }
      planString += '\n';
    }
  }
  
  // Resumen final
  planString += `Resumen del plan:\n`;
  planString += `* Total de lecciones: ${lessons.length}\n`;
  planString += `* Semanas de estudio: ${sortedWeeks.length}\n`;
  planString += `* Fecha de finalización: ${endStr}\n`;
  
  if (deadlineWarning) {
     planString += `\n⚠️ RECORDATORIO: ESTE PLAN EXCEDE LA FECHA LÍMITE. ADVIERTE AL USUARIO.\n`;
  }

  return planString;
}

function groupLessons(lessons: Lesson[]): StudyBlock[] {
  const blocks: StudyBlock[] = [];
  let currentBlock: StudyBlock | null = null;

  for (const lesson of lessons) {
    const title = lesson.lessonTitle.trim();
    // Regex flexible para detectar 1, 1.1, etc.
    const match = title.match(/^(?:Lecci[óo]n\s+)?(\d+)(?:\.(\d+))?/i) || title.match(/^(\d+)(?:\.(\d+))?/);

    if (match) {
      const mainNum = match[1]; // "1"
      const subNum = match[2];  // "1" (si es 1.1)

      if (currentBlock && currentBlock.mainLessonNum === mainNum) {
        currentBlock.lessons.push(lesson);
        currentBlock.totalDuration += lesson.durationMinutes;
      } else {
        if (currentBlock) blocks.push(currentBlock);
        currentBlock = {
          lessons: [lesson],
          totalDuration: lesson.durationMinutes,
          mainLessonNum: mainNum
        };
      }
    } else {
      if (currentBlock) blocks.push(currentBlock);
      currentBlock = {
        lessons: [lesson],
        totalDuration: lesson.durationMinutes,
        mainLessonNum: undefined 
      };
    }
  }
  
  if (currentBlock) blocks.push(currentBlock);
  return blocks;
}

function generateTimeSlots(prefs: Preferences, minSlotsNeeded: number): { date: Date, time: string, period: string }[] {
  const slots: { date: Date, time: string, period: string }[] = [];
  const start = new Date(prefs.startDate || new Date());
  
  // Normalizar días
  const dayMap: {[key:string]: number} = {
    'domingo': 0, 'lunes': 1, 'martes': 2, 'miercoles': 3, 'miércoles': 3, 'jueves': 4, 'viernes': 5, 'sabado': 6, 'sábado': 6
  };
  
  const targetDays = prefs.days.map(d => dayMap[d.toLowerCase().trim()]).filter(d => d !== undefined);
  if (targetDays.length === 0) targetDays.push(1,2,3,4,5); // Default L-V

  const timeMap: {[key:string]: string} = { 'mañana': '08:00', 'tarde': '14:00', 'noche': '20:00' };
  
  const targetTimes = prefs.times.map(t => ({ 
    period: t.toLowerCase(), 
    time: timeMap[t.toLowerCase()] || '09:00' 
  }));
  if (targetTimes.length === 0) targetTimes.push({ period: 'mañana', time: '09:00' });

  // Generar slots - Aumentamos el límite de iteraciones por si el plan es muy largo
  let currentDate = new Date(start);
  if (currentDate.getHours() > 18) currentDate.setDate(currentDate.getDate() + 1);
  currentDate.setHours(0,0,0,0);

  let iterations = 0;
  // Aumentar iteraciones para permitir planes largos que exceden la fecha límite (para poder detectar el exceso)
  while (slots.length < minSlotsNeeded && iterations < 730) { 
    const dayOfWeek = currentDate.getDay();
    
    if (targetDays.includes(dayOfWeek)) {
      for (const timeConfig of targetTimes) {
          const slotDate = new Date(currentDate);
          slots.push({
            date: slotDate,
            time: timeConfig.time,
            period: timeConfig.period
          });
          
          if (slots.length >= minSlotsNeeded) break;
      }
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
    iterations++;
  }
  
  return slots;
}

function getWeekNumber(date: Date, startDate: Date): number {
    const diff = date.getTime() - startDate.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 7));
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
