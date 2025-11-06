# 💼 Notificaciones para Business Panel
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
7. [Configuración de Business Panel](#7-configuración-de-business-panel)

---

## 1. Introducción

### 1.1 Objetivo

Este documento identifica y categoriza todas las notificaciones que deben aparecer para **usuarios del Business Panel** (administradores de organizaciones/empresas) dentro de la plataforma "Aprende y Aplica", considerando todas las funciones y responsabilidades del rol empresarial.

### 1.2 Alcance

- ✅ Usuarios del Business Panel (administradores de organizaciones)
- ✅ Todas las funciones del panel empresarial
- ✅ Eventos relacionados con gestión de equipos
- ✅ Eventos relacionados con suscripciones y planes
- ✅ Métricas y reportes empresariales

### 1.3 Responsabilidades de Business Panel

Basado en el análisis del sistema, los usuarios del Business Panel tienen las siguientes responsabilidades:

1. **Gestión de Usuarios**
   - Agregar/eliminar usuarios de la organización
   - Invitar usuarios por email
   - Gestionar roles dentro de la organización
   - Suspender/activar usuarios
   - Crear y gestionar grupos de usuarios

2. **Gestión de Cursos**
   - Asignar cursos a usuarios o grupos
   - Ver progreso de usuarios en cursos
   - Configurar fechas límite de cursos
   - Ver reportes de cursos

3. **Suscripciones y Planes**
   - Gestionar suscripciones (Team, Business, Enterprise)
   - Cambiar de plan
   - Renovar suscripciones
   - Ver facturación

4. **Analytics y Reportes**
   - Ver estadísticas del equipo
   - Ver progreso general
   - Ver Skills Insights
   - Ver reportes de certificados

5. **Configuración**
   - Branding corporativo
   - Certificados personalizados
   - Notificaciones automáticas
   - Dashboard personalizable

---

## 2. Metodología de Análisis

### 2.1 Módulos Analizados

Se analizaron los siguientes módulos del sistema de Business Panel:

1. **Gestión de Usuarios**
   - Nuevos usuarios agregados
   - Usuarios invitados
   - Cambios de rol
   - Suspensión/activación

2. **Gestión de Cursos**
   - Cursos asignados
   - Progreso de usuarios
   - Cursos completados
   - Fechas límite próximas
   - Certificados generados

3. **Suscripciones**
   - Cambios de plan
   - Renovaciones
   - Expiración de suscripción
   - Facturación

4. **Grupos de Usuarios**
   - Nuevos grupos creados
   - Usuarios agregados a grupos
   - Cambios en grupos

5. **Métricas y Reportes**
   - Umbrales de métricas alcanzados
   - Reportes automáticos
   - Logros del equipo

---

## 3. Categorías de Notificaciones

### 3.1 Por Prioridad

#### 🔴 **Crítica (Alta Prioridad)**
Notificaciones que requieren atención inmediata.

- Suscripción próxima a expirar
- Suscripción expirada
- Usuarios agregados/invitados
- Cursos asignados masivamente
- Certificados generados importantes

#### 🟡 **Importante (Media Prioridad)**
Notificaciones que requieren revisión pero no son urgentes.

- Usuarios que completan cursos
- Progreso de usuarios
- Fechas límite próximas
- Cambios de plan
- Reportes semanales

#### 🟢 **Informativa (Baja Prioridad)**
Notificaciones informativas sobre actividad.

- Nuevos grupos creados
- Usuarios agregados a grupos
- Métricas normales
- Resúmenes diarios/semanales

### 3.2 Por Tipo de Evento

#### 👥 **Usuarios**
Relacionadas con gestión de usuarios del equipo.

#### 📚 **Cursos**
Relacionadas con asignación y progreso de cursos.

#### 💳 **Suscripciones**
Relacionadas con planes y facturación.

#### 👥 **Grupos**
Relacionadas con gestión de grupos de usuarios.

#### 📊 **Métricas**
Relacionadas con analytics y reportes.

---

## 4. Notificaciones por Módulo

### 4.1 👥 Gestión de Usuarios

#### NTB-001: Nuevo Usuario Agregado a la Organización
**Tipo:** Usuarios  
**Prioridad:** Alta  
**Evento:** Un usuario es agregado a la organización

**Contenido:**
- "Nuevo usuario agregado: [Nombre]"
- Email del usuario
- Rol asignado (admin, member)
- Fecha de agregado
- Quien lo agregó (si aplica)
- Enlaces: Ver perfil | Ver usuarios | Asignar cursos

**Canales:** In-app, Email (si hay múltiples usuarios agregados)

**Agrupación:** Resumen diario si hay múltiples usuarios agregados

---

#### NTB-002: Usuario Invitado a la Organización
**Tipo:** Usuarios  
**Prioridad:** Media  
**Evento:** Se envía invitación por email a un usuario

**Contenido:**
- "Invitación enviada a: [Email]"
- Email del invitado
- Rol asignado
- Fecha de invitación
- Estado de invitación (pendiente, aceptada, expirada)
- Enlaces: Ver invitaciones | Reenviar invitación | Cancelar invitación

**Canales:** In-app

**Nota:** Confirmación de que la invitación fue enviada

---

#### NTB-003: Usuario Acepta Invitación
**Tipo:** Usuarios  
**Prioridad:** Media  
**Evento:** Un usuario acepta una invitación a la organización

**Contenido:**
- "✅ [Usuario] aceptó la invitación"
- Nombre del usuario
- Email
- Fecha de aceptación
- Enlaces: Ver perfil | Asignar cursos | Ver usuarios

**Canales:** In-app, Email (si el admin lo configura)

---

#### NTB-004: Usuario Suspende Cuenta
**Tipo:** Usuarios  
**Prioridad:** Alta  
**Evento:** Se suspende la cuenta de un usuario de la organización

**Contenido:**
- "⚠️ Usuario suspendido: [Nombre]"
- Usuario suspendido
- Razón de suspensión
- Administrador que suspendió
- Fecha de suspensión
- Impacto (cursos asignados, grupos, etc.)
- Enlaces: Ver perfil | Ver impacto | Reactivar

**Canales:** In-app, Email

**Nota:** Solo para suspensiones manuales del Business Panel

---

#### NTB-005: Usuario Eliminado de la Organización
**Tipo:** Usuarios  
**Prioridad:** Alta  
**Evento:** Un usuario es eliminado de la organización

**Contenido:**
- "🗑️ Usuario eliminado: [Nombre]"
- Usuario eliminado
- Razón de eliminación (si está disponible)
- Administrador que eliminó
- Fecha de eliminación
- Impacto (cursos asignados liberados, etc.)
- Enlaces: Ver historial | Restaurar (si aplica)

**Canales:** In-app, Email

---

#### NTB-006: Cambio de Rol de Usuario
**Tipo:** Usuarios  
**Prioridad:** Media  
**Evento:** Se cambia el rol de un usuario en la organización

**Contenido:**
- "Cambio de rol: [Usuario]"
- Usuario afectado
- Rol anterior → Rol nuevo
- Administrador que realizó el cambio
- Razón del cambio (si está disponible)
- Fecha y hora
- Enlaces: Ver perfil | Revertir cambio

**Canales:** In-app, Email (si es cambio a admin)

**Nota:** Crítico si se asigna rol de admin

---

### 4.2 📚 Gestión de Cursos

#### NTB-007: Curso Asignado a Usuarios
**Tipo:** Cursos  
**Prioridad:** Media  
**Evento:** Se asigna un curso a usuarios o grupos

**Contenido:**
- "Curso asignado: [Nombre del Curso]"
- Número de usuarios asignados
- Grupo asignado (si aplica)
- Fecha límite (si aplica)
- Mensaje personalizado (si aplica)
- Administrador que asignó
- Enlaces: Ver asignación | Ver curso | Ver usuarios asignados

**Canales:** In-app, Email (si hay muchos usuarios asignados)

**Agrupación:** Resumen si se asignan múltiples cursos en poco tiempo

---

#### NTB-008: Usuario Completa Curso Asignado
**Tipo:** Cursos  
**Prioridad:** Media  
**Evento:** Un usuario completa un curso asignado por la organización

**Contenido:**
- "🎉 [Usuario] completó [Curso]"
- Usuario que completó
- Curso completado
- Calificación obtenida (si aplica)
- Tiempo invertido
- Fecha de completado
- Enlaces: Ver perfil del usuario | Ver progreso | Ver certificado

**Canales:** In-app, Email (resumen semanal)

**Agrupación:** Resumen semanal con todos los completados

---

#### NTB-009: Fecha Límite de Curso Próxima
**Tipo:** Cursos  
**Prioridad:** Alta  
**Evento:** Un curso asignado tiene fecha límite próxima (configurable, ej: 7 días antes)

**Contenido:**
- "⏰ Fecha límite próxima: [Curso]"
- Curso con fecha límite
- Fecha límite
- Usuarios afectados
- Progreso actual de usuarios afectados
- Usuarios en riesgo (bajo progreso)
- Enlaces: Ver asignación | Ver usuarios | Extender fecha límite

**Canales:** In-app, Push, Email

**Umbral:** 7 días antes de fecha límite (configurable)

---

#### NTB-010: Fecha Límite de Curso Vencida
**Tipo:** Cursos  
**Prioridad:** Alta  
**Evento:** Se vence la fecha límite de un curso asignado

**Contenido:**
- "⚠️ Fecha límite vencida: [Curso]"
- Curso con fecha límite vencida
- Fecha límite vencida
- Usuarios que no completaron
- Progreso de usuarios no completados
- Acciones sugeridas (extender fecha, marcar como completado, etc.)
- Enlaces: Ver asignación | Gestionar | Ver usuarios afectados

**Canales:** In-app, Push, Email

---

#### NTB-011: Progreso de Usuario Alcanza Milestone
**Tipo:** Cursos  
**Prioridad:** Media  
**Evento:** Un usuario alcanza un hito importante en un curso asignado (ej: 25%, 50%, 75%)

**Contenido:**
- "📊 Hito alcanzado: [Usuario] - [Curso]"
- Usuario que alcanzó el hito
- Curso
- Progreso alcanzado (ej: 50%)
- Fecha del hito
- Enlaces: Ver progreso | Ver curso

**Canales:** In-app

**Agrupación:** Resumen diario con todos los hitos alcanzados

**Configuración:** Instructor puede configurar qué hitos notificar

---

#### NTB-012: Bajo Progreso en Curso Asignado
**Tipo:** Cursos  
**Prioridad:** Media  
**Evento:** Múltiples usuarios tienen bajo progreso en un curso asignado

**Contenido:**
- "⚠️ Bajo progreso detectado: [Curso]"
- Curso afectado
- Número de usuarios con bajo progreso
- Usuarios afectados (lista)
- Progreso promedio
- Tiempo desde asignación
- Sugerencias (enviar recordatorio, extender fecha límite)
- Enlaces: Ver curso | Ver usuarios | Enviar recordatorio

**Canales:** In-app, Email (si es significativo)

**Umbral:** 5+ usuarios con menos del 30% de progreso después de 2 semanas

---

#### NTB-013: Certificado Generado para Usuario
**Tipo:** Cursos  
**Prioridad:** Media  
**Evento:** Se genera un certificado para un usuario de la organización

**Contenido:**
- "🎓 Certificado generado: [Usuario] - [Curso]"
- Usuario que obtuvo el certificado
- Curso completado
- Fecha de emisión
- Template usado (si aplica)
- Enlaces: Ver certificado | Ver perfil del usuario | Ver todos los certificados

**Canales:** In-app, Email (resumen semanal)

**Agrupación:** Resumen semanal con todos los certificados generados

---

#### NTB-014: Múltiples Usuarios Completaron Curso
**Tipo:** Cursos  
**Prioridad:** Media  
**Evento:** Múltiples usuarios completan el mismo curso asignado

**Contenido:**
- "🎉 [N] usuarios completaron [Curso]"
- Número de usuarios que completaron
- Curso completado
- Lista de usuarios que completaron
- Fecha de completado
- Tasa de completación del curso
- Enlaces: Ver curso | Ver usuarios | Ver reporte

**Canales:** In-app, Email (resumen semanal)

**Umbral:** 5+ usuarios completan el mismo curso en poco tiempo

---

### 4.3 💳 Suscripciones y Planes

#### NTB-015: Suscripción Próxima a Expirar
**Tipo:** Suscripción  
**Prioridad:** Crítica  
**Evento:** La suscripción de la organización está próxima a expirar

**Contenido:**
- "⚠️ Suscripción próxima a expirar: [Plan]"
- Plan actual
- Fecha de expiración
- Días restantes
- Próxima fecha de facturación
- Monto a facturar
- Enlaces: Renovar | Cambiar de plan | Ver facturación

**Canales:** In-app, Push, Email (siempre)

**Umbrales de Recordatorio:**
- 30 días antes
- 14 días antes
- 7 días antes
- 3 días antes
- 1 día antes

---

#### NTB-016: Suscripción Expirada
**Tipo:** Suscripción  
**Prioridad:** Crítica  
**Evento:** La suscripción de la organización ha expirado

**Contenido:**
- "🚨 Suscripción expirada: [Plan]"
- Plan expirado
- Fecha de expiración
- Impacto (servicios afectados, acceso limitado)
- Acciones requeridas (renovar, cambiar de plan)
- Enlaces: Renovar ahora | Cambiar de plan | Ver facturación | Contactar soporte

**Canales:** In-app, Push, Email (siempre, múltiples recordatorios)

**Frecuencia:** Recordatorio diario hasta renovar

---

#### NTB-017: Cambio de Plan de Suscripción
**Tipo:** Suscripción  
**Prioridad:** Alta  
**Evento:** Se cambia el plan de suscripción de la organización

**Contenido:**
- "Plan cambiado: [Plan Anterior] → [Plan Nuevo]"
- Plan anterior y nuevo
- Cambios en características/beneficios
- Cambios en límites (usuarios, cursos, etc.)
- Fecha efectiva del cambio
- Próxima fecha de facturación
- Nuevo monto mensual/anual
- Enlaces: Ver plan actual | Ver facturación | Configurar características

**Canales:** In-app, Push, Email (siempre)

---

#### NTB-018: Renovación de Suscripción
**Tipo:** Suscripción  
**Prioridad:** Alta  
**Evento:** La suscripción se renueva automáticamente o manualmente

**Contenido:**
- "✅ Suscripción renovada: [Plan]"
- Plan renovado
- Período renovado (mensual/anual)
- Fecha de renovación
- Nueva fecha de expiración
- Monto facturado
- Enlaces: Ver factura | Ver suscripción | Ver historial

**Canales:** In-app, Email

---

#### NTB-019: Cancelación de Suscripción
**Tipo:** Suscripción  
**Prioridad:** Crítica  
**Evento:** Se cancela la suscripción de la organización

**Contenido:**
- "🚨 Suscripción cancelada: [Plan]"
- Plan cancelado
- Fecha de cancelación
- Fecha efectiva de cancelación
- Servicios que se perderán
- Acceso hasta fecha efectiva
- Opciones para reactivar
- Enlaces: Reactivar | Ver impacto | Contactar soporte

**Canales:** In-app, Push, Email (siempre)

---

#### NTB-020: Facturación de Suscripción
**Tipo:** Suscripción  
**Prioridad:** Media  
**Evento:** Se genera una factura por la suscripción

**Contenido:**
- "📄 Nueva factura: [Plan]"
- Plan facturado
- Monto facturado
- Período facturado
- Fecha de factura
- Estado del pago (procesado, pendiente, fallido)
- Enlaces: Ver factura | Descargar PDF | Ver historial de facturación

**Canales:** In-app, Email (siempre)

---

#### NTB-021: Pago de Suscripción Fallido
**Tipo:** Suscripción  
**Prioridad:** Crítica  
**Evento:** El pago de la suscripción falla (tarjeta vencida, fondos insuficientes, etc.)

**Contenido:**
- "⚠️ Pago fallido: [Plan]"
- Plan afectado
- Razón del fallo (si está disponible)
- Fecha del intento
- Acción requerida (actualizar método de pago)
- Riesgo de expiración de suscripción
- Enlaces: Actualizar método de pago | Ver factura | Contactar soporte

**Canales:** In-app, Push, Email (siempre)

---

#### NTB-022: Próxima Facturación
**Tipo:** Suscripción  
**Prioridad:** Media  
**Evento:** Próxima fecha de facturación próxima (recordatorio)

**Contenido:**
- "📅 Próxima facturación: [Plan]"
- Plan a facturar
- Fecha de próxima facturación
- Monto a facturar
- Método de pago actual
- Enlaces: Ver detalles | Actualizar método de pago | Ver historial

**Canales:** In-app, Email (solo si es primera facturación o cambio de método)

**Umbral:** 7 días antes de la facturación

---

### 4.4 👥 Grupos de Usuarios

#### NTB-023: Nuevo Grupo de Usuarios Creado
**Tipo:** Grupos  
**Prioridad:** Baja  
**Evento:** Se crea un nuevo grupo de usuarios

**Contenido:**
- "Nuevo grupo creado: [Nombre]"
- Nombre del grupo
- Descripción (si está disponible)
- Administrador que creó el grupo
- Fecha de creación
- Enlaces: Ver grupo | Gestionar grupo | Asignar cursos

**Canales:** In-app

---

#### NTB-024: Usuario Agregado a Grupo
**Tipo:** Grupos  
**Prioridad:** Baja  
**Evento:** Un usuario es agregado a un grupo

**Contenido:**
- "[Usuario] agregado a [Grupo]"
- Usuario agregado
- Grupo al que fue agregado
- Administrador que agregó
- Fecha de agregado
- Total de miembros en el grupo ahora
- Enlaces: Ver grupo | Ver perfil del usuario

**Canales:** In-app

**Agrupación:** Resumen si se agregan múltiples usuarios al mismo grupo

---

#### NTB-025: Usuario Eliminado de Grupo
**Tipo:** Grupos  
**Prioridad:** Baja  
**Evento:** Un usuario es eliminado de un grupo

**Contenido:**
- "[Usuario] eliminado de [Grupo]"
- Usuario eliminado
- Grupo del que fue eliminado
- Administrador que eliminó
- Fecha de eliminación
- Total de miembros en el grupo ahora
- Enlaces: Ver grupo | Ver historial

**Canales:** In-app (opcional, solo para auditoría)

---

#### NTB-026: Curso Asignado a Grupo
**Tipo:** Grupos  
**Prioridad:** Media  
**Evento:** Se asigna un curso a un grupo de usuarios

**Contenido:**
- "Curso asignado a grupo: [Grupo] - [Curso]"
- Grupo asignado
- Curso asignado
- Número de miembros del grupo
- Fecha límite (si aplica)
- Administrador que asignó
- Enlaces: Ver grupo | Ver curso | Ver progreso del grupo

**Canales:** In-app, Email (si el grupo tiene muchos miembros)

---

### 4.5 📊 Métricas y Reportes

#### NTB-027: Umbral de Métrica Alcanzado
**Tipo:** Métricas  
**Prioridad:** Media  
**Evento:** Una métrica importante alcanza un umbral configurado

**Contenido:**
- "📊 Umbral alcanzado: [Métrica]"
- Nombre de la métrica
- Valor actual vs umbral
- Tendencia (aumentando/decreciendo)
- Impacto
- Enlaces: Ver dashboard | Ver reporte completo | Configurar umbrales

**Canales:** In-app

**Ejemplos de Métricas:**
- 100 usuarios completaron cursos este mes
- 80% de tasa de completación alcanzada
- 50 certificados generados este mes
- 1000 horas de aprendizaje acumuladas

---

#### NTB-028: Reporte Semanal de Equipo
**Tipo:** Métricas  
**Prioridad:** Baja  
**Evento:** Resumen semanal automático de actividad del equipo

**Contenido:**
- "📊 Reporte semanal del equipo"
- Nuevos usuarios agregados
- Cursos asignados
- Cursos completados
- Progreso promedio
- Certificados generados
- Habilidades desarrolladas
- Métricas clave
- Gráficos y visualizaciones (preview)
- Enlaces: Ver reporte completo | Dashboard | Ver analytics

**Canales:** Email (solo email, una vez por semana)

**Horario:** Lunes 8:00 AM hora local

---

#### NTB-029: Reporte Mensual de Equipo
**Tipo:** Métricas  
**Prioridad:** Baja  
**Evento:** Resumen mensual automático de actividad del equipo

**Contenido:**
- "📊 Reporte mensual del equipo"
- Resumen ejecutivo
- Nuevos usuarios agregados
- Cursos asignados y completados
- Progreso promedio del equipo
- Certificados generados
- Habilidades desarrolladas
- Gaps de conocimiento identificados
- Tendencias y comparativas
- Gráficos y visualizaciones
- Recomendaciones
- Enlaces: Ver reporte completo | Dashboard | Ver analytics

**Canales:** Email (solo email, una vez por mes)

**Horario:** Primer día del mes a las 8:00 AM hora local

---

#### NTB-030: Logro de Equipo Alcanzado
**Tipo:** Métricas  
**Prioridad:** Baja  
**Evento:** El equipo alcanza un milestone importante

**Contenido:**
- "🎯 Logro del equipo alcanzado: [Descripción]"
- Logro específico
- Métricas relevantes
- Usuarios involucrados
- Mensaje de felicitación
- Enlaces: Ver logros | Compartir logro | Ver estadísticas

**Canales:** In-app, Email (solo para logros importantes)

**Ejemplos:**
- Primeros 100 usuarios completan cursos
- 1000 horas de aprendizaje acumuladas
- 50 certificados generados
- 80% de tasa de completación

---

#### NTB-031: Bajo Rendimiento del Equipo
**Tipo:** Métricas  
**Prioridad:** Media  
**Evento:** El rendimiento general del equipo está por debajo de lo esperado

**Contenido:**
- "⚠️ Bajo rendimiento detectado en el equipo"
- Métricas afectadas
- Comparativa con período anterior
- Usuarios con bajo rendimiento
- Cursos con bajo progreso
- Sugerencias de acción
- Enlaces: Ver analytics | Ver reporte | Contactar soporte

**Canales:** In-app, Email (si es significativo)

**Umbral:** Múltiples métricas por debajo del 50% del promedio histórico

---

### 4.6 🔔 Sistema y Configuración

#### NTB-032: Cambio en Configuración de Organización
**Tipo:** Sistema  
**Prioridad:** Media  
**Evento:** Se modifica configuración importante de la organización

**Contenido:**
- "Configuración modificada: [Tipo]"
- Tipo de configuración (branding, notificaciones, certificados, etc.)
- Cambios realizados
- Administrador que realizó el cambio
- Fecha y hora
- Enlaces: Ver cambios | Revertir cambios

**Canales:** In-app, Email (si es cambio importante)

---

#### NTB-033: Límite de Usuarios Alcanzado
**Tipo:** Sistema  
**Prioridad:** Alta  
**Evento:** Se alcanza el límite de usuarios del plan actual

**Contenido:**
- "⚠️ Límite de usuarios alcanzado: [Plan]"
- Plan actual
- Límite de usuarios del plan
- Usuarios actuales vs límite
- Impacto (no se pueden agregar más usuarios)
- Opciones (upgrade de plan, eliminar usuarios)
- Enlaces: Ver planes | Upgrade | Gestionar usuarios

**Canales:** In-app, Push, Email

**Umbral:** 90%+ del límite alcanzado

---

#### NTB-034: Límite de Cursos Asignados Alcanzado
**Tipo:** Sistema  
**Prioridad:** Media  
**Evento:** Se alcanza el límite de cursos asignados del plan actual

**Contenido:**
- "⚠️ Límite de cursos asignados alcanzado: [Plan]"
- Plan actual
- Límite de asignaciones del plan
- Asignaciones actuales vs límite
- Impacto (no se pueden asignar más cursos)
- Opciones (upgrade de plan, eliminar asignaciones)
- Enlaces: Ver planes | Upgrade | Ver asignaciones

**Canales:** In-app, Email

**Umbral:** 90%+ del límite alcanzado

---

---

## 5. Priorización

### 5.1 Matriz de Priorización

| Notificación | Prioridad | Acción Requerida | Frecuencia | Impacto |
|--------------|-----------|------------------|------------|---------|
| NTB-015 | Crítica | Renovar suscripción | Ocasional | Crítico |
| NTB-016 | Crítica | Renovar suscripción | Rara | Crítico |
| NTB-019 | Crítica | Revisar cancelación | Rara | Crítico |
| NTB-021 | Crítica | Actualizar pago | Urgente | Crítico |
| NTB-033 | Alta | Upgrade plan | Ocasional | Alto |
| NTB-009 | Alta | Revisar fechas límite | Frecuente | Alto |
| NTB-010 | Alta | Gestionar fechas vencidas | Ocasional | Alto |

### 5.2 Fase 1 - MVP (Must Have)

**Implementación Inmediata:**
- ✅ NTB-001: Nuevo usuario agregado
- ✅ NTB-007: Curso asignado
- ✅ NTB-008: Usuario completa curso
- ✅ NTB-009: Fecha límite próxima
- ✅ NTB-010: Fecha límite vencida
- ✅ NTB-015: Suscripción próxima a expirar
- ✅ NTB-016: Suscripción expirada
- ✅ NTB-017: Cambio de plan
- ✅ NTB-019: Cancelación de suscripción
- ✅ NTB-021: Pago fallido
- ✅ NTB-033: Límite de usuarios alcanzado

**Total Fase 1:** 11 notificaciones críticas

### 5.3 Fase 2 - Expansión (Should Have)

**Siguiente Iteración:**
- ✅ NTB-003: Usuario acepta invitación
- ✅ NTB-004: Usuario suspendido
- ✅ NTB-006: Cambio de rol
- ✅ NTB-011: Progreso alcanza milestone
- ✅ NTB-012: Bajo progreso detectado
- ✅ NTB-013: Certificado generado
- ✅ NTB-018: Renovación de suscripción
- ✅ NTB-020: Facturación de suscripción
- ✅ NTB-026: Curso asignado a grupo
- ✅ NTB-027: Umbral de métrica alcanzado
- ✅ NTB-034: Límite de cursos alcanzado

**Total Fase 2:** 11 notificaciones adicionales

### 5.4 Fase 3 - Optimización (Nice to Have)

**Mejoras y Refinamiento:**
- ✅ NTB-002: Usuario invitado
- ✅ NTB-005: Usuario eliminado
- ✅ NTB-014: Múltiples usuarios completaron curso
- ✅ NTB-022: Próxima facturación
- ✅ NTB-023: Nuevo grupo creado
- ✅ NTB-024: Usuario agregado a grupo
- ✅ NTB-025: Usuario eliminado de grupo
- ✅ NTB-028: Reporte semanal
- ✅ NTB-029: Reporte mensual
- ✅ NTB-030: Logro de equipo
- ✅ NTB-031: Bajo rendimiento del equipo
- ✅ NTB-032: Cambio en configuración

**Total Fase 3:** 12 notificaciones adicionales

**Total General:** 34 notificaciones identificadas

---

## 6. Canales de Notificación

### 6.1 Canales Disponibles por Plan

Según la documentación del sistema, los canales varían según el plan:

#### Plan Team
- **Email:** ✅ Únicamente
- **In-App:** ✅ Siempre activo
- **Push:** ❌ No disponible

#### Plan Business
- **Email:** ✅ Disponible
- **In-App:** ✅ Siempre activo
- **Push:** ✅ Disponible

#### Plan Enterprise
- **Email:** ✅ Disponible
- **In-App:** ✅ Siempre activo
- **Push:** ✅ Disponible
- **SMS:** ✅ Disponible (futuro)

### 6.2 Matriz de Canales por Prioridad

| Prioridad | In-App | Push | Email | SMS (Enterprise) |
|-----------|--------|------|-------|------------------|
| Crítica | ✅ | ✅ | ✅ | ✅ |
| Alta | ✅ | ✅ | ✅ | ⚠️ |
| Media | ✅ | ⚠️ | ⚠️ | ❌ |
| Baja | ✅ | ❌ | ❌ | ❌ |

**Leyenda:**
- ✅ Siempre incluido (según plan)
- ⚠️ Opcional/configurable
- ❌ No incluido

---

## 7. Configuración de Business Panel

### 7.1 Preferencias Granulares

Cada organización debe poder configurar:

1. **Por Tipo de Notificación:**
   - Activar/desactivar cada tipo
   - Seleccionar canales preferidos (según plan)
   - Configurar umbrales (ej: días antes de fecha límite)

2. **Por Canal (según plan):**
   - In-app: Siempre activo
   - Push: Solo críticas o todas (Plan Business+)
   - Email: Frecuencia (inmediato, diario, semanal, nunca)
   - SMS: Solo críticas (Plan Enterprise, futuro)

3. **Por Administrador:**
   - Administradores de la organización pueden tener preferencias individuales
   - Notificaciones enviadas a todos los admins o solo al que realizó la acción

4. **Agrupación:**
   - Notificaciones individuales vs resúmenes
   - Frecuencia de resúmenes por email
   - Umbrales para agrupar

### 7.2 Configuración por Defecto

**Organizaciones Nuevas:**
- ✅ In-app: Todas activadas
- ✅ Push: Solo críticas (si plan lo permite)
- ✅ Email: Críticas inmediato + Resumen semanal

**Notificaciones Siempre Activas (No Desactivables):**
- Suscripción expirada/próxima a expirar
- Pago fallido
- Cancelación de suscripción
- Límites alcanzados (usuarios, cursos)

### 7.3 Notificaciones Configurables (Según Implementación)

Según el documento de implementación, el Business Panel ya tiene un sistema de notificaciones configurables con los siguientes eventos:

1. **Curso asignado** (`course_assigned`)
2. **Curso completado** (`course_completed`)
3. **Usuario agregado** (`user_added`)
4. **Hito de progreso** (`progress_milestone`)
5. **Certificado generado** (`certificate_generated`)
6. **Fecha límite próxima** (`deadline_approaching`)

**Nota:** Estos eventos ya están documentados en el sistema. Las notificaciones propuestas aquí extienden y complementan estos eventos.

---

## 8. Consideraciones Especiales

### 8.1 Roles en Organización

**Notificaciones por Rol:**
- **Owner/Admin:** Reciben todas las notificaciones
- **Miembros con permisos:** Pueden recibir notificaciones relevantes (configurable)
- **Usuarios normales:** No reciben notificaciones del Business Panel

### 8.2 Agrupación Inteligente

- Agrupar notificaciones similares del mismo curso/usuario
- Resúmenes diarios/semanales para notificaciones de progreso
- Resúmenes mensuales para métricas y reportes
- Notificaciones críticas nunca se agrupan

### 8.3 Notificaciones Multi-Administrador

**Distribución de Notificaciones:**
- Notificaciones críticas: Todos los admins
- Notificaciones de acción: Admin que realizó la acción + otros admins (si está configurado)
- Notificaciones informativas: Solo el admin que las solicita (configurable)

---

## 9. Integración con Panel de Business

### 9.1 Componentes UI

**Campana de Notificaciones:**
- Badge con contador de no leídas
- Dropdown con últimas notificaciones
- Link al centro completo

**Centro de Notificaciones:**
- Página dedicada en `/business-panel/notifications`
- Filtros avanzados (por tipo, fecha, usuario, curso)
- Acciones rápidas desde notificación
- Vista de historial

**Dashboard:**
- Widget de notificaciones pendientes
- Alertas críticas destacadas (suscripciones, pagos)
- Métricas de notificaciones

### 9.2 Acciones Rápidas

Desde las notificaciones, los administradores deben poder:

- Asignar cursos directamente
- Ver progreso de usuarios
- Renovar suscripciones
- Actualizar método de pago
- Gestionar usuarios
- Ver reportes relevantes

---

## 10. Conclusiones

### 10.1 Resumen

Se identificaron **34 tipos de notificaciones** para usuarios del Business Panel, organizadas en:

- **11 notificaciones críticas (Fase 1)**
- **11 notificaciones importantes (Fase 2)**
- **12 notificaciones informativas (Fase 3)**

### 10.2 Diferencias con Otros Roles

**Notificaciones de Business Panel:**
- Más enfocadas en gestión de equipos y suscripciones
- Métricas y reportes empresariales
- Notificaciones de facturación y pagos
- Menos notificaciones de moderación que administradores
- Menos notificaciones educativas que instructores

### 10.3 Relación con Sistema Existente

El Business Panel ya tiene un sistema de notificaciones configurables implementado con 6 eventos básicos. Este análisis extiende y complementa ese sistema con notificaciones adicionales para mejorar la experiencia del usuario empresarial.

### 10.4 Próximos Pasos

1. ✅ Revisar y aprobar este análisis
2. ✅ Integrar con sistema de notificaciones existente
3. ✅ Priorizar con stakeholders
4. ✅ Crear tickets de implementación
5. ✅ Iniciar Fase 1 (MVP)

---

**Documento creado:** Diciembre 2024  
**Última actualización:** Diciembre 2024  
**Versión:** 1.0  
**Estado:** ✅ Completo y listo para revisión

