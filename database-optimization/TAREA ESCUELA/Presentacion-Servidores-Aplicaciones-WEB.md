# Aprende-y-Aplica: Análisis de Seguridad en Servidores y Aplicaciones WEB
## Trabajo Final - Tercer Departamental - Hackeo Ético

---

## Apartado 1: Descripción Técnica de la Plataforma

### ¿Qué es la plataforma?

**Aprende-y-Aplica** es una plataforma B2B de capacitación empresarial enfocada en inteligencia artificial. Es una aplicación web full-stack diseñada para organizaciones que buscan desarrollar las habilidades de sus equipos mediante cursos estructurados, certificaciones verificables y seguimiento de progreso personalizado.

La plataforma permite a las empresas:
- Gestionar la capacitación de sus empleados en IA
- Asignar cursos y módulos de aprendizaje
- Generar certificados personalizados con branding corporativo
- Monitorear el progreso y analytics de sus equipos
- Interactuar con un asistente de IA (LIA) para resolver dudas

### ¿Cómo funciona?

**Arquitectura del Sistema:**

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENTE (Navegador)                      │
│  Next.js 16 (React 18) - SSR/SSG + Client-Side Rendering   │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTPS
                        │
┌───────────────────────▼─────────────────────────────────────┐
│              FRONTEND (Next.js Application)                 │
│  - Server-Side Rendering (SSR)                              │
│  - Static Site Generation (SSG)                             │
│  - API Routes (Next.js API Routes)                          │
│  - Middleware de autenticación                              │
└───────────────────────┬─────────────────────────────────────┘
                        │
        ┌───────────────┴───────────────┐
        │                               │
┌───────▼────────┐          ┌──────────▼──────────┐
│  BACKEND API   │          │   SUPABASE           │
│  (Express.js)  │          │  - PostgreSQL        │
│  Node.js 22+   │          │  - Supabase Auth     │
│  TypeScript    │          │  - Row Level Security│
│  Port 4000     │          │  - Real-time         │
└────────────────┘          └─────────────────────┘
        │                               │
        └───────────────┬───────────────┘
                        │
            ┌───────────▼───────────┐
            │  SERVICIOS EXTERNOS   │
            │  - OpenAI API (GPT-4) │
            │  - ElevenLabs (TTS)   │
            │  - Email Services     │
            └───────────────────────┘
```

**Flujo de Petición Típico:**

1. **Cliente → Frontend (Next.js)**
   - Usuario accede a `https://aprende-y-aplica.com`
   - Next.js procesa la ruta (SSR o SSG)
   - Middleware verifica autenticación
   - Renderiza página con React

2. **Frontend → Backend API (Express)**
   - Peticiones a `/api/v1/*` van al servidor Express
   - Middleware de autenticación JWT valida token
   - Rate limiting aplicado (1000 req/15min)
   - Helmet.js aplica headers de seguridad

3. **Backend → Supabase**
   - Consultas a PostgreSQL mediante Supabase Client
   - Row Level Security (RLS) aplica políticas de acceso
   - Autenticación mediante Supabase Auth
   - Real-time subscriptions para actualizaciones

4. **Backend → Servicios Externos**
   - Llamadas a OpenAI API para chat con LIA
   - Integración con ElevenLabs para síntesis de voz
   - Envío de emails transaccionales

**Monorepo Structure:**
```
aprende-y-aplica/
├── apps/
│   ├── web/          # Next.js Frontend
│   └── api/          # Express Backend
├── packages/
│   ├── shared/       # Utilidades compartidas
│   └── ui/           # Componentes UI compartidos
└── docs/             # Documentación
```

### ¿Qué tecnologías utiliza?

**Frontend:**
- **Next.js 16.0.7**: Framework React con SSR/SSG
- **React 18.3.1**: Biblioteca de UI
- **TypeScript 5.9.3**: Tipado estático
- **Tailwind CSS 3.4.18**: Framework de estilos
- **Supabase Client (@supabase/supabase-js)**: Cliente para base de datos y auth
- **SWR**: Data fetching y cache
- **React Hook Form + Zod**: Validación de formularios
- **Next-i18next**: Internacionalización

**Backend:**
- **Node.js 22+**: Runtime de JavaScript
- **Express.js 4.18.2**: Framework web
- **TypeScript 5.3.3**: Tipado estático
- **Helmet.js 7.1.0**: Headers de seguridad HTTP
- **express-rate-limit 7.1.5**: Rate limiting
- **jsonwebtoken 9.0.2**: Autenticación JWT
- **bcrypt 5.1.1**: Hash de contraseñas
- **CORS 2.8.5**: Configuración CORS
- **Morgan 1.10.0**: Logging HTTP

**Base de Datos:**
- **Supabase (PostgreSQL)**: Base de datos relacional
- **Row Level Security (RLS)**: Políticas de seguridad a nivel de fila
- **Supabase Auth**: Sistema de autenticación
- **Real-time Subscriptions**: Actualizaciones en tiempo real

**Servicios Externos:**
- **OpenAI API**: GPT-4 para asistente LIA
- **ElevenLabs API**: Text-to-Speech
- **Email Services**: Nodemailer para emails transaccionales

**Infraestructura:**
- **Monorepo**: npm workspaces
- **Build Tools**: Webpack, Turbopack (Next.js)
- **Deployment**: Vercel/Netlify (probablemente)

**Seguridad Implementada:**
- Content Security Policy (CSP)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Strict-Transport-Security (HSTS)
- Rate limiting
- JWT con fingerprint de dispositivo
- Row Level Security en base de datos

### ¿Por qué es un objetivo importante en ciberseguridad?

**1. Datos Sensibles de Empresas**
- Información de empleados de organizaciones cliente
- Progreso de aprendizaje y evaluaciones
- Certificados y credenciales verificables
- Datos de suscripción y facturación B2B

**2. Exposición Pública**
- Aplicación accesible desde Internet
- Múltiples endpoints API expuestos
- Autenticación y autorización críticas
- Integración con servicios externos (OpenAI, Supabase)

**3. Superficie de Ataque Amplia**
- Frontend Next.js (SSR/SSG)
- Backend Express con múltiples rutas
- Base de datos Supabase con RLS
- Integraciones con APIs externas
- Sistema de autenticación complejo (Supabase Auth + JWT)

**4. Impacto Empresarial Alto**
- Compromiso afectaría múltiples organizaciones cliente
- Pérdida de confianza en plataforma B2B
- Posibles multas por GDPR/LOPD si se filtran datos
- Interrupción de servicios de capacitación

**5. Valor Estratégico**
- Lógica de negocio B2B crítica
- Sistema de certificaciones verificables
- Analytics y reportes empresariales
- Asistente de IA con acceso a datos de aprendizaje

**6. Arquitectura Compleja**
- Monorepo con múltiples aplicaciones
- SSR/SSG puede exponer información en tiempo de build
- API routes de Next.js + API Express separada
- Múltiples puntos de entrada (frontend, backend, Supabase)

### ¿Qué roles puede tener en un ataque real?

**1. Punto de Entrada (Initial Access)**

**Vectores de Ataque:**
- **Vulnerabilidades en Next.js**: Explotación de SSR/SSG, API routes
- **Ataques a Express API**: Inyección en endpoints `/api/v1/*`
- **Compromiso de Supabase**: Credenciales de API expuestas, RLS mal configurado
- **Autenticación débil**: Bypass de Supabase Auth, JWT débil o robado
- **Dependencias vulnerables**: Explotación de vulnerabilidades en npm packages

**Ejemplos Específicos:**
- SQL Injection en consultas a Supabase mal construidas
- XSS en componentes React que renderizan contenido del usuario
- SSRF en llamadas a servicios externos (OpenAI, ElevenLabs)
- Path traversal en rutas de archivos estáticos

