# PRD 04 - Reglas de Negocio - Chat-Bot-LIA

## 4. Reglas de Negocio del Sistema

Este documento detalla las 85 reglas de negocio del sistema Chat-Bot-LIA. Estas reglas definen las políticas, restricciones y lógica de negocio que rigen el comportamiento del sistema.

---

## 4.1 Identidad y Autenticación (8 reglas)

### RN-001: Unicidad de Username y Email
**Descripción**: Los campos `username` y `email` deben ser únicos globalmente en el sistema.

**Regla**:
- Rechazo automático de duplicados en registro
- Validación case-insensitive para email
- Validación case-sensitive para username
- Mensaje de error específico al usuario

**Impacto**: Previene confusión de identidades y garantiza unicidad de cuentas.

**Excepciones**: Ninguna. La unicidad es absoluta.

---

### RN-002: Requisitos de Contraseña
**Descripción**: Las contraseñas deben cumplir requisitos mínimos de seguridad.

**Regla**:
- Mínimo 8 caracteres
- Al menos 1 letra mayúscula
- Al menos 1 letra minúscula
- Al menos 1 número
- Caracteres especiales recomendados pero no obligatorios

**Impacto**: Mejora la seguridad de cuentas de usuario.

**Excepciones**: Usuarios con OAuth pueden no tener contraseña local.

---

### RN-003: Headers Obligatorios para Autenticación
**Descripción**: Las sesiones autenticadas requieren headers `Authorization: Bearer <token>` y `x-user-id` obligatorios.

**Regla**:
- Header Authorization con formato Bearer
- Header x-user-id con ID de usuario
- Ambos headers deben estar presentes
- Validación en cada request autenticado

**Impacto**: Garantiza autenticación consistente en toda la API.

**Excepciones**: Endpoints públicos no requieren estos headers.

**Referencias**: `server.js:468-495`

---

### RN-004: Validación de Fingerprint
**Descripción**: El fingerprint de dispositivo debe coincidir exactamente para acceso autorizado.

**Regla**:
- Fingerprint generado en login
- Almacenado en JWT
- Validado en cada request
- Rechazo automático si no coincide

**Impacto**: Previene robo de sesiones y uso no autorizado de tokens.

**Excepciones**: Ninguna. La validación es estricta.

---

### RN-005: Renovación Automática de TTL
**Descripción**: El TTL de sesión se renueva automáticamente por actividad con máximo de 7 días.

**Regla**:
- TTL inicial: 24 horas
- Renovación en cada request válido
- TTL máximo: 7 días
- Expiración forzada tras 7 días sin importar actividad

**Impacto**: Balance entre seguridad y conveniencia de usuario.

**Excepciones**: Usuarios pueden cerrar sesión manualmente antes.

---

### RN-006: Límite de Sesiones Concurrentes
**Descripción**: Máximo 3 sesiones concurrentes permitidas por usuario.

**Regla**:
- Tracking de sesiones activas
- Cierre automático de sesión más antigua al exceder límite
- Notificación al usuario de sesiones activas
- Opción de cerrar sesiones remotas

**Impacto**: Previene compartir cuentas y uso no autorizado.

**Excepciones**: Administradores pueden tener límite mayor.

---

### RN-007: Bloqueo Temporal por Intentos Fallidos
**Descripción**: Bloqueo temporal de cuenta tras 5 intentos fallidos de login en 15 minutos.

**Regla**:
- Contador por usuario y por IP
- Bloqueo de 15 minutos tras 5 intentos
- Notificación por email de bloqueo
- Reset de contador tras login exitoso

**Impacto**: Protección contra ataques de fuerza bruta.

**Excepciones**: Administradores pueden desbloquear manualmente.

---

### RN-008: Verificación de Email Obligatoria
**Descripción**: Verificación de email es obligatoria para acceso a funcionalidades completas del sistema.

**Regla**:
- Acceso limitado sin verificación
- Email de verificación enviado en registro
- Reenvío disponible cada 60 segundos
- Funcionalidad completa tras verificación

**Impacto**: Garantiza validez de emails y reduce spam/bots.

**Excepciones**: Usuarios con OAuth tienen email pre-verificado.

---

## 4.2 Gestión de Perfiles (7 reglas)

### RN-009: Un Perfil Único por Usuario
**Descripción**: Cada usuario tiene exactamente un perfil con datos básicos obligatorios (nombre, email).

**Regla**:
- Creación automática de perfil en registro
- Nombre y email obligatorios
- Otros campos opcionales
- No se permite múltiples perfiles por usuario

**Impacto**: Simplifica gestión de identidad y datos de usuario.

**Excepciones**: Ninguna.

---

### RN-010: Límites de Avatar
**Descripción**: Avatar debe cumplir límites de tamaño y formato.

