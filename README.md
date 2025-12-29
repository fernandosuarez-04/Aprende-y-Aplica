# 🚀 Aprende y Aplica - Plataforma B2B de Capacitación en IA

> Plataforma de capacitación empresarial B2B enfocada en inteligencia artificial, diseñada para organizaciones que buscan desarrollar las habilidades de sus equipos con cursos, certificaciones, planificación de estudios con IA y seguimiento de progreso personalizado.

---

## 🎯 Modelo de Negocio B2B

### Buyer Persona Principal

**Director de RRHH / Learning & Development Manager**

- **Empresa**: Medianas y grandes empresas (50-5000+ empleados)
- **Industria**: Tecnología, Finanzas, Retail, Manufactura, Servicios
- **Pain Points**:
  - Necesita capacitar a su equipo en IA de forma estructurada
  - Requiere reportes de progreso para justificar inversión en capacitación
  - Busca certificaciones verificables para el desarrollo profesional
  - Necesita personalización de marca (white-label)
- **Goals**:
  - Desarrollar competencias en IA en toda la organización
  - Medir ROI de la capacitación
  - Obtener certificaciones reconocidas para empleados
  - Centralizar la gestión de aprendizaje del equipo

### Usuarios de la Plataforma

| Rol                     | Descripción                                     | Acceso              |
| ----------------------- | ----------------------------------------------- | ------------------- |
| **Admin (Super Admin)** | Administrador de la plataforma Aprende y Aplica | `/admin/*`          |
| **Business Admin**      | Administrador de una organización cliente       | `/business-panel/*` |
| **Business User**       | Empleado de una organización cliente            | `/business-user/*`  |

---

## 📋 Tabla de Contenidos

