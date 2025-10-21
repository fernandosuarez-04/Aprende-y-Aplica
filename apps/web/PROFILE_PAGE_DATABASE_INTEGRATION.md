# Integración de Página de Perfil con Base de Datos

## ✅ **Problema Resuelto**

### 🐛 **Problema Principal**
- La página de perfil no mostraba la imagen real del usuario desde la base de datos
- El hook `useProfile` estaba usando datos mock como fallback
- No se estaba consultando directamente la tabla `users` para obtener `profile_picture_url`

## 🛠️ **Solución Implementada**

### **1. Actualización del Hook useProfile**

#### **Consulta Directa a la Base de Datos**
```typescript
// apps/web/src/features/profile/hooks/useProfile.ts
const fetchProfile = useCallback(async () => {
  if (!user?.id) {
    setProfile(null)
    setLoading(false)
    return
  }

  try {
    setLoading(true)
    setError(null)
    
    // Consultar directamente la base de datos
    const supabase = createClient()
    
    const { data, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single() as { data: Database['public']['Tables']['users']['Row'] | null, error: any }

    if (fetchError || !data) {
      console.error('Error fetching user profile:', fetchError)
      throw new Error(`Error al obtener perfil: ${fetchError?.message || 'No data found'}`)
    }

    // Convertir los datos de la base de datos al formato esperado
    const profileData: UserProfile = {
      id: data.id,
      username: data.username || 'usuario',
      email: data.email || 'usuario@ejemplo.com',
      first_name: data.first_name || '',
      last_name: data.last_name || '',
      display_name: data.display_name || data.first_name || 'Usuario',
      phone: data.phone || data.phone_number || '',
      bio: data.bio || '',
      location: data.location || '',
      cargo_rol: data.cargo_rol || '',
      type_rol: '', // Campo no existe en la base de datos
      profile_picture_url: data.profile_picture_url || '', // ✅ Imagen real
      curriculum_url: data.curriculum_url || '',
      linkedin_url: data.linkedin_url || '',
      github_url: data.github_url || '',
      website_url: data.website_url || '',
      country_code: data.country_code || '',
      points: data.points || 0,
      created_at: data.created_at,
      last_login_at: data.last_login_at || '',
      email_verified: data.email_verified || false
    }
    
    setProfile(profileData)
    console.log('🔍 Profile data loaded:', profileData)
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
    setError(errorMessage)
    console.error('Error fetching profile:', err)
  } finally {
    setLoading(false)
  }
}, [user?.id])
```

### **2. Actualización de la Función updateProfile**

#### **Actualización Directa en la Base de Datos**
```typescript
const updateProfile = useCallback(async (updates: UpdateProfileRequest) => {
  if (!user?.id) {
    throw new Error('Usuario no autenticado')
  }

  try {
    setSaving(true)
    setError(null)
    
    // Actualizar directamente en la base de datos
    const supabase = createClient()
    
    const { data, error: updateError } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', user.id)
      .select('*')
      .single() as { data: Database['public']['Tables']['users']['Row'] | null, error: any }

    if (updateError || !data) {
      console.error('Error updating profile:', updateError)
      throw new Error(`Error al actualizar perfil: ${updateError?.message || 'No data found'}`)
    }

    // Convertir los datos actualizados al formato esperado
    const updatedProfileData: UserProfile = {
      // ... mapeo de datos similar al fetchProfile
      profile_picture_url: data.profile_picture_url || '', // ✅ Imagen actualizada
      // ... otros campos
    }
    
    setProfile(updatedProfileData)
    
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
    setError(errorMessage)
    console.error('Error updating profile:', err)
    throw err
  } finally {
    setSaving(false)
  }
}, [user?.id])
```

### **3. Tipos de Supabase Actualizados**

#### **Import de Tipos**
```typescript
import type { Database } from '../../../lib/supabase/types'

// Uso de tipos seguros
const { data, error: fetchError } = await supabase
  .from('users')
  .select('*')
  .eq('id', user.id)
  .single() as { data: Database['public']['Tables']['users']['Row'] | null, error: any }
```

### **4. Manejo de Errores Mejorado**

#### **Verificación de Datos Nulos**
```typescript
if (fetchError || !data) {
  console.error('Error fetching user profile:', fetchError)
  throw new Error(`Error al obtener perfil: ${fetchError?.message || 'No data found'}`)
}
```

#### **Logging de Debug**
```typescript
setProfile(profileData)
console.log('🔍 Profile data loaded:', profileData) // ✅ Debug log
```

## 🎯 **Beneficios de la Implementación**

### **Funcionalidad Completa**
- ✅ **Imagen real del usuario** - Muestra la foto desde `profile_picture_url`
- ✅ **Datos actualizados** - Todos los campos desde la base de datos
- ✅ **Sincronización automática** - Se actualiza cuando cambia el usuario
- ✅ **Fallback elegante** - Icono genérico si no hay imagen

### **Experiencia de Usuario Mejorada**
- ✅ **Consistencia visual** - Misma imagen en navbar y página de perfil
- ✅ **Datos precisos** - Información real de la base de datos
- ✅ **Carga rápida** - Consulta directa sin APIs intermedias
- ✅ **Actualizaciones en tiempo real** - Cambios se reflejan inmediatamente

