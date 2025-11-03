# Plan de Implementación: Sistema de Moderación de Comunidades

## 📋 Resumen Ejecutivo

Este documento describe la implementación paso por paso del sistema de moderación de comunidades con filtrado automático de contenido ofensivo, sistema de advertencias graduales y baneo automático.

---

## 🎯 Objetivos

1. **Filtrar contenido ofensivo** en posts y comentarios antes de que se guarden en la BD
2. **Sistema de advertencias** que permite hasta 3 infracciones
3. **Baneo automático** al alcanzar la 4ta infracción
4. **Invalidación de sesiones** cuando un usuario es baneado
5. **Historial y auditoría** de todas las infracciones

---

## 📊 PASO 1: Ejecutar el Script SQL en la Base de Datos

### ✅ Qué hace el script

El archivo `database-fixes/moderacion-comunidades.sql` implementa:

1. **Campos nuevos en tabla `users`**:
   - `is_banned`: boolean para marcar usuarios baneados
   - `banned_at`: timestamp de cuándo fue baneado
   - `ban_reason`: texto explicativo del motivo

2. **Tabla `user_warnings`**: Registro de todas las advertencias
   - `warning_id`: ID único de la advertencia
   - `user_id`: Usuario que recibió la advertencia
   - `reason`: Motivo (contenido_ofensivo, spam, etc.)
   - `content_type`: Tipo de contenido (post, comment, other)
   - `content_id`: ID del contenido bloqueado
   - `blocked_content`: Copia del contenido para auditoría
   - `created_at`: Timestamp

3. **Tabla `forbidden_words`**: Catálogo de palabras prohibidas
   - `word`: La palabra o frase prohibida
   - `severity`: Nivel de gravedad (low, medium, high, critical)
   - `category`: Categoría (insult, racism, sexism, violence, scam, spam)
   - `is_active`: Si está activa o deshabilitada

4. **Funciones útiles**:
   - `get_user_warnings_count()`: Cuenta advertencias de un usuario
   - `register_user_warning()`: Registra advertencia y banea si es necesario
   - `contains_forbidden_content()`: Verifica si un texto tiene palabras prohibidas
   - `get_user_warning_history()`: Obtiene historial de advertencias
   - `is_user_banned()`: Verifica si un usuario está baneado

5. **Triggers automáticos**:
   - Invalida sesiones cuando un usuario es baneado

6. **Políticas RLS**: Row Level Security para proteger datos

7. **Vista de estadísticas**: `moderation_stats` para ver usuarios con advertencias

### 🚀 Cómo ejecutarlo

**Opción A: Desde Supabase Dashboard**
1. Ve a tu proyecto en Supabase
2. Abre el **SQL Editor**
3. Copia y pega el contenido completo de `database-fixes/moderacion-comunidades.sql`
4. Haz clic en **Run** o presiona `Ctrl+Enter`
5. Verifica que se ejecutó correctamente (verás mensajes de confirmación)

**Opción B: Desde línea de comandos (si tienes psql instalado)**
```bash
psql "postgresql://postgres:[TU_PASSWORD]@[TU_HOST]:5432/postgres" -f database-fixes/moderacion-comunidades.sql
```

### ✅ Verificación

Después de ejecutar, deberías ver mensajes como:
```
✓ Tabla user_warnings creada correctamente
✓ Tabla forbidden_words creada correctamente
✓ Campo is_banned agregado a users
✓ 26 palabras prohibidas insertadas

============================================
INSTALACIÓN COMPLETADA EXITOSAMENTE
============================================
```

---

## 📝 PASO 2: Implementar Filtro en la API de Posts

### Archivo a modificar
`apps/web/src/app/api/communities/[slug]/posts/route.ts`

### Cambios necesarios

1. **Importar función de validación** al inicio del archivo:

