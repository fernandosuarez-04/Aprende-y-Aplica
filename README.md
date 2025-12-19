# 🚀 Aprende y Aplica - Plataforma B2B de Capacitación en IA

> Plataforma de capacitación empresarial B2B enfocada en inteligencia artificial, diseñada para organizaciones que buscan desarrollar las habilidades de sus equipos con cursos, certificaciones y seguimiento de progreso personalizado.

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

| Rol | Descripción | Acceso |
|-----|-------------|--------|
| **Admin (Super Admin)** | Administrador de la plataforma Aprende y Aplica | `/admin/*` |
| **Business Admin** | Administrador de una organización cliente | `/business-panel/*` |
| **Business User** | Empleado de una organización cliente | `/business-user/*` |

---

## 📋 Tabla de Contenidos

- [Modelo de Negocio B2B](#-modelo-de-negocio-b2b)
- [Características Principales](#-características-principales)
- [Arquitectura del Proyecto](#-arquitectura-del-proyecto)
- [Estructura de la Plataforma](#-estructura-de-la-plataforma)
- [Stack Tecnológico](#-stack-tecnológico)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [APIs y Endpoints](#-apis-y-endpoints)
- [Sistema de Autenticación](#-sistema-de-autenticación)
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
| Plan | Usuarios | Características |
|------|----------|-----------------|
| **Team** | Hasta 10 | Cursos básicos, Reportes |
| **Business** | Hasta 50 | Todos los cursos, Analytics avanzados |
| **Enterprise** | Ilimitados | White-label, Certificados personalizados, API |

### 👤 Para Empleados (Business User)

#### Dashboard Personal
- **Mi Progreso**: Cursos asignados y completados
- **Calendario de Estudio**: Planificador integrado
- **Certificados**: Certificados obtenidos con verificación blockchain
- **Habilidades**: Tracking de competencias desarrolladas

#### Aprendizaje
- **Cursos de IA**: Contenido estructurado por niveles
- **Lecciones en Video**: Contenido multimedia
- **Evaluaciones**: Quizzes y exámenes
- **Notas Personales**: Sistema de notas por lección
- **Asistente LIA**: Chat con IA para resolver dudas

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
- **LIA Analytics**: Uso del asistente virtual

### 🤖 Asistente Virtual LIA

- **Chat Contextual**: Ayuda adaptativa según la sección
- **Generación de Prompts**: Creación de prompts profesionales
- **Planificación de Estudio**: Generación de planes con IA
- **Soporte 24/7**: Respuestas inmediatas a dudas

### 🎓 Sistema de Certificados con Blockchain

- **Hash Único Inmutable**: Cada certificado tiene un hash SHA-256
- **Verificación Pública**: Cualquiera puede verificar autenticidad
- **Código QR**: Escaneo rápido para verificación
- **Descarga PDF**: Certificado profesional descargable

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
└── /[slug]                  # Detalle y aprendizaje de curso

📁 /certificates             # Verificación de certificados
└── /verify/[hash]           # Verificación pública

📁 /study-planner            # Planificador de estudio
📁 /profile                  # Perfil de usuario
📁 /account-settings         # Configuración de cuenta
📁 /questionnaire            # Cuestionario inicial
📁 /welcome                  # Página de bienvenida
📁 /conocer-lia              # Presentación de LIA
```

---

## 🛠️ Stack Tecnológico

### Frontend
| Tecnología | Versión | Uso |
|------------|---------|-----|
| **Next.js** | 15.5.4 | Framework React con App Router |
| **React** | 19.1.0 | Biblioteca UI |
| **TypeScript** | 5.9.3 | Tipado estático |
| **Tailwind CSS** | 3.4.18 | Estilos utility-first |
| **Framer Motion** | 12.23.24 | Animaciones |
| **Zustand** | 5.0.2 | Estado global |
| **SWR** | 2.2.0 | Data fetching |

### Backend & Infraestructura
| Tecnología | Uso |
|------------|-----|
| **Supabase** | Base de datos PostgreSQL, Auth, Storage |
| **Supabase Auth** | Autenticación y gestión de sesiones |
| **OpenAI API** | Asistente virtual LIA |

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
│       │   │   ├── components/       # Componentes core (Header, Sidebar)
│       │   │   ├── hooks/            # Hooks personalizados
│       │   │   └── stores/           # Estado global (Zustand)
│       │   ├── features/             # Features por dominio
│       │   │   ├── admin/            # Gestión de plataforma
│       │   │   ├── auth/             # Autenticación
│       │   │   ├── business-panel/   # Panel empresarial
│       │   │   └── courses/          # Sistema de cursos
│       │   └── lib/                  # Utilidades y configuración
│       │       ├── supabase/         # Cliente Supabase
│       │       └── auth/             # Utilidades de auth
│       └── public/                   # Archivos estáticos
│
├── packages/
│   └── shared/                       # Tipos y utilidades compartidas
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

### Pasos de Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-repo/aprende-y-aplica.git
cd Aprende-y-Aplica

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp apps/web/.env.example apps/web/.env.local
# Editar .env.local con tus credenciales

# 4. Ejecutar en desarrollo
npm run dev
```

---

## ⚙️ Configuración

### Variables de Entorno (`apps/web/.env.local`)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# OpenAI (para LIA)
OPENAI_API_KEY=tu_openai_api_key

# Autenticación
JWT_SECRET=tu_jwt_secret_seguro
SESSION_SECRET=tu_session_secret_seguro

# URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
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
GET    /api/admin/companies/:id         # Obtener empresa (con branding, miembros)
PUT    /api/admin/companies/:id         # Actualizar empresa (colores, suscripción)
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
GET    /api/business/dashboard/stats    # Estadísticas del dashboard
GET    /api/business/dashboard/activity # Actividad reciente

# Usuarios y Equipos
GET    /api/business/users              # Listar usuarios de la org
POST   /api/business/users              # Crear/invitar usuario
GET    /api/business/teams              # Listar equipos
POST   /api/business/teams              # Crear equipo

# Cursos
GET    /api/business/courses            # Cursos disponibles/asignados
POST   /api/business/courses/:id/assign # Asignar curso

# Branding y Configuración
GET    /api/business/settings/branding  # Obtener branding
PUT    /api/business/settings/branding  # Actualizar colores, logo, fuente

# Certificados
GET    /api/business/certificates       # Certificados de la org
```

### Cursos y Aprendizaje
```
GET    /api/courses                     # Listar cursos
GET    /api/courses/:slug               # Detalle de curso
GET    /api/courses/:slug/learn-data    # Datos para aprendizaje
PUT    /api/courses/:slug/lessons/:id/progress # Actualizar progreso
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
| Rol | Descripción | Rutas Permitidas |
|-----|-------------|------------------|
| `Admin` | Super administrador de plataforma | `/admin/*` |
| `Business` | Administrador de organización | `/business-panel/*` |
| `BusinessUser` | Empleado de organización | `/business-user/*` |

### Flujo de Autenticación
1. Usuario accede a `/auth/[slug]` (login por organización)
2. Se valida credenciales contra Supabase Auth
3. Se genera JWT con rol y organization_id
4. Middleware valida rol en cada request
5. Redirección automática al panel correspondiente

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
- ✅ Feature-based arquitectura
- ✅ Tailwind CSS para estilos
- ✅ Framer Motion para animaciones

---

## 📝 Cambios Recientes (Diciembre 2024)

### 🆕 Pivote a Modelo B2B
- ✅ Enfoque 100% empresarial
- ✅ Eliminación de funcionalidades B2C
- ✅ Simplificación de roles (Admin, Business, BusinessUser)
- ✅ Eliminación del rol de Instructor

### 🏢 Gestión Avanzada de Empresas
- ✅ Nueva página `/admin/companies/[id]/edit` con 8 secciones
- ✅ Paleta de colores editable con preview en tiempo real
- ✅ Selector de tipografía de marca
- ✅ Vista detallada de miembros con filtros

### 🎨 Sistema de Branding
- ✅ Campos: `brand_color_primary`, `brand_color_secondary`, `brand_color_accent`
- ✅ Tipografía: `brand_font_family`
- ✅ Assets: Logo, Banner, Favicon

### 🔐 Seguridad Mejorada
- ✅ Tokens SHA-256 determinísticos
- ✅ Middleware de roles mejorado
- ✅ Validación de organización en cada request

---

**Última actualización**: Diciembre 2024  
**Versión**: 2.0.0 (B2B)  
**Mantenedores**: Equipo Aprende y Aplica
