# Script para reemplazar paths relativos de logger por alias @/
$baseDir = "d:\EcosDeLiderazgo\ProyectosEcosDeLiderazgo\En Desarrollo\Bot Ventas Whatsapp\BOT CURSO\Aprende-y-Aplica\apps\web\src\app\api"
$fixCount = 0

Write-Host "Reemplazando paths relativos de logger por alias @/..." -ForegroundColor Yellow

Get-ChildItem -Path $baseDir -Filter "*.ts" -Recurse | ForEach-Object {
    $filePath = $_.FullName
    
    try {
        $content = Get-Content $filePath -Raw
        $originalContent = $content
        
        # Reemplazar cualquier path relativo que apunte a logger
        $content = $content -replace "from\s+['""]\.\.\/.*?\/lib\/utils\/logger['""]", "from '@/lib/utils/logger'"
        
        if ($content -ne $originalContent) {
            $content | Set-Content -Path $filePath -NoNewline
            $fixCount++
            Write-Host "Corregido: $($_.Name)" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "Error procesando $($_.Name): $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== RESUMEN ===" -ForegroundColor Yellow
Write-Host "Archivos corregidos: $fixCount" -ForegroundColor Green
