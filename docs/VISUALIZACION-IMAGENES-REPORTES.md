# Visualización de Imágenes en Reportes de Problemas

## Configuración del Bucket

Las imágenes de los reportes de problemas se almacenan en el bucket `reportes-screenshots` de Supabase Storage.

### Políticas RLS

Las políticas RLS ya están configuradas en `scripts/supabase/setup-reportes-screenshots-bucket.sql`:

1. **INSERT público**: Permite a usuarios anónimos subir imágenes
2. **SELECT público**: Permite a usuarios anónimos leer/ver/descargar imágenes

### Verificación de Configuración

Para verificar que las imágenes se pueden visualizar correctamente:

1. **Verificar que el bucket está marcado como público**:
   - Ve a Storage en el panel de Supabase
   - Busca el bucket `reportes-screenshots`
   - Verifica que tenga el badge "Public" (naranja)
   - Si no está marcado como público:
     - Haz clic en los tres puntos (⋯) junto al nombre del bucket
     - Selecciona "Edit bucket"
     - Marca la casilla "Public bucket"
     - Guarda los cambios

2. **Verificar políticas RLS**:
   - En Storage > reportes-screenshots > Policies
   - Deben existir las siguientes políticas:
     - "Allow public insert reportes-screenshots" (INSERT)
     - "Allow public select reportes-screenshots" (SELECT)

3. **Verificar URLs públicas**:
   - Las URLs públicas siguen este formato:
     ```
     https://[project-id].supabase.co/storage/v1/object/public/reportes-screenshots/[nombre-archivo]
     ```
   - Puedes probar accediendo directamente a una URL de screenshot desde un reporte

### Manejo de Errores en el Código

En `ViewReporteModal.tsx`, se maneja el caso cuando una imagen no se puede cargar:

```typescript
onError={(e) => {
  // Si la imagen falla al cargar, mostrar un mensaje
  const target = e.target as HTMLImageElement
  target.style.display = 'none'
  const parent = target.parentElement
  if (parent) {
    parent.innerHTML = `
      <div class="p-8 text-center text-gray-500 dark:text-gray-400">
        <p>No se pudo cargar la imagen</p>
        <p class="text-sm mt-2">URL: ${reporte.screenshot_url}</p>
      </div>
    `
  }
}}
```

### Troubleshooting

Si las imágenes no se muestran:

1. **Verifica la URL del screenshot**:
   - Asegúrate de que `screenshot_url` en la base de datos tenga el formato correcto
   - Debe ser una URL completa que comience con `https://`

2. **Verifica CORS** (si es necesario):
   - En Supabase Storage, verifica la configuración de CORS
   - Asegúrate de que tu dominio esté permitido

3. **Verifica permisos**:
   - Ejecuta el script SQL `setup-reportes-screenshots-bucket.sql` si aún no lo has hecho
   - Verifica que las políticas estén activas

4. **Verifica el formato de la imagen**:
   - Las imágenes deben ser formatos válidos (JPG, PNG, GIF)
   - El tamaño máximo es 10MB (según la validación en el frontend)

### Notas Importantes

- Las imágenes se suben usando `SUPABASE_SERVICE_ROLE_KEY` en `/api/reportes/route.ts` para bypass de RLS durante la subida
- Las imágenes se visualizan usando URLs públicas, por lo que el bucket debe estar marcado como público
- Si cambias la configuración del bucket después de crear reportes, las URLs existentes seguirán funcionando si el bucket sigue siendo público