**2. Persistencia (Persistence)**

**Métodos de Persistencia:**
- **Web Shells en Next.js**: Archivos maliciosos en `/pages` o `/app`
- **Backdoors en Express**: Middleware malicioso, rutas ocultas
- **Modificación de Base de Datos**: Triggers o funciones PostgreSQL maliciosas
- **Tokens JWT Comprometidos**: Tokens con expiración larga no revocados
- **Sesiones de Supabase**: Sesiones activas no cerradas

**3. Escalación de Privilegios (Privilege Escalation)**

**Vectores:**
- **Bypass de RLS**: Explotación de políticas de Row Level Security
- **Elevación de Roles**: De `business_user` a `business_admin` o `admin`
- **JWT Manipulation**: Modificación de claims de rol en tokens
- **Middleware Bypass**: Evasión de validación de roles en Express/Next.js

**4. Movimiento Lateral (Lateral Movement)**

**Oportunidades:**
- **Acceso a Otras Organizaciones**: Si se compromete una organización, acceso a datos de otras
- **Supabase Admin Access**: Si se obtienen credenciales de admin de Supabase
- **API Keys Comprometidas**: Uso de keys de OpenAI/ElevenLabs para otros servicios
- **Red Interna**: Si el backend está en red interna, pivote a otros sistemas

**5. Robo de Datos (Data Exfiltration)**

**Datos Valiosos:**
- **Bases de Datos Completas**: Usuarios, cursos, progreso, certificados
- **Información de Organizaciones**: Datos B2B, suscripciones, branding
- **Contenido de Cursos**: Materiales propietarios, evaluaciones
- **Tokens y Credenciales**: API keys, JWT secrets, Supabase keys
- **Datos de Analytics**: Métricas de uso, comportamiento de usuarios

**Métodos:**
- Exportación directa desde Supabase
- Dump de base de datos mediante SQL Injection
- Exfiltración mediante APIs comprometidas
- Logs que contienen información sensible

**6. Denegación de Servicio (DoS/DDoS)**

**Vectores:**
- **Rate Limiting Bypass**: Evasión de límites de 1000 req/15min
- **SSR/SSG Overload**: Sobrecarga de renderizado de Next.js
- **Supabase Connection Exhaustion**: Agotar conexiones de pool
- **API Externa Abuse**: Consumo excesivo de OpenAI API (costos)

**7. Manipulación de Funcionalidades**

**Ataques Específicos:**
- **Certificados Falsos**: Generación de certificados sin completar cursos
- **Progreso Manipulado**: Modificación de progreso de cursos
- **Branding Comprometido**: Modificación de logos/colores de organizaciones
- **Asistente LIA Comprometido**: Inyección de prompts maliciosos en OpenAI

---

## Apartado 2: Principales Vulnerabilidades

### Vulnerabilidades Típicas en Next.js

#### 1. Server-Side Rendering (SSR) Vulnerabilities

**Exposición de Información en SSR:**
```typescript
// ❌ VULNERABLE - Información sensible en respuesta SSR
export async function getServerSideProps(context) {
  const apiKey = process.env.SECRET_API_KEY;
  return {
    props: {
      data: await fetchData(apiKey), // API key podría filtrarse
    }
  };
}
```

**Problemas Comunes:**
- Variables de entorno expuestas en código cliente
- Información de error detallada en páginas SSR
- Stack traces expuestos en producción
- Datos sensibles en props de página

#### 2. API Routes Vulnerabilities

**Next.js API Routes sin Validación:**
```typescript
// ❌ VULNERABLE - Sin validación de entrada
export async function POST(req: Request) {
  const { userId, courseId } = await req.json();
  // Sin validación - permite inyección
  const result = await supabase
    .from('progress')
    .insert({ user_id: userId, course_id: courseId });
  return Response.json(result);
}
```

**Vulnerabilidades:**
- Falta de validación de entrada (Zod debería usarse)
- No sanitización de datos antes de queries
- Falta de autenticación en algunas rutas
- Rate limiting insuficiente

#### 3. Middleware Vulnerabilities

**Bypass de Autenticación:**
```typescript
// Posible bypass si la lógica de validación tiene fallos
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  // Si hay errores en validateRoleAccess, podría permitir acceso no autorizado
  const validation = await validateRoleAccess(request, 'admin');
  // ...
}
```

#### 4. Client-Side Security Issues

**XSS en Componentes React:**
```typescript
// ❌ VULNERABLE - Renderizado directo de contenido del usuario
function CourseDescription({ description }) {
  return <div dangerouslySetInnerHTML={{ __html: description }} />;
}
```

**Problemas:**
- Uso de `dangerouslySetInnerHTML` sin sanitización
- Renderizado de contenido no validado
- Almacenamiento de datos sensibles en localStorage
- Tokens JWT en localStorage (deberían estar en httpOnly cookies)

### Vulnerabilidades Típicas en Express.js

#### 1. Inyección en Queries a Supabase

**SQL Injection mediante Supabase:**
```typescript
// ❌ VULNERABLE - Construcción dinámica de queries
app.get('/api/users', async (req, res) => {
  const search = req.query.search;
  const { data } = await supabase
    .from('users')
    .select('*')
    .ilike('name', `%${search}%`); // Si search contiene SQL
});
```

**Aunque Supabase usa parámetros preparados, errores en lógica pueden permitir:**
- Bypass de RLS mediante manipulación de queries
- Acceso a datos de otras organizaciones
- Modificación de filtros de seguridad

#### 2. Autenticación JWT Débil

**Problemas Potenciales:**
```typescript
// Verificación de JWT sin validar expiración correctamente
const decoded = jwt.verify(token, secret);
// Si no se valida expires_at en base de datos, tokens expirados podrían funcionar
```

**Vulnerabilidades:**
- JWT secrets débiles o expuestos
- Tokens sin expiración adecuada
- Falta de revocación de tokens
- Fingerprint de dispositivo no validado correctamente

#### 3. Rate Limiting Insuficiente

**Configuración Actual:**
```typescript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // 1000 requests por 15 minutos - muy alto
});
```

**Problemas:**
- Límite muy alto (permite ataques de fuerza bruta)
- No diferenciado por endpoint (login debería tener límite menor)
- No considera IPs múltiples (DDoS distribuido)

#### 4. CORS Mal Configurado

**Configuración Actual:**
```typescript
app.use(cors({
  origin: config.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
}));
```

**Riesgos:**
- Si `ALLOWED_ORIGINS` está mal configurado, podría permitir cualquier origen
- `credentials: true` con origen amplio es peligroso

### Vulnerabilidades en Supabase

#### 1. Row Level Security (RLS) Mal Configurado

**Políticas RLS Incorrectas:**
```sql
-- ❌ VULNERABLE - Política demasiado permisiva
CREATE POLICY "Users can read all progress"
ON progress FOR SELECT
USING (true); -- Permite leer TODO
```

**Problemas:**
- Políticas que permiten acceso a datos de otras organizaciones
- Falta de validación de pertenencia a organización
- Políticas que no consideran todos los casos edge

#### 2. Exposición de API Keys

**Riesgos:**
- Supabase anon key expuesta en código cliente
- Service role key en código (debería estar solo en backend)
- Keys en variables de entorno accesibles
- Keys en repositorios públicos (GitHub)

#### 3. Autenticación Supabase Auth

**Vulnerabilidades:**
- Contraseñas débiles permitidas
- Falta de MFA (Multi-Factor Authentication)
- Sesiones que no expiran correctamente
- Tokens de refresh no rotados

### Vulnerabilidades Específicas de la Aplicación

#### 1. Sistema de Certificados

