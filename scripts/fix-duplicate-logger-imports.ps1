# Script para eliminar imports duplicados de logger
$baseDir = "d:\EcosDeLiderazgo\ProyectosEcosDeLiderazgo\En Desarrollo\Bot Ventas Whatsapp\BOT CURSO\Aprende-y-Aplica\apps\web\src"
$fileCount = 0
$fixCount = 0

Write-Host "Buscando archivos con imports duplicados de logger..." -ForegroundColor Yellow

Get-ChildItem -Path $baseDir -Filter "*.ts" -Recurse | ForEach-Object {
    $filePath = $_.FullName
    $fileCount++
    
    try {
        $lines = Get-Content $filePath
        $loggerImportLines = @()
        $lineNumber = 0
        
        foreach ($line in $lines) {
            if ($line -match "import.*logger.*from.*logger") {
                $loggerImportLines += $lineNumber
            }
            $lineNumber++
        }
        
        if ($loggerImportLines.Count -gt 1) {
            Write-Host "Archivo con imports duplicados: $($_.Name)" -ForegroundColor Cyan
            
            $newLines = @()
            $lineNumber = 0
            $removedLines = 0
            
            foreach ($line in $lines) {
                if ($loggerImportLines.Contains($lineNumber) -and $lineNumber -ne $loggerImportLines[0]) {
                    $removedLines++
                } else {
                    $newLines += $line
                }
                $lineNumber++
            }
            
            if ($removedLines -gt 0) {
                $newLines | Set-Content -Path $filePath -Force
                $fixCount++
                Write-Host "Eliminados $removedLines imports duplicados" -ForegroundColor Green
            }
        }
    }
    catch {
        Write-Host "Error procesando archivo: $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== RESUMEN ===" -ForegroundColor Yellow
Write-Host "Archivos procesados: $fileCount" -ForegroundColor White
Write-Host "Archivos corregidos: $fixCount" -ForegroundColor Green