**Regla**:
- Tamaño máximo: 5MB
- Formatos permitidos: JPG, PNG, GIF únicamente
- Validación de MIME type
- Redimensionamiento automático a 200x200px

**Impacto**: Optimiza almacenamiento y rendimiento.

**Excepciones**: Ninguna.

---

### RN-011: Identificación Flexible de Usuario
**Descripción**: Usuario puede ser identificado por `user_id`, `username` o `email` para actualizaciones.

**Regla**:
- Búsqueda por cualquiera de los tres campos
- Validación de existencia
- Actualización del registro correcto
- Logs de auditoría por identificador usado

**Impacto**: Flexibilidad en APIs y operaciones administrativas.

**Excepciones**: Operaciones críticas requieren user_id específicamente.

---

### RN-012: Retención de Historial de Cambios
**Descripción**: Historial de cambios de perfil conservado por 1 año.

**Regla**:
- Registro de cada cambio con timestamp
- Almacenamiento de valor anterior
- Retención de 365 días
- Eliminación automática tras 1 año

**Impacto**: Auditoría y posibilidad de recuperación de datos.

**Excepciones**: Datos sensibles pueden tener retención menor.

---

### RN-013: Configuración de Privacidad por Defecto
**Descripción**: Configuración de privacidad por defecto es perfil público, email privado.

**Regla**:
- Perfil visible para otros usuarios
- Email no visible públicamente
- Usuario puede cambiar configuración
- Cambios aplicados inmediatamente

**Impacto**: Balance entre colaboración y privacidad.

**Excepciones**: Administradores ven todos los datos.

---

### RN-014: Exportación de Datos Personales
**Descripción**: Exportación de datos personales disponible en formato JSON/CSV.

**Regla**:
- Solicitud por usuario
- Generación en 24 horas
- Formatos: JSON, CSV
- Inclusión de todos los datos personales

**Impacto**: Cumplimiento GDPR y transparencia.

**Excepciones**: Ninguna. Es un derecho del usuario.

---

### RN-015: Período de Gracia para Eliminación
**Descripción**: Eliminación de cuenta tiene período de gracia de 30 días para recuperación.

**Regla**:
- Solicitud de eliminación inicia período de gracia
- Cuenta marcada como "pendiente de eliminación"
- Usuario puede recuperar cuenta en 30 días
- Eliminación permanente tras 30 días

**Impacto**: Previene eliminaciones accidentales.

**Excepciones**: Usuario puede solicitar eliminación inmediata.

---

## 4.3 Progreso de Cursos (9 reglas)

### RN-016: Registro Único de Curso por Usuario
**Descripción**: Un registro único de curso por usuario y curso (`unique_user_course`).

**Regla**:
- Constraint de unicidad en BD
- Prevención de duplicados
- Actualización de registro existente
- Error claro si se intenta duplicar

**Impacto**: Integridad de datos de progreso.

**Excepciones**: Ninguna.

**Referencias**: `server.js:6819-6851` - constraint handling

---

### RN-017: Registro Único de Módulo
**Descripción**: Un registro único de módulo por usuario/curso/número (`unique_user_module`).

**Regla**:
- Constraint de unicidad en BD
- Prevención de duplicados por módulo
- Actualización de registro existente
- Consistencia garantizada

**Impacto**: Integridad de datos de progreso por módulo.

**Excepciones**: Ninguna.

---

### RN-018: Módulo 1 Siempre Disponible
**Descripción**: Módulo 1 siempre disponible (`in_progress`) al inicializar cualquier curso.

**Regla**:
- Estado inicial: `in_progress` para módulo 1
- Estado inicial: `locked` para resto de módulos
- Aplicado automáticamente en inicialización
- No requiere acción del usuario

**Impacto**: Usuarios pueden empezar inmediatamente.

**Excepciones**: Ninguna.

**Referencias**: `netlify/functions/init-database.js:256-280` - trigger

---

### RN-019: Umbral de Completado 90%
**Descripción**: Video se considera completado al alcanzar ≥90% de reproducción.

**Regla**:
- Cálculo: (currentTime / duration) * 100
- Umbral: 90%
- Actualización automática de estado
- Desbloqueo de siguiente contenido

**Impacto**: Permite saltar créditos finales sin penalización.

**Excepciones**: Ninguna.

**Referencias**: `src/scripts/course-progress-manager-v2.js:526-544`

---

### RN-020: Agregación Automática de Progreso
**Descripción**: Agregación automática de progreso de curso según módulos usando trigger de BD.

**Regla**:
- Trigger ejecutado en cada actualización de módulo
- Cálculo de promedio de todos los módulos
- Actualización de `overall_progress_percentage`
- Actualización de estado de curso

**Impacto**: Progreso siempre actualizado y consistente.

**Excepciones**: Ninguna.

**Referencias**: `netlify/functions/init-database.js:256-280`

