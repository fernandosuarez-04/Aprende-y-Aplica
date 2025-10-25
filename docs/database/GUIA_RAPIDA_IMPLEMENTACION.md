# Guía Rápida de Implementación - Sistema de Cuestionarios

## ⚡ Implementación en 5 Pasos (20 minutos)

---

## 📋 Pre-requisitos

- [ ] Acceso a la base de datos de Supabase
- [ ] Backup de la base de datos actual
- [ ] Código actualizado del repositorio

---

## 🚀 Paso 1: Ejecutar Scripts SQL (15 min)

### Opción A: Desde Supabase Dashboard

1. Ir a **Supabase Dashboard** → **SQL Editor**
2. Copiar y pegar cada script en orden:

```sql
-- 1. RECREAR_PREGUNTAS_COMPLETO.sql
-- Copiar todo el contenido y ejecutar

-- 2. AGREGAR_PREGUNTAS_ROLES_FALTANTES.sql
-- Copiar todo el contenido y ejecutar

-- 3. AGREGAR_PREGUNTAS_ROL_9_EDUCACION.sql
-- Copiar todo el contenido y ejecutar (NUEVO - Rol 9 faltante)

-- 4. AGREGAR_PREGUNTAS_ROLES_11_19_COMPLETO.sql
-- Copiar todo el contenido y ejecutar

-- 5. AGREGAR_PREGUNTAS_ROLES_11_19_PARTE2.sql
-- Copiar todo el contenido y ejecutar

-- 6. AGREGAR_PREGUNTAS_ROLES_21_26.sql
-- Copiar todo el contenido y ejecutar

-- 7. AGREGAR_PREGUNTAS_ROLES_21_26_PARTE2.sql
-- Copiar todo el contenido y ejecutar
```

### Opción B: Desde Terminal

```bash
# Navegar a la carpeta de scripts
cd docs/database

# Ejecutar scripts en orden (ajustar credenciales)
psql -h db.miwbzotcuaywpdbidpwo.supabase.co \
     -U postgres \
     -d postgres \
     -f RECREAR_PREGUNTAS_COMPLETO.sql

psql -h db.miwbzotcuaywpdbidpwo.supabase.co \
     -U postgres \
     -d postgres \
     -f AGREGAR_PREGUNTAS_ROLES_FALTANTES.sql

psql -h db.miwbzotcuaywpdbidpwo.supabase.co \
     -U postgres \
     -d postgres \
     -f AGREGAR_PREGUNTAS_ROL_9_EDUCACION.sql

psql -h db.miwbzotcuaywpdbidpwo.supabase.co \
     -U postgres \
     -d postgres \
     -f AGREGAR_PREGUNTAS_ROLES_11_19_COMPLETO.sql

psql -h db.miwbzotcuaywpdbidpwo.supabase.co \
     -U postgres \
     -d postgres \
     -f AGREGAR_PREGUNTAS_ROLES_11_19_PARTE2.sql

psql -h db.miwbzotcuaywpdbidpwo.supabase.co \
     -U postgres \
     -d postgres \
     -f AGREGAR_PREGUNTAS_ROLES_21_26.sql

psql -h db.miwbzotcuaywpdbidpwo.supabase.co \
     -U postgres \
     -d postgres \
     -f AGREGAR_PREGUNTAS_ROLES_21_26_PARTE2.sql
```

---

## ✅ Paso 2: Verificar Base de Datos (2 min)

Ejecutar en **SQL Editor**:

```sql
-- Verificar total de preguntas (debe ser 364)
SELECT COUNT(*) as total 
FROM preguntas 
WHERE section = 'Cuestionario';

-- Verificar que todos los roles tengan preguntas
SELECT 
    exclusivo_rol_id,
    COUNT(*) as total_preguntas,
    MIN(id) as primera,
    MAX(id) as ultima
FROM preguntas 
WHERE section = 'Cuestionario'
GROUP BY exclusivo_rol_id
ORDER BY exclusivo_rol_id;
-- Debe mostrar 26 roles (1-26, excepto 20)
```

**Resultado esperado:**
- Total: **364 preguntas**
- Roles: **26 grupos** (excepto rol 20)
- Cada rol: **12 preguntas**

---

## 🔄 Paso 3: Actualizar Frontend (1 min)

El código ya está actualizado en:
- `apps/web/src/app/questionnaire/direct/page.tsx`

