# Corrección de Encuestas - Votos no se registran
**Fecha:** 28 de Octubre de 2025  
**Estado:** ✅ **RESUELTO**

## 🔴 Problema Identificado

Las encuestas nuevas **NO estaban guardando los votos** porque les faltaba la estructura necesaria en `attachment_data`:

### ❌ Estructura Incorrecta (Encuestas que NO funcionaban)
```json
{
  "options": ["ef", "sef"],
  "duration": 1,
  "question": "asef"
  // ❌ FALTA: votes y userVotes
}
```

### ✅ Estructura Correcta (Encuestas que SÍ funcionaban)
```json
{
  "votes": {
    "rojo": ["9562a449-4ade-4d4b-a3e4-b66dddb7e6f0"],
    "verde": [],
    "azul": [],
    "negro": []
  },
  "options": ["rojo", "verde", "azul", "negro"],
  "question": "¿Que color te gusta?",
  "userVotes": {
    "9562a449-4ade-4d4b-a3e4-b66dddb7e6f0": "rojo"
  }
}
```

## 🔧 Causa Raíz

El servicio `supabaseStorage.ts` estaba creando encuestas **SIN inicializar** las propiedades `votes` y `userVotes`:

```typescript
// ❌ CÓDIGO ANTERIOR (INCORRECTO)
case 'poll':
  return {
    attachment_url: null,
    attachment_type: 'poll',
    attachment_data: {
      question: attachmentData.question,
      options: attachmentData.options,
      duration: attachmentData.duration
      // ❌ FALTABAN votes y userVotes
    }
  };
```

## ✅ Solución Implementada

### 1. Corrección en el Código Frontend

**Archivo:** `apps/web/src/core/services/supabaseStorage.ts`

```typescript
case 'poll':
  // ✅ Inicializar la estructura votes con arrays vacíos para cada opción
  const initialVotes: { [key: string]: string[] } = {};
  if (attachmentData.options) {
    attachmentData.options.forEach((option: string) => {
      initialVotes[option] = [];
    });
  }

  return {
    attachment_url: null,
    attachment_type: 'poll',
    attachment_data: {
      question: attachmentData.question,
      options: attachmentData.options,
      duration: attachmentData.duration,
      votes: initialVotes,      // ✅ Inicializar votes
      userVotes: {}             // ✅ Inicializar userVotes
    }
  };
```

### 2. Script SQL para Migrar Encuestas Existentes

**Archivo:** `database-fixes/fix-existing-polls-structure.sql`

Este script:
- ✅ Identifica todas las encuestas sin estructura correcta
- ✅ Inicializa `votes` como objeto con arrays vacíos para cada opción
- ✅ Inicializa `userVotes` como objeto vacío
- ✅ Verifica la corrección exitosa

## 📝 Pasos para Aplicar la Solución

### Paso 1: La corrección del código ya está aplicada ✅
Las nuevas encuestas se crearán con la estructura correcta automáticamente.

### Paso 2: Migrar encuestas existentes
Ejecuta el script SQL en Supabase:

```bash
# Copiar el contenido de:
database-fixes/fix-existing-polls-structure.sql

# Y ejecutarlo en Supabase SQL Editor
```

## 🧪 Cómo Verificar la Corrección

### 1. Crear una nueva encuesta
1. Ve a una comunidad
2. Crea un nuevo post con encuesta
3. La encuesta debe tener esta estructura:
```json
{
  "question": "tu pregunta",
  "options": ["opción1", "opción2"],
  "duration": 7,
  "votes": {
    "opción1": [],
    "opción2": []
  },
  "userVotes": {}
}
```

### 2. Votar en la encuesta
1. Selecciona una opción
2. El voto debe registrarse:
```json
{
  "votes": {
    "opción1": ["tu-user-id"],
    "opción2": []
  },
  "userVotes": {
    "tu-user-id": "opción1"
  }
}
```

### 3. Verificar en base de datos
```sql
SELECT 
  id,
  attachment_data->>'question' as question,
  jsonb_pretty(attachment_data->'votes') as votes,
  jsonb_pretty(attachment_data->'userVotes') as userVotes
FROM community_posts
WHERE attachment_type = 'poll'
ORDER BY created_at DESC
LIMIT 5;
```

## 📊 Estructura del Sistema de Votación

### Propiedades Clave

#### `votes` (objeto)
- **Keys:** Texto de cada opción
- **Values:** Array de IDs de usuarios que votaron por esa opción
- **Propósito:** Almacenar QUIÉN votó por CADA opción

```json
{
  "opción1": ["user-id-1", "user-id-2"],
  "opción2": ["user-id-3"]
}
```

#### `userVotes` (objeto)
- **Keys:** ID de usuario
- **Values:** Texto de la opción votada
- **Propósito:** Encontrar rápidamente QUÉ votó cada usuario

```json
{
  "user-id-1": "opción1",
  "user-id-2": "opción1",
  "user-id-3": "opción2"
}
```

## 🔍 Sistema de Auto-inicialización

El sistema tiene un **mecanismo de respaldo** en el API de votación que inicializa automáticamente la estructura si falta:

**Archivo:** `apps/web/src/app/api/communities/[slug]/polls/[postId]/vote/route.ts`

```typescript
// ✅ Auto-inicialización si falta la estructura
if (!pollData.votes || typeof pollData.votes !== 'object') {
  console.log('⚠️ Inicializando estructura de votos...');
  const initialVotes: Record<string, string[]> = {};
  pollData.options.forEach((option: string) => {
    initialVotes[option] = [];
  });
  pollData.votes = initialVotes;
  pollData.userVotes = pollData.userVotes || {};
}
```

## 🎯 Resultado Esperado

Después de aplicar las correcciones:

✅ **Encuestas nuevas** se crean con estructura completa  
✅ **Encuestas existentes** se migran automáticamente  
✅ **Votos se registran** correctamente  
✅ **Votos persisten** al recargar la página  
✅ **Sistema robusto** con auto-inicialización de respaldo

## 📚 Archivos Modificados

1. `apps/web/src/core/services/supabaseStorage.ts` - Inicialización al crear
2. `database-fixes/fix-existing-polls-structure.sql` - Migración de datos existentes
3. `CORRECCION_VOTOS_ENCUESTAS_FINAL.md` - Esta documentación

## ⚠️ Notas Importantes

- El sistema de auto-inicialización en el API es un **respaldo**, pero es mejor crear las encuestas con la estructura correcta desde el inicio
- Las encuestas existentes necesitan migración manual usando el script SQL
- Después de aplicar el script SQL, **todas las encuestas** funcionarán correctamente