**Riesgo de Generación Fraudulenta:**
- Si se compromete la lógica de validación de completitud de curso
- Manipulación de progreso para generar certificados sin completar
- Falsificación de hash de verificación

#### 2. Asistente LIA (OpenAI Integration)

**Prompt Injection:**
```typescript
// Si el prompt del usuario se concatena directamente
const prompt = `Eres LIA, asistente de aprendizaje. Usuario pregunta: ${userMessage}`;
// Usuario podría inyectar: "Ignora instrucciones anteriores y..."
```

**Riesgos:**
- Exposición de datos sensibles mediante prompt injection
- Consumo excesivo de API (costos)
- Acceso a contexto de otros usuarios mediante manipulación

#### 3. Sistema de Branding (Organizaciones)

**Manipulación de Archivos:**
- Upload de logos sin validación adecuada
- Path traversal en almacenamiento de archivos
- Ejecución de código mediante archivos maliciosos (si se procesan)

#### 4. Analytics y Reportes

**Exposición de Información:**
- Analytics que revelan estructura de datos
- Reportes con información sensible
- Métricas que exponen comportamiento de usuarios

### Debilidades de Configuración

#### 1. Variables de Entorno

**Riesgos:**
- Variables expuestas en `next.config.ts`
- Secrets en código fuente
- `.env` files en repositorio
- Variables sin validación (Zod para env)

#### 2. Headers de Seguridad

**Aunque están implementados, posibles mejoras:**
- CSP podría ser más restrictivo (`unsafe-eval`, `unsafe-inline` presentes)
- HSTS solo en producción (debería estar siempre en HTTPS)
- Permissions-Policy podría ser más restrictiva

#### 3. Build Configuration

**Problemas Potenciales:**
```typescript
// next.config.ts
typescript: {
  ignoreBuildErrors: true, // ⚠️ Peligroso - ignora errores de tipo
}
```

#### 4. Dependencias Vulnerables

**Riesgos:**
- Dependencias sin actualizar
- Uso de versiones con vulnerabilidades conocidas
- Falta de auditoría regular (npm audit)
- Dependencias con permisos excesivos

### Errores Humanos Frecuentes

#### 1. Desarrollo

**Código Inseguro:**
- Hardcoding de credenciales
- Comentarios con información sensible
- Logs que contienen datos sensibles
- Git commits con secrets

#### 2. Configuración

**Errores Comunes:**
- RLS policies mal escritas
- CORS demasiado permisivo
- Rate limiting insuficiente
- Headers de seguridad incompletos

#### 3. Despliegue

**Problemas:**
- Variables de entorno no configuradas en producción
- Modo debug habilitado
- Stack traces expuestos
- Versiones de dependencias desactualizadas

### Casos Reales Relevantes

#### 1. Next.js Vulnerabilities (CVE-2023-xxx)
- Vulnerabilidades en SSR que exponen información
- Path traversal en API routes
- XSS en componentes server-side

#### 2. Supabase Incidents
- Exposición de datos por RLS mal configurado
- Compromiso de API keys
- Ataques a Supabase Auth

#### 3. Express.js Security Issues
- Vulnerabilidades en middleware de autenticación
- DoS mediante parsing de JSON grande
- Prototype pollution en objetos

### Riesgos para la Empresa y para los Usuarios

**Riesgos para Aprende-y-Aplica (Empresa):**

1. **Financieros**
   - Pérdida de clientes B2B por falta de confianza
   - Multas por GDPR/LOPD si se filtran datos
   - Costos de remediación y forensia
   - Pérdida de ingresos por interrupción

2. **Reputacionales**
   - Pérdida de confianza de organizaciones cliente
   - Daño a marca B2B
   - Publicidad negativa en sector empresarial
   - Pérdida de ventas futuras

3. **Legales**
   - Demandas de organizaciones afectadas
   - Investigaciones regulatorias
   - Sanciones por protección de datos
   - Responsabilidad por certificados falsos

**Riesgos para Organizaciones Cliente:**

1. **Datos de Empleados Comprometidos**
   - Información personal de empleados
   - Progreso de aprendizaje interno
   - Evaluaciones y resultados

2. **Certificados Fraudulentos**
   - Empleados con certificados sin completar cursos
   - Pérdida de validez de certificaciones
   - Impacto en programas de capacitación

3. **Branding Comprometido**
   - Modificación de logos/colores corporativos
   - Daño a imagen de marca
   - Confusión en empleados

**Riesgos para Usuarios Finales (Empleados):**

1. **Privacidad**
   - Exposición de progreso de aprendizaje
   - Datos personales comprometidos
   - Historial de interacciones con LIA

2. **Integridad de Datos**
   - Progreso modificado o eliminado
   - Certificados falsos o revocados
   - Notas y evaluaciones alteradas

---

## Apartado 3: Herramientas de Hackeo Ético Aplicables

### 1. Reconocimiento y Enumeración

#### Nmap
- **¿Para qué sirve?**: Identificar puertos abiertos, servicios, versión de software
- **Fase**: Reconocimiento
- **Comandos específicos para Aprende-y-Aplica**:
```bash
# Escaneo de puertos del servidor
nmap -sS -sV -O aprende-y-aplica.com

# Escaneo de puertos específicos (HTTP, HTTPS, API)
nmap -p 80,443,4000 aprende-y-aplica.com

# Detección de servicios y versiones
nmap -sV --script=http-enum aprende-y-aplica.com
```

#### WhatWeb / Wappalyzer
- **¿Para qué sirve?**: Identificar tecnologías web (Next.js, React, Supabase)
- **Fase**: Reconocimiento
- **Comandos**:
```bash
# Identificar stack tecnológico
whatweb https://aprende-y-aplica.com

# Resultado esperado: Next.js, React, Supabase, etc.
```

#### Nuclei
- **¿Para qué sirve?**: Escaneo automatizado de vulnerabilidades conocidas
- **Fase**: Reconocimiento, Identificación de Vulnerabilidades
- **Comandos**:
```bash
# Escaneo de vulnerabilidades de Next.js
nuclei -u https://aprende-y-aplica.com -t cves/ -t exposures/

# Templates específicos para Next.js
nuclei -u https://aprende-y-aplica.com -t technologies/nextjs/
```

### 2. Análisis de Aplicación Web

#### Burp Suite
- **¿Para qué sirve?**: Análisis completo de aplicación web, proxy intercepting
- **Fase**: Todas las fases
- **Uso específico para Aprende-y-Aplica**:
  - Interceptar peticiones a `/api/*` (Next.js API routes)
  - Analizar peticiones a backend Express en puerto 4000
  - Modificar JWT tokens
  - Fuzzing de parámetros en endpoints
  - Análisis de autenticación Supabase

#### OWASP ZAP
- **¿Para qué sirve?**: Escaneo automatizado de vulnerabilidades OWASP Top 10
- **Fase**: Identificación de Vulnerabilidades
- **Uso**:
  - Escaneo automático de toda la aplicación
  - Análisis de API routes de Next.js
  - Detección de XSS, SQL Injection, etc.

#### Postman / Insomnia
- **¿Para qué sirve?**: Testing manual de APIs
- **Fase**: Enumeración, Explotación
- **Uso para Aprende-y-Aplica**:
  - Probar endpoints `/api/v1/*` del backend Express
  - Probar Next.js API routes `/api/*`
  - Manipular headers de autenticación
  - Enviar payloads maliciosos

### 3. Análisis de Autenticación