**Solo necesitas:**
```bash
# Hacer commit de los cambios
git add apps/web/src/app/questionnaire/direct/page.tsx
git commit -m "feat: Actualizar mapeo de roles para cuestionario (21-26)"
git push
```

---

## 🧪 Paso 4: Probar Localmente (2 min)

```bash
# Iniciar el servidor de desarrollo
cd apps/web
npm run dev

# Abrir en navegador
# http://localhost:3000/questionnaire/direct
```

### Prueba Rápida:
1. Ir a `/profile` y cambiar `type_rol` a "Miembros de RRHH"
2. Ir a `/questionnaire/direct`
3. Verificar que aparezcan 12 preguntas específicas de RRHH
4. Repetir con "Freelancer" y "Consultor"

---

## 📊 Paso 5: Validación Final (1 min)

### Checklist Rápido:
- [ ] Base de datos tiene 364 preguntas
- [ ] Cada rol muestra 12 preguntas
- [ ] Las preguntas son relevantes al rol
- [ ] Se puede navegar entre secciones
- [ ] Las respuestas se guardan correctamente

---

## 🎯 Roles para Probar

### Prueba Mínima (5 roles):
1. **CEO** → Debe mostrar preguntas estratégicas
2. **Miembros de RRHH** → Debe mostrar preguntas operativas de RRHH
3. **Freelancer** → Debe mostrar preguntas de gestión independiente
4. **CTO** → Debe mostrar preguntas técnicas de dirección
5. **Gerencia Media** → Debe mostrar preguntas de gestión de equipos

### Prueba Completa (todos los roles):
Ver `MAPEO_FINAL_COMPLETO_TODOS_LOS_ROLES.md` para lista completa

---

## 🐛 Troubleshooting Rápido

### Problema: "No se encontraron preguntas"
**Solución:**
```sql
-- Verificar que las preguntas existen
SELECT * FROM preguntas 
WHERE exclusivo_rol_id = [ID_DEL_ROL] 
LIMIT 5;
```

### Problema: "Muestra preguntas incorrectas"
**Solución:**
1. Verificar `type_rol` en la tabla `users`
2. Revisar mapeo en `mapTypeRolToExclusivoRolId`
3. Confirmar que el nombre del rol coincide exactamente

### Problema: "Error al guardar respuestas"
**Solución:**
```sql
-- Verificar tabla respuestas
SELECT * FROM respuestas 
WHERE user_id = '[USER_ID]' 
LIMIT 5;
```

---

## 📱 Comandos Útiles

### Ver preguntas de un rol específico:
```sql
SELECT id, codigo, texto 
FROM preguntas 
WHERE exclusivo_rol_id = 21  -- Cambiar por el rol deseado
ORDER BY id;
```

### Ver distribución de preguntas:
```sql
SELECT 
    r.nombre as rol,
    COUNT(p.id) as total_preguntas
FROM roles r
LEFT JOIN preguntas p ON r.id = p.exclusivo_rol_id
GROUP BY r.id, r.nombre
ORDER BY r.id;
```

### Limpiar respuestas de prueba:
```sql
-- ⚠️ CUIDADO: Solo en desarrollo
DELETE FROM respuestas 
WHERE user_id = '[TEST_USER_ID]';
```

---

## 📞 Ayuda Rápida

### Si algo falla:
1. **Revisar logs**: Consola del navegador (F12)
2. **Verificar datos**: SQL Editor en Supabase
3. **Consultar docs**: `MAPEO_FINAL_COMPLETO_TODOS_LOS_ROLES.md`
4. **Rollback**: Restaurar backup de base de datos

### Archivos de referencia:
- **Mapeo completo**: `MAPEO_FINAL_COMPLETO_TODOS_LOS_ROLES.md`
- **Implementación detallada**: `RESUMEN_FINAL_IMPLEMENTACION.md`
- **Scripts SQL**: Carpeta `docs/database/`

---

## ✅ Checklist Final

- [ ] Scripts SQL ejecutados (6 archivos)
- [ ] Verificación de base de datos (364 preguntas)
- [ ] Código frontend actualizado
- [ ] Pruebas locales exitosas
- [ ] Commit y push realizados
- [ ] Documentación revisada

---

## 🎉 ¡Listo!

Si todos los checkboxes están marcados, el sistema está **LISTO PARA PRODUCCIÓN**.

**Tiempo total estimado**: 20 minutos  
**Próximo paso**: Deploy a producción

---

**Versión**: 1.0  
**Fecha**: Enero 2025  
**Estado**: ✅ Listo para usar

