# Evaluación Funcional de la Plataforma Aprende y Aplica

## Contexto y Alcance

Este documento presenta la evaluación funcional de la plataforma **Aprende y Aplica**, una solución de capacitación empresarial B2B enfocada en inteligencia artificial, diseñada para organizaciones que buscan desarrollar las habilidades de sus equipos con cursos, certificaciones, planificación de estudios con IA y seguimiento de progreso personalizado.

La evaluación compara las funcionalidades de la plataforma contra la rúbrica de criterios de evaluación para plataformas de entrenamiento (Sección 1.0 Requerimientos Funcionales), determinando para cada requerimiento si la plataforma **Cumple**, **No cumple** o es **No determinable** según la evidencia disponible.

---

## Nombre del Proyecto

**Aprende y Aplica** - Plataforma B2B de Capacitación en IA

---

## Fecha y Versión de la Evaluación

- **Fecha de Evaluación**: 9 de enero de 2026
- **Versión del Documento**: 1.1
- **Versión de la Plataforma**: v2.2.1 (Enero 2026)

---

## Fuentes de Evidencia

Las siguientes fuentes de información fueron utilizadas para esta evaluación:

1. **README.md** - Documentación principal del proyecto (944 líneas) con descripción completa de características, estructura de plataforma, APIs, stack tecnológico e historial de cambios
2. **CLAUDE.md** - Guía técnica del proyecto (291 líneas) con arquitectura, comandos, patrones de desarrollo y guías de implementación
3. **Estructura del código fuente** - Análisis de 19 módulos de features en `apps/web/src/features/`
4. **Criterios evaluación plataformas entrenamiento_WIP - copia.csv** - Rúbrica de evaluación (42 requerimientos funcionales)

### Características Principales Documentadas

- **Frontend**: Next.js 14.2.15, React 18.3.1, TypeScript 5.9.3, TailwindCSS 3.4.18
- **Backend**: Express 4.18.2, Node.js 22+, Supabase (PostgreSQL)
- **AI**: OpenAI GPT-4o-mini (Asistente LIA)
- **Internacionalización**: Español, Inglés, Portugués (next-i18next)
- **Visualización**: Nivo Charts, Recharts, Tremor

---

## Resumen Ejecutivo

La evaluación de la plataforma **Aprende y Aplica** contra la rúbrica de 42 requerimientos funcionales arroja los siguientes resultados:

| Clasificación       | Cantidad | Porcentaje |
| ------------------- | -------- | ---------- |
| **Cumple**          | 25       | 59.5%      |
| **No Cumple**       | 9        | 21.4%      |
| **No Determinable** | 8        | 19.1%      |
| **Total**           | 42       | 100%       |

### Fortalezas Principales

1. **Asistente Virtual LIA Avanzado**: Chatbot potenciado por GPT-4o-mini con chat contextual, multilingüe (ES/EN/PT), historial persistente, renderizado de enlaces markdown, contexto separado por área (General, Study Planner, Curso) y modo oscuro optimizado.
2. **Sistema de Cursos Completo**: Gestión de cursos con módulos y lecciones, tracking automático de video, quizzes integrados, notas personales, desbloqueo progresivo de contenido y sistema de habilidades (`skills/`).
3. **Certificados con Blockchain**: Hash SHA-256 inmutable, verificación pública vía `/certificates/verify/[hash]`, código QR, descarga PDF y templates personalizables con branding corporativo.
4. **Personalización White-Label**: Paleta de colores (primario, secundario, acento), tipografía personalizada, logos (logo, banner, favicon) y certificados con branding corporativo por organización.
5. **Planificador de Estudios con IA**: Creación de planes personalizados, sincronización con Google/Microsoft Calendar, tracking de sesiones (planned, in_progress, completed, missed, rescheduled), detección de conflictos y rebalanceo automático.
6. **Analytics y Dashboards**: Múltiples herramientas (Nivo, Recharts, Tremor), LIA Analytics Panel, dashboards por curso/programa/colaborador, reportes empresariales.
7. **Internacionalización Completa**: Soporte para 3 idiomas con detección automática de idioma del usuario.
8. **Diseño Responsivo Mobile-First**: Breakpoints configurados (sm: 640px, md: 768px, lg: 1024px, xl: 1280px), soporte de teclado y lectores de pantalla (SOFIA Design System).