---

### RN-021: Desbloqueo Progresivo
**Descripción**: Módulo N+1 se desbloquea al completar módulo N al 100%.

**Regla**:
- Validación de completado de módulo anterior
- Cambio automático de estado `locked` a `not_started`
- Notificación al usuario
- Prevención de acceso a módulos bloqueados

**Impacto**: Aprendizaje secuencial y estructurado.

**Excepciones**: Administradores pueden desbloquear manualmente.

---

### RN-022: Tiempo Mínimo por Video
**Descripción**: Tiempo mínimo de 30 segundos por video para registrar progreso válido.

**Regla**:
- Validación de tiempo de visualización
- Progreso no registrado si < 30 segundos
- Prevención de "skip" sin visualización
- Mensaje al usuario si intenta avanzar muy rápido

**Impacto**: Garantiza engagement mínimo con contenido.

**Excepciones**: Administradores e instructores pueden omitir.

---

### RN-023: Límite de Intentos de Evaluación
**Descripción**: Máximo 3 intentos de evaluación por módulo con cooldown de 24h.

**Regla**:
- Contador de intentos por evaluación
- Máximo 3 intentos
- Cooldown de 24 horas tras 3 intentos
- Mejor calificación prevalece

**Impacto**: Previene adivinación y fomenta estudio.

**Excepciones**: Instructores pueden resetear intentos.

---

### RN-024: Emisión Automática de Certificado
**Descripción**: Certificado de finalización emitido automáticamente al completar curso al 100%.

**Regla**:
- Verificación de 100% de progreso
- Generación automática de certificado
- Envío por email
- Disponible para descarga en perfil

**Impacto**: Reconocimiento inmediato de logro.

**Excepciones**: Ninguna.

---

## 4.4 Sistema de Comunidad (8 reglas)

### RN-025: Requisitos de Pregunta
**Descripción**: Pregunta requiere obligatoriamente `title` (mín. 10 chars), `content` (mín. 20 chars), `user_id`.

**Regla**:
- Título mínimo 10 caracteres
- Contenido mínimo 20 caracteres
- User ID obligatorio
- Validación antes de guardar

**Impacto**: Calidad mínima de contenido en comunidad.

**Excepciones**: Ninguna.

---

### RN-026: Requisitos de Respuesta
**Descripción**: Respuesta requiere `content` (mín. 10 chars) y `question_id` válido.

**Regla**:
- Contenido mínimo 10 caracteres
- Question ID debe existir
- User ID obligatorio
- Validación de relación

**Impacto**: Respuestas significativas y bien vinculadas.

**Excepciones**: Ninguna.

---

### RN-027: Un Voto por Usuario
**Descripción**: Un voto por usuario por pregunta/respuesta (no duplicados).

**Regla**:
- Constraint de unicidad en BD
- Cambio de voto permitido
- No votos múltiples
- Actualización de contador automática

**Impacto**: Integridad de sistema de votación.

**Excepciones**: Ninguna.

**Referencias**: `netlify/functions/community-vote.js`

---

### RN-028: Límite de Marcadores
**Descripción**: Marcadores de favoritos limitados a 100 por usuario.

**Regla**:
- Máximo 100 favoritos por usuario
- Validación antes de agregar
- Mensaje claro al alcanzar límite
- Opción de eliminar favoritos antiguos

**Impacto**: Previene abuso y mantiene favoritos relevantes.

**Excepciones**: Usuarios premium pueden tener límite mayor.

---

### RN-029: Sistema de Reputación
**Descripción**: Sistema de reputación basado en actividad en comunidad.

**Regla**:
- +10 puntos por respuesta aceptada
- +5 puntos por voto positivo recibido
- -2 puntos por voto negativo recibido
- +2 puntos por pregunta con voto positivo
- Reputación mínima: 0 (no puede ser negativa)

**Impacto**: Gamificación y reconocimiento de contribuciones.

**Excepciones**: Administradores pueden ajustar reputación manualmente.

---

### RN-030: Moderación Automática
**Descripción**: Contenido con palabras prohibidas se marca automáticamente para revisión.

**Regla**:
- Lista de palabras prohibidas mantenida
- Detección automática en publicación
- Marcado para revisión de moderador
- No publicación automática si detectado

**Impacto**: Prevención proactiva de contenido inapropiado.

**Excepciones**: Falsos positivos revisados por moderadores.

---

### RN-031: Reportes de Contenido
**Descripción**: Reportes de contenido inapropiado requieren mínimo 3 usuarios diferentes.

**Regla**:
- Un reporte por usuario por elemento
- Mínimo 3 reportes para acción automática
- Revisión manual si < 3 reportes
- Notificación a moderadores

**Impacto**: Balance entre protección y prevención de abuso.

**Excepciones**: Moderadores pueden actuar con 1 reporte.

