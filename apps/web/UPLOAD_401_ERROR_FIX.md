# Corrección de Error 401 en Upload de Archivos

## ✅ **Problema Identificado y Solucionado**

### 🐛 **Error Principal**
```
Error 401: Unauthorized
POST /api/profile/upload-picture 401
```

### 🔍 **Causa del Error**
- Las APIs de upload no podían autenticar al usuario
- Las cookies de Supabase no se estaban enviando correctamente
- Falta de token de autorización en las requests

## 🛠️ **Correcciones Implementadas**

### **1. Autenticación Dual en APIs**

#### **Estrategia de Autenticación**
```typescript
// 1. Intentar con cookies primero
let { data: { user }, error: userError } = await supabase.auth.getUser()

// 2. Si falla, intentar con header de autorización
if (userError || !user) {
  const authHeader = request.headers.get('authorization')
  if (authHeader) {
    const { data: { user: headerUser }, error: headerError } = 
      await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    user = headerUser
    userError = headerError
  }
}
```

### **2. Hook useProfile Mejorado**

#### **Obtención de Token de Sesión**
```typescript
// Obtener el token de Supabase
const supabase = createClient()
const { data: { session } } = await supabase.auth.getSession()

if (!session?.access_token) {
  throw new Error('No hay sesión activa')
}
```

#### **Request con Autorización**
```typescript
const response = await fetch('/api/profile/upload-picture', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${session.access_token}`
  },
  credentials: 'include', // Fallback con cookies
  body: formData
})
```

### **3. APIs Actualizadas**

#### **Upload de Foto de Perfil** (`/api/profile/upload-picture`)
- ✅ **Autenticación dual** - Cookies + Authorization header
- ✅ **Logging mejorado** - Errores de auth más claros
- ✅ **Fallback robusto** - Múltiples métodos de auth

#### **Upload de Curriculum** (`/api/profile/upload-curriculum`)
- ✅ **Autenticación dual** - Cookies + Authorization header
- ✅ **Logging mejorado** - Errores de auth más claros
- ✅ **Fallback robusto** - Múltiples métodos de auth

## 🎯 **Beneficios de la Corrección**

### **Autenticación Robusta**
- ✅ **Múltiples métodos** - Cookies y Authorization header
- ✅ **Fallback automático** - Si uno falla, prueba el otro
- ✅ **Sesión verificada** - Token válido requerido
- ✅ **Error handling** - Mensajes claros de error

### **Compatibilidad Mejorada**
- ✅ **Cookies tradicionales** - Funciona con navegadores estándar
- ✅ **Authorization header** - Compatible con APIs modernas
- ✅ **Credentials include** - Envía cookies automáticamente
- ✅ **Token de sesión** - Usa el token actual de Supabase

### **Debugging Mejorado**
- ✅ **Logs detallados** - Errores de auth específicos
- ✅ **Verificación de sesión** - Confirma que hay sesión activa
- ✅ **Múltiples intentos** - Prueba diferentes métodos de auth
- ✅ **Error messages** - Mensajes claros para el usuario

## 🔧 **Configuración Técnica**

### **Flujo de Autenticación**
```typescript
// 1. Cliente obtiene token de sesión
const { data: { session } } = await supabase.auth.getSession()

// 2. Cliente envía request con token
fetch('/api/upload', {
  headers: { 'Authorization': `Bearer ${session.access_token}` },
  credentials: 'include'
})

// 3. API verifica con cookies primero
let user = await supabase.auth.getUser()

// 4. Si falla, verifica con token
if (!user) {
  user = await supabase.auth.getUser(token)
}
```

### **Manejo de Errores**
```typescript
// Verificación de sesión
if (!session?.access_token) {
  throw new Error('No hay sesión activa')
}

// Verificación en API
if (userError || !user) {
  console.error('Auth error:', userError)
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

## 🚀 **Cómo Probar**

### **1. Verificar Autenticación**
1. Ve a la página de perfil
2. Abre las herramientas de desarrollador
3. Ve a la pestaña Network
4. Intenta subir una imagen
5. Verifica que la request incluye el header `Authorization`

### **2. Verificar Upload**
1. Selecciona una imagen válida (JPG/PNG/WebP)
2. Haz click en el botón de upload
3. La imagen debería subirse sin errores 401
4. La foto debería aparecer en el perfil

### **3. Verificar Logs**
1. Revisa la consola del navegador
2. No debería haber errores 401
3. Revisa los logs del servidor
4. Debería mostrar autenticación exitosa

## 🐛 **Troubleshooting**

### **Aún hay error 401**
- Verifica que el usuario esté autenticado
- Revisa que la sesión de Supabase esté activa
- Confirma que los buckets de Supabase estén configurados
- Verifica las políticas RLS

### **Token no válido**
- La sesión puede haber expirado
- Intenta hacer logout y login nuevamente
- Verifica que las variables de entorno estén correctas

### **Cookies no funcionan**
- Verifica que el dominio sea correcto
- Confirma que las cookies no estén bloqueadas
- Revisa la configuración de CORS

## ✨ **Mejores Prácticas Implementadas**

- ✅ **Autenticación dual** - Múltiples métodos de verificación
- ✅ **Error handling robusto** - Manejo completo de errores
- ✅ **Logging detallado** - Debugging más fácil
- ✅ **Fallback automático** - Resiliencia ante fallos
- ✅ **Validación de sesión** - Verificación previa de autenticación
- ✅ **Headers correctos** - Authorization + credentials

¡El error 401 en upload de archivos ha sido solucionado con una estrategia de autenticación robusta! 🎉