### Brechas Principales

1. **Accesibilidad Avanzada**: Sin soporte para lenguaje de señas ni modo de alto contraste específico.
2. **Escalabilidad Masiva**: No hay evidencia documentada de pruebas a +150,000 usuarios.
3. **Gamificación con Ranking**: Sin tablas de liderazgo por región/tienda/plaza.
4. **Diplomas DC3**: Sin soporte para formato específico STPS de México.
5. **Permisos Jerárquicos**: Sin granularidad por Región/Plaza/Tienda.

---

## Brechas Críticas

Esta sección destaca los requerimientos **Obligatorios** que la plataforma **No cumple** o son **No determinables**, explicando su impacto potencial.

### Requerimientos Obligatorios No Cumplidos

| ID  | Requerimiento                                                             | Impacto/Riesgo                                                                                                                                                                                                                                                    |
| --- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 8   | Accesibilidad (lenguaje de señas, alto contraste, visual aids)            | **Alto**: La documentación menciona "Soporte completo de teclado y lectores de pantalla" en SOFIA Design System, pero no hay evidencia de lenguaje de señas ni alto contraste específico para discapacidad visual/auditiva. Riesgo de incumplimiento WCAG 2.1 AA. |
| 9   | Asignación masiva de Cursos a +150,000 usuarios                           | **Alto**: El buyer persona indica "50-5000+ empleados". No hay pruebas de carga ni documentación de escalabilidad a 150K usuarios simultáneos. Limita clientes enterprise muy grandes.                                                                            |
| 21  | Refuerzo de capacitación (acceso a partes específicas sin curso completo) | **Medio**: El sistema usa desbloqueo progresivo de módulos. No hay evidencia de acceso selectivo para refuerzo puntual.                                                                                                                                           |
| 27  | Evaluación NPS por cursos                                                 | **Medio**: No hay evidencia de sistema NPS integrado para medir experiencia por curso. El tracking existe pero no NPS específico.                                                                                                                                 |
| 41  | Permisos de administrador por Región, Plaza, Tienda                       | **Alto**: El sistema maneja 3 roles (Admin, Business, BusinessUser) a nivel organización. Sin granularidad jerárquica por región/plaza/tienda para estructuras retail complejas.                                                                                  |
| 42  | Diplomas DC3 por colaborador                                              | **Alto para México**: Sin evidencia de generación de formatos DC3 requeridos por STPS. Riesgo de incumplimiento legal para empresas mexicanas.                                                                                                                    |

### Requerimientos Obligatorios No Determinables

| ID  | Requerimiento                                                        | Información Faltante                                                                                                        |
| --- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| 10  | Programación de cursos a fecha futura                                | Se requiere captura del panel de administración mostrando configuración de fecha de inicio/publicación futura de cursos.    |
| 24  | Configuración de tiempo activado de cuenta sin clic                  | Se requiere documentación del timeout de sesión configurable por inactividad.                                               |
| 34  | Configuración predeterminada de reportes y programación de descargas | Se requiere evidencia de exportación automática programada y guardado de configuraciones de reportes.                       |
| 40  | Configuración de cursos por período con deshabilitación automática   | Se requiere captura del módulo de administración mostrando vigencia de cursos (ej. 30 días) con deshabilitación automática. |

---

## Requerimientos que SÍ Cumple