---

### RN-032: Archivo de Preguntas Inactivas
**Descripción**: Preguntas inactivas (>30 días sin respuesta) se archivan automáticamente.

**Regla**:
- Verificación diaria de preguntas
- Archivado si > 30 días sin actividad
- Preguntas archivadas no aparecen en listado principal
- Búsqueda incluye archivadas

**Impacto**: Mantiene comunidad activa y relevante.

**Excepciones**: Usuario puede desarchivar su pregunta.

---

## 4.5 Chat LIA y Asistencia IA (6 reglas)

### RN-033: Límite de Mensajes por Conversación
**Descripción**: Máximo 100 mensajes por conversación con IA.

**Regla**:
- Contador de mensajes por conversación
- Límite de 100 mensajes
- Sugerencia de iniciar nueva conversación
- Historial preservado

**Impacto**: Previene conversaciones infinitas y optimiza contexto.

**Excepciones**: Usuarios premium pueden tener límite mayor.

---

### RN-034: Contexto de Conversación Limitado
**Descripción**: Contexto de conversación limitado a últimos 20 mensajes.

**Regla**:
- Solo últimos 20 mensajes enviados a IA
- Mensajes anteriores en historial pero no en contexto
- Optimización de tokens
- Resumen automático de contexto anterior

**Impacto**: Balance entre contexto y costo de API.

**Excepciones**: Ninguna.

---

### RN-035: Timeout de Respuestas
**Descripción**: Timeout de 30 segundos para respuestas de IA.

**Regla**:
- Timeout configurado en 30 segundos
- Mensaje de error claro si timeout
- Opción de reintentar
- Logging de timeouts

**Impacto**: Experiencia de usuario predecible.

**Excepciones**: Ninguna.

**Referencias**: `src/scripts/course-progress-manager-v2.js:87-137` - timeout pattern

---

### RN-036: Retención de Historial
**Descripción**: Historial de conversaciones conservado por 90 días.

**Regla**:
- Almacenamiento de todas las conversaciones
- Retención de 90 días
- Eliminación automática tras 90 días
- Exportación disponible antes de eliminación

**Impacto**: Balance entre utilidad y privacidad.

**Excepciones**: Usuario puede eliminar antes.

---

### RN-037: Exportación de Conversaciones
**Descripción**: Exportación de conversaciones disponibles en formato TXT/PDF.

**Regla**:
- Selección de conversaciones específicas
- Formatos: TXT, PDF
- Inclusión de timestamps
- Descarga inmediata

**Impacto**: Permite referencia futura y estudio.

**Excepciones**: Ninguna.

---

### RN-038: Escalación por Sentimiento
**Descripción**: Análisis de sentimientos para detectar frustración y escalar a soporte humano.

**Regla**:
- Análisis automático de tono
- Detección de frustración o confusión
- Sugerencia de contactar soporte
- Opción de escalación directa

**Impacto**: Mejora satisfacción de usuario.

**Excepciones**: Usuario puede rechazar escalación.

---

## 4.6 Evaluaciones y Tests (6 reglas)

### RN-039: Rango de Opciones en Preguntas
**Descripción**: Preguntas de opción múltiple requieren mínimo 2 opciones, máximo 6 opciones.

**Regla**:
- Mínimo 2 opciones
- Máximo 6 opciones
- Al menos 1 respuesta correcta
- Validación al crear pregunta

**Impacto**: Calidad y usabilidad de evaluaciones.

**Excepciones**: Preguntas verdadero/falso tienen exactamente 2 opciones.

---

### RN-040: Evaluación Automática con IA
**Descripción**: Evaluaciones automáticas con IA para preguntas de respuesta libre.

**Regla**:
- Integración con modelo de lenguaje
- Comparación con respuesta modelo
- Calificación numérica 0-100
- Retroalimentación generada

**Impacto**: Escalabilidad de evaluaciones.

**Excepciones**: Instructor puede revisar manualmente.

---

### RN-041: Calificación Mínima para Aprobar
**Descripción**: Calificación mínima de 70% para aprobar módulo.

**Regla**:
- Umbral de aprobación: 70%
- Cálculo basado en promedio de evaluaciones
- Desbloqueo de siguiente módulo si aprueba
- Opción de reintentar si no aprueba

**Impacto**: Estándar de calidad de aprendizaje.

**Excepciones**: Instructores pueden ajustar umbral por curso.

---

### RN-042: Límite de Intentos con Cooldown
**Descripción**: Máximo 3 intentos por evaluación con período de enfriamiento de 24h.

**Regla**:
- Máximo 3 intentos por evaluación
- Cooldown de 24 horas tras 3 intentos
- Mejor calificación cuenta
- Notificación de intentos restantes

**Impacto**: Previene adivinación y fomenta estudio.