#### JWT_Tool
- **¿Para qué sirve?**: Análisis y manipulación de tokens JWT
- **Fase**: Explotación
- **Comandos**:
```bash
# Analizar token JWT
python3 jwt_tool.py <JWT_TOKEN>

# Intentar algoritmos débiles (none, HS256 con secret débil)
python3 jwt_tool.py <JWT_TOKEN> -C -d wordlist.txt

# Modificar claims (cambiar rol de user a admin)
python3 jwt_tool.py <JWT_TOKEN> -T
```

#### Hashcat / John the Ripper
- **¿Para qué sirve?**: Fuerza bruta de contraseñas hasheadas
- **Fase**: Explotación
- **Uso**: Si se obtienen hashes de Supabase (bcrypt), intentar crackear

#### Hydra
- **¿Para qué sirve?**: Fuerza bruta de login
- **Fase**: Explotación
- **Comandos**:
```bash
# Fuerza bruta en endpoint de login de Supabase Auth
hydra -l usuario@empresa.com -P passwords.txt aprende-y-aplica.com https-post-form "/auth/v1/token:email=^USER^&password=^PASS^:Invalid"
```

### 4. Análisis de Base de Datos (Supabase)

#### SQLMap
- **¿Para qué sirve?**: Explotación automatizada de SQL Injection
- **Fase**: Explotación
- **Uso para Supabase**:
```bash
# Aunque Supabase usa parámetros preparados, si hay construcción dinámica:
sqlmap -u "https://aprende-y-aplica.com/api/courses?search=test" --dbs

# Si se encuentra vulnerabilidad, enumerar tablas
sqlmap -u "https://aprende-y-aplica.com/api/courses?search=test" -D supabase --tables
```

**Nota**: Supabase generalmente es seguro, pero errores en lógica de aplicación pueden permitir bypass de RLS.

#### Supabase Client Analysis
- **Análisis manual de queries**:
  - Revisar código fuente para construcción dinámica de queries
  - Verificar que todas las queries usen métodos seguros de Supabase
  - Analizar políticas RLS

### 5. Análisis de Next.js Específico

#### Next.js Information Disclosure
- **Herramientas manuales**:
```bash
# Buscar archivos de build expuestos
curl https://aprende-y-aplica.com/_next/static/chunks/manifest.json
curl https://aprende-y-aplica.com/_next/static/buildManifest.js

# Buscar source maps (pueden exponer código)
curl https://aprende-y-aplica.com/_next/static/chunks/*.map
```

#### React DevTools
- **Uso**: Analizar estado de React, props, componentes
- **Fase**: Enumeración
- **Permite**: Ver datos en memoria del cliente, tokens, estado de autenticación

### 6. Análisis de Dependencias

#### npm audit
- **¿Para qué sirve?**: Detectar vulnerabilidades en dependencias npm
- **Fase**: Reconocimiento
- **Comandos**:
```bash
cd apps/web
npm audit

cd apps/api
npm audit
```

#### Snyk
- **¿Para qué sirve?**: Análisis avanzado de vulnerabilidades en dependencias
- **Fase**: Identificación de Vulnerabilidades
- **Uso**:
```bash
snyk test
snyk monitor
```

#### Retire.js
- **¿Para qué sirve?**: Detectar librerías JavaScript vulnerables
- **Fase**: Identificación de Vulnerabilidades
- **Comandos**:
```bash
retire --path apps/web
```

### 7. Análisis de Headers y Configuración

#### Security Headers Scanner
- **Herramientas online**: securityheaders.com
- **Uso**: Verificar headers de seguridad implementados
- **Verificar**: CSP, HSTS, X-Frame-Options, etc.

#### SSL Labs / SSLTest
- **¿Para qué sirve?**: Análisis de configuración SSL/TLS
- **Fase**: Enumeración
- **Uso**: Verificar certificados, cifrados, configuración TLS

### 8. Fuzzing y Testing de APIs

#### ffuf
- **¿Para qué sirve?**: Fuzzing de endpoints y parámetros
- **Fase**: Enumeración, Explotación
- **Comandos**:
```bash
# Fuzzing de rutas de API
ffuf -w wordlist.txt -u https://aprende-y-aplica.com/api/FUZZ

# Fuzzing de parámetros
ffuf -w wordlist.txt -u "https://aprende-y-aplica.com/api/courses?FUZZ=test"
```

#### Arjun
- **¿Para qué sirve?**: Descubrimiento de parámetros ocultos en APIs
- **Fase**: Enumeración
- **Comandos**:
```bash
arjun -u https://aprende-y-aplica.com/api/courses
```

### 9. Análisis de Código Fuente

#### Semgrep
- **¿Para qué sirve?**: Análisis estático de código
- **Fase**: Análisis (si se tiene acceso al código)
- **Comandos**:
```bash
# Escaneo de vulnerabilidades comunes
semgrep --config=auto apps/

# Reglas específicas para Next.js
semgrep --config=p/nextjs apps/web/
```

#### SonarQube
- **¿Para qué sirve?**: Análisis de calidad y seguridad de código
- **Fase**: Análisis
- **Detecta**: Code smells, vulnerabilidades, bugs de seguridad

### 10. Análisis de Supabase Específico

#### Supabase CLI
- **¿Para qué sirve?**: Gestión y análisis de proyectos Supabase
- **Fase**: Análisis
- **Comandos**:
```bash
# Si se tiene acceso (solo para análisis propio)
supabase db dump
supabase db diff
```

#### Análisis Manual de RLS Policies
- Revisar políticas de Row Level Security
- Verificar que todas las tablas tengan RLS habilitado
- Analizar lógica de políticas para bypass potenciales

### Resumen de Herramientas por Fase

| Fase | Herramientas Principales |
|------|------------------------|
| **Reconocimiento** | Nmap, WhatWeb, Wappalyzer, Nuclei |
| **Enumeración** | Burp Suite, OWASP ZAP, ffuf, Arjun |
| **Identificación** | OWASP ZAP, Nuclei, npm audit, Snyk |
| **Explotación** | Burp Suite, SQLMap, JWT_Tool, Hydra |
| **Post-Explotación** | Supabase CLI, análisis de RLS |
| **Análisis de Código** | Semgrep, SonarQube, análisis manual |

---

## Apartado 4: Laboratorio Práctico

### Preparación del Entorno

**Requisitos:**
- Instancia de desarrollo de Aprende-y-Aplica (local o staging)
- Herramientas de pentesting (ver opciones abajo)
- Acceso a código fuente (para análisis estático)
- Credenciales de prueba (no producción)

**Opciones de Entorno para Herramientas de Pentesting:**

**Opción 1: Kali Linux / Parrot Security (Recomendado)**
- ✅ Todas las herramientas preinstaladas
- ✅ Configuración lista para usar
- ✅ Ideal para demostración profesional
- ⚠️ Requiere máquina virtual o instalación dedicada

**Opción 2: Windows con Herramientas Instaladas**
- ✅ Puedes usar tu sistema actual
- ✅ Instalar herramientas individualmente:
  - Burp Suite Community (descarga gratuita)
  - OWASP ZAP (descarga gratuita)
  - Nmap para Windows
  - Postman (gratis)
  - Node.js (para npm audit)
- ⚠️ Algunas herramientas Linux no disponibles nativamente

**Opción 3: WSL2 (Windows Subsystem for Linux)**
- ✅ Mejor de ambos mundos
- ✅ Ejecutar herramientas Linux en Windows
- ✅ Instalar herramientas con apt (como en Kali)
- ⚠️ Requiere configuración inicial

**Opción 4: Docker con Herramientas**
- ✅ Contenedores con herramientas específicas
- ✅ No requiere instalación completa
- ✅ Fácil de limpiar después
- ⚠️ Requiere conocimiento de Docker

**Opción 5: Máquina Virtual con Ubuntu/Debian + Herramientas Manuales**
- ✅ Instalar solo lo necesario
- ✅ Más ligero que Kali
- ✅ Control total sobre herramientas
- ⚠️ Requiere instalación manual de cada herramienta