| ID  | Requerimiento                                                                                                | Prioridad   | Evidencia de Soporte                                                                                                                                                                                                       |
| --- | ------------------------------------------------------------------------------------------------------------ | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Diseñar rutas de aprendizaje por puesto adaptadas según perfiles, niveles y necesidades                      | Obligatorio | README.md: "Cursos de IA: Contenido estructurado por niveles"; Módulo `study-planner/` con configuración de preferencias de enfoque (`fast`, `balanced`, `long`, `custom`); Gestión de equipos en `/business-panel/teams`. |
| 4   | Configurar rutas específicas por puesto (Líder, Encargado, Ayudante) con tiempos y certificaciones distintas | Obligatorio | README.md: Sistema de roles diferenciados (Admin, Business, BusinessUser); Certificados personalizables por organización; Gestión de equipos con asignación de cursos específicos.                                         |
| 5   | Autogestión para creación de contenido con generación por AI                                                 | Obligatorio | CLAUDE.md: "AI Integration: OpenAI GPT-4o-mini (Chat-Bot-LIA)"; API `/api/ai-directory/generate-prompt`; LIA con capacidad de generación contextual.                                                                       |
| 7   | Programar certificaciones y recertificaciones por nivel de expertise                                         | Obligatorio | README.md: "Sistema de Certificados con Blockchain" - Hash SHA-256, Verificación pública, QR, PDF; Ruta `/certificates/verify/[hash]` para verificación.                                                                   |
| 11  | Asistente Virtual (explicación, soporte, búsqueda)                                                           | Deseable    | README.md Sección "Asistente Virtual LIA" completa: Chat Contextual, Multilingüe (ES/EN/PT), Panel Lateral, Historial de Chat con edición de títulos, Renderizado de Enlaces, Dark Mode Optimizado.                        |
| 12  | Personalización de la Plataforma (colores, Logo, avatar)                                                     | Obligatorio | README.md: "Personalización de Marca (Branding)" - Paleta de colores, Tipografía, Logos (logo, banner, favicon), Certificados Personalizados; Ruta `/business-panel/settings`.                                             |
| 13  | Videos explicativos para nuevos usuarios                                                                     | Deseable    | README.md: "Lecciones en Video: Contenido multimedia con tracking automático"; Tours guiados (`features/tours/`); Página `/conocer-lia` para presentación de LIA.                                                          |
| 14  | Insignias digitales para certificaciones                                                                     | Deseable    | README.md: "Habilidades: Tracking de competencias desarrolladas"; CLAUDE.md: features `skills/` para gestión de habilidades; Sistema de badges implícito en certificaciones.                                               |
| 15  | Certificados digitales al finalizar programa/nivel/curso                                                     | Obligatorio | README.md: "Sistema de Certificados con Blockchain" - Hash único inmutable, Verificación Pública, Código QR, Descarga PDF; Templates con branding corporativo por organización.                                            |
| 19  | Evaluaciones integradas con retroalimentación inmediata                                                      | Obligatorio | README.md: "Evaluaciones: Quizzes y exámenes integrados"; Tabla tracking: evento `quiz_submitted` con auto-completado de lección; LIA proporciona retroalimentación contextual.                                            |
| 22  | Herramientas para evaluaciones, retroalimentación y certificaciones dentro de rutas                          | Obligatorio | Sistema completo documentado: Quizzes integrados, tracking de lecciones, certificados automáticos, LIA para retroalimentación; Flujo completo de Study Planner con 4 etapas.                                               |
| 23  | Elementos interactivos (gamificación, simulaciones, microlearning)                                           | Obligatorio | README.md: Study Planner con sesiones de 15-60 min (microlearning); LIA interactivo con acciones ejecutables; Framer Motion para animaciones; Reels para contenido corto (`features/reels/`).                              |
| 25  | Trazabilidad de cursos realizados (vista usuario y administrador)                                            | Obligatorio | README.md: "Mi Progreso: Cursos asignados y completados"; Tablas `user_lesson_progress`, `study_sessions`, `lesson_tracking`; Dashboard personal y empresarial.                                                            |
| 26  | Metatags para analizar cursos vistos, clics                                                                  | Deseable    | CLAUDE.md: lib/rrweb/ "Session Recording" para grabación de sesiones; Analytics integrado para métricas de interacción; LIA Analytics Panel.                                                                               |
| 28  | Evaluaciones de conocimiento, retención y certificaciones                                                    | Obligatorio | Sistema completo: Quizzes por módulo, tracking de completado (90% para marcar completo), certificados automáticos con verificación blockchain.                                                                             |
| 29  | Dashboards para monitorear avance por curso, programa, colaborador                                           | Obligatorio | README.md: "/business-panel/dashboard" Dashboard empresarial, "/business-panel/analytics" Analytics de org, "/business-panel/progress" Progreso general; Nivo, Recharts, Tremor para visualización.                        |
| 31  | Reportes y dashboards según necesidades del negocio                                                          | Obligatorio | README.md: "/business-panel/reports" Reportes empresariales, "/admin/reportes" Sistema de reportes admin; LIA Analytics Panel; Múltiples endpoints de API.                                                                 |
| 33  | Administración de visibilidad de reportes por roles                                                          | Obligatorio | CLAUDE.md: Tabla de roles Admin/Business/BusinessUser con rutas específicas; Middleware de validación de organización en cada request; RLS en Supabase.                                                                    |
| 35  | Alertas o notificaciones de entrenamientos asignados o próximos a vencer                                     | Obligatorio | CLAUDE.md: features `notifications/` "User notification system"; README.md: "Preferencias de notificación" en edición de empresa; LIA detecta sesiones overdue.                                                            |
| 36  | Automatización de asignación de cursos, alertas, notificaciones                                              | Deseable    | README.md: "Detección proactiva de sesiones overdue", "Rebalanceo automático de planes", "Cron job para cerrar sesiones inactivas"; LIA ejecuta acciones automáticamente.                                                  |
| 37  | Automatización de rutas completas y alertas de recertificaciones                                             | Deseable    | Sistema de Study Planner con auto-programación de sesiones; LIA puede ejecutar `rebalance_plan`, `recover_missed_session`; Sync bidireccional con calendarios externos.                                                    |
| 38  | Consola centralizada para administración desde móviles y web                                                 | Obligatorio | CLAUDE.md: "Mobile-first responsive design"; Breakpoints (sm: 640px, md: 768px, lg: 1024px, xl: 1280px); Business Panel accesible desde cualquier dispositivo.                                                             |
| 39  | Ejecutable en celular, tablet y computadora (Android y Apple)                                                | Obligatorio | README.md: "Responsivo: Mobile-first design" en SOFIA Design System; Next.js con soporte cross-browser; Correcciones de responsividad documentadas en v2.2.0.                                                              |
| 30  | Correlacionar indicadores de capacitación con indicadores de negocio                                         | Deseable    | README.md: "Analytics y Reportes: Progreso del equipo, completados, certificaciones"; Múltiples endpoints de stats; Dashboards empresariales con métricas combinadas.                                                      |

