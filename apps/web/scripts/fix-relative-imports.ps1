# Script para corregir imports relativos incorrectos
# Uso: .\fix-relative-imports.ps1

Write-Host "🔍 Buscando imports relativos incorrectos..." -ForegroundColor Cyan

# Buscar imports relativos que deberían usar alias @/
$patterns = @(
    "from '../lib/",
    "from '../../lib/",
    "from '../../../lib/",
    "from '../features/",
    "from '../../features/",
    "from '../../../features/",
    "from '../core/",
    "from '../../core/",
    "from '../../../core/"
)

$files = Get-ChildItem -Path "src" -Include "*.ts","*.tsx" -Recurse

$totalFixed = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    $fixed = $false
    
    foreach ($pattern in $patterns) {
        if ($content -match [regex]::Escape($pattern)) {
            # Reemplazar imports relativos con alias @/
            $content = $content -replace "from '\.\./lib/", "from '@/lib/"
            $content = $content -replace "from '\.\./\.\./lib/", "from '@/lib/"
            $content = $content -replace "from '\.\./\.\./\.\./lib/", "from '@/lib/"
            
            $content = $content -replace "from '\.\./features/", "from '@/features/"
            $content = $content -replace "from '\.\./\.\./features/", "from '@/features/"
            $content = $content -replace "from '\.\./\.\./\.\./features/", "from '@/features/"
            
            $content = $content -replace "from '\.\./core/", "from '@/core/"
            $content = $content -replace "from '\.\./\.\./core/", "from '@/core/"
            $content = $content -replace "from '\.\./\.\./\.\./core/", "from '@/core/"
            
            $fixed = $true
        }
    }
    
    if ($fixed -and $content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "✅ Corregido: $($file.FullName)" -ForegroundColor Green
        $totalFixed++
    }
}

if ($totalFixed -eq 0) {
    Write-Host "✨ No se encontraron imports relativos para corregir" -ForegroundColor Green
} else {
    Write-Host "✅ Total de archivos corregidos: $totalFixed" -ForegroundColor Green
}

Write-Host "`n🎯 Próximos pasos:" -ForegroundColor Yellow
Write-Host "1. Revisar los cambios con git diff" -ForegroundColor White
Write-Host "2. Ejecutar npm run build para validar" -ForegroundColor White
Write-Host "3. Hacer commit de los cambios" -ForegroundColor White