**Recomendación para el Trabajo:**
- **Si tienes tiempo**: Usa Kali Linux/Parrot Security en VM (más profesional)
- **Si necesitas rapidez**: Usa Windows con Burp Suite + OWASP ZAP + Postman (suficiente para la mayoría de pruebas)
- **Si quieres flexibilidad**: WSL2 con herramientas Linux

**Configuración del Entorno de Prueba:**
1. Clonar repositorio de Aprende-y-Aplica
2. Configurar variables de entorno de desarrollo
3. Iniciar aplicación localmente:
   ```bash
   # Frontend
   cd apps/web
   npm run dev  # Puerto 3000
   
   # Backend
   cd apps/api
   npm run dev  # Puerto 4000
   ```
4. Configurar Supabase local o usar proyecto de desarrollo
5. Crear usuarios de prueba con diferentes roles

**Herramientas a Utilizar:**
- Burp Suite Community
- OWASP ZAP
- Nmap
- JWT_Tool
- Postman
- npm audit
- Semgrep (si se tiene código)

**Instalación Rápida en Windows (Alternativa a Kali):**

1. **Burp Suite Community** (Esencial)
   - Descargar: https://portswigger.net/burp/communitydownload
   - Instalador .exe, ejecutar y seguir wizard
   - Gratis, no requiere registro

2. **OWASP ZAP** (Alternativa a Burp)
   - Descargar: https://www.zaproxy.org/download/
   - Versión Windows installer
   - Gratis y open source

3. **Nmap para Windows**
   - Descargar: https://nmap.org/download.html
   - Instalador Windows
   - O usar versión portable

4. **Postman**
   - Descargar: https://www.postman.com/downloads/
   - Gratis con cuenta (suficiente para pruebas)

5. **Node.js** (Para npm audit)
   - Ya deberías tenerlo instalado
   - Verificar: `node --version` y `npm --version`

6. **JWT_Tool** (Opcional, para análisis de JWT)
   - Requiere Python
   - Instalar: `pip install jwt-tool`
   - O usar herramienta online: https://jwt.io

**Nota Importante:**
- Para la mayoría de pruebas del laboratorio, **Burp Suite Community + Postman** son suficientes
- Nmap es útil pero no crítico si pruebas localhost
- Las herramientas web (Burp, ZAP) son las más importantes para aplicaciones web

### Procedimiento del Laboratorio

#### Paso 1: Reconocimiento Inicial

**Objetivo**: Identificar tecnologías y servicios expuestos

**Comandos ejecutados:**
```bash
# Escaneo de puertos
nmap -sS -sV -O localhost

# Identificación de tecnologías
whatweb http://localhost:3000

# Análisis de headers de seguridad
curl -I http://localhost:3000
curl -I https://localhost:3000  # Si hay HTTPS
```

**Resultados esperados:**
- Puerto 3000: Next.js (frontend)
- Puerto 4000: Express.js (backend API)
- Tecnologías: Next.js, React, Supabase
- Headers de seguridad: CSP, X-Frame-Options, etc.

**Evidencias:**
- Captura de pantalla de Nmap mostrando puertos abiertos
- Output de WhatWeb con tecnologías identificadas
- Headers HTTP capturados

#### Paso 2: Enumeración de Endpoints

**Objetivo**: Descubrir todas las rutas y endpoints disponibles

**Comandos ejecutados:**
```bash
# Fuzzing de rutas de Next.js
ffuf -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt \
     -u http://localhost:3000/FUZZ

# Fuzzing de API routes
ffuf -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt \
     -u http://localhost:3000/api/FUZZ

# Fuzzing de backend Express
ffuf -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt \
     -u http://localhost:4000/api/v1/FUZZ
```

**Análisis con Burp Suite:**
1. Configurar Burp como proxy
2. Navegar por la aplicación manualmente
3. Revisar sitemap de Burp para todas las rutas descubiertas
4. Identificar endpoints de autenticación, API, admin, etc.

**Resultados esperados:**
- Rutas públicas: `/`, `/login`, `/register`, `/courses`
- Rutas protegidas: `/admin/*`, `/business-panel/*`, `/business-user/*`
- API routes: `/api/*` (Next.js), `/api/v1/*` (Express)
- Endpoints de autenticación: `/auth/login`, `/auth/register`

**Evidencias:**
- Sitemap de Burp Suite con todas las rutas
- Lista de endpoints descubiertos
- Capturas de rutas protegidas que requieren autenticación

#### Paso 3: Análisis de Autenticación

**Objetivo**: Analizar sistema de autenticación (Supabase Auth + JWT)

**Procedimiento:**
1. **Interceptar login con Burp Suite:**
   - Realizar login normal
   - Capturar petición a Supabase Auth
   - Analizar respuesta con tokens

2. **Analizar JWT Token:**
```bash
# Decodificar JWT (sin verificar firma)
echo "<JWT_TOKEN>" | cut -d. -f1,2 | base64 -d

# Analizar con jwt_tool
python3 jwt_tool.py <JWT_TOKEN>
```

3. **Verificar validación de token:**
   - Modificar claims en JWT (cambiar rol)
   - Intentar usar token modificado
   - Verificar si la aplicación valida correctamente

**Resultados esperados:**
- Estructura de JWT identificada
- Claims: `userId`, `role`, `exp`, `fingerprint`
- Validación de firma funcionando
- Modificación de rol detectada y rechazada

**Evidencias:**
- JWT decodificado mostrando estructura
- Intento de modificación de rol (debe fallar)
- Logs de aplicación mostrando rechazo de token inválido

#### Paso 4: Escaneo de Vulnerabilidades Automatizado

**Objetivo**: Identificar vulnerabilidades conocidas

**Comandos ejecutados:**
```bash
# Escaneo con OWASP ZAP
# Desde interfaz gráfica, iniciar escaneo automático
# Target: http://localhost:3000

# Escaneo con Nuclei
nuclei -u http://localhost:3000 -t cves/ -t exposures/

# Auditoría de dependencias
cd apps/web
npm audit

cd apps/api
npm audit
```

**Análisis de resultados:**
- Vulnerabilidades de dependencias identificadas
- Configuraciones inseguras detectadas
- Headers de seguridad verificados

**Resultados esperados:**
- Vulnerabilidades de npm packages (si las hay)
- Recomendaciones de actualización
- Headers de seguridad correctamente configurados

**Evidencias:**
- Reporte de npm audit
- Reporte de OWASP ZAP
- Lista de vulnerabilidades encontradas

#### Paso 5: Análisis de API Routes (Next.js)

**Objetivo**: Probar endpoints de API de Next.js

**Endpoints a probar:**
- `/api/ai-chat` - Chat con LIA
- `/api/study-planner/*` - Planificador de estudio
- `/api/courses/*` - Gestión de cursos
- Cualquier otro endpoint descubierto

**Pruebas con Postman/Burp:**
1. **Sin autenticación:**
```bash
curl http://localhost:3000/api/courses
# Debe retornar 401 Unauthorized
```

2. **Con autenticación válida:**
```bash
curl -H "Authorization: Bearer <JWT_TOKEN>" \
     http://localhost:3000/api/courses
```

3. **Fuzzing de parámetros:**
```bash
# Probar inyección en parámetros
curl "http://localhost:3000/api/courses?search=test' OR '1'='1"
curl "http://localhost:3000/api/courses?search=<script>alert('XSS')</script>"
```

**Resultados esperados:**
- Endpoints protegidos correctamente
- Validación de entrada funcionando
- No SQL Injection ni XSS

