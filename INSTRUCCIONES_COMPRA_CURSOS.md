# Instrucciones para Configurar la Compra de Cursos

## ✅ Estado Actual

He implementado la funcionalidad completa de compra de cursos:

1. **API de Compra**: `/api/courses/[slug]/purchase` ✅
2. **Componente actualizado**: La página del curso ahora llama a la API ✅
3. **Import corregido**: Error EBUSY resuelto ✅

## 📋 Pasos para Activar la Funcionalidad

### 1. Crear la Tabla en Supabase

1. Ve a tu panel de Supabase: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a **SQL Editor** en el menú lateral
4. Copia **TODO** el contenido del archivo `Nueva carpeta/course_purchases_table.sql`
5. Pégalo en el SQL Editor
6. Haz clic en **RUN** (o presiona `Ctrl+Enter`)

### 2. Verificar que la Tabla se Creó

1. Ve a **Table Editor** en el menú lateral
2. Busca la tabla `course_purchases`
3. Deberías ver todas las columnas (purchase_id, user_id, course_id, etc.)

### 3. Probar la Compra

1. Asegúrate de estar **logueado** en tu aplicación
2. Ve a cualquier curso (ejemplo: `/courses/nombre-del-curso`)
3. Haz clic en el botón **"Adquirir Curso"**
4. Deberías ver un mensaje de éxito
5. Ve al dashboard - el curso debería aparecer como "Adquirido"

## 🗂️ Estructura de Datos

La compra crea registros en **3 tablas**:

1. **`transactions`**: Registra la transacción de pago
2. **`course_purchases`**: Registra la compra del usuario
3. **`user_course_enrollments`**: Crea la inscripción al curso

## 🔍 Verificar los Datos

Para verificar que todo funciona:

```sql
-- Ver todas las compras
SELECT * FROM course_purchases;

-- Ver compras con información del curso y usuario
SELECT 
  cp.purchase_id,
  cp.final_price_cents,
  cp.currency,
  cp.access_status,
  c.title AS curso,
  u.email AS usuario
FROM course_purchases cp
JOIN courses c ON c.id = cp.course_id
JOIN users u ON u.id = cp.user_id;
```

## ⚠️ Solución de Problemas

### Error: "No autenticado"
- Asegúrate de estar logueado antes de comprar

### Error: "Curso no encontrado"
- Verifica que el slug del curso sea correcto

### La tabla sigue vacía
- Revisa la consola del navegador (F12 > Console)
- Revisa los logs del servidor en la terminal
- Verifica que la tabla `course_purchases` se creó correctamente en Supabase

### Error de permisos
- Verifica las políticas RLS (Row Level Security) en Supabase
- La tabla debería permitir INSERT para usuarios autenticados

## 📝 Notas Importantes

- Esta es una implementación **temporal** sin procesamiento de pago real
- Cuando integres una API de pago (Stripe, PayPal, etc.), actualizarás:
  - `transactions.payment_method_id`
  - `transactions.processor_transaction_id`
  - `transactions.processor_response`
- Las compras temporales se marcan con `processor_transaction_id` que empieza con "TEMP-"

## 🎯 Próximos Pasos

1. ✅ Ejecuta el script SQL en Supabase
2. ✅ Prueba una compra
3. ⏳ Implementa integración con Stripe/PayPal
4. ⏳ Agrega validaciones adicionales según necesites
5. ⏳ Implementa sistema de cupones (el campo ya existe en la tabla)

## 💡 Tip

Puedes ver todas las compras en el dashboard de Supabase con esta consulta:

```sql
SELECT 
  cp.*,
  c.title AS course_title,
  u.email AS user_email
FROM course_purchases cp
LEFT JOIN courses c ON c.id = cp.course_id
LEFT JOIN users u ON u.id = cp.user_id
ORDER BY cp.purchased_at DESC;
```

