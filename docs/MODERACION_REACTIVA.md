# 🔄 FLUJO DE MODERACIÓN REACTIVA CON IA

## 📋 Resumen

El sistema de moderación ahora funciona con un **flujo reactivo** donde:
1. ✅ **Capa 1** bloquea ANTES de publicar (palabras prohibidas)
2. ✅ **Capa 2** analiza DESPUÉS de publicar con IA (análisis contextual)

## 🔄 Flujo Completo

### Para POSTS

```
Usuario escribe post
    ↓
¿Contiene palabras prohibidas? (Capa 1)
    ↓ NO
POST SE CREA ✅ (respuesta inmediata al usuario)
    ↓
Análisis con IA en background 🤖
    ↓
¿Contenido inapropiado?
    ↓ SÍ
POST SE ELIMINA 🗑️
    ↓
Advertencia al usuario ⚠️
    ↓
Si es 4ta advertencia → BANEO 🚫
```

### Para COMENTARIOS

```
Usuario escribe comentario
    ↓
¿Contiene palabras prohibidas? (Capa 1)
    ↓ NO
COMENTARIO SE CREA ✅ (respuesta inmediata)
    ↓
Análisis con IA en background 🤖
    ↓
¿Contenido inapropiado?
    ↓ SÍ
COMENTARIO SE ELIMINA 🗑️
    ↓
Contador de comentarios se decrementa
    ↓
Advertencia al usuario ⚠️
    ↓
Si es 4ta advertencia → BANEO 🚫
```

## 🎯 Ventajas de este Enfoque

### 1. **Experiencia de Usuario Mejorada**
- ✅ Respuesta instantánea (no espera análisis de IA)
- ✅ El contenido se publica de inmediato
- ✅ Solo se elimina si la IA detecta problema real

### 2. **Moderación Efectiva**
- 🚫 Bloqueo inmediato de palabras prohibidas obvias
- 🤖 Análisis contextual con IA para casos complejos
- 📊 Logs completos de todas las acciones

### 3. **Transparencia**
- 👁️ Los logs de consola muestran todo el proceso
- 📈 Todas las decisiones se registran en la BD
- 🔍 Panel de admin para revisar casos dudosos

## 📊 Logs en Consola

Cuando publiques contenido, verás en la consola del navegador:

```
✅ Post created successfully: abc-123-def
🤖 Starting AI moderation analysis for post: abc-123-def
🤖 AI Analysis Result: {
  postId: "abc-123-def",
  isInappropriate: true,
  confidence: "85.5%",
  categories: ["harassment"],
  requiresHumanReview: false
}
🚨 Inappropriate content detected! Deleting post: abc-123-def
✅ Post deleted successfully: abc-123-def
⚠️ Warning registered for user: {
  userId: "user-123",
  warningCount: 2,
  userBanned: false
}
```

## 🗄️ Registros en Base de Datos

Todos los análisis se guardan en `ai_moderation_logs`:

```sql
SELECT 
  content_type,
  confidence_score,
  categories,
  status,
  created_at
FROM ai_moderation_logs
WHERE user_id = 'user-123'
ORDER BY created_at DESC;
```

## 🔧 SQL Adicional Requerido

Ejecuta este SQL para que el sistema funcione correctamente:

```sql
-- Función para decrementar contador de comentarios
CREATE OR REPLACE FUNCTION public.decrement_comment_count(post_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE community_posts
  SET comment_count = GREATEST(0, comment_count - 1)
  WHERE id = post_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.decrement_comment_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_comment_count(UUID) TO anon;
```

## 🎮 Cómo Probarlo

### 1. Contenido que pasa Capa 1 pero falla en Capa 2

```
"Este mensaje es para intimidar y acosar a otros usuarios"
```
- ✅ No tiene palabras prohibidas → Se publica
- 🤖 IA detecta acoso → Se elimina
- ⚠️ Usuario recibe advertencia

### 2. Contenido que falla en Capa 1

```
"Eres un idiota"
```
- 🚫 Palabra prohibida detectada → NO se publica
- ⚠️ Usuario recibe advertencia inmediata

### 3. Ver los logs

1. Abre DevTools (F12)
2. Ve a la pestaña Console
3. Publica contenido
4. Observa los logs en tiempo real

## 📱 Respuestas del API

### Post creado exitosamente
```json
{
  "post": { ... },
  "success": true,
  "aiModerationPending": true
}
```

El campo `aiModerationPending: true` indica que el análisis de IA se está ejecutando en background.

### Contenido bloqueado por Capa 1
```json
{
  "error": "⚠️ El contenido contiene lenguaje inapropiado y ha sido bloqueado. Advertencia 2/3: Ten cuidado, una advertencia más resultará en suspensión.",
  "warning": true,
  "warningCount": 2,
  "foundWords": ["idiota"]
}
```

## 🔐 Seguridad

- ✅ Análisis en background no bloquea el servidor
- ✅ Errores en IA no afectan la publicación
- ✅ Logs de todas las operaciones
- ✅ Sistema de advertencias progresivo
- ✅ Baneo automático en 4ta advertencia

## 📈 Panel de Administración

Accede a `/admin/moderation-ai` para:
- 📋 Ver contenido pendiente de revisión humana
- ✅ Aprobar falsos positivos
- ❌ Rechazar contenido inapropiado
- 📊 Ver estadísticas de moderación

## 🆘 Troubleshooting

### El post no se elimina
- Verifica que `OPENAI_MODERATION_ENABLED=true` en `.env.local`
- Revisa los logs de consola para errores
- Confirma que la API key de OpenAI es válida

### No veo logs en consola
- Asegúrate de tener DevTools abierto
- Verifica que los logs de consola estén habilitados
- Prueba en modo incógnito para descartar extensiones

### Error al decrementar contador
- Ejecuta el SQL de `decrement_comment_count`
- Verifica permisos de la función en Supabase