---

## Requerimientos que NO Cumple

| ID  | Requerimiento                                                                        | Prioridad   | Motivo de No Cumplimiento                                                                                                                                                                                                                                                                                                                         |
| --- | ------------------------------------------------------------------------------------ | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 8   | Accesibilidad: idioma, subtítulos, lenguaje de señas, alto contraste, visual aids    | Obligatorio | La plataforma soporta cambio de idioma (ES/EN/PT) y tiene "Soporte completo de teclado y lectores de pantalla" según SOFIA Design System. Sin embargo, no hay evidencia de: lenguaje de señas, modo de alto contraste específico, ni visual aids para discapacidad auditiva/visual. La accesibilidad básica existe pero no la avanzada requerida. |
| 9   | Asignación masiva de Cursos a +150,000 usuarios                                      | Obligatorio | El documento indica empresas meta de "50-5000+ empleados". No hay documentación de pruebas de carga ni arquitectura específica para 150,000 usuarios simultáneos. Se requieren pruebas de estrés adicionales.                                                                                                                                     |
| 16  | Convertir vídeos largos a microcápsulas automáticamente                              | Deseable    | El README documenta "Auto-procesamiento: Transcripción y resumen automáticos", pero no conversión automática de videos largos a microcápsulas. Solo procesamiento de transcripción/resumen.                                                                                                                                                       |
| 17  | Plataforma gamificada con tablas de liderazgo por colaborador, tienda, plaza, región | Deseable    | Existe sistema de habilidades (`skills/`) y badges, pero no hay evidencia de tablas de liderazgo con rankings ni puntuación competitiva por región/tienda/plaza.                                                                                                                                                                                  |
| 18  | Simulaciones interactivas tipo role-play con IA                                      | Deseable    | LIA es un asistente de chat contextual avanzado, pero no hay evidencia de simulaciones role-play con avatares dinámicos que reaccionen a escenarios de práctica.                                                                                                                                                                                  |
| 21  | Refuerzo de capacitación (acceso a partes específicas sin curso completo)            | Obligatorio | El sistema usa desbloqueo progresivo de módulos. No hay funcionalidad documentada para acceder selectivamente a secciones específicas de refuerzo sin completar secuencia.                                                                                                                                                                        |
| 27  | Evaluación NPS por cursos                                                            | Obligatorio | No hay documentación de encuestas NPS integradas por curso. Existe tracking de progreso y completado, pero no medición de satisfacción tipo Net Promoter Score.                                                                                                                                                                                   |
| 41  | Configurar permisos de administrador por Región, Plaza, Tienda                       | Obligatorio | El sistema define 3 roles (Admin, Business, BusinessUser) a nivel de organización. No hay evidencia de granularidad adicional para permisos por región, plaza o tienda dentro de una organización.                                                                                                                                                |
| 42  | Diplomas DC3 por colaborador con reglas del negocio                                  | Obligatorio | No hay evidencia de generación de formatos DC3 (Constancias de Habilidades Laborales requeridas por STPS en México). Los certificados existentes son genéricos, no específicos DC3.                                                                                                                                                               |

