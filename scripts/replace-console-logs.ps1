# Script para reemplazar console.log por logger.log en archivos API
# Ejecutar desde la raíz del proyecto: powershell -ExecutionPolicy Bypass -File scripts/replace-console-logs.ps1

Write-Host "🔍 Reemplazando console.log por logger.log en archivos API..." -ForegroundColor Cyan

$rootPath = "apps\web\src\app\api"
$loggerImport = "import { logger } from '../../../../../lib/utils/logger';"

# Contador
$filesModified = 0
$replacementsMade = 0

# Obtener todos los archivos .ts en la carpeta API
$files = Get-ChildItem -Path $rootPath -Recurse -Filter "*.ts"

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    $modified = $false
    
    # Verificar si ya tiene el import de logger
    $hasLoggerImport = $content -match "import.*logger.*from.*logger"
    
    # Contar cuántos console. tiene
    $consoleMatches = ([regex]::Matches($content, "console\.(log|error|warn|info|debug)")).Count
    
    if ($consoleMatches -gt 0) {
        Write-Host "📝 $($file.Name): $consoleMatches console.* encontrados" -ForegroundColor Yellow
        
        # Reemplazar console.log por logger.log
        $content = $content -replace "console\.log\(", "logger.log("
        
        # Reemplazar console.error por logger.error
        $content = $content -replace "console\.error\(", "logger.error("
        
        # Reemplazar console.warn por logger.warn
        $content = $content -replace "console\.warn\(", "logger.warn("
        
        # Reemplazar console.info por logger.info
        $content = $content -replace "console\.info\(", "logger.info("
        
        # Reemplazar console.debug por logger.debug
        $content = $content -replace "console\.debug\(", "logger.debug("
        
        # Agregar import de logger si no lo tiene
        if (-not $hasLoggerImport) {
            # Buscar la línea de imports existentes
            if ($content -match "import.*from\s+['\"]next/server['\"]") {
                # Calcular la ruta relativa correcta
                $relativePath = $file.Directory.FullName -replace [regex]::Escape((Get-Location).Path + "\apps\web\src\app\api"), ""
                $depth = ($relativePath.Split('\').Count - 1)
                if ($depth -eq 0) { $depth = 1 }
                $relativeImport = "../" * $depth + "lib/utils/logger"
                
                # Agregar import después del último import
                $lastImportMatch = ([regex]::Matches($content, "import.*from.*['\"];?\r?\n")).Value | Select-Object -Last 1
                if ($lastImportMatch) {
                    $newImport = "import { logger } from '$relativeImport';"
                    $content = $content -replace [regex]::Escape($lastImportMatch), "$lastImportMatch$newImport`n"
                }
            }
        }
        
        # Solo guardar si hubo cambios
        if ($content -ne $originalContent) {
            Set-Content -Path $file.FullName -Value $content -NoNewline
            $filesModified++
            $replacementsMade += $consoleMatches
            Write-Host "  ✅ Modificado" -ForegroundColor Green
            $modified = $true
        }
    }
}

Write-Host ""
Write-Host "═══════════════════════════════════════" -ForegroundColor Blue
Write-Host "✅ Resumen:" -ForegroundColor Green
Write-Host "  Archivos modificados: $filesModified" -ForegroundColor White
Write-Host "  Reemplazos realizados: $replacementsMade" -ForegroundColor White
Write-Host "═══════════════════════════════════════" -ForegroundColor Blue
Write-Host ""
Write-Host "💡 Nota: Algunos errores de TypeScript son esperados y se resolverán al compilar" -ForegroundColor Yellow
Write-Host "🔍 Ejecuta 'npm run type-check' para verificar errores" -ForegroundColor Cyan
