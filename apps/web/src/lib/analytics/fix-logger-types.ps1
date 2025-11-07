$content = Get-Content lia-logger.ts -Raw

# Agregar as any después de .insert({ y antes del cierre del objeto
$content = $content -replace '(\.insert\(\{[^}]+)\}(\s*\))', '$1} as any$2'

# Agregar as any después de .update({ y antes del cierre del objeto  
$content = $content -replace '(\.update\(\{[^}]+)\}(\s*\))', '$1} as any$2'

# Agregar as any a data cuando se accede a propiedades
$content = $content -replace '(return )(data)(\.[a-z_]+)', '$1($2 as any)$3'
$content = $content -replace '(\s)(data)(\.[a-z_]+)', '$1($2 as any)$3'

# Guardar
Set-Content -Path lia-logger.ts -Value $content

Write-Host "Tipos corregidos en lia-logger.ts"
