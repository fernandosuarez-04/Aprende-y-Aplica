# PRD 02 - Requisitos Funcionales - Chat-Bot-LIA

## 2. Requisitos Funcionales del Sistema

Este documento detalla los 152 requisitos funcionales del sistema Chat-Bot-LIA, organizados por módulos funcionales. Cada requisito incluye su identificador único, descripción detallada y referencias al código fuente cuando aplica.

---

## 2.1 Autenticación y Gestión de Sesiones (12 RF)

### RF-001: Sistema de Login con Credenciales
**Descripción**: El sistema debe permitir autenticación de usuarios mediante email/username y contraseña con hash bcrypt (mínimo 12 rounds).

**Criterios de Aceptación**:
- Validación de credenciales contra base de datos
- Hash bcrypt con salt mínimo de 12 rounds
- Respuesta en < 500ms para el 95% de requests
- Mensajes de error genéricos para evitar enumeración de usuarios

**Referencias**: `server.js` - función `requireUserSession`, `netlify/functions/login.js`

---

### RF-002: Autenticación con Google OAuth
**Descripción**: El sistema debe soportar autenticación opcional mediante Google OAuth 2.0.

**Criterios de Aceptación**:
- Integración con Google OAuth 2.0
- Creación automática de cuenta en primer login
- Sincronización de datos básicos (nombre, email, avatar)
- Fallback a autenticación tradicional si OAuth falla

**Referencias**: `src/login/new-auth.html`, Google Auth Library

---

### RF-003: Gestión de Tokens JWT
**Descripción**: El sistema debe crear, validar y renovar tokens JWT Bearer con verificación de fingerprint de dispositivo.

**Criterios de Aceptación**:
- Generación de JWT con payload: userId, fingerprint, exp
- TTL deslizante de 24h por defecto, máximo 7 días
- Renovación automática en cada request válido
- Invalidación de tokens en logout

**Referencias**: `server.js:468-495` - función `requireUserSession`

```javascript
const payload = jwt.verify(token, USER_JWT_SECRET);
if (payload.fp && payload.fp !== fpNow) return res.status(401)...
```

---

### RF-004: Verificación de Fingerprint
**Descripción**: El sistema debe verificar el fingerprint del dispositivo para seguridad adicional en cada request autenticado.

**Criterios de Aceptación**:
- Generación de fingerprint único por dispositivo
- Validación de coincidencia en cada request
- Rechazo automático si fingerprint no coincide
- Registro de intentos de acceso con fingerprint inválido

---

### RF-005: Verificación de Email con OTP
**Descripción**: El sistema debe enviar códigos OTP por email para verificación de cuentas nuevas y recuperación de contraseña.

**Criterios de Aceptación**:
- Generación de código OTP de 6 dígitos
- Envío por email con template profesional
- Validez de 15 minutos
- Máximo 3 intentos de verificación
- Reenvío disponible después de 60 segundos

**Referencias**: `netlify/functions/verify-email.js`, `src/utils/otp-service.js`

---

### RF-006: Recuperación de Contraseña
**Descripción**: El sistema debe permitir recuperación de contraseña mediante enlaces temporales enviados por email.

**Criterios de Aceptación**:
- Generación de token único de recuperación
- Enlace válido por 24 horas
- Formulario de nueva contraseña con validación
- Invalidación de token tras uso exitoso
- Notificación por email de cambio de contraseña

**Referencias**: `netlify/functions/forgot-password.js`, `netlify/functions/reset-password.js`

---

### RF-007: Modo Desarrollo sin Base de Datos
**Descripción**: El sistema debe funcionar en modo desarrollo con usuarios simulados cuando la base de datos no está disponible.

**Criterios de Aceptación**:
- Detección automática de falta de conexión a BD
- Usuarios de prueba predefinidos
- Funcionalidad limitada pero operativa
- Mensaje claro de modo desarrollo activo

---

### RF-008: Logout Seguro
**Descripción**: El sistema debe permitir cierre de sesión con invalidación completa de tokens.

**Criterios de Aceptación**:
- Invalidación de token JWT
- Limpieza de sesión en servidor
- Redirección a página de login
- Limpieza de datos sensibles en localStorage

---

### RF-009: Sesiones Concurrentes Limitadas
**Descripción**: El sistema debe limitar a máximo 3 sesiones concurrentes por usuario.

**Criterios de Aceptación**:
- Tracking de sesiones activas por usuario
- Cierre automático de sesión más antigua al exceder límite
- Notificación al usuario de sesiones activas
- Opción de cerrar sesiones remotas

---

### RF-010: Expiración Automática de Sesiones
**Descripción**: El sistema debe expirar automáticamente sesiones inactivas después de 24 horas sin actividad.

**Criterios de Aceptación**:
- Tracking de última actividad por sesión
- Verificación en cada request
- Mensaje de sesión expirada al usuario
- Opción de renovar sesión fácilmente

---

### RF-011: Bloqueo Temporal por Intentos Fallidos
**Descripción**: El sistema debe bloquear temporalmente cuentas tras 5 intentos fallidos de login.

**Criterios de Aceptación**:
- Contador de intentos fallidos por usuario/IP
- Bloqueo de 15 minutos tras 5 intentos
- Notificación por email de bloqueo
- Reset de contador tras login exitoso

---

### RF-012: Verificación de Email Obligatoria
**Descripción**: El sistema debe requerir verificación de email para acceso a funcionalidades completas.

**Criterios de Aceptación**:
- Acceso limitado sin verificación
- Banner persistente recordando verificación
- Reenvío de email de verificación disponible
- Acceso completo tras verificación exitosa

---

## 2.2 Gestión de Perfil de Usuario (12 RF)

### RF-013: Visualización de Perfil
**Descripción**: El sistema debe permitir visualización de datos básicos del perfil (nombre, email, bio, avatar).

**Criterios de Aceptación**:
- Página de perfil con todos los datos del usuario
- Avatar con fallback a iniciales si no hay imagen
- Información de cuenta (fecha de registro, último acceso)
- Estadísticas básicas (cursos completados, progreso)

**Referencias**: `src/profile.html`, `netlify/functions/get-profile.js`

---

### RF-014: Edición de Datos Básicos
**Descripción**: El sistema debe permitir edición de nombre, email y biografía con validación en tiempo real.

**Criterios de Aceptación**:
- Formulario con validación en tiempo real
- Verificación de email único al cambiar
- Confirmación de cambios críticos (email)
- Guardado automático de cambios

**Referencias**: `netlify/functions/update-profile.js`

