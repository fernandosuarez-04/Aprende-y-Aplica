# 🔔 Notificaciones para Usuarios Normales
## Plataforma: Aprende y Aplica

**Versión:** 1.0  
**Fecha:** Diciembre 2024  
**Autor:** Equipo de Desarrollo  
**Estado:** Completo

---

> **Nota:** Este documento es parte de la serie de análisis de notificaciones. Para la visión general y arquitectura, ver [`ANALISIS_NOTIFICACIONES.md`](./ANALISIS_NOTIFICACIONES.md)

## 📋 Tabla de Contenidos

1. [Introducción](#1-introducción)
2. [Notificaciones por Módulo](#2-notificaciones-por-módulo)
3. [Priorización](#3-priorización)
4. [Referencia Rápida](#4-referencia-rápida)

---

## 1. Introducción

Este documento detalla todas las notificaciones específicas para **usuarios normales** (estudiantes) de la plataforma. Para información sobre arquitectura, canales, configuración y plan de implementación, consultar el documento principal.

---

## 2. Notificaciones por Módulo

### 2.1 📚 Cursos y Progreso

#### NTU-001: Inscripción a Curso Confirmada
**Prioridad:** Media  
**Canales:** Email, In-app, Push (opcional)

**Contenido:**
- "¡Bienvenido al curso [Nombre del Curso]!"
- Resumen del curso
- Próximos pasos sugeridos
- Enlace directo al curso

---

#### NTU-002: Curso Asignado (Business Panel)
**Prioridad:** Alta  
**Canales:** Email, In-app, Push

**Contenido:**
- "Tu organización te ha asignado el curso [Nombre]"
- Fecha límite (si aplica)
- Información del curso
- Enlace directo

---

#### NTU-003: Lección Completada
**Prioridad:** Baja  
**Canales:** In-app (solo hitos: 25%, 50%, 75%, 100%)

**Contenido:**
- "¡Has completado la lección [Nombre]!"
- Progreso del módulo (%)
- Próxima lección sugerida

---

#### NTU-004: Módulo Completado
**Prioridad:** Media  
**Canales:** Email, In-app, Push (opcional)

**Contenido:**
- "¡Felicidades! Has completado el módulo [Nombre]"
- Progreso general del curso
- Próximo módulo desbloqueado
- Logros desbloqueados (si aplica)

---

#### NTU-005: Curso Completado
**Prioridad:** Alta  
**Canales:** Email, In-app, Push

**Contenido:**
- "🎉 ¡Felicidades! Has completado el curso [Nombre]"
- Resumen de logros
- Tiempo total invertido
- Información sobre certificado
- Cursos relacionados recomendados

---

#### NTU-006: Certificado Generado
**Prioridad:** Alta  
**Canales:** Email, In-app, Push

**Contenido:**
- "Tu certificado está listo: [Nombre del Curso]"
- Hash de verificación
- Enlace de descarga
- Enlace de verificación pública
- Mensaje de felicitación

---

#### NTU-007: Evaluación Completada
**Prioridad:** Media  
**Canales:** In-app (inmediata), Email (resumen diario)

**Contenido:**
- "Has completado la evaluación [Nombre]"
- Calificación obtenida
- Promedio del curso (si aplica)
- Retroalimentación sobre fortalezas/debilidades
- Enlace para revisar respuestas

---

#### NTU-008: Recordatorio de Progreso
**Prioridad:** Baja  
**Canales:** Email (solo si inactivo 3+ días)

**Contenido:**
- "Continúa aprendiendo: [Nombre del Curso]"
- Último contenido visto
- Progreso actual
- Mensaje motivacional
- Enlace para continuar

**Frecuencia:** Máximo 1 por semana

---

### 2.2 👥 Comunidades

#### NTU-009: Solicitud de Acceso Aprobada
**Prioridad:** Alta  
**Canales:** Email, In-app, Push

**Contenido:**
- "¡Bienvenido a la comunidad [Nombre]!"
- Descripción breve de la comunidad
- Enlace directo a la comunidad
- Información sobre reglas y guía de inicio

---

#### NTU-010: Solicitud de Acceso Rechazada
**Prioridad:** Alta  
**Canales:** Email, In-app

**Contenido:**
- "Tu solicitud para [Nombre de Comunidad] no fue aprobada"
- Razón (si está disponible)
- Instrucciones para volver a solicitar (si aplica)
- Alternativas sugeridas

---

#### NTU-011: Nuevo Comentario en Post Propio
**Prioridad:** Media  
**Canales:** In-app, Push, Email (resumen diario)

**Contenido:**
- "[Usuario] comentó en tu post"
- Vista previa del comentario
- Nombre de la comunidad
- Enlace al post

**Agrupación:** Agrupar múltiples comentarios del mismo post

---

#### NTU-012: Respuesta a Comentario Propio
**Prioridad:** Alta  
**Canales:** In-app, Push, Email (si es respuesta directa)

**Contenido:**
- "[Usuario] respondió a tu comentario"
- Vista previa de la respuesta
- Contexto (post y comentario original)
- Enlace directo a la conversación

---

#### NTU-013: Nueva Reacción en Post Propio
**Prioridad:** Baja  
**Canales:** In-app

**Contenido:**
- "[Usuario] y [N] personas más reaccionaron a tu post"
- Tipo de reacción principal
- Nombre de la comunidad
- Enlace al post

**Agrupación:** 
- Agrupar múltiples reacciones del mismo post
- Solo notificar si hay 3+ reacciones nuevas o si el usuario tiene pocas reacciones (< 10)

---

#### NTU-014: Nueva Reacción en Comentario Propio
**Prioridad:** Baja  
**Canales:** In-app (solo si hay múltiples reacciones)

**Contenido:**
- "[N] personas reaccionaron a tu comentario"
- Tipo de reacción principal
- Vista previa del comentario
- Enlace directo

**Agrupación:** Agrupar con otras reacciones del mismo comentario

---

#### NTU-015: Nuevo Post en Comunidad Seguida
**Prioridad:** Baja  
**Canales:** In-app

**Contenido:**
- "Nuevo post en [Nombre de Comunidad]"
- Título del post
- Autor del post
- Vista previa
- Enlace al post

**Configuración:** Usuario puede desactivar esta notificación

**Frecuencia:** Máximo 5 notificaciones por día por comunidad

---

#### NTU-016: Mencionado en Post o Comentario
**Prioridad:** Alta  
**Canales:** In-app, Push, Email (si el usuario tiene esa opción activada)

**Contenido:**
- "[Usuario] te mencionó en un post"
- Vista previa del contenido
- Nombre de la comunidad
- Enlace directo a la mención

---

#### NTU-017: Nuevo Miembro en Comunidad Propia
**Prioridad:** Baja  
**Canales:** In-app

**Contenido:**
- "[Usuario] se unió a [Nombre de Comunidad]"
- Perfil del nuevo miembro
- Total de miembros ahora

**Nota:** Solo para admins/moderadores de la comunidad

---

### 2.3 📰 Noticias/Artículos

#### NTU-018: Nuevo Artículo Publicado
**Prioridad:** Media  
**Canales:** In-app, Email (resumen semanal si el usuario está suscrito)

**Contenido:**
- "Nuevo artículo: [Título]"
- Autor
- Vista previa/categoría
- Enlace al artículo

**Configuración:** Usuario puede suscribirse/desuscribirse de notificaciones de artículos

---

#### NTU-019: Comentario en Artículo Propio
**Prioridad:** Media  
**Canales:** In-app, Push, Email (resumen diario)

**Contenido:**
- "[Usuario] comentó en tu artículo [Título]"
- Vista previa del comentario
- Enlace al artículo

**Nota:** Solo para autores

---

### 2.4 🎬 Reels

#### NTU-020: Comentario en Reel Propio
**Prioridad:** Media  
**Canales:** In-app, Push

**Contenido:**
- "[Usuario] comentó en tu reel"
- Vista previa del comentario
- Enlace al reel

**Agrupación:** Similar a comentarios en posts

---

#### NTU-021: Nueva Reacción en Reel Propio
**Prioridad:** Baja  
**Canales:** In-app

**Contenido:**
- "[N] personas reaccionaron a tu reel"
- Tipo de reacción principal
- Enlace al reel

**Agrupación:** Similar a reacciones en posts

---

### 2.5 📅 Zoom/Eventos Virtuales

#### NTU-022: Sesión de Zoom Programada
**Prioridad:** Alta  
**Canales:** Email, In-app, Push

**Contenido:**
- "Sesión de Zoom programada: [Título]"
- Fecha y hora
- Duración
- Curso relacionado
- Enlace para unirse
- Botón para agregar al calendario

---

#### NTU-023: Recordatorio de Sesión (24 horas antes)
**Prioridad:** Alta  
**Canales:** Email, In-app, Push

**Contenido:**
- "Recordatorio: Sesión de Zoom mañana: [Título]"
- Fecha y hora
- Enlace para unirse
- Información del instructor
- Material preparatorio (si existe)

---

#### NTU-024: Recordatorio de Sesión (15 minutos antes)
**Prioridad:** Alta  
**Canales:** In-app, Push (urgente)

**Contenido:**
- "¡La sesión comienza en 15 minutos: [Título]"
- Enlace para unirse
- Botón rápido de unión

---

#### NTU-025: Sesión de Zoom Cancelada/Modificada
**Prioridad:** Alta  
**Canales:** Email, In-app, Push

**Contenido:**
- "Sesión actualizada: [Título]"
- Cambios realizados
- Nueva fecha/hora (si aplica)
- Razón de cancelación (si aplica)
- Nueva fecha alternativa (si aplica)

---

#### NTU-026: Grabación de Sesión Disponible
**Prioridad:** Media  
**Canales:** Email, In-app, Push

**Contenido:**
- "Grabación disponible: [Título de Sesión]"
- Duración de la grabación
- Enlace para ver
- Resumen o puntos clave (si existe)

---

### 2.6 🔔 Sistema y Configuración

#### NTU-027: Actualización de Plataforma
**Prioridad:** Baja  
**Canales:** Email (solo para actualizaciones importantes), In-app (banner)

**Contenido:**
- "Nueva actualización: [Título]"
- Lista de mejoras/nuevas características
- Enlace a changelog completo
- Notas importantes

**Frecuencia:** Solo para actualizaciones significativas

---

#### NTU-028: Cambio de Contraseña
**Prioridad:** Alta  
**Canales:** Email (siempre), In-app

**Contenido:**
- "Tu contraseña ha sido cambiada"
- Fecha y hora del cambio
- Dispositivo/ubicación (si está disponible)
- Si no fuiste tú, enlace para recuperar cuenta

---

#### NTU-029: Inicio de Sesión desde Nuevo Dispositivo
**Prioridad:** Media  
**Canales:** Email (siempre para primer inicio desde dispositivo nuevo)

**Contenido:**
- "Nuevo inicio de sesión detectado"
- Dispositivo y ubicación aproximada
- Fecha y hora
- Enlace para revisar actividad
- Si no fuiste tú, enlace para cambiar contraseña

---

## 3. Priorización

### 3.1 Fase 1 - MVP (10 notificaciones críticas)

- ✅ NTU-002: Curso asignado
- ✅ NTU-005: Curso completado
- ✅ NTU-006: Certificado generado
- ✅ NTU-009: Solicitud aprobada
- ✅ NTU-012: Respuesta a comentario
- ✅ NTU-016: Mención en post/comentario
- ✅ NTU-022: Sesión programada
- ✅ NTU-023: Recordatorio 24h
- ✅ NTU-024: Recordatorio 15min
- ✅ NTU-028: Cambio de contraseña

### 3.2 Fase 2 - Expansión (9 notificaciones importantes)

- ✅ NTU-001: Inscripción confirmada
- ✅ NTU-004: Módulo completado
- ✅ NTU-007: Evaluación completada
- ✅ NTU-011: Comentario en post propio
- ✅ NTU-013: Reacción en post (agrupada)
- ✅ NTU-018: Nuevo artículo
- ✅ NTU-025: Sesión cancelada/modificada
- ✅ NTU-026: Grabación disponible
- ✅ NTU-029: Nuevo dispositivo

### 3.3 Fase 3 - Optimización (10 notificaciones informativas)

- ✅ NTU-003: Lección completada (solo hitos)
- ✅ NTU-008: Recordatorio de progreso
- ✅ NTU-010: Solicitud rechazada
- ✅ NTU-014: Reacción en comentario
- ✅ NTU-015: Nuevo post en comunidad
- ✅ NTU-017: Nuevo miembro (admin)
- ✅ NTU-019: Comentario en artículo
- ✅ NTU-020: Comentario en reel
- ✅ NTU-021: Reacción en reel
- ✅ NTU-027: Actualización de plataforma

**Total:** 29 notificaciones

---

## 4. Referencia Rápida

### 4.1 Por Módulo

| Módulo | Cantidad | Prioridad Principal |
|--------|----------|-------------------|
| Cursos y Progreso | 8 | Media-Alta |
| Comunidades | 9 | Media-Alta |
| Noticias | 2 | Media |
| Reels | 2 | Baja-Media |
| Zoom/Eventos | 5 | Alta |
| Sistema | 3 | Alta |

### 4.2 Por Prioridad

- **Alta:** 14 notificaciones
- **Media:** 10 notificaciones
- **Baja:** 5 notificaciones

---

**Para más información sobre arquitectura, canales, configuración e implementación, consultar: [`ANALISIS_NOTIFICACIONES.md`](./ANALISIS_NOTIFICACIONES.md)**