- [Modelo de Negocio B2B](#-modelo-de-negocio-b2b)
- [Características Principales](#-características-principales)
- [Asistente Virtual LIA](#-asistente-virtual-lia)
- [Planificador de Estudios con IA](#-planificador-de-estudios-con-ia)
- [Sistema de Diseño SOFIA](#-sistema-de-diseño-sofia)
- [Arquitectura del Proyecto](#-arquitectura-del-proyecto)
- [Estructura de la Plataforma](#-estructura-de-la-plataforma)
- [Stack Tecnológico](#-stack-tecnológico)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [APIs y Endpoints](#-apis-y-endpoints)
- [Sistema de Autenticación](#-sistema-de-autenticación)
- [Internacionalización](#-internacionalización)
- [Desarrollo](#-desarrollo)

---

## ✨ Características Principales

### 🏢 Para Organizaciones (Business Panel)

#### Gestión de la Organización

- **Dashboard Empresarial**: Vista general de métricas y actividad
- **Gestión de Usuarios**: Invitar, gestionar y monitorear empleados
- **Gestión de Equipos**: Crear equipos y asignar cursos
- **Analytics y Reportes**: Progreso del equipo, completados, certificaciones
- **Configuración de Suscripción**: Planes Team, Business, Enterprise

#### Personalización de Marca (Branding)

- **Paleta de Colores**: Color primario, secundario y de acento
- **Tipografía**: Fuente personalizada de marca
- **Logos**: Logo, banner y favicon personalizables
- **Certificados Personalizados**: Templates con branding corporativo

#### Planes de Suscripción

| Plan           | Usuarios   | Características                               |
| -------------- | ---------- | --------------------------------------------- |
| **Team**       | Hasta 10   | Cursos básicos, Reportes                      |
| **Business**   | Hasta 50   | Todos los cursos, Analytics avanzados         |
| **Enterprise** | Ilimitados | White-label, Certificados personalizados, API |

### 👤 Para Empleados (Business User)

#### Dashboard Personal

- **Mi Progreso**: Cursos asignados y completados
- **Calendario de Estudio**: Planificador integrado con sincronización a Google/Microsoft Calendar
- **Certificados**: Certificados obtenidos con verificación blockchain
- **Habilidades**: Tracking de competencias desarrolladas

#### Aprendizaje

- **Cursos de IA**: Contenido estructurado por niveles
- **Lecciones en Video**: Contenido multimedia con tracking automático
- **Evaluaciones**: Quizzes y exámenes integrados
- **Notas Personales**: Sistema de notas por lección
- **Asistente LIA**: Chat con IA contextual durante el aprendizaje

### 🛡️ Para Administradores de Plataforma (Admin)

#### Gestión de Empresas

- **Listado de Organizaciones**: Vista completa de clientes
- **Modal de Vista Detallada**: Información completa con banner, logo, miembros
- **Edición Avanzada** (`/admin/companies/[id]/edit`):
  - **General**: Información básica, contacto, branding
  - **Usuarios**: Lista de miembros, roles, estados
  - **Cursos**: Cursos adquiridos y asignaciones
  - **Estadísticas**: Analytics de uso
  - **Personalización**: Colores, tipografía, estilos
  - **Notificaciones**: Preferencias de notificación
  - **Certificados**: Plantillas de certificados
  - **Suscripción**: Plan, límites, fechas

#### Gestión de Contenido

- **Cursos**: Crear, editar, organizar cursos
- **Módulos y Lecciones**: Estructura de contenido
- **Workshops**: Eventos en vivo
- **Prompts/Apps IA**: Directorio de recursos

#### Analytics y Monitoreo

- **Dashboard de Estadísticas**: Métricas de plataforma
- **Reportes**: Uso, crecimiento, engagement
- **LIA Analytics**: Uso del asistente virtual, métricas de interacción

### 🎓 Sistema de Certificados con Blockchain

- **Hash Único Inmutable**: Cada certificado tiene un hash SHA-256
- **Verificación Pública**: Cualquiera puede verificar autenticidad
- **Código QR**: Escaneo rápido para verificación
- **Descarga PDF**: Certificado profesional descargable

---

## 🤖 Asistente Virtual LIA

LIA (Learning Intelligence Assistant) es el asistente de IA integrado en toda la plataforma, potenciado por **OpenAI GPT-4o-mini**.

### Características Principales

| Característica        | Descripción                                                     |
| --------------------- | --------------------------------------------------------------- |
| **Chat Contextual**   | Ayuda adaptativa según la sección donde se encuentre el usuario |
| **Multilingüe**       | Soporte completo para Español, Inglés y Portugués               |
| **Tono Profesional**  | Respuestas claras y concisas sin uso de emojis                  |
| **Panel Lateral**     | Interfaz slide-over desde la derecha, siempre accesible         |
| **Historial de Chat** | Persistencia de conversaciones por contexto                     |

### Contextos de LIA

LIA se adapta según el contexto del usuario:

```
📚 Curso/Lección     → Responde dudas sobre el contenido, explica conceptos
📅 Study Planner     → Gestiona sesiones, detecta atrasos, propone reprogramaciones
🏠 Dashboard         → Orientación general, navegación, sugerencias
⚙️ Configuración     → Ayuda con ajustes de cuenta y preferencias
```

### Uso en el Código

```typescript
// Hook principal para usar LIA
import { useLIAChat } from "@/features/lia/hooks/useLIAChat";

const { sendMessage, messages, isLoading } = useLIAChat({
  context: "course_lesson",
  metadata: { lessonId, courseId },
});
```

---

## 📅 Planificador de Estudios con IA

Sistema inteligente de planificación de estudios que permite a los usuarios crear planes personalizados, sincronizar con calendarios externos y tener a LIA como asistente proactivo.

### Flujo Completo

```
┌─────────────────────────────────────────────────────────────────────┐
│                    1. CREACIÓN DEL PLAN                              │
│  Usuario → Selecciona Curso → Configura Preferencias → LIA genera   │
│  plan → Se guardan sesiones → Sync con calendario externo           │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    2. DASHBOARD                                      │
│  - Vista calendario con sesiones programadas                         │
│  - LIA analiza proactivamente: sesiones overdue, conflictos         │
│  - Usuario puede mover/eliminar/crear sesiones                       │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                 3. EJECUCIÓN DE SESIÓN                               │
│  Usuario → Entra al curso → Tracking inicia → Video + LIA →         │
│  Tracking eventos → Completar (quiz/inactividad/manual)             │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│              4. ACTUALIZACIÓN DE PROGRESO                            │
│  - user_lesson_progress se actualiza automáticamente                 │
│  - study_sessions.status → 'completed'                               │
│  - Sincronización con calendario externo                             │
└─────────────────────────────────────────────────────────────────────┘
```

### Configuración de Preferencias

El usuario define:

- **Días preferidos** para estudiar (Lun, Mar, Mié, etc.)
- **Horarios** de inicio y fin
- **Duración** de sesiones (15-60 min)
- **Enfoque**: `fast`, `balanced`, `long`, `custom`
- **Fecha de inicio**

### Tracking de Lecciones

El sistema registra automáticamente:

| Evento           | Trigger                    | Acción                     |
| ---------------- | -------------------------- | -------------------------- |
| `video_play`     | Usuario reproduce video    | Inicia tracking            |
| `video_ended`    | Video termina              | Registra evento            |
| `lia_message`    | Usuario interactúa con LIA | Extiende actividad         |
| `activity`       | Scroll, clic, etc.         | Actualiza última actividad |
| `quiz_submitted` | Quiz completado            | Auto-completa lección      |
| `inactivity_5m`  | 5 min sin actividad        | Auto-completa lección      |

### Acciones de LIA en el Study Planner

LIA puede ejecutar las siguientes acciones de forma proactiva:

```typescript
// Acciones disponibles
-move_session - // Mover sesión a otro horario
  delete_session - // Eliminar sesión
  create_session - // Crear nueva sesión
  rebalance_plan - // Redistribuir sesiones atrasadas
  recover_missed_session - // Reprogramar sesión perdida
  reduce_session_load; // Reducir carga de un día
```

### Estados de una Sesión

| Estado        | Descripción                            |
| ------------- | -------------------------------------- |
| `planned`     | Sesión programada, aún no iniciada     |
| `in_progress` | Usuario está activamente en la lección |
| `completed`   | Sesión completada correctamente        |
| `missed`      | La sesión pasó sin ser completada      |
| `rescheduled` | Fue reprogramada a otra fecha          |

### Sincronización con Calendarios

Integración con Google Calendar y Microsoft Outlook:

- Creación automática de eventos en calendario secundario "Aprende y Aplica"
- Sincronización bidireccional de cambios
- Detección de conflictos con otros eventos

---

## 🎨 Sistema de Diseño SOFIA

**SOFIA** (Sistema Original de Funcionalidad e Interfaz Avanzada) es el sistema de diseño de la plataforma.

### Principios de Diseño

- **Consistencia**: Mismos patrones en toda la plataforma
- **Accesibilidad**: Soporte completo de teclado y lectores de pantalla
- **Temas**: Soporte nativo para modo claro y oscuro
- **Responsivo**: Mobile-first design

### Tokens de Diseño

```css
/* Colores primarios */
--primary-600: #1f5af6 --neutral-900: #0a1633 --accent-orange: #ff7a45
  /* Espaciado */ --radius-base: 0.75rem --shadow-base: 0 2px 8px
  rgba(10, 22, 51, 0.08);
```

### Componentes UI

| Categoría        | Componentes                                      |
| ---------------- | ------------------------------------------------ |
| **Layout**       | Container, Grid, Flex, Spacer                    |
| **Forms**        | Input, Select, Checkbox, Radio, Switch, Textarea |
| **Feedback**     | Alert, Toast, Badge, Progress, Skeleton          |
| **Navigation**   | Navbar, Sidebar, Tabs, Breadcrumb, Pagination    |
| **Overlays**     | Modal, Dropdown, Tooltip, Popover, Sheet         |
| **Data Display** | Card, Table, Avatar, List, Accordion             |

### Temas Light/Dark

El sistema soporta cambio de tema en tiempo real:

```typescript
import { useTheme } from "@/core/stores/themeStore";

const { theme, toggleTheme } = useTheme();
// theme: 'light' | 'dark'
```

---

## 🏗️ Estructura de la Plataforma

```
📁 /                          # Landing page pública
📁 /auth                      # Autenticación
├── /[slug]                   # Login por organización
├── /[slug]/register          # Registro por organización
└── /forgot-password          # Recuperación de contraseña

📁 /admin                     # Panel Super Admin
├── /dashboard                # Dashboard principal
├── /companies                # Gestión de empresas/organizaciones
│   └── /[id]/edit           # Edición detallada de empresa
├── /users                    # Gestión de usuarios
├── /workshops               # Gestión de workshops
├── /communities             # Gestión de comunidades
├── /skills                  # Gestión de habilidades
├── /prompts                 # Directorio de prompts
├── /apps                    # Directorio de apps IA
├── /news                    # Gestión de noticias
├── /statistics              # Estadísticas de plataforma
├── /lia-analytics           # Analytics del asistente LIA
└── /reportes                # Sistema de reportes

📁 /business-panel           # Panel Admin de Organización
├── /dashboard               # Dashboard empresarial
├── /users                   # Gestión de empleados
├── /teams                   # Gestión de equipos
├── /courses                 # Cursos asignados
├── /analytics               # Analytics de la org
├── /progress                # Progreso general
├── /reports                 # Reportes empresariales
├── /settings                # Configuración y branding
└── /subscription            # Gestión de suscripción

📁 /business-user            # Dashboard Empleado
├── /dashboard               # Dashboard personal
│   ├── /courses             # Mis cursos
│   ├── /calendar            # Mi calendario
│   ├── /progress            # Mi progreso
│   └── /certificates        # Mis certificados
└── /teams                   # Mis equipos

📁 /courses                  # Visualización de cursos
└── /[slug]/learn            # Experiencia de aprendizaje

📁 /certificates             # Verificación de certificados
└── /verify/[hash]           # Verificación pública

📁 /study-planner            # Planificador de estudio
├── /create                  # Crear nuevo plan
└── /dashboard               # Dashboard del plan activo

📁 /profile                  # Perfil de usuario
📁 /account-settings         # Configuración de cuenta
📁 /questionnaire            # Cuestionario inicial
📁 /welcome                  # Página de bienvenida
📁 /conocer-lia              # Presentación de LIA
```

---

## 🛠️ Stack Tecnológico

### Frontend

| Tecnología        | Versión  | Uso                            |
| ----------------- | -------- | ------------------------------ |
| **Next.js**       | 15.5.4   | Framework React con App Router |
| **React**         | 19.1.0   | Biblioteca UI                  |
| **TypeScript**    | 5.9.3    | Tipado estático                |
| **Tailwind CSS**  | 3.4.18   | Estilos utility-first          |
| **Framer Motion** | 12.23.24 | Animaciones                    |
| **Zustand**       | 5.0.2    | Estado global                  |
| **SWR**           | 2.2.0    | Data fetching                  |
| **FullCalendar**  | 6.x      | Calendario del Study Planner   |
| **Radix UI**      | Latest   | Componentes accesibles         |
| **Headless UI**   | Latest   | Componentes sin estilos        |

### Backend & Infraestructura

| Tecnología                | Uso                                     |
| ------------------------- | --------------------------------------- |
| **Supabase**              | Base de datos PostgreSQL, Auth, Storage |
| **Supabase Auth**         | Autenticación y gestión de sesiones     |
| **OpenAI API**            | Asistente virtual LIA (GPT-4o-mini)     |
| **Netlify Functions**     | Cron jobs (inactividad de lecciones)    |
| **Google/Microsoft APIs** | Integración de calendarios              |

### Visualización de Datos

| Tecnología      | Uso                                  |
| --------------- | ------------------------------------ |
| **Nivo Charts** | Gráficos complejos y personalizables |
| **Recharts**    | Gráficos simples y performantes      |
| **Tremor**      | Dashboards de negocios               |

---

## 📁 Estructura del Monorepo

```
Aprende-y-Aplica/
├── apps/
│   └── web/                          # Aplicación Next.js
│       ├── src/
│       │   ├── app/                  # App Router (páginas)
│       │   ├── components/           # Componentes globales
│       │   ├── core/                 # Núcleo de la aplicación
│       │   │   ├── components/       # Componentes core (Header, Sidebar, LIA)
│       │   │   ├── hooks/            # Hooks personalizados
│       │   │   ├── i18n/             # Configuración de internacionalización
│       │   │   ├── providers/        # Context providers
│       │   │   └── stores/           # Estado global (Zustand)
│       │   ├── features/             # Features por dominio
│       │   │   ├── admin/            # Gestión de plataforma
│       │   │   ├── auth/             # Autenticación
│       │   │   ├── business-panel/   # Panel empresarial
│       │   │   ├── courses/          # Sistema de cursos
│       │   │   ├── lia/              # Asistente virtual LIA
│       │   │   └── study-planner/    # Planificador de estudios
│       │   └── lib/                  # Utilidades y configuración
│       │       ├── lia/              # Configuración de LIA
│       │       ├── openai/           # Cliente OpenAI
│       │       └── supabase/         # Cliente Supabase
│       └── public/
│           └── locales/              # Archivos de traducción (es, en, pt)
│
├── netlify/
│   └── functions/                    # Funciones serverless (cron jobs)
│
├── packages/
│   └── shared/                       # Tipos y utilidades compartidas
│
├── docs/                             # Documentación del proyecto
│
└── scripts/
    └── supabase/                     # Migraciones SQL
```

---

## 🚀 Instalación

### Requisitos Previos

- **Node.js**: >= 22.0.0
- **npm**: >= 10.5.1
- **Cuenta Supabase**: Para base de datos y autenticación
- **OpenAI API Key**: Para el asistente LIA

### Pasos de Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-repo/aprende-y-aplica.git
cd Aprende-y-Aplica

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# 4. Ejecutar en desarrollo
npm run dev
```

---

## ⚙️ Configuración

### Variables de Entorno (`.env`)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# OpenAI (para LIA)
OPENAI_API_KEY=tu_openai_api_key
CHATBOT_MODEL=gpt-4o-mini
CHATBOT_MAX_TOKENS=700
CHATBOT_TEMPERATURE=0.6

# Autenticación
JWT_SECRET=tu_jwt_secret_seguro
SESSION_SECRET=tu_session_secret_seguro

# URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Google Calendar (opcional)
GOOGLE_CLIENT_ID=tu_google_client_id
GOOGLE_CLIENT_SECRET=tu_google_client_secret

# Microsoft Calendar (opcional)
MICROSOFT_CLIENT_ID=tu_microsoft_client_id
MICROSOFT_CLIENT_SECRET=tu_microsoft_client_secret
```

---

## 🔌 APIs y Endpoints

### Autenticación

```
POST   /api/auth/login                  # Inicio de sesión
POST   /api/auth/register               # Registro
POST   /api/auth/logout                 # Cerrar sesión
POST   /api/auth/refresh                # Refrescar token
GET    /api/auth/me                     # Usuario actual
```

### Panel de Administración

```
# Gestión de Empresas
GET    /api/admin/companies             # Listar empresas
GET    /api/admin/companies/:id         # Obtener empresa
PUT    /api/admin/companies/:id         # Actualizar empresa
POST   /api/admin/companies             # Crear empresa
DELETE /api/admin/companies/:id         # Eliminar empresa

# Usuarios y Contenido
GET    /api/admin/users                 # Listar usuarios
GET    /api/admin/courses               # Listar cursos
GET    /api/admin/stats                 # Estadísticas generales
```

### Business Panel (Organizaciones)

```
# Dashboard
GET    /api/business/dashboard/stats    # Estadísticas
GET    /api/business/dashboard/activity # Actividad reciente

# Usuarios y Equipos
GET    /api/business/users              # Listar usuarios
POST   /api/business/users              # Crear/invitar usuario
GET    /api/business/teams              # Listar equipos

# Branding
GET    /api/business/settings/branding  # Obtener branding
PUT    /api/business/settings/branding  # Actualizar branding
```

### Cursos y Aprendizaje

```
GET    /api/courses                     # Listar cursos
GET    /api/courses/:slug               # Detalle de curso
GET    /api/courses/:slug/learn-data    # Datos para aprendizaje
PUT    /api/courses/:slug/lessons/:id/progress # Actualizar progreso
```

### Study Planner

```
POST   /api/study-planner/create        # Crear plan de estudios
GET    /api/study-planner/dashboard/plan # Obtener plan activo
GET    /api/study-planner/sessions      # Listar sesiones
PUT    /api/study-planner/sessions/:id  # Actualizar sesión
DELETE /api/study-planner/sessions/:id  # Eliminar sesión

# Tracking de lecciones
POST   /api/study-planner/lesson-tracking/start    # Iniciar tracking
POST   /api/study-planner/lesson-tracking/event    # Registrar evento
POST   /api/study-planner/lesson-tracking/complete # Completar lección

# Chat con LIA
POST   /api/study-planner/dashboard/chat # Chat contextual
```

### Asistente LIA

```
POST   /api/ai-chat                     # Chat con LIA
POST   /api/ai-directory/generate-prompt # Generar prompt
POST   /api/lia/context-help            # Ayuda contextual
```

### Certificados

```
GET    /api/certificates                # Mis certificados
POST   /api/certificates/generate       # Generar certificado
GET    /api/certificates/verify/:hash   # Verificar certificado (público)
```

---

## 🔐 Sistema de Autenticación

### Roles de Usuario

| Rol            | Descripción                       | Rutas Permitidas    |
| -------------- | --------------------------------- | ------------------- |
| `Admin`        | Super administrador de plataforma | `/admin/*`          |
| `Business`     | Administrador de organización     | `/business-panel/*` |
| `BusinessUser` | Empleado de organización          | `/business-user/*`  |

### Flujo de Autenticación

1. Usuario accede a `/auth/[slug]` (login por organización)
2. Se valida credenciales contra Supabase Auth
3. Se genera JWT con rol y organization_id
4. Middleware valida rol en cada request
5. Redirección automática al panel correspondiente

---

## 🌍 Internacionalización

La plataforma soporta **3 idiomas**: Español (default), Inglés y Portugués.

### Archivos de Traducción

```
apps/web/public/locales/
├── es/common.json    # Español
├── en/common.json    # Inglés
└── pt/common.json    # Portugués
```

### Uso en Componentes

```typescript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation('common');
  return <h1>{t('welcome.title')}</h1>;
}
```

### Cambio de Idioma

```typescript
import { useLanguage } from "@/core/i18n/I18nProvider";

function LanguageSelector() {
  const { language, changeLanguage } = useLanguage();
  // language: 'es' | 'en' | 'pt'
}
```

> **Nota**: LIA detecta automáticamente el idioma del usuario y responde en ese idioma.

---

## 👨‍💻 Desarrollo

### Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Frontend en http://localhost:3000

# Build
npm run build            # Build de producción

# Type checking
npm run type-check       # Verificar tipos TypeScript

# Linting
npm run lint             # Ejecutar ESLint
```

### Convenciones de Código

- ✅ TypeScript estricto
- ✅ Componentes funcionales con hooks
- ✅ Feature-based arquitectura (Screaming Architecture)
- ✅ Tailwind CSS para estilos
- ✅ Framer Motion para animaciones
- ✅ Path aliases (`@/features/*`, `@/core/*`, `@/lib/*`)

### Path Aliases

```typescript
@/features/*  → apps/web/src/features/*
@/core/*      → apps/web/src/core/*
@/app/*       → apps/web/src/app/*
@/lib/*       → apps/web/src/lib/*
@/utils/*     → apps/web/src/shared/utils/*
@/hooks/*     → apps/web/src/shared/hooks/*
```

---

## 📊 Base de Datos (Tablas Principales)

| Tabla                   | Descripción                               |
| ----------------------- | ----------------------------------------- |
| `usuarios`              | Perfiles de usuario                       |
| `organizations`         | Organizaciones/empresas                   |
| `cursos`                | Catálogo de cursos                        |
| `user_lesson_progress`  | Progreso por lección                      |
| `study_plans`           | Planes de estudio creados                 |
| `study_sessions`        | Sesiones individuales programadas         |
| `study_preferences`     | Preferencias de estudio del usuario       |
| `lesson_tracking`       | Tracking en tiempo real de lección activa |
| `calendar_integrations` | Conexión con Google/Microsoft Calendar    |
| `lia_conversations`     | Historial de chat con LIA                 |
| `certificates`          | Certificados generados                    |

---

## 📝 Historial de Cambios

### Diciembre 2025 (v2.1.0)

#### 🆕 Planificador de Estudios con IA

- ✅ Creación de planes personalizados con LIA
- ✅ Sincronización con Google Calendar y Microsoft Outlook
- ✅ Tracking automático de lecciones (video, quiz, inactividad)
- ✅ Detección proactiva de sesiones overdue
- ✅ Rebalanceo automático de planes
- ✅ Cron job para cerrar sesiones inactivas

#### 🤖 LIA Mejorada

- ✅ Soporte multilingüe (ES, EN, PT) con detección automática
- ✅ Tono profesional sin emojis
- ✅ Comportamiento proactivo en el Study Planner
- ✅ Acciones ejecutables desde el chat (mover, eliminar, crear sesiones)
- ✅ Panel lateral siempre accesible con botón de limpiar conversación
- ✅ Estado vacío dinámico con tips rotativos

#### 🎨 Sistema de Diseño SOFIA

- ✅ Componentes UI consistentes
- ✅ Soporte nativo para modo claro/oscuro
- ✅ Premium Dropdown pattern para menús
- ✅ Theming consistente en todos los paneles

### Diciembre 2024 (v2.0.0)

#### 🆕 Pivote a Modelo B2B

- ✅ Enfoque 100% empresarial
- ✅ Eliminación de funcionalidades B2C
- ✅ Simplificación de roles (Admin, Business, BusinessUser)

#### 🏢 Gestión Avanzada de Empresas

- ✅ Nueva página `/admin/companies/[id]/edit` con 8 secciones
- ✅ Paleta de colores editable con preview en tiempo real
- ✅ Selector de tipografía de marca

#### 🔐 Seguridad Mejorada

- ✅ Tokens SHA-256 determinísticos
- ✅ Middleware de roles mejorado
- ✅ Validación de organización en cada request

---

**Última actualización**: Diciembre 2025  
**Versión**: 2.1.0 (B2B)  
**Mantenedores**: Equipo Aprende y Aplica