---

### RF-015: Gestión de Avatar con Supabase Storage
**Descripción**: El sistema debe permitir subida de avatar con almacenamiento en Supabase Storage.

**Criterios de Aceptación**:
- Formatos soportados: JPG, PNG, GIF
- Tamaño máximo: 5MB
- Redimensionamiento automático a 200x200px
- Compresión si excede 500KB
- Preview antes de guardar

**Referencias**: `netlify/functions/update-avatar.js`, `setup-supabase-buckets.js`

---

### RF-016: Fallback a Base64 para Avatares
**Descripción**: El sistema debe usar almacenamiento base64 en base de datos si Supabase Storage falla.

**Criterios de Aceptación**:
- Detección automática de fallo de Storage
- Conversión a base64 automática
- Almacenamiento en campo de BD
- Funcionamiento transparente para usuario

---

### RF-017: Persistencia Obligatoria en Base de Datos
**Descripción**: Todos los cambios de perfil deben persistirse en base de datos antes de confirmar al usuario.

**Criterios de Aceptación**:
- Transacciones ACID para cambios
- Rollback en caso de error
- Confirmación solo tras éxito de BD
- Logs de auditoría de cambios

---

### RF-018: Validación de Formatos de Imagen
**Descripción**: El sistema debe validar formatos de imagen permitidos (JPG, PNG, GIF) antes de procesar.

**Criterios de Aceptación**:
- Validación de MIME type
- Validación de extensión de archivo
- Rechazo de formatos no permitidos
- Mensaje de error claro al usuario

---

### RF-019: Redimensionamiento Automático de Imágenes
**Descripción**: El sistema debe redimensionar automáticamente imágenes de avatar a dimensiones óptimas.

**Criterios de Aceptación**:
- Redimensión a 200x200px para avatares
- Mantenimiento de aspect ratio
- Calidad optimizada para web
- Procesamiento en servidor

---

### RF-020: Historial de Cambios de Perfil
**Descripción**: El sistema debe mantener historial de cambios de perfil por 1 año para auditoría.

**Criterios de Aceptación**:
- Registro de cada cambio con timestamp
- Almacenamiento de valores anteriores
- Acceso para administradores
- Limpieza automática tras 1 año

---

### RF-021: Configuración de Privacidad
**Descripción**: El sistema debe permitir configuración de privacidad del perfil (público/privado).

**Criterios de Aceptación**:
- Opciones: perfil público, privado, solo comunidad
- Control de visibilidad de email
- Control de visibilidad de progreso
- Aplicación inmediata de cambios

---

### RF-022: Vinculación de Perfiles Sociales
**Descripción**: El sistema debe permitir vinculación de perfiles de redes sociales (LinkedIn, Twitter, GitHub).

**Criterios de Aceptación**:
- Formulario para URLs de perfiles
- Validación de URLs
- Íconos de redes sociales en perfil
- Opción de desvincular

---

### RF-023: Gestión de Preferencias de Notificaciones
**Descripción**: El sistema debe permitir configuración granular de preferencias de notificaciones.

**Criterios de Aceptación**:
- Configuración por tipo de notificación
- Configuración por canal (email, push, in-app)
- Horarios de no molestar
- Guardado automático de preferencias

---

### RF-024: Exportación de Datos Personales
**Descripción**: El sistema debe permitir exportación de datos personales en formato JSON/CSV (cumplimiento GDPR).

**Criterios de Aceptación**:
- Exportación completa de datos
- Formatos: JSON, CSV
- Inclusión de progreso, actividad, contenido
- Descarga directa o envío por email

---

## 2.3 Sistema de Cursos y Seguimiento de Progreso (14 RF)

### RF-025: Inicialización Automática de Progreso
**Descripción**: El sistema debe inicializar automáticamente el progreso de curso al inscribirse un usuario.

**Criterios de Aceptación**:
- Creación de registro en `course_progress`
- Creación de registros en `module_progress` para todos los módulos
- Módulo 1 en estado `in_progress`
- Resto de módulos en estado `locked`

**Referencias**: `scripts/init-progress-database.js`, `netlify/functions/progress-sync.js`

---

### RF-026: Actualización Granular de Progreso
**Descripción**: El sistema debe permitir actualización granular de progreso por módulo y video.

**Criterios de Aceptación**:
- Tracking de porcentaje de completado por video
- Guardado de posición exacta en segundos
- Actualización en tiempo real
- Sincronización con base de datos

**Referencias**: `src/scripts/course-progress-manager-v2.js:526-544`

```javascript
const isCompleted = completionPercentage >= 90
await this.apiCall(`/api/users/${this.userId}/course/intro-to-ai/module/${moduleNumber}/progress`, { ... })
```

---

### RF-027: Tracking de Porcentaje de Video
**Descripción**: El sistema debe trackear el porcentaje de completado de cada video con precisión.

**Criterios de Aceptación**:
- Actualización cada 10 segundos durante reproducción
- Cálculo: (currentTime / duration) * 100
- Persistencia en localStorage y BD
- Sincronización entre dispositivos

---

### RF-028: Guardado de Posición de Video
**Descripción**: El sistema debe guardar la posición exacta en segundos del video para continuar donde se dejó.

**Criterios de Aceptación**:
- Guardado automático cada 10 segundos
- Recuperación al recargar página
- Sincronización entre dispositivos
- Opción de reiniciar desde inicio

---

### RF-029: Umbral del 90% para Completado
**Descripción**: El sistema debe marcar un video como completado al alcanzar ≥90% de reproducción.

**Criterios de Aceptación**:
- Verificación automática al alcanzar 90%
- Actualización de estado a `completed`
- Desbloqueo de siguiente contenido
- Notificación visual al usuario

---

### RF-030: Actualización Automática de Estado
**Descripción**: El sistema debe actualizar automáticamente el estado del módulo y curso basado en progreso de videos.

**Criterios de Aceptación**:
- Cálculo automático de progreso de módulo
- Actualización de estado de curso
- Triggers de base de datos para agregación
- Consistencia de datos garantizada

**Referencias**: `netlify/functions/init-database.js:256-280` - triggers de BD

---

### RF-031: Desbloqueo Progresivo de Módulos
**Descripción**: El sistema debe desbloquear módulo N+1 solo cuando módulo N esté completado al 100%.

**Criterios de Aceptación**:
- Validación de completado de módulo anterior
- Cambio de estado de `locked` a `not_started`
- Notificación de desbloqueo al usuario
- Prevención de acceso a módulos bloqueados