### **Arquitectura Robusta**
- ✅ **Tipos seguros** - TypeScript con tipos de Supabase
- ✅ **Manejo de errores** - Verificaciones de null y logging
- ✅ **Performance optimizada** - Consulta directa a la base de datos
- ✅ **Mantenibilidad** - Código limpio y bien estructurado

## 🔧 **Cómo Funciona**

### **Flujo de Datos**
1. **Usuario autenticado** → `useAuth` proporciona `user.id`
2. **Hook useProfile** → Consulta la tabla `users` con `user.id`
3. **Datos del perfil** → Obtiene `profile_picture_url` y otros campos
4. **Página de perfil** → Muestra la imagen real del usuario
5. **Actualización automática** → Se refresca cuando cambia el usuario

### **Estructura de Datos**
```typescript
// Datos obtenidos de la base de datos
profile = {
  id: "user-uuid",
  username: "usuario123",
  email: "usuario@ejemplo.com",
  display_name: "Juan Pérez",
  first_name: "Juan",
  last_name: "Pérez",
  profile_picture_url: "https://miwbzotcuaywpdbidpwo.supabase.co/storage/v1/object/public/avatars/profile-pictures/user-uuid-1234567890.jpg",
  curriculum_url: "https://miwbzotcuaywpdbidpwo.supabase.co/storage/v1/object/public/curriculums/user-uuid-cv-1234567890.pdf",
  bio: "Desarrollador de software...",
  location: "Ciudad de México, México",
  cargo_rol: "Desarrollador de Software",
  linkedin_url: "https://linkedin.com/in/juan-perez",
  github_url: "https://github.com/juan-perez",
  website_url: "https://juan-perez.dev",
  country_code: "MX",
  points: 1250,
  created_at: "2024-01-15T10:30:00Z",
  last_login_at: "2024-01-20T15:45:00Z",
  email_verified: true
}
```

## 🚀 **Cómo Probar**

### **1. Verificar en la Consola**
```javascript
// Deberías ver este log:
🔍 Profile data loaded: {id: "...", profile_picture_url: "https://...", ...}
```

### **2. Verificar en la UI**
- **Página de perfil**: Debería mostrar la imagen real del usuario
- **Información**: Todos los campos deberían mostrar datos reales
- **Formularios**: Deberían estar pre-poblados con datos actuales

### **3. Verificar Fallback**
- Si no hay `profile_picture_url`, debería mostrar el icono genérico
- Si hay error en la carga, debería mostrar el icono genérico

### **4. Verificar Actualizaciones**
- Al cambiar datos en el formulario, deberían guardarse en la base de datos
- Al subir una nueva imagen, debería actualizarse inmediatamente

## 🐛 **Troubleshooting**

### **No aparece la imagen**
- Verifica que `profile_picture_url` no sea `null` en la base de datos
- Confirma que la URL de la imagen sea válida
- Revisa la consola para errores de carga de imagen

### **Error en la consola**
- Verifica que el usuario esté autenticado
- Confirma que la tabla `users` tenga la columna `profile_picture_url`
- Revisa los permisos de RLS en Supabase

### **Datos incorrectos**
- Verifica que los datos en la base de datos sean correctos
- Confirma que el hook `useProfile` esté funcionando
- Revisa que no haya errores de TypeScript

### **No se guardan los cambios**
- Verifica que el usuario tenga permisos de escritura
- Confirma que la función `updateProfile` esté funcionando
- Revisa los logs de error en la consola

## ✨ **Mejores Prácticas Implementadas**

- ✅ **Tipos seguros** - TypeScript con tipos de Supabase
- ✅ **Consulta directa** - Sin APIs intermedias para mejor performance
- ✅ **Manejo de errores** - Verificaciones de null y logging apropiado
- ✅ **Debugging efectivo** - Logs para troubleshooting
- ✅ **Consistencia** - Misma lógica que el navbar del dashboard
- ✅ **Fallbacks elegantes** - Iconos genéricos cuando no hay imagen
- ✅ **Actualizaciones en tiempo real** - Cambios se reflejan inmediatamente

## 🔄 **Sincronización con Navbar**

### **Consistencia de Datos**
- ✅ **Misma fuente** - Ambos usan la tabla `users` de Supabase
- ✅ **Misma imagen** - `profile_picture_url` se muestra en ambos lugares
- ✅ **Actualización automática** - Cambios se reflejan en ambos componentes
- ✅ **Fallback consistente** - Mismo icono genérico cuando no hay imagen

### **Arquitectura Unificada**
```typescript
// Navbar (UserDropdown)
const { userProfile } = useUserProfile() // Consulta tabla users
{userProfile?.profile_picture_url ? (
  <img src={userProfile.profile_picture_url} alt="Avatar" />
) : (
  <User className="w-5 h-5 text-white" />
)}

// Página de Perfil
const { profile } = useProfile() // Consulta tabla users
{profile.profile_picture_url ? (
  <img src={profile.profile_picture_url} alt="Profile" />
) : (
  <User className="w-12 h-12 text-white" />
)}
```

¡Ahora la página de perfil muestra la imagen real del usuario desde la base de datos, igual que el navbar del dashboard! 🎉