```typescript
import { createClient } from '@/lib/supabase/server';

// Agregar esta función helper
async function containsForbiddenContent(text: string): Promise<{ contains: boolean; words: string[] }> {
  const supabase = await createClient();
  
  try {
    const { data, error } = await supabase.rpc('contains_forbidden_content', {
      p_text: text
    });
    
    if (error) {
      console.error('Error checking forbidden content:', error);
      return { contains: false, words: [] };
    }
    
    return {
      contains: data?.contains_forbidden || false,
      words: data?.found_words || []
    };
  } catch (error) {
    console.error('Exception checking forbidden content:', error);
    return { contains: false, words: [] };
  }
}

async function registerWarning(
  userId: string,
  content: string,
  contentType: 'post' | 'comment',
  contentId?: string
): Promise<{ warningCount: number; userBanned: boolean; message: string }> {
  const supabase = await createClient();
  
  try {
    const { data, error } = await supabase.rpc('register_user_warning', {
      p_user_id: userId,
      p_reason: 'contenido_ofensivo',
      p_content_type: contentType,
      p_content_id: contentId || null,
      p_blocked_content: content
    });
    
    if (error) {
      console.error('Error registering warning:', error);
      throw error;
    }
    
    return {
      warningCount: data?.warning_count || 0,
      userBanned: data?.user_banned || false,
      message: data?.message || ''
    };
  } catch (error) {
    console.error('Exception registering warning:', error);
    throw error;
  }
}
```

2. **Modificar la función POST** para validar contenido:

Busca la sección donde se valida el contenido (después de parsear el body) y agrega:

```typescript
// Validación existente
if (!content || content.trim().length === 0) {
  return NextResponse.json(
    { error: 'El contenido es requerido' },
    { status: 400 }
  );
}

// ⭐ AGREGAR ESTA VALIDACIÓN NUEVA
// Verificar si contiene palabras prohibidas
const forbiddenCheck = await containsForbiddenContent(content);

if (forbiddenCheck.contains) {
  // Registrar la advertencia
  try {
    const warningResult = await registerWarning(
      user.id,
      content,
      'post'
    );
    
    // Si el usuario fue baneado
    if (warningResult.userBanned) {
      return NextResponse.json(
        { 
          error: '❌ Has sido baneado del sistema por reiteradas violaciones de las reglas de la comunidad.',
          banned: true
        },
        { status: 403 }
      );
    }
    
    // Si solo es advertencia
    return NextResponse.json(
      { 
        error: `⚠️ El contenido contiene lenguaje inapropiado y ha sido bloqueado. ${warningResult.message}`,
        warning: true,
        warningCount: warningResult.warningCount,
        foundWords: forbiddenCheck.words
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error registering warning:', error);
    // Si falla el registro, al menos bloquear el contenido
    return NextResponse.json(
      { error: 'El contenido contiene lenguaje inapropiado y ha sido bloqueado.' },
      { status: 400 }
    );
  }
}

// Continuar con la lógica normal de inserción del post...
```

---

## 📝 PASO 3: Implementar Filtro en la API de Comentarios

### Archivo a modificar
`apps/web/src/app/api/communities/[slug]/posts/[postId]/comments/route.ts`

### Cambios necesarios

1. **Reutilizar las mismas funciones helper** del PASO 2 (copiarlas o mejor, moverlas a un archivo compartido)

2. **Modificar la función POST** de comentarios:

Busca donde se valida el contenido y agrega:

```typescript
// Validación existente
if (!content || content.trim().length === 0) {
  return NextResponse.json(
    { error: 'El contenido del comentario es requerido' },
    { status: 400 }
  );
}

// ⭐ AGREGAR ESTA VALIDACIÓN NUEVA
// Verificar si contiene palabras prohibidas
const forbiddenCheck = await containsForbiddenContent(content);

if (forbiddenCheck.contains) {
  try {
    const warningResult = await registerWarning(
      user.id,
      content,
      'comment'
    );
    
    if (warningResult.userBanned) {
      return NextResponse.json(
        { 
          error: '❌ Has sido baneado del sistema por reiteradas violaciones de las reglas de la comunidad.',
          banned: true
        },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { 
        error: `⚠️ El comentario contiene lenguaje inapropiado y ha sido bloqueado. ${warningResult.message}`,
        warning: true,
        warningCount: warningResult.warningCount,
        foundWords: forbiddenCheck.words
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error registering warning:', error);
    return NextResponse.json(
      { error: 'El contenido contiene lenguaje inapropiado y ha sido bloqueado.' },
      { status: 400 }
    );
  }
}

// Continuar con la inserción del comentario...
```

