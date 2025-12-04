'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Calendar, Clock, BookOpen, Coffee, Settings } from 'lucide-react';
import { LearningRouteSelector } from './LearningRouteSelector';
import { DaySelector } from './DaySelector';
import { TimeSlotConfig } from './TimeSlotConfig';
import { StudyRestSettings } from './StudyRestSettings';
import { PlanSummary } from './PlanSummary';

type Step = 'route' | 'days' | 'settings' | 'schedule' | 'summary';

interface ManualPlanWizardProps {
  onComplete: () => void;
  onCancel: () => void;
}

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  slug: string;
  category: string;
  duration_total_minutes: number;
  level: string;
}

interface ShortestLesson {
  lesson_id: string;
  lesson_title: string;
  total_minutes: number;
  course_title: string;
}

interface BreakInterval {
  interval_minutes: number;
  break_duration_minutes: number;
  break_type: 'short' | 'long';
}

interface PlanConfig {
  learningRouteId: string | null;
  learningRouteName: string;
  selectedCourses: Course[];
  selectedDays: number[];
  timeSlots: Array<{
    day: number;
    startTime: string;
    endTime: string;
  }>;
  minStudyMinutes: number;
  minRestMinutes: number;
  maxStudySessionMinutes: number;
  minLessonTimeMinutes: number; // Tiempo mínimo de lección más corta
  shortestLesson: ShortestLesson | null;
  breakIntervals: BreakInterval[];
}