**Excepciones**: Instructores pueden resetear intentos.

---

### RN-043: Retroalimentación Inmediata
**Descripción**: Retroalimentación inmediata obligatoria en respuestas incorrectas.

**Regla**:
- Indicación de correcto/incorrecto inmediata
- Explicación de respuesta correcta
- Sugerencias de contenido para repasar
- Opción de ver solución detallada

**Impacto**: Aprendizaje efectivo y continuo.

**Excepciones**: Ninguna.

---

### RN-044: Análisis Automático de Fortalezas
**Descripción**: Análisis de fortalezas/debilidades generado automáticamente tras evaluaciones.

**Regla**:
- Análisis por categoría de pregunta
- Identificación de áreas fuertes y débiles
- Recomendaciones personalizadas
- Actualización con cada evaluación

**Impacto**: Aprendizaje personalizado y dirigido.

**Excepciones**: Ninguna.

---

## 4.7 Zoom y Eventos Virtuales (6 reglas)

### RN-045: Permisos de Host
**Descripción**: Solo usuarios con rol `host` pueden crear sesiones y controlar grabaciones.

**Regla**:
- Validación de rol antes de crear sesión
- Control de grabación solo para hosts
- Gestión de participantes para hosts
- Logs de acciones de host

**Impacto**: Control y seguridad de sesiones.

**Excepciones**: Administradores tienen permisos de host.

---

### RN-046: Anticipación Mínima de Sesiones
**Descripción**: Sesiones programadas con mínimo 15 minutos de anticipación.

**Regla**:
- Validación de fecha/hora futura
- Mínimo 15 minutos de anticipación
- Notificación a participantes
- Calendario actualizado automáticamente

**Impacto**: Tiempo para preparación y notificación.

**Excepciones**: Administradores pueden crear sesiones inmediatas.

---

### RN-047: Duración Máxima de Sesión
**Descripción**: Duración máxima de sesión es 4 horas.

**Regla**:
- Límite de 4 horas por sesión
- Advertencia 10 minutos antes de finalizar
- Opción de extender (solo host)
- Finalización automática al límite

**Impacto**: Gestión de recursos y costos.

**Excepciones**: Eventos especiales pueden tener duración mayor.

---

### RN-048: Grabación Automática
**Descripción**: Grabaciones automáticas para sesiones >30 minutos.

**Regla**:
- Inicio automático de grabación si > 30 min
- Notificación a participantes
- Almacenamiento en cloud
- Disponibilidad post-sesión

**Impacto**: Registro de contenido educativo.

**Excepciones**: Host puede desactivar grabación.

---

### RN-049: Límite de Participantes
**Descripción**: Máximo 100 participantes por sesión.

**Regla**:
- Límite de 100 participantes simultáneos
- Lista de espera si se alcanza límite
- Notificación de sesión llena
- Prioridad por orden de registro

**Impacto**: Calidad de experiencia y costos.

**Excepciones**: Sesiones especiales pueden tener límite mayor.

---

### RN-050: Retención de Grabaciones
**Descripción**: Retención de grabaciones por 90 días, luego archivado automático.

**Regla**:
- Almacenamiento activo por 90 días
- Archivado automático tras 90 días
- Notificación antes de archivar
- Opción de descarga antes de archivar

**Impacto**: Balance entre disponibilidad y costos.

**Excepciones**: Contenido premium puede tener retención mayor.

---

## 4.8 Storage y Cargas (6 reglas)

### RN-051: Límite de Almacenamiento por Usuario
**Descripción**: Límite de almacenamiento de 1GB por usuario para archivos de perfil.

**Regla**:
- Tracking de uso por usuario
- Límite de 1GB
- Alerta al 80% de uso
- Bloqueo de cargas al 100%

**Impacto**: Control de costos y recursos.

**Excepciones**: Usuarios premium pueden tener límite mayor.

---

### RN-052: Eliminación de Archivos Temporales
**Descripción**: Archivos temporales eliminados automáticamente tras 24h.

**Regla**:
- Identificación de archivos temporales
- Limpieza automática cada 24 horas
- Logs de limpieza
- Recuperación de espacio

**Impacto**: Optimización de almacenamiento.

**Excepciones**: Ninguna.

---

### RN-053: Backup de Archivos Críticos
**Descripción**: Backup automático de archivos críticos cada 6 horas.

**Regla**:
- Backup cada 6 horas
- Identificación de archivos críticos
- Almacenamiento redundante
- Retención de 30 días

**Impacto**: Protección de datos importantes.

**Excepciones**: Ninguna.

---

### RN-054: Compresión Automática
**Descripción**: Compresión automática de imágenes >500KB.

**Regla**:
- Detección de tamaño al subir
- Compresión si > 500KB
- Mantenimiento de calidad visual
- Formatos modernos (WebP, AVIF)