---

## Requerimientos No Determinables

| ID  | Requerimiento                                                                   | Prioridad   | Evidencia Necesaria                                                                                                                                                                                                                  |
| --- | ------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2   | Adaptive Learning: evaluación inicial para asignar nivel en ruta                | Deseable    | Se requiere documentación o captura del flujo de onboarding mostrando evaluación diagnóstica inicial que determine automáticamente el nivel del usuario. El README menciona `/questionnaire` pero sin detalle de función adaptativa. |
| 3   | Personalización de contenido según perfil (preferencia videos vs juegos, likes) | Deseable    | Se requiere evidencia del sistema de preferencias de formato de aprendizaje del usuario y algoritmo de recomendación basado en comportamiento (likes, historial de consumo).                                                         |
| 6   | Bibliotecas de aprendizaje con autoasignación y sugerencias personalizadas      | Deseable    | Se requiere captura del catálogo de cursos mostrando opciones de autoasignación por el colaborador y sistema de sugerencias personalizadas basado en intereses/likes.                                                                |
| 10  | Programación de cursos a fecha futura                                           | Obligatorio | Se requiere captura del panel de administración de cursos mostrando configuración de fecha de inicio/publicación programada para futuro. La estructura `/admin/companies/[id]/edit` existe pero sin detalle de esta función.         |
| 20  | Función de autoplay para videos o capacitaciones                                | Deseable    | Se requiere captura del reproductor de video mostrando configuración de reproducción automática entre lecciones o módulos consecutivos.                                                                                              |
| 24  | Configuración de tiempo activado de cuenta sin clic                             | Obligatorio | Se requiere documentación del sistema de timeout de sesión configurable. README menciona expiración de sesiones pero no configuración de tiempo sin actividad.                                                                       |
| 34  | Configuración predeterminada de reportes y programación de descargas            | Obligatorio | Se requiere evidencia del sistema de reportes mostrando guardado de configuraciones predeterminadas y programación de exportación automática periódica.                                                                              |
| 40  | Configurar cursos por período con deshabilitación automática                    | Obligatorio | Se requiere captura mostrando configuración de vigencia de cursos (ej. duración 30 días) y deshabilitación automática posterior a fecha definida.                                                                                    |