---

### RF-032: Certificados de Finalización
**Descripción**: El sistema debe generar certificados automáticamente al completar un curso al 100%.

**Criterios de Aceptación**:
- Generación automática en PDF
- Datos: nombre, curso, fecha, ID único
- Descarga inmediata disponible
- Verificación online del certificado

---

### RF-033: Sistema de Notas Personales
**Descripción**: El sistema debe permitir tomar notas personales durante la visualización de videos.

**Criterios de Aceptación**:
- Editor de texto en sidebar
- Guardado automático cada 30 segundos
- Timestamp automático al crear nota
- Búsqueda en notas personales

**Referencias**: `src/Chat-Online/chat-online.html` - NotebookLM-style notes

---

### RF-034: Marcadores Temporales en Videos
**Descripción**: El sistema debe permitir crear marcadores temporales en videos para revisión posterior.

**Criterios de Aceptación**:
- Botón de marcador en controles de video
- Lista de marcadores con timestamp
- Navegación directa a marcadores
- Eliminación de marcadores individuales

---

### RF-035: Estadísticas de Tiempo Invertido
**Descripción**: El sistema debe calcular y mostrar tiempo invertido por módulo y curso.

**Criterios de Aceptación**:
- Tracking de tiempo de sesión
- Cálculo de tiempo total por módulo
- Visualización en dashboard
- Comparativa con promedios

---

### RF-036: Recomendaciones de Contenido
**Descripción**: El sistema debe generar recomendaciones de contenido basadas en progreso y patrones de aprendizaje.

**Criterios de Aceptación**:
- Análisis de progreso actual
- Identificación de áreas débiles
- Sugerencias de contenido relacionado
- Actualización semanal de recomendaciones

---

### RF-037: Exportación de Certificados en PDF
**Descripción**: El sistema debe permitir exportación de certificados en formato PDF de alta calidad.

**Criterios de Aceptación**:
- Generación en PDF con diseño profesional
- Inclusión de QR code para verificación
- Tamaño optimizado para impresión
- Descarga directa desde interfaz

---

### RF-038: Sistema de Badges por Logros
**Descripción**: El sistema debe otorgar badges por logros específicos (completar módulos, racha de estudio, etc.).

**Criterios de Aceptación**:
- Definición de logros y criterios
- Otorgamiento automático al cumplir criterios
- Visualización en perfil
- Notificación de nuevo badge

---

## 2.4 Sistema de Comunidad (Q&A, Votos, Marcadores) (14 RF)

### RF-039: Listado Paginado de Preguntas
**Descripción**: El sistema debe mostrar listado paginado de preguntas con filtros y ordenamiento.

**Criterios de Aceptación**:
- Paginación de 20 preguntas por página
- Filtros: por curso, por etiqueta, por estado
- Ordenamiento: recientes, populares, sin responder
- Búsqueda por texto

**Referencias**: `src/Community/community.js`, `netlify/functions/community-questions.js`

---

### RF-040: Creación de Preguntas
**Descripción**: El sistema debe permitir crear preguntas con título, contenido y tags.

**Criterios de Aceptación**:
- Formulario con validación
- Título mínimo 10 caracteres
- Contenido mínimo 20 caracteres
- Hasta 5 tags por pregunta
- Preview antes de publicar

---

### RF-041: Sistema de Respuestas Anidadas
**Descripción**: El sistema debe permitir respuestas anidadas a preguntas con múltiples niveles.

**Criterios de Aceptación**:
- Hasta 3 niveles de anidación
- Hilos de conversación claros
- Opción de responder a respuesta específica
- Notificaciones de respuestas

**Referencias**: `src/Community/community-view.html`

---

### RF-042: Votación en Preguntas y Respuestas
**Descripción**: El sistema debe permitir votación positiva/negativa en preguntas y respuestas.

**Criterios de Aceptación**:
- Un voto por usuario por elemento
- Cambio de voto permitido
- Conteo visible de votos
- Actualización en tiempo real

**Referencias**: `netlify/functions/community-vote.js`

---

### RF-043: Marcadores de Favoritos
**Descripción**: El sistema debe permitir marcar preguntas como favoritas para consultarlas después.

**Criterios de Aceptación**:
- Botón de favorito en preguntas
- Lista de favoritos accesible desde perfil
- Máximo 100 favoritos por usuario
- Búsqueda en favoritos

---

### RF-044: Sistema de Reputación de Usuarios
**Descripción**: El sistema debe calcular reputación de usuarios basada en actividad en comunidad.

**Criterios de Aceptación**:
- +10 puntos por respuesta aceptada
- +5 puntos por voto positivo
- -2 puntos por voto negativo
- Visualización de reputación en perfil

---

### RF-045: Moderación de Contenido
**Descripción**: El sistema debe permitir moderación de contenido inapropiado por moderadores.

**Criterios de Aceptación**:
- Herramientas de edición/eliminación
- Justificación obligatoria
- Historial de acciones de moderación
- Notificación a usuario afectado

---

### RF-046: Búsqueda Avanzada
**Descripción**: El sistema debe proporcionar búsqueda avanzada en preguntas y respuestas.

**Criterios de Aceptación**:
- Búsqueda por texto en títulos y contenido
- Filtros por etiquetas, fecha, autor
- Resultados ordenados por relevancia
- Historial de búsquedas recientes

---

### RF-047: Notificaciones de Respuestas
**Descripción**: El sistema debe notificar a usuarios cuando reciben respuestas a sus preguntas.

**Criterios de Aceptación**:
- Notificación en tiempo real
- Email opcional configurable
- Centro de notificaciones unificado
- Marcar como leído/no leído

---

### RF-048: Sistema de Etiquetas
**Descripción**: El sistema debe proporcionar sistema de etiquetas categorizadas para organizar contenido.

**Criterios de Aceptación**:
- Creación de etiquetas por moderadores
- Sugerencias automáticas al crear pregunta
- Estadísticas de uso por etiqueta
- Navegación por etiquetas

---

### RF-049: Preguntas Destacadas
**Descripción**: El sistema debe identificar y destacar preguntas trending y de alta calidad.

**Criterios de Aceptación**:
- Algoritmo de trending basado en votos y actividad
- Sección de preguntas destacadas
- Rotación automática
- Criterios transparentes

---

### RF-050: Reporte de Contenido Inapropiado
**Descripción**: El sistema debe permitir reportar contenido inapropiado para revisión de moderadores.

**Criterios de Aceptación**:
- Botón de reporte en cada elemento
- Categorías de reporte
- Queue de reportes para moderadores
- Mínimo 3 reportes para acción automática