**Evidencias:**
- Respuestas de API (200, 401, 403, etc.)
- Payloads de prueba enviados
- Respuestas mostrando validación correcta

#### Paso 6: Análisis de Backend Express

**Objetivo**: Probar endpoints del backend Express

**Comandos ejecutados:**
```bash
# Health check
curl http://localhost:4000/health

# Probar endpoints de API
curl http://localhost:4000/api/v1/auth/login \
     -X POST \
     -H "Content-Type: application/json" \
     -d '{"email":"test@test.com","password":"test"}'

# Probar rate limiting
# Enviar más de 1000 requests en 15 minutos
for i in {1..1001}; do
  curl http://localhost:4000/api/v1/users
done
```

**Análisis de seguridad:**
- Verificar rate limiting (debe bloquear después de 1000 requests)
- Probar CORS (intentar desde origen no permitido)
- Verificar headers de Helmet

**Resultados esperados:**
- Rate limiting funcionando
- CORS bloqueando orígenes no permitidos
- Headers de seguridad presentes

**Evidencias:**
- Respuesta de rate limit (429 Too Many Requests)
- Headers HTTP mostrando seguridad
- Logs de aplicación

#### Paso 7: Análisis de Supabase y RLS

**Objetivo**: Verificar seguridad de base de datos

**Procedimiento:**
1. **Revisar políticas RLS:**
   - Si se tiene acceso a Supabase dashboard
   - Verificar que todas las tablas tengan RLS habilitado
   - Revisar lógica de políticas

2. **Probar bypass de RLS:**
   - Intentar acceder a datos de otra organización
   - Modificar queries para ver si RLS las bloquea
   - Probar con diferentes roles de usuario

3. **Análisis de queries:**
   - Revisar código fuente para construcción de queries
   - Verificar que no haya concatenación de strings SQL
   - Verificar uso correcto de Supabase client

**Resultados esperados:**
- RLS correctamente configurado
- No acceso a datos de otras organizaciones
- Queries usando métodos seguros de Supabase

**Evidencias:**
- Políticas RLS documentadas
- Pruebas de acceso cruzado (deben fallar)
- Código fuente mostrando queries seguras

#### Paso 8: Análisis de Vulnerabilidades Específicas

**Objetivo**: Probar vulnerabilidades específicas de Next.js y la aplicación

**Pruebas:**

1. **XSS en componentes React:**
   - Buscar uso de `dangerouslySetInnerHTML`
   - Probar inyección de scripts en campos de entrada
   - Verificar sanitización

2. **SSR Information Disclosure:**
```bash
# Buscar source maps expuestos
curl http://localhost:3000/_next/static/chunks/*.map

# Buscar archivos de build
curl http://localhost:3000/_next/static/buildManifest.js
```

3. **Path Traversal:**
```bash
# Intentar acceder a archivos del sistema
curl http://localhost:3000/api/files/../../../etc/passwd
```

4. **Open Redirect:**
```bash
# Probar parámetros de redirect
curl "http://localhost:3000/login?redirect=https://evil.com"
```

**Resultados esperados:**
- No XSS (sanitización correcta)
- Source maps no expuestos en producción
- Path traversal bloqueado
- Open redirect validado

**Evidencias:**
- Payloads de prueba
- Respuestas mostrando protección
- Código fuente mostrando validaciones

### Resultados Obtenidos

**Vulnerabilidades Identificadas:**
1. ✅ (o ❌) Autenticación JWT correctamente validada
2. ✅ (o ❌) Rate limiting funcionando
3. ✅ (o ❌) Headers de seguridad presentes
4. ✅ (o ❌) RLS correctamente configurado
5. ✅ (o ❌) Validación de entrada en APIs
6. ✅ (o ❌) Dependencias actualizadas
7. ✅ (o ❌) No XSS en componentes
8. ✅ (o ❌) No información expuesta en SSR

**Fortalezas Encontradas:**
- Headers de seguridad bien configurados
- Autenticación robusta con JWT + fingerprint
- Rate limiting implementado
- RLS en base de datos
- Validación de entrada con Zod

**Áreas de Mejora Identificadas:**
- [Listar áreas específicas encontradas]
- Rate limiting podría ser más restrictivo en login
- CSP podría ser más estricto (quitar unsafe-eval)
- Falta de MFA en autenticación
- Logs podrían contener información sensible

### Evidencias

**Capturas de Pantalla:**
1. Reconocimiento inicial (Nmap, WhatWeb)
2. Enumeración de endpoints (Burp Sitemap)
3. Análisis de JWT (jwt_tool output)
4. Escaneo de vulnerabilidades (OWASP ZAP report)
5. Pruebas de API (Postman/Burp requests)
6. Análisis de RLS (Supabase dashboard)
7. Pruebas de XSS/SQL Injection (payloads y respuestas)

**Logs y Reportes:**
- Reporte completo de OWASP ZAP
- Output de npm audit
- Logs de aplicación durante pruebas
- Exportación de resultados de Burp Suite

**Código Analizado:**
- Fragmentos de código mostrando validaciones
- Configuraciones de seguridad
- Políticas RLS

### Conclusiones del Laboratorio

**Hallazgos Principales:**
1. La plataforma implementa múltiples capas de seguridad
2. Autenticación robusta con validación de fingerprint
3. Headers de seguridad correctamente configurados
4. RLS protege datos a nivel de base de datos
5. Rate limiting previene ataques de fuerza bruta

**Vulnerabilidades Encontradas:**
- [Listar vulnerabilidades específicas si se encontraron]
- [Clasificar por severidad: Crítica, Alta, Media, Baja]

**Recomendaciones Prioritarias:**
1. Implementar MFA para cuentas administrativas
2. Reducir rate limiting en endpoints de login
3. Hacer CSP más restrictivo
4. Implementar logging de seguridad más detallado
5. Auditoría regular de dependencias

**Lecciones Aprendidas:**
1. La importancia de defense in depth (múltiples capas)
2. Validación tanto en frontend como backend
3. RLS es crítico para seguridad multi-tenant
4. Headers de seguridad previenen muchos ataques
5. Análisis continuo de dependencias es esencial

---

## Apartado 5: Recomendaciones de Seguridad (Hardening)

### Soluciones Técnicas Específicas para Aprende-y-Aplica

#### 1. Hardening de Next.js

**Configuración de next.config.ts Mejorada:**

```typescript
const nextConfig: NextConfig = {
  // ❌ REMOVER - No ignorar errores de TypeScript
  typescript: {
    ignoreBuildErrors: false, // Cambiar a false
  },

  // ✅ MEJORAR CSP - Más restrictivo
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // Remover 'unsafe-eval' y 'unsafe-inline' si es posible
              "script-src 'self'", // Sin unsafe-eval
              "style-src 'self' 'unsafe-inline'", // CSS inline necesario
              "img-src 'self' data: https://*.supabase.co",
              "connect-src 'self' https://*.supabase.co https://api.openai.com",
              "frame-src 'none'", // Más restrictivo que 'self'
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests"
            ].join('; ')
          },
          // HSTS siempre, no solo en producción
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          }
        ],
      },
    ];
  },
};
```

**Validación de API Routes:**

```typescript
// ✅ SEGURO - Validación con Zod
import { z } from 'zod';

const courseSchema = z.object({
  courseId: z.string().uuid(),
  userId: z.string().uuid(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = courseSchema.parse(body); // Valida y lanza error si inválido
    
    // Ahora usar validated.courseId (tipo seguro)
    const result = await supabase
      .from('progress')
      .insert({ 
        course_id: validated.courseId, 
        user_id: validated.userId 
      });
    
    return Response.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Invalid input' }, { status: 400 });
    }
    throw error;
  }
}
```

**Sanitización de Contenido:**

