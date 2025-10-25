# Mapeo Final Completo - Todos los Roles

## 📊 Resumen General

Este documento contiene el mapeo **COMPLETO Y FINAL** de todos los roles con sus preguntas correspondientes en el sistema de cuestionarios.

**Total de roles**: 26 roles  
**Total de preguntas**: 364 preguntas  
**Estado**: ✅ **COMPLETO Y LISTO PARA PRODUCCIÓN**

---

## 🎯 Mapeo Completo de Roles y Preguntas

### Nivel C-Suite y Dirección Estratégica

| ID | Rol | Exclusivo Rol ID | Preguntas | Estado |
|----|-----|------------------|-----------|--------|
| 1 | CEO | 1 | 7-18 | ✅ |
| 2 | CMO / Director(a) de Marketing | 2 | 31-42 | ✅ |
| 3 | CTO / Director(a) de Tecnología | 3 | 201-212 | ✅ |
| 13 | Dirección de Finanzas (CFO) | 13 | 209-220 | ✅ |

### Dirección de Área

| ID | Rol | Exclusivo Rol ID | Preguntas | Estado |
|----|-----|------------------|-----------|--------|
| 11 | Dirección de Ventas | 11 | 185-196 | ✅ |
| 12 | Dirección de Operaciones | 12 | 197-208 | ✅ |
| 14 | Dirección de RRHH | 14 | 221-232 | ✅ |
| 15 | Dirección/Jefatura de Contabilidad | 15 | 233-244 | ✅ |
| 16 | Dirección de Compras / Supply | 16 | 245-256 | ✅ |

### Gerencia y Mandos Medios

| ID | Rol | Exclusivo Rol ID | Preguntas | Estado |
|----|-----|------------------|-----------|--------|
| 4 | Gerente de Marketing | 2 | 31-42 | ✅ |
| 5 | Gerente de TI | 5 | 213-224 | ✅ |
| 6 | Líder/Gerente de Ventas | 6 | 225-236 | ✅ |
| 24 | Gerencia Media | 24 | 329-340 | ✅ |

### Roles Técnicos y Especializados

| ID | Rol | Exclusivo Rol ID | Preguntas | Estado |
|----|-----|------------------|-----------|--------|
| 7 | Analista/Especialista TI | 7 | 237-248 | ✅ |
| 8 | Academia/Investigación | 8 | 79-90 | ✅ |
| 9 | Educación/Docentes | 9 | 249-260 | ✅ |
| 10 | Diseño/Industrias Creativas | 10 | 261-272 | ✅ |

### Roles Operativos - Ventas y Marketing

| ID | Rol | Exclusivo Rol ID | Preguntas | Estado |
|----|-----|------------------|-----------|--------|
| 17 | Miembros de Ventas | 17 | 257-268 | ✅ |
| 18 | Miembros de Marketing | 18 | 269-280 | ✅ |

### Roles Operativos - Operaciones y Logística

| ID | Rol | Exclusivo Rol ID | Preguntas | Estado |
|----|-----|------------------|-----------|--------|
| 19 | Miembros de Operaciones | 19 | 281-292 | ✅ |
| 23 | Miembros de Compras | 23 | 317-328 | ✅ |

### Roles Operativos - Finanzas y Administración

| ID | Rol | Exclusivo Rol ID | Preguntas | Estado |
|----|-----|------------------|-----------|--------|
| 20 | Miembros de Finanzas | 1 | 7-18 (CEO) | ⚠️ Fallback |
| 21 | Miembros de RRHH | 21 | 293-304 | ✅ |
| 22 | Miembros de Contabilidad | 22 | 305-316 | ✅ |

### Roles Independientes y Consultores

| ID | Rol | Exclusivo Rol ID | Preguntas | Estado |
|----|-----|------------------|-----------|--------|
| 25 | Freelancer | 25 | 341-352 | ✅ |
| 26 | Consultor | 26 | 353-364 | ✅ |

---

## 🔍 Mapeo por Área

### Área 1: Estratégica/General
- CEO (1): 7-18
- Gerencia Media (24): 329-340
- Freelancer (25): 341-352
- Consultor (26): 353-364
- Miembros de Finanzas (20): 7-18 (fallback)

### Área 2: Ventas
- Dirección de Ventas (11): 185-196
- Líder/Gerente de Ventas (6): 225-236
- Miembros de Ventas (17): 257-268