**Impacto**: Optimización de almacenamiento y rendimiento.

**Excepciones**: Usuario puede solicitar sin compresión.

---

### RN-055: Validación de MIME Type
**Descripción**: Validación de tipo MIME obligatoria para todas las cargas.

**Regla**:
- Verificación de MIME type
- Comparación con extensión de archivo
- Rechazo si no coincide
- Prevención de archivos maliciosos

**Impacto**: Seguridad del sistema.

**Excepciones**: Ninguna.

---

### RN-056: Escaneo de Malware
**Descripción**: Escaneo de malware en archivos subidos >10MB.

**Regla**:
- Escaneo automático si > 10MB
- Cuarentena si se detecta malware
- Notificación al usuario
- Eliminación de archivos infectados

**Impacto**: Seguridad del sistema y usuarios.

**Excepciones**: Ninguna.

---

## 4.9 Notificaciones (5 reglas)

### RN-057: Límite de Notificaciones Activas
**Descripción**: Máximo 50 notificaciones activas por usuario.

**Regla**:
- Límite de 50 notificaciones no leídas
- Eliminación automática de más antiguas
- Opción de marcar como leídas
- Archivado de notificaciones antiguas

**Impacto**: Mantiene centro de notificaciones manejable.

**Excepciones**: Notificaciones críticas no se eliminan.

---

### RN-058: Expiración de Notificaciones
**Descripción**: Notificaciones no leídas expiran tras 30 días.

**Regla**:
- Marcado automático como leídas tras 30 días
- Archivado automático
- Opción de ver archivadas
- Limpieza de archivadas tras 90 días

**Impacto**: Mantiene relevancia de notificaciones.

**Excepciones**: Usuario puede marcar como importantes.

---

### RN-059: Frecuencia de Notificaciones por Email
**Descripción**: Frecuencia de notificaciones por email limitada a máximo 3 por día.

**Regla**:
- Máximo 3 emails por día
- Agrupación de notificaciones
- Resumen diario si hay más
- Configuración por usuario

**Impacto**: Previene spam y fatiga de notificaciones.

**Excepciones**: Notificaciones críticas no tienen límite.

---

### RN-060: Configuración Granular
**Descripción**: Usuarios pueden desactivar tipos específicos de notificaciones.

**Regla**:
- Configuración por tipo de notificación
- Configuración por canal
- Guardado automático de preferencias
- Aplicación inmediata

**Impacto**: Control de usuario sobre comunicaciones.

**Excepciones**: Notificaciones críticas no pueden desactivarse.

---

### RN-061: Notificaciones Críticas Obligatorias
**Descripción**: Notificaciones críticas (seguridad) no pueden ser desactivadas.

**Regla**:
- Identificación de notificaciones críticas
- Envío obligatorio
- Múltiples canales
- Confirmación de recepción

**Impacto**: Seguridad y cumplimiento.

**Excepciones**: Ninguna.

---

## 4.10 Administración y Moderación (5 reglas)

### RN-062: Acceso Completo de Administradores
**Descripción**: Administradores tienen acceso completo a todos los datos de usuarios.

**Regla**:
- Acceso sin restricciones a datos
- Capacidad de modificar cualquier dato
- Logs de auditoría obligatorios
- Justificación de accesos

**Impacto**: Gestión efectiva del sistema.

**Excepciones**: Datos de otros administradores requieren aprobación adicional.

---

### RN-063: Permisos de Moderadores
**Descripción**: Moderadores pueden editar/eliminar contenido de comunidad.

**Regla**:
- Edición de preguntas y respuestas
- Eliminación de contenido inapropiado
- Justificación obligatoria
- Notificación a usuario afectado

**Impacto**: Calidad de contenido en comunidad.

**Excepciones**: Eliminación de contenido de administradores requiere aprobación.

---

### RN-064: Auditoría de Acciones Administrativas
**Descripción**: Logs de auditoría obligatorios para todas las acciones administrativas.

**Regla**:
- Registro de cada acción admin
- Timestamp, usuario, acción, resultado
- Almacenamiento inmutable
- Retención de 6 meses

**Impacto**: Accountability y seguridad.

**Excepciones**: Ninguna.

---

### RN-065: Rotación de Logs
**Descripción**: Rotación de logs cada 90 días con archivado automático.

**Regla**:
- Rotación automática cada 90 días
- Archivado en almacenamiento frío
- Compresión de logs archivados
- Retención de 1 año en archivo

**Impacto**: Gestión de almacenamiento.

**Excepciones**: Logs de seguridad tienen retención mayor.

---

### RN-066: Alertas por Actividad Sospechosa
**Descripción**: Alertas automáticas por actividad sospechosa (>100 acciones/minuto).

**Regla**:
- Monitoreo de tasa de acciones
- Alerta si > 100 acciones/minuto
- Bloqueo temporal automático
- Revisión manual obligatoria

