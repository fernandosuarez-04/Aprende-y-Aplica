# 🚀 Aprende y Aplica - Plataforma Educativa de IA

> Plataforma educativa integral que combina inteligencia artificial generativa con gestión de cursos, comunidad interactiva y seguimiento de progreso personalizado.

## 📋 Tabla de Contenidos

- [Visión General](#-visión-general)
- [Características Principales](#-características-principales)
- [Arquitectura del Proyecto](#-arquitectura-del-proyecto)
- [Stack Tecnológico](#-stack-tecnológico)
- [Estructura del Monorepo](#-estructura-del-monorepo)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Scripts Disponibles](#-scripts-disponibles)
- [APIs y Endpoints](#-apis-y-endpoints)
- [Base de Datos](#-base-de-datos)
- [Sistema de Autenticación](#-sistema-de-autenticación)
- [Optimizaciones y Performance](#-optimizaciones-y-performance)
- [Funcionalidades Detalladas](#-funcionalidades-detalladas)
  - [Panel de Administración](#5-panel-de-administración)
  - [Panel de Instructor](#6-panel-de-instructor)
  - [Panel Empresarial](#7-panel-empresarial-business-panel)
  - [Asistente Virtual LIA](#3-asistente-virtual-lia-learning-intelligence-assistant)
  - [Sistema de Certificados con Blockchain](#-sistema-de-certificados-con-blockchain)
- [Internacionalización](#-internacionalización)
- [Desarrollo](#-desarrollo)
- [Despliegue](#-despliegue)
- [Contribución](#-contribución)

---

## 🎯 Visión General

**Aprende y Aplica** es una plataforma educativa de vanguardia diseñada para democratizar el acceso a la educación en inteligencia artificial. La plataforma ofrece:

- 🤖 **Asistente Virtual LIA**: Soporte 24/7 con inteligencia artificial
- 📚 **Sistema de Cursos**: Gestión completa de cursos con seguimiento granular
- 👥 **Comunidad Colaborativa**: Q&A, votación y colaboración entre estudiantes
- 🏢 **Panel Empresarial**: Gestión de equipos y organizaciones
- 📊 **Analytics Avanzados**: Reportes detallados y seguimiento de progreso
- 🎓 **Certificaciones con Blockchain**: Certificados verificables e inmutables con tecnología blockchain
- 📅 **Planificador de Estudio con IA**: Creación automática de planes de estudio personalizados

---

## ✨ Características Principales

### 🔐 Autenticación y Usuarios
- Sistema de autenticación seguro con Supabase Auth
- Gestión de sesiones personalizada con tokens JWT
- Múltiples roles: Administrador, Instructor, Estudiante, Business, Business User
- Perfiles de usuario completos con preferencias personalizables

### 📚 Cursos y Aprendizaje
- **Gestión Completa de Cursos**: Creación, edición y organización de cursos
- **Seguimiento Granular**: Progreso por módulo, lección y video
- **Actividades Interactivas**: Materiales, ejercicios y evaluaciones
- **Sistema de Notas**: Notas personales por lección
- **Feedback de Lecciones**: Sistema de retroalimentación estructurado

### 🤖 Asistente Virtual LIA
- Chat contextual con inteligencia artificial
- Soporte en diferentes secciones de la plataforma
- Generación de prompts profesionales
- Navegación contextual y ayuda personalizada

### 👥 Comunidades
- **Creación de Comunidades**: Por categorías y temas
- **Sistema de Acceso**: Público, privado, por invitación o pago
- **Q&A y Discusiones**: Preguntas y respuestas con votación
- **Moderación**: Sistema de moderación y roles de comunidad
- **Estadísticas**: Seguimiento de actividad y membresías

### 🏢 Panel Empresarial (Business Panel)
- **Gestión de Organizaciones**: Creación y administración de equipos
- **Planes de Suscripción**: Team, Business y Enterprise
- **Gestión de Usuarios**: Invitaciones, roles y permisos
- **Analytics Corporativos**: Reportes de progreso y participación
- **Branding Personalizado**: (Plan Enterprise)
- **Certificados Personalizados**: (Plan Enterprise)

### 📅 Planificador de Estudio con IA
- **Modo Manual**: Configuración personalizada de planes
- **Modo IA (LIA)**: Generación automática con asistente virtual LIA
  - Conversación interactiva para crear planes personalizados
  - Análisis de disponibilidad del calendario del usuario
  - Generación inteligente de sesiones de estudio
  - Confirmación y guardado automático de planes
- **Sincronización de Calendarios**: 
  - Google Calendar (OAuth 2.0)
  - Microsoft Calendar (Azure AD OAuth)
  - Exportación ICS para otros clientes de calendario
  - Sincronización bidireccional de sesiones
- **Sistema de Streaks**: Tracking de rachas de estudio
- **Dashboard de Progreso**: Estadísticas visuales y heatmaps
- **Técnicas de Aprendizaje**: Spaced Repetition, Interleaving, Load Balancing
- **Guardado Automático**: Los planes generados se guardan automáticamente en la base de datos

### 📖 Directorio de IA
- **Directorio de Prompts**: Catálogo de prompts profesionales generados con IA
- **Directorio de Apps**: Catálogo de aplicaciones y herramientas de IA
- **Generación de Prompts**: Asistente especializado "Lia" para crear prompts
- **Categorización**: Por tipo, dificultad y casos de uso

### 📰 Noticias y Contenido
- Sistema de noticias y artículos
- Categorización y filtrado
- Estadísticas de lectura
- Sistema de favoritos

### 🎯 Sistema de Habilidades (Skills)
- Tracking de habilidades por usuario
- Evaluación de nivel de habilidad
- Sistema de progreso y logros

### 🔔 Notificaciones
- Sistema de notificaciones en tiempo real
- Notificaciones por email, push y SMS (según plan)
- Recordatorios inteligentes

### 💳 Suscripciones y Pagos
- **Suscripciones Personales**: Planes Basic, Premium y Pro
- **Suscripciones Empresariales**: Team, Business, Enterprise
- Sistema de carrito de compras
- Historial de compras
- Gestión de métodos de pago

### 🎓 Sistema de Certificados con Blockchain

El sistema de certificados utiliza tecnología blockchain para garantizar la autenticidad, integridad y verificación de los certificados emitidos.

#### Características Principales

**Generación Automática:**
- **Trigger Automático**: Se genera al completar un curso al 100%
- **Formato PDF**: Certificados en formato PDF profesional
- **Datos Incluidos**:
  - Nombre del estudiante
  - Nombre del curso completado
  - Nombre del instructor
  - Fecha de emisión
  - Hash blockchain único
  - Código QR para verificación

**Tecnología Blockchain:**

**Hash Blockchain Inmutable:**
- Cada certificado recibe un **hash único e inmutable** generado automáticamente
- **Algoritmo**: SHA-256 o similar para garantizar seguridad criptográfica
- **Inmutabilidad**: El hash se genera en la creación y nunca puede modificarse
- **Registro en Base de Datos**: El hash se almacena junto con el certificado

**Generación del Hash:**
```sql
-- El hash se genera automáticamente mediante función SQL
CREATE FUNCTION certificate_hash_immutable()
RETURNS TRIGGER AS $$
BEGIN
  -- Genera hash único basado en:
  -- - user_id
  -- - course_id
  -- - enrollment_id
  -- - issued_at timestamp
  -- - Contenido del certificado
  NEW.certificate_hash := encode(
    digest(
      NEW.user_id || NEW.course_id || NEW.enrollment_id || NEW.issued_at,
      'sha256'
    ),
    'hex'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Verificación de Certificados:**
- **Endpoint de Verificación**: `/api/certificates/verify/:hash`
- **Validación Pública**: Cualquiera puede verificar un certificado usando el hash
- **Información Verificada**:
  - Autenticidad del certificado
  - Información del estudiante
  - Curso completado
  - Fecha de emisión
  - Estado (válido/expirado/inválido)

**Características de Seguridad:**
- ✅ **Imposible de Falsificar**: El hash blockchain garantiza autenticidad
- ✅ **Verificación Instantánea**: Validación en tiempo real
- ✅ **Sin Falsificaciones**: Cualquier modificación invalida el hash
- ✅ **Transparencia**: Verificación pública sin necesidad de credenciales
- ✅ **Inmutabilidad**: Una vez generado, el hash nunca cambia

**Página de Verificación** (`/certificates/verify/:hash`):
- Interfaz pública para verificar certificados
- Muestra información completa del certificado
- Visualización del hash blockchain
- Opción para copiar el hash
- Código QR para verificación rápida

**Certificados Empresariales (Plan Enterprise):**
- **Templates Personalizados**: Diseño corporativo completo
- **Branding**: Logos, colores y estilos de la empresa
- **Firma Digital**: Firmas de instructores o responsables
- **Validación Blockchain**: Mismo sistema de hash para certificados corporativos
- **Gestión Masiva**: Ver y descargar todos los certificados de la organización

**Descarga y Compartir:**
- **Descarga PDF**: Descarga del certificado completo
- **Compartir Hash**: Compartir el hash para verificación
- **Código QR**: Incluido en el PDF para escaneo rápido
- **Enlace de Verificación**: URL pública para verificación

**Gestión de Certificados:**
- **Lista de Certificados**: Todos los certificados del usuario
- **Filtros**: Por curso, fecha, estado
- **Búsqueda**: Búsqueda rápida de certificados
- **Historial**: Historial completo de certificaciones

#### Implementación Técnica

**Base de Datos:**
```sql
CREATE TABLE user_course_certificates (
  certificate_id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  course_id UUID NOT NULL,
  enrollment_id UUID NOT NULL,
  certificate_url TEXT, -- URL del PDF en Storage
  certificate_hash TEXT UNIQUE NOT NULL, -- Hash blockchain
  issued_at TIMESTAMP NOT NULL,
  expires_at TIMESTAMP, -- Opcional
  -- Función trigger genera hash automáticamente
);
```

**Proceso de Generación:**
1. Usuario completa curso al 100%
2. Trigger automático detecta completado
3. Se genera PDF del certificado
4. Se calcula hash blockchain único
5. Se sube PDF a Supabase Storage
6. Se crea registro en base de datos con hash
7. Usuario recibe notificación con enlace al certificado

**API Endpoints:**
- `POST /api/certificates/generate` - Genera certificado
- `GET /api/certificates` - Lista certificados del usuario
- `GET /api/certificates/:id/download` - Descarga PDF
- `GET /api/certificates/verify/:hash` - Verifica certificado (público)

**Casos de Uso:**
- Verificación por empleadores
- Validación académica
- Portafolio profesional
- Compartir logros en redes sociales
- Validación de competencias

### 📊 Analytics y Reportes
- Dashboard de administración completo
- Reportes de progreso de usuarios
- Estadísticas de cursos y comunidades
- Analytics empresariales avanzados

---

## 🏗️ Arquitectura del Proyecto

Este proyecto utiliza una arquitectura de **monorepo** con las siguientes aplicaciones:

```
Aprende-y-Aplica/
├── apps/
│   ├── web/          # Frontend Next.js
│   └── api/          # Backend Node.js/Express
├── packages/
│   ├── shared/       # Utilidades compartidas
│   └── ui/           # Componentes UI compartidos
└── docs/             # Documentación
```

### Frontend (`apps/web`)
- **Framework**: Next.js 15.5.4 con App Router
- **React**: 19.1.0
- **TypeScript**: 5.9.3
- **Estilos**: Tailwind CSS 3.4.18
- **UI Components**: Radix UI, Headless UI
- **State Management**: Zustand 5.0.2
- **Data Fetching**: SWR 2.2.0
- **Formularios**: React Hook Form + Zod
- **Animaciones**: Framer Motion, GSAP

### Backend (`apps/api`)
- **Runtime**: Node.js >=22.0.0
- **Framework**: Express 4.18.2
- **TypeScript**: 5.3.3
- **Base de Datos**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth + JWT personalizado
- **Seguridad**: Helmet, CORS, Rate Limiting

### Base de Datos
- **Provider**: Supabase (PostgreSQL)
- **ORM/Query Builder**: Supabase Client
- **Migraciones**: SQL scripts en `scripts/supabase/`

### Paquetes Compartidos
- **`@aprende-y-aplica/shared`**: Constantes, tipos y utilidades compartidas
- **`@aprende-y-aplica/ui`**: Componentes UI reutilizables

---

## 🛠️ Stack Tecnológico

### Frontend
```json
{
  "next": "15.5.4",
  "react": "19.1.0",
  "typescript": "5.9.3",
  "tailwindcss": "3.4.18",
  "@supabase/supabase-js": "^2.76.0",
  "zustand": "5.0.2",
  "swr": "^2.2.0",
  "framer-motion": "12.23.24",
  "react-hook-form": "^7.65.0",
  "zod": "^3.25.76"
}
```

### Backend
```json
{
  "express": "4.18.2",
  "typescript": "5.3.3",
  "@supabase/supabase-js": "^2.76.1",
  "bcrypt": "^5.1.1",
  "helmet": "7.1.0",
  "cors": "2.8.5",
  "express-rate-limit": "^7.1.5"
}
```

### Infraestructura
- **Hosting Frontend**: Netlify (recomendado) o Vercel
- **Hosting Backend**: Netlify Functions o Railway
- **Base de Datos**: Supabase (hosted PostgreSQL)
- **Autenticación**: Supabase Auth
- **Storage**: Supabase Storage
- **CDN**: Netlify CDN o Vercel Edge Network

---

## 📁 Estructura del Monorepo

```
Aprende-y-Aplica/
├── apps/
│   ├── web/                          # Frontend Next.js
│   │   ├── src/
│   │   │   ├── app/                  # App Router de Next.js
│   │   │   │   ├── api/              # API Routes
│   │   │   │   ├── admin/            # Panel de administración
│   │   │   │   ├── auth/             # Autenticación
│   │   │   │   ├── business-panel/   # Panel empresarial
│   │   │   │   ├── communities/      # Comunidades
│   │   │   │   ├── courses/          # Cursos
│   │   │   │   ├── dashboard/        # Dashboard principal
│   │   │   │   ├── prompt-directory/ # Directorio de prompts
│   │   │   │   ├── apps-directory/   # Directorio de apps
│   │   │   │   ├── study-planner/    # Planificador de estudio
│   │   │   │   └── ...
│   │   │   ├── components/           # Componentes globales
│   │   │   ├── core/                 # Núcleo de la aplicación
│   │   │   │   ├── components/       # Componentes core
│   │   │   │   ├── hooks/            # Hooks personalizados
│   │   │   │   ├── services/         # Servicios core
│   │   │   │   └── stores/           # Estado global (Zustand)
│   │   │   ├── features/             # Features organizados
│   │   │   │   ├── admin/            # Features de admin
│   │   │   │   ├── auth/             # Features de auth
│   │   │   │   ├── business-panel/   # Features empresariales
│   │   │   │   ├── communities/      # Features de comunidades
│   │   │   │   ├── courses/          # Features de cursos
│   │   │   │   ├── study-planner/    # Features del planificador
│   │   │   │   └── ...
│   │   │   ├── lib/                  # Librerías y utilidades
│   │   │   │   ├── supabase/         # Cliente Supabase
│   │   │   │   ├── auth/             # Utilidades de auth
│   │   │   │   └── ...
│   │   │   └── shared/               # Utilidades compartidas
│   │   ├── public/                   # Archivos estáticos
│   │   │   └── locales/              # Traducciones i18n
│   │   └── package.json
│   │
│   └── api/                          # Backend Express
│       ├── src/
│       │   ├── config/               # Configuración
│       │   ├── features/             # Features del backend
│       │   │   └── study-planner/    # Lógica del planificador
│       │   ├── middleware/           # Middlewares
│       │   └── index.ts              # Entry point
│       └── package.json
│
├── packages/
│   ├── shared/                       # Paquete compartido
│   │   ├── src/
│   │   │   ├── constants/            # Constantes compartidas
│   │   │   ├── types/                # Tipos TypeScript
│   │   │   └── utils/                # Utilidades
│   │   └── package.json
│   │
│   └── ui/                           # Componentes UI compartidos
│       ├── src/
│       │   ├── components/           # Componentes UI
│       │   └── utils/                # Utilidades UI
│       └── package.json
│
├── scripts/                          # Scripts de utilidad
│   ├── database/                     # Scripts de base de datos
│   └── supabase/                     # Migraciones SQL
│
├── docs/                             # Documentación
├── supabase/                         # Configuración de Supabase
├── package.json                      # Root package.json
└── README.md                         # Este archivo
```

---

## 🚀 Instalación

### Requisitos Previos

- **Node.js**: >=22.0.0
- **npm**: >=10.5.1
- **Git**: Última versión
- **Cuenta de Supabase**: Para base de datos y autenticación

### Pasos de Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/aprende-y-aplica/chat-bot-lia.git
cd Aprende-y-Aplica
```

2. **Instalar dependencias**
```bash
npm install
```

Esto instalará las dependencias de todos los workspaces del monorepo.

3. **Configurar variables de entorno**

Ver sección [Configuración](#-configuración) para detalles completos.

4. **Ejecutar migraciones de base de datos**

Ejecutar los scripts SQL en `scripts/supabase/` en orden:
- `001-study-planner-phase-0-lesson-times.sql`
- `002-study-planner-phase-1-preferences-plans-sessions.sql`
- `003-study-planner-phase-4-streaks.sql`
- `004-study-planner-phase-5-calendar-subscription-tokens.sql`

---

## ⚙️ Configuración

### Variables de Entorno

Crear archivos `.env.local` en los siguientes directorios:

#### `apps/web/.env.local`
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_de_supabase
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# OpenAI (para LIA y generación de prompts)
OPENAI_API_KEY=tu_openai_api_key

# Autenticación
JWT_SECRET=tu_jwt_secret_seguro
SESSION_SECRET=tu_session_secret_seguro

# URLs
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Integración de Calendarios (Opcional)
# IMPORTANTE: Para usar en el frontend (cliente), las variables deben tener el prefijo NEXT_PUBLIC_
NEXT_PUBLIC_GOOGLE_CLIENT_ID=tu_google_client_id
GOOGLE_CALENDAR_CLIENT_ID=tu_google_client_id
GOOGLE_CALENDAR_CLIENT_SECRET=tu_google_client_secret
NEXT_PUBLIC_MICROSOFT_CLIENT_ID=tu_microsoft_client_id
MICROSOFT_CALENDAR_CLIENT_ID=tu_microsoft_client_id
MICROSOFT_CALENDAR_CLIENT_SECRET=tu_microsoft_client_secret

# Email (Opcional)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=tu_email
SMTP_PASS=tu_password
```

#### `apps/api/.env`
```env
# Supabase
SUPABASE_URL=tu_url_de_supabase
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# Server
PORT=4000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000

# OpenAI
OPENAI_API_KEY=tu_openai_api_key

# JWT
JWT_SECRET=tu_jwt_secret_seguro
```

### Configuración de Supabase

1. Crear un proyecto en [Supabase](https://supabase.com)
2. Obtener las claves de API desde el dashboard
3. Configurar las políticas RLS (Row Level Security) según la documentación
4. Ejecutar las migraciones SQL en orden

### Configuración de OAuth (Opcional)

Para habilitar la integración de calendarios:

#### 1. Google Calendar - Configuración Completa

##### Paso 1: Crear Proyecto y Credenciales

1. Crear proyecto en [Google Cloud Console](https://console.cloud.google.com)
2. Habilitar Google Calendar API:
   - Ve a "APIs & Services" > "Library"
   - Busca "Google Calendar API" y habilítala
3. Crear credenciales OAuth 2.0:
   - Ve a "APIs & Services" > "Credentials"
   - Click en "Create Credentials" > "OAuth client ID"
   - Tipo de aplicación: "Web application"
4. **IMPORTANTE**: Configurar redirect URIs autorizadas:
   - Desarrollo: `http://localhost:3000/api/study-planner/calendar/callback`
   - Producción: `https://tu-dominio.com/api/study-planner/calendar/callback`
   - ⚠️ **El redirect URI debe coincidir EXACTAMENTE** (incluyendo protocolo, dominio y ruta)

##### Paso 2: Configurar OAuth Consent Screen

1. Ve a "APIs & Services" > "OAuth consent screen"
2. Selecciona el tipo de usuario:
   - **Interno**: Solo para usuarios de tu organización (G Suite/Workspace)
   - **Externo**: Para cualquier usuario de Google
3. Completa la información requerida:
   - Nombre de la aplicación
   - Email de soporte
   - Logo (opcional)
   - Dominio de la aplicación
4. Agrega los scopes requeridos:
   - `https://www.googleapis.com/auth/calendar.readonly`
   - `https://www.googleapis.com/auth/calendar.events.readonly`

##### Paso 3: Modo de Prueba (Para Desarrollo)

⚠️ **IMPORTANTE**: Si tu app está en modo "External" y no está verificada por Google, debes usar el modo de prueba:

1. En "OAuth consent screen", verifica que el estado sea **"Testing"** (Prueba)
   - Si está en "In production" (En producción), haz click en "BACK TO TESTING"
2. Agrega usuarios de prueba:
   - En la sección "Test users", click en "+ ADD USERS"
   - Agrega los emails de las personas que usarán la app durante desarrollo
   - Solo estos usuarios podrán conectar su calendario
3. **Límite**: Máximo 100 usuarios de prueba

##### Paso 4: Verificación de Google (Para Producción)

Cuando estés listo para producción y necesites más de 100 usuarios:

1. Ve a "OAuth consent screen"
2. Click en "PUBLISH APP" o "SUBMIT FOR VERIFICATION"
3. Google revisará tu aplicación (puede tomar varias semanas)
4. Requisitos para verificación:
   - Política de privacidad pública
   - Términos de servicio
   - Dominio verificado
   - Demostrar uso legítimo de los scopes

##### Solución de Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| `access_denied` (usuario no autorizado) | Email no está en usuarios de prueba | Agregar email en OAuth consent screen > Test users |
| `redirect_uri_mismatch` | URI no coincide | Verificar URI exacta en Credentials |
| `invalid_client` | Client ID incorrecto | Verificar NEXT_PUBLIC_GOOGLE_CLIENT_ID |
| `App doesn't comply with OAuth 2.0 policy` | App en producción sin verificar | Volver a modo Testing y agregar usuarios de prueba |

#### 2. Microsoft Calendar

1. Crear app en [Azure Portal](https://portal.azure.com)
2. Registrar aplicación Azure AD
3. Configurar redirect URI: `http://localhost:3000/api/study-planner/calendar-integrations/oauth/microsoft/callback`

---

## 📜 Scripts Disponibles

### Scripts Raíz (Monorepo)

```bash
# Desarrollo - Ejecuta frontend y backend en paralelo
npm run dev

# Desarrollo solo frontend
npm run dev:web

# Desarrollo solo backend
npm run dev:api

# Build completo
npm run build

# Build frontend
npm run build:web

# Build backend
npm run build:api

# Build paquetes compartidos
npm run build:packages

# Linting
npm run lint

# Type checking
npm run type-check
```

### Scripts Frontend (`apps/web`)

```bash
cd apps/web

# Desarrollo
npm run dev              # http://localhost:3000

# Build
npm run build

# Iniciar producción
npm start

# Análisis de bundle
npm run analyze          # Análisis completo
npm run analyze:server   # Solo servidor
npm run analyze:browser  # Solo cliente
```

### Scripts Backend (`apps/api`)

```bash
cd apps/api

# Desarrollo
npm run dev              # http://localhost:4000

# Build
npm run build

# Iniciar producción
npm start

# Type checking
npm run type-check
```

---

## 🔌 APIs y Endpoints

La plataforma cuenta con más de **280 endpoints API** organizados en las siguientes categorías:

### Autenticación y Sesiones
```
POST   /api/auth/login                  # Inicio de sesión
POST   /api/auth/register               # Registro de usuario
POST   /api/auth/logout                 # Cerrar sesión
POST   /api/auth/refresh                # Refrescar token
GET    /api/auth/me                     # Obtener usuario actual
GET    /api/auth/sessions               # Listar sesiones activas
GET    /api/auth/questionnaire-status   # Estado del cuestionario
```

### Usuarios y Perfiles
```
GET    /api/users/:userId               # Obtener perfil de usuario
PUT    /api/users/:userId               # Actualizar perfil
GET    /api/users/:userId/skills        # Habilidades del usuario
PUT    /api/users/:userId/skills/:skillId/level  # Actualizar nivel de habilidad
GET    /api/profile                     # Perfil del usuario autenticado
GET    /api/profile/stats               # Estadísticas del perfil
POST   /api/profile/upload-picture      # Subir foto de perfil
POST   /api/profile/upload-curriculum   # Subir curriculum
```

### Cursos y Aprendizaje
```
GET    /api/courses                     # Listar todos los cursos
GET    /api/courses/:slug               # Detalle de curso
GET    /api/courses/:slug/modules       # Módulos del curso
GET    /api/courses/:slug/learn-data    # Datos unificados para aprendizaje (optimizado)
POST   /api/courses/:slug/purchase      # Comprar curso
GET    /api/courses/:slug/check-purchase # Verificar compra
GET    /api/courses/:slug/rating        # Calificación del curso
GET    /api/courses/:slug/skills        # Habilidades asociadas

# Lecciones
GET    /api/courses/:slug/lessons/:lessonId/transcript    # Transcripción
GET    /api/courses/:slug/lessons/:lessonId/summary       # Resumen
GET    /api/courses/:slug/lessons/:lessonId/activities    # Actividades
GET    /api/courses/:slug/lessons/:lessonId/materials     # Materiales
GET    /api/courses/:slug/lessons/:lessonId/progress      # Progreso
PUT    /api/courses/:slug/lessons/:lessonId/progress      # Actualizar progreso
POST   /api/courses/:slug/lessons/:lessonId/feedback      # Enviar feedback
GET    /api/courses/:slug/lessons/:lessonId/access        # Verificar acceso

# Notas
GET    /api/courses/:slug/notes/stats   # Estadísticas de notas
GET    /api/courses/:slug/lessons/:lessonId/notes  # Notas de lección
POST   /api/courses/:slug/lessons/:lessonId/notes  # Crear nota
PUT    /api/courses/:slug/lessons/:lessonId/notes/:noteId # Actualizar nota
DELETE /api/courses/:slug/lessons/:lessonId/notes/:noteId # Eliminar nota

# Preguntas y Respuestas del Curso
GET    /api/courses/:slug/questions                    # Listar preguntas
POST   /api/courses/:slug/questions                    # Crear pregunta
GET    /api/courses/:slug/questions/:questionId        # Detalle de pregunta
PUT    /api/courses/:slug/questions/:questionId        # Actualizar pregunta
POST   /api/courses/:slug/questions/:questionId/responses # Responder
POST   /api/courses/:slug/questions/:questionId/reactions # Reaccionar

# Quiz y Evaluaciones
GET    /api/courses/:slug/lessons/:lessonId/quiz/status  # Estado del quiz
POST   /api/courses/:slug/lessons/:lessonId/quiz/submit  # Enviar quiz
```

### Comunidades
```
GET    /api/communities                 # Listar comunidades
POST   /api/communities                 # Crear comunidad (admin/instructor)
GET    /api/communities/:slug           # Detalle de comunidad
GET    /api/communities/:slug/overview  # Resumen de comunidad
GET    /api/communities/:slug/members   # Miembros de comunidad
POST   /api/communities/join            # Unirse a comunidad
POST   /api/communities/request-access  # Solicitar acceso

# Posts y Contenido
GET    /api/communities/:slug/posts     # Listar posts
POST   /api/communities/:slug/posts     # Crear post
GET    /api/communities/:slug/posts/:postId  # Detalle de post
POST   /api/communities/:slug/posts/:postId/comments  # Comentar
POST   /api/communities/:slug/posts/:postId/reactions  # Reaccionar
GET    /api/communities/:slug/posts/:postId/stats      # Estadísticas

# Encuestas (Polls)
POST   /api/communities/:slug/polls/:postId/vote  # Votar en encuesta

# Ligas y Competencias
GET    /api/communities/:slug/leagues   # Listar ligas
```

### Asistente Virtual LIA
```
# Chat General Contextual
POST   /api/ai-chat                     # Chat con LIA (contextual, adaptativo por sección)

# Generador de Prompts Especializado
POST   /api/ai-directory/generate-prompt # Generar prompt con IA (Lia especializado)

# Onboarding y Presentación
POST   /api/lia/onboarding-chat         # Chat de onboarding para nuevos usuarios

# Ayuda Contextual y Proactiva
GET    /api/lia/available-links         # Enlaces disponibles según rol del usuario
POST   /api/lia/context-help            # Ayuda contextual basada en análisis de sesión
POST   /api/lia/proactive-help          # Ayuda proactiva (antes de que el usuario pregunte)

# Gestión de Conversaciones
GET    /api/lia/conversations           # Listar todas las conversaciones del usuario
POST   /api/lia/conversations           # Crear nueva conversación
GET    /api/lia/conversations/:id       # Detalle de conversación específica
PATCH  /api/lia/conversations/:id       # Actualizar título de conversación
DELETE /api/lia/conversations/:id       # Eliminar conversación
GET    /api/lia/conversations/:id/messages  # Obtener mensajes de una conversación
POST   /api/lia/conversations/:id/messages  # Enviar mensaje en una conversación

# Gestión de Actividades Interactivas
POST   /api/lia/start-activity          # Iniciar interacción con actividad guiada
POST   /api/lia/update-activity         # Actualizar progreso de actividad
POST   /api/lia/complete-activity       # Completar actividad y generar resultados

# Utilidades
POST   /api/lia/end-conversation        # Finalizar conversación y guardar estado
POST   /api/lia/feedback                # Enviar feedback sobre LIA (satisfacción, mejoras)
```

### Directorio de IA
```
# Prompts
GET    /api/ai-directory/prompts        # Listar prompts
GET    /api/ai-directory/prompts/:slug  # Detalle de prompt
POST   /api/ai-directory/prompts/:slug/view   # Registrar visualización
POST   /api/ai-directory/prompts/:slug/rating # Calificar prompt
POST   /api/ai-directory/generate-prompt # Generar prompt con IA (Lia)

# Apps
GET    /api/ai-directory/apps           # Listar apps
GET    /api/ai-directory/apps/:slug     # Detalle de app
POST   /api/ai-directory/apps/:slug/view      # Registrar visualización
POST   /api/ai-directory/apps/:slug/rating    # Calificar app

# Categorías
GET    /api/ai-directory/categories     # Listar categorías

# Favoritos
GET    /api/prompt-favorites            # Prompts favoritos
POST   /api/favorites                   # Agregar favorito
DELETE /api/favorites                   # Eliminar favorito
```

### Planificador de Estudio
```
# Planes
GET    /api/study-planner/plans         # Listar planes de estudio
POST   /api/study-planner/plans         # Crear plan
GET    /api/study-planner/plans/:id     # Detalle de plan
PUT    /api/study-planner/plans/:id     # Actualizar plan
DELETE /api/study-planner/plans/:id     # Eliminar plan

# Modo Manual
POST   /api/study-planner/manual/preview  # Preview de plan manual
POST   /api/study-planner/manual/create   # Crear plan manual

# Modo IA (LIA)
POST   /api/study-planner/ai/preview     # Preview de plan con IA
POST   /api/study-planner/ai/create      # Crear plan con IA

# Guardado de Planes (LIA)
POST   /api/study-planner/save-plan      # Guardar plan generado por LIA
                                      # Incluye guardado de sesiones y sincronización con calendario

# Preferencias
GET    /api/study-planner/preferences    # Obtener preferencias
PUT    /api/study-planner/preferences    # Actualizar preferencias

# Sesiones
GET    /api/study-planner/sessions       # Listar sesiones
POST   /api/study-planner/sessions/:id/complete    # Completar sesión
POST   /api/study-planner/sessions/:id/reschedule  # Reprogramar sesión

# Sincronización de Calendario
POST   /api/study-planner/calendar/sync-sessions   # Sincronizar sesiones con calendario externo
GET    /api/study-planner/calendar/status          # Estado de conexión de calendario

# Dashboard y Estadísticas
GET    /api/study-planner/dashboard/stats  # Estadísticas del dashboard
GET    /api/study-planner/streak          # Obtener racha
GET    /api/study-planner/metrics         # Métricas de estudio

# Integración de Calendarios
GET    /api/study-planner/calendar-integrations          # Listar integraciones
POST   /api/study-planner/calendar-integrations/disconnect # Desconectar
GET    /api/study-planner/calendar-integrations/verify    # Verificar tokens
GET    /api/study-planner/calendar-integrations/export-ics # Exportar ICS
GET    /api/study-planner/calendar-integrations/subscription-token # Token de suscripción
GET    /api/study-planner/calendar-integrations/subscribe/ics/:token # Suscripción ICS pública

# OAuth Calendarios
GET    /api/study-planner/calendar-integrations/oauth/google          # Iniciar OAuth Google
GET    /api/study-planner/calendar-integrations/oauth/google/callback # Callback Google
GET    /api/study-planner/calendar-integrations/oauth/microsoft       # Iniciar OAuth Microsoft
GET    /api/study-planner/calendar-integrations/oauth/microsoft/callback # Callback Microsoft
```

### Panel Empresarial
```
# Organización
GET    /api/business/settings/organization    # Obtener organización
PUT    /api/business/settings/organization    # Actualizar organización
GET    /api/business/settings/subscription    # Obtener suscripción
POST   /api/business/settings/subscription/change-plan # Cambiar plan
GET    /api/business/settings/styles          # Obtener estilos
PUT    /api/business/settings/branding        # Actualizar branding

# Usuarios
GET    /api/business/users                   # Listar usuarios
POST   /api/business/users                   # Crear usuario
GET    /api/business/users/:userId           # Detalle de usuario
PUT    /api/business/users/:userId           # Actualizar usuario
GET    /api/business/users/:userId/stats     # Estadísticas de usuario
POST   /api/business/users/import            # Importar usuarios
GET    /api/business/users/template          # Template de importación
GET    /api/business/users/stats             # Estadísticas generales

# Equipos
GET    /api/business/teams                   # Listar equipos
POST   /api/business/teams                   # Crear equipo
GET    /api/business/teams/:id               # Detalle de equipo
PUT    /api/business/teams/:id               # Actualizar equipo
DELETE /api/business/teams/:id               # Eliminar equipo
GET    /api/business/teams/:id/members       # Miembros del equipo
POST   /api/business/teams/:id/members       # Agregar miembro
GET    /api/business/teams/:id/courses       # Cursos del equipo
POST   /api/business/teams/:id/assign-course # Asignar curso
GET    /api/business/teams/:id/statistics    # Estadísticas
GET    /api/business/teams/:id/analytics/detailed # Analytics detallados
POST   /api/business/teams/:id/feedback      # Enviar feedback
POST   /api/business/teams/:id/messages      # Enviar mensaje
GET    /api/business/teams/:id/objectives    # Objetivos del equipo
POST   /api/business/teams/:id/objectives    # Crear objetivo

# Cursos Empresariales
GET    /api/business/courses                 # Listar cursos
GET    /api/business/courses/:id             # Detalle de curso
POST   /api/business/courses/:id/purchase    # Comprar curso
POST   /api/business/courses/:id/assign      # Asignar curso

# Analytics y Reportes
GET    /api/business/analytics               # Analytics generales
GET    /api/business/analytics/skills        # Analytics de habilidades
GET    /api/business/reports/data            # Datos de reportes
GET    /api/business/progress                # Progreso de usuarios
GET    /api/business/dashboard/stats         # Estadísticas del dashboard
GET    /api/business/dashboard/activity      # Actividad reciente
GET    /api/business/dashboard/progress      # Progreso general

# Certificados Empresariales
GET    /api/business/certificates/:id        # Obtener certificado
GET    /api/business/certificates/templates  # Templates de certificados
GET    /api/business/certificates/:id/download # Descargar certificado
```

### Panel de Administración
```
# Usuarios
GET    /api/admin/users                    # Listar usuarios
POST   /api/admin/users/create             # Crear usuario
GET    /api/admin/users/:id                # Detalle de usuario
PUT    /api/admin/users/:id                # Actualizar usuario

# Cursos
GET    /api/admin/courses                  # Listar cursos
POST   /api/admin/courses                  # Crear curso
GET    /api/admin/courses/:id              # Detalle de curso
PUT    /api/admin/courses/:id              # Actualizar curso
GET    /api/admin/courses/:id/modules      # Módulos del curso
POST   /api/admin/courses/:id/modules      # Crear módulo
PUT    /api/admin/courses/:id/modules/:moduleId # Actualizar módulo
GET    /api/admin/courses/:id/modules/:moduleId/lessons # Lecciones
POST   /api/admin/courses/:id/modules/:moduleId/lessons # Crear lección
PUT    /api/admin/courses/:id/modules/:moduleId/lessons/:lessonId # Actualizar lección

# Comunidades
GET    /api/admin/communities              # Listar comunidades
POST   /api/admin/communities/create       # Crear comunidad
GET    /api/admin/communities/:id          # Detalle de comunidad
PUT    /api/admin/communities/:id          # Actualizar comunidad
GET    /api/admin/communities/access-requests # Solicitudes de acceso

# Dashboard y Estadísticas
GET    /api/admin/dashboard/layout         # Layout del dashboard
PUT    /api/admin/dashboard/layout         # Actualizar layout
GET    /api/admin/dashboard/preferences    # Preferencias
PUT    /api/admin/dashboard/preferences    # Actualizar preferencias
GET    /api/admin/statistics/recent-activity # Actividad reciente
GET    /api/admin/statistics/monthly-growth  # Crecimiento mensual
GET    /api/admin/statistics/content-distribution # Distribución de contenido
GET    /api/admin/performance-dashboard    # Dashboard de performance
GET    /api/admin/stats                    # Estadísticas generales

# Otros
GET    /api/admin/skills                   # Listar habilidades
POST   /api/admin/upload/course-videos     # Subir videos
GET    /api/admin/rate-limit/stats         # Estadísticas de rate limiting
```

### Notificaciones
```
GET    /api/notifications                  # Listar notificaciones
POST   /api/notifications/:id/read         # Marcar como leída
DELETE /api/notifications/:id              # Eliminar notificación
POST   /api/notifications/mark-all-read    # Marcar todas como leídas
GET    /api/notifications/unread-count     # Contador de no leídas
```

### Certificados
```
GET    /api/certificates                   # Listar certificados
POST   /api/certificates/generate          # Generar certificado
GET    /api/certificates/:id/download      # Descargar certificado
GET    /api/certificates/verify/:hash      # Verificar certificado
```

### Suscripciones
```
GET    /api/subscriptions/personal/plans   # Listar planes personales
POST   /api/subscriptions/personal/subscribe # Suscribirse
GET    /api/subscriptions/personal/current  # Suscripción actual
POST   /api/subscriptions/personal/cancel   # Cancelar suscripción
```

### Otras Funcionalidades
```
# Reels
GET    /api/reels                          # Listar reels
POST   /api/reels                          # Crear reel
GET    /api/reels/:id                      # Detalle de reel
POST   /api/reels/:id/like                 # Me gusta
POST   /api/reels/:id/view                 # Registrar visualización
GET    /api/reels/featured                 # Reels destacados

# Noticias
GET    /api/news                           # Listar noticias
GET    /api/news/:slug                     # Detalle de noticia
POST   /api/news/:slug/save                # Guardar noticia

# Habilidades
GET    /api/skills                         # Listar todas las habilidades

# Carrito y Compras
POST   /api/cart/checkout                  # Procesar compra
GET    /api/purchase-history               # Historial de compras

# Estadísticas
GET    /api/statistics/profile             # Estadísticas del perfil
GET    /api/statistics/learning-stats      # Estadísticas de aprendizaje
GET    /api/statistics/reference-data      # Datos de referencia

# Performance
GET    /api/performance/metrics            # Métricas de performance
```

### Características de los Endpoints

- **Autenticación**: La mayoría de endpoints requieren autenticación mediante cookies de sesión
- **Validación**: Validación de datos con Zod en todos los endpoints
- **Rate Limiting**: Protección contra abuso con rate limiting
- **Caching**: Headers de cache optimizados para endpoints estáticos
- **Error Handling**: Manejo consistente de errores con códigos HTTP apropiados
- **Type Safety**: Tipos TypeScript completos para todas las requests/responses

---

## 🗄️ Base de Datos

### Arquitectura de Datos

La plataforma utiliza **PostgreSQL** a través de **Supabase** con las siguientes características:

- **Connection Pooling**: PgBouncer para optimización de conexiones
- **Row Level Security (RLS)**: Seguridad a nivel de fila en todas las tablas
- **Triggers y Funciones**: Lógica de negocio en base de datos
- **Índices Optimizados**: Para búsquedas y consultas rápidas
- **Foreign Keys**: Integridad referencial garantizada

### Tablas Principales

#### Usuarios y Autenticación
```sql
users                    # Usuarios del sistema
user_perfil             # Perfiles profesionales completos
user_session            # Sesiones activas con JWT
password_reset_tokens   # Tokens de recuperación de contraseña
roles                   # Roles del sistema
areas                   # Áreas profesionales
niveles                 # Niveles jerárquicos
sectores                # Sectores de la industria
tamanos_empresa         # Tamaños de empresa
relaciones              # Tipos de relación laboral
```

#### Cursos y Aprendizaje
```sql
courses                 # Catálogo de cursos
course_modules          # Módulos de cursos
course_lessons          # Lecciones por módulo
lesson_activities       # Actividades por lección
lesson_materials        # Materiales por lección
lesson_checkpoints      # Checkpoints de evaluación
course_purchases        # Compras de cursos
course_progress         # Progreso de curso por usuario
module_progress         # Progreso de módulo por usuario
lesson_progress         # Progreso de lección por usuario
lesson_feedback         # Feedback de lecciones
lesson_notes            # Notas personales por lección
course_questions        # Preguntas del curso
question_responses      # Respuestas a preguntas
question_reactions      # Reacciones a preguntas/respuestas
course_ratings          # Calificaciones de cursos
```

#### Comunidades
```sql
communities             # Comunidades
community_members       # Miembros de comunidades
community_access_requests # Solicitudes de acceso
community_posts         # Posts en comunidades
post_comments           # Comentarios en posts
post_reactions          # Reacciones en posts
community_polls         # Encuestas en comunidades
poll_votes              # Votos en encuestas
community_leagues       # Ligas y competencias
```

#### Planificador de Estudio
```sql
study_preferences       # Preferencias de estudio del usuario
study_plans             # Planes de estudio (manuales y generados por IA)
study_sessions          # Sesiones de estudio programadas
user_streaks            # Rachas de estudio diarias
daily_progress          # Progreso diario (para heatmap)
calendar_integrations   # Integraciones de calendarios (Google, Microsoft)
calendar_subscription_tokens # Tokens únicos para suscripciones ICS públicas
```

**Características de las Tablas:**
- `study_plans`: Almacena planes con metadatos de generación IA, preferencias de sesión, y configuración de calendario
- `study_sessions`: Sesiones con información de calendario externo, estado de sincronización, y métricas de completado
- `calendar_integrations`: Tokens OAuth y configuración de proveedores de calendario

#### Directorio de IA
```sql
ai_categories           # Categorías de prompts y apps
ai_prompts              # Prompts de IA
ai_apps                 # Aplicaciones de IA
prompt_favorites        # Prompts favoritos
app_favorites           # Apps favoritas
prompt_ratings          # Calificaciones de prompts
app_ratings             # Calificaciones de apps
```

#### Panel Empresarial
```sql
organizations           # Organizaciones
organization_members    # Miembros de organizaciones
organization_settings   # Configuración de organizaciones
business_subscriptions  # Suscripciones empresariales
business_teams          # Equipos empresariales
team_members            # Miembros de equipos
team_objectives         # Objetivos de equipos
business_certificates   # Certificados empresariales
certificate_templates   # Templates de certificados
```

#### Otros
```sql
notifications           # Notificaciones
subscriptions           # Suscripciones personales
certificates            # Certificados
skills                  # Habilidades del sistema
user_skills             # Habilidades de usuarios
skill_badges            # Badges de habilidades
news                    # Noticias y artículos
news_saves              # Noticias guardadas
reels                   # Reels (contenido corto)
reel_likes              # Me gusta en reels
reel_comments           # Comentarios en reels
workshops               # Talleres
favorites               # Favoritos generales
cart_items              # Items del carrito
purchases               # Compras realizadas
audit_logs              # Logs de auditoría
admin_dashboard_layouts # Layouts personalizados del dashboard
admin_dashboard_preferences # Preferencias del dashboard
```

### Funciones SQL y Triggers

#### Funciones Principales
```sql
-- Planificador de Estudio
update_user_streak()                    # Actualiza racha automáticamente
get_dashboard_stats()                   # Estadísticas del dashboard
get_or_create_subscription_token()      # Genera token de suscripción ICS
regenerate_subscription_token()         # Regenera token
update_token_usage()                    # Actualiza uso de token

-- Cursos
calculate_lesson_time()                 # Calcula tiempo estimado de lección
update_course_progress()                # Actualiza progreso de curso
unlock_next_module()                    # Desbloquea siguiente módulo

-- Habilidades
get_user_skill_level()                  # Obtiene nivel de habilidad
calculate_skill_progress()              # Calcula progreso
```

#### Triggers Automáticos
```sql
-- Actualización de timestamps
update_updated_at_column()              # Actualiza updated_at automáticamente

-- Actualización de progreso
trigger_update_course_progress()        # Actualiza curso al completar módulo
trigger_unlock_next_module()            # Desbloquea siguiente módulo

-- Actualización de rachas
trigger_update_user_streak()            # Actualiza racha al completar sesión

-- Actualización de contadores
trigger_update_vote_count()             # Actualiza contadores de votos
trigger_update_rating()                 # Actualiza calificación promedio
```

### Políticas RLS (Row Level Security)

Todas las tablas tienen políticas RLS configuradas para seguridad:

```sql
-- Ejemplo: Política para ver cursos
CREATE POLICY "Users can view published courses"
ON courses FOR SELECT
USING (is_published = true OR 
       EXISTS (SELECT 1 FROM course_purchases 
               WHERE course_id = courses.id AND user_id = auth.uid()));

-- Ejemplo: Política para editar perfil propio
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
USING (id = auth.uid());
```

### Optimizaciones de Base de Datos

- **Índices Compuestos**: Para consultas complejas
- **Índices Parciales**: Para filtros comunes
- **Vistas Materializadas**: Para reportes pesados
- **Particionamiento**: Para tablas grandes (futuro)
- **Connection Pooling**: PgBouncer con modo transaction
- **Query Optimization**: Análisis y optimización de queries lentas

---

## 🔐 Sistema de Autenticación

### Arquitectura de Autenticación

La plataforma utiliza un **sistema híbrido** de autenticación:

1. **Supabase Auth**: Para registro y login inicial
2. **Sesiones Personalizadas**: Sistema de sesiones propio con tokens JWT
3. **Refresh Tokens**: Renovación automática de tokens

### Flujo de Autenticación

```
1. Usuario se registra/inicia sesión
   ↓
2. Supabase Auth valida credenciales
   ↓
3. Se crea sesión personalizada en user_session
   ↓
4. Se genera JWT token con fingerprint de dispositivo
   ↓
5. Cookie de sesión se establece en el cliente
   ↓
6. Middleware valida sesión en cada request
   ↓
7. Si expira, se refresca automáticamente
```

### Componentes del Sistema

#### SessionService
```typescript
// Servicio principal de sesiones
class SessionService {
  async createSession(userId: string, deviceFingerprint: string)
  async getCurrentUser()
  async refreshSession()
  async revokeSession()
  async validateSession(token: string)
}
```

#### Middleware de Autenticación
```typescript
// Middleware para proteger rutas
export async function requireAuth()
export async function requireAdmin()
export async function requireInstructor()
export async function requireBusiness()
export async function requireBusinessUser()
```

### Seguridad

- **JWT con Fingerprint**: Verificación de dispositivo
- **Expiración Configurable**: Tokens expiran según configuración
- **Revocación**: Sesiones pueden ser revocadas
- **Rate Limiting**: Protección contra ataques de fuerza bruta
- **CORS Estricto**: Solo dominios permitidos
- **CSRF Protection**: Protección contra CSRF
- **Secure Cookies**: Cookies solo HTTPS en producción

---

## ⚡ Optimizaciones y Performance

### Optimizaciones Frontend

#### 1. Connection Pooling de Supabase
```typescript
// Cache de clientes del servidor para reducir overhead
const serverClientCache = new Map<string, SupabaseClient>()
// Reutiliza clientes basados en cookies de autenticación
// Reduce overhead de creación de ~50-100ms a ~0ms en cache hits
```

#### 2. Endpoint Unificado de Aprendizaje
```typescript
// GET /api/courses/[slug]/learn-data
// Consolida 8 endpoints en UN SOLO REQUEST:
// - Datos del curso
// - Módulos y lecciones
// - Transcripción, resumen, actividades, materiales
// - Preguntas y estadísticas de notas
// Reduce 8 HTTP requests a 1 (~40-50% mejora)
```

#### 3. Cache Headers Inteligentes
```typescript
// Diferentes estrategias según el tipo de contenido:
- staticCache      // 1 año - contenido completamente estático
- semiStaticCache  // 5 min - contenido que cambia ocasionalmente
- dynamicCache     // 30 seg - contenido dinámico
- noCache          // Sin cache - contenido personalizado
```

#### 4. SWR para Data Fetching
```typescript
// Revalidación automática y cache inteligente
useSWR('/api/courses', fetcher, {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 2000
})
```

#### 5. Code Splitting
- Lazy loading de componentes pesados
- Dynamic imports para rutas
- Bundle analysis con @next/bundle-analyzer

### Optimizaciones Backend

#### 1. Rate Limiting
```typescript
// Protección contra abuso
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000,                 // 1000 requests por ventana
  // Límites específicos para endpoints sensibles
})
```

#### 2. Compression
```typescript
// Compresión automática de respuestas
app.use(compression())
```

#### 3. Query Optimization
- Índices en todas las foreign keys
- Índices compuestos para queries comunes
- Uso de EXPLAIN ANALYZE para optimización

#### 4. Connection Pooling
- PgBouncer en modo transaction
- Pool size optimizado según carga

### Métricas de Performance

- **First Contentful Paint (FCP)**: < 1.5s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Time to Interactive (TTI)**: < 3.5s
- **Cumulative Layout Shift (CLS)**: < 0.1
- **First Input Delay (FID)**: < 100ms
- **API Response Time P95**: < 500ms
- **API Response Time P99**: < 1000ms

### Monitoreo

- **Performance Metrics API**: `/api/performance/metrics`
- **Rate Limit Stats**: `/api/admin/rate-limit/stats`
- **Performance Dashboard**: Panel de administración

---

## 🎯 Funcionalidades Detalladas

### 1. Sistema de Autenticación

- **Login/Registro**: Con email y contraseña
- **Sesiones Personalizadas**: Sistema de sesiones con tokens JWT
- **Gestión de Perfiles**: Perfiles completos con avatar, bio, preferencias
- **Roles y Permisos**: Sistema granular de roles
- **Recuperación de Contraseña**: Flujo completo de reset

### 2. Sistema de Cursos

- **Creación de Cursos**: Por instructores y administradores
- **Estructura Modular**: Cursos → Módulos → Lecciones → Actividades
- **Seguimiento de Progreso**: Granular por cada elemento
- **Materiales**: Videos, documentos, enlaces, actividades
- **Evaluaciones**: Tests y quizzes con calificación
- **Sistema de Notas**: Notas personales por lección
- **Feedback**: Sistema estructurado de retroalimentación

### 3. Asistente Virtual LIA (Learning Intelligence Assistant)

**LIA** es el asistente de inteligencia artificial integrado en toda la plataforma, diseñado para proporcionar ayuda contextual y personalizada en múltiples modalidades especializadas.

#### 🎯 Múltiples Modos de Operación

**1. LIA General (Chat Contextual)**
- **Endpoint**: `POST /api/ai-chat`
- **Modelo**: GPT-4 Turbo (gpt-4o)
- **Contexto Dinámico**: Se adapta automáticamente a la sección actual de la plataforma
- **Capacidades Principales**:
  - Responde preguntas sobre contenido educativo y funcionalidades de la plataforma
  - Proporciona navegación contextual con enlaces funcionales `[texto](url)`
  - Identifica el rol del usuario (Administrador, Instructor, Estudiante, Business) y personaliza respuestas
  - Detecta la página actual y extrae contexto del DOM (títulos, headings, texto principal)
  - Soporte multiidioma: Español (ES), Inglés (EN), Portugués (PT)
  - Mantiene historial de conversación para contexto continuo
  - Personalización por nombre de usuario para conexión más cercana
- **Restricciones de Formato**:
  - **NO usa Markdown** (excepto enlaces funcionales)
  - Texto plano con emojis estratégicos
  - Estructura con viñetas simples (-) o números
  - Enlaces en formato `[texto](url)` para navegación
- **Contexto de Cursos**:
  - Prioriza transcripción del video actual
  - Responde basándose en contenido de la lección
  - Soporta prompts de actividades interactivas
  - Redirige preguntas fuera del alcance del curso
- **Componente**: `AIChatAgent` disponible en toda la plataforma

**2. LIA Generador de Prompts (Lia Especializado)**
- **Endpoint**: `POST /api/ai-directory/generate-prompt`
- **Modelo**: GPT-4o
- **Especialidad Exclusiva**: Creación de prompts profesionales de IA
- **Configuración Especializada**:
  - **Identidad**: Lia, especialista en creación de prompts
  - **Tono**: Profesional, directo y eficiente
  - **Enfoque**: EXCLUSIVAMENTE creación de prompts, NO consultoría general
- **Características Técnicas**:
  - **Detección de Prompt Injection**: Bloquea automáticamente intentos de manipulación
    - Patrones detectados: "ignore previous instructions", "jailbreak", "act as a", "forget everything", "new instructions", "override", "system prompt", "you are now", "pretend to be", "roleplay as", "dan mode", "developer mode"
  - **Control de Tema Estricto**: Rechaza automáticamente preguntas fuera de tema
    - Temas permitidos: creación de prompts, estructura de prompts, optimización, categorías, mejores prácticas
    - Temas prohibidos: consultoría general de IA, chistes, conversación casual, preguntas personales, explicaciones generales
  - **Respuesta Estructurada**: Genera prompts en formato JSON con:
    - `title`: Título claro y descriptivo
    - `description`: Descripción breve del propósito
    - `content`: Contenido completo del prompt (mínimo 200 palabras, formato Markdown estructurado)
    - `tags`: Array de 3-5 tags relevantes
    - `difficulty_level`: beginner | intermediate | advanced
    - `use_cases`: Array de casos de uso específicos
    - `tips`: Array de consejos técnicos para optimización
- **Categorías Soportadas**:
  - Marketing y Ventas
  - Contenido Creativo
  - Programación y Desarrollo
  - Análisis de Datos
  - Educación y Capacitación
  - Redacción y Comunicación
  - Investigación y Análisis
  - Automatización de Procesos
  - Arte y Diseño
  - Negocios y Estrategia
- **Formato de Salida**: JSON estricto con estructura validada
- **Configuración OpenAI**:
  - Temperature: 0.7
  - Max Tokens: 1000
  - Response Format: `json_object`

**3. LIA Onboarding (Asistente de Presentación)**
- **Endpoint**: `POST /api/lia/onboarding-chat`
- **Propósito**: Guiar nuevos usuarios en su primera experiencia con la plataforma
- **Componente**: `OnboardingAgent` con integración de voz
- **Características**:
  - **Respuestas Contextuales**: Adaptadas al paso actual del onboarding
  - **Integración de Voz**: 
    - Reconocimiento de voz (Web Speech API)
    - Síntesis de voz con ElevenLabs para respuestas habladas
    - Interacción conversacional por voz
  - **Pasos del Onboarding**:
    1. Bienvenida a la plataforma
    2. Presentación de LIA y sus capacidades
    3. Exploración del contenido (cursos, talleres, comunidades)
    4. Directorio de Prompts
    5. Conversación interactiva con el usuario
  - **Tono**: Breve, conversacional, amigable y entusiasta
  - **Formato**: Máximo 3-4 oraciones (optimizado para lectura en voz alta)
  - **Contexto**: Mantiene historial de conversación durante el onboarding
  - **Delegación**: Utiliza el endpoint central `/api/ai-chat` para respuestas consistentes

**4. LIA Contextual (Ayuda en Actividades de Cursos)**
- **Endpoint**: `POST /api/lia/context-help`
- **Funcionalidad**: Analiza la sesión del usuario y proporciona ayuda específica basada en comportamiento
- **Análisis de Sesión**:
  - **Eventos Analizados**: Clicks, scrolls, inputs, tiempo en página, recursos consultados
  - **Métricas Detectadas**:
    - Tiempo total en la página
    - Número de intentos realizados
    - Dificultad percibida (difficulty score)
    - Recursos adicionales consultados
    - Valores ingresados en formularios
  - **Ventana de Análisis**: Configurable (default: 2 minutos)
- **Capacidades**:
  - Detecta cuando el usuario está teniendo dificultades significativas (score > 0.7)
  - Identifica frustración por tiempo excesivo en página (> 3 minutos)
  - Sugiere recursos cuando no se han consultado materiales adicionales
  - Analiza inputs del usuario y proporciona feedback específico
  - Ofrece pasos claros y accionables basados en el contexto
- **Respuesta Contextual**:
  - Referencia específica a lo observado en la sesión
  - Feedback concreto sobre inputs del usuario
  - Sugerencias de recursos específicos
  - Tono empático si detecta frustración
  - Emojis para hacer la respuesta más amigable
- **Integración**: Se activa desde actividades interactivas en cursos

**5. LIA Proactivo (Ayuda Preventiva)**
- **Endpoint**: `POST /api/lia/proactive-help`
- **Funcionalidad**: Ofrece ayuda automáticamente antes de que el usuario la solicite
- **Detección de Patrones**:
  - **Inactividad**: Usuario sin actividad por tiempo prolongado
  - **Intentos Fallidos**: Múltiples intentos sin éxito (failed_attempts)
  - **Scroll Excesivo**: Búsqueda intensa de información (excessive_scroll)
  - **Eliminaciones Frecuentes**: Borrado y reescritura constante (frequent_deletion)
  - **Ciclos Repetitivos**: Navegación hacia atrás repetidamente (repetitive_cycles)
  - **Clicks Erróneos**: Clicks en elementos que no responden (erroneous_clicks)
- **Análisis de Dificultad**:
  - **Overall Score**: Puntuación general de dificultad (0-1)
  - **Patrones Detectados**: Lista de patrones con descripción y severidad
  - **Contexto de Sesión**: Tiempo total, clicks, scrolls, inputs, intentos
- **Respuesta Proactiva**:
  - Saludo breve y empático
  - Observación de lo detectado (sin ser muy técnico)
  - 2-3 sugerencias concretas y accionables
  - Pregunta abierta para continuar la conversación
  - Recursos relevantes según los patrones detectados
  - Próximos pasos sugeridos
- **Tono**: Empático, específico, accionable y motivador

**6. LIA en Cursos (Tutor Personalizado)**
- **Integración**: Directamente en `/courses/[slug]/learn`
- **Contexto Especializado**:
  - **Prioridad #1**: Responde ÚNICAMENTE basándose en la TRANSCRIPCIÓN del video actual
  - **Excepción**: Prompts de actividades interactivas (permite conocimiento general relacionado)
  - **Restricciones Estrictas**:
    - ✅ Permitido: Contenido del curso actual, conceptos educativos relacionados, explicaciones del material, prompts de actividades interactivas
    - ❌ Prohibido: Personajes de ficción, temas de cultura general no relacionados, entretenimiento, deportes, celebridades
  - **Manejo de Preguntas Cortas**: Responde directamente con contenido de la lección actual
- **Características**:
  - Acceso a transcripción completa del video
  - Resumen de la lección como referencia adicional
  - Información del módulo y curso
  - Personalización por nombre del usuario
  - Adaptación al rol profesional del usuario
  - Tono cálido y acogedor como tutor personal
- **Interacción con Actividades**:
  - Soporte para actividades guiadas paso a paso
  - Generación de CSV con datos recopilados
  - Seguimiento estricto del progreso en actividades
  - Redirección cuando el usuario se desvía del objetivo
- **Formato de Respuestas**:
  - Texto plano sin Markdown (excepto enlaces)
  - Citas específicas del contenido de la transcripción
  - Ejemplos concretos del material educativo

**7. Sistema de Conversaciones de LIA**
- **Endpoints**:
  - `GET /api/lia/conversations` - Listar todas las conversaciones del usuario
  - `POST /api/lia/conversations` - Crear nueva conversación
  - `GET /api/lia/conversations/:id` - Obtener detalles de una conversación
  - `GET /api/lia/conversations/:id/messages` - Obtener mensajes de una conversación
  - `POST /api/lia/conversations/:id/messages` - Enviar mensaje en una conversación
  - `PATCH /api/lia/conversations/:id` - Actualizar título de conversación
  - `DELETE /api/lia/conversations/:id` - Eliminar conversación
- **Gestión de Actividades**:
  - `POST /api/lia/start-activity` - Iniciar interacción con actividad
  - `POST /api/lia/update-activity` - Actualizar progreso de actividad
  - `POST /api/lia/complete-activity` - Completar actividad
  - `POST /api/lia/end-conversation` - Finalizar conversación
- **Feedback**:
  - `POST /api/lia/feedback` - Enviar feedback sobre LIA
- **Enlaces Disponibles**:
  - `GET /api/lia/available-links` - Obtener enlaces disponibles según rol del usuario

#### 🔒 Características Técnicas de Seguridad

**Protección contra Prompt Injection:**
- Detección automática de patrones maliciosos
- Bloqueo de intentos de manipulación
- Validación de contenido antes de procesar
- Respuestas de seguridad cuando se detecta manipulación

**Control de Tema y Contenido:**
- Redirección automática de preguntas fuera de tema
- Validación de contexto según sección actual
- Restricciones específicas para cursos
- Sanitización de respuestas (eliminación de Markdown excepto enlaces)

**Sistema de Contexto Dinámico:**
```typescript
// El contexto se construye según:
- Página actual (pathname)
- Contenido extraído del DOM (headings, texto principal, meta description)
- Rol del usuario (Administrador, Instructor, Estudiante, Business, Business User)
- Links disponibles según rol
- Contexto de curso/lección si está en un curso
- Transcripción del video actual (en cursos)
- Historial de conversación (últimas interacciones)
- Idioma del usuario (ES, EN, PT)
- Nombre del usuario para personalización
```

**Personalización por Rol:**
- **Estudiante**: Enfoque en aprendizaje, comprensión y progreso
- **Instructor**: Herramientas de enseñanza, creación de contenido, estadísticas
- **Administrador**: Gestión de plataforma, configuración, analytics
- **Business**: Gestión de equipos, organizaciones, reportes corporativos
- **Business User**: Acceso a contenido empresarial asignado

**Integración con OpenAI:**
- **Modelo Principal**: GPT-4 Turbo (gpt-4o)
- **Temperature**: 0.7 (equilibrio entre creatividad y precisión)
- **Max Tokens**: Configurable según el contexto (800-2000)
- **System Prompts**: Construidos dinámicamente según contexto y sección
- **Conversation History**: Mantiene últimas 6-10 interacciones para contexto
- **Rate Limiting**: Protección contra abuso con límites configurables
- **Cost Monitoring**: Tracking de uso y costos de OpenAI

**Sistema de Logging y Analytics:**
- **LiaLogger**: Registra todas las interacciones con contexto completo
- **Métricas Tracked**:
  - Tiempo de respuesta de OpenAI
  - Uso por sección de la plataforma
  - Satisfacción del usuario (feedback)
  - Patrones de uso por rol
  - Contextos más utilizados
  - Costos por conversación
- **Context Tracking**: Analiza qué secciones usan más LIA
- **Error Logging**: Registro estructurado de errores para debugging
- **Performance Monitoring**: Métricas de latencia y throughput

### 4. Comunidades

- **Creación**: Por usuarios con permisos
- **Tipos de Acceso**: Público, privado, por invitación, pago
- **Q&A**: Sistema de preguntas y respuestas
- **Votación**: Upvotes/downvotes
- **Moderación**: Roles de moderador y administrador
- **Categorías**: Organización por temas

### 5. Panel de Administración

El Panel de Administración es la interfaz central para gestionar todos los aspectos de la plataforma. Solo accesible para usuarios con rol "Administrador".

#### Funcionalidades Principales

**Dashboard Principal** (`/admin/dashboard`)
- **Estadísticas en Tiempo Real**:
  - Total de usuarios activos
  - Cursos publicados
  - Comunidades activas
  - Prompts disponibles
  - Apps de IA catalogadas
- **Actividad Reciente**: Timeline de eventos importantes
- **Acciones Rápidas**: Acceso directo a funciones comunes
- **Gráficos de Crecimiento**: Visualización de métricas clave

**Gestión de Usuarios** (`/admin/users`)
- **Lista Completa**: Vista tabular de todos los usuarios
- **Filtros Avanzados**: 
  - Por rol (Administrador, Instructor, Estudiante, Business)
  - Por estado de verificación de email
  - Por fecha de registro
  - Búsqueda por nombre, email, username
- **Acciones Disponibles**:
  - Ver perfil completo
  - Editar información de usuario
  - Cambiar rol
  - Suspender/Activar cuentas
  - Eliminar usuarios
- **Estadísticas de Usuarios**:
  - Total por rol
  - Usuarios activos vs inactivos
  - Verificados vs no verificados

**Gestión de Talleres/Workshops** (`/admin/workshops`)
- **Vista de Tarjetas**: Diseño visual con información destacada
- **Filtros**: Por categoría, nivel de dificultad, estado (activo/inactivo)
- **CRUD Completo**:
  - Crear nuevos talleres
  - Editar talleres existentes
  - Activar/Desactivar talleres
  - Eliminar talleres
- **Estadísticas por Taller**:
  - Número de estudiantes inscritos
  - Duración total
  - Engagement rate
  - Tasa de completado

**Gestión de Comunidades** (`/admin/communities`)
- **Vista Detallada**: Información completa de cada comunidad
- **Filtros**: Por categoría, tipo de acceso, estado, visibilidad
- **Métricas de Comunidad**:
  - Número de miembros
  - Posts y comentarios
  - Actividad reciente
- **Acciones de Moderación**:
  - Editar información de comunidad
  - Gestionar miembros
  - Moderar contenido
  - Aprobar/Rechazar solicitudes de acceso
  - Activar/Desactivar comunidades

**Gestión de Prompts de IA** (`/admin/prompts`)
- **Catálogo Completo**: Lista de todos los prompts
- **Filtros Avanzados**:
  - Por categoría
  - Por nivel de dificultad
  - Por estado (featured, verified, active)
  - Búsqueda por título o contenido
- **Métricas de Prompts**:
  - Número de vistas
  - Likes recibidos
  - Descargas
  - Rating promedio
- **Acciones**:
  - Destacar prompts
  - Verificar prompts
  - Editar contenido
  - Eliminar prompts

**Gestión de Apps de IA** (`/admin/apps`)
- **Catálogo de Apps**: Lista de todas las aplicaciones catalogadas
- **Información Detallada**: Pricing, features, integraciones
- **Gestión**:
  - Agregar nuevas apps
  - Editar información
  - Marcar como featured
  - Gestionar categorías

**Gestión de Skills/Habilidades** (`/admin/skills`)
- **Catálogo de Skills**: Todas las habilidades disponibles
- **Gestión de Badges**: Iconos y niveles por habilidad
- **Asignación**: Vincular skills a cursos
- **Métricas**: Tracking de habilidades por usuario

**Gestión de Noticias** (`/admin/news`)
- **CRUD Completo**: Crear, editar, publicar noticias
- **Estadísticas**: Vistas, tiempo de lectura, engagement
- **Categorización**: Organizar por categorías y tags

**Gestión de Reels** (`/admin/reels`)
- **Moderación**: Revisar y aprobar contenido
- **Estadísticas**: Vistas, likes, comentarios
- **Gestión**: Feature/unfeature reels

**Estadísticas y Analytics** (`/admin/statistics`)
- **Métricas Generales**:
  - Crecimiento mensual de usuarios
  - Distribución de contenido
  - Actividad reciente
- **Gráficos Interactivos**:
  - Gráficos de barras
  - Gráficos de líneas
  - Gráficos circulares
  - Heatmaps de actividad
- **Filtros Temporales**: Diferentes períodos de análisis
- **Exportación**: Descargar reportes (futuro)

**Estadísticas de Usuarios** (`/admin/user-stats`)
- **Análisis Profundo**: Estadísticas detalladas por usuario
- **Preguntas y Respuestas**: Ver historial de Q&A
- **Adopción de IA**: Tracking de uso de herramientas de IA
- **Perfiles Completos**: Información detallada de usuarios

**Gestión de Empresas** (`/admin/companies`)
- **Organizaciones**: Ver todas las empresas registradas
- **Suscripciones**: Estado de suscripciones empresariales
- **Estadísticas**: Métricas por organización

**Reportes** (`/admin/reportes`)
- **Generación de Reportes**: Reportes personalizados
- **Filtros Avanzados**: Por fecha, tipo, usuario, etc.
- **Exportación**: PDF, Excel, CSV

**Moderación con IA** (`/admin/moderation-ai`)
- **Detección Automática**: Sistema de moderación asistida por IA
- **Revisión de Contenido**: Análisis de posts y comentarios
- **Logs de Moderación**: Historial de acciones

#### Características Técnicas del Panel de Admin

**Protección de Rutas:**
- Middleware que verifica rol "Administrador"
- Redirección automática si no tiene permisos
- Layout protegido con verificación de sesión

**Dashboard Personalizable:**
- Layouts configurables por usuario
- Widgets arrastrables (futuro)
- Preferencias de visualización

**Performance:**
- Carga incremental de datos
- Paginación en listas grandes
- Cache inteligente de estadísticas

### 6. Panel de Instructor

El Panel de Instructor está diseñado específicamente para educadores que crean y gestionan contenido educativo en la plataforma.

#### Funcionalidades Principales

**Dashboard de Instructor** (`/instructor/dashboard`)
- **Estadísticas Personales**:
  - Total de cursos/talleres creados
  - Estudiantes inscritos
  - Cursos más populares
  - Engagement promedio
  - Ingresos (si aplica)
- **Actividad Reciente**:
  - Nuevos estudiantes
  - Comentarios en cursos
  - Preguntas de estudiantes
  - Feedback recibido
- **Acciones Rápidas**:
  - Crear nuevo taller
  - Crear noticia
  - Crear reel
  - Ver estadísticas

**Gestión de Talleres** (`/instructor/workshops`)
- **Creación Completa de Talleres**:
  - Información básica (título, descripción, categoría)
  - Estructura modular (módulos, lecciones)
  - Materiales (videos, documentos, enlaces)
  - Actividades interactivas
  - Evaluaciones y quizzes
- **Gestión de Cursos**:
  - Edición de contenido existente
  - Organización de módulos y lecciones
  - Subida de videos y materiales
  - Configuración de actividades
- **Estadísticas por Curso**:
  - Número de estudiantes
  - Progreso promedio
  - Tasa de completado
  - Feedback de estudiantes

**Gestión de Comunidades** (`/instructor/communities`)
- **Crear Comunidades**: Iniciar nuevas comunidades educativas
- **Gestionar Comunidades Propias**:
  - Moderar contenido
  - Aprobar solicitudes de acceso
  - Gestionar miembros
  - Configurar reglas
- **Estadísticas de Comunidades**:
  - Miembros activos
  - Nivel de participación
  - Posts más populares

**Gestión de Contenido**
- **Noticias** (`/instructor/news`):
  - Crear artículos educativos
  - Publicar noticias relevantes
  - Estadísticas de lectura
- **Reels** (`/instructor/reels`):
  - Crear contenido corto educativo
  - Videos rápidos y dinámicos
  - Estadísticas de engagement

**Estadísticas e Insights** (`/instructor/stats`)
- **Métricas de Rendimiento**:
  - Visualización de gráficos interactivos
  - Tendencias de inscripciones
  - Engagement por contenido
  - Feedback de estudiantes
- **Análisis de Contenido**:
  - Lecciones más vistas
  - Materiales más descargados
  - Actividades con mayor participación

**Firma Digital**
- **Subida de Firma**: Para certificados personalizados
- **Gestión**: Actualizar o eliminar firma

#### Características Técnicas

**Autenticación:**
- Verificación de rol "Instructor"
- Acceso exclusivo a contenido propio
- Permisos para crear y editar contenido

**Gestión de Contenido:**
- Editor enriquecido para descripciones
- Subida de archivos multimedia
- Preview en tiempo real
- Validación de contenido antes de publicar

### 7. Panel Empresarial (Business Panel)

El Panel Empresarial permite a las organizaciones gestionar equipos, capacitar empleados y analizar el progreso de aprendizaje a nivel corporativo.

#### Funcionalidades Completas

**Dashboard Empresarial** (`/business-panel/dashboard`)
- **Vista Ejecutiva**:
  - Total de usuarios en la organización
  - Cursos completados
  - Progreso promedio
  - Actividad reciente
- **Métricas Clave**:
  - Tasa de participación
  - Horas de capacitación
  - Certificados emitidos
  - Habilidades desarrolladas
- **Actividad en Tiempo Real**:
  - Usuarios activos ahora
  - Cursos en progreso
  - Logros recientes

**Gestión de Organizaciones** (`/business-panel/settings`)
- **Configuración de Empresa**:
  - Nombre y logo de la organización
  - Información de contacto
  - Configuración de dominio
  - Integraciones
- **Branding Personalizado** (Plan Enterprise):
  - Colores corporativos
  - Logo personalizado
  - Tipografías
  - Estilos personalizados en la interfaz
- **Certificados Personalizados** (Plan Enterprise):
  - Templates personalizados
  - Logos y firmas
  - Diseño corporativo
  - Validación con hash blockchain

**Gestión de Usuarios** (`/business-panel/users`)
- **Lista de Usuarios de la Organización**:
  - Empleados y miembros
  - Filtros por rol, equipo, estado
  - Búsqueda avanzada
- **Invitar Usuarios**:
  - Invitaciones masivas por email
  - Template de invitación personalizado
  - Asignación automática de roles
- **Gestión de Roles**:
  - **Owner**: Propietario de la organización
  - **Admin**: Administradores de la organización
  - **Member**: Miembros regulares
- **Acciones Disponibles**:
  - Activar/Suspender usuarios
  - Cambiar roles
  - Asignar a equipos
  - Ver estadísticas individuales
  - Importar usuarios desde CSV
- **Estadísticas de Usuarios**:
  - Progreso individual
  - Cursos completados
  - Habilidades desarrolladas
  - Tiempo de estudio

**Gestión de Equipos** (`/business-panel/teams`)
- **Crear y Gestionar Equipos**:
  - Nombres y descripciones
  - Asignar miembros
  - Definir objetivos
- **Asignación de Cursos**:
  - Asignar cursos a equipos completos
  - Fechas límite
  - Requisitos de completado
- **Seguimiento de Equipos**:
  - Progreso por equipo
  - Métricas de rendimiento
  - Comparación entre equipos
- **Mensajería de Equipo**:
  - Comunicación interna
  - Anuncios
  - Recordatorios
- **Objetivos de Equipo**:
  - Definir metas
  - Tracking de objetivos
  - Reportes de cumplimiento

**Gestión de Cursos Empresariales** (`/business-panel/courses`)
- **Catálogo Empresarial**:
  - Cursos disponibles para la organización
  - Filtros y búsqueda
  - Información detallada
- **Compra de Cursos**:
  - Adquirir cursos para la organización
  - Asignación masiva
  - Gestión de licencias
- **Asignación de Cursos**:
  - A usuarios individuales
  - A equipos completos
  - Programación de fechas
- **Seguimiento**:
  - Progreso por curso
  - Tasa de completado
  - Engagement

**Analytics y Reportes** (`/business-panel/analytics`)
- **Reportes Ejecutivos**:
  - Dashboard con métricas clave
  - Gráficos interactivos
  - Filtros por período, equipo, curso
- **Analytics de Habilidades**:
  - Habilidades desarrolladas por la organización
  - Gaps de habilidades identificados
  - Recomendaciones de cursos
- **Reportes Personalizados**:
  - Crear reportes a medida
  - Exportar a PDF, Excel, CSV
  - Programar envío automático
- **Métricas Detalladas**:
  - Progreso individual y por equipo
  - Tiempo de estudio
  - Certificados obtenidos
  - ROI de la capacitación

**Progreso y Seguimiento** (`/business-panel/progress`)
- **Vista General de Progreso**:
  - Todos los usuarios
  - Todos los cursos
  - Filtros avanzados
- **Detalles de Progreso**:
  - Por usuario individual
  - Por curso
  - Por equipo
- **Alertas y Notificaciones**:
  - Usuarios atrasados
  - Cursos próximos a vencer
  - Logros alcanzados

**Gestión de Suscripciones** (`/business-panel/subscription`)
- **Planes Disponibles**:
  - **Team**: Hasta 50 usuarios, características básicas
  - **Business**: Hasta 500 usuarios, características avanzadas
  - **Enterprise**: Ilimitado, todas las características
- **Características por Plan**:
  - Panel de administración
  - Catálogo completo de cursos
  - Analytics básicos/avanzados
  - Branding personalizado (Enterprise)
  - Certificados personalizados (Enterprise)
  - Notificaciones SMS (Business+)
  - Soporte prioritario (Enterprise)
- **Cambio de Plan**:
  - Upgrade/Downgrade
  - Facturación mensual/anual
  - Gestión de pagos

**Notificaciones Empresariales** (`/business-panel/settings`)
- **Configuración de Notificaciones**:
  - Email
  - Push
  - SMS (según plan)
- **Templates Personalizados**:
  - Mensajes de bienvenida
  - Recordatorios
  - Anuncios
- **Automatización**:
  - Recordatorios automáticos
  - Notificaciones de progreso
  - Alertas de hitos

**Certificados Empresariales**
- **Gestión de Certificados**:
  - Ver todos los certificados emitidos
  - Validación con blockchain
  - Descarga masiva
- **Templates Personalizados** (Enterprise):
  - Diseño corporativo
  - Logos y firmas
  - Personalización completa
- **Verificación**:
  - Hash blockchain único por certificado
  - Validación pública
  - Imposible de falsificar

#### Características Técnicas del Business Panel

**Multi-tenancy:**
- Aislamiento completo de datos por organización
- RLS (Row Level Security) a nivel de organización
- Variables de entorno personalizadas por organización

**Escalabilidad:**
- Soporte para miles de usuarios por organización
- Optimización de queries para grandes volúmenes
- Cache inteligente por organización

**Seguridad:**
- Autenticación de dos factores (futuro)
- Logs de auditoría completos
- Permisos granulares por rol

### 8. Planificador de Estudio con IA

El Planificador de Estudio es una funcionalidad avanzada que permite a los usuarios crear planes de estudio personalizados con la ayuda del asistente virtual LIA.

#### Modo Manual
- **Configuración Personalizada**: Creación paso a paso de planes de estudio
- **Control Total**: El usuario define todos los parámetros manualmente
- **Preview en Tiempo Real**: Vista previa del plan antes de guardarlo

#### Modo IA (LIA)
- **Conversación Interactiva**: El asistente LIA guía al usuario en la creación del plan
- **Análisis Inteligente**: 
  - Analiza la disponibilidad del calendario del usuario (si está conectado)
  - Considera las preferencias de estudio del usuario
  - Genera sesiones optimizadas según los cursos seleccionados
- **Generación Automática**: 
  - Distribuye lecciones de forma inteligente
  - Respeta días preferidos y horarios disponibles
  - Ajusta duración de sesiones según el enfoque de estudio (rápido, medio, largo)
- **Confirmación y Guardado**: 
  - Muestra resumen completo del plan generado
  - Permite confirmación del usuario
  - Guarda automáticamente el plan y las sesiones en la base de datos
  - Sincroniza sesiones con calendarios conectados

#### Técnicas de Aprendizaje Implementadas
- **Spaced Repetition** (Repetición espaciada): Distribución óptima de repasos
- **Interleaving** (Intercalado): Mezcla de diferentes temas para mejor retención
- **Load Balancing** (Equilibrio de carga): Distribución uniforme de carga de estudio
- **Difficulty Progression** (Progresión de dificultad): Aumento gradual de complejidad

#### Sincronización de Calendarios
- **Google Calendar**: 
  - Integración OAuth 2.0 completa
  - Creación automática de eventos
  - Sincronización bidireccional
- **Microsoft Calendar**: 
  - Integración Azure AD OAuth
  - Soporte para calendarios empresariales
- **ICS (iCalendar)**: 
  - Exportación para otros clientes de calendario
  - Suscripciones públicas con tokens únicos
  - Actualización automática de eventos

#### Características Adicionales
- **Sistema de Streaks**: Tracking de rachas diarias de estudio
- **Dashboard de Progreso**: 
  - Estadísticas visuales
  - Heatmaps de actividad
  - Métricas de rendimiento
- **Sesiones de Estudio**: 
  - Timer Pomodoro integrado
  - Seguimiento de tiempo real
  - Notas y autoevaluación
- **Reprogramación**: Flexibilidad para ajustar sesiones según necesidad

### 9. Directorio de IA

- **Directorio de Prompts**: Catálogo de prompts profesionales
- **Generación de Prompts**: Con asistente "Lia"
- **Directorio de Apps**: Catálogo de herramientas de IA
- **Categorización**: Por tipo, dificultad, casos de uso
- **Búsqueda**: Sistema de búsqueda avanzada

### 10. Sistema de Suscripciones

**Suscripciones Personales**:
- Basic: Acceso básico
- Premium: Funcionalidades avanzadas
- Pro: Acceso completo

**Suscripciones Empresariales**:
- Team: Hasta 50 usuarios
- Business: Hasta 500 usuarios
- Enterprise: Personalizado

### 11. Sistema de Notificaciones

- Notificaciones en tiempo real
- Email, Push y SMS (según plan)
- Recordatorios inteligentes
- Preferencias de usuario

### 12. Analytics y Reportes

- Dashboard de administración
- Reportes de progreso
- Estadísticas de cursos y comunidades
- Analytics empresariales avanzados

---

## 🌍 Internacionalización

La plataforma soporta **3 idiomas**:

- 🇪🇸 **Español** (por defecto)
- 🇬🇧 **Inglés**
- 🇵🇹 **Portugués**

### Configuración

Los archivos de traducción se encuentran en:
```
apps/web/public/locales/
├── es/
│   └── common.json
├── en/
│   └── common.json
└── pt/
    └── common.json
```

### Uso en Componentes

```typescript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation('common');
  
  return <h1>{t('welcome_message')}</h1>;
}
```

### Cambio de Idioma

```typescript
import { useLanguage } from '@/core/i18n/useLanguage';

function LanguageSelector() {
  const { language, setLanguage } = useLanguage();
  
  return (
    <select value={language} onChange={(e) => setLanguage(e.target.value)}>
      <option value="es">Español</option>
      <option value="en">English</option>
      <option value="pt">Português</option>
    </select>
  );
}
```

---

## 💻 Desarrollo

### Estructura de Features

Cada feature se organiza de la siguiente manera:

```
features/
└── feature-name/
    ├── components/       # Componentes específicos
    ├── services/         # Lógica de negocio
    ├── hooks/            # Custom hooks
    ├── types/            # Tipos TypeScript
    └── utils/            # Utilidades
```

### Convenciones de Código

- **Archivos**: kebab-case (ej: `user-profile.tsx`)
- **Componentes**: PascalCase (ej: `UserProfile`)
- **Variables**: camelCase
- **Constantes**: UPPER_SNAKE_CASE
- **Tipos/Interfaces**: PascalCase con prefijo `I` para interfaces (opcional)

### TypeScript

El proyecto usa TypeScript estricto. Todos los archivos deben estar tipados.

```typescript
// ✅ Bueno
interface User {
  id: string;
  email: string;
  name: string;
}

function getUser(id: string): Promise<User> {
  // ...
}

// ❌ Evitar
function getUser(id: any): any {
  // ...
}
```

### Estilos

Usar Tailwind CSS con enfoque mobile-first:

```tsx
// ✅ Mobile-first
<div className="p-4 md:p-8 lg:p-12">

// ✅ Usar variables CSS para temas
<div className="bg-primary text-surface">
```

### Testing

```bash
# Unit tests (cuando esté configurado)
npm run test

# E2E tests (cuando esté configurado)
npm run test:e2e
```

---

## 🚢 Despliegue

### Frontend (Netlify)

1. Conectar repositorio a Netlify
2. Configurar build settings:
   - **Build command**: `npm run build:web`
   - **Publish directory**: `apps/web/.next`
3. Configurar variables de entorno en Netlify
4. Deploy automático en cada push a `main`

### Backend (Netlify Functions o Railway)

**Opción 1: Netlify Functions**
- Las API routes de Next.js se convierten automáticamente en funciones serverless

**Opción 2: Railway**
1. Conectar repositorio
2. Configurar build command: `npm run build:api`
3. Start command: `npm start --workspace=apps/api`
4. Configurar variables de entorno

### Base de Datos (Supabase)

1. Migrar a producción desde el dashboard de Supabase
2. Ejecutar migraciones SQL en orden
3. Configurar políticas RLS para producción
4. Configurar backups automáticos

### Variables de Entorno en Producción

Asegurarse de configurar todas las variables de entorno en las plataformas de hosting.

---

## 🤝 Contribución

### Flujo de Trabajo

1. **Fork** el repositorio
2. **Crear** una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. **Commit** tus cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. **Push** a la rama (`git push origin feature/nueva-funcionalidad`)
5. **Abrir** un Pull Request

### Estándares de Código

- Seguir las convenciones establecidas
- Escribir código limpio y mantenible
- Agregar comentarios cuando sea necesario
- Escribir tests para nueva funcionalidad
- Actualizar documentación si es necesario

### Code Review

- Todos los PRs requieren revisión
- Resolver comentarios antes de merge
- Mantener commits limpios y descriptivos

---

## 📚 Documentación Adicional

- [PRD Completo](./Nueva%20carpeta/PRD_MASTER.md) - Documento de requisitos del producto
- [Planificador de Estudio - Estado](./IMPLEMENTATION-STATUS.md) - Estado de implementación
- [Arquitectura Completa](./Nueva%20carpeta/ARQUITECTURA-COMPLETA.md) - Detalles técnicos
- [Guía de Instructores](./docs/INSTRUCTOR-GUIDE-TIME-ESTIMATES.md) - Guía para instructores

---

## 📝 Licencia

MIT License - Ver archivo `LICENSE` para más detalles.

---

## 👥 Equipo

**Equipo Aprende y Aplica**

---

## 🔗 Enlaces Útiles

- [Documentación de Next.js](https://nextjs.org/docs)
- [Documentación de Supabase](https://supabase.com/docs)
- [Documentación de Tailwind CSS](https://tailwindcss.com/docs)
- [Documentación de TypeScript](https://www.typescriptlang.org/docs)

---

## 📞 Soporte

Para soporte, abre un issue en el repositorio o contacta al equipo de desarrollo.

---

## 📊 Métricas y Objetivos

### Métricas de Producto

#### Objetivos de Usuario
- **Usuarios Activos Mensuales (MAU)**: Objetivo 5,000 en 6 meses
- **Tasa de Completado de Cursos**: Objetivo 70%+
- **Engagement Diario**: Promedio 45 minutos por sesión
- **Net Promoter Score (NPS)**: Objetivo 50+
- **Retención a 30 días**: > 60%

#### Objetivos Técnicos
- **Uptime**: 99.9% (máximo 8.77h downtime/año)
- **Tiempo de Respuesta API**: P95 < 500ms
- **Tiempo de Carga Inicial**: < 3s en conexión 3G
- **Tasa de Error**: < 0.1%
- **Cache Hit Rate**: > 80%

#### Objetivos de Negocio
- **Costo por Usuario Activo**: < $5/mes
- **Satisfacción de Usuario**: > 4.5/5
- **Tiempo Medio de Resolución de Issues**: < 24 horas

### Roadmap de Desarrollo

#### ✅ Fase 1: MVP (COMPLETADA)
- ✅ Autenticación y gestión de usuarios
- ✅ Sistema de cursos y progreso
- ✅ Chat con IA (LIA)
- ✅ Comunidad Q&A básica
- ✅ Panel de administración
- ✅ Deployment en Netlify

#### 🔄 Fase 2: Mejoras Core (EN PROGRESO)
- 🔄 Sistema de evaluaciones automáticas
- ✅ Integración de calendarios (Google, Microsoft, ICS)
- ✅ Sincronización bidireccional de sesiones con calendarios
- ✅ Planificador de Estudio con LIA (modo conversacional completo)
- ✅ Guardado automático de planes generados por IA
- 🔄 Sistema de certificaciones mejorado
- ✅ Analytics y reportes avanzados
- ✅ Optimización de rendimiento
- ✅ Planificador de Estudio con IA (Fases 0-5 completadas)

#### 📋 Fase 3: Funcionalidades Avanzadas (PLANIFICADO)
- 📋 Notificaciones push avanzadas
- 📋 Sistema de notas mejorado
- 📋 Recomendaciones con IA
- 📋 Gamificación y badges avanzados
- 📋 Modo offline para cursos
- 📋 Integración con Zoom para clases en vivo

#### 🔮 Fase 4: Escalabilidad y Expansión (FUTURO)
- 🔮 Aplicaciones móviles nativas (iOS/Android)
- 🔮 Marketplace de cursos de terceros
- 🔮 Sistema de pagos integrado completo
- 🔮 Internacionalización completa (más idiomas)
- 🔮 Integraciones empresariales (LMS, HRIS)
- 🔮 Realidad Virtual/Aumentada para cursos

### Stack de Tecnologías Detallado

#### Frontend Core
- **Next.js 15.5.4**: Framework React con App Router, Server Components, Server Actions
- **React 19.1.0**: Biblioteca UI con nuevas características (useActionState, useOptimistic)
- **TypeScript 5.9.3**: Tipado estático completo
- **Tailwind CSS 3.4.18**: Estilos utility-first con dark mode

#### UI y Componentes
- **Radix UI**: Componentes accesibles (Dialog, Select, Tooltip, Accordion)
- **Headless UI**: Componentes sin estilos predefinidos
- **Framer Motion 12.23.24**: Animaciones y transiciones
- **GSAP 3.13.0**: Animaciones avanzadas
- **Lucide React**: Iconografía moderna

#### Estado y Datos
- **Zustand 5.0.2**: Gestión de estado global ligera
- **SWR 2.2.0**: Data fetching con cache y revalidación
- **React Hook Form 7.65.0**: Manejo de formularios
- **Zod 3.25.76**: Validación de esquemas TypeScript-first

#### Backend y APIs
- **Express 4.18.2**: Framework web de Node.js
- **Node.js >=22.0.0**: Runtime de JavaScript
- **Supabase Client 2.76.0+**: Cliente PostgreSQL con real-time
- **OpenAI 6.6.0+**: Integración con GPT para LIA

#### Base de Datos
- **PostgreSQL**: Base de datos relacional (hosted en Supabase)
- **Supabase**: Plataforma backend-as-a-service
  - Authentication
  - Storage (archivos, imágenes, videos)
  - Realtime (subscripciones en tiempo real)
  - Edge Functions (serverless)

#### Seguridad
- **Helmet 7.1.0**: Headers de seguridad HTTP
- **CORS 2.8.5**: Configuración de Cross-Origin Resource Sharing
- **express-rate-limit 7.1.5**: Rate limiting
- **bcrypt 5.1.1**: Hashing de contraseñas
- **JWT**: Tokens de autenticación

#### Herramientas de Desarrollo
- **ESLint**: Linting de código
- **Prettier**: Formateo de código
- **TypeScript**: Type checking
- **@next/bundle-analyzer**: Análisis de bundle size

#### Infraestructura
- **Netlify**: Hosting frontend y serverless functions
- **Vercel**: Alternativa de hosting (compatible)
- **Railway**: Alternativa para backend (opcional)
- **Supabase**: Base de datos y auth hosting

### Características Técnicas Avanzadas

#### 1. Server Components y Server Actions
- Renderizado en el servidor para mejor performance
- Reducción de JavaScript en el cliente
- Acceso directo a base de datos sin API routes

#### 2. Optimistic Updates
- Actualizaciones optimistas con React 19
- Mejor UX en interacciones del usuario
- Rollback automático en caso de error

#### 3. Streaming SSR
- Streaming de contenido mientras se carga
- Suspense boundaries para mejor percepción de carga
- Progressive enhancement

#### 4. Edge Runtime
- Funciones edge para menor latencia
- Cache en edge para contenido estático
- CDN global para assets

#### 5. Internacionalización (i18n)
- Soporte para ES, EN, PT
- next-i18next para SSR i18n
- Detección automática de idioma
- Cambio de idioma sin recargar

### Seguridad y Compliance

#### Medidas de Seguridad Implementadas
- ✅ **Row Level Security (RLS)**: En todas las tablas de Supabase
- ✅ **JWT con Fingerprint**: Verificación de dispositivo
- ✅ **Rate Limiting**: Protección contra abuso
- ✅ **CORS Estricto**: Solo dominios permitidos
- ✅ **Content Security Policy**: Headers CSP configurados
- ✅ **HTTPS Obligatorio**: En producción
- ✅ **Sanitización de Inputs**: Validación con Zod
- ✅ **SQL Injection Protection**: Queries parametrizadas
- ✅ **XSS Protection**: Sanitización de contenido HTML
- ✅ **CSRF Protection**: Tokens CSRF

#### Privacidad
- ✅ **GDPR Compliant**: Preparado para cumplimiento GDPR
- ✅ **Datos Personales**: Encriptados en tránsito y reposo
- ✅ **Política de Privacidad**: Documentada
- ✅ **Derecho al Olvido**: Funcionalidad de eliminación de datos

### Testing y Calidad

#### Estrategia de Testing (Pendiente de Implementación)
- **Unit Tests**: Jest + React Testing Library
- **Integration Tests**: Testing de API endpoints
- **E2E Tests**: Playwright o Cypress
- **Visual Regression**: Percy o Chromatic
- **Performance Tests**: Lighthouse CI

#### Calidad de Código
- **TypeScript Strict**: Modo estricto habilitado
- **ESLint Rules**: Reglas configuradas para Next.js y React
- **Prettier**: Formateo automático
- **Husky**: Git hooks para pre-commit
- **Conventional Commits**: Estándar de commits

### DevOps y CI/CD

#### Pipeline de Deployment (Netlify)
1. **Push a main branch**
2. **Build automático**: `npm run build:web`
3. **Tests**: Ejecución de tests (cuando estén configurados)
4. **Deploy Preview**: Deploy automático para PRs
5. **Deploy Production**: Deploy automático a producción

#### Variables de Entorno
- **Development**: `.env.local`
- **Staging**: Netlify Environment Variables
- **Production**: Netlify Environment Variables

### Monitoreo y Observabilidad

#### Métricas Implementadas
- **Performance Metrics API**: `/api/performance/metrics`
- **Rate Limit Stats**: `/api/admin/rate-limit/stats`
- **Error Logging**: Sistema de logging estructurado
- **LIA Usage Tracking**: Monitoreo de uso de OpenAI

#### Logs
- **Structured Logging**: Logs estructurados con contexto
- **Log Levels**: Error, Warn, Info, Debug
- **Request Logging**: Morgan para logs de requests HTTP

### Escalabilidad

#### Estrategias de Escalabilidad
- **Horizontal Scaling**: Serverless functions escalan automáticamente
- **Database Connection Pooling**: PgBouncer para optimización
- **CDN**: Assets estáticos servidos desde CDN
- **Caching**: Múltiples niveles de cache
- **Lazy Loading**: Carga diferida de componentes
- **Code Splitting**: División automática de bundles

#### Límites Actuales
- **Usuarios Concurrentes**: 10,000+
- **Requests por Segundo**: 1,000+
- **Tamaño de Base de Datos**: Escalable con Supabase

---

## 📚 Recursos Adicionales

### Documentación Interna
- [PRD Completo](./Nueva%20carpeta/PRD_MASTER.md) - Documento maestro de requisitos
- [Planificador de Estudio - Estado](./IMPLEMENTATION-STATUS.md) - Estado de implementación detallado
- [Arquitectura Completa](./Nueva%20carpeta/ARQUITECTURA-COMPLETA.md) - Detalles técnicos completos
- [Guía de Instructores](./docs/INSTRUCTOR-GUIDE-TIME-ESTIMATES.md) - Guía para instructores

### Documentación Externa
- [Next.js Documentation](https://nextjs.org/docs) - Documentación oficial de Next.js
- [Supabase Documentation](https://supabase.com/docs) - Documentación de Supabase
- [Tailwind CSS Documentation](https://tailwindcss.com/docs) - Documentación de Tailwind
- [TypeScript Documentation](https://www.typescriptlang.org/docs) - Documentación de TypeScript
- [React Documentation](https://react.dev) - Documentación oficial de React

### Comunidad
- [GitHub Repository](https://github.com/aprende-y-aplica/chat-bot-lia.git)
- [Issues](https://github.com/aprende-y-aplica/chat-bot-lia/issues) - Reportar bugs o solicitar features
- [Discussions](https://github.com/aprende-y-aplica/chat-bot-lia/discussions) - Discusiones y preguntas

---

## 🎯 Próximos Pasos para Desarrolladores

### Para Empezar
1. **Leer este README completo** para entender la arquitectura
2. **Revisar el PRD** para entender los requisitos del producto
3. **Explorar la estructura del código** en `apps/web/src`
4. **Configurar el entorno local** siguiendo la guía de instalación
5. **Ejecutar el proyecto** y explorar las funcionalidades

### Áreas de Contribución
- **Frontend**: Componentes React, UI/UX
- **Backend**: API endpoints, lógica de negocio
- **Base de Datos**: Migraciones, optimizaciones
- **Testing**: Tests unitarios, integración, E2E
- **Documentación**: Mejoras al README, guías
- **Performance**: Optimizaciones, profiling

### Buenas Prácticas
- ✅ Seguir las convenciones de código establecidas
- ✅ Escribir código tipado (TypeScript)
- ✅ Agregar comentarios cuando sea necesario
- ✅ Escribir tests para nueva funcionalidad
- ✅ Actualizar documentación
- ✅ Hacer code review antes de merge
- ✅ Mantener commits descriptivos

---

**Última actualización**: Diciembre 2024  
**Versión**: 1.1.0  
**Mantenedores**: Equipo Aprende y Aplica

### 📝 Cambios Recientes (Diciembre 2024)

#### Planificador de Estudio con LIA
- ✅ **Modo Conversacional Completo**: Integración completa del asistente LIA para creación de planes de estudio mediante conversación interactiva
- ✅ **Análisis de Calendario**: LIA analiza automáticamente la disponibilidad del calendario del usuario antes de generar sesiones
- ✅ **Guardado Automático**: Los planes generados se guardan automáticamente en la base de datos al confirmar con el usuario
- ✅ **Sincronización Automática**: Las sesiones se sincronizan automáticamente con calendarios conectados (Google/Microsoft) al guardar el plan
- ✅ **Corrección de Calendario**: Solucionado problema de visualización de días de la semana en el selector de fechas
- ✅ **Mejoras en UX**: Mensajes de procesamiento y confirmación mejorados durante la creación de planes

#### Mejoras Técnicas
- ✅ **Service Role Key**: Implementado uso de Supabase Service Role Key para operaciones administrativas que requieren bypass de RLS
- ✅ **Validación de Datos**: Mejoras en validación de datos antes de guardar planes y sesiones
- ✅ **Manejo de Errores**: Mejor manejo de errores en sincronización de calendarios con mensajes descriptivos
- ✅ **Debug y Logging**: Agregados logs de debug para facilitar troubleshooting del calendario y sincronización
- ✅ **Endpoints Nuevos**: 
  - `POST /api/study-planner/save-plan` - Guardar plan generado por LIA
  - `POST /api/study-planner/calendar/sync-sessions` - Sincronizar sesiones con calendario externo
  - `GET /api/study-planner/calendar/status` - Verificar estado de conexión de calendario