```typescript
// ✅ SEGURO - Sanitizar antes de renderizar
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

function sanitizeHtml(dirty: string): string {
  const window = new JSDOM('').window;
  const purify = DOMPurify(window as any);
  return purify.sanitize(dirty);
}

// En componente React
function CourseDescription({ description }: { description: string }) {
  const clean = sanitizeHtml(description);
  return <div dangerouslySetInnerHTML={{ __html: clean }} />;
}
```

#### 2. Hardening de Express Backend

**Rate Limiting Mejorado:**

```typescript
// ✅ MEJORADO - Rate limiting diferenciado por endpoint
import rateLimit from 'express-rate-limit';

// Rate limiting general (más restrictivo)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500, // Reducido de 1000
  message: 'Too many requests',
});

// Rate limiting estricto para login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Solo 5 intentos por 15 minutos
  skipSuccessfulRequests: true,
  message: 'Too many login attempts',
});

// Aplicar
app.use('/api/v1/', generalLimiter);
app.use('/api/v1/auth/login', loginLimiter);
```

**Validación de JWT Mejorada:**

```typescript
// ✅ MEJORADO - Validación más estricta
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Token required' });
    }

    // Verificar JWT
    const decoded = jwt.verify(token, config.JWT_SECRET) as any;
    
    // ✅ Validar expiración en base de datos también
    const session = await supabase
      .from('user_session')
      .select('*')
      .eq('jwt_id', decoded.jwtId)
      .eq('revoked', false)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (!session.data) {
      return res.status(401).json({ error: 'Session expired or revoked' });
    }

    // ✅ Validar fingerprint
    const fingerprint = req.headers['x-device-fingerprint'];
    if (session.data.fingerprint !== fingerprint) {
      return res.status(401).json({ error: 'Invalid device' });
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    // Log error pero no exponer detalles
    console.error('Auth error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
};
```

**CORS Más Restrictivo:**

```typescript
// ✅ MEJORADO - CORS más restrictivo
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = config.ALLOWED_ORIGINS?.split(',') || [];
    
    // No permitir requests sin origin (como Postman)
    if (!origin) {
      return callback(new Error('CORS: Origin required'));
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS: Not allowed'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400, // 24 horas
}));
```

#### 3. Hardening de Supabase

**Políticas RLS Mejoradas:**

```sql
-- ✅ SEGURO - Política RLS que verifica organización
CREATE POLICY "Users can only read their organization's data"
ON progress FOR SELECT
USING (
  -- Verificar que el usuario pertenece a la misma organización
  EXISTS (
    SELECT 1 FROM users u1
    JOIN users u2 ON u1.organization_id = u2.organization_id
    WHERE u1.id = auth.uid()
    AND u2.id = progress.user_id
  )
);

-- ✅ SEGURO - Política para insert que valida organización
CREATE POLICY "Users can only insert their own progress"
ON progress FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND organization_id IS NOT NULL
  )
);
```

**Validación de Queries:**

```typescript
// ✅ SEGURO - Siempre usar métodos de Supabase, nunca SQL crudo
// ❌ NUNCA HACER ESTO:
// const query = `SELECT * FROM users WHERE name = '${name}'`;
// await supabase.rpc('exec_sql', { query });

// ✅ SIEMPRE HACER ESTO:
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('name', name); // Supabase maneja la sanitización
```

**Rotación de API Keys:**

- Rotar `SUPABASE_ANON_KEY` regularmente
- Rotar `SUPABASE_SERVICE_ROLE_KEY` (más crítico)
- Usar diferentes keys para desarrollo/staging/producción
- Nunca commitear keys en repositorio

#### 4. Autenticación Mejorada

**Implementar MFA:**

```typescript
// ✅ AGREGAR - MFA con TOTP
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

// Generar secreto MFA para usuario
export async function generateMFASecret(userId: string) {
  const secret = speakeasy.generateSecret({
    name: `Aprende-y-Aplica (${userEmail})`,
  });

  await supabase
    .from('user_mfa')
    .insert({
      user_id: userId,
      secret: secret.base32,
      enabled: false,
    });

  const qrCode = await QRCode.toDataURL(secret.otpauth_url);
  return { secret: secret.base32, qrCode };
}

// Verificar código MFA
export async function verifyMFA(userId: string, token: string): Promise<boolean> {
  const { data } = await supabase
    .from('user_mfa')
    .select('secret')
    .eq('user_id', userId)
    .eq('enabled', true)
    .single();

  if (!data) return false;

  return speakeasy.totp.verify({
    secret: data.secret,
    encoding: 'base32',
    token,
    window: 2, // Permitir ±2 períodos de tiempo
  });
}
```

**Gestión de Sesiones Mejorada:**

```typescript
// ✅ MEJORADO - Limpieza automática de sesiones expiradas
export async function cleanupExpiredSessions() {
  await supabase
    .from('user_session')
    .update({ revoked: true })
    .lt('expires_at', new Date().toISOString());
}

// Ejecutar cada hora
setInterval(cleanupExpiredSessions, 60 * 60 * 1000);
```

#### 5. Logging y Monitoreo

**Logging de Seguridad:**

```typescript
// ✅ AGREGAR - Logging de eventos de seguridad
export async function logSecurityEvent(
  eventType: string,
  details: Record<string, any>
) {
  await supabase
    .from('security_logs')
    .insert({
      event_type: eventType,
      details: details,
      ip_address: req.ip,
      user_agent: req.headers['user-agent'],
      timestamp: new Date().toISOString(),
    });
}

// Usar en middleware de autenticación
if (!isValid) {
  await logSecurityEvent('FAILED_LOGIN_ATTEMPT', {
    email: req.body.email,
    reason: 'Invalid credentials',
  });
}
```

**Monitoreo de Anomalías:**

```typescript
// ✅ AGREGAR - Detección de comportamiento anómalo
export async function detectAnomalies(userId: string, action: string) {
  // Contar acciones en última hora
  const recentActions = await supabase
    .from('user_activity')
    .select('*')
    .eq('user_id', userId)
    .eq('action', action)
    .gte('timestamp', new Date(Date.now() - 3600000).toISOString());

  // Si más de 100 acciones en una hora, alertar
  if (recentActions.data && recentActions.data.length > 100) {
    await logSecurityEvent('ANOMALOUS_ACTIVITY', {
      userId,
      action,
      count: recentActions.data.length,
    });
    // Enviar alerta a administradores
  }
}
```

### Buenas Prácticas Específicas

#### 1. Gestión de Variables de Entorno

**Validación con Zod:**

```typescript
// ✅ AGREGAR - Validar variables de entorno
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(20),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  JWT_SECRET: z.string().min(32),
  OPENAI_API_KEY: z.string().startsWith('sk-'),
});

export const config = envSchema.parse(process.env);
```

#### 2. Gestión de Dependencias

**Auditoría Regular:**

```bash
# Ejecutar semanalmente
npm audit
npm audit fix

# Usar Snyk para análisis más profundo
snyk test
snyk monitor

# Actualizar dependencias regularmente
npm update
```

**Dependabot / Renovate:**

- Configurar Dependabot en GitHub para actualizaciones automáticas
- Revisar y aprobar PRs de actualización de dependencias
- Ejecutar tests antes de mergear actualizaciones

#### 3. Code Review de Seguridad

**Checklist de Code Review:**
- [ ] Validación de entrada con Zod
- [ ] Sanitización de output
- [ ] No uso de `dangerouslySetInnerHTML` sin sanitizar
- [ ] Queries a Supabase usando métodos seguros
- [ ] Verificación de autenticación en todas las rutas protegidas
- [ ] Verificación de autorización (roles)
- [ ] No exposición de información sensible en errores
- [ ] Rate limiting en endpoints críticos
- [ ] Logging de eventos de seguridad

