# 📢 Análisis del Sistema de Notificaciones - Documento Maestro
## Plataforma: Aprende y Aplica

**Versión:** 1.0  
**Fecha:** Diciembre 2024  
**Autor:** Equipo de Desarrollo  
**Estado:** Completo

---

## 📋 Tabla de Contenidos

1. [Introducción](#1-introducción)
2. [Documentos del Análisis](#2-documentos-del-análisis)
3. [Resumen Ejecutivo](#3-resumen-ejecutivo)
4. [Arquitectura y Canales](#4-arquitectura-y-canales)
5. [Configuración](#5-configuración)
6. [Plan de Implementación](#6-plan-de-implementación)

---

## 1. Introducción

### 1.1 Objetivo

Este documento maestro consolida el análisis completo del sistema de notificaciones para la plataforma "Aprende y Aplica", organizando la información en documentos específicos por tipo de usuario y proporcionando la visión general, arquitectura e implementación.

### 1.2 Alcance

Este análisis cubre:
- ✅ Usuarios normales (estudiantes)
- ✅ Administradores del sistema
- ✅ Todos los módulos principales de la plataforma
- ✅ Arquitectura y canales de notificación
- ✅ Plan de implementación completo

### 1.3 Estructura de Documentos

El análisis está dividido en documentos especializados para facilitar la navegación:

1. **[NOTIFICACIONES_USUARIOS_NORMALES.md](./NOTIFICACIONES_USUARIOS_NORMALES.md)** - Notificaciones para estudiantes
2. **[NOTIFICACIONES_ADMINISTRADORES.md](./NOTIFICACIONES_ADMINISTRADORES.md)** - Notificaciones para administradores
3. **[NOTIFICACIONES_INSTRUCTORES.md](./NOTIFICACIONES_INSTRUCTORES.md)** - Notificaciones para instructores
4. **[NOTIFICACIONES_BUSINESS_PANEL.md](./NOTIFICACIONES_BUSINESS_PANEL.md)** - Notificaciones para usuarios del Business Panel
5. Este documento - Arquitectura, canales y plan de implementación general

---

## 2. Documentos del Análisis

### 2.1 Documentos Específicos por Rol

El análisis está dividido en documentos especializados:

#### 📘 [NOTIFICACIONES_USUARIOS_NORMALES.md](./NOTIFICACIONES_USUARIOS_NORMALES.md)

**Descripción:** Notificaciones completas para usuarios normales (estudiantes)

**Contenido:**
- 29 notificaciones identificadas
- Organizadas por módulos (Cursos, Comunidades, Noticias, Reels, Zoom, Sistema)
- Priorización en 3 fases
- Detalles de cada notificación

**Estadísticas:**
- 🔴 Alta Prioridad: 14 notificaciones
- 🟡 Media Prioridad: 10 notificaciones
- 🟢 Baja Prioridad: 5 notificaciones

#### 📘 [NOTIFICACIONES_ADMINISTRADORES.md](./NOTIFICACIONES_ADMINISTRADORES.md)

**Descripción:** Notificaciones completas para administradores del sistema

**Contenido:**
- 26 notificaciones identificadas
- Organizadas por módulos (Solicitudes, Moderación, Usuarios, Seguridad, Sistema, Métricas)
- Priorización en 3 fases
- Detalles de cada notificación
- Sistema de escalamiento y auditoría

**Estadísticas:**
- 🔴 Crítica: 3 notificaciones
- 🟡 Alta: 5 notificaciones
- 🟢 Media/Baja: 18 notificaciones

#### 📘 [NOTIFICACIONES_INSTRUCTORES.md](./NOTIFICACIONES_INSTRUCTORES.md)

**Descripción:** Notificaciones completas para instructores del sistema

**Contenido:**
- 23 notificaciones identificadas
- Organizadas por módulos (Solicitudes, Talleres/Cursos, Comunidades, Contenido, Estadísticas)
- Priorización en 3 fases
- Detalles de cada notificación
- Gestión de talleres y estudiantes

**Estadísticas:**
- 🔴 Crítica: 1 notificación
- 🟡 Alta: 6 notificaciones
- 🟢 Media/Baja: 16 notificaciones

#### 📘 [NOTIFICACIONES_BUSINESS_PANEL.md](./NOTIFICACIONES_BUSINESS_PANEL.md)

**Descripción:** Notificaciones completas para usuarios del Business Panel

**Contenido:**
- 34 notificaciones identificadas
- Organizadas por módulos (Usuarios, Cursos, Suscripciones, Grupos, Métricas, Sistema)
- Priorización en 3 fases
- Detalles de cada notificación
- Gestión de equipos y suscripciones
- Integración con sistema de notificaciones existente

**Estadísticas:**
- 🔴 Crítica: 5 notificaciones
- 🟡 Alta: 6 notificaciones
- 🟢 Media/Baja: 23 notificaciones

---

## 3. Resumen Ejecutivo

### 3.1 Resumen General

Se identificaron un total de **112 tipos de notificaciones** para la plataforma:

- **29 notificaciones para usuarios normales**
- **26 notificaciones para administradores**
- **23 notificaciones para instructores**
- **34 notificaciones para usuarios del Business Panel**

### 3.2 Categorización por Tipo

**Usuarios Normales:**
- 📚 Cursos y Progreso: 8 notificaciones
- 👥 Comunidades: 9 notificaciones
- 📰 Noticias/Artículos: 2 notificaciones
- 🎬 Reels: 2 notificaciones
- 📅 Zoom/Eventos: 5 notificaciones
- 🔔 Sistema: 3 notificaciones

**Administradores:**
- 📋 Solicitudes: 2 notificaciones
- ⚠️ Moderación: 6 notificaciones
- 👥 Usuarios: 5 notificaciones
- 🔒 Seguridad: 3 notificaciones
- 📊 Sistema: 4 notificaciones
- 📈 Métricas: 3 notificaciones
- 📝 Contenido: 3 notificaciones

**Instructores:**
- 📋 Solicitudes: 2 notificaciones
- 📚 Talleres/Cursos: 7 notificaciones
- 👥 Comunidades: 6 notificaciones
- 📝 Contenido: 3 notificaciones
- 📊 Estadísticas: 3 notificaciones
- 🔔 Sistema: 2 notificaciones

**Business Panel:**
- 👥 Usuarios: 6 notificaciones
- 📚 Cursos: 8 notificaciones
- 💳 Suscripciones: 8 notificaciones
- 👥 Grupos: 4 notificaciones
- 📊 Métricas: 5 notificaciones
- 🔔 Sistema: 3 notificaciones

### 3.3 Priorización Global

**Fase 1 - MVP (Must Have):**
- 10 notificaciones críticas para usuarios normales
- 8 notificaciones críticas para administradores
- 7 notificaciones críticas para instructores
- 11 notificaciones críticas para Business Panel
- **Total: 36 notificaciones críticas**

**Fase 2 - Expansión (Should Have):**
- 9 notificaciones importantes para usuarios normales
- 9 notificaciones importantes para administradores
- 8 notificaciones importantes para instructores
- 11 notificaciones importantes para Business Panel
- **Total: 37 notificaciones importantes**

**Fase 3 - Optimización (Nice to Have):**
- 10 notificaciones informativas para usuarios normales
- 9 notificaciones informativas para administradores
- 8 notificaciones informativas para instructores
- 12 notificaciones informativas para Business Panel
- **Total: 39 notificaciones informativas**

### 3.4 Métricas Esperadas

**Objetivos:**
- 70%+ de notificaciones leídas en 24h (usuarios normales)
- 90%+ de notificaciones críticas revisadas en 4h (administradores)
- < 5% de usuarios desactivan todas las notificaciones
- 80%+ de satisfacción con el sistema

---

## 4. Arquitectura y Canales

### 4.1 Visión General de Canales

Para detalles específicos de cada notificación, consultar:
- **[NOTIFICACIONES_USUARIOS_NORMALES.md](./NOTIFICACIONES_USUARIOS_NORMALES.md)** - Todas las notificaciones para estudiantes
- **[NOTIFICACIONES_ADMINISTRADORES.md](./NOTIFICACIONES_ADMINISTRADORES.md)** - Todas las notificaciones para administradores

---

### 4.2 Canales Disponibles

#### 4.2.1 In-App (Aplicación Web)

**Descripción:** Notificaciones mostradas dentro de la plataforma.
- "¡Bienvenido al curso [Nombre del Curso]!"
- Resumen del curso
- Próximos pasos sugeridos
- Enlace directo al curso

**Canales:** Email, In-app, Push (opcional)

---

#### NTC-002: Curso Asignado (Business Panel)
**Tipo:** Académica  
**Prioridad:** Alta  
**Evento:** Una organización asigna un curso al usuario

**Contenido:**
- "Tu organización te ha asignado el curso [Nombre]"
- Fecha límite (si aplica)
- Información del curso
- Enlace directo

**Canales:** Email, In-app, Push

---

#### NTC-003: Lección Completada
**Tipo:** Académica  
**Prioridad:** Baja  
**Evento:** Usuario completa una lección

**Contenido:**
- "¡Has completado la lección [Nombre]!"
- Progreso del módulo (%)
- Próxima lección sugerida

**Canales:** In-app (solo si es hito importante, ej: 25%, 50%, 75%, 100%)

**Nota:** Evitar spam - solo notificar en hitos significativos.

---

#### NTC-004: Módulo Completado
**Tipo:** Académica  
**Prioridad:** Media  
**Evento:** Usuario completa un módulo completo

**Contenido:**
- "¡Felicidades! Has completado el módulo [Nombre]"
- Progreso general del curso
- Próximo módulo desbloqueado
- Logros desbloqueados (si aplica)

**Canales:** Email, In-app, Push (opcional)

---

#### NTC-005: Curso Completado
**Tipo:** Académica  
**Prioridad:** Alta  
**Evento:** Usuario completa un curso (100% progreso)

**Contenido:**
- "🎉 ¡Felicidades! Has completado el curso [Nombre]"
- Resumen de logros
- Tiempo total invertido
- Información sobre certificado
- Cursos relacionados recomendados

**Canales:** Email, In-app, Push

---

#### NTC-006: Certificado Generado
**Tipo:** Académica  
**Prioridad:** Alta  
**Evento:** Sistema genera certificado al completar curso

**Contenido:**
- "Tu certificado está listo: [Nombre del Curso]"
- Hash de verificación
- Enlace de descarga
- Enlace de verificación pública
- Mensaje de felicitación

**Canales:** Email, In-app, Push

---

#### NTC-007: Evaluación Completada
**Tipo:** Académica  
**Prioridad:** Media  
**Evento:** Usuario completa una evaluación

**Contenido:**
- "Has completado la evaluación [Nombre]"
- Calificación obtenida
- Promedio del curso (si aplica)
- Retroalimentación sobre fortalezas/debilidades
- Enlace para revisar respuestas

**Canales:** In-app (inmediata), Email (resumen diario si hay más evaluaciones)

---

#### NTC-008: Recordatorio de Progreso
**Tipo:** Académica  
**Prioridad:** Baja  
**Evento:** Usuario no ha avanzado en curso por X días

**Contenido:**
- "Continúa aprendiendo: [Nombre del Curso]"
- Último contenido visto
- Progreso actual
- Mensaje motivacional
- Enlace para continuar

**Canales:** Email (solo si usuario ha estado inactivo 3+ días)

**Frecuencia:** Máximo 1 por semana

---

### 4.2 👥 Comunidades

#### NTC-009: Solicitud de Acceso Aprobada
**Tipo:** Social  
**Prioridad:** Alta  
**Evento:** Solicitud de acceso a comunidad es aprobada

**Contenido:**
- "¡Bienvenido a la comunidad [Nombre]!"
- Descripción breve de la comunidad
- Enlace directo a la comunidad
- Información sobre reglas y guía de inicio

**Canales:** Email, In-app, Push

---

#### NTC-010: Solicitud de Acceso Rechazada
**Tipo:** Social  
**Prioridad:** Alta  
**Evento:** Solicitud de acceso a comunidad es rechazada

**Contenido:**
- "Tu solicitud para [Nombre de Comunidad] no fue aprobada"
- Razón (si está disponible)
- Instrucciones para volver a solicitar (si aplica)
- Alternativas sugeridas

**Canales:** Email, In-app

---

#### NTC-011: Nuevo Comentario en Post Propio
**Tipo:** Social  
**Prioridad:** Media  
**Evento:** Alguien comenta en un post del usuario

**Contenido:**
- "[Usuario] comentó en tu post"
- Vista previa del comentario
- Nombre de la comunidad
- Enlace al post

**Canales:** In-app, Push, Email (resumen diario)

**Agrupación:** Agrupar múltiples comentarios del mismo post

---

#### NTC-012: Respuesta a Comentario Propio
**Tipo:** Social  
**Prioridad:** Alta  
**Evento:** Alguien responde a un comentario del usuario

**Contenido:**
- "[Usuario] respondió a tu comentario"
- Vista previa de la respuesta
- Contexto (post y comentario original)
- Enlace directo a la conversación

**Canales:** In-app, Push, Email (si es respuesta directa)

---

#### NTC-013: Nueva Reacción en Post Propio
**Tipo:** Social  
**Prioridad:** Baja  
**Evento:** Alguien reacciona a un post del usuario

**Contenido:**
- "[Usuario] y [N] personas más reaccionaron a tu post"
- Tipo de reacción principal
- Nombre de la comunidad
- Enlace al post

**Canales:** In-app

**Agrupación:** 
- Agrupar múltiples reacciones del mismo post
- Solo notificar si hay 3+ reacciones nuevas
- O si el usuario tiene pocas reacciones (< 10)

---

#### NTC-014: Nueva Reacción en Comentario Propio
**Tipo:** Social  
**Prioridad:** Baja  
**Evento:** Alguien reacciona a un comentario del usuario

**Contenido:**
- "[N] personas reaccionaron a tu comentario"
- Tipo de reacción principal
- Vista previa del comentario
- Enlace directo

**Canales:** In-app (solo si hay múltiples reacciones)

**Agrupación:** Agrupar con otras reacciones del mismo comentario

---

#### NTC-015: Nuevo Post en Comunidad Seguida
**Tipo:** Social  
**Prioridad:** Baja  
**Evento:** Nuevo post en comunidad donde el usuario es miembro

**Contenido:**
- "Nuevo post en [Nombre de Comunidad]"
- Título del post
- Autor del post
- Vista previa
- Enlace al post

**Canales:** In-app

**Configuración:** Usuario puede desactivar esta notificación

**Frecuencia:** Máximo 5 notificaciones por día por comunidad

---

#### NTC-016: Mencionado en Post o Comentario
**Tipo:** Social  
**Prioridad:** Alta  
**Evento:** Usuario es mencionado usando @usuario

**Contenido:**
- "[Usuario] te mencionó en un post"
- Vista previa del contenido
- Nombre de la comunidad
- Enlace directo a la mención

**Canales:** In-app, Push, Email (si el usuario tiene esa opción activada)

---

#### NTC-017: Nuevo Miembro en Comunidad Propia
**Tipo:** Social  
**Prioridad:** Baja  
**Evento:** Nuevo miembro se une a comunidad (solo si el usuario es admin/moderador)

**Contenido:**
- "[Usuario] se unió a [Nombre de Comunidad]"
- Perfil del nuevo miembro
- Total de miembros ahora

**Canales:** In-app

**Nota:** Solo para admins/moderadores de la comunidad

---

### 4.3 📰 Noticias/Artículos

#### NTC-018: Nuevo Artículo Publicado
**Tipo:** Informativa  
**Prioridad:** Media  
**Evento:** Se publica un nuevo artículo en la plataforma

**Contenido:**
- "Nuevo artículo: [Título]"
- Autor
- Vista previa/categoría
- Enlace al artículo

**Canales:** In-app, Email (resumen semanal si el usuario está suscrito)

**Configuración:** Usuario puede suscribirse/desuscribirse de notificaciones de artículos

---

#### NTC-019: Comentario en Artículo Propio
**Tipo:** Social  
**Prioridad:** Media  
**Evento:** Alguien comenta en un artículo del usuario (si aplica - solo para autores)

**Contenido:**
- "[Usuario] comentó en tu artículo [Título]"
- Vista previa del comentario
- Enlace al artículo

**Canales:** In-app, Push, Email (resumen diario)

---

### 4.4 🎬 Reels

#### NTC-020: Comentario en Reel Propio
**Tipo:** Social  
**Prioridad:** Media  
**Evento:** Alguien comenta en un reel del usuario

**Contenido:**
- "[Usuario] comentó en tu reel"
- Vista previa del comentario
- Enlace al reel

**Canales:** In-app, Push

**Agrupación:** Similar a comentarios en posts

---

#### NTC-021: Nueva Reacción en Reel Propio
**Tipo:** Social  
**Prioridad:** Baja  
**Evento:** Alguien reacciona a un reel del usuario

**Contenido:**
- "[N] personas reaccionaron a tu reel"
- Tipo de reacción principal
- Enlace al reel

**Canales:** In-app

**Agrupación:** Similar a reacciones en posts

---

### 4.5 📅 Zoom/Eventos Virtuales

#### NTC-022: Sesión de Zoom Programada
**Tipo:** Evento  
**Prioridad:** Alta  
**Evento:** Se programa una sesión de Zoom para un curso del usuario

**Contenido:**
- "Sesión de Zoom programada: [Título]"
- Fecha y hora
- Duración
- Curso relacionado
- Enlace para unirse
- Botón para agregar al calendario

**Canales:** Email, In-app, Push

---

#### NTC-023: Recordatorio de Sesión (24 horas antes)
**Tipo:** Evento  
**Prioridad:** Alta  
**Evento:** Sesión de Zoom inicia en 24 horas

**Contenido:**
- "Recordatorio: Sesión de Zoom mañana: [Título]"
- Fecha y hora
- Enlace para unirse
- Información del instructor
- Material preparatorio (si existe)

**Canales:** Email, In-app, Push

---

#### NTC-024: Recordatorio de Sesión (15 minutos antes)
**Tipo:** Evento  
**Prioridad:** Alta  
**Evento:** Sesión de Zoom inicia en 15 minutos

**Contenido:**
- "¡La sesión comienza en 15 minutos: [Título]"
- Enlace para unirse
- Botón rápido de unión

**Canales:** In-app, Push (urgente)

---

#### NTC-025: Sesión de Zoom Cancelada/Modificada
**Tipo:** Evento  
**Prioridad:** Alta  
**Evento:** Una sesión programada es cancelada o modificada

**Contenido:**
- "Sesión actualizada: [Título]"
- Cambios realizados
- Nueva fecha/hora (si aplica)
- Razón de cancelación (si aplica)
- Nueva fecha alternativa (si aplica)

**Canales:** Email, In-app, Push

---

#### NTC-026: Grabación de Sesión Disponible
**Tipo:** Evento  
**Prioridad:** Media  
**Evento:** La grabación de una sesión de Zoom está disponible

**Contenido:**
- "Grabación disponible: [Título de Sesión]"
- Duración de la grabación
- Enlace para ver
- Resumen o puntos clave (si existe)

**Canales:** Email, In-app, Push

---

### 4.6 🔔 Sistema y Configuración

#### NTC-027: Actualización de Plataforma
**Tipo:** Sistema  
**Prioridad:** Baja  
**Evento:** Nueva actualización importante de la plataforma

**Contenido:**
- "Nueva actualización: [Título]"
- Lista de mejoras/nuevas características
- Enlace a changelog completo
- Notas importantes

**Canales:** Email (solo para actualizaciones importantes), In-app (banner)

**Frecuencia:** Solo para actualizaciones significativas

---

#### NTC-028: Cambio de Contraseña
**Tipo:** Seguridad  
**Prioridad:** Alta  
**Evento:** Se cambia la contraseña del usuario

**Contenido:**
- "Tu contraseña ha sido cambiada"
- Fecha y hora del cambio
- Dispositivo/ubicación (si está disponible)
- Si no fuiste tú, enlace para recuperar cuenta

**Canales:** Email (siempre), In-app

---

#### NTC-029: Inicio de Sesión desde Nuevo Dispositivo
**Tipo:** Seguridad  
**Prioridad:** Media  
**Evento:** Usuario inicia sesión desde un dispositivo nuevo

**Contenido:**
- "Nuevo inicio de sesión detectado"
- Dispositivo y ubicación aproximada
- Fecha y hora
- Enlace para revisar actividad
- Si no fuiste tú, enlace para cambiar contraseña

**Canales:** Email (siempre para primer inicio desde dispositivo nuevo)

---

---

## 5. Configuración

### 5.1 Matriz de Priorización

| Notificación | Prioridad | Acción Requerida | Frecuencia | Impacto |
|--------------|-----------|------------------|------------|---------|
| NTC-001 | Media | Ver curso | Una vez | Alto |
| NTC-002 | Alta | Ver curso | Ocasional | Alto |
| NTC-005 | Alta | Celebrar | Una vez | Muy Alto |
| NTC-006 | Alta | Descargar | Una vez | Muy Alto |
| NTC-009 | Alta | Ver comunidad | Una vez | Alto |
| NTC-012 | Alta | Responder | Frecuente | Alto |
| NTC-022 | Alta | Agendar | Ocasional | Alto |
| NTC-023 | Alta | Preparar | Ocasional | Alto |
| NTC-024 | Alta | Unirse | Ocasional | Muy Alto |

### 5.2 Fase 1 - MVP (Must Have)

**Implementación Inmediata:**
- ✅ NTC-002: Curso asignado
- ✅ NTC-005: Curso completado
- ✅ NTC-006: Certificado generado
- ✅ NTC-009: Solicitud aprobada
- ✅ NTC-012: Respuesta a comentario
- ✅ NTC-016: Mención en post/comentario
- ✅ NTC-022: Sesión programada
- ✅ NTC-023: Recordatorio 24h
- ✅ NTC-024: Recordatorio 15min
- ✅ NTC-028: Cambio de contraseña

**Total Fase 1:** 10 notificaciones

### 5.3 Fase 2 - Expansión (Should Have)

**Siguiente Iteración:**
- ✅ NTC-001: Inscripción confirmada
- ✅ NTC-004: Módulo completado
- ✅ NTC-007: Evaluación completada
- ✅ NTC-011: Comentario en post propio
- ✅ NTC-013: Reacción en post (agrupada)
- ✅ NTC-018: Nuevo artículo
- ✅ NTC-025: Sesión cancelada/modificada
- ✅ NTC-026: Grabación disponible
- ✅ NTC-029: Nuevo dispositivo

**Total Fase 2:** 9 notificaciones adicionales

### 5.4 Fase 3 - Optimización (Nice to Have)

**Mejoras y Refinamiento:**
- ✅ NTC-003: Lección completada (solo hitos)
- ✅ NTC-008: Recordatorio de progreso
- ✅ NTC-010: Solicitud rechazada
- ✅ NTC-014: Reacción en comentario
- ✅ NTC-015: Nuevo post en comunidad
- ✅ NTC-017: Nuevo miembro (admin)
- ✅ NTC-019: Comentario en artículo
- ✅ NTC-020: Comentario en reel
- ✅ NTC-021: Reacción en reel
- ✅ NTC-027: Actualización de plataforma

**Total Fase 3:** 10 notificaciones adicionales

**Total General:** 29 notificaciones identificadas

---

**Ventajas:**
- ✅ Inmediatas
- ✅ No requieren configuración externa
- ✅ Contextuales con la plataforma

**Desventajas:**
- ❌ Solo visibles si el usuario está activo

**Implementación:**
- Centro de notificaciones unificado
- Badge de contador
- Sonido opcional
- Persistencia de 30 días (usuarios normales)
- Persistencia de 90 días (administradores)

---

#### 4.2.2 Push (Navegador)

**Descripción:** Notificaciones push del navegador.

**Ventajas:**
- ✅ Visibles incluso con tab cerrado
- ✅ Inmediatas
- ✅ No requieren email

**Desventajas:**
- ❌ Requiere permisos del usuario
- ❌ No funcionan en todos los navegadores

**Implementación:**
- Solicitud de permisos al registrarse
- Service Worker para notificaciones
- Soporte para Chrome, Firefox, Edge
- Solo para notificaciones críticas (administradores)

---

#### 4.2.3 Email

**Descripción:** Notificaciones por correo electrónico.

**Ventajas:**
- ✅ Siempre llegan
- ✅ Persistencia permanente
- ✅ Incluyen contexto completo

**Desventajas:**
- ❌ Pueden ir a spam
- ❌ Menos inmediatas

**Implementación:**
- Templates profesionales
- Resúmenes diarios/semanales para evitar spam
- Máximo 3 emails por día (regla de negocio para usuarios normales)
- Notificaciones críticas inmediatas (administradores)

---

#### 4.2.4 Matriz de Canales por Prioridad

| Prioridad | In-App | Push | Email |
|-----------|--------|------|-------|
| Crítica (Admin) | ✅ | ✅ | ✅ |
| Alta | ✅ | ✅ | ✅ |
| Media | ✅ | ⚠️ | ⚠️ |
| Baja | ✅ | ❌ | ❌ |

**Leyenda:**
- ✅ Siempre incluido
- ⚠️ Opcional/configurable
- ❌ No incluido

---

### 7.1 Preferencias Granulares

Cada usuario debe poder configurar:

1. **Por Tipo de Notificación:**
   - Activar/desactivar cada tipo
   - Seleccionar canales preferidos

2. **Por Canal:**
   - In-app: Siempre activo
   - Push: Activar/desactivar globalmente
   - Email: Frecuencia (inmediato, diario, semanal, nunca)

3. **Horarios de No Molestar:**
   - Horarios específicos
   - Días de la semana
   - Zona horaria

4. **Agrupación:**
   - Notificaciones agrupadas vs individuales
   - Frecuencia de resúmenes

### 7.2 Configuración por Defecto

**Usuarios Nuevos:**
- ✅ In-app: Todas activadas
- ✅ Push: Activar con solicitud de permisos
- ✅ Email: Resumen diario (excepto notificaciones críticas)

**Notificaciones Críticas Siempre Activas:**
- Cambios de seguridad (contraseña, dispositivo)
- Certificados generados
- Sesiones de Zoom próximas (15 min)

### 7.3 Centro de Notificaciones

**Características:**
- Lista de todas las notificaciones
- Filtrado por tipo, fecha, estado (leído/no leído)
- Marcar como leída
- Eliminar notificaciones
- Búsqueda
- Persistencia de 30 días
- Exportar (opcional)

---

## 8. Plan de Implementación

### 8.1 Arquitectura Propuesta

#### 8.1.1 Base de Datos

```sql
-- Tabla de notificaciones
CREATE TABLE user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- Tipo de notificación
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB, -- Datos adicionales (enlaces, IDs, etc.)
  is_read BOOLEAN DEFAULT FALSE,
  priority VARCHAR(20) DEFAULT 'medium', -- high, medium, low
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ -- Limpieza automática después de 30 días
);

-- Tabla de preferencias de notificaciones
CREATE TABLE user_notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL,
  in_app_enabled BOOLEAN DEFAULT TRUE,
  push_enabled BOOLEAN DEFAULT FALSE,
  email_enabled BOOLEAN DEFAULT TRUE,
  email_frequency VARCHAR(20) DEFAULT 'daily', -- immediate, daily, weekly, never
  do_not_disturb_start TIME,
  do_not_disturb_end TIME,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para optimización
CREATE INDEX idx_notifications_user ON user_notifications(user_id);
CREATE INDEX idx_notifications_unread ON user_notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_notifications_type ON user_notifications(type);
CREATE INDEX idx_notifications_created ON user_notifications(created_at DESC);
```

#### 8.1.2 Backend (API)

**Estructura de Servicios:**

```
src/services/notifications/
├── notification.service.ts      # Servicio principal
├── notification-factory.ts     # Factory para crear notificaciones
├── channels/
│   ├── in-app.channel.ts        # Canal in-app
│   ├── push.channel.ts          # Canal push
│   └── email.channel.ts         # Canal email
└── handlers/
    ├── course.handler.ts        # Notificaciones de cursos
    ├── community.handler.ts     # Notificaciones de comunidades
    ├── zoom.handler.ts          # Notificaciones de Zoom
    └── system.handler.ts        # Notificaciones del sistema
```

**Ejemplo de Servicio:**

```typescript
// notification.service.ts
class NotificationService {
  async createNotification(params: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    metadata?: Record<string, any>;
    priority?: 'high' | 'medium' | 'low';
  }): Promise<Notification> {
    // 1. Verificar preferencias del usuario
    // 2. Crear notificación en BD
    // 3. Enviar por canales configurados
    // 4. Retornar notificación creada
  }
}
```

#### 8.1.3 Frontend

**Componentes:**

```
src/features/notifications/
├── components/
│   ├── NotificationCenter.tsx    # Centro de notificaciones
│   ├── NotificationBell.tsx     # Campana con badge
│   ├── NotificationItem.tsx      # Item individual
│   └── NotificationSettings.tsx # Configuración
├── hooks/
│   ├── useNotifications.ts       # Hook para cargar notificaciones
│   └── useNotificationSocket.ts # Hook para WebSocket
└── services/
    └── notification.api.ts      # API calls
```

### 8.2 Flujo de Implementación

#### Fase 1: Infraestructura Base (Semanas 1-2)
1. ✅ Crear tablas en BD
2. ✅ Crear servicios base
3. ✅ API endpoints básicos
4. ✅ Componente de notificaciones in-app
5. ✅ Centro de notificaciones básico

#### Fase 2: Notificaciones Críticas (Semanas 3-4)
1. ✅ Implementar handlers para:
   - Cursos completados
   - Certificados generados
   - Solicitudes de comunidad aprobadas
   - Respuestas a comentarios
   - Sesiones de Zoom

#### Fase 3: Canales Adicionales (Semanas 5-6)
1. ✅ Push notifications (Service Worker)
2. ✅ Email notifications (templates y envío)
3. ✅ WebSocket para tiempo real

#### Fase 4: Configuración y Refinamiento (Semanas 7-8)
1. ✅ Panel de configuración de preferencias
2. ✅ Agrupación de notificaciones
3. ✅ Resúmenes por email
4. ✅ Filtros y búsqueda

### 8.3 Métricas de Éxito

**KPIs a Medir:**
- Tasa de apertura de notificaciones
- Tiempo promedio de lectura
- Conversión (acción tomada después de notificación)
- Tasa de desactivación de notificaciones
- Satisfacción del usuario (survey)

**Objetivos:**
- 70%+ de notificaciones leídas en 24h
- < 5% de usuarios desactivan todas las notificaciones
- 80%+ de satisfacción con el sistema

---

## 9. Consideraciones Especiales

### 9.1 Privacidad

- ✅ No exponer información sensible en notificaciones
- ✅ Respetar preferencias de privacidad del usuario
- ✅ Permitir desactivar notificaciones sociales

### 9.2 Performance

- ✅ Agrupar notificaciones similares
- ✅ Límite de notificaciones activas (máximo 50)
- ✅ Limpieza automática después de 30 días
- ✅ Paginación en el centro de notificaciones

### 9.3 Accesibilidad

- ✅ Screen reader support
- ✅ Contraste adecuado
- ✅ Textos descriptivos
- ✅ Navegación por teclado

### 9.4 Internacionalización

- ✅ Soporte multi-idioma
- ✅ Formato de fecha/hora localizado
- ✅ Traducción de templates de email

---

## 10. Conclusiones

### 10.1 Resumen General

Se identificaron un total de **112 tipos de notificaciones** para la plataforma:

- **29 notificaciones para usuarios normales**
  - 10 críticas (Fase 1)
  - 9 importantes (Fase 2)
  - 10 informativas (Fase 3)

- **26 notificaciones para administradores**
  - 8 críticas (Fase 1)
  - 9 importantes (Fase 2)
  - 9 informativas (Fase 3)

- **23 notificaciones para instructores**
  - 7 críticas (Fase 1)
  - 8 importantes (Fase 2)
  - 8 informativas (Fase 3)

- **34 notificaciones para usuarios del Business Panel**
  - 11 críticas (Fase 1)
  - 11 importantes (Fase 2)
  - 12 informativas (Fase 3)

### 10.2 Próximos Pasos

1. ✅ Revisar y aprobar este análisis completo
2. ✅ Priorizar con stakeholders
3. ✅ Crear tickets de implementación
4. ✅ Iniciar Fase 1 (MVP) - 36 notificaciones críticas

### 10.3 Documentos Relacionados

- **[NOTIFICACIONES_USUARIOS_NORMALES.md](./NOTIFICACIONES_USUARIOS_NORMALES.md)** - Detalles completos de notificaciones para estudiantes
- **[NOTIFICACIONES_ADMINISTRADORES.md](./NOTIFICACIONES_ADMINISTRADORES.md)** - Detalles completos de notificaciones para administradores
- **[NOTIFICACIONES_INSTRUCTORES.md](./NOTIFICACIONES_INSTRUCTORES.md)** - Detalles completos de notificaciones para instructores
- **[NOTIFICACIONES_BUSINESS_PANEL.md](./NOTIFICACIONES_BUSINESS_PANEL.md)** - Detalles completos de notificaciones para usuarios del Business Panel

### 10.4 Notas Finales

- Estos documentos deben actualizarse cuando se agreguen nuevos módulos
- Las preferencias de usuario son críticas para evitar spam
- El feedback de usuarios y administradores es esencial para refinar el sistema
- Considerar A/B testing para optimizar timing y contenido

---

**Documento creado:** Diciembre 2024  
**Última actualización:** Diciembre 2024  
**Versión:** 1.0  
**Estado:** ✅ Completo y listo para revisión

