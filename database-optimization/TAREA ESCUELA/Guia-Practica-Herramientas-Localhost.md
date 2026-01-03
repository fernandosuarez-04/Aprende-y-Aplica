# Guía Práctica: Uso de Herramientas de Hackeo Ético
## Aprende-y-Aplica - Pruebas en Localhost

Esta guía proporciona pasos detallados para utilizar cada herramienta de seguridad en el entorno local de Aprende-y-Aplica.

---

## Tabla de Contenidos

1. [Preparación del Entorno Local](#1-preparación-del-entorno-local)
2. [Nmap - Escaneo de Puertos y Servicios](#2-nmap---escaneo-de-puertos-y-servicios)
3. [Burp Suite - Análisis de Aplicación Web](#3-burp-suite---análisis-de-aplicación-web)
4. [OWASP ZAP - Escaneo Automatizado](#4-owasp-zap---escaneo-automatizado)
5. [Postman - Testing de APIs](#5-postman---testing-de-apis)
6. [JWT_Tool / jwt.io - Análisis de Tokens](#6-jwt_tool--jwtiio---análisis-de-tokens)
7. [npm audit - Auditoría de Dependencias](#7-npm-audit---auditoría-de-dependencias)
8. [ffuf - Fuzzing de Endpoints](#8-ffuf---fuzzing-de-endpoints)
9. [Análisis Manual de Código](#9-análisis-manual-de-código)
10. [Interpretación de Resultados](#10-interpretación-de-resultados)

---

## 1. Preparación del Entorno Local

### 1.1 Iniciar la Aplicación

**Paso 1: Abrir terminales separadas**

Necesitarás 3 terminales:
- Terminal 1: Frontend (Next.js)
- Terminal 2: Backend (Express)
- Terminal 3: Para ejecutar herramientas de seguridad

**Paso 2: Iniciar Frontend**

```bash
# Navegar a la carpeta del frontend
cd apps/web

# Instalar dependencias (si no están instaladas)
npm install

# Iniciar servidor de desarrollo
npm run dev
```

**Resultado esperado:**
```
▲ Next.js 16.0.7
- Local:        http://localhost:3000
- ready started server on 0.0.0.0:3000
```

**Paso 3: Iniciar Backend**

```bash
# En otra terminal, navegar a la carpeta del backend
cd apps/api

# Instalar dependencias (si no están instaladas)
npm install

# Iniciar servidor
npm run dev
```

**Resultado esperado:**
```
Server running on port 4000
API available at http://localhost:4000/api/v1
```

**Paso 4: Verificar que todo funciona**

Abrir navegador y visitar:
- Frontend: http://localhost:3000
- Backend Health Check: http://localhost:4000/health

Deberías ver respuestas de ambos servidores.

### 1.2 Crear Usuarios de Prueba

**Opción A: Usar Supabase Dashboard**
1. Ir a tu proyecto de Supabase
2. Tabla `users` → Insertar usuario de prueba
3. O usar la interfaz de registro de la aplicación

**Opción B: Crear directamente en BD (solo desarrollo)**
```sql
-- Ejemplo de usuario de prueba
INSERT INTO users (email, password_hash, role) 
VALUES (
  'test@test.com',
  '$2b$12$...', -- Hash bcrypt de 'password123'
  'business_user'
);
```

**Usuarios recomendados para pruebas:**
- `admin@test.com` - Rol: admin
- `business_admin@test.com` - Rol: business_admin
- `business_user@test.com` - Rol: business_user

### 1.3 Obtener Tokens JWT para Pruebas

**Método 1: Login normal y capturar token**
1. Abrir navegador en http://localhost:3000
2. Abrir DevTools (F12) → Network
3. Hacer login
4. Buscar petición de login en Network
5. Copiar el token de la respuesta o de las cookies

**Método 2: Usar Postman (ver sección 5)**

---

## 2. Nmap - Escaneo de Puertos y Servicios

### 2.1 Instalación

**Windows:**
1. Descargar: https://nmap.org/download.html
2. Ejecutar instalador
3. Agregar al PATH (opcional)

**Verificar instalación:**
```bash
nmap --version
```

### 2.2 Escaneo Básico de Puertos

**Paso 1: Escanear localhost**

```bash
# Escaneo básico de puertos comunes
nmap localhost

# Escaneo de todos los puertos (más lento)
nmap -p- localhost

# Escaneo de puertos específicos
nmap -p 3000,4000,5432 localhost
```

**Resultado esperado:**
```
Starting Nmap 7.94...
Nmap scan report for localhost (127.0.0.1)
Host is up (0.001s latency).
Not shown: 997 closed ports
PORT     STATE SERVICE
3000/tcp open  http
4000/tcp open  http-alt

Nmap done: 1 IP address (1 host up) scanned in X.XX seconds
```

**Paso 2: Detección de Versiones**

```bash
# Escaneo con detección de versión de servicio
nmap -sV localhost

# Escaneo más agresivo (más información)
nmap -sV -sC localhost
```

**Resultado esperado:**
```
PORT     STATE SERVICE    VERSION
3000/tcp open  http       Node.js Express framework
4000/tcp open  http       Node.js Express framework
```

**Paso 3: Escaneo de Puertos Específicos de la Aplicación**

```bash
# Escanear solo los puertos que usa Aprende-y-Aplica
nmap -p 3000,4000 -sV -sC localhost
```

### 2.3 Análisis de Servicios HTTP

**Paso 1: Detectar tecnologías web**

```bash
# Scripts de enumeración HTTP
nmap --script http-enum localhost -p 3000,4000

# Detectar métodos HTTP permitidos
nmap --script http-methods localhost -p 3000,4000

# Detectar headers de seguridad
nmap --script http-security-headers localhost -p 3000,4000
```

**Paso 2: Buscar vulnerabilidades conocidas**

```bash
# Escaneo de vulnerabilidades HTTP
nmap --script http-vuln-* localhost -p 3000,4000
```

### 2.4 Guardar Resultados

```bash
# Guardar en formato normal
nmap -sV localhost -oN nmap-scan.txt

# Guardar en formato XML (para importar en otras herramientas)
nmap -sV localhost -oX nmap-scan.xml

# Guardar en los 3 formatos
nmap -sV localhost -oA nmap-scan
```

### 2.5 Interpretación de Resultados

**Qué buscar:**
- ✅ Puertos abiertos: 3000 (Next.js), 4000 (Express)
- ✅ Versiones de servicios detectadas
- ✅ Headers de seguridad presentes
- ⚠️ Puertos inesperados abiertos
- ⚠️ Versiones vulnerables de software

**Ejemplo de salida importante:**
```
PORT     STATE SERVICE    VERSION
3000/tcp open  http       Node.js Express framework
| http-security-headers:
|   Strict-Transport-Security: max-age=63072000
|   X-Frame-Options: DENY
|   X-Content-Type-Options: nosniff
|_  Content-Security-Policy: default-src 'self'
```

### 2.6 Análisis de Resultados Reales - Ejemplo Práctico

**Salida de nmap obtenida:**

```
PORT      STATE SERVICE       VERSION
135/tcp   open  msrpc         Microsoft Windows RPC
445/tcp   open  microsoft-ds?
3000/tcp  open  ppp?
3001/tcp  open  nessus?
8080/tcp  open  http-proxy
16992/tcp open  http          Intel Small Business Technology
```

**Interpretación detallada:**

#### ✅ **Puerto 3000 - Frontend Next.js (CORRECTO)**

**Hallazgos positivos:**
- ✅ **Content-Security-Policy presente**: Detectado en los headers
  ```
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'...
  ```
- ✅ **Headers de seguridad configurados**: frame-ancestors 'none', object-src 'none'
- ✅ **Servidor respondiendo**: HTTP/1.1 200 OK

**Análisis del CSP:**
- ⚠️ `'unsafe-eval'` y `'unsafe-inline'` presentes - **Área de mejora** (pero común en Next.js)
- ✅ Dominios externos específicos permitidos (Supabase, Google, OpenAI)
- ✅ `frame-ancestors 'none'` - Previene clickjacking

**Acción:** El puerto 3000 está correctamente configurado con headers de seguridad.

#### ✅ **Puerto 3001 - Backend Express (DETECTADO)**

**Hallazgos importantes:**
- ✅ **Rate Limiting detectado**: 
  ```
  RateLimit-Policy: 1000;w=900
  RateLimit-Limit: 1000
  RateLimit-Remaining: 999
  ```
  - Esto indica que el rate limiting está funcionando
  - Límite: 1000 requests por 900 segundos (15 minutos)

- ✅ **Headers de seguridad completos**:
  ```
  Strict-Transport-Security: max-age=15552000; includeSubDomains
  X-Content-Type-Options: nosniff
  X-Frame-Options: SAMEORIGIN
  Cross-Origin-Opener-Policy: same-origin
  ```

- ⚠️ **404 Not Found en GetRequest**: 
  - Esto es normal si el backend no tiene ruta raíz `/`
  - Verificar: `http://localhost:3001/health` o `http://localhost:3001/api/v1`

**Nota:** El puerto 3001 parece ser tu backend Express (no 4000 como esperábamos). Verifica en qué puerto está corriendo realmente.

#### ✅ **Puerto 8080 - Burp Suite (NORMAL)**

- ✅ Detectado correctamente como "Burp Suite Community Edition"
- ✅ Esto es tu herramienta de pentesting, no es un problema
- ✅ Headers de seguridad presentes: `X-Frame-Options: DENY`

**Acción:** No es una vulnerabilidad, es tu herramienta de análisis.

#### ⚠️ **Puertos del Sistema Windows (135, 445, 16992)**

- **Puerto 135 (msrpc)**: Servicio RPC de Windows - **Normal**
- **Puerto 445 (microsoft-ds)**: SMB de Windows - **Normal**
- **Puerto 16992**: Intel Small Business Technology - **Servicio del sistema**

**Acción:** Estos son servicios normales de Windows, no relacionados con tu aplicación.

### 2.7 Verificación del Backend Express

**Si el puerto 4000 no aparece, verifica:**

```bash
# Verificar en qué puerto está corriendo realmente
# Revisar la salida de npm run dev en la terminal del backend

# O probar ambos puertos
curl http://localhost:3001/health
curl http://localhost:4000/health

# Verificar procesos Node.js corriendo
# En Windows PowerShell:
Get-Process node

# O verificar puertos en uso:
netstat -ano | findstr :3001
netstat -ano | findstr :4000
```

**Si el backend está en puerto 3001:**
- Actualizar todas las referencias en esta guía de puerto 4000 a 3001
- O cambiar el puerto del backend a 4000 en la configuración

### 2.8 Resumen de Hallazgos de Seguridad

**Fortalezas detectadas:**
1. ✅ **Content-Security-Policy** configurado en frontend
2. ✅ **Rate Limiting** funcionando en backend (1000 req/15min)
3. ✅ **Strict-Transport-Security** presente
4. ✅ **X-Frame-Options** configurado (previene clickjacking)
5. ✅ **X-Content-Type-Options: nosniff** (previene MIME sniffing)
6. ✅ **Cross-Origin-Opener-Policy** configurado

**Áreas de mejora identificadas:**
1. ⚠️ CSP incluye `'unsafe-eval'` y `'unsafe-inline'` (común en Next.js, pero idealmente remover)
2. ⚠️ Verificar que el backend esté en el puerto esperado (3001 vs 4000)

**Recomendaciones:**
- Documentar estos hallazgos en el reporte
- Las configuraciones de seguridad están bien implementadas
- El rate limiting está funcionando correctamente

---

## 3. Burp Suite - Análisis de Aplicación Web

### 3.1 Instalación

**Paso 1: Descargar Burp Suite Community**
1. Ir a: https://portswigger.net/burp/communitydownload
2. Descargar versión para Windows
3. Ejecutar instalador
4. Abrir Burp Suite Community Edition

**Paso 2: Configuración Inicial**
1. Al abrir, elegir "Temporary project"
2. Click en "Next" → "Start Burp"

### 3.2 Configurar Proxy

**Paso 1: Configurar Navegador**

**Para Chrome/Edge:**
1. Instalar extensión: "FoxyProxy" o "Proxy SwitchOmega"
2. O configurar manualmente:
   - Settings → Network → Proxy
   - Manual proxy: 127.0.0.1:8080

**Para Firefox:**
1. Settings → Network Settings
2. Manual proxy configuration
3. HTTP Proxy: 127.0.0.1, Port: 8080
4. Marcar "Use this proxy server for all protocols"

**Paso 2: Instalar Certificado CA de Burp**

1. En Burp Suite, ir a: **Proxy → Options**
2. Scroll hasta "Proxy Listeners"
3. Click en "Import / export CA certificate"
4. Exportar en formato "Certificate in DER format"
5. Guardar como `burp-cert.der`

**Para Chrome:**
1. Abrir: chrome://settings/certificates
2. Tab "Authorities"
3. Click "Import"
4. Seleccionar `burp-cert.der`
5. Marcar "Trust this certificate for identifying websites"

**Para Firefox:**
1. Settings → Privacy & Security → Certificates
2. View Certificates → Authorities → Import
3. Seleccionar `burp-cert.der`
4. Marcar todas las opciones de confianza

**Paso 3: Verificar que funciona**

1. En Burp, ir a **Proxy → Intercept**
2. Asegurarse que "Intercept is on" está activado
3. En navegador, visitar http://localhost:3000
4. Deberías ver la petición interceptada en Burp

### 3.3 Interceptar Tráfico

**Paso 1: Interceptar petición de login**

1. En Burp, **Proxy → Intercept** → Activar intercept
2. En navegador, ir a http://localhost:3000/login
3. Llenar formulario de login
4. Click "Login"
5. La petición aparecerá en Burp

**Paso 2: Analizar petición interceptada**

En la petición interceptada verás:
- **Raw**: Petición HTTP completa
- **Params**: Parámetros de la petición
- **Headers**: Headers HTTP
- **Hex**: Vista hexadecimal

**Ejemplo de petición de login:**
```http
POST /auth/v1/token?grant_type=password HTTP/1.1
Host: [tu-supabase-url].supabase.co
Content-Type: application/json

{
  "email": "test@test.com",
  "password": "password123"
}
```

**Paso 3: Modificar petición (opcional para pruebas)**

1. En la petición interceptada, modificar valores
2. Ejemplo: Cambiar email a `admin@test.com`
3. Click "Forward" para enviar petición modificada

### 3.4 Análisis con Burp Repeater

**Paso 1: Enviar petición a Repeater**

1. En **Proxy → HTTP history**, encontrar petición interesante
2. Click derecho → "Send to Repeater"
3. Ir a tab **Repeater**

**Paso 2: Modificar y reenviar peticiones**

1. Modificar parámetros en la petición
2. Click "Send"
3. Ver respuesta en panel derecho

**Ejemplo: Probar endpoint sin autenticación**
```http
GET /api/courses HTTP/1.1
Host: localhost:3000
```

**Modificar para probar con token:**
```http
GET /api/courses HTTP/1.1
Host: localhost:3000
Authorization: Bearer [TU_TOKEN_AQUI]
```

### 3.5 Análisis con Burp Intruder (Fuzzing)

**Paso 1: Configurar ataque**

1. En **Proxy → HTTP history**, encontrar petición
2. Click derecho → "Send to Intruder"
3. Ir a tab **Intruder**

**Paso 2: Definir posiciones de ataque**

1. En la petición, seleccionar valor a fuzzear
2. Click "Add §" para marcar posición
3. Ejemplo: Fuzzear parámetro `search`:
```http
GET /api/courses?search=§test§ HTTP/1.1
```

**Paso 3: Configurar payloads**

1. Ir a tab **Payloads**
2. Payload set: 1
3. Payload type: "Simple list"
4. Agregar payloads en la lista:
   ```
   test
   admin
   <script>alert('XSS')</script>
   ' OR '1'='1
   ../../etc/passwd
   ```

**Paso 4: Ejecutar ataque**

1. Click "Start attack"
2. Ver resultados en nueva ventana
3. Analizar respuestas para encontrar vulnerabilidades

### 3.6 Análisis del Sitemap

**Paso 1: Explorar aplicación**

1. Con intercept desactivado, navegar por la aplicación
2. Visitar diferentes páginas:
   - `/` (home)
   - `/login`
   - `/register`
   - `/courses`
   - `/admin/*` (si tienes acceso)
   - `/business-panel/*`

**Paso 2: Revisar sitemap**

1. En Burp, ir a **Target → Site map**
2. Ver árbol completo de rutas descubiertas
3. Analizar:
   - Rutas públicas vs protegidas
   - Endpoints de API
   - Archivos estáticos

**Paso 3: Filtrar por tipo**

En sitemap, puedes filtrar por:
- Método HTTP (GET, POST, etc.)
- Status code (200, 401, 403, etc.)
- MIME type

### 3.7 Escaneo Activo (Solo Professional, pero podemos simular)

**Nota:** El escaneo activo completo está en versión Professional, pero podemos hacer escaneo manual.

**Paso 1: Activar escaneo pasivo**

1. **Proxy → HTTP history**
2. Navegar por la aplicación
3. Burp automáticamente detecta algunas vulnerabilidades pasivamente

**Paso 2: Revisar issues encontrados**

1. Ir a **Target → Site map**
2. Click en cualquier URL
3. Tab "Issues" muestra problemas detectados

### 3.8 Exportar Resultados

**Paso 1: Exportar HTTP history**

1. **Proxy → HTTP history**
2. Seleccionar peticiones relevantes
3. Click derecho → "Save selected items"
4. Guardar como archivo `.har` o texto

**Paso 2: Generar reporte**

1. **Target → Site map**
2. Click derecho en el sitio → "Engagement tools → Generate scan report"
3. (Solo Professional) O exportar manualmente los issues encontrados

---

## 4. OWASP ZAP - Escaneo Automatizado

### 4.1 Instalación

**Paso 1: Descargar OWASP ZAP**
1. Ir a: https://www.zaproxy.org/download/
2. Descargar versión para Windows (instalador)
3. Ejecutar instalador
4. Abrir OWASP ZAP

**Paso 2: Configuración Inicial**
1. Al abrir, elegir "I don't want to persist this session"
2. Click "Start"

### 4.2 Escaneo Automático Básico

**Paso 1: Quick Start**

1. En la ventana principal, tab "Quick Start"
2. Ingresar URL: `http://localhost:3000`
3. Click "Attack"
4. ZAP comenzará a escanear automáticamente

**Paso 2: Monitorear progreso**

- Ver progreso en tab "Active Scan"
- Ver peticiones en tab "History"
- Ver alertas en tab "Alerts"

**Paso 3: Esperar a que termine**

- El escaneo puede tardar varios minutos
- No cerrar ZAP durante el escaneo

### 4.3 Escaneo Manual (Más Control)

**Paso 1: Explorar sitio manualmente**

1. Tab "Manual Explore"
2. URL: `http://localhost:3000`
3. Click "Launch Browser"
4. Se abrirá navegador controlado por ZAP
5. Navegar por la aplicación normalmente

**Paso 2: Iniciar escaneo activo**

1. Después de explorar, ir a **Sites** (panel izquierdo)
2. Expandir `http://localhost:3000`
3. Click derecho → "Attack → Active Scan"
4. Configurar opciones:
   - **Scope**: Solo el sitio seleccionado
   - **Policy**: Default (o crear una personalizada)
5. Click "Start Scan"

### 4.4 Configurar Contexto de Autenticación

**Paso 1: Crear contexto autenticado**

1. **File → New Session** (si es necesario)
2. **Tools → Authentication**
3. Click en "New" para crear contexto

**Paso 2: Configurar login**

1. **Login URL**: `http://localhost:3000/login`
2. **Username parameter**: `email`
3. **Password parameter**: `password`
4. **Logged in indicator**: Texto que aparece después de login (ej: "Dashboard")

**Paso 3: Configurar método de autenticación**

1. **Authentication Method**: "Form-based Authentication"
2. **Login request URL**: URL donde se envía el formulario
3. **Request body**: 
   ```json
   {
     "email": "{{username}}",
     "password": "{{password}}"
   }
   ```

**Paso 4: Usar contexto en escaneo**

1. Al iniciar escaneo activo, seleccionar el contexto creado
2. ZAP se autenticará automáticamente durante el escaneo

### 4.5 Analizar Resultados

**Paso 1: Revisar Alertas**

1. Tab **Alerts**
2. Ver lista de vulnerabilidades encontradas
3. Clasificadas por riesgo:
   - 🔴 High
   - 🟠 Medium
   - 🟡 Low
   - 🔵 Informational

**Paso 2: Analizar alerta específica**

1. Click en una alerta
2. Ver detalles:
   - **Description**: Qué es la vulnerabilidad
   - **Risk**: Nivel de riesgo
   - **Request**: Petición que la causó
   - **Response**: Respuesta del servidor
   - **Solution**: Cómo solucionarlo

**Paso 3: Verificar falsos positivos**

- No todas las alertas son vulnerabilidades reales
- Revisar cada una manualmente
- Probar manualmente si es necesario

### 4.6 Generar Reporte

**Paso 1: Exportar reporte**

1. **Report → Generate HTML Report**
2. Elegir ubicación y nombre
3. Click "Generate"

**Paso 2: Revisar reporte**

El reporte incluye:
- Resumen ejecutivo
- Lista de vulnerabilidades
- Detalles técnicos
- Recomendaciones

**Paso 3: Exportar en otros formatos**

- **Report → Export Report**: JSON, XML, etc.

---

## 5. Postman - Testing de APIs

### 5.1 Instalación

**Paso 1: Descargar Postman**
1. Ir a: https://www.postman.com/downloads/
2. Descargar para Windows
3. Instalar y crear cuenta (gratis)

### 5.2 Configurar Workspace

**Paso 1: Crear nueva colección**

1. Click "New" → "Collection"
2. Nombre: "Aprende-y-Aplica Security Testing"
3. Click "Create"

### 5.3 Probar Endpoints del Backend Express

**Paso 1: Health Check**

1. Click "New" → "HTTP Request"
2. Método: **GET**
3. URL: `http://localhost:4000/health`
4. Click "Send"
5. Verificar respuesta 200 OK

**Paso 2: Probar endpoint sin autenticación**

1. Nueva request: **GET** `http://localhost:4000/api/v1/users`
2. Click "Send"
3. **Resultado esperado**: 401 Unauthorized (debe rechazar)

**Paso 3: Obtener token JWT**

**Opción A: Desde login de la aplicación**
1. Hacer login en navegador
2. Abrir DevTools → Application → Cookies
3. Copiar valor de cookie de sesión o token

**Opción B: Login mediante API**
1. Nueva request: **POST** `http://localhost:3000/api/auth/login`
2. Body (raw JSON):
   ```json
   {
     "email": "test@test.com",
     "password": "password123"
   }
   ```
3. Click "Send"
4. Copiar token de la respuesta

**Paso 4: Configurar autenticación en Postman**

1. En la colección, click en tab "Authorization"
2. Type: "Bearer Token"
3. Token: [Pegar tu token JWT]
4. Esto aplicará a todas las requests de la colección

**Paso 5: Probar endpoints protegidos**

1. Nueva request: **GET** `http://localhost:4000/api/v1/users`
2. Verificar que Authorization header se agregó automáticamente
3. Click "Send"
4. **Resultado esperado**: 200 OK con datos (si tienes permisos)

### 5.4 Probar Endpoints de Next.js API Routes

**Paso 1: Probar API route pública**

1. Nueva request: **GET** `http://localhost:3000/api/courses`
2. Click "Send"
3. Verificar respuesta

**Paso 2: Probar con autenticación**

1. Agregar header manualmente:
   - Key: `Authorization`
   - Value: `Bearer [TU_TOKEN]`
2. O usar la configuración de la colección

### 5.5 Testing de Validación de Entrada

**Paso 1: Probar SQL Injection**

1. Nueva request: **GET** `http://localhost:3000/api/courses?search=test' OR '1'='1`
2. Click "Send"
3. **Resultado esperado**: 400 Bad Request o respuesta normal (no datos inesperados)

**Paso 2: Probar XSS**

1. Nueva request: **GET** `http://localhost:3000/api/courses?search=<script>alert('XSS')</script>`
2. Click "Send"
3. Verificar que el script no se ejecuta (debe estar sanitizado)

**Paso 3: Probar Command Injection**

1. Nueva request: **POST** `http://localhost:4000/api/v1/some-endpoint`
2. Body:
   ```json
   {
     "command": "test; whoami"
   }
   ```
3. Verificar que no se ejecuta comando

### 5.6 Testing de Rate Limiting

**Paso 1: Crear script de prueba**

1. En Postman, ir a **Tests** tab de una request
2. Agregar script para contar requests:
   ```javascript
   if (pm.response.code === 429) {
       console.log("Rate limit alcanzado!");
   }
   ```

**Paso 2: Usar Collection Runner**

1. Click en la colección → "Run"
2. Seleccionar requests a ejecutar
3. **Iterations**: 1001 (para probar rate limit de 1000)
4. Click "Run"
5. Verificar que después de 1000 requests, se recibe 429

**Alternativa: Usar script externo**
```bash
# Script simple para probar rate limiting
for i in {1..1001}; do
  curl http://localhost:4000/api/v1/users
  echo "Request $i"
done
```

### 5.7 Exportar y Compartir

**Paso 1: Exportar colección**

1. Click en colección → "..." → "Export"
2. Elegir formato (Collection v2.1)
3. Guardar archivo JSON

**Paso 2: Importar en otro Postman**

1. Click "Import"
2. Seleccionar archivo exportado
3. Colección se importará completa

---

## 6. JWT_Tool / jwt.io - Análisis de Tokens

### 6.1 Usar jwt.io (Más Fácil)

**Paso 1: Obtener token JWT**

1. Hacer login en la aplicación
2. Abrir DevTools → Application → Cookies
3. Buscar cookie con token o session
4. Copiar valor

**Paso 2: Analizar en jwt.io**

1. Ir a: https://jwt.io
2. Pegar token en sección "Encoded"
3. Ver decodificación automática:
   - **Header**: Algoritmo usado
   - **Payload**: Datos del token (userId, role, exp, etc.)
   - **Signature**: Firma (no se puede verificar sin secret)

**Paso 3: Analizar contenido**

Buscar en el payload:
- `exp`: Fecha de expiración
- `iat`: Fecha de emisión
- `role`: Rol del usuario
- `userId` o `sub`: ID del usuario
- `fingerprint`: Si está presente

**Ejemplo de payload:**
```json
{
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "role": "business_user",
  "exp": 1735689600,
  "iat": 1735603200,
  "fingerprint": "abc123..."
}
```

**Paso 4: Intentar modificar (solo para pruebas)**

1. Modificar el payload (ej: cambiar `role` a `admin`)
2. **Nota**: La firma cambiará y el token será inválido
3. Esto demuestra que la aplicación valida la firma

### 6.2 Usar JWT_Tool (Más Avanzado)

**Paso 1: Instalación**

```bash
# Requiere Python
pip install jwt-tool
```

**Paso 2: Analizar token**

```bash
# Analizar token básico
python jwt_tool.py [TU_TOKEN_JWT]

# Analizar con más detalle
python jwt_tool.py [TU_TOKEN_JWT] -C
```

**Paso 3: Intentar algoritmos débiles**

```bash
# Intentar algoritmo "none" (sin verificación)
python jwt_tool.py [TU_TOKEN_JWT] -X n

# Intentar HS256 con secret débil
python jwt_tool.py [TU_TOKEN_JWT] -C -d wordlist.txt
```

**Paso 4: Modificar token**

```bash
# Modificar claims
python jwt_tool.py [TU_TOKEN_JWT] -T

# Esto te permitirá modificar el payload
# Luego intentar usar el token modificado
```

**Paso 5: Probar token modificado**

1. Copiar token modificado
2. Usar en Postman o Burp Suite
3. Verificar si la aplicación lo acepta o rechaza

### 6.3 Verificar Validación en la Aplicación

**Paso 1: Probar token expirado**

1. Modificar `exp` en jwt.io a una fecha pasada
2. Copiar token (aunque la firma será inválida)
3. Intentar usar en una petición
4. **Resultado esperado**: 401 Unauthorized

**Paso 2: Probar token con rol modificado**

1. Si logras modificar el token y que la firma sea válida (muy difícil sin el secret)
2. Cambiar `role` a `admin`
3. Intentar acceder a `/admin/*`
4. **Resultado esperado**: La aplicación debe validar en BD y rechazar

**Paso 3: Verificar validación de fingerprint**

1. Obtener token de un dispositivo
2. Usar ese token desde otro dispositivo/IP
3. **Resultado esperado**: 401 si la app valida fingerprint

---

## 7. npm audit - Auditoría de Dependencias

### 7.1 Ejecutar Auditoría

**Paso 1: Auditoría del Frontend**

```bash
# Navegar a carpeta del frontend
cd apps/web

# Ejecutar auditoría
npm audit

# Ver solo vulnerabilidades críticas
npm audit --audit-level=high
```

**Paso 2: Interpretar resultados**

Ejemplo de salida:
```
# npm audit report

High            Prototype Pollution
Package         lodash
Patched in      >=4.17.12
Dependency of   @aprende-y-aplica/web
Path            @aprende-y-aplica/web > lodash
More info       https://npmjs.com/advisories/782
```

**Información importante:**
- **Severidad**: Low, Moderate, High, Critical
- **Paquete**: Nombre del paquete vulnerable
- **Patched in**: Versión que corrige el problema
- **Path**: Dependencia que introduce la vulnerabilidad

**Paso 3: Auditoría del Backend**

```bash
# Navegar a carpeta del backend
cd apps/api

# Ejecutar auditoría
npm audit
```

### 7.2 Intentar Corregir Automáticamente

**Paso 1: Fix automático**

```bash
# Intentar corregir automáticamente
npm audit fix

# Forzar correcciones (puede romper compatibilidad)
npm audit fix --force
```

**Paso 2: Verificar cambios**

```bash
# Ver qué se actualizó
git diff package.json package-lock.json

# Probar que la aplicación sigue funcionando
npm run dev
```

**Paso 3: Si hay problemas**

```bash
# Revertir cambios
git checkout package.json package-lock.json
npm install
```

### 7.3 Análisis Detallado

**Paso 1: Ver detalles de vulnerabilidad específica**

```bash
# Ver detalles de una vulnerabilidad
npm audit [ID_DE_VULNERABILIDAD]
```

**Paso 2: Exportar reporte**

```bash
# Exportar en formato JSON
npm audit --json > audit-report.json

# Exportar en formato legible
npm audit > audit-report.txt
```

### 7.4 Usar Snyk (Alternativa más completa)

**Paso 1: Instalación**

```bash
npm install -g snyk
```

**Paso 2: Autenticarse**

```bash
snyk auth
# Abrirá navegador para login
```

**Paso 3: Test de vulnerabilidades**

```bash
# En carpeta del frontend
cd apps/web
snyk test

# En carpeta del backend
cd apps/api
snyk test
```

**Paso 4: Monitoreo continuo**

```bash
# Configurar monitoreo
snyk monitor

# Esto enviará reportes a tu cuenta de Snyk
```

---

## 8. ffuf - Fuzzing de Endpoints

### 8.1 Instalación

**Windows:**
1. Descargar: https://github.com/ffuf/ffuf/releases
2. Descargar `ffuf_X.X.X_windows_amd64.zip`
3. Extraer `ffuf.exe`
4. Agregar al PATH o usar desde carpeta

**Verificar:**
```bash
ffuf -h
```

### 8.2 Fuzzing de Directorios

**Paso 1: Fuzzing básico**

```bash
# Fuzzing de directorios en el frontend
ffuf -w wordlist.txt -u http://localhost:3000/FUZZ

# Fuzzing de API routes
ffuf -w wordlist.txt -u http://localhost:3000/api/FUZZ
```

**Paso 2: Obtener wordlist**

**Opción A: Usar wordlist incluida (si tienes Kali/WSL)**
```bash
# Wordlist común de dirbuster
ffuf -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt -u http://localhost:3000/FUZZ
```

**Opción B: Crear wordlist simple**
Crear archivo `wordlist.txt`:
```
admin
api
auth
login
register
courses
users
dashboard
config
backup
test
```

**Paso 3: Filtrar resultados**

```bash
# Solo mostrar códigos 200
ffuf -w wordlist.txt -u http://localhost:3000/FUZZ -fc 404

# Excluir códigos específicos
ffuf -w wordlist.txt -u http://localhost:3000/FUZZ -fc 404,403
```

### 8.3 Fuzzing de Parámetros

**Paso 1: Fuzzing de query parameters**

```bash
# Fuzzing de parámetro de búsqueda
ffuf -w wordlist.txt -u "http://localhost:3000/api/courses?search=FUZZ"

# Fuzzing de múltiples parámetros
ffuf -w wordlist.txt -u "http://localhost:3000/api/courses?param1=FUZZ&param2=test"
```

**Paso 2: Fuzzing de POST data**

```bash
# Crear archivo con payloads
# payloads.txt:
test
admin
<script>alert('XSS')</script>
' OR '1'='1

# Fuzzing en body
ffuf -w payloads.txt -X POST -d "search=FUZZ" -H "Content-Type: application/json" -u http://localhost:3000/api/courses
```

### 8.4 Fuzzing Avanzado

**Paso 1: Con autenticación**

```bash
# Agregar header de autorización
ffuf -w wordlist.txt -u http://localhost:3000/api/FUZZ -H "Authorization: Bearer [TU_TOKEN]"
```

**Paso 2: Rate limiting**

```bash
# Limitar velocidad (evitar sobrecargar servidor)
ffuf -w wordlist.txt -u http://localhost:3000/FUZZ -rate 10
```

**Paso 3: Guardar resultados**

```bash
# Guardar en formato JSON
ffuf -w wordlist.txt -u http://localhost:3000/FUZZ -o results.json -of json

# Guardar en formato CSV
ffuf -w wordlist.txt -u http://localhost:3000/FUZZ -o results.csv -of csv
```

### 8.5 Interpretar Resultados

**Qué buscar:**
- Códigos 200: Endpoints encontrados
- Códigos 401/403: Endpoints protegidos (interesantes)
- Códigos 500: Errores del servidor (posibles vulnerabilidades)
- Tamaños de respuesta diferentes: Pueden indicar contenido diferente

**Ejemplo de salida:**
```
[Status: 200, Size: 1234, Words: 234, Lines: 45] http://localhost:3000/api/admin
[Status: 401, Size: 123, Words: 12, Lines: 1] http://localhost:3000/api/users
[Status: 404, Size: 234, Words: 45, Lines: 2] http://localhost:3000/api/test
```

---

## 9. Análisis Manual de Código

### 9.1 Buscar Vulnerabilidades Comunes

**Paso 1: Buscar SQL Injection**

```bash
# Buscar concatenación de strings en queries
# En carpeta del proyecto
grep -r "\.query(" apps/
grep -r "\.execute(" apps/
grep -r "\$\{" apps/ | grep -i "sql\|query"

# Buscar en código TypeScript/JavaScript
grep -r "SELECT.*\+" apps/
grep -r "INSERT.*\+" apps/
```

**Paso 2: Buscar XSS**

```bash
# Buscar dangerouslySetInnerHTML
grep -r "dangerouslySetInnerHTML" apps/web

# Buscar innerHTML
grep -r "innerHTML" apps/web

# Buscar eval (muy peligroso)
grep -r "eval(" apps/
```

**Paso 3: Buscar Command Injection**

```bash
# Buscar exec, spawn, etc.
grep -r "exec(" apps/
grep -r "spawn(" apps/
grep -r "child_process" apps/
```

**Paso 4: Buscar Hardcoded Secrets**

```bash
# Buscar posibles secrets en código
grep -r "password.*=" apps/ | grep -v "password_hash"
grep -r "api.*key.*=" apps/
grep -r "secret.*=" apps/
grep -r "token.*=" apps/ | grep -v "process.env"
```

### 9.2 Revisar Configuraciones

**Paso 1: Revisar next.config.ts**

```bash
# Ver configuración de Next.js
cat apps/web/next.config.ts

# Buscar configuraciones inseguras
grep -i "ignoreBuildErrors\|ignoreTypeScriptErrors" apps/web/next.config.ts
```

**Paso 2: Revisar variables de entorno**

```bash
# Ver archivos .env.example (no .env real, que no debe estar en repo)
cat apps/web/.env.example
cat apps/api/.env.example

# Verificar que no haya .env en el repositorio
find . -name ".env" -not -path "*/node_modules/*"
```

**Paso 3: Revisar middleware de autenticación**

```bash
# Ver middleware de Next.js
cat apps/web/src/middleware.ts

# Ver middleware de Express
cat apps/api/src/middlewares/auth.ts
```

### 9.3 Usar Semgrep (Análisis Estático Automatizado)

**Paso 1: Instalación**

```bash
# Instalar Semgrep
pip install semgrep
```

**Paso 2: Ejecutar escaneo**

```bash
# Escaneo básico con reglas automáticas
cd apps/web
semgrep --config=auto .

# Escaneo del backend
cd apps/api
semgrep --config=auto .
```

**Paso 3: Reglas específicas**

```bash
# Escaneo con reglas de OWASP
semgrep --config=p/owasp-top-ten .

# Escaneo con reglas de Next.js
semgrep --config=p/nextjs .
```

**Paso 4: Exportar resultados**

```bash
# Exportar en JSON
semgrep --config=auto . --json -o results.json

# Exportar en formato legible
semgrep --config=auto . > results.txt
```

---

## 10. Interpretación de Resultados

### 10.1 Clasificación de Vulnerabilidades

**Crítica (Critical):**
- Permite acceso no autorizado completo
- Ejemplo: SQL Injection que permite acceso a BD completa
- **Acción**: Corregir inmediatamente

**Alta (High):**
- Permite acceso limitado no autorizado
- Ejemplo: XSS que permite robo de sesión
- **Acción**: Corregir en 24-48 horas

**Media (Medium):**
- Puede llevar a vulnerabilidades más serias
- Ejemplo: Información sensible expuesta en errores
- **Acción**: Corregir en 1 semana

**Baja (Low):**
- Impacto limitado
- Ejemplo: Headers de seguridad faltantes
- **Acción**: Corregir en próximo release

### 10.2 Falsos Positivos

**Cómo identificar:**
- La herramienta reporta vulnerabilidad pero al probar manualmente no funciona
- Ejemplo: ZAP reporta XSS pero el input está sanitizado
- **Acción**: Verificar manualmente, documentar como falso positivo

### 10.3 Documentar Hallazgos

**Template para cada vulnerabilidad:**

```
Vulnerabilidad: [Nombre]
Severidad: [Critical/High/Medium/Low]
Ubicación: [Archivo/Endpoint]
Descripción: [Qué es]
Impacto: [Qué permite hacer]
Evidencia: [Screenshot/comando/log]
Recomendación: [Cómo corregir]
Estado: [Encontrada/Corregida/En proceso]
```

### 10.4 Priorización

**Orden de corrección:**
1. Vulnerabilidades críticas que permiten acceso no autorizado
2. Vulnerabilidades que exponen datos sensibles
3. Vulnerabilidades de configuración
4. Mejoras de seguridad generales

---

## Apéndice: Comandos Rápidos de Referencia

### Iniciar Aplicación
```bash
# Terminal 1 - Frontend
cd apps/web && npm run dev

# Terminal 2 - Backend
cd apps/api && npm run dev
```

### Verificar que está corriendo
```bash
# Frontend
curl http://localhost:3000

# Backend
curl http://localhost:4000/health
```

### Obtener Token JWT
```bash
# Login y capturar token desde DevTools
# O usar Postman para hacer login y copiar token
```

### Comandos de Herramientas
```bash
# Nmap
nmap -sV localhost -p 3000,4000

# npm audit
cd apps/web && npm audit
cd apps/api && npm audit

# ffuf
ffuf -w wordlist.txt -u http://localhost:3000/FUZZ

# Semgrep
semgrep --config=auto .
```

---

## Notas Finales

- **Siempre probar en entorno de desarrollo**, nunca en producción
- **Documentar todo**: Screenshots, comandos, resultados
- **Verificar manualmente**: No confiar solo en herramientas automatizadas
- **No hacer cambios destructivos**: Solo pruebas de lectura cuando sea posible
- **Respetar rate limits**: No sobrecargar el servidor local

---

*Guía práctica para pruebas de seguridad en Aprende-y-Aplica*
*Entorno: Localhost - Desarrollo*