---

### RF-051: Sistema de Menciones
**Descripción**: El sistema debe permitir mencionar a otros usuarios en preguntas y respuestas.

**Criterios de Aceptación**:
- Sintaxis @username
- Autocompletado al escribir @
- Notificación a usuario mencionado
- Enlace a perfil del usuario

---

### RF-052: Preguntas Frecuentes Automáticas
**Descripción**: El sistema debe identificar automáticamente preguntas frecuentes para crear FAQ.

**Criterios de Aceptación**:
- Análisis de preguntas similares
- Agrupación automática
- Sección de FAQ generada
- Actualización automática

---

## 2.5 Chat LIA (Asistente IA) (10 RF)

### RF-053: Interfaz de Chat Conversacional
**Descripción**: El sistema debe proporcionar interfaz de chat conversacional con IA (LIA).

**Criterios de Aceptación**:
- Interfaz estilo mensajería moderna
- Burbujas de chat diferenciadas
- Indicador de escritura
- Historial de conversación

**Referencias**: `src/Chat-Online/chat-online.html`, `src/Chat-Online/components/lia-chat.js`

---

### RF-054: Respuestas Contextualizadas
**Descripción**: El sistema debe proporcionar respuestas contextualizadas según el curso y módulo actual.

**Criterios de Aceptación**:
- Integración con contexto de curso
- Conocimiento del progreso del usuario
- Respuestas relevantes al contenido actual
- Sugerencias de contenido relacionado

**Referencias**: `prompts/course-knowledge-prompt.md`, `prompts/course-specific.es.md`

---

### RF-055: Sugerencias de Contenido
**Descripción**: El sistema debe sugerir contenido basado en dudas y patrones de aprendizaje del usuario.

**Criterios de Aceptación**:
- Análisis de preguntas frecuentes
- Identificación de áreas de dificultad
- Sugerencias de videos/módulos relevantes
- Tracking de efectividad de sugerencias

---

### RF-056: Traducción Automática
**Descripción**: El sistema debe soportar traducción automática de consultas entre español e inglés.

**Criterios de Aceptación**:
- Detección automática de idioma
- Traducción transparente para usuario
- Respuestas en idioma del usuario
- Soporte para términos técnicos

---

### RF-057: Historial de Conversaciones
**Descripción**: El sistema debe mantener historial de conversaciones por usuario con búsqueda.

**Criterios de Aceptación**:
- Almacenamiento de todas las conversaciones
- Búsqueda por texto
- Filtrado por fecha y curso
- Retención de 90 días

---

### RF-058: Exportación de Conversaciones
**Descripción**: El sistema debe permitir exportación de conversaciones importantes en TXT/PDF.

**Criterios de Aceptación**:
- Selección de conversaciones específicas
- Exportación en TXT y PDF
- Inclusión de timestamps
- Descarga directa desde interfaz

---

### RF-059: Integración con Sistema de Progreso
**Descripción**: El sistema debe integrar LIA con sistema de progreso para recomendaciones personalizadas.

**Criterios de Aceptación**:
- Acceso a progreso del usuario
- Recomendaciones basadas en progreso
- Identificación de áreas débiles
- Sugerencias de repaso

---

### RF-060: Sugerencias Proactivas
**Descripción**: El sistema debe proporcionar sugerencias proactivas de ayuda basadas en comportamiento.

**Criterios de Aceptación**:
- Detección de pausas prolongadas en videos
- Sugerencias de contenido relacionado
- Ofertas de ayuda contextuales
- No intrusivo

---

### RF-061: Análisis de Sentimientos
**Descripción**: El sistema debe analizar sentimientos en consultas para detectar frustración.

**Criterios de Aceptación**:
- Análisis de tono y lenguaje
- Detección de frustración o confusión
- Escalación a soporte humano si necesario
- Respuestas empáticas

---

### RF-062: Respuestas Personalizadas
**Descripción**: El sistema debe personalizar respuestas según perfil y nivel del usuario.

**Criterios de Aceptación**:
- Adaptación de complejidad de respuestas
- Uso de ejemplos relevantes al usuario
- Consideración de progreso previo
- Tono apropiado al contexto

---

## 2.6 Evaluaciones y Tests (10 RF)

### RF-063: Sistema de Cuestionarios por Módulo
**Descripción**: El sistema debe proporcionar cuestionarios de evaluación por módulo.

**Criterios de Aceptación**:
- Cuestionarios al finalizar cada módulo
- Preguntas de diferentes tipos
- Calificación automática
- Retroalimentación inmediata

---

### RF-064: Preguntas de Opción Múltiple
**Descripción**: El sistema debe soportar preguntas de opción múltiple con 2-6 opciones.

**Criterios de Aceptación**:
- Mínimo 2 opciones, máximo 6
- Una o múltiples respuestas correctas
- Aleatorización de orden de opciones
- Explicación de respuesta correcta

---

### RF-065: Preguntas de Respuesta Libre
**Descripción**: El sistema debe soportar preguntas de respuesta libre con evaluación por IA.

**Criterios de Aceptación**:
- Campo de texto para respuesta
- Evaluación automática con IA
- Comparación con respuestas modelo
- Retroalimentación detallada

---

### RF-066: Evaluaciones Automáticas con IA
**Descripción**: El sistema debe usar IA para evaluar respuestas de texto libre.

**Criterios de Aceptación**:
- Integración con modelo de lenguaje
- Evaluación de contenido y comprensión
- Calificación numérica
- Sugerencias de mejora

---

### RF-067: Retroalimentación Inmediata
**Descripción**: El sistema debe proporcionar retroalimentación inmediata en respuestas.

**Criterios de Aceptación**:
- Indicación de correcto/incorrecto inmediata
- Explicación de respuesta correcta
- Sugerencias de contenido para repasar
- Opción de intentar de nuevo

---

### RF-068: Sistema de Calificaciones
**Descripción**: El sistema debe calcular y mostrar calificaciones y promedios por curso.

**Criterios de Aceptación**:
- Cálculo de promedio por módulo
- Promedio general del curso
- Visualización en dashboard
- Historial de evaluaciones

---

### RF-069: Intentos Limitados por Evaluación
**Descripción**: El sistema debe limitar a máximo 3 intentos por evaluación con cooldown de 24h.

**Criterios de Aceptación**:
- Máximo 3 intentos por evaluación
- Cooldown de 24h tras 3 intentos
- Registro de cada intento
- Mejor calificación prevalece