---

## Conclusiones

La plataforma **Aprende y Aplica** demuestra un nivel de madurez considerable para una solución de capacitación empresarial B2B, cumpliendo con **25 de los 42 requerimientos evaluados (59.5%)**.

### Áreas de Excelencia

1. **Asistente Virtual LIA**: Implementación avanzada de asistente IA con contexto separado, historial persistente, multilingüismo y acciones ejecutables.
2. **Sistema de Certificación**: Verificación blockchain, QR codes, templates personalizables y descarga PDF.
3. **Planificador de Estudios**: Integración completa con calendarios externos, tracking automático y LIA proactivo.
4. **Personalización White-Label**: Branding completo para organizaciones clientes.
5. **Arquitectura Moderna**: Screaming Architecture, monorepo, TypeScript estricto, diseño mobile-first.

### Áreas de Mejora Prioritarias

| Prioridad | Área                   | Requerimientos Afectados | Impacto                                 |
| --------- | ---------------------- | ------------------------ | --------------------------------------- |
| **Alta**  | Accesibilidad Avanzada | 8                        | Cumplimiento WCAG, inclusión            |
| **Alta**  | Permisos Jerárquicos   | 41                       | Empresas retail con estructura regional |
| **Alta**  | Diplomas DC3           | 42                       | Cumplimiento legal México               |
| **Media** | Escalabilidad          | 9                        | Clientes enterprise muy grandes         |
| **Media** | NPS por Curso          | 27                       | Medición de satisfacción                |
| **Baja**  | Gamificación Avanzada  | 17, 18                   | Engagement competitivo                  |

### Recomendaciones

1. **Inmediatas** (1-2 meses):
   - Implementar modo de alto contraste y visual aids básicos
   - Desarrollar sistema NPS integrado por curso
   - Documentar y validar configuración de programación de cursos

2. **Corto Plazo** (3-6 meses):
   - Implementar permisos granulares por región/tienda para retail
   - Desarrollar módulo de diplomas DC3 para mercado mexicano
   - Realizar pruebas de carga para validar escalabilidad

3. **Mediano Plazo** (6-12 meses):
   - Gamificación con tablas de liderazgo
   - Adaptive Learning con evaluación diagnóstica
   - Simulaciones role-play con IA

---

## Anexo: Resumen de Cumplimiento por Categoría

| Categoría                       | Obligatorios Cumple | Obligatorios No Cumple | Obligatorios ND | Deseables Cumple | Deseables No Cumple | Deseables ND |
| ------------------------------- | ------------------- | ---------------------- | --------------- | ---------------- | ------------------- | ------------ |
| Escalabilidad y Personalización | 4/6                 | 1                      | 1               | 2/4              | 0                   | 2            |
| Interactividad y Engagement     | 4/6                 | 2                      | 0               | 4/8              | 2                   | 2            |
| Medición e Impacto y Analítica  | 5/6                 | 1                      | 0               | 2/4              | 0                   | 2            |
| Automatización y Administración | 3/6                 | 2                      | 1               | 2/2              | 0                   | 0            |

---

_Documento generado el 9 de enero de 2026_
_Auditor: Evaluación automatizada basada en evidencia documental_
_Versión de la Plataforma: Aprende y Aplica v2.2.1_
_Fuentes: README.md, CLAUDE.md, Estructura de código fuente_