**Impacto**: Prevención de abuso y ataques.

**Excepciones**: Procesos automatizados autorizados están en whitelist.

---

## 4.11 Analytics y Métricas (5 reglas)

### RN-067: Cálculo Diario de Métricas
**Descripción**: Métricas de usuario calculadas cada 24 horas.

**Regla**:
- Cálculo automático diario
- Ejecución a medianoche
- Actualización de dashboards
- Notificación de anomalías

**Impacto**: Datos actualizados y consistentes.

**Excepciones**: Métricas críticas se calculan en tiempo real.

---

### RN-068: Retención de Datos Analíticos
**Descripción**: Retención de datos analíticos por 2 años.

**Regla**:
- Almacenamiento de 2 años
- Agregación de datos antiguos
- Eliminación tras 2 años
- Exportación disponible antes de eliminación

**Impacto**: Balance entre análisis histórico y almacenamiento.

**Excepciones**: Datos de cumplimiento tienen retención mayor.

---

### RN-069: Anonimización en Reportes
**Descripción**: Anonimización automática de datos personales en reportes.

**Regla**:
- Eliminación de identificadores personales
- Agregación de datos
- Imposibilidad de re-identificación
- Cumplimiento de privacidad

**Impacto**: Privacidad en análisis.

**Excepciones**: Reportes internos pueden incluir datos personales.

---

### RN-070: Actualización de Dashboards
**Descripción**: Dashboards de métricas actualizados en tiempo real.

**Regla**:
- Actualización cada 30 segundos
- Métricas clave en tiempo real
- Indicadores de última actualización
- Opción de refrescar manualmente

**Impacto**: Visibilidad inmediata de estado del sistema.

**Excepciones**: Métricas complejas se actualizan cada 5 minutos.

---

### RN-071: Alertas por Caídas de Métricas
**Descripción**: Alertas automáticas por caídas >20% en métricas clave.

**Regla**:
- Monitoreo continuo de métricas
- Comparación con promedio histórico
- Alerta si caída > 20%
- Escalación automática

**Impacto**: Detección temprana de problemas.

**Excepciones**: Caídas esperadas (mantenimiento) no generan alertas.

---

## 4.12 Integración y APIs (4 reglas)

### RN-072: Rate Limiting de API
**Descripción**: Rate limiting de API con límite de 1000 requests/hora por usuario autenticado.

**Regla**:
- Límite de 1000 requests/hora
- Contador por usuario
- Respuesta 429 Too Many Requests
- Headers informativos de límites

**Impacto**: Prevención de abuso y control de costos.

**Excepciones**: Usuarios enterprise pueden tener límite mayor.

---

### RN-073: Webhooks con Retry
**Descripción**: Webhooks con máximo 3 reintentos y timeout de 30 segundos.

**Regla**:
- Timeout de 30 segundos por intento
- Máximo 3 reintentos
- Backoff exponencial (1s, 2s, 4s)
- Logs de entregas

**Impacto**: Fiabilidad de integraciones.

**Excepciones**: Ninguna.

---

### RN-074: Versionado de API
**Descripción**: Versionado de API con soporte para últimas 2 versiones principales.

**Regla**:
- Versionado semántico (v1, v2, etc.)
- Soporte de 2 versiones simultáneas
- Deprecation notices con 6 meses de anticipación
- Migración automática cuando posible

**Impacto**: Estabilidad para integraciones.

**Excepciones**: Versiones con vulnerabilidades se deprecan inmediatamente.

---

### RN-075: Documentación Automática
**Descripción**: Documentación de API actualizada automáticamente en cada release.

**Regla**:
- Generación automática desde código
- Publicación en cada release
- Ejemplos de uso incluidos
- Changelog detallado

**Impacto**: Documentación siempre actualizada.

**Excepciones**: Ninguna.

---

## 4.13 Políticas de Retención (5 reglas)

### RN-076: Retención de Datos de Progreso
**Descripción**: Datos de progreso conservados por 3 años tras última actividad.

**Regla**:
- Retención de 3 años desde última actividad
- Notificación antes de eliminación
- Opción de exportar antes de eliminar
- Eliminación permanente tras 3 años

**Impacto**: Balance entre utilidad y almacenamiento.

**Excepciones**: Usuario puede solicitar eliminación antes.

---

### RN-077: Retención de Logs de Sesión
**Descripción**: Logs de sesión eliminados tras 6 meses.

**Regla**:
- Retención de 6 meses
- Agregación de datos antiguos
- Eliminación automática tras 6 meses
- Logs de seguridad conservados por 1 año

**Impacto**: Cumplimiento de privacidad.

**Excepciones**: Logs relacionados con incidentes se conservan más tiempo.

---

