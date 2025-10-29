# Solución para Error EBUSY en Windows con OneDrive

## Problema
Error `EBUSY: resource busy or locked` al ejecutar Next.js cuando el proyecto está en OneDrive.

## Causa
OneDrive está intentando sincronizar archivos que Next.js está usando simultáneamente.

## Soluciones (en orden de recomendación)

### Solución 1: Pausar sincronización de OneDrive
1. Haz clic en el ícono de OneDrive en la bandeja del sistema
2. Ve a "Configuración" > "Pausar sincronización"
3. Pausa por 2 horas (o el tiempo que vayas a trabajar)

### Solución 2: Excluir carpetas de sincronización
1. Haz clic derecho en el ícono de OneDrive
2. Ve a "Configuración"
3. Ve a la pestaña "Cuenta" > "Elegir carpetas"
4. Selecciona tu proyecto
5. Dentro del proyecto, marca solo las carpetas necesarias (src, docs, etc.)
6. **NO marques**: `node_modules`, `.next`, `dist`, `.turbo`

### Solución 3: Mover proyecto fuera de OneDrive (RECOMENDADO)
1. Mueve el proyecto a una carpeta local:
   - `C:\Proyectos\Aprende-y-Aplica`
2. Actualiza tu espacio de trabajo en Cursor/VS Code
3. Vuelve a instalar dependencias si es necesario

### Solución 4: Limpiar y reconstruir
```bash
# Detener el servidor (Ctrl+C)
# Luego ejecutar:
cd apps\web
rd /s /q .next
cd ..\..
npm run dev
```

### Solución 5: Reiniciar la computadora
A veces simplemente reiniciar libera todos los archivos bloqueados.

## Prevención futura
- Siempre trabaja en proyectos de desarrollo FUERA de OneDrive
- Si es necesario en OneDrive, marca `node_modules` y `.next` como "Siempre mantener en este dispositivo"
- Usa Git para control de versiones, no OneDrive

## Nota importante
Este error es muy común en Windows con OneDrive. La mejor práctica es mantener los proyectos de desarrollo en una carpeta local como `C:\Proyectos\` o `C:\dev\`.

