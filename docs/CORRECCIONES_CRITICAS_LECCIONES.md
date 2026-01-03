# Correcciones Críticas: Sistema de Detección de Lecciones

Este documento contiene las implementaciones específicas para corregir los problemas críticos identificados en el análisis.

---

## 🔴 Corrección 1: Validación en Endpoint de Acceso

### Archivo: `apps/web/src/app/api/courses/[slug]/lessons/[lessonId]/access/route.ts`

**Problema**: El endpoint de acceso no valida si la lección está bloqueada, permitiendo acceso directo a lecciones futuras.

**Solución**:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SessionService } from '@/features/auth/services/session.service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; lessonId: string }> }
) {
  try {
    const { slug, lessonId } = await params;
    const supabase = await createClient();

    // Verificar autenticación
    const currentUser = await SessionService.getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Obtener el curso por slug
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id')
      .eq('slug', slug)
      .single();

    if (courseError || !course) {
      return NextResponse.json(
        { error: 'Curso no encontrado' },
        { status: 404 }
      );
    }

    const courseId = course.id;

    // Obtener o crear enrollment del usuario
    let { data: enrollment, error: enrollmentError } = await supabase
      .from('user_course_enrollments')
      .select('enrollment_id')
      .eq('user_id', currentUser.id)
      .eq('course_id', courseId)
      .single();

    if (enrollmentError || !enrollment) {
      const now = new Date().toISOString();
      const { data: newEnrollment, error: createError } = await supabase
        .from('user_course_enrollments')
        .insert({
          user_id: currentUser.id,
          course_id: courseId,
          enrollment_status: 'active',
          overall_progress_percentage: 0,
          enrolled_at: now,
          started_at: now,
          last_accessed_at: now,
        })
        .select('enrollment_id')
        .single();

      if (createError || !newEnrollment) {
        return NextResponse.json(
          { error: 'Error al crear inscripción' },
          { status: 500 }
        );
      }

      enrollment = newEnrollment;
    }

    const enrollmentId = enrollment.enrollment_id;

    // ✅ NUEVA VALIDACIÓN: Verificar que la lección no esté bloqueada
    // Obtener módulos del curso
    const { data: modules, error: modulesError } = await supabase
      .from('course_modules')
      .select('module_id, module_order_index')
      .eq('course_id', courseId)
      .eq('is_published', true)
      .order('module_order_index', { ascending: true });

    if (modulesError || !modules || modules.length === 0) {
      return NextResponse.json(
        { error: 'El curso no tiene módulos' },
        { status: 404 }
      );
    }

    // Obtener todas las lecciones ordenadas
    const lessonsPromises = modules.map(async (module) => {
      const { data: lessons } = await supabase
        .from('course_lessons')
        .select('lesson_id, lesson_order_index, module_id, title')
        .eq('module_id', module.module_id)
        .eq('is_published', true)
        .order('lesson_order_index', { ascending: true });

      return (lessons || []).map((lesson: any) => ({
        ...lesson,
        module_order_index: module.module_order_index,
      }));
    });

    const lessonsArrays = await Promise.all(lessonsPromises);
    const allLessons = lessonsArrays.flat();

    // Ordenar lecciones con validación de nulos
    allLessons.sort((a, b) => {
      const aModuleIndex = a.module_order_index ?? 999999;
      const bModuleIndex = b.module_order_index ?? 999999;
      const aLessonIndex = a.lesson_order_index ?? 999999;
      const bLessonIndex = b.lesson_order_index ?? 999999;

      if (aModuleIndex !== bModuleIndex) {
        return aModuleIndex - bModuleIndex;
      }
      return aLessonIndex - bLessonIndex;
    });

    // Encontrar la lección actual
    const currentLessonIndex = allLessons.findIndex(
      (l: any) => l.lesson_id === lessonId
    );

    if (currentLessonIndex === -1) {
      return NextResponse.json(
        { error: 'Lección no encontrada' },
        { status: 404 }
      );
    }

    // ✅ VALIDAR: Si no es la primera lección, verificar que todas las anteriores estén completadas
    if (currentLessonIndex > 0) {
      const previousLessons = allLessons.slice(0, currentLessonIndex);
      const previousLessonIds = previousLessons.map(l => l.lesson_id);

      // Obtener progreso de todas las lecciones anteriores
      const { data: previousProgress, error: progressError } = await supabase
        .from('user_lesson_progress')
        .select('lesson_id, is_completed')
        .eq('enrollment_id', enrollmentId)
        .in('lesson_id', previousLessonIds);

      if (progressError) {
        console.error('Error verificando progreso:', progressError);
        // En caso de error, bloquear acceso por seguridad
        return NextResponse.json(
          { 
            error: 'Error verificando acceso a la lección',
            code: 'ACCESS_CHECK_FAILED'
          },
          { status: 500 }
        );
      }

      // Crear mapa de progreso
      const progressMap = new Map(
        (previousProgress || []).map((p: any) => [p.lesson_id, p.is_completed])
      );

      // Verificar que todas las lecciones anteriores estén completadas
      for (const lesson of previousLessons) {
        const isCompleted = progressMap.get(lesson.lesson_id) || false;
        if (!isCompleted) {
          return NextResponse.json(
            {
              error: `Debes completar la lección "${lesson.title}" antes de acceder a esta`,
              code: 'LESSON_LOCKED',
              previousLessonId: lesson.lesson_id,
              previousLessonTitle: lesson.title
            },
            { status: 403 }
          );
        }
      }
    }

    // Si pasa la validación, continuar con el tracking normal
    const now = new Date().toISOString();

    // Verificar si existe progreso de la lección
    const { data: existingProgress } = await supabase
      .from('user_lesson_progress')
      .select('progress_id, lesson_status')
      .eq('enrollment_id', enrollmentId)
      .eq('lesson_id', lessonId)
      .single();

    if (existingProgress) {
      // Actualizar last_accessed_at y lesson_status si es necesario
      const updateData: any = {
        last_accessed_at: now,
        updated_at: now,
      };

      // Si la lección no ha sido iniciada, marcarla como in_progress
      if (existingProgress.lesson_status === 'not_started') {
        updateData.lesson_status = 'in_progress';
        updateData.started_at = now;
      }

      const { error: updateError } = await supabase
        .from('user_lesson_progress')
        .update(updateData)
        .eq('progress_id', existingProgress.progress_id);

      if (updateError) {
        // No retornar error, es solo tracking
        return NextResponse.json({ success: true });
      }
    } else {
      // Crear nuevo progreso si no existe
      const { error: insertError } = await supabase
        .from('user_lesson_progress')
        .insert({
          user_id: currentUser.id,
          lesson_id: lessonId,
          enrollment_id: enrollmentId,
          lesson_status: 'in_progress',
          video_progress_percentage: 0,
          current_time_seconds: 0,
          is_completed: false,
          started_at: now,
          last_accessed_at: now,
        });

      if (insertError) {
        // No retornar error, es solo tracking
        return NextResponse.json({ success: true });
      }
    }

    // Actualizar last_accessed_at del enrollment
    await supabase
      .from('user_course_enrollments')
      .update({ last_accessed_at: now })
      .eq('enrollment_id', enrollmentId);

    return NextResponse.json({ success: true });
  } catch (error) {
    // No retornar error, es solo tracking
    return NextResponse.json({ success: true });
  }
}
```

---

## 🔴 Corrección 2: Validar Todas las Lecciones Anteriores

### Archivo: `apps/web/src/app/api/courses/[slug]/lessons/[lessonId]/progress/route.ts`

**Problema**: Solo valida la lección inmediatamente anterior, permitiendo saltar múltiples lecciones.

**Solución**: Reemplazar la validación actual (líneas 144-166) con:

```typescript
// ✅ MEJORADO: Verificar que TODAS las lecciones anteriores estén completadas
if (currentLessonIndex > 0) {
  const previousLessons = allLessons.slice(0, currentLessonIndex);
  const previousLessonIds = previousLessons.map(l => l.lesson_id);

  // Obtener progreso de todas las lecciones anteriores en una sola consulta
  const { data: previousProgress, error: progressError } = await supabase
    .from('user_lesson_progress')
    .select('lesson_id, is_completed, lesson_status')
    .eq('enrollment_id', enrollmentId)
    .in('lesson_id', previousLessonIds);

  if (progressError) {
    console.error('Error verificando progreso de lecciones anteriores:', progressError);
    return NextResponse.json(
      { 
        error: 'Error verificando progreso',
        code: 'PROGRESS_CHECK_FAILED'
      },
      { status: 500 }
    );
  }

  // Crear mapa de progreso para acceso rápido
  const progressMap = new Map(
    (previousProgress || []).map((p: any) => [p.lesson_id, p])
  );

  // Verificar que todas las lecciones anteriores estén completadas
  for (const lesson of previousLessons) {
    const progress = progressMap.get(lesson.lesson_id);
    const isCompleted = progress?.is_completed || false;

    if (!isCompleted) {
      // Obtener título de la lección para el mensaje de error
      const { data: lessonData } = await supabase
        .from('course_lessons')
        .select('title')
        .eq('lesson_id', lesson.lesson_id)
        .single();

      return NextResponse.json(
        { 
          error: `Debes completar la lección "${lessonData?.title || 'anterior'}" antes de completar esta`,
          code: 'PREVIOUS_LESSON_NOT_COMPLETED',
          missingLessonId: lesson.lesson_id,
          missingLessonTitle: lessonData?.title || null
        },
        { status: 400 }
      );
    }
  }
}
```

---

## 🔴 Corrección 3: Mejorar Ordenamiento con Validación

### Archivo: `apps/web/src/app/api/courses/[slug]/lessons/[lessonId]/progress/route.ts`

**Problema**: El ordenamiento no maneja valores nulos y puede fallar silenciosamente.

**Solución**: Reemplazar el ordenamiento (líneas 116-122) con:

```typescript
// ✅ MEJORADO: Ordenar lecciones con validación de nulos y manejo de errores
allLessons.sort((a, b) => {
  // Manejar valores nulos (asignar valor alto para que aparezcan al final)
  const aModuleIndex = a.module_order_index ?? 999999;
  const bModuleIndex = b.module_order_index ?? 999999;
  const aLessonIndex = a.lesson_order_index ?? 999999;
  const bLessonIndex = b.lesson_order_index ?? 999999;

  // Primero ordenar por módulo
  if (aModuleIndex !== bModuleIndex) {
    return aModuleIndex - bModuleIndex;
  }
  
  // Si mismo módulo, ordenar por lección
  if (aLessonIndex !== bLessonIndex) {
    return aLessonIndex - bLessonIndex;
  }
  
  // Si mismo índice (duplicado), ordenar por ID para mantener orden determinístico
  return a.lesson_id.localeCompare(b.lesson_id);
});