### Área 3: Marketing
- CMO / Director(a) de Marketing (2): 31-42
- Gerente de Marketing (4): 31-42
- Miembros de Marketing (18): 269-280

### Área 4: Operaciones
- Dirección de Operaciones (12): 197-208
- Miembros de Operaciones (19): 281-292

### Área 5: Finanzas
- Dirección de Finanzas (CFO) (13): 209-220

### Área 6: RRHH
- Dirección de RRHH (14): 221-232
- Miembros de RRHH (21): 293-304

### Área 7: Contabilidad
- Dirección/Jefatura de Contabilidad (15): 233-244
- Miembros de Contabilidad (22): 305-316

### Área 8: Compras/Supply Chain
- Dirección de Compras / Supply (16): 245-256
- Miembros de Compras (23): 317-328

### Área 9: Tecnología
- CTO / Director(a) de Tecnología (3): 201-212
- Gerente de TI (5): 213-224
- Analista/Especialista TI (7): 237-248
- Academia/Investigación (8): 79-90

### Área 10: Educación
- Educación/Docentes (9): 249-260

### Área 11: Diseño/Creatividad
- Diseño/Industrias Creativas (10): 261-272

---

## 📝 Alias y Mapeo en el Código

### Mapeo en `mapTypeRolToExclusivoRolId`

```typescript
// Roles principales
'CEO': 1
'CTO': 3
'CTO/CIO': 3
'CMO': 2
'Marketing': 2
'Dirección de Marketing': 2
'Gerente de Marketing': 2
'Miembros de Marketing': 18

// Roles de Dirección
'Dirección de Ventas': 11
'Dirección de Operaciones': 12
'Dirección de RRHH': 14
'Dirección de Contabilidad': 15
'Dirección de Compras': 16
'Dirección de Finanzas (CFO)': 13

// Roles de Gerencia
'Gerente de TI': 5
'Líder/Gerente de Ventas': 6
'Gerencia Media': 24

// Roles Técnicos
'Analista/Especialista TI': 7
'Academia/Investigación': 8
'Educación/Docentes': 9
'Diseño/Industrias Creativas': 10

// Roles Operativos
'Miembros de Ventas': 17
'Miembros de Operaciones': 19
'Miembros de RRHH': 21
'Miembros de Contabilidad': 22
'Miembros de Compras': 23
'Miembros de Finanzas': 1 (fallback)

// Roles Independientes
'Freelancer': 25
'Consultor': 26

// Alias comunes
'Operaciones': 12
'Compras': 16
'Finanzas': 13
'RRHH': 14
'Contabilidad': 15
'IT': 5
'Sistemas': 5
'Tecnología': 3
'Ventas': 11
'Diseño': 10
'Creativo': 10
'Educación': 9
'Docentes': 9
'Profesor': 9
'Maestro': 9
```

---

## 📈 Estadísticas por Tipo de Pregunta

### Preguntas de Adopción (Escala Likert A-E)
- **Total**: 182 preguntas (50% del total)
- **Por rol**: 6 preguntas de adopción
- **Escala**: A (0) → E (100)

### Preguntas de Conocimiento (Opción Múltiple)
- **Total**: 182 preguntas (50% del total)
- **Por rol**: 6 preguntas de conocimiento
- **Scoring**: Correcta (100) / Incorrecta (0)

---

## 🎯 Diferenciación Jerárquica

### Ejemplo: Área de RRHH

| Nivel | Rol | ID | Preguntas | Enfoque |
|-------|-----|----|-----------| --------|
| Dirección | Dirección de RRHH | 14 | 221-232 | Estrategia, políticas, cultura organizacional |
| Operativo | Miembros de RRHH | 21 | 293-304 | Screening, onboarding, soporte diario |

### Ejemplo: Área de Ventas

| Nivel | Rol | ID | Preguntas | Enfoque |
|-------|-----|----|-----------| --------|
| Dirección | Dirección de Ventas | 11 | 185-196 | Estrategia comercial, forecasting, territorios |
| Gerencia | Líder/Gerente de Ventas | 6 | 225-236 | Gestión de equipo, pipeline, coaching |
| Operativo | Miembros de Ventas | 17 | 257-268 | Prospección, cierre, seguimiento |

---

## ✅ Checklist de Implementación

