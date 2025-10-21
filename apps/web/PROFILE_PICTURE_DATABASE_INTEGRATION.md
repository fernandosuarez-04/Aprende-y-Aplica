# Integración de Imagen de Perfil con Base de Datos

## ✅ **Problema Resuelto**

### 🐛 **Problema Principal**
- El dropdown del usuario no mostraba la imagen de perfil real del usuario
- No se estaba accediendo a la base de datos para obtener la `profile_picture_url`
- El componente solo mostraba un icono genérico en lugar de la imagen del usuario

## 🛠️ **Solución Implementada**

### **1. Actualización de Tipos de Supabase**

#### **Tipos de Base de Datos Actualizados**
```typescript
// apps/web/src/lib/supabase/types.ts
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          username: string
          email: string
          // ... otros campos
          profile_picture_url: string | null  // ✅ Agregado
          curriculum_url: string | null       // ✅ Agregado
          bio: string | null                  // ✅ Agregado
          location: string | null             // ✅ Agregado
          linkedin_url: string | null         // ✅ Agregado
          github_url: string | null           // ✅ Agregado
          website_url: string | null          // ✅ Agregado
          points: number | null               // ✅ Agregado
          last_login_at: string | null        // ✅ Agregado
          // ... otros campos
        }
        Insert: {
          // ... campos con profile_picture_url opcional
          profile_picture_url?: string | null
          // ... otros campos
        }
        Update: {
          // ... campos con profile_picture_url opcional
          profile_picture_url?: string | null
          // ... otros campos
        }
      }
    }
  }
}
```

### **2. Hook Personalizado para Perfil de Usuario**

#### **Nuevo Hook: useUserProfile**
```typescript
// apps/web/src/features/auth/hooks/useUserProfile.ts
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'
import { createClient } from '../../../lib/supabase/client'
import type { Database } from '../../../lib/supabase/types'

type UserProfile = Database['public']['Tables']['users']['Row']

interface UseUserProfileReturn {
  userProfile: UserProfile | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useUserProfile(): UseUserProfileReturn {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const fetchUserProfile = useCallback(async () => {
    if (!user?.id) {
      setUserProfile(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const supabase = createClient()
      
      const { data, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (fetchError) {
        console.error('Error fetching user profile:', fetchError)
        throw new Error(`Error al obtener perfil: ${fetchError.message}`)
      }

      setUserProfile(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      console.error('Error fetching user profile:', err)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  const refetch = useCallback(async () => {
    await fetchUserProfile()
  }, [fetchUserProfile])

  useEffect(() => {
    fetchUserProfile()
  }, [fetchUserProfile])

  return {
    userProfile,
    loading,
    error,
    refetch,
  }
}
```

### **3. Actualización del UserDropdown**

#### **Import del Nuevo Hook**
```typescript
// apps/web/src/core/components/UserDropdown/UserDropdown.tsx
import { useAuth } from '../../../features/auth/hooks/useAuth'
import { useUserProfile } from '../../../features/auth/hooks/useUserProfile'  // ✅ Nuevo import
import { useTheme } from '../../hooks/useTheme'
import { useRouter } from 'next/navigation'
```

#### **Uso del Hook en el Componente**
```typescript
export function UserDropdown({ className = '' }: UserDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { user, logout } = useAuth()
  const { userProfile, loading: profileLoading } = useUserProfile()  // ✅ Nuevo hook
  const { toggleTheme, isDark } = useTheme()
  const router = useRouter()

  console.log('🔍 UserDropdown renderizado, user:', user)
  console.log('🔍 UserProfile:', userProfile)  // ✅ Debug del perfil
```

#### **Avatar del Usuario con Imagen Real**
```typescript
// Botón del usuario - Avatar pequeño
<motion.div 
  className="relative w-10 h-10 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center shadow-lg overflow-hidden"
  whileHover={{ scale: 1.1 }}
  transition={{ duration: 0.2 }}
>
  {userProfile?.profile_picture_url ? (
    <img 
      src={userProfile.profile_picture_url} 
      alt="Avatar" 
      className="w-full h-full rounded-full object-cover"
    />
  ) : (
    <User className="w-5 h-5 text-white" />
  )}
  {/* Animación de fondo */}
  <motion.div
    className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent rounded-full"
    animate={{ 
      opacity: [0.3, 0.6, 0.3],
      scale: [1, 1.1, 1]
    }}
    transition={{ 
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut"
    }}
  />
</motion.div>
```

