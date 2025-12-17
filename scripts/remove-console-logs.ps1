# Script de PowerShell para remover console.log multilínea
# Uso: powershell -ExecutionPolicy Bypass -File scripts/remove-console-logs.ps1

$basePath = "apps/web/src"
$extensions = @("*.ts", "*.tsx")
$modified = 0
$removed = 0

Write-Host "`n============================================"
Write-Host "  REMOVE CONSOLE.LOG (PowerShell)"
Write-Host "============================================`n"

# Patrón para console.log en una sola línea (con contenido simple)
$pattern1 = '^\s*console\.log\([^;{]*\);\s*$'

# Obtener todos los archivos
$files = Get-ChildItem -Path $basePath -Recurse -Include $extensions -File

Write-Host "Archivos encontrados: $($files.Count)`n"

foreach ($file in $files) {
    try {
        $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue

        if ($null -eq $content) { continue }

        # Contar ocurrencias antes
        $matches = [regex]::Matches($content, 'console\.log\(')
        $beforeCount = $matches.Count

        if ($beforeCount -eq 0) { continue }

        # Aplicar reemplazo línea por línea
        $lines = $content -split "`n"
        $newLines = @()
        $linesRemoved = 0

        foreach ($line in $lines) {
            # Verificar si la línea es solo un console.log
            if ($line -match '^\s*console\.log\([^;]*\);\s*$') {
                $linesRemoved++
                continue
            }
            # También verificar console.log sin punto y coma al final
            if ($line -match '^\s*console\.log\([^;]*\)\s*$' -and $line -notmatch '\{|\[') {
                $linesRemoved++
                continue
            }
            $newLines += $line
        }

        if ($linesRemoved -gt 0) {
            $newContent = $newLines -join "`n"

            # Limpiar líneas vacías múltiples
            $newContent = $newContent -replace "(\r?\n){3,}", "`n`n"

            Set-Content $file.FullName $newContent -NoNewline

            $relativePath = $file.FullName.Replace((Get-Location).Path + "\", "")
            Write-Host "  $relativePath : $linesRemoved logs removidos"

            $modified++
            $removed += $linesRemoved
        }
    }
    catch {
        Write-Host "  Error procesando $($file.Name): $_" -ForegroundColor Red
    }
}

Write-Host "`n============================================"
Write-Host "  RESULTADOS"
Write-Host "============================================"
Write-Host "  Archivos modificados: $modified"
Write-Host "  Console.logs removidos: $removed"
Write-Host ""