---

### RF-070: Certificados de Aprobación
**Descripción**: El sistema debe emitir certificados al aprobar evaluaciones con mínimo 70%.

**Criterios de Aceptación**:
- Calificación mínima 70% para aprobar
- Generación automática de certificado
- Descarga en PDF
- Verificación online

---

### RF-071: Análisis de Fortalezas y Debilidades
**Descripción**: El sistema debe analizar fortalezas y debilidades basado en resultados de evaluaciones.

**Criterios de Aceptación**:
- Identificación de temas dominados
- Identificación de áreas de mejora
- Visualización gráfica
- Recomendaciones de estudio

---

### RF-072: Recomendaciones de Estudio
**Descripción**: El sistema debe generar recomendaciones de estudio basadas en resultados.

**Criterios de Aceptación**:
- Análisis de respuestas incorrectas
- Sugerencias de contenido para repasar
- Plan de estudio personalizado
- Seguimiento de mejora

---

## 2.7 Zoom/Eventos Virtuales (12 RF)

### RF-073: Creación de Sesiones de Zoom
**Descripción**: El sistema debe permitir a instructores crear sesiones de Zoom programadas.

**Criterios de Aceptación**:
- Formulario de creación con título, descripción, fecha
- Integración con Zoom API
- Generación automática de enlace
- Envío de invitaciones a estudiantes

**Referencias**: `scripts/init-zoom-db.js`, `scripts/init-zoom-supabase.js`

---

### RF-074: Unión Automática a Sesiones
**Descripción**: El sistema debe permitir unión automática a sesiones programadas con un clic.

**Criterios de Aceptación**:
- Botón de unirse visible en dashboard
- Apertura de Zoom en nueva ventana
- Tracking de asistencia
- Recordatorio 15 minutos antes

---

### RF-075: Grabación de Sesiones
**Descripción**: El sistema debe permitir grabación de sesiones con permisos de host.

**Criterios de Aceptación**:
- Control de grabación para host
- Almacenamiento automático en cloud
- Disponibilidad para estudiantes autorizados
- Retención por 90 días

---

### RF-076: Chat en Tiempo Real
**Descripción**: El sistema debe proporcionar chat en tiempo real durante sesiones de Zoom.

**Criterios de Aceptación**:
- Chat integrado en sesión
- Mensajes visibles para todos
- Opción de mensajes privados
- Moderación por host

---

### RF-077: Compartir Pantalla y Presentaciones
**Descripción**: El sistema debe permitir compartir pantalla y presentaciones durante sesiones.

**Criterios de Aceptación**:
- Compartir pantalla completa o ventana
- Compartir presentaciones
- Control de permisos por host
- Calidad optimizada

---

### RF-078: Salas de Trabajo en Grupos
**Descripción**: El sistema debe permitir crear salas de trabajo en grupos (breakout rooms).

**Criterios de Aceptación**:
- Creación de salas por host
- Asignación automática o manual
- Temporizador para salas
- Reunión de todos al finalizar

---

### RF-079: Encuestas en Vivo
**Descripción**: El sistema debe permitir encuestas en vivo durante sesiones.

**Criterios de Aceptación**:
- Creación de encuestas por host
- Respuestas en tiempo real
- Visualización de resultados
- Exportación de resultados

---

### RF-080: Descarga de Grabaciones
**Descripción**: El sistema debe permitir descarga de grabaciones autorizadas.

**Criterios de Aceptación**:
- Lista de grabaciones disponibles
- Descarga directa o streaming
- Control de permisos
- Calidad seleccionable

---

### RF-081: Calendario Integrado de Eventos
**Descripción**: El sistema debe proporcionar calendario integrado de eventos y sesiones.

**Criterios de Aceptación**:
- Vista de calendario mensual
- Lista de próximas sesiones
- Sincronización con Google Calendar
- Exportación a iCal

---

### RF-082: Recordatorios Automáticos
**Descripción**: El sistema debe enviar recordatorios automáticos de sesiones programadas.

**Criterios de Aceptación**:
- Recordatorio 24h antes
- Recordatorio 15 minutos antes
- Email y notificación in-app
- Opción de agregar a calendario

---

### RF-083: Estadísticas de Asistencia
**Descripción**: El sistema debe generar estadísticas de asistencia a sesiones.

**Criterios de Aceptación**:
- Lista de participantes por sesión
- Tiempo de asistencia de cada estudiante
- Reportes de participación
- Exportación en CSV

---

### RF-084: Evaluaciones Post-Sesión
**Descripción**: El sistema debe permitir evaluaciones post-sesión para feedback.

**Criterios de Aceptación**:
- Formulario de evaluación automático
- Preguntas sobre calidad y utilidad
- Calificación de 1-5 estrellas
- Comentarios opcionales

---

## 2.8 Cargas y Storage (8 RF)

### RF-085: Subida de Archivos de Perfil
**Descripción**: El sistema debe permitir subida de archivos de perfil con validación.

**Criterios de Aceptación**:
- Formatos: JPG, PNG, GIF
- Tamaño máximo: 5MB
- Validación de tipo MIME
- Preview antes de guardar

**Referencias**: `netlify/functions/profile-upload.js`, `setup-supabase-buckets.js`

---

### RF-086: Almacenamiento en Supabase Storage
**Descripción**: El sistema debe usar Supabase Storage para almacenamiento de archivos.

**Criterios de Aceptación**:
- Buckets organizados por tipo
- URLs públicas para acceso
- Políticas de seguridad (RLS)
- CDN para distribución global

---

### RF-087: Compresión Automática de Imágenes
**Descripción**: El sistema debe comprimir automáticamente imágenes para optimizar almacenamiento.

**Criterios de Aceptación**:
- Compresión si > 500KB
- Formatos WebP y AVIF soportados
- Mantenimiento de calidad visual
- Procesamiento en servidor

---

### RF-088: Límites de Tamaño por Tipo
**Descripción**: El sistema debe aplicar límites de tamaño específicos por tipo de archivo.

**Criterios de Aceptación**:
- Imágenes: 5MB máximo
- Videos: 100MB máximo
- Documentos: 10MB máximo
- Rechazo con mensaje claro

---

### RF-089: Gestión de Espacio de Almacenamiento
**Descripción**: El sistema debe gestionar espacio de almacenamiento por usuario (1GB límite).

**Criterios de Aceptación**:
- Tracking de uso por usuario
- Visualización de espacio usado
- Alerta al acercarse al límite
- Opción de eliminar archivos

---

