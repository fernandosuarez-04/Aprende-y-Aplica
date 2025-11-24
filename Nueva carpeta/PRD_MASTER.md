# Product Requirements Document (PRD) - Chat-Bot-LIA

## Documento Maestro Completo

**Versión:** 1.0  
**Fecha:** Enero 2025  
**Autor:** Equipo de Desarrollo Chat-Bot-LIA  
**Estado:** Completo y Aprobado

---

## Tabla de Contenidos

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Requisitos Funcionales](#2-requisitos-funcionales)
3. [Requisitos No Funcionales](#3-requisitos-no-funcionales)
4. [Reglas de Negocio](#4-reglas-de-negocio)
5. [Diseño y UX](#5-diseño-y-ux)
6. [Arquitectura Técnica](#6-arquitectura-técnica)
7. [Historias de Usuario](#7-historias-de-usuario)
8. [Roadmap y Priorización](#8-roadmap-y-priorizacion)
9. [Métricas de Éxito](#9-metricas-de-exito)
10. [Glosario](#10-glosario)

---

## 1. Resumen Ejecutivo

### 1.1 Visión del Producto

**Chat-Bot-LIA** es una plataforma educativa de vanguardia que combina inteligencia artificial, aprendizaje interactivo y gestión de cursos para ofrecer una experiencia de aprendizaje personalizada y efectiva en el campo de la inteligencia artificial y tecnologías emergentes.

### 1.2 Propuesta de Valor

- **Aprendizaje Personalizado**: IA que se adapta al ritmo y estilo de cada estudiante
- **Asistente Virtual 24/7**: LIA proporciona soporte inmediato en cualquier momento
- **Progreso Granular**: Tracking detallado de avance por módulo y video
- **Comunidad Activa**: Q&A, votación y colaboración entre estudiantes
- **Certificaciones Reconocidas**: Certificados verificables al completar cursos
- **Clases Virtuales**: Integración con Zoom para sesiones en vivo

### 1.3 Objetivos Estratégicos

1. **Democratizar el Acceso**: Hacer accesible la educación en IA a profesionales de todas las áreas
2. **Calidad Educativa**: Mantener estándares de excelencia en contenido y metodología
3. **Engagement Alto**: Lograr tasas de completado superiores al 70%
4. **Escalabilidad**: Soportar hasta 10,000 usuarios concurrentes
5. **Innovación Continua**: Incorporar nuevas tecnologías y metodologías

### 1.4 Stakeholders

#### Usuarios Principales
- **Estudiantes**: Profesionales buscando upskilling en IA
- **Instructores**: Expertos creando y dictando cursos
- **Administradores**: Gestión de plataforma y contenido
- **Moderadores**: Mantenimiento de calidad de comunidad
- **Soporte Técnico**: Asistencia a usuarios

#### Stakeholders Secundarios
- **Organizaciones Corporativas**: Clientes B2B para capacitación empresarial
- **Instituciones Educativas**: Alianzas académicas
- **Proveedores de Tecnología**: OpenAI, Zoom, Supabase, Netlify

### 1.5 Alcance del Proyecto

#### En Scope
- ✅ Plataforma web completa (desktop-first)
- ✅ Sistema de autenticación y perfiles
- ✅ Gestión completa de cursos y progreso
- ✅ Chat con IA (LIA) contextual
- ✅ Comunidad Q&A con votación
- ✅ Evaluaciones automáticas
- ✅ Integración Zoom para clases virtuales
- ✅ Sistema de certificaciones
- ✅ Panel de administración completo
- ✅ Analytics y reportes

#### Out of Scope (Fase 1)
- ❌ Aplicaciones móviles nativas (iOS/Android)
- ❌ Realidad Virtual/Aumentada
- ❌ Blockchain para certificados
- ❌ Sistema de pagos (monetización futura)
- ❌ Marketplace de cursos de terceros

### 1.6 Métricas Clave

#### Métricas de Producto
- **Usuarios Activos Mensuales (MAU)**: Objetivo 5,000 en 6 meses
- **Tasa de Completado de Cursos**: Objetivo 70%+
- **Engagement Diario**: Promedio 45 minutos por sesión
- **Net Promoter Score (NPS)**: Objetivo 50+

#### Métricas Técnicas
- **Uptime**: 99.9% (máximo 8.77h downtime/año)
- **Tiempo de Respuesta API**: P95 < 500ms
- **Tiempo de Carga Inicial**: < 3s en 3G
- **Tasa de Error**: < 0.1%

#### Métricas de Negocio
- **Costo por Usuario Activo**: < $5/mes
- **Retención a 30 días**: > 60%
- **Satisfacción de Usuario**: > 4.5/5

### 1.7 Documentos Relacionados

Este PRD maestro consolida los siguientes documentos detallados:

1. **PRD_01_RESUMEN_EJECUTIVO.md** - Visión, misión y contexto general
2. **PRD_02_REQUISITOS_FUNCIONALES.md** - 152 requisitos funcionales detallados
3. **PRD_03_REQUISITOS_NO_FUNCIONALES.md** - 120 requisitos no funcionales
4. **PRD_04_REGLAS_NEGOCIO.md** - 85 reglas de negocio del sistema
5. **PRD_05_DISENO_UX.md** - Paleta de colores, tipografía y componentes
6. **PRD_06_ARQUITECTURA_TECNICA.md** - Stack, base de datos, APIs y deployment
7. **PRD_07_HISTORIAS_USUARIO.md** - 105 historias de usuario con criterios de aceptación

---

## 2. Requisitos Funcionales

### 2.1 Resumen de Requisitos Funcionales

El sistema Chat-Bot-LIA cuenta con **152 requisitos funcionales** organizados en 15 módulos:

| Módulo | Cantidad | Prioridad |
|--------|----------|-----------|
| Autenticación y Sesiones | 12 RF | Must Have |
| Gestión de Perfil | 12 RF | Must Have |
| Cursos y Progreso | 14 RF | Must Have |
| Comunidad Q&A | 14 RF | Must Have |
| Chat LIA | 10 RF | Must Have |
| Evaluaciones y Tests | 10 RF | Must Have |
| Zoom/Eventos Virtuales | 12 RF | Should Have |
| Storage y Cargas | 8 RF | Should Have |
| Notificaciones | 8 RF | Should Have |
| Admin y Dashboard | 10 RF | Must Have |
| Analytics y Reportes | 10 RF | Should Have |
| Integraciones Externas | 8 RF | Should Have |
| Internacionalización | 8 RF | Could Have |
| Soporte y Feedback | 8 RF | Should Have |
| Búsqueda y Filtrado | 8 RF | Should Have |

### 2.2 Requisitos Funcionales Críticos (Top 10)

#### RF-001: Sistema de Login con Credenciales
Autenticación de usuarios mediante email/username y contraseña con hash bcrypt (mínimo 12 rounds).

#### RF-003: Gestión de Tokens JWT
Crear, validar y renovar tokens JWT Bearer con verificación de fingerprint de dispositivo.

#### RF-025: Inicialización Automática de Progreso
Inicializar automáticamente el progreso de curso al inscribirse un usuario.

#### RF-026: Actualización Granular de Progreso
Permitir actualización granular de progreso por módulo y video.

#### RF-039: Listado Paginado de Preguntas
Mostrar listado paginado de preguntas con filtros y ordenamiento.

#### RF-053: Interfaz de Chat Conversacional
Proporcionar interfaz de chat conversacional con IA (LIA).

#### RF-063: Sistema de Cuestionarios por Módulo
Proporcionar cuestionarios de evaluación por módulo.

#### RF-073: Creación de Sesiones de Zoom
Permitir a instructores crear sesiones de Zoom programadas.

#### RF-101: Panel de Administración Completo
Proporcionar panel de administración completo para gestión.

#### RF-145: Búsqueda Global
Proporcionar búsqueda global en toda la plataforma.

**Para detalles completos de los 152 requisitos funcionales, consultar: `PRD_02_REQUISITOS_FUNCIONALES.md`**

---

## 3. Requisitos No Funcionales

### 3.1 Resumen de Requisitos No Funcionales

El sistema cuenta con **120 requisitos no funcionales** organizados en 11 categorías:

| Categoría | Cantidad | Prioridad |
|-----------|----------|-----------|
| Seguridad | 12 RNF | Must Have |
| Rendimiento | 12 RNF | Must Have |
| Escalabilidad | 12 RNF | Must Have |
| Disponibilidad | 12 RNF | Must Have |
| Mantenibilidad | 12 RNF | Should Have |
| Observabilidad | 12 RNF | Should Have |
| Usabilidad y Accesibilidad | 12 RNF | Must Have |
| Privacidad y Legal | 10 RNF | Must Have |
| Portabilidad | 8 RNF | Should Have |
| Fiabilidad y Resiliencia | 10 RNF | Must Have |
| Operación y DevOps | 8 RNF | Should Have |

### 3.2 Requisitos No Funcionales Críticos

#### Seguridad
- **RNF-001**: JWT con verificación de fingerprint y TTL deslizante de 24h
- **RNF-002**: Hash bcrypt con salt mínimo de 12 rounds
- **RNF-008**: Headers de seguridad (CSP, HSTS, X-Frame-Options)

#### Rendimiento
- **RNF-013**: Tiempo de respuesta API con p95 < 500ms y p99 < 1s
- **RNF-014**: Tiempo de carga inicial < 3 segundos en conexión 3G
- **RNF-021**: Cache de 5 minutos para consultas frecuentes

#### Escalabilidad
- **RNF-025**: Arquitectura serverless (Netlify Functions) + backend Express
- **RNF-027**: Horizontal scaling automático hasta 1000 usuarios concurrentes

#### Disponibilidad
- **RNF-037**: Uptime objetivo 99.9% (máximo 8.77h downtime/año)
- **RNF-041**: Backup automático diario con RPO < 1 hora

#### Usabilidad
- **RNF-073**: Interfaz completa en español con soporte a inglés
- **RNF-077**: Contraste de colores mínimo 4.5:1 (WCAG AA)

**Para detalles completos de los 120 requisitos no funcionales, consultar: `PRD_03_REQUISITOS_NO_FUNCIONALES.md`**

---

## 4. Reglas de Negocio

### 4.1 Resumen de Reglas de Negocio

El sistema cuenta con **85 reglas de negocio** organizadas en 14 categorías:

| Categoría | Cantidad |
|-----------|----------|
| Identidad y Autenticación | 8 reglas |
| Gestión de Perfiles | 7 reglas |
| Progreso de Cursos | 9 reglas |
| Sistema de Comunidad | 8 reglas |
| Chat LIA y Asistencia IA | 6 reglas |
| Evaluaciones y Tests | 6 reglas |
| Zoom y Eventos Virtuales | 6 reglas |
| Storage y Cargas | 6 reglas |
| Notificaciones | 5 reglas |
| Administración y Moderación | 5 reglas |
| Analytics y Métricas | 5 reglas |
| Integración y APIs | 4 reglas |
| Políticas de Retención | 5 reglas |
| Límites de Sistema | 5 reglas |

### 4.2 Reglas de Negocio Críticas

#### RN-001: Unicidad de Username y Email
Los campos `username` y `email` deben ser únicos globalmente en el sistema.

#### RN-003: Headers Obligatorios para Autenticación
Las sesiones autenticadas requieren headers `Authorization: Bearer <token>` y `x-user-id` obligatorios.

#### RN-016: Registro Único de Curso por Usuario
Un registro único de curso por usuario y curso (`unique_user_course`).

#### RN-019: Umbral de Completado 90%
Video se considera completado al alcanzar ≥90% de reproducción.

#### RN-021: Desbloqueo Progresivo
Módulo N+1 se desbloquea al completar módulo N al 100%.

#### RN-027: Un Voto por Usuario
Un voto por usuario por pregunta/respuesta (no duplicados).

#### RN-041: Calificación Mínima para Aprobar
Calificación mínima de 70% para aprobar módulo.

#### RN-051: Límite de Almacenamiento por Usuario
Límite de almacenamiento de 1GB por usuario para archivos de perfil.

#### RN-072: Rate Limiting de API
Rate limiting de API con límite de 1000 requests/hora por usuario autenticado.

**Para detalles completos de las 85 reglas de negocio, consultar: `PRD_04_REGLAS_NEGOCIO.md`**

---

## 5. Diseño y UX

### 5.1 Paleta de Colores Oficial

#### Colores Primarios

| Color | Hex | RGB | Uso |
|-------|-----|-----|-----|
| **Turquesa IA** | `#44E5FF` | `rgb(68, 229, 255)` | CTA, iconos, links |
| **Carbón Digital** | `#0A0A0A` | `rgb(10, 10, 10)` | Fondos, headers |
| **Gris Neblina** | `#F2F2F2` | `rgb(242, 242, 242)` | Superficies claras |
| **Blanco Puro** | `#FFFFFF` | `rgb(255, 255, 255)` | Texto sobre oscuro |
| **Azul Profundo** | `#0077A6` | `rgb(0, 119, 166)` | Hover, badges |

#### Colores Semánticos

| Color | Hex | Uso |
|-------|-----|-----|
| **Éxito** | `#10B981` | Confirmaciones, completado |
| **Advertencia** | `#F59E0B` | Alertas, atención |
| **Error** | `#EF4444` | Errores, destructivas |
| **Información** | `#3B82F6` | Mensajes informativos |

### 5.2 Tipografía

#### Familias Tipográficas
- **Montserrat**: Headings (H1, H2) - Pesos 700, 800
- **Inter**: Body text - Pesos 400, 500

#### Jerarquía Tipográfica
- **H1**: 32px, ExtraBold (800)
- **H2**: 24px, ExtraBold (800)
- **Body**: 16px, Regular (400)
- **Small**: 14px, Regular (400)
- **Large**: 18px, Medium (500)

### 5.3 Componentes de UI

#### Botones
- **Primario**: Gradiente turquesa, sombra, hover con elevación
- **Secundario**: Borde turquesa, transparente, hover con fondo
- **Texto**: Sin fondo, solo color turquesa

#### Tarjetas
- **Básica**: Fondo oscuro con glassmorphism, borde sutil
- **Módulo**: Con indicadores de estado (locked, in_progress, completed)

#### Inputs
- **Texto**: Fondo translúcido, borde sutil, focus con turquesa
- **Textarea**: Similar a texto, altura mínima 120px
- **Select**: Con cursor pointer

### 5.4 Accesibilidad

- **Contraste**: Mínimo 4.5:1 para texto normal (WCAG AA)
- **Navegación por Teclado**: Completa en todos los elementos
- **ARIA Labels**: En todos los elementos interactivos
- **Focus Visible**: Outline turquesa de 2px

**Para detalles completos de diseño y UX, consultar: `PRD_05_DISENO_UX.md`**

---

## 6. Arquitectura Técnica

### 6.1 Stack Tecnológico

#### Frontend
- **Core**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Librerías**: Font Awesome 6, Socket.IO Client
- **Build**: Webpack, Babel, PostCSS

#### Backend
- **Runtime**: Node.js v18+
- **Framework**: Express.js v4.18+
- **Real-time**: Socket.IO v4.5+
- **Seguridad**: Helmet.js, bcrypt, jsonwebtoken

#### Base de Datos
- **Primary**: PostgreSQL v14+ (Supabase)
- **Client**: pg (Node.js PostgreSQL client)
- **Features**: RLS, Triggers, Connection Pooling

#### Servicios Externos
- **AI**: OpenAI API (GPT-4)
- **Email**: SendGrid/Mailgun
- **Video Conferencing**: Zoom API
- **Auth**: Google OAuth

#### DevOps
- **Hosting**: Netlify (frontend + functions)
- **Database**: Supabase
- **CI/CD**: GitHub Actions
- **Monitoring**: Grafana

### 6.2 Arquitectura del Sistema

```
Frontend (Netlify) → Netlify Functions → Express Server → PostgreSQL (Supabase)
                                      ↓
                              External Services (OpenAI, Zoom, Email)
```

### 6.3 Base de Datos

#### Tablas Principales
- **users**: Usuarios del sistema
- **courses**: Catálogo de cursos
- **course_modules**: Módulos de cursos
- **module_videos**: Videos por módulo
- **course_progress**: Progreso de usuario en cursos
- **module_progress**: Progreso por módulo
- **video_progress**: Progreso por video
- **community_questions**: Preguntas de comunidad
- **community_answers**: Respuestas a preguntas
- **community_votes**: Votos en preguntas/respuestas
- **chat_history**: Historial de conversaciones con IA
- **zoom_sessions**: Sesiones de Zoom programadas

#### Triggers Automáticos
- **update_course_progress**: Actualiza progreso de curso basado en módulos
- **unlock_next_module**: Desbloquea siguiente módulo al completar actual
- **update_vote_count**: Actualiza contadores de votos automáticamente

### 6.4 APIs y Endpoints

#### Netlify Functions
- `/api/openai` - Chat con IA
- `/api/login` - Autenticación
- `/api/progress/sync` - Sincronización de progreso
- `/api/community-questions` - Comunidad Q&A
- `/api/update-profile` - Actualización de perfil

#### Express Server
- `/api/auth/*` - Autenticación y usuarios
- `/api/courses/*` - Gestión de cursos
- `/api/community/*` - Comunidad
- `/api/admin/*` - Administración
- `/health` - Health check

### 6.5 Seguridad

- **Content Security Policy (CSP)**: Configurado con Helmet.js
- **Rate Limiting**: 100 requests/15min general, 5 requests/15min login
- **CORS**: Configurado para dominios específicos
- **JWT**: Con fingerprint de dispositivo
- **bcrypt**: 12+ rounds para contraseñas
- **RLS**: Row Level Security en todas las tablas

**Para detalles completos de arquitectura técnica, consultar: `PRD_06_ARQUITECTURA_TECNICA.md`**

---

## 7. Historias de Usuario

### 7.1 Resumen de Historias de Usuario

El sistema cuenta con **105 historias de usuario** organizadas por tipo de usuario:

| Tipo de Usuario | Cantidad | % del Total |
|-----------------|----------|-------------|
| Visitante/No Registrado | 5 | 5% |
| Usuario Registrado/Estudiante | 25 | 24% |
| Instructor/Profesor | 10 | 10% |
| Moderador | 10 | 10% |
| Administrador | 15 | 14% |
| Soporte Técnico | 5 | 5% |
| Funcionalidades Avanzadas | 35 | 33% |

### 7.2 Priorización MoSCoW

| Prioridad | Cantidad | % del Total |
|-----------|----------|-------------|
| **Must Have** | 45 | 43% |
| **Should Have** | 18 | 17% |
| **Could Have** | 37 | 35% |
| **Won't Have** | 5 | 5% |

### 7.3 Historias de Usuario Críticas (Top 10)

#### US001: Explorar Cursos Disponibles
**Como** visitante no registrado  
**Quiero** explorar el catálogo de cursos disponibles  
**Para** decidir si quiero registrarme en la plataforma  
**Prioridad**: Must Have

#### US002: Registrarse en la Plataforma
**Como** visitante no registrado  
**Quiero** registrarme en la plataforma con mi email  
**Para** acceder a los cursos y funcionalidades  
**Prioridad**: Must Have

#### US007: Inscribirse en un Curso
**Como** estudiante  
**Quiero** inscribirme en un curso disponible  
**Para** comenzar mi aprendizaje  
**Prioridad**: Must Have

#### US008: Ver Contenido de Video
**Como** estudiante  
**Quiero** ver los videos del curso  
**Para** aprender el contenido educativo  
**Prioridad**: Must Have

#### US009: Trackear Progreso de Curso
**Como** estudiante  
**Quiero** ver mi progreso en el curso  
**Para** saber cuánto he avanzado y qué me falta  
**Prioridad**: Must Have

#### US010: Chatear con LIA (Asistente IA)
**Como** estudiante  
**Quiero** chatear con LIA para resolver dudas  
**Para** obtener ayuda inmediata durante mi aprendizaje  
**Prioridad**: Must Have

#### US013: Realizar Evaluaciones de Módulo
**Como** estudiante  
**Quiero** realizar evaluaciones al finalizar módulos  
**Para** verificar mi comprensión del contenido  
**Prioridad**: Must Have

#### US015: Participar en Comunidad Q&A
**Como** estudiante  
**Quiero** hacer preguntas en la comunidad  
**Para** resolver dudas con ayuda de otros estudiantes e instructores  
**Prioridad**: Must Have

#### US032: Crear y Editar Cursos
**Como** instructor  
**Quiero** crear y editar cursos  
**Para** ofrecer contenido educativo a los estudiantes  
**Prioridad**: Must Have

#### US051: Ver Dashboard de Administración
**Como** administrador  
**Quiero** ver un dashboard completo del sistema  
**Para** monitorear la salud y métricas de la plataforma  
**Prioridad**: Must Have

**Para detalles completos de las 105 historias de usuario, consultar: `PRD_07_HISTORIAS_USUARIO.md`**

---

## 8. Roadmap y Priorización

### 8.1 Roadmap de Desarrollo

#### Fase 1: MVP (Meses 1-3) - COMPLETADO ✅
- ✅ Autenticación y gestión de usuarios
- ✅ Sistema de cursos y progreso
- ✅ Chat con IA (LIA)
- ✅ Comunidad Q&A básica
- ✅ Panel de administración
- ✅ Deployment en Netlify

#### Fase 2: Mejoras Core (Meses 4-6) - EN PROGRESO 🔄
- 🔄 Sistema de evaluaciones automáticas
- 🔄 Integración Zoom completa
- 🔄 Sistema de certificaciones
- 🔄 Analytics y reportes avanzados
- 🔄 Optimización de rendimiento

#### Fase 3: Funcionalidades Avanzadas (Meses 7-9) - PLANIFICADO 📋
- 📋 Notificaciones push
- 📋 Sistema de notas mejorado
- 📋 Recomendaciones con IA
- 📋 Gamificación y badges
- 📋 Modo offline

#### Fase 4: Escalabilidad y Expansión (Meses 10-12) - FUTURO 🔮
- 🔮 Aplicaciones móviles nativas
- 🔮 Marketplace de cursos
- 🔮 Sistema de pagos
- 🔮 Internacionalización completa
- 🔮 Integraciones empresariales

### 8.2 Priorización de Features

#### Must Have (Crítico para MVP)
- Autenticación segura
- Gestión de cursos y progreso
- Chat con IA
- Comunidad Q&A
- Panel de administración

#### Should Have (Importante para competitividad)
- Evaluaciones automáticas
- Integración Zoom
- Certificaciones
- Analytics avanzados
- Notificaciones

#### Could Have (Mejora experiencia)
- Gamificación
- Recomendaciones IA
- Modo offline
- Grupos de estudio
- Portafolio digital

#### Won't Have (Fuera de scope actual)
- Realidad Virtual/Aumentada
- Blockchain para certificados
- Comandos de voz
- Chatbot de navegación

---

## 9. Métricas de Éxito

### 9.1 KPIs de Producto

#### Adquisición
- **Registros Mensuales**: Objetivo 500 nuevos usuarios/mes
- **Tasa de Conversión Visitante → Registro**: Objetivo 15%
- **Fuentes de Tráfico**: Diversificación en 4+ canales

#### Activación
- **Time to First Value**: < 10 minutos (completar primer video)
- **Tasa de Activación**: 80% de registros completan onboarding
- **Inscripciones en Cursos**: Promedio 1.5 cursos por usuario

#### Engagement
- **Usuarios Activos Diarios (DAU)**: Objetivo 1,000 en 6 meses
- **Usuarios Activos Mensuales (MAU)**: Objetivo 5,000 en 6 meses
- **DAU/MAU Ratio**: Objetivo 20%+
- **Tiempo Promedio de Sesión**: Objetivo 45 minutos
- **Frecuencia de Uso**: Objetivo 3+ sesiones/semana

#### Retención
- **Retención D1**: Objetivo 60%
- **Retención D7**: Objetivo 40%
- **Retención D30**: Objetivo 25%
- **Churn Rate**: < 10% mensual

#### Monetización (Futuro)
- **Conversión Free → Paid**: Objetivo 5%
- **ARPU (Average Revenue Per User)**: Objetivo $20/mes
- **LTV (Lifetime Value)**: Objetivo $240
- **CAC (Customer Acquisition Cost)**: < $50

### 9.2 KPIs Técnicos

#### Rendimiento
- **Tiempo de Carga Inicial**: < 3s (P95)
- **Tiempo de Respuesta API**: < 500ms (P95)
- **First Contentful Paint (FCP)**: < 1.5s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Time to Interactive (TTI)**: < 3s

#### Disponibilidad
- **Uptime**: 99.9% (máximo 8.77h downtime/año)
- **MTTR (Mean Time To Repair)**: < 30 minutos
- **MTBF (Mean Time Between Failures)**: > 720 horas

#### Calidad
- **Tasa de Error**: < 0.1%
- **Test Coverage**: > 80%
- **Bugs Críticos en Producción**: 0
- **Tiempo de Resolución de Bugs**: < 24h (críticos), < 7d (normales)

### 9.3 KPIs de Negocio

#### Satisfacción
- **Net Promoter Score (NPS)**: Objetivo 50+
- **Customer Satisfaction (CSAT)**: Objetivo 4.5/5
- **Tasa de Completado de Cursos**: Objetivo 70%+

#### Comunidad
- **Preguntas Activas**: Objetivo 100+ preguntas/mes
- **Tasa de Respuesta**: > 80% de preguntas respondidas en 24h
- **Engagement en Comunidad**: 30% de usuarios activos participan

#### Educación
- **Certificados Emitidos**: Objetivo 500 en 6 meses
- **Promedio de Calificaciones**: > 80%
- **Tasa de Aprobación**: > 85%

---

## 10. Glosario

### Términos Técnicos

**API (Application Programming Interface)**  
Interfaz de programación de aplicaciones que permite la comunicación entre diferentes sistemas.

**bcrypt**  
Algoritmo de hash de contraseñas con salt integrado, usado para almacenar contraseñas de forma segura.

**CDN (Content Delivery Network)**  
Red de distribución de contenido que mejora la velocidad de carga de assets estáticos.

**CSP (Content Security Policy)**  
Política de seguridad que previene ataques XSS definiendo fuentes permitidas de contenido.

**Fingerprint de Dispositivo**  
Identificador único generado a partir de características del dispositivo y navegador del usuario.

**Glassmorphism**  
Estilo de diseño que simula vidrio esmerilado con transparencias y blur.

**JWT (JSON Web Token)**  
Estándar abierto para crear tokens de acceso que permiten la autenticación sin estado.

**Netlify Functions**  
Funciones serverless que se ejecutan en respuesta a eventos HTTP.

**PostgreSQL**  
Sistema de gestión de bases de datos relacional de código abierto.

**RLS (Row Level Security)**  
Característica de PostgreSQL que permite control de acceso a nivel de fila en tablas.

**Socket.IO**  
Librería para comunicación en tiempo real bidireccional basada en WebSockets.

**Supabase**  
Plataforma de backend como servicio (BaaS) basada en PostgreSQL.

**TTL (Time To Live)**  
Tiempo de vida de un token o sesión antes de expirar.

### Términos de Producto

**LIA (Learning Intelligence Assistant)**  
Asistente de IA del sistema que proporciona soporte educativo personalizado.

**Módulo**  
Unidad de aprendizaje dentro de un curso, compuesta por múltiples videos y evaluaciones.

**Progreso Granular**  
Tracking detallado de avance por video, módulo y curso completo.

**Q&A (Questions & Answers)**  
Sistema de preguntas y respuestas de la comunidad.

**Umbral de Completado**  
Porcentaje mínimo de visualización (90%) para considerar un video como completado.

### Acrónimos

**ARPU**: Average Revenue Per User  
**CAC**: Customer Acquisition Cost  
**CSAT**: Customer Satisfaction Score  
**DAU**: Daily Active Users  
**LTV**: Lifetime Value  
**MAU**: Monthly Active Users  
**MTBF**: Mean Time Between Failures  
**MTTR**: Mean Time To Repair  
**NPS**: Net Promoter Score  
**PRD**: Product Requirements Document  
**RF**: Requisito Funcional  
**RN**: Regla de Negocio  
**RNF**: Requisito No Funcional  
**TTI**: Time To Interactive  
**US**: User Story (Historia de Usuario)

---

## Apéndices

### Apéndice A: Referencias de Código

#### Archivos Clave del Proyecto

**Backend**
- `server.js` - Servidor Express principal
- `netlify/functions/` - Funciones serverless
- `scripts/` - Scripts de base de datos y utilidades

**Frontend**
- `src/index.html` - Landing page
- `src/Chat-Online/chat-online.html` - Interfaz de chat con curso
- `src/Community/community.html` - Sistema de comunidad
- `src/profile.html` - Perfil de usuario
- `src/admin/admin.html` - Panel de administración

**Estilos**
- `src/styles/main.css` - Estilos globales y paleta de colores
- `src/styles/navbar-global.css` - Navegación global

**Scripts**
- `src/scripts/course-progress-manager-v2.js` - Gestión de progreso
- `src/scripts/community-database.js` - Base de datos de comunidad
- `src/Chat-Online/components/lia-chat.js` - Chat con IA

**Configuración**
- `netlify.toml` - Configuración de Netlify
- `package.json` - Dependencias y scripts
- `.env` - Variables de entorno

### Apéndice B: Comandos de Desarrollo

```bash
# Iniciar servidor de desarrollo
npm run dev

# Iniciar servidor de producción
npm start

# Ejecutar tests
npm test

# Linting
npm run lint

# Formateo de código
npm run format

# Inicializar base de datos
npm run init:database

# Auditoría de seguridad
npm run security-check
```

### Apéndice C: Variables de Entorno

```bash
# Base de Datos
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_KEY=...

# Autenticación
JWT_SECRET=...
USER_JWT_SECRET=...

# OpenAI
OPENAI_API_KEY=sk-...

# Email
SENDGRID_API_KEY=SG...
EMAIL_FROM=noreply@chatbotlia.com

# Zoom
ZOOM_ACCOUNT_ID=...
ZOOM_CLIENT_ID=...
ZOOM_CLIENT_SECRET=...

# Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=...

# Entorno
NODE_ENV=production
PORT=3000
```

### Apéndice D: Recursos Adicionales

#### Documentación Técnica
- `CLAUDE.md` - Guía completa para desarrollo
- `IMPLEMENTATION_SUMMARY.md` - Resumen de implementación
- `REQUERIMIENTOS_CHAT_BOT_LIA.md` - Requerimientos originales
- `database/README_analysis_messages.md` - Documentación de BD

#### Documentación de Diseño
- `GUIA_MEJORAS_LEGIBILIDAD_LIA.md` - Guía de legibilidad
- Archivos de diseño en `src/styles/`

#### Documentación de Deployment
- `netlify.toml` - Configuración de Netlify
- `Procfile` - Configuración de Heroku (si aplica)

---

## Control de Versiones del Documento

| Versión | Fecha | Autor | Cambios |
|---------|-------|-------|---------|
| 1.0 | Enero 2025 | Equipo de Desarrollo | Versión inicial completa |

---

## Aprobaciones

| Rol | Nombre | Firma | Fecha |
|-----|--------|-------|-------|
| Product Owner | - | - | - |
| Tech Lead | - | - | - |
| UX Lead | - | - | - |
| Stakeholder | - | - | - |

---

**Fin del Documento PRD Maestro**

**Total de Páginas**: Este documento consolida:
- 168 líneas de resumen ejecutivo
- 1,152 líneas de requisitos funcionales (152 RF)
- 1,088 líneas de requisitos no funcionales (120 RNF)
- 1,024 líneas de reglas de negocio (85 RN)
- 1,127 líneas de diseño y UX
- 1,587 líneas de arquitectura técnica
- 1,487 líneas de historias de usuario (105 US)

**Total: 7,633+ líneas de documentación técnica completa**

---

**Nota**: Este documento es un resumen ejecutivo. Para detalles completos de cada sección, consultar los documentos individuales:
- PRD_01_RESUMEN_EJECUTIVO.md
- PRD_02_REQUISITOS_FUNCIONALES.md
- PRD_03_REQUISITOS_NO_FUNCIONALES.md
- PRD_04_REGLAS_NEGOCIO.md
- PRD_05_DISENO_UX.md
- PRD_06_ARQUITECTURA_TECNICA.md
- PRD_07_HISTORIAS_USUARIO.md