// ✅ VALIDACIÓN: Verificar que no haya duplicados problemáticos
const seenIndices = new Map<string, string[]>();
for (const lesson of allLessons) {
  const moduleIndex = lesson.module_order_index ?? 'null';
  const lessonIndex = lesson.lesson_order_index ?? 'null';
  const key = `${moduleIndex}-${lessonIndex}`;
  
  if (!seenIndices.has(key)) {
    seenIndices.set(key, []);
  }
  
  seenIndices.get(key)!.push(lesson.lesson_id);
}

// Loggear advertencias si hay duplicados (pero no fallar)
for (const [key, lessonIds] of seenIndices.entries()) {
  if (lessonIds.length > 1) {
    logger.warn(`Lecciones con mismo índice detectadas: ${key}`, {
      lessonIds,
      courseId
    });
  }
}
```

---

## 🔴 Corrección 4: Mejorar Manejo de Race Conditions

### Archivo: `apps/web/src/app/courses/[slug]/learn/page.tsx`

**Problema**: El optimistic update puede crear estados inconsistentes si el usuario cambia rápidamente de lección.

**Solución**: Mejorar `handleLessonChange` (líneas 861-985):

```typescript
// ✅ MEJORADO: Manejo de race conditions con AbortController mejorado
const handleLessonChange = useCallback(
  async (lesson: Lesson) => {
    // Si es la misma lección, no hacer nada
    if (currentLesson?.lesson_id === lesson.lesson_id) {
      return;
    }

    // Si no hay lección actual, cambiar directamente
    if (!currentLesson) {
      setCurrentLesson(lesson);
      setActiveTab("video");
      window.scrollTo({ top: 0, behavior: "smooth" });
      trackUserAction("lesson_opened", {
        lessonId: lesson.lesson_id,
        lessonTitle: lesson.lesson_title,
      });
      return;
    }

    // Verificar si hay actividades requeridas sin completar en la lección actual
    const currentActivities =
      lessonsActivities[currentLesson.lesson_id] || [];
    const requiredActivities = currentActivities.filter((a) => a.is_required);
    const pendingRequired = requiredActivities.filter((a) => !a.is_completed);

    if (pendingRequired.length > 0) {
      const pendingTitles = pendingRequired
        .map((a) => a.activity_title)
        .join(", ");
      trackUserAction("attempted_lesson_change_without_completion", {
        currentLessonId: currentLesson.lesson_id,
        currentLessonTitle: currentLesson.lesson_title,
        targetLessonId: lesson.lesson_id,
        targetLessonTitle: lesson.lesson_title,
        pendingActivities: pendingTitles,
        pendingCount: pendingRequired.length,
      });
    } else {
      trackUserAction("lesson_change", {
        from: currentLesson.lesson_title,
        to: lesson.lesson_title,
      });
    }

    // Verificar si está avanzando o retrocediendo
    const allLessons = getAllLessonsOrdered();
    const currentIndex = allLessons.findIndex(
      (item) => item.lesson.lesson_id === currentLesson.lesson_id
    );
    const selectedIndex = allLessons.findIndex(
      (item) => item.lesson.lesson_id === lesson.lesson_id
    );

    // ✅ MEJORADO: Cancelar cualquier validación pendiente antes de continuar
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Crear nuevo AbortController para esta navegación
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Si está avanzando, validar antes de cambiar
    if (selectedIndex > currentIndex) {
      // Guardar lección previa para poder revertir si falla
      const previousLesson = currentLesson;

      // ✅ MEJORADO: Validar ANTES de cambiar (no optimistic update)
      try {
        const canComplete = await markLessonAsCompleted(
          previousLesson.lesson_id,
          abortController.signal
        );

        // Si la validación fue cancelada (usuario cambió de lección), no hacer nada
        if (abortController.signal.aborted) {
          return;
        }

        // Si falla la validación, NO cambiar de lección
        if (!canComplete) {
          console.warn(
            "❌ Validación falló, no se cambia de lección"
          );
          
          trackUserAction("attempted_locked_lesson", {
            targetLessonId: lesson.lesson_id,
            targetLessonTitle: lesson.lesson_title,
            reason: "previous_lesson_not_completed",
          });
          
          // Mostrar mensaje al usuario
          setValidationModal({
            isOpen: true,
            title: "Lección Bloqueada",
            message: "Debes completar la lección anterior antes de continuar.",
            type: "locked",
            lessonId: previousLesson.lesson_id,
          });
          
          return;
        }

        // Si pasa la validación, cambiar de lección
        setCurrentLesson(lesson);
        setActiveTab("video");
        window.scrollTo({ top: 0, behavior: "smooth" });
        trackUserAction("lesson_opened", {
          lessonId: lesson.lesson_id,
          lessonTitle: lesson.lesson_title,
        });
      } catch (error: any) {
        // Si es error de cancelación, ignorar
        if (error?.name !== "AbortError" && !abortController.signal.aborted) {
          console.error("Error en validación de lección:", error);
        }
      } finally {
        // Limpiar referencia si es el controller actual
        if (abortControllerRef.current === abortController) {
          abortControllerRef.current = null;
        }
      }

      return;
    }

    // Si se está retrocediendo, cambiar directamente (sin validación)
    setCurrentLesson(lesson);
    setActiveTab("video");
    window.scrollTo({ top: 0, behavior: "smooth" });
    trackUserAction("lesson_opened", {
      lessonId: lesson.lesson_id,
      lessonTitle: lesson.lesson_title,
    });
  },
  [currentLesson, lessonsActivities, trackUserAction]
);