### RF-090: Backup Automático de Archivos
**Descripción**: El sistema debe realizar backup automático de archivos críticos cada 6 horas.

**Criterios de Aceptación**:
- Backup cada 6 horas
- Retención de 30 días
- Almacenamiento redundante
- Proceso de recuperación documentado

---

### RF-091: CDN para Distribución Global
**Descripción**: El sistema debe usar CDN para distribución global de assets y archivos.

**Criterios de Aceptación**:
- Integración con CDN
- Cache de assets estáticos
- Invalidación de cache
- Métricas de rendimiento

---

### RF-092: Limpieza Automática de Archivos Temporales
**Descripción**: El sistema debe limpiar automáticamente archivos temporales tras 24h.

**Criterios de Aceptación**:
- Identificación de archivos temporales
- Limpieza automática diaria
- Logs de limpieza
- Recuperación de espacio

---

## 2.9 Notificaciones (8 RF)

### RF-093: Sistema de Notificaciones en Tiempo Real
**Descripción**: El sistema debe proporcionar notificaciones en tiempo real usando WebSockets.

**Criterios de Aceptación**:
- Notificaciones instantáneas
- Sin necesidad de recargar página
- Indicador visual de nuevas notificaciones
- Sonido opcional

**Referencias**: `server.js` - Socket.IO integration

---

### RF-094: Notificaciones por Email
**Descripción**: El sistema debe enviar notificaciones por email configurables por usuario.

**Criterios de Aceptación**:
- Templates profesionales
- Configuración granular por tipo
- Frecuencia máxima: 3 por día
- Opción de desuscribirse

---

### RF-095: Notificaciones Push en Navegador
**Descripción**: El sistema debe soportar notificaciones push en navegador.

**Criterios de Aceptación**:
- Solicitud de permisos
- Notificaciones incluso con tab cerrado
- Configuración por tipo
- Funcionamiento en Chrome, Firefox, Safari

---

### RF-096: Centro de Notificaciones Unificado
**Descripción**: El sistema debe proporcionar centro de notificaciones unificado.

**Criterios de Aceptación**:
- Lista de todas las notificaciones
- Filtrado por tipo y fecha
- Marcar como leído/no leído
- Eliminar notificaciones

---

### RF-097: Configuración Granular
**Descripción**: El sistema debe permitir configuración granular de tipos de notificación.

**Criterios de Aceptación**:
- Configuración por tipo de evento
- Configuración por canal
- Horarios de no molestar
- Guardado automático

---

### RF-098: Historial de Notificaciones
**Descripción**: El sistema debe mantener historial de notificaciones por 30 días.

**Criterios de Aceptación**:
- Almacenamiento de 30 días
- Búsqueda en historial
- Filtrado por tipo
- Limpieza automática

---

### RF-099: Notificaciones de Progreso
**Descripción**: El sistema debe enviar notificaciones de hitos de progreso.

**Criterios de Aceptación**:
- Notificación al completar módulo
- Notificación al completar curso
- Notificación de nuevos badges
- Celebración visual

---

### RF-100: Recordatorios de Sesiones
**Descripción**: El sistema debe enviar recordatorios de sesiones programadas.

**Criterios de Aceptación**:
- Recordatorio 24h antes
- Recordatorio 15 minutos antes
- Múltiples canales
- Opción de posponer

---

## 2.10 Admin y Dashboard (10 RF)

### RF-101: Panel de Administración Completo
**Descripción**: El sistema debe proporcionar panel de administración completo para gestión.

**Criterios de Aceptación**:
- Dashboard con métricas clave
- Acceso solo para rol admin
- Navegación intuitiva
- Responsive design

**Referencias**: `src/admin/admin.html`, `src/admin/admin.js`

---

### RF-102: Gestión de Usuarios y Roles
**Descripción**: El sistema debe permitir gestión completa de usuarios y roles.

**Criterios de Aceptación**:
- Lista de usuarios con filtros
- Cambio de roles
- Suspensión/activación de cuentas
- Historial de cambios

---

### RF-103: Estadísticas de Uso
**Descripción**: El sistema debe mostrar estadísticas de uso de la plataforma.

**Criterios de Aceptación**:
- Usuarios activos diarios/mensuales
- Cursos más populares
- Tasa de completado
- Gráficos visuales

---

### RF-104: Monitoreo de Rendimiento
**Descripción**: El sistema debe proporcionar monitoreo de rendimiento del sistema.

**Criterios de Aceptación**:
- Métricas de CPU, memoria, disco
- Tiempo de respuesta de APIs
- Alertas por umbrales
- Dashboards en tiempo real

---

### RF-105: Gestión de Contenido y Cursos
**Descripción**: El sistema debe permitir gestión completa de contenido y cursos.

**Criterios de Aceptación**:
- CRUD de cursos
- CRUD de módulos y videos
- Asignación de instructores
- Publicación/despublicación

---

### RF-106: Herramientas de Moderación
**Descripción**: El sistema debe proporcionar herramientas de moderación para comunidad.

**Criterios de Aceptación**:
- Queue de contenido reportado
- Herramientas de edición/eliminación
- Historial de acciones
- Estadísticas de moderación

---

### RF-107: Reportes de Actividad
**Descripción**: El sistema debe generar reportes de actividad de usuarios.

**Criterios de Aceptación**:
- Reportes por usuario
- Reportes por curso
- Exportación en múltiples formatos
- Programación de reportes

---

### RF-108: Configuración Global
**Descripción**: El sistema debe permitir configuración global de la plataforma.

**Criterios de Aceptación**:
- Configuración de límites
- Configuración de notificaciones
- Configuración de integraciones
- Validación de cambios

---

### RF-109: Logs de Auditoría
**Descripción**: El sistema debe mantener logs de auditoría del sistema.

**Criterios de Aceptación**:
- Registro de todas las acciones admin
- Búsqueda y filtrado
- Retención de 6 meses
- Exportación de logs

---

### RF-110: Gestión de Espacios de Almacenamiento
**Descripción**: El sistema debe permitir gestión de espacios de almacenamiento.

**Criterios de Aceptación**:
- Visualización de uso por usuario
- Limpieza de archivos temporales
- Políticas de retención
- Alertas de límites

---

## 2.11 Analytics y Reportes (10 RF)

### RF-111: Dashboard de Métricas de Usuario
**Descripción**: El sistema debe proporcionar dashboard personal de métricas para cada usuario.

**Criterios de Aceptación**:
- Progreso por curso
- Tiempo invertido
- Logros obtenidos
- Comparativa con promedios