---

## 📝 PASO 4: Bloquear Usuarios Baneados en Autenticación

### Archivos a modificar

#### 4.1 Middleware de Autenticación
`apps/web/src/middleware.ts` o donde manejes la autenticación

Agrega verificación de baneo al obtener el usuario:

```typescript
// Después de obtener el usuario de la sesión
const { data: userData } = await supabase
  .from('users')
  .select('id, username, email, is_banned')
  .eq('id', user.id)
  .single();

if (userData?.is_banned) {
  // Destruir sesión
  await supabase.auth.signOut();
  
  // Redirigir a página de baneo
  return NextResponse.redirect(new URL('/auth/banned', request.url));
}
```

#### 4.2 Verificación en Login
`apps/web/src/app/api/auth/login/route.ts` (o similar)

Después de verificar credenciales, antes de crear sesión:

```typescript
// Verificar si el usuario está baneado
const { data: user } = await supabase
  .from('users')
  .select('is_banned, ban_reason')
  .eq('email', email)
  .single();

if (user?.is_banned) {
  return NextResponse.json(
    { 
      error: 'Tu cuenta ha sido suspendida por violaciones de las reglas de la comunidad.',
      banned: true,
      reason: user.ban_reason
    },
    { status: 403 }
  );
}
```

---

## 📝 PASO 5: Crear Utilidad Compartida (Opcional pero Recomendado)

### Crear archivo compartido
`apps/web/src/lib/moderation.ts`

```typescript
import { createClient } from '@/lib/supabase/server';

export interface ForbiddenContentResult {
  contains: boolean;
  words: string[];
}

export interface WarningResult {
  warningCount: number;
  userBanned: boolean;
  message: string;
}

/**
 * Verifica si un texto contiene palabras prohibidas
 */
export async function containsForbiddenContent(text: string): Promise<ForbiddenContentResult> {
  const supabase = await createClient();
  
  try {
    const { data, error } = await supabase.rpc('contains_forbidden_content', {
      p_text: text
    });
    
    if (error) {
      console.error('Error checking forbidden content:', error);
      return { contains: false, words: [] };
    }
    
    return {
      contains: data?.contains_forbidden || false,
      words: data?.found_words || []
    };
  } catch (error) {
    console.error('Exception checking forbidden content:', error);
    return { contains: false, words: [] };
  }
}

/**
 * Registra una advertencia para un usuario
 */
export async function registerWarning(
  userId: string,
  content: string,
  contentType: 'post' | 'comment',
  contentId?: string
): Promise<WarningResult> {
  const supabase = await createClient();
  
  try {
    const { data, error } = await supabase.rpc('register_user_warning', {
      p_user_id: userId,
      p_reason: 'contenido_ofensivo',
      p_content_type: contentType,
      p_content_id: contentId || null,
      p_blocked_content: content
    });
    
    if (error) {
      console.error('Error registering warning:', error);
      throw error;
    }
    
    return {
      warningCount: data?.warning_count || 0,
      userBanned: data?.user_banned || false,
      message: data?.message || ''
    };
  } catch (error) {
    console.error('Exception registering warning:', error);
    throw error;
  }
}

/**
 * Verifica si un usuario está baneado
 */
export async function isUserBanned(userId: string): Promise<boolean> {
  const supabase = await createClient();
  
  try {
    const { data, error } = await supabase.rpc('is_user_banned', {
      p_user_id: userId
    });
    
    if (error) {
      console.error('Error checking if user is banned:', error);
      return false;
    }
    
    return data || false;
  } catch (error) {
    console.error('Exception checking if user is banned:', error);
    return false;
  }
}

/**
 * Obtiene el historial de advertencias de un usuario
 */
export async function getUserWarningHistory(userId: string) {
  const supabase = await createClient();
  
  try {
    const { data, error } = await supabase.rpc('get_user_warning_history', {
      p_user_id: userId
    });
    
    if (error) {
      console.error('Error getting warning history:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Exception getting warning history:', error);
    return [];
  }
}
```

Luego en los archivos API, solo importa:

