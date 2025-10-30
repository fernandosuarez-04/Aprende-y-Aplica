# 🛠️ Scripts de Optimización

Este directorio contiene scripts automatizados para optimización de performance y mantenimiento del código.

---

## 📦 Scripts Disponibles

### 1️⃣ **replace-console-simple.ps1**
Reemplaza automáticamente `console.log` por `logger.log` en archivos TypeScript.

**Uso:**
```powershell
.\scripts\replace-console-simple.ps1
```

**Qué hace:**
- ✅ Busca todos los archivos `.ts` en `apps/web/src/app/api`
- ✅ Reemplaza `console.log` → `logger.log`
- ✅ Reemplaza `console.error` → `logger.error`
- ✅ Reemplaza `console.warn` → `logger.warn`
- ✅ Agrega `import { logger } from '@/lib/utils/logger'` si no existe

**Resultados:**
- 236 reemplazos en 62 archivos (primera ejecución)
- ~258 console.log restantes requieren revisión manual

---

### 2️⃣ **fix-duplicate-logger-imports.ps1**
Elimina imports duplicados del logger causados por ejecuciones múltiples del script de reemplazo.

**Uso:**
```powershell
.\scripts\fix-duplicate-logger-imports.ps1
```

**Qué hace:**
- ✅ Busca archivos con múltiples `import { logger }` statements
- ✅ Mantiene solo el primer import
- ✅ Elimina los duplicados

**Resultados:**
- 61 archivos corregidos
- 80+ líneas de código redundante eliminadas

---

### 3️⃣ **fix-logger-paths.ps1**
Convierte paths relativos de logger a alias `@/` para resolver errores de módulo no encontrado.

**Uso:**
```powershell
.\scripts\fix-logger-paths.ps1
```

**Qué hace:**
- ✅ Encuentra imports como `from '../../../lib/utils/logger'`
- ✅ Los convierte a `from '@/lib/utils/logger'`
- ✅ Procesa recursivamente todos los archivos en `/api`

**Resultados:**
- 58 archivos corregidos
- Resuelve errores "Module not found"

---

### 4️⃣ **test-cache-headers.js**
Prueba los headers de cache HTTP de las APIs configuradas.

**Uso:**
```bash
npm run test:cache
```

**Qué hace:**
- ✅ Hace peticiones a endpoints configurados
- ✅ Verifica headers Cache-Control
- ✅ Muestra tiempos de respuesta
- ✅ Valida configuración de cache

**Ejemplo de salida:**
```
✓ /api/communities - Cache-Control: public, s-maxage=3600
✓ /api/courses - Cache-Control: public, s-maxage=3600
✓ /api/admin/news - Cache-Control: public, s-maxage=300
```

---

## 🎯 Flujo de Trabajo Típico

### Optimización de Logging
1. Ejecutar `replace-console-simple.ps1`
2. Si hay duplicados → ejecutar `fix-duplicate-logger-imports.ps1`
3. Si hay errores de paths → ejecutar `fix-logger-paths.ps1`
4. Verificar con `npm run dev` que no hay errores

### Validación de Cache
1. Configurar headers en routes (ver `docs/IMPLEMENTACION_CACHE_HEADERS.md`)
2. Ejecutar `npm run test:cache`
3. Ajustar configuración según resultados

---

## ⚠️ Notas Importantes

### Compatibilidad PowerShell
Los scripts `.ps1` pueden tener problemas con PowerShell 5.1 (Windows default):
- **Problema común**: Parámetro `-Raw` no reconocido en `Get-Content`
- **Solución**: Los scripts funcionan a pesar del warning, o instalar PowerShell 7+

### Backup Recomendado
Antes de ejecutar scripts masivos:
```bash
git add .
git commit -m "Pre-script backup"
```

### Verificación Post-Script
Siempre verificar cambios:
```bash
git diff
npm run type-check
npm run dev
```

---

## 📊 Estadísticas de Optimización

### Logger Implementation
- **Archivos modificados**: 62 (API routes)
- **Console.log eliminados**: 236 (48% del total)
- **Imports duplicados corregidos**: 61 archivos
- **Paths corregidos**: 58 archivos
- **Tiempo ahorrado**: ~8-10 horas vs manual

### Cache Headers Implementation
- **Rutas con cache**: 7+ principales
- **Categorías**: static (1hr), semiStatic (5min), dynamic (30s), private
- **Reducción esperada en llamadas API**: ~50%

---

## 🔧 Agregar Nuevos Scripts

### Template para PowerShell
```powershell
# Descripción del script
$baseDir = "ruta/base"
$processedCount = 0

Write-Host "Iniciando proceso..." -ForegroundColor Yellow

Get-ChildItem -Path $baseDir -Filter "*.ts" -Recurse | ForEach-Object {
    try {
        # Lógica del script aquí
        $processedCount++
        Write-Host "Procesado: $($_.Name)" -ForegroundColor Green
    }
    catch {
        Write-Host "Error en $($_.Name): $_" -ForegroundColor Red
    }
}

Write-Host "Completado: $processedCount archivos" -ForegroundColor Cyan
```

### Template para Node.js
```javascript
const fs = require('fs');
const path = require('path');

async function processFiles() {
  console.log('🚀 Iniciando proceso...');
  
  // Lógica aquí
  
  console.log('✅ Completado');
}

processFiles().catch(console.error);
```

---

## 📚 Referencias

- [Logger Utility](../apps/web/src/lib/utils/logger.ts)
- [Cache Headers Utility](../apps/web/src/lib/utils/cache-headers.ts)
- [Implementación Cache](../docs/IMPLEMENTACION_CACHE_HEADERS.md)
- [Implementación Logger](../docs/IMPLEMENTACION_ELIMINAR_LOGGING.md)

---

**Última actualización**: 30 de Octubre 2025  
**Mantenido por**: Equipo de Performance Optimization