export function ManualPlanWizard({ onComplete, onCancel }: ManualPlanWizardProps) {
  const [currentStep, setCurrentStep] = useState<Step>('route');
  const [config, setConfig] = useState<PlanConfig>({
    learningRouteId: null,
    learningRouteName: '',
    selectedCourses: [],
    selectedDays: [],
    timeSlots: [],
    minStudyMinutes: 25, // Mejor práctica: Pomodoro (25 min), se ajustará si es menor que minLessonTimeMinutes
    minRestMinutes: 5, // Mejor práctica: descanso corto Pomodoro (5 min)
    maxStudySessionMinutes: 90, // Mejor práctica: máximo 90 min antes de descanso largo (según estudios científicos)
    minLessonTimeMinutes: 15, // Valor por defecto, se actualizará con los cursos seleccionados
    shortestLesson: null,
    breakIntervals: [],
  });

  const steps: Array<{ id: Step; title: string; icon: typeof Calendar }> = [
    { id: 'route', title: 'Ruta', icon: BookOpen },
    { id: 'days', title: 'Días', icon: Calendar },
    { id: 'settings', title: 'Configuración', icon: Settings },
    { id: 'schedule', title: 'Horarios', icon: Clock },
    { id: 'summary', title: 'Resumen', icon: Check },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].id);
    }
  };

  const handlePrevious = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].id);
    }
  };

  const handleComplete = async () => {
    try {
      console.log('🚀 Creando plan manual...', config);
      
      // Validaciones previas antes de enviar
      if (config.selectedCourses.length === 0) {
        alert('Error: Debes seleccionar al menos un curso');
        return;
      }

      if (config.selectedDays.length === 0) {
        alert('Error: Debes seleccionar al menos un día de la semana');
        return;
      }

      if (config.timeSlots.length === 0) {
        alert('Error: Debes configurar al menos un horario de estudio');
        return;
      }
      
      // Preparar datos para el backend
      const planData = {
        name: config.learningRouteName || `Plan de Estudio - ${new Date().toLocaleDateString('es-ES')}`,
        description: `Plan con ${config.selectedCourses.length} curso(s)`,
        learning_route_id: config.learningRouteId,
        course_ids: config.selectedCourses.map(c => c.id),
        preferred_days: config.selectedDays,
        preferred_time_blocks: config.timeSlots.map(slot => ({
          start: slot.startTime,
          end: slot.endTime,
          label: getDayLabel(slot.day),
          day: slot.day, // Incluir también el número del día para mayor compatibilidad
        })),
        min_study_minutes: config.minStudyMinutes,
        min_rest_minutes: config.minRestMinutes,
        max_study_session_minutes: config.maxStudySessionMinutes,
        break_intervals: config.breakIntervals,
        goal_hours_per_week: parseFloat(calculateTotalHours()),
      };

      console.log('📤 Enviando datos del plan:', {
        ...planData,
        preferred_days_count: planData.preferred_days.length,
        preferred_time_blocks_count: planData.preferred_time_blocks.length,
        course_ids_count: planData.course_ids.length,
      });

      // Crear el plan llamando al endpoint
      console.log('📡 Iniciando petición al servidor...');
      const startTime = Date.now();
      
      const response = await fetch('/api/study-planner/manual/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(planData),
      });

      const requestDuration = Date.now() - startTime;
      console.log(`⏱️ Petición completada en ${requestDuration}ms`, {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      });

      // Leer la respuesta antes de verificar el estado
      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        console.error('❌ Error parseando respuesta:', parseError);
        alert('Error: No se pudo procesar la respuesta del servidor. Por favor, intenta de nuevo.');
        return;
      }

      if (!response.ok) {
        console.error('❌ Error creando plan:', {
          status: response.status,
          statusText: response.statusText,
          error: result,
        });
        
        const errorMessage = result?.error || 'Error desconocido';
        const errorDetails = result?.details ? `\n\nDetalles: ${result.details}` : '';
        const errorHint = result?.hint ? `\n\nSugerencia: ${result.hint}` : '';
        
        alert(`Error al crear el plan: ${errorMessage}${errorDetails}${errorHint}`);
        return;
      }

      // Validar que la respuesta contiene los datos esperados
      if (!result || !result.success) {
        console.error('❌ Respuesta inválida del servidor:', result);
        alert('Error: La respuesta del servidor no es válida. Por favor, intenta de nuevo.');
        return;
      }

      // Validar que el plan se creó correctamente
      if (!result.plan || !result.plan.id) {
        console.error('❌ Plan no incluido en la respuesta:', result);
        alert('Error: El plan no se creó correctamente. Por favor, intenta de nuevo.');
        return;
      }

      // Verificar que el plan fue verificado en el servidor
      if (result.verified !== true) {
        console.warn('⚠️ Plan creado pero no verificado:', result);
        // Continuar de todas formas, pero registrar la advertencia
      }

      console.log('✅ Plan creado exitosamente:', {
        planId: result.plan.id,
        planName: result.plan.name,
        sessionsCreated: result.sessions_created || 0,
        verified: result.verified,
      });
      
      // Esperar un momento para asegurar que todo se guardó correctamente
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Redirigir al dashboard después de crear el plan
      onComplete();
    } catch (error) {
      console.error('💥 Error en handleComplete:', {
        error,
        message: error instanceof Error ? error.message : 'Error desconocido',
        stack: error instanceof Error ? error.stack : undefined,
      });
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Error desconocido al crear el plan';
      
      alert(`Error al crear el plan: ${errorMessage}\n\nPor favor, verifica tu conexión e intenta de nuevo.`);
    }
  };

  const getDayLabel = (day: number): string => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[day] || '';
  };

  const calculateTotalHours = (): string => {
    let totalMinutes = 0;
    config.timeSlots.forEach(slot => {
      const [startHour, startMin] = slot.startTime.split(':').map(Number);
      const [endHour, endMin] = slot.endTime.split(':').map(Number);
      const start = startHour * 60 + startMin;
      const end = endHour * 60 + endMin;
      totalMinutes += end - start;
    });
    return (totalMinutes / 60).toFixed(1);
  };

  const handleRouteSelect = async (routeId: string | null, courses: Course[]) => {
    console.log('🔄 handleRouteSelect llamado:', {
      routeId,
      coursesCount: courses.length,
      courses: courses.map(c => ({ id: c.id, title: c.title })),
    });

    if (!courses || courses.length === 0) {
      console.error('❌ No se recibieron cursos en handleRouteSelect');
      alert('Error: La ruta seleccionada no tiene cursos asociados. Por favor, selecciona otra ruta o crea una nueva.');
      return;
    }

    // Obtener tiempo mínimo de lecciones y lección más corta
    const { minTime, shortestLesson } = await getMinLessonTime(courses.map(c => c.id));
    console.log('⏱️ Tiempo mínimo de lección:', minTime);
    console.log('📚 Lección más corta:', shortestLesson);
    
    // Obtener nombre de la ruta si existe
    let routeName = '';
    if (routeId) {
      try {
        const res = await fetch(`/api/study-planner/routes/${routeId}`);
        if (res.ok) {
          const data = await res.json();
          routeName = data.route?.name || '';
          console.log('📝 Nombre de ruta obtenido:', routeName);
        }
      } catch (error) {
        console.error('Error fetching route name:', error);
      }
    }
    
    // Ajustar minStudyMinutes: usar el máximo entre el valor actual (25 min Pomodoro) y el tiempo mínimo de lección
    // Esto asegura que siempre se pueda completar al menos una lección por sesión
    const adjustedMinStudy = Math.max(25, minTime);
    
    const newConfig = {
      ...config,
      learningRouteId: routeId,
      learningRouteName: routeName,
      selectedCourses: courses,
      minLessonTimeMinutes: minTime,
      shortestLesson: shortestLesson,
      minStudyMinutes: adjustedMinStudy, // Ajustar automáticamente si es necesario
    };

    console.log('✅ Actualizando config con:', {
      learningRouteId: newConfig.learningRouteId,
      learningRouteName: newConfig.learningRouteName,
      selectedCoursesCount: newConfig.selectedCourses.length,
      minLessonTimeMinutes: newConfig.minLessonTimeMinutes,
      shortestLesson: newConfig.shortestLesson,
      minStudyMinutes: newConfig.minStudyMinutes,
    });

    setConfig(newConfig);
    
    // Verificar que el estado se actualizó correctamente
    setTimeout(() => {
      console.log('🔍 Estado después de actualizar (verificación):', {
        canProceed: canProceed(),
        selectedCoursesCount: newConfig.selectedCourses.length,
      });
    }, 100);
  };

  const handleNewRoute = async (name: string, courses: Course[]) => {
    // Crear nueva ruta
    try {
      console.log('🚀 Creando ruta desde ManualPlanWizard:', { name, courses: courses.length });
      
      const res = await fetch('/api/study-planner/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name, 
          courseIds: courses.map(c => c.id),
          description: `Ruta de aprendizaje con ${courses.length} curso(s)`
        }),
      });
      
      const responseData = await res.json();
      console.log('📦 Respuesta del servidor:', { status: res.status, data: responseData });
      
      if (!res.ok) {
        throw new Error(responseData.error || 'Error al crear la ruta');
      }
      
      if (res.ok && responseData.route) {
        const { minTime, shortestLesson } = await getMinLessonTime(courses.map(c => c.id));
        
        // Ajustar minStudyMinutes: usar el máximo entre el valor actual (25 min Pomodoro) y el tiempo mínimo de lección
        const adjustedMinStudy = Math.max(25, minTime);
        
        setConfig({
          ...config,
          learningRouteId: responseData.route.id,
          learningRouteName: name,
          selectedCourses: courses,
          minLessonTimeMinutes: minTime,
          shortestLesson: shortestLesson,
          minStudyMinutes: adjustedMinStudy, // Ajustar automáticamente si es necesario
        });
        
        console.log('✅ Ruta creada exitosamente:', responseData.route.id);
      } else {
        throw new Error('No se recibió la ruta creada');
      }
    } catch (error) {
      console.error('❌ Error creating route:', error);
      alert(`Error al crear la ruta: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      throw error; // Re-lanzar para que el componente padre sepa que falló
    }
  };

  const getMinLessonTime = async (courseIds: string[]): Promise<{ minTime: number; shortestLesson: ShortestLesson | null }> => {
    try {
      const res = await fetch('/api/study-planner/min-lesson-time', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseIds }),
      });
      
      if (res.ok) {
        const data = await res.json();
        return {
          minTime: data.minTimeMinutes || 15,
          shortestLesson: data.shortestLesson || null,
        };
      }
    } catch (error) {
      console.error('Error getting min lesson time:', error);
    }
    return { minTime: 15, shortestLesson: null }; // Valor por defecto
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'route':
        return config.selectedCourses.length > 0;
      case 'days':
        return config.selectedDays.length > 0;
      case 'settings':
        // Validación CRÍTICA: el tiempo mínimo de estudio debe ser >= duración mínima de lección
        // Esto asegura que el usuario pueda completar al menos una lección por sesión
        return config.minStudyMinutes >= config.minLessonTimeMinutes && 
               config.minRestMinutes >= 5 && 
               config.maxStudySessionMinutes >= config.minStudyMinutes;
      case 'schedule':
        return config.timeSlots.length > 0;
      case 'summary':
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={onCancel}
            className="mb-6 flex items-center gap-2 text-white/80 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Volver a selección</span>
          </button>

          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white">Plan Manual</h1>
              <p className="text-gray-300 mt-1">Configura tu plan de estudios paso a paso</p>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStepIndex;
              const isCompleted = index < currentStepIndex;
              const isAccessible = index <= currentStepIndex;

              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <motion.button
                      onClick={() => isAccessible && setCurrentStep(step.id)}
                      disabled={!isAccessible}
                      className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                        isActive
                          ? 'bg-gradient-to-br from-blue-500 to-cyan-500 scale-110 shadow-lg'
                          : isCompleted
                          ? 'bg-green-500'
                          : 'bg-slate-700/50'
                      } ${isAccessible ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed opacity-50'}`}
                      whileHover={isAccessible ? { scale: 1.1 } : {}}
                      whileTap={isAccessible ? { scale: 0.95 } : {}}
                    >
                      {isCompleted ? (
                        <Check className="w-6 h-6 text-white" />
                      ) : (
                        <Icon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                      )}
                      {isActive && (
                        <motion.div
                          className="absolute inset-0 rounded-full border-2 border-blue-400"
                          animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.5, 0, 0.5],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                          }}
                        />
                      )}
                    </motion.button>
                    <span
                      className={`mt-2 text-xs sm:text-sm font-medium ${
                        isActive ? 'text-white' : 'text-gray-400'
                      }`}
                    >
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-1 mx-2 rounded ${
                        isCompleted ? 'bg-green-500' : 'bg-slate-700/50'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-slate-800/90 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 sm:p-8 lg:p-10"
          >
            {currentStep === 'route' && (
              <LearningRouteSelector
                onRouteSelect={handleRouteSelect}
                onNewRoute={handleNewRoute}
              />
            )}

            {currentStep === 'days' && (
              <DaySelector
                selectedDays={config.selectedDays}
                onChange={(days) => setConfig({ ...config, selectedDays: days })}
              />
            )}

            {currentStep === 'settings' && (
              <StudyRestSettings
                minStudyMinutes={config.minStudyMinutes}
                minRestMinutes={config.minRestMinutes}
                maxStudySessionMinutes={config.maxStudySessionMinutes}
                minLessonTimeMinutes={config.minLessonTimeMinutes}
                shortestLesson={config.shortestLesson}
                breakIntervals={config.breakIntervals}
                onChange={(settings) => setConfig({ ...config, ...settings })}
                onBreakIntervalsChange={(intervals) => setConfig({ ...config, breakIntervals: intervals })}
              />
            )}

            {currentStep === 'schedule' && (
              <TimeSlotConfig
                selectedDays={config.selectedDays}
                timeSlots={config.timeSlots}
                onChange={(slots) => setConfig({ ...config, timeSlots: slots })}
              />
            )}

            {currentStep === 'summary' && (
              <PlanSummary config={config} />
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-700/50">
              <button
                onClick={handlePrevious}
                disabled={currentStepIndex === 0}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                  currentStepIndex === 0
                    ? 'bg-slate-700/30 text-gray-500 cursor-not-allowed'
                    : 'bg-slate-700/50 text-white hover:bg-slate-700/70'
                }`}
              >
                <ArrowLeft className="w-5 h-5" />
                Anterior
              </button>

              {currentStepIndex < steps.length - 1 ? (
                <button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                    canProceed()
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:shadow-lg hover:scale-105'
                      : 'bg-slate-700/30 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Siguiente
                  <ArrowRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={handleComplete}
                  disabled={!canProceed()}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                    canProceed()
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-lg hover:scale-105'
                      : 'bg-slate-700/30 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <Check className="w-5 h-5" />
                  Crear Plan
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
