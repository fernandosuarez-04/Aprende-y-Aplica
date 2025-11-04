# Fix: Append-Only Certificates Table

## Problema

La tabla `user_course_certificates` tiene un trigger `certificate_ledger` que la hace append-only (solo permite INSERT, no DELETE). Esto causaba el siguiente error al intentar regenerar certificados:

```
Error code: P0001
Message: certificate_ledger es append-only; solo INSERT permitido
```

## Solución Implementada

### 1. Modificación de `certificate.service.ts`

**Cambio principal**: En lugar de eliminar y recrear certificados con placeholder URLs, ahora reutilizamos el registro existente.

**Antes** (causaba error):
```typescript
if (existingCertificate && isPlaceholder) {
  // Eliminar certificado con placeholder
  await supabaseAdmin
    .from('user_course_certificates')
    .delete()  // ❌ Esto fallaba
    .eq('certificate_id', existingCertificate.certificate_id)
}
```

**Después** (funciona):
```typescript
if (existingCertificate) {
  // Reutilizar el registro existente
  console.log('Reutilizando registro de certificado existente:', existingCertificate.certificate_id)
  certificate = existingCertificate
} else {
  // Solo insertar si NO existe
  const { data: newCertificate } = await supabaseAdmin
    .from('user_course_certificates')
    .insert({...})
  certificate = newCertificate
}

// Más adelante, actualizar con la URL real
await supabaseAdmin
  .from('user_course_certificates')
  .update({ certificate_url: finalUrl })  // ✅ Esto funciona
  .eq('certificate_id', certificate.certificate_id)
```

### 2. Eliminación de Código de Limpieza

**Eliminado en `certificate.service.ts`** (líneas 1109-1122 y 1117-1123):
- Código que intentaba DELETE en caso de error al subir PDF
- Código que intentaba DELETE si la URL final era placeholder

**Reemplazado con**:
```typescript
// NOTA: No podemos eliminar el registro porque la tabla es append-only
// El registro quedará con URL placeholder y será regenerado en el siguiente intento
console.log('⚠️ El certificado quedará con URL placeholder (tabla append-only, no permite DELETE)')
```

### 3. Deshabilitación de Endpoints de Admin

**`/api/admin/certificates/cleanup-placeholders`**:
- Ahora retorna error indicando que la función está deshabilitada
- Solo modo dry-run (GET con dryRun=true) funciona para ver certificados con placeholder

**`/api/admin/certificates/regenerate`**:
- Deshabilitado completamente (no puede forzar regeneración eliminando el registro)
- El GET endpoint sigue funcionando para consultar información del certificado

## Flujo de Regeneración Automática

1. Usuario solicita certificado
2. Sistema verifica si existe certificado para ese enrollment
3. Si existe y tiene URL placeholder:
   - **Reutiliza el registro existente** (no intenta eliminarlo)
   - Genera el PDF con el hash del registro existente
   - Sube el PDF a Storage
   - **Actualiza la URL** del registro (UPDATE, no DELETE+INSERT)
4. Si no existe:
   - Crea nuevo registro con URL placeholder temporal
   - Genera y sube PDF
   - Actualiza la URL con la real

## Ventajas de Esta Solución

1. ✅ **Respeta la restricción append-only** de la tabla
2. ✅ **Mantiene el historial completo** en certificate_ledger
3. ✅ **Regenera automáticamente** certificados con placeholder
4. ✅ **No requiere intervención manual** del administrador
5. ✅ **Preserva los IDs** de certificados (no se crean duplicados)

## Archivos Modificados

- `apps/web/src/lib/services/certificate.service.ts`
  - Líneas 745-765: Detección de placeholder y reutilización
  - Líneas 883-915: Lógica de inserción/reutilización
  - Líneas 1109-1112: Eliminado DELETE en caso de error de subida
  - Líneas 1117-1123: Eliminado DELETE si URL es placeholder

- `apps/web/src/app/api/admin/certificates/cleanup-placeholders/route.ts`
  - Líneas 88-107: Deshabilitada función de eliminación

- `apps/web/src/app/api/admin/certificates/regenerate/route.ts`
  - Líneas 80-98: Deshabilitada función de regeneración forzada

## Testing

Para probar que el fix funciona:

1. **Escenario 1: Certificado existente con placeholder**
   ```bash
   # Verificar que existe certificado con placeholder
   GET /api/admin/certificates/cleanup-placeholders?dryRun=true

   # Solicitar certificado (debería regenerarse automáticamente)
   POST /api/courses/[slug]/certificate/generate
   ```

2. **Escenario 2: Certificado nuevo**
   ```bash
   # Solicitar certificado por primera vez
   POST /api/courses/[slug]/certificate/generate
   ```

3. **Verificar logs del servidor**:
   ```
   ⚠️ Certificado existente con URL placeholder detectado
   Regenerando certificado (actualizando registro existente)...
   Reutilizando registro de certificado existente: xxx-xxx-xxx
   PDF generado exitosamente. Tamaño: XXXX bytes
   PDF subido exitosamente. Path: certificates/...
   URL del certificado actualizada exitosamente: https://...
   ✅ Certificado generado exitosamente
   ```

## Consideraciones

- **Certificados con placeholder persistirán** hasta que el usuario los solicite de nuevo
- **No hay forma de forzar regeneración** desde el panel de admin (esto es por diseño de la BD)
- **Los certificados se regeneran automáticamente** cuando se detecta placeholder URL
- **No hay forma de "limpiar" certificados antiguos** (la tabla es append-only por seguridad y auditoría)

## Última Actualización

2024-11-04 - Fix implementado para respetar restricción append-only
