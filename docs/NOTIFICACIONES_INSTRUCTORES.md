# 🎓 Notificaciones para Instructores
## Plataforma: Aprende y Aplica

**Versión:** 1.0  
**Fecha:** Diciembre 2024  
**Autor:** Equipo de Desarrollo  
**Estado:** En Análisis

---

## 📋 Tabla de Contenidos

1. [Introducción](#1-introducción)
2. [Metodología de Análisis](#2-metodología-de-análisis)
3. [Categorías de Notificaciones](#3-categorías-de-notificaciones)
4. [Notificaciones por Módulo](#4-notificaciones-por-módulo)
5. [Priorización](#5-priorización)
6. [Canales de Notificación](#6-canales-de-notificación)
7. [Configuración de Instructor](#7-configuración-de-instructor)

---

## 1. Introducción

### 1.1 Objetivo

Este documento identifica y categoriza todas las notificaciones que deben aparecer para **instructores** dentro de la plataforma "Aprende y Aplica", considerando todas las funciones y responsabilidades del rol de instructor.

### 1.2 Alcance

- ✅ Instructores del sistema
- ✅ Todas las funciones del panel de instructor
- ✅ Eventos relacionados con talleres/cursos creados
- ✅ Interacciones en comunidades propias
- ✅ Moderación de contenido

### 1.3 Responsabilidades de Instructor

Basado en el análisis del sistema, los instructores tienen las siguientes responsabilidades:

1. **Gestión de Talleres/Cursos**
   - Crear, editar, eliminar talleres
   - Gestionar módulos y lecciones
   - Ver estadísticas de estudiantes
   - Ver progreso de estudiantes

2. **Gestión de Comunidades**
   - Solicitar creación de comunidades (requiere aprobación admin)
   - Moderar contenido en comunidades propias
   - Aprobar/rechazar solicitudes de acceso
   - Gestionar miembros

3. **Gestión de Contenido**
   - Crear y publicar noticias
   - Crear y publicar reels
   - Moderar comentarios en contenido propio

4. **Interacciones con Estudiantes**
   - Responder preguntas en comunidades
   - Ver comentarios en talleres/cursos
   - Revisar evaluación de talleres/cursos

---

## 2. Metodología de Análisis

### 2.1 Módulos Analizados

Se analizaron los siguientes módulos del sistema de instructores:

1. **Solicitudes y Aprobaciones**
   - Solicitudes de creación de comunidades
   - Solicitudes de acceso a comunidades

2. **Talleres/Cursos**
   - Nuevos estudiantes inscritos
   - Estudiantes que completan cursos
   - Preguntas y comentarios de estudiantes
   - Estadísticas y métricas

3. **Comunidades**
   - Solicitudes de acceso
   - Nuevos posts y comentarios
   - Contenido reportado en comunidades propias

4. **Contenido**
   - Comentarios en noticias/reels
   - Interacciones con contenido creado

5. **Moderación**
   - Contenido reportado en comunidades propias
   - Necesidad de moderación

---

## 3. Categorías de Notificaciones

### 3.1 Por Prioridad

#### 🔴 **Crítica (Alta Prioridad)**
Notificaciones que requieren atención inmediata.

- Solicitud de comunidad aprobada/rechazada
- Contenido reportado múltiples veces en comunidad propia
- Nuevo estudiante con preguntas urgentes

#### 🟡 **Importante (Media Prioridad)**
Notificaciones que requieren revisión pero no son urgentes.

- Nuevos estudiantes inscritos
- Estudiantes completan curso
- Solicitudes de acceso a comunidad
- Nuevos comentarios en talleres/cursos

#### 🟢 **Informativa (Baja Prioridad)**
Notificaciones informativas sobre actividad.

- Nuevos posts en comunidades
- Estadísticas semanales
- Resúmenes de actividad

---

## 4. Notificaciones por Módulo

### 4.1 📋 Solicitudes y Aprobaciones

#### NTI-001: Solicitud de Comunidad Aprobada
**Tipo:** Solicitud  
**Prioridad:** Alta  
**Evento:** Un administrador aprueba la solicitud de creación de comunidad

**Contenido:**
- "✅ Tu solicitud de comunidad ha sido aprobada: [Nombre]"
- Nombre de la comunidad
- Descripción
- Enlace directo a la comunidad
- Próximos pasos sugeridos (invitar miembros, crear posts, etc.)

**Canales:** Email, In-app, Push

---

#### NTI-002: Solicitud de Comunidad Rechazada
**Tipo:** Solicitud  
**Prioridad:** Alta  
**Evento:** Un administrador rechaza la solicitud de creación de comunidad

**Contenido:**
- "❌ Tu solicitud de comunidad fue rechazada: [Nombre]"
- Razón del rechazo
- Sugerencias para mejorar la solicitud
- Opción para enviar nueva solicitud
- Contacto con administrador (si está disponible)

**Canales:** Email, In-app

---

### 4.2 📚 Talleres/Cursos

#### NTI-003: Nuevo Estudiante Inscrito en Taller
**Tipo:** Taller  
**Prioridad:** Media  
**Evento:** Un estudiante se inscribe a un taller del instructor

**Contenido:**
- "Nuevo estudiante inscrito: [Nombre del Taller]"
- Nombre del estudiante
- Fecha de inscripción
- Total de estudiantes inscritos
- Enlaces: Ver estudiante | Ver taller | Estadísticas

**Canales:** In-app

**Agrupación:** Resumen diario si hay múltiples inscripciones

---

#### NTI-004: Estudiante Completa Taller/Curso
**Tipo:** Taller  
**Prioridad:** Media  
**Evento:** Un estudiante completa un taller del instructor (100% progreso)

**Contenido:**
- "🎉 [Estudiante] completó tu taller: [Nombre]"
- Nombre del estudiante
- Tiempo total invertido
- Calificación final (si aplica)
- Fecha de completado
- Enlaces: Ver perfil del estudiante | Ver estadísticas del taller

**Canales:** In-app, Email (resumen semanal)

**Nota:** Notificar solo si el instructor lo configura

---

#### NTI-005: Nueva Pregunta en Comunidad del Taller
**Tipo:** Taller  
**Prioridad:** Alta  
**Evento:** Un estudiante hace una pregunta en la comunidad asociada al taller

**Contenido:**
- "❓ Nueva pregunta en [Taller]: [Título]"
- Estudiante que pregunta
- Vista previa de la pregunta
- Comunidad donde se hizo la pregunta
- Enlace directo a la pregunta

**Canales:** In-app, Push, Email (si es pregunta urgente)

---

#### NTI-006: Comentario en Taller/Curso
**Tipo:** Taller  
**Prioridad:** Media  
**Evento:** Un estudiante comenta en un taller/curso del instructor

**Contenido:**
- "[Estudiante] comentó en tu taller: [Nombre]"
- Vista previa del comentario
- Módulo/Lección donde se comentó
- Enlace directo al comentario

**Canales:** In-app, Email (resumen diario)

**Agrupación:** Agrupar múltiples comentarios del mismo taller

---

#### NTI-007: Evaluación de Taller/Curso Completada
**Tipo:** Taller  
**Prioridad:** Media  
**Evento:** Un estudiante completa una evaluación del taller

**Contenido:**
- "[Estudiante] completó la evaluación de [Taller]"
- Calificación obtenida
- Promedio del taller (si aplica)
- Enlace para revisar respuestas

**Canales:** In-app

**Agrupación:** Resumen diario con todas las evaluaciones

---

#### NTI-008: Alerta de Bajo Progreso en Taller
**Tipo:** Taller  
**Prioridad:** Media  
**Evento:** Múltiples estudiantes tienen bajo progreso en un taller

**Contenido:**
- "⚠️ Bajo progreso detectado en [Taller]"
- Número de estudiantes con bajo progreso
- Estudiantes afectados (lista)
- Promedio de progreso
- Sugerencias de acción (enviar recordatorio, crear material adicional)
- Enlaces: Ver estadísticas | Contactar estudiantes

**Canales:** In-app, Email (si es significativo)

**Umbral:** 5+ estudiantes con menos del 50% de progreso después de 1 semana

---

#### NTI-009: Nuevo Estudiante en Lista de Espera
**Tipo:** Taller  
**Prioridad:** Baja  
**Evento:** Un estudiante se agrega a la lista de espera de un taller con cupo limitado

**Contenido:**
- "Nuevo estudiante en lista de espera: [Taller]"
- Nombre del estudiante
- Posición en lista
- Total en lista de espera
- Enlace para gestionar lista de espera

**Canales:** In-app

---

### 4.3 👥 Comunidades

#### NTI-010: Nueva Solicitud de Acceso a Comunidad
**Tipo:** Comunidad  
**Prioridad:** Media  
**Evento:** Un usuario solicita acceso a una comunidad del instructor

**Contenido:**
- "Nueva solicitud de acceso a [Comunidad]"
- Usuario solicitante
- Razón de solicitud (si está disponible)
- Perfil del usuario
- Fecha de solicitud
- Enlaces: Ver perfil | Aprobar | Rechazar

**Canales:** In-app, Push (si hay muchas solicitudes pendientes)

**Agrupación:** Resumen si hay múltiples solicitudes

---

#### NTI-011: Solicitud de Acceso Aprobada por Instructor
**Tipo:** Comunidad  
**Prioridad:** Baja  
**Evento:** El instructor aprueba una solicitud de acceso (confirmación)

**Contenido:**
- "✅ Aprobaste el acceso de [Usuario] a [Comunidad]"
- Usuario aprobado
- Fecha de aprobación
- Total de miembros ahora
- Enlace a la comunidad

**Canales:** In-app (opcional, solo para confirmación)

**Nota:** Notificación informativa, puede desactivarse

---

#### NTI-012: Nuevo Post en Comunidad Propia
**Tipo:** Comunidad  
**Prioridad:** Baja  
**Evento:** Un miembro crea un nuevo post en una comunidad del instructor

**Contenido:**
- "Nuevo post en [Comunidad]: [Título]"
- Autor del post
- Vista previa del post
- Enlace al post

**Canales:** In-app

**Configuración:** Instructor puede desactivar esta notificación

**Frecuencia:** Máximo 10 notificaciones por día por comunidad

---

#### NTI-013: Nuevo Comentario en Comunidad Propia
**Tipo:** Comunidad  
**Prioridad:** Media  
**Evento:** Alguien comenta en un post de una comunidad del instructor

**Contenido:**
- "[Usuario] comentó en [Comunidad]"
- Vista previa del comentario
- Post donde se comentó
- Enlace al comentario

**Canales:** In-app

**Agrupación:** Agrupar múltiples comentarios del mismo post

---

#### NTI-014: Contenido Reportado en Comunidad Propia
**Tipo:** Moderación  
**Prioridad:** Alta  
**Evento:** Un post o comentario en una comunidad del instructor recibe un reporte

**Contenido:**
- "⚠️ Contenido reportado en [Comunidad]"
- Tipo de contenido (post/comentario)
- Autor del contenido reportado
- Razón del reporte
- Contenido reportado (preview)
- Enlaces: Ver contenido | Revisar reporte | Moderar

**Canales:** In-app, Push, Email (si hay 2+ reportes del mismo contenido)

**Nota:** Crítico si hay múltiples reportes

---

#### NTI-015: Contenido Reportado Múltiples Veces
**Tipo:** Moderación  
**Prioridad:** Crítica  
**Evento:** Un post o comentario en una comunidad del instructor recibe 3+ reportes

**Contenido:**
- "🚨 Contenido reportado múltiples veces en [Comunidad]"
- Tipo de contenido
- Autor del contenido
- Número de reportes recibidos
- Contenido reportado
- Urgencia: Revisión inmediata requerida
- Enlaces: Moderar ahora | Ver reportes | Ver historial del usuario

**Canales:** In-app, Push, Email (siempre)

**Tiempo de Respuesta Esperado:** Inmediato

---

### 4.4 📝 Contenido Creado

#### NTI-016: Comentario en Noticia Propia
**Tipo:** Contenido  
**Prioridad:** Media  
**Evento:** Alguien comenta en una noticia del instructor

**Contenido:**
- "[Usuario] comentó en tu noticia: [Título]"
- Vista previa del comentario
- Enlace al comentario

**Canales:** In-app, Email (resumen diario)

**Agrupación:** Agrupar múltiples comentarios de la misma noticia

---

#### NTI-017: Comentario en Reel Propio
**Tipo:** Contenido  
**Prioridad:** Media  
**Evento:** Alguien comenta en un reel del instructor

**Contenido:**
- "[Usuario] comentó en tu reel"
- Vista previa del comentario
- Enlace al reel

**Canales:** In-app

**Agrupación:** Similar a comentarios en noticias

---

#### NTI-018: Reacción en Contenido Propio
**Tipo:** Contenido  
**Prioridad:** Baja  
**Evento:** Múltiples usuarios reaccionan a contenido del instructor (noticias/reels)

**Contenido:**
- "[N] personas reaccionaron a tu [Tipo de Contenido]"
- Tipo de contenido
- Tipo de reacción principal
- Enlace al contenido

**Canales:** In-app

**Agrupación:** Solo notificar si hay 10+ reacciones nuevas

---

### 4.5 📊 Estadísticas y Reportes

#### NTI-019: Reporte Semanal de Taller
**Tipo:** Estadísticas  
**Prioridad:** Baja  
**Evento:** Resumen semanal automático de actividad de talleres

**Contenido:**
- "📊 Reporte semanal de tus talleres"
- Nuevos estudiantes inscritos
- Estudiantes que completaron talleres
- Progreso promedio
- Preguntas sin responder
- Tendencias y métricas clave
- Gráficos de actividad
- Enlaces: Ver reporte completo | Dashboard

**Canales:** Email (solo email, una vez por semana)

**Horario:** Lunes 8:00 AM hora local

---

#### NTI-020: Recordatorio de Talleres Sin Actividad
**Tipo:** Estadísticas  
**Prioridad:** Baja  
**Evento:** Taller no ha tenido actividad reciente (configurable)

**Contenido:**
- "📚 Recordatorio: [Taller] sin actividad reciente"
- Última actividad registrada
- Estudiantes inscritos
- Sugerencias para reactivar (crear nuevo contenido, enviar anuncio)
- Enlace al taller

**Canales:** Email (solo si no hay actividad en 2+ semanas)

**Frecuencia:** Máximo 1 por mes por taller

---

#### NTI-021: Logro Alcanzado (Estudiantes)
**Tipo:** Estadísticas  
**Prioridad:** Baja  
**Evento:** Milestone alcanzado en talleres (ej: 100 estudiantes, 50 completados)

**Contenido:**
- "🎯 Logro alcanzado: [Descripción]"
- Logro específico
- Estadísticas relevantes
- Mensaje de felicitación
- Enlaces: Ver estadísticas | Compartir logro

**Canales:** In-app, Email (solo para logros importantes)

**Ejemplos:**
- Primeros 10 estudiantes completan el taller
- 100 estudiantes inscritos
- 50% tasa de completado

---

### 4.6 🔔 Sistema

#### NTI-022: Cambio en Configuración de Taller
**Tipo:** Sistema  
**Prioridad:** Media  
**Evento:** Un administrador modifica configuración de un taller (si aplica)

**Contenido:**
- "Configuración modificada: [Taller]"
- Cambios realizados
- Administrador que realizó el cambio
- Fecha y hora
- Enlaces: Ver cambios | Revertir cambios

**Canales:** In-app, Email (si es cambio importante)

---

#### NTI-023: Taller/Curso Despublicado
**Tipo:** Sistema  
**Prioridad:** Alta  
**Evento:** Un administrador despublica o suspende un taller del instructor

**Contenido:**
- "⚠️ [Taller] ha sido despublicado"
- Razón de despublicación
- Administrador que realizó la acción
- Acciones requeridas (si aplica)
- Contacto con administrador
- Enlaces: Ver detalles | Contactar soporte

**Canales:** Email, In-app, Push

---

---

## 5. Priorización

### 5.1 Matriz de Priorización

| Notificación | Prioridad | Acción Requerida | Frecuencia | Impacto |
|--------------|-----------|------------------|------------|---------|
| NTI-001 | Alta | Ver comunidad | Una vez | Alto |
| NTI-002 | Alta | Revisar razón | Una vez | Alto |
| NTI-005 | Alta | Responder pregunta | Frecuente | Alto |
| NTI-014 | Alta | Moderar contenido | Ocasional | Alto |
| NTI-015 | Crítica | Moderar inmediato | Urgente | Muy Alto |
| NTI-023 | Alta | Contactar admin | Rara | Alto |

### 5.2 Fase 1 - MVP (Must Have)

**Implementación Inmediata:**
- ✅ NTI-001: Solicitud de comunidad aprobada
- ✅ NTI-002: Solicitud de comunidad rechazada
- ✅ NTI-005: Nueva pregunta en comunidad
- ✅ NTI-010: Nueva solicitud de acceso
- ✅ NTI-014: Contenido reportado
- ✅ NTI-015: Contenido reportado múltiples veces
- ✅ NTI-023: Taller despublicado

**Total Fase 1:** 7 notificaciones críticas

### 5.3 Fase 2 - Expansión (Should Have)

**Siguiente Iteración:**
- ✅ NTI-003: Nuevo estudiante inscrito
- ✅ NTI-004: Estudiante completa taller
- ✅ NTI-006: Comentario en taller
- ✅ NTI-007: Evaluación completada
- ✅ NTI-013: Nuevo comentario en comunidad
- ✅ NTI-016: Comentario en noticia
- ✅ NTI-017: Comentario en reel
- ✅ NTI-022: Cambio en configuración

**Total Fase 2:** 8 notificaciones adicionales

### 5.4 Fase 3 - Optimización (Nice to Have)

**Mejoras y Refinamiento:**
- ✅ NTI-008: Alerta de bajo progreso
- ✅ NTI-009: Nuevo estudiante en lista de espera
- ✅ NTI-011: Solicitud aprobada (confirmación)
- ✅ NTI-012: Nuevo post en comunidad
- ✅ NTI-018: Reacción en contenido
- ✅ NTI-019: Reporte semanal
- ✅ NTI-020: Recordatorio sin actividad
- ✅ NTI-021: Logro alcanzado

**Total Fase 3:** 8 notificaciones adicionales

**Total General:** 23 notificaciones identificadas

---

## 6. Canales de Notificación

### 6.1 Matriz de Canales por Prioridad

| Prioridad | In-App | Push | Email |
|-----------|--------|------|-------|
| Crítica | ✅ | ✅ | ✅ |
| Alta | ✅ | ✅ | ✅ |
| Media | ✅ | ⚠️ | ⚠️ |
| Baja | ✅ | ❌ | ❌ |

**Leyenda:**
- ✅ Siempre incluido
- ⚠️ Opcional/configurable
- ❌ No incluido

---

## 7. Configuración de Instructor

### 7.1 Preferencias Granulares

Cada instructor debe poder configurar:

1. **Por Tipo de Notificación:**
   - Activar/desactivar cada tipo
   - Seleccionar canales preferidos

2. **Por Canal:**
   - In-app: Siempre activo
   - Push: Solo críticas o todas
   - Email: Frecuencia (inmediato, diario, semanal, nunca)

3. **Agrupación:**
   - Notificaciones individuales vs resúmenes
   - Frecuencia de resúmenes por email

4. **Umbrales:**
   - Configurar umbrales para alertas de bajo progreso
   - Configurar frecuencia de reportes semanales

### 7.2 Configuración por Defecto

**Instructores Nuevos:**
- ✅ In-app: Todas activadas
- ✅ Push: Solo críticas
- ✅ Email: Críticas inmediato + Resumen semanal

**Notificaciones Siempre Activas (No Desactivables):**
- Solicitudes de comunidad aprobadas/rechazadas
- Contenido reportado múltiples veces
- Taller despublicado

---

## 8. Consideraciones Especiales

### 8.1 Agrupación Inteligente

- Agrupar notificaciones similares del mismo taller/comunidad
- Resúmenes diarios para comentarios y reacciones
- Resúmenes semanales para estadísticas

### 8.2 Priorización Contextual

- Priorizar notificaciones de talleres activos
- Priorizar comunidades con más actividad
- Notificaciones más antiguas aumentan prioridad si no han sido revisadas

### 8.3 Integración con Panel de Instructor

- Acciones rápidas desde notificaciones
- Navegación directa a secciones relevantes
- Vista de historial de notificaciones por taller/comunidad

---

## 9. Conclusiones

### 9.1 Resumen

Se identificaron **23 tipos de notificaciones** para instructores, organizadas en:

- **7 notificaciones críticas (Fase 1)**
- **8 notificaciones importantes (Fase 2)**
- **8 notificaciones informativas (Fase 3)**

### 9.2 Diferencias con Otros Roles

**Notificaciones de Instructores:**
- Más enfocadas en gestión de talleres y estudiantes
- Moderación de comunidades propias
- Estadísticas y reportes educativos
- Menos notificaciones de sistema que administradores

### 9.3 Próximos Pasos

1. ✅ Revisar y aprobar este análisis
2. ✅ Priorizar con stakeholders
3. ✅ Crear tickets de implementación
4. ✅ Iniciar Fase 1 (MVP)

---

**Documento creado:** Diciembre 2024  
**Última actualización:** Diciembre 2024  
**Versión:** 1.0  
**Estado:** ✅ Completo y listo para revisión