```typescript
import { containsForbiddenContent, registerWarning } from '@/lib/moderation';
```

---

## 📝 PASO 6: Crear Página para Usuarios Baneados (Opcional)

### Crear archivo
`apps/web/src/app/auth/banned/page.tsx`

```tsx
import Link from 'next/link';

export default function BannedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <svg
            className="mx-auto h-16 w-16 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
            />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Cuenta Suspendida
        </h1>
        
        <p className="text-gray-600 mb-6">
          Tu cuenta ha sido suspendida debido a múltiples violaciones de las reglas 
          de la comunidad. Esta suspensión es permanente.
        </p>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-red-800">
            <strong>Motivo:</strong> Contenido inapropiado reiterado después de 3 advertencias.
          </p>
        </div>
        
        <p className="text-sm text-gray-500 mb-6">
          Si crees que esto es un error, por favor contacta a nuestro equipo de soporte.
        </p>
        
        <Link
          href="/"
          className="inline-block bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
        >
          Volver al Inicio
        </Link>
      </div>
    </div>
  );
}
```

---

## 📝 PASO 7: Panel de Administración (Opcional)

### Crear archivo
`apps/web/src/app/admin/moderation/page.tsx`

```tsx
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface ModerationStats {
  user_id: string;
  username: string;
  email: string;
  is_banned: boolean;
  banned_at: string | null;
  total_warnings: number;
  last_warning_date: string | null;
}

export default function ModerationDashboard() {
  const [stats, setStats] = useState<ModerationStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('moderation_stats')
      .select('*')
      .order('total_warnings', { ascending: false });

    if (!error && data) {
      setStats(data);
    }
    
    setLoading(false);
  }

  if (loading) {
    return <div className="p-8">Cargando...</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Panel de Moderación</h1>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Usuario
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Advertencias
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Última Advertencia
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Estado
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {stats.map((stat) => (
              <tr key={stat.user_id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {stat.username}
                  </div>
                  <div className="text-sm text-gray-500">{stat.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    stat.total_warnings >= 3 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {stat.total_warnings} advertencia(s)
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {stat.last_warning_date 
                    ? new Date(stat.last_warning_date).toLocaleDateString()
                    : '-'
                  }
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {stat.is_banned ? (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                      Baneado
                    </span>
                  ) : (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Activo
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

---

## 🧪 PASO 8: Testing

### 8.1 Crear script de prueba

Crear archivo `scripts/test-moderation.js`:

```javascript
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testModeration() {
  console.log('🧪 Iniciando pruebas de moderación...\n');

  // Test 1: Verificar palabras prohibidas
  console.log('Test 1: Verificar detección de palabras prohibidas');
  const { data: checkResult } = await supabase.rpc('contains_forbidden_content', {
    p_text: 'Este es un texto con idiota contenido'
  });
  console.log('Resultado:', checkResult);
  console.log(checkResult.contains_forbidden ? '✅ PASS' : '❌ FAIL');
  console.log('');

  // Test 2: Texto limpio
  console.log('Test 2: Verificar texto limpio');
  const { data: cleanResult } = await supabase.rpc('contains_forbidden_content', {
    p_text: 'Este es un texto completamente apropiado'
  });
  console.log('Resultado:', cleanResult);
  console.log(!cleanResult.contains_forbidden ? '✅ PASS' : '❌ FAIL');
  console.log('');

  // Test 3: Contar palabras prohibidas
  const { count } = await supabase
    .from('forbidden_words')
    .select('*', { count: 'exact', head: true });
  console.log(`Test 3: Total de palabras prohibidas: ${count}`);
  console.log(count > 0 ? '✅ PASS' : '❌ FAIL');
  console.log('');

  console.log('🎉 Pruebas completadas');
}

testModeration();
```

### 8.2 Ejecutar pruebas
```bash
node scripts/test-moderation.js
```

---

## 📊 PASO 9: Monitoreo y Mantenimiento

### Consultas útiles para administradores

```sql
-- Ver usuarios con más advertencias
SELECT * FROM moderation_stats 
ORDER BY total_warnings DESC 
LIMIT 10;

-- Ver advertencias recientes
SELECT 
  u.username,
  uw.reason,
  uw.content_type,
  uw.created_at