### RN-078: Retención de Conversaciones con IA
**Descripción**: Conversaciones con IA archivadas tras 90 días.

**Regla**:
- Archivado automático tras 90 días
- Acceso a archivadas disponible
- Eliminación permanente tras 1 año
- Exportación disponible antes de eliminación

**Impacto**: Privacidad y optimización de almacenamiento.

**Excepciones**: Usuario puede eliminar antes.

---

### RN-079: Retención de Datos de Evaluación
**Descripción**: Datos de evaluación conservados por 5 años para certificaciones.

**Regla**:
- Retención de 5 años
- Necesario para validación de certificados
- Almacenamiento seguro
- Auditoría anual

**Impacto**: Validez de certificaciones.

**Excepciones**: Ninguna. Requerido para cumplimiento.

---

### RN-080: Backup de Base de Datos
**Descripción**: Backup completo de base de datos cada 24 horas con retención de 30 días.

**Regla**:
- Backup completo diario
- Backup incremental cada 6 horas
- Retención de 30 días
- Testing de restauración mensual

**Impacto**: Protección de datos y disaster recovery.

**Excepciones**: Ninguna.

---

## 4.14 Límites de Sistema (5 reglas)

### RN-081: Límite de Usuarios Concurrentes
**Descripción**: Máximo 10,000 usuarios concurrentes en la plataforma.

**Regla**:
- Límite de 10,000 usuarios simultáneos
- Queue de espera si se alcanza límite
- Notificación de sistema ocupado
- Prioridad por tipo de usuario

**Impacto**: Garantía de rendimiento.

**Excepciones**: Límite puede aumentarse con infraestructura adicional.

---

### RN-082: Límite de Cola de Tareas
**Descripción**: Procesamiento de cola de tareas asíncronas limitado a máximo 1000 tareas/minuto.

**Regla**:
- Procesamiento de 1000 tareas/minuto
- Queue para tareas excedentes
- Priorización de tareas críticas
- Monitoreo de tamaño de cola

**Impacto**: Control de recursos y costos.

**Excepciones**: Tareas críticas tienen prioridad.

---

### RN-083: Tamaño Máximo de Respuesta
**Descripción**: Tamaño máximo de respuesta de API es 10MB.

**Regla**:
- Límite de 10MB por respuesta
- Paginación obligatoria para datasets grandes
- Compresión de respuestas
- Mensaje de error si se excede

**Impacto**: Rendimiento y experiencia de usuario.

**Excepciones**: Descargas de archivos no tienen este límite.

---

### RN-084: Tiempo Máximo de Procesamiento
**Descripción**: Tiempo máximo de procesamiento de request es 30 segundos.

**Regla**:
- Timeout de 30 segundos
- Respuesta 504 Gateway Timeout
- Sugerencia de operación asíncrona
- Logging de timeouts

**Impacto**: Prevención de bloqueos.

**Excepciones**: Operaciones de larga duración usan procesamiento asíncrono.

---

### RN-085: Límite de Almacenamiento de Base de Datos
**Descripción**: Almacenamiento total de base de datos limitado a máximo 1TB por instancia.

**Regla**:
- Límite de 1TB por instancia
- Monitoreo continuo de uso
- Alertas al 80% de uso
- Plan de escalamiento preparado

**Impacto**: Control de costos y planificación.

**Excepciones**: Instancias adicionales pueden agregarse.

---

## Resumen de Reglas de Negocio

### Por Categoría
- **Identidad y Autenticación**: 8 reglas (RN-001 a RN-008)
- **Gestión de Perfiles**: 7 reglas (RN-009 a RN-015)
- **Progreso de Cursos**: 9 reglas (RN-016 a RN-024)
- **Sistema de Comunidad**: 8 reglas (RN-025 a RN-032)
- **Chat LIA y Asistencia IA**: 6 reglas (RN-033 a RN-038)
- **Evaluaciones y Tests**: 6 reglas (RN-039 a RN-044)
- **Zoom y Eventos Virtuales**: 6 reglas (RN-045 a RN-050)
- **Storage y Cargas**: 6 reglas (RN-051 a RN-056)
- **Notificaciones**: 5 reglas (RN-057 a RN-061)
- **Administración y Moderación**: 5 reglas (RN-062 a RN-066)
- **Analytics y Métricas**: 5 reglas (RN-067 a RN-071)
- **Integración y APIs**: 4 reglas (RN-072 a RN-075)
- **Políticas de Retención**: 5 reglas (RN-076 a RN-080)
- **Límites de Sistema**: 5 reglas (RN-081 a RN-085)

### Total: 85 Reglas de Negocio

---

**Documento:** PRD 04 - Reglas de Negocio  
**Total de Reglas:** 85 RN  
**Versión:** 1.0  
**Fecha:** Enero 2025  
**Autor:** Equipo de Desarrollo Chat-Bot-LIA