---

### RF-112: Reportes de Progreso por Curso
**Descripción**: El sistema debe generar reportes detallados de progreso por curso.

**Criterios de Aceptación**:
- Progreso por módulo
- Calificaciones de evaluaciones
- Tiempo invertido
- Exportación en PDF

---

### RF-113: Análisis de Engagement
**Descripción**: El sistema debe analizar engagement de contenido.

**Criterios de Aceptación**:
- Métricas de visualización por video
- Tasa de completado por módulo
- Puntos de abandono
- Recomendaciones de mejora

---

### RF-114: Métricas de Retención
**Descripción**: El sistema debe calcular métricas de retención de usuarios.

**Criterios de Aceptación**:
- Retención a 7, 30, 90 días
- Cohort analysis
- Identificación de churn
- Gráficos de tendencias

---

### RF-115: Reportes de Rendimiento de Instructores
**Descripción**: El sistema debe generar reportes de rendimiento de instructores.

**Criterios de Aceptación**:
- Calificaciones de estudiantes
- Tasa de completado de cursos
- Engagement en comunidad
- Comparativa con otros instructores

---

### RF-116: Análisis de Popularidad de Contenido
**Descripción**: El sistema debe analizar popularidad de contenido.

**Criterios de Aceptación**:
- Ranking de cursos más populares
- Videos más vistos
- Temas más buscados
- Tendencias temporales

---

### RF-117: Exportación de Reportes
**Descripción**: El sistema debe permitir exportación de reportes en múltiples formatos.

**Criterios de Aceptación**:
- Formatos: PDF, CSV, Excel
- Selección de métricas
- Rango de fechas configurable
- Descarga directa o email

---

### RF-118: Alertas Automáticas de Métricas
**Descripción**: El sistema debe generar alertas automáticas de métricas críticas.

**Criterios de Aceptación**:
- Configuración de umbrales
- Alertas por email/Slack
- Escalación automática
- Historial de alertas

---

### RF-119: Comparativas de Rendimiento Temporal
**Descripción**: El sistema debe proporcionar comparativas de rendimiento temporal.

**Criterios de Aceptación**:
- Comparación mes a mes
- Comparación año a año
- Identificación de tendencias
- Visualización gráfica

---

### RF-120: Predicciones de Finalización
**Descripción**: El sistema debe predecir probabilidad de finalización de cursos.

**Criterios de Aceptación**:
- Modelo de ML para predicción
- Factores considerados
- Intervenciones sugeridas
- Tracking de precisión

---

## 2.12 Integraciones Externas (8 RF)

### RF-121: Integración con Google Workspace
**Descripción**: El sistema debe integrarse con Google Workspace para autenticación y calendario.

**Criterios de Aceptación**:
- OAuth con Google
- Sincronización de calendario
- Importación de contactos
- SSO para organizaciones

---

### RF-122: Conexión con Sistemas LMS
**Descripción**: El sistema debe conectarse con sistemas LMS existentes.

**Criterios de Aceptación**:
- Soporte para SCORM
- Soporte para xAPI (Tin Can)
- Sincronización de progreso
- Exportación de calificaciones

---

### RF-123: API REST para Integraciones
**Descripción**: El sistema debe proporcionar API REST documentada para integraciones personalizadas.

**Criterios de Aceptación**:
- Documentación OpenAPI
- Autenticación con API keys
- Rate limiting
- Versionado de API

**Referencias**: `netlify.toml` - API redirects

---

### RF-124: Webhooks para Eventos
**Descripción**: El sistema debe proporcionar webhooks para eventos del sistema.

**Criterios de Aceptación**:
- Configuración de webhooks
- Eventos soportados
- Retry con backoff exponencial
- Logs de entregas

---

### RF-125: Integración con Servicios de Email
**Descripción**: El sistema debe integrarse con servicios de email para envíos masivos.

**Criterios de Aceptación**:
- Integración con SendGrid/Mailgun
- Templates personalizables
- Tracking de aperturas y clicks
- Gestión de rebotes

---

### RF-126: Conexión con Plataformas de Video
**Descripción**: El sistema debe conectarse con plataformas de video (YouTube, Vimeo).

**Criterios de Aceptación**:
- Embed de videos
- Tracking de visualización
- Subtítulos automáticos
- Calidad adaptativa

---

### RF-127: Integración con Sistemas de Pago
**Descripción**: El sistema debe integrarse con sistemas de pago para monetización.

**Criterios de Aceptación**:
- Stripe/PayPal integration
- Múltiples monedas
- Subscripciones recurrentes
- Reportes financieros

---

### RF-128: APIs para Aplicaciones Móviles
**Descripción**: El sistema debe proporcionar APIs optimizadas para aplicaciones móviles.

**Criterios de Aceptación**:
- Endpoints optimizados
- Respuestas comprimidas
- Soporte para offline
- Push notifications

---

## 2.13 Internacionalización y Accesibilidad (8 RF)

### RF-129: Soporte Multiidioma
**Descripción**: El sistema debe soportar múltiples idiomas (español, inglés).

**Criterios de Aceptación**:
- Traducción de interfaz completa
- Detección automática de idioma
- Selector de idioma visible
- Persistencia de preferencia

---

### RF-130: Traducción Automática de Contenido
**Descripción**: El sistema debe proporcionar traducción automática de contenido.

**Criterios de Aceptación**:
- Integración con servicio de traducción
- Traducción de preguntas/respuestas
- Calidad aceptable
- Indicador de contenido traducido

---

### RF-131: Soporte para Lectores de Pantalla
**Descripción**: El sistema debe ser compatible con lectores de pantalla (WCAG 2.1 AA).

**Criterios de Aceptación**:
- Atributos ARIA correctos
- Navegación por teclado completa
- Anuncios de cambios dinámicos
- Testing con NVDA/JAWS

---

### RF-132: Navegación por Teclado Completa
**Descripción**: El sistema debe permitir navegación completa por teclado.

**Criterios de Aceptación**:
- Todos los elementos accesibles por teclado
- Orden de tabulación lógico
- Atajos de teclado documentados
- Indicadores de foco visibles

---

### RF-133: Contraste de Colores Accesible
**Descripción**: El sistema debe mantener contraste de colores mínimo 4.5:1 (WCAG AA).

**Criterios de Aceptación**:
- Contraste mínimo 4.5:1 para texto normal
- Contraste mínimo 3:1 para texto grande
- Validación con herramientas
- Modo de alto contraste disponible

