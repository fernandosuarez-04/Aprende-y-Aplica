# Script para reemplazar console.log por logger.log en archivos API
# Ejecutar: .\scripts\replace-console-simple.ps1

Write-Host "Reemplazando console.log por logger.log en archivos API..." -ForegroundColor Cyan

$rootPath = "apps\web\src\app\api"
$filesModified = 0
$replacementsMade = 0

# Obtener todos los archivos .ts en la carpeta API  
$files = Get-ChildItem -Path $rootPath -Recurse -Include *.ts

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Contar cuántos console. tiene
    $consoleCount = ([regex]::Matches($content, 'console\.')).Count
    
    if ($consoleCount -gt 0) {
        Write-Host "Procesando: $($file.Name) - $consoleCount console.* encontrados" -ForegroundColor Yellow
        
        # Reemplazar todos los console. por logger.
        $content = $content -replace 'console\.log\(', 'logger.log('
        $content = $content -replace 'console\.error\(', 'logger.error('
        $content = $content -replace 'console\.warn\(', 'logger.warn('
        $content = $content -replace 'console\.info\(', 'logger.info('
        $content = $content -replace 'console\.debug\(', 'logger.debug('
        
        # Verificar si ya tiene el import de logger
        $hasLoggerImport = $content -match 'import.*logger.*from'
        
        if (-not $hasLoggerImport) {
            # Calcular la profundidad relativa
            $relativePath = $file.Directory.FullName -replace [regex]::Escape("$(Get-Location)\apps\web\src\app\api"), ''
            $depth = ($relativePath.Split([IO.Path]::DirectorySeparatorChar) | Where-Object { $_ }).Count
            if ($depth -eq 0) { $depth = 1 }
            
            $relativeImport = ('../' * $depth) + 'lib/utils/logger'
            $loggerImportLine = "import { logger } from '$relativeImport';`n"
            
            # Buscar la primera línea de import y agregar después
            $firstImportPattern = '(import\s+.*?from\s+[''"].*?[''"];?\s*\n)'
            if ($content -match $firstImportPattern) {
                $content = $content -replace $firstImportPattern, "`$1$loggerImportLine"
            }
        }
        
        # Guardar si hubo cambios
        if ($content -ne $originalContent) {
            Set-Content -Path $file.FullName -Value $content -NoNewline
            $filesModified++
            $replacementsMade += $consoleCount
            Write-Host "  Modificado exitosamente" -ForegroundColor Green
        }
    }
}

Write-Host "`n========================================" -ForegroundColor Blue
Write-Host "Resumen:" -ForegroundColor Green
Write-Host "  Archivos modificados: $filesModified" -ForegroundColor White
Write-Host "  Reemplazos realizados: $replacementsMade" -ForegroundColor White
Write-Host "========================================`n" -ForegroundColor Blue