// ✅ NUEVO: Ref para mantener el AbortController actual
const abortControllerRef = useRef<AbortController | null>(null);

// ✅ NUEVO: Limpiar AbortController cuando cambia la lección
useEffect(() => {
  return () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };
}, [currentLesson?.lesson_id]);
```

---

## 🔴 Corrección 5: Mejorar Manejo de Errores en markLessonAsCompleted

### Archivo: `apps/web/src/app/courses/[slug]/learn/page.tsx`

**Problema**: El manejo de errores es demasiado permisivo y permite continuar con errores.

**Solución**: Mejorar el manejo de errores (líneas 2448-2582):

```typescript
// ✅ MEJORADO: Manejo de errores más estricto y específico
if (!response.ok) {
  let responseData: any;
  try {
    responseData = await response.json();
  } catch (jsonError) {
    // Si no es JSON válido y es error del servidor, revertir
    if (response.status >= 500) {
      revertLocalState(lessonId);
      if (process.env.NODE_ENV === "development") {
        console.error("Error del servidor al guardar progreso:", response.status);
      }
      return false;
    }
    // Para otros errores (red, etc.), permitir continuar
    return true;
  }

  // ✅ Manejar errores específicos
  switch (responseData?.code) {
    case 'PREVIOUS_LESSON_NOT_COMPLETED':
      // Revertir estado local
      revertLocalState(lessonId);
      
      // Mostrar modal con información de la lección faltante
      setValidationModal({
        isOpen: true,
        title: "Lección Bloqueada",
        message: responseData.error || "Debes completar la lección anterior antes de continuar.",
        type: "locked",
        lessonId: responseData.missingLessonId || null,
        previousLessonTitle: responseData.missingLessonTitle || null,
      });
      
      return false;

    case 'REQUIRED_QUIZ_NOT_PASSED':
      // Revertir estado local
      revertLocalState(lessonId);
      
      // Mostrar modal de validación
      setValidationModal({
        isOpen: true,
        title: "Hace falta realizar actividad",
        message:
          responseData?.details?.message ||
          responseData?.error ||
          "Debes completar y aprobar todos los quizzes obligatorios para continuar.",
        details: responseData?.details
          ? `Completados: ${responseData.details.passed} de ${responseData.details.totalRequired}`
          : undefined,
        type: "activity",
        lessonId: lessonId,
      });
      
      return false;

    case 'LESSON_LOCKED':
    case 'ACCESS_CHECK_FAILED':
      // Revertir estado local
      revertLocalState(lessonId);
      
      // Mostrar modal
      setValidationModal({
        isOpen: true,
        title: "Acceso Denegado",
        message: responseData.error || "No tienes acceso a esta lección.",
        type: "locked",
        lessonId: responseData.previousLessonId || null,
      });
      
      return false;

    default:
      // Para errores desconocidos, revertir por seguridad
      if (response.status >= 400 && response.status < 500) {
        // Error del cliente: revertir
        revertLocalState(lessonId);
        if (process.env.NODE_ENV === "development") {
          console.warn("Error del cliente:", responseData?.error || response.status);
        }
        return false;
      } else if (response.status >= 500) {
        // Error del servidor: revertir
        revertLocalState(lessonId);
        if (process.env.NODE_ENV === "development") {
          console.error("Error del servidor:", response.status);
        }
        return false;
      }
      
      // Para otros casos (red, timeout), permitir continuar
      return true;
  }
}