**Referencias**: `src/styles/main.css` - paleta de colores con contraste verificado

---

### RF-134: Textos Alternativos en Imágenes
**Descripción**: El sistema debe proporcionar textos alternativos descriptivos en todas las imágenes.

**Criterios de Aceptación**:
- Alt text en todas las imágenes
- Descripciones significativas
- Imágenes decorativas marcadas
- Validación automática

---

### RF-135: Subtítulos en Videos
**Descripción**: El sistema debe proporcionar subtítulos en todos los videos.

**Criterios de Aceptación**:
- Subtítulos en español
- Subtítulos en inglés opcionales
- Sincronización precisa
- Formato WebVTT

---

### RF-136: Configuración de Tamaño de Fuente
**Descripción**: El sistema debe permitir configuración de tamaño de fuente (100%-200%).

**Criterios de Aceptación**:
- Selector de tamaño de fuente
- Rango 100%-200%
- Sin ruptura de layout
- Persistencia de preferencia

---

## 2.14 Soporte y Feedback (8 RF)

### RF-137: Sistema de Tickets de Soporte
**Descripción**: El sistema debe proporcionar sistema de tickets para soporte técnico.

**Criterios de Aceptación**:
- Creación de tickets por usuarios
- Categorización por tipo
- Asignación automática
- Tracking de estado

---

### RF-138: Chat en Vivo con Soporte
**Descripción**: El sistema debe proporcionar chat en vivo con soporte técnico.

**Criterios de Aceptación**:
- Widget de chat accesible
- Horario de atención visible
- Queue de espera
- Historial de conversaciones

---

### RF-139: Base de Conocimientos Integrada
**Descripción**: El sistema debe proporcionar base de conocimientos con artículos de ayuda.

**Criterios de Aceptación**:
- Artículos categorizados
- Búsqueda en base de conocimientos
- Votación de utilidad
- Sugerencias contextuales

---

### RF-140: Sistema de Feedback de Usuarios
**Descripción**: El sistema debe permitir envío de feedback y sugerencias.

**Criterios de Aceptación**:
- Formulario de feedback
- Categorización de sugerencias
- Votación de sugerencias
- Roadmap público

---

### RF-141: Reportes de Bugs Automáticos
**Descripción**: El sistema debe capturar y reportar bugs automáticamente.

**Criterios de Aceptación**:
- Captura de errores JavaScript
- Stack traces completos
- Contexto del usuario
- Integración con sistema de tracking

---

### RF-142: Centro de Ayuda Contextual
**Descripción**: El sistema debe proporcionar ayuda contextual en cada página.

**Criterios de Aceptación**:
- Botón de ayuda visible
- Contenido relevante a página actual
- Videos tutoriales
- Enlaces a documentación

---

### RF-143: Tutoriales Interactivos
**Descripción**: El sistema debe proporcionar tutoriales interactivos para nuevos usuarios.

**Criterios de Aceptación**:
- Tour guiado al primer login
- Tooltips contextuales
- Opción de saltar
- Posibilidad de repetir

---

### RF-144: FAQ Dinámico
**Descripción**: El sistema debe generar FAQ dinámico basado en consultas frecuentes.

**Criterios de Aceptación**:
- Análisis de preguntas frecuentes
- Actualización automática
- Categorización por tema
- Búsqueda en FAQ

---

## 2.15 Búsqueda y Filtrado (8 RF)

### RF-145: Búsqueda Global
**Descripción**: El sistema debe proporcionar búsqueda global en toda la plataforma.

**Criterios de Aceptación**:
- Búsqueda en cursos, comunidad, usuarios
- Resultados agrupados por tipo
- Autocompletado
- Historial de búsquedas

---

### RF-146: Filtros Avanzados
**Descripción**: El sistema debe proporcionar filtros avanzados por tipo de contenido.

**Criterios de Aceptación**:
- Filtros por categoría
- Filtros por fecha
- Filtros por autor
- Filtros combinables

---

### RF-147: Búsqueda Semántica con IA
**Descripción**: El sistema debe proporcionar búsqueda semántica usando IA.

**Criterios de Aceptación**:
- Comprensión de intención
- Resultados relevantes semánticamente
- Sugerencias de búsqueda
- Mejora continua

---

### RF-148: Autocompletado en Búsquedas
**Descripción**: El sistema debe proporcionar autocompletado en búsquedas.

**Criterios de Aceptación**:
- Sugerencias mientras se escribe
- Basado en búsquedas populares
- Basado en historial personal
- Rápido (< 100ms)

---

### RF-149: Historial de Búsquedas
**Descripción**: El sistema debe mantener historial de búsquedas del usuario.

**Criterios de Aceptación**:
- Almacenamiento de últimas 50 búsquedas
- Opción de limpiar historial
- Sugerencias basadas en historial
- Privacidad respetada

---

### RF-150: Sugerencias de Búsqueda Inteligentes
**Descripción**: El sistema debe proporcionar sugerencias de búsqueda inteligentes.

**Criterios de Aceptación**:
- Corrección de ortografía
- Sinónimos y términos relacionados
- Búsquedas populares
- Personalización

---

### RF-151: Filtros por Fecha, Autor, Popularidad
**Descripción**: El sistema debe permitir filtrado por fecha, autor y popularidad.

**Criterios de Aceptación**:
- Ordenamiento por fecha
- Filtro por autor específico
- Ordenamiento por popularidad
- Combinación de filtros

---

### RF-152: Búsqueda en Contenido de Videos
**Descripción**: El sistema debe permitir búsqueda en transcripciones de videos.

**Criterios de Aceptación**:
- Transcripción automática de videos
- Búsqueda en transcripciones
- Resultados con timestamp
- Navegación directa a momento

---

## Referencias de Código

Los requisitos funcionales están implementados en los siguientes archivos principales:

- **Autenticación**: `server.js:468-495`, `netlify/functions/login.js`, `src/login/new-auth.html`
- **Progreso**: `src/scripts/course-progress-manager-v2.js`, `netlify/functions/progress-sync.js`
- **Comunidad**: `src/Community/community.js`, `netlify/functions/community-*.js`
- **Chat LIA**: `src/Chat-Online/components/lia-chat.js`, `netlify/functions/openai.js`
- **Administración**: `src/admin/admin.js`, `src/admin/admin.html`

---

**Documento:** PRD 02 - Requisitos Funcionales  
**Total de Requisitos:** 152 RF  
**Versión:** 1.0  
**Fecha:** Enero 2025  
**Autor:** Equipo de Desarrollo Chat-Bot-LIA