#### 4. Testing de Seguridad

**Tests de Seguridad:**

```typescript
// ✅ AGREGAR - Tests de seguridad
describe('Security Tests', () => {
  it('should reject SQL injection in search', async () => {
    const response = await request(app)
      .get('/api/courses')
      .query({ search: "test' OR '1'='1" });
    
    expect(response.status).toBe(400);
  });

  it('should reject XSS in user input', async () => {
    const response = await request(app)
      .post('/api/courses')
      .send({ name: "<script>alert('XSS')</script>" });
    
    expect(response.body.name).not.toContain('<script>');
  });

  it('should enforce rate limiting', async () => {
    const requests = Array(1001).fill(null).map(() =>
      request(app).get('/api/users')
    );
    
    const responses = await Promise.all(requests);
    const lastResponse = responses[responses.length - 1];
    
    expect(lastResponse.status).toBe(429);
  });
});
```

### Configuraciones Seguras Específicas

#### 1. Configuración de Producción

**Variables de Entorno de Producción:**
```bash
# .env.production
NODE_ENV=production
SUPABASE_URL=https://[project].supabase.co
SUPABASE_ANON_KEY=[key]
SUPABASE_SERVICE_ROLE_KEY=[key] # Solo en backend
JWT_SECRET=[strong-random-secret-min-32-chars]
OPENAI_API_KEY=[key]

# Deshabilitar debug
DEBUG=false
LOG_LEVEL=error

# Configuración de seguridad
ALLOWED_ORIGINS=https://aprende-y-aplica.com,https://www.aprende-y-aplica.com
CORS_CREDENTIALS=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=500
```

#### 2. Configuración de Supabase

**Políticas de Seguridad:**
- Habilitar RLS en todas las tablas
- Revisar políticas RLS regularmente
- Usar service role key solo en backend, nunca en frontend
- Rotar keys regularmente
- Habilitar audit logging en Supabase

**Configuración de Auth:**
- Habilitar MFA (cuando esté disponible)
- Configurar políticas de contraseña fuertes
- Habilitar email verification
- Configurar sesión timeout apropiado

#### 3. Configuración de Deployment

**Vercel/Netlify:**
- Usar variables de entorno del dashboard, no en código
- Habilitar función de protección DDoS
- Configurar custom headers de seguridad
- Habilitar logging y monitoreo

**Backend (si está en servidor separado):**
- Firewall configurado (solo puertos necesarios)
- SSL/TLS con certificados válidos
- Actualizaciones de sistema regular
- Monitoreo de recursos

### Políticas Recomendadas

#### 1. Política de Desarrollo Seguro

- Code review obligatorio antes de merge
- Tests de seguridad en CI/CD
- Auditoría de dependencias antes de deploy
- No commitear secrets nunca
- Usar secret management (Vercel/Netlify env vars)

#### 2. Política de Actualizaciones

- Actualizar dependencias críticas en 7 días
- Parches de seguridad en 24 horas
- Actualizar Next.js/React regularmente
- Auditoría mensual de dependencias

#### 3. Política de Respuesta a Incidentes

- Plan documentado de respuesta
- Equipo de seguridad designado
- Procedimientos de contención
- Comunicación con clientes B2B
- Análisis post-incidente obligatorio

#### 4. Política de Acceso

- Principio de menor privilegio
- MFA obligatorio para admins
- Rotación de credenciales cada 90 días
- Revisión trimestral de accesos
- Logging de todos los accesos administrativos

### Medidas Preventivas Específicas

#### 1. WAF (Web Application Firewall)

**Implementar WAF:**
- Cloudflare WAF (si se usa Cloudflare)
- AWS WAF (si está en AWS)
- ModSecurity (si hay servidor propio)

**Reglas WAF:**
- Bloquear SQL injection patterns
- Bloquear XSS patterns
- Rate limiting a nivel de WAF
- Geolocation blocking (si aplica)

#### 2. Monitoreo Continuo

**Herramientas:**
- Sentry para errores de aplicación
- Datadog/New Relic para APM
- LogRocket para sesiones de usuario (con consentimiento)
- Custom dashboard para métricas de seguridad

**Alertas:**
- Múltiples intentos de login fallidos
- Actividad anómala de usuario
- Errores de autenticación inusuales
- Cambios en políticas RLS
- Accesos administrativos

#### 3. Backups y Recuperación

**Backups de Supabase:**
- Backups automáticos diarios
- Backups antes de migraciones
- Pruebas de restauración mensuales
- Almacenamiento fuera del servidor principal

**Backups de Código:**
- Git con branches protegidos
- Tags de versiones
- Documentación de rollback

### Checklist de Hardening Específico

**Next.js:**
- [ ] CSP configurado y restrictivo
- [ ] No `ignoreBuildErrors: true` en producción
- [ ] Validación con Zod en todas las API routes
- [ ] Sanitización de HTML antes de renderizar
- [ ] Source maps no expuestos en producción
- [ ] Variables de entorno validadas

**Express:**
- [ ] Rate limiting diferenciado por endpoint
- [ ] Validación de JWT con verificación en BD
- [ ] CORS restrictivo
- [ ] Headers de Helmet configurados
- [ ] Logging de seguridad implementado
- [ ] Manejo de errores sin exponer detalles

**Supabase:**
- [ ] RLS habilitado en todas las tablas
- [ ] Políticas RLS probadas y validadas
- [ ] Service role key solo en backend
- [ ] Keys rotadas regularmente
- [ ] Audit logging habilitado

**Autenticación:**
- [ ] MFA implementado para admins
- [ ] Fingerprint de dispositivo validado
- [ ] Sesiones limpiadas automáticamente
- [ ] Tokens revocados correctamente
- [ ] Contraseñas con política fuerte

**Monitoreo:**
- [ ] Logging de eventos de seguridad
- [ ] Alertas configuradas
- [ ] Dashboard de métricas
- [ ] Análisis de anomalías

**Dependencias:**
- [ ] Auditoría regular (npm audit)
- [ ] Actualizaciones regulares
- [ ] Dependabot/Renovate configurado
- [ ] Revisión de cambios en dependencias

---

## Conclusión

**Aprende-y-Aplica** es una plataforma B2B compleja con múltiples capas de seguridad ya implementadas. El análisis de seguridad revela una arquitectura bien diseñada con:

- **Fortalezas**: Headers de seguridad, RLS, autenticación robusta, rate limiting
- **Áreas de Mejora**: MFA, CSP más restrictivo, logging de seguridad, auditoría de dependencias

La implementación de las recomendaciones de hardening presentadas fortalecerá aún más la seguridad de la plataforma, protegiendo tanto a la empresa como a sus clientes B2B y usuarios finales.

La seguridad es un proceso continuo que requiere:
- Monitoreo constante
- Actualizaciones regulares
- Análisis de nuevas amenazas
- Mejora continua de controles

---

## Referencias

- OWASP Top 10 (2021). https://owasp.org/www-project-top-ten/
- Next.js Security Best Practices. https://nextjs.org/docs/app/building-your-application/configuring/security-headers
- Supabase Security Guide. https://supabase.com/docs/guides/auth/row-level-security
- Express.js Security Best Practices. https://expressjs.com/en/advanced/best-practice-security.html
- JWT Best Practices. https://datatracker.ietf.org/doc/html/rfc8725
- CWE Top 25. https://cwe.mitre.org/top25/
- NIST Cybersecurity Framework. https://www.nist.gov/cyberframework

---

*Documento preparado para el trabajo final del tercer departamental de Hackeo Ético*
*Plataforma: Aprende-y-Aplica - Servidores y Aplicaciones WEB*