// ✅ NUEVA FUNCIÓN: Revertir estado local de manera consistente
const revertLocalState = (lessonId: string) => {
  setModules((prevModules) => {
    return prevModules.map((module) => ({
      ...module,
      lessons: module.lessons.map((lesson) =>
        lesson.lesson_id === lessonId
          ? { ...lesson, is_completed: false }
          : lesson
      ),
    }));
  });

  if (currentLesson?.lesson_id === lessonId) {
    setCurrentLesson((prev) =>
      prev ? { ...prev, is_completed: false } : null
    );
  }
};
```

---

## 📝 Notas de Implementación

### Orden de Implementación Recomendado

1. **Primero**: Corrección 2 (Validar todas las lecciones anteriores) - Más crítico
2. **Segundo**: Corrección 1 (Validación en endpoint de acceso) - Previene acceso directo
3. **Tercero**: Corrección 3 (Mejorar ordenamiento) - Base para otras validaciones
4. **Cuarto**: Corrección 4 (Race conditions) - Mejora UX
5. **Quinto**: Corrección 5 (Manejo de errores) - Robustez

### Testing

Después de implementar cada corrección, probar:

1. ✅ Acceso directo a lección bloqueada (URL)
2. ✅ Saltar múltiples lecciones
3. ✅ Cambiar rápidamente entre lecciones
4. ✅ Módulos con lecciones sin orden
5. ✅ Errores de red durante validación

### Rollback

Si alguna corrección causa problemas:

1. Revertir el commit específico
2. Verificar logs para identificar el problema
3. Ajustar la implementación
4. Re-aplicar la corrección

---

**Última actualización**: Diciembre 2024  
**Versión**: 1.0

