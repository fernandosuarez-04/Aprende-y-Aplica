# Plan de Implementación: Sistema de Tour y Planificador de Estudios

Este documento detalla el plan para implementar el sistema de tours guiados con NextStepjs y el flujo de creación del Plan de Estudios.

## 1. Implementación del Tour en Dashboard (Business Panel) ✅

Objetivo: Guiar al usuario nuevo por las funcionalidades principales del panel de control.

### Tareas Completadas:

- [x] **Base de Datos**: Crear tabla `user_tour_progress` para rastrear el estado del tour por usuario.
- [x] **API Backend**: Endpoint `/api/tours` para verificar estado y registrar progreso/completitud.
- [x] **Frontend Hooks**:
  - `useTourProgress`: Manejo de estado con la API.
  - `useDashboardTour`: Lógica de auto-inicio del tour.
- [x] **Identificadores UI**: Agregar IDs a los elementos clave del Dashboard (Tarjetas de estadísticas, Menú de usuario, LIA).
- [x] **Configuración del Tour**: Definir los pasos en `dashboard-tour-steps.ts` (Bienvenida, Estadísticas, Cursos, Certificados, Menú, LIA).
- [x] **Integración en Layout**: Configurar `NextStepProvider` en `BusinessUserLayout` con redirección automática.
- [x] **Activación**: Integrar el hook en `BusinessPanelDashboard`.

### Flujo del User Journey:

1. Usuario entra a `/business-user/dashboard`.
2. Sistema verifica en DB si es primera vez (`user_tour_progress`).
3. Si es primera vez, inicia el tour automáticamente.
4. Pasos del Tour:
   - Bienvenida (Hero section).
   - Estadísticas Generales.
   - Accesos a Cursos y Certificados.
   - Menú de Usuario (Perfil, Idioma, Plan de Estudio).
   - **LIA** (Énfasis en su ayuda proactiva).
5. **Fin del Tour**: Al dar clic en "Terminar" o completar el último paso.
6. **Redirección**: El usuario es enviado automáticamente a `/study-planner/create`.

---

## 2. Flujo del Planificador de Estudios (Siguiente Paso) ⏳

Objetivo: Guiar al usuario en la creación de su primer plan de estudios tras completar el tour del dashboard.

### Pasos a Implementar:

1. **Página de Creación (`/study-planner/create`)**:
   - Asegurar que la página esté lista para recibir al usuario redirigido.
   - Implementar un "mini-tour" o modal de bienvenida específico para esta sección si es necesario.
   - Validar que LIA esté lista para asistir en la creación del plan.

2. **Interacción con LIA**:
   - Verificar que el chat de LIA esté accesible y consciente del contexto (creación de plan).

3. **Persistencia**:
   - Asegurar que el plan creado se guarde correctamente asociados al usuario.

---

## 3. Tours en Otras Páginas (Futuro) 🔮

- **Cursos**: Tour para explicar la interfaz de aprendizaje.
- **Perfil**: Tour rápido para configuración de cuenta.

## Estado Actual

El tour del Dashboard está completamente configurado a nivel de código. El siguiente paso operativo es verificar el funcionamiento en un entorno real y proceder con la implementación/verificación de la página de destino (`/study-planner/create`).