#### **Información del Usuario Actualizada**
```typescript
// Información del usuario en el botón
<div className="hidden sm:block text-left">
  <p className="text-sm font-medium text-text-primary">
    {userProfile?.display_name || userProfile?.first_name || user?.display_name || user?.username || 'Usuario'}
  </p>
  <p className="text-xs text-text-tertiary">
    {userProfile?.email || user?.email || 'usuario@ejemplo.com'}
  </p>
</div>
```

#### **Header del Dropdown con Imagen Real**
```typescript
// Header del dropdown - Avatar grande
<div className="px-6 py-5 border-b border-gray-600 bg-gray-800/50">
  <div className="flex items-center space-x-5">
    <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center shadow-lg overflow-hidden">
      {userProfile?.profile_picture_url ? (
        <img 
          src={userProfile.profile_picture_url} 
          alt="Avatar" 
          className="w-full h-full rounded-full object-cover"
        />
      ) : (
        <User className="w-8 h-8 text-white" />
      )}
    </div>
    <div className="flex-1 min-w-0">
      <h3 className="text-lg font-semibold text-text-primary truncate">
        {userProfile?.display_name || userProfile?.first_name || user?.display_name || user?.username || 'Usuario'}
      </h3>
      <p className="text-sm text-text-tertiary truncate">
        {userProfile?.email || user?.email || 'usuario@ejemplo.com'}
      </p>
    </div>
  </div>
</div>
```

## 🎯 **Beneficios de la Implementación**

### **Funcionalidad Completa**
- ✅ **Imagen real del usuario** - Muestra la foto de perfil desde la base de datos
- ✅ **Fallback elegante** - Icono genérico si no hay imagen
- ✅ **Datos actualizados** - Nombre y email desde la base de datos
- ✅ **Carga automática** - Se actualiza cuando cambia el usuario

### **Experiencia de Usuario Mejorada**
- ✅ **Identificación visual** - El usuario ve su foto real
- ✅ **Consistencia** - Misma imagen en botón y dropdown
- ✅ **Información precisa** - Datos actualizados de la base de datos
- ✅ **Animaciones suaves** - Transiciones elegantes

### **Arquitectura Robusta**
- ✅ **Separación de responsabilidades** - Hook dedicado para perfil
- ✅ **Tipos seguros** - TypeScript con tipos de Supabase
- ✅ **Manejo de errores** - Fallbacks y logging
- ✅ **Performance optimizada** - Carga solo cuando es necesario

## 🔧 **Cómo Funciona**

### **Flujo de Datos**
1. **Usuario autenticado** → `useAuth` proporciona `user.id`
2. **Hook useUserProfile** → Consulta la base de datos con `user.id`
3. **Datos del perfil** → Obtiene `profile_picture_url` y otros datos
4. **UserDropdown** → Muestra la imagen real del usuario
5. **Actualización automática** → Se refresca cuando cambia el usuario

### **Estructura de Datos**
```typescript
// Datos obtenidos de la base de datos
userProfile = {
  id: "user-uuid",
  username: "usuario123",
  email: "usuario@ejemplo.com",
  display_name: "Juan Pérez",
  first_name: "Juan",
  last_name: "Pérez",
  profile_picture_url: "https://miwbzotcuaywpdbidpwo.supabase.co/storage/v1/object/public/avatars/profile-pictures/user-uuid-1234567890.jpg",
  // ... otros campos
}
```

## 🚀 **Cómo Probar**

### **1. Verificar en la Consola**
```javascript
// Deberías ver estos logs:
🔍 UserDropdown renderizado, user: {id: "...", email: "..."}
🔍 UserProfile: {id: "...", profile_picture_url: "https://...", ...}
```

### **2. Verificar en la UI**
- **Botón del usuario**: Debería mostrar la imagen real del usuario
- **Dropdown**: Al abrir, debería mostrar la imagen grande del usuario
- **Información**: Nombre y email deberían ser los de la base de datos

### **3. Verificar Fallback**
- Si no hay `profile_picture_url`, debería mostrar el icono genérico
- Si hay error en la carga, debería mostrar el icono genérico

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
- Confirma que el hook `useUserProfile` esté funcionando
- Revisa que no haya errores de TypeScript

## ✨ **Mejores Prácticas Implementadas**

- ✅ **Tipos seguros** - TypeScript con tipos de Supabase
- ✅ **Hooks personalizados** - Separación de lógica de negocio
- ✅ **Manejo de errores** - Fallbacks y logging apropiado
- ✅ **Performance** - Carga solo cuando es necesario
- ✅ **UX consistente** - Misma imagen en botón y dropdown
- ✅ **Accesibilidad** - Alt text para imágenes
- ✅ **Responsive** - Funciona en diferentes tamaños de pantalla

¡Ahora el UserDropdown muestra la imagen real del usuario desde la base de datos! 🎉