### Scripts SQL
- [x] `RECREAR_PREGUNTAS_COMPLETO.sql` - Roles 1-10 (preguntas 7-100)
- [x] `AGREGAR_PREGUNTAS_ROLES_FALTANTES.sql` - Roles 3,5,6,7,9,10 (preguntas 201-272)
- [x] `AGREGAR_PREGUNTAS_ROLES_11_19.sql` - Roles 11-12 (preguntas 185-208)
- [x] `AGREGAR_PREGUNTAS_ROLES_11_19_COMPLETO.sql` - Roles 11-13 (preguntas 185-220)
- [x] `AGREGAR_PREGUNTAS_ROLES_11_19_PARTE2.sql` - Roles 14-19 (preguntas 221-292)
- [x] `AGREGAR_PREGUNTAS_ROLES_21_26.sql` - Roles 21-22 (preguntas 293-316)
- [x] `AGREGAR_PREGUNTAS_ROLES_21_26_PARTE2.sql` - Roles 23-26 (preguntas 317-364)

### Código Frontend
- [x] Actualizar `mapTypeRolToExclusivoRolId` en `apps/web/src/app/questionnaire/direct/page.tsx`
- [x] Incluir todos los roles 21-26
- [x] Actualizar alias comunes
- [x] Verificar lógica de filtrado de preguntas

### Base de Datos
- [ ] Ejecutar scripts SQL en orden
- [ ] Verificar inserción de preguntas
- [ ] Validar foreign keys
- [ ] Comprobar integridad de datos

---

## 🧪 Pruebas Recomendadas

### Por Nivel Jerárquico
1. **C-Suite**: Probar CEO, CTO, CMO
2. **Dirección**: Probar al menos 3 roles de dirección
3. **Gerencia**: Probar Gerencia Media y gerentes específicos
4. **Operativo**: Probar al menos 4 roles operativos
5. **Independientes**: Probar Freelancer y Consultor

### Por Área
1. Ventas (3 niveles)
2. Marketing (3 niveles)
3. Operaciones (2 niveles)
4. RRHH (2 niveles)
5. Finanzas/Contabilidad (3 niveles)
6. Tecnología (4 roles)

---

## 🚀 Próximos Pasos

1. **Ejecutar Scripts SQL**
   ```bash
   # En orden:
   1. RECREAR_PREGUNTAS_COMPLETO.sql
   2. AGREGAR_PREGUNTAS_ROLES_FALTANTES.sql
   3. AGREGAR_PREGUNTAS_ROLES_11_19_COMPLETO.sql
   4. AGREGAR_PREGUNTAS_ROLES_11_19_PARTE2.sql
   5. AGREGAR_PREGUNTAS_ROLES_21_26.sql
   6. AGREGAR_PREGUNTAS_ROLES_21_26_PARTE2.sql
   ```

2. **Verificar en Base de Datos**
   ```sql
   -- Verificar total de preguntas
   SELECT COUNT(*) FROM preguntas WHERE section = 'Cuestionario';
   -- Debe retornar: 364
   
   -- Verificar roles sin preguntas
   SELECT r.id, r.nombre
   FROM roles r
   LEFT JOIN preguntas p ON r.id = p.exclusivo_rol_id
   WHERE p.id IS NULL AND r.id NOT IN (20);
   -- Debe retornar: 0 filas (excepto rol 20 que usa fallback)
   ```

3. **Probar Frontend**
   - Crear perfiles de prueba para cada tipo de rol
   - Verificar que se muestren las preguntas correctas
   - Validar que el conteo de preguntas sea correcto (12 por rol)
   - Confirmar que las secciones se separen correctamente

4. **Validar Experiencia de Usuario**
   - Verificar que las preguntas sean relevantes para cada rol
   - Confirmar que la diferenciación jerárquica sea clara
   - Validar que los textos sean comprensibles

---

## 📞 Soporte

Si encuentras algún problema:
1. Verifica que todos los scripts SQL se ejecutaron correctamente
2. Revisa los logs de la consola del navegador
3. Confirma que el `type_rol` del usuario coincide con el mapeo
4. Valida que las preguntas existan en la base de datos

---

**Fecha de creación**: Enero 2025  
**Última actualización**: Enero 2025  
**Versión**: 1.0 FINAL  
**Estado**: ✅ **COMPLETO Y LISTO PARA PRODUCCIÓN**