FROM user_warnings uw
JOIN users u ON uw.user_id = u.id
ORDER BY uw.created_at DESC
LIMIT 20;

-- Ver usuarios baneados
SELECT 
  username,
  email,
  banned_at,
  ban_reason
FROM users
WHERE is_banned = true
ORDER BY banned_at DESC;

-- Estadísticas generales
SELECT 
  COUNT(DISTINCT user_id) as usuarios_con_advertencias,
  COUNT(*) as total_advertencias,
  SUM(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 ELSE 0 END) as advertencias_ultima_semana
FROM user_warnings;
```

---

## ✅ Checklist de Implementación

- [ ] **PASO 1**: Ejecutar SQL en base de datos
  - [ ] Verificar que todas las tablas se crearon
  - [ ] Verificar que las funciones existen
  - [ ] Verificar palabras prohibidas insertadas

- [ ] **PASO 2**: Implementar filtro en API de posts
  - [ ] Agregar funciones helper
  - [ ] Modificar validación en POST
  - [ ] Probar con palabra prohibida

- [ ] **PASO 3**: Implementar filtro en API de comentarios
  - [ ] Agregar funciones helper
  - [ ] Modificar validación en POST
  - [ ] Probar con palabra prohibida

- [ ] **PASO 4**: Bloquear usuarios baneados
  - [ ] Actualizar middleware
  - [ ] Actualizar login
  - [ ] Probar con usuario baneado

- [ ] **PASO 5**: Crear utilidad compartida
  - [ ] Crear archivo moderation.ts
  - [ ] Refactorizar APIs para usar utilidad

- [ ] **PASO 6**: Crear página de baneados (opcional)
  - [ ] Crear página /auth/banned
  - [ ] Probar redirección

- [ ] **PASO 7**: Panel de administración (opcional)
  - [ ] Crear página de moderación
  - [ ] Probar visualización de stats

- [ ] **PASO 8**: Testing
  - [ ] Crear script de pruebas
  - [ ] Ejecutar y verificar

- [ ] **PASO 9**: Documentación
  - [ ] Documentar en README
  - [ ] Capacitar a administradores

---

## 🚨 Casos de Prueba

### Caso 1: Primera infracción
1. Usuario intenta crear post con palabra prohibida
2. Sistema bloquea el post
3. Sistema registra advertencia #1
4. Usuario ve: "⚠️ Advertencia 1 de 3..."

### Caso 2: Segunda y tercera infracción
1. Usuario intenta nuevamente con contenido prohibido
2. Sistema bloquea y registra advertencia #2 o #3
3. Usuario ve mensaje con contador actualizado

### Caso 3: Cuarta infracción (baneo)
1. Usuario intenta 4ta vez con contenido prohibido
2. Sistema bloquea contenido
3. Sistema registra advertencia #4
4. Sistema marca is_banned = true
5. Sistema invalida sesiones activas
6. Usuario ve: "❌ Has sido baneado..."
7. Usuario es redirigido y no puede login

### Caso 4: Usuario baneado intenta login
1. Usuario baneado intenta iniciar sesión
2. Sistema verifica is_banned = true
3. Login es rechazado con mensaje claro

---

## 📚 Referencias

- **Documento original**: `docs/MODERADOR_COMUNIDADES.md`
- **Script SQL**: `database-fixes/moderacion-comunidades.sql`
- **Supabase Docs**: https://supabase.com/docs/guides/database/functions

---

## 🎯 Próximos Pasos Después de la Implementación

1. **Ampliar lista de palabras prohibidas**
   - Agregar variaciones con tildes
   - Agregar palabras en otros idiomas
   - Considerar usar servicios de ML para detección avanzada

2. **Notificaciones**
   - Email al usuario cuando recibe advertencia
   - Email al admin cuando alguien es baneado

3. **Appeals/Apelaciones**
   - Sistema para que usuarios baneados puedan apelar
   - Dashboard de admin para revisar apelaciones

4. **Métricas**
   - Dashboard con gráficos de moderación
   - Exportar reportes mensuales

---

¡Listo! Ahora tienes todo lo necesario para implementar el sistema de moderación paso por paso.
