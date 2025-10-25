# Instrucciones para Corregir el Sistema de Preguntas

## Problema Identificado

El sistema actual muestra preguntas incorrectas para cada rol:
- **CTO/CIO** → Muestra preguntas de CEO
- **Gerente Programador** → Muestra preguntas de CEO
- **Ventas** → Muestra preguntas de Marketing
- **Marketing** → Muestra preguntas de CTO

## Solución Completa

### 1. Ejecutar el SQL de Corrección

**Archivo**: `docs/database/FIX_ALL_QUESTIONS.sql`

```bash
# En tu base de datos Supabase, ejecuta:
\i docs/database/FIX_ALL_QUESTIONS.sql
```

Este archivo:
- ✅ Crea 48 preguntas específicas (12 por rol)
- ✅ 4 roles principales: CEO, CTO, Marketing, Ventas
- ✅ Cada rol tiene 6 preguntas de Adopción + 6 de Conocimiento
- ✅ Incluye verificación final

### 2. Mapeo Correcto de Roles

| Rol | exclusivo_rol_id | Preguntas Mostradas |
|-----|------------------|-------------------|
| **CEO** | 1 | Estrategia y gobernanza |
| **CTO/CIO** | 2 | Tecnología y desarrollo |
| **Marketing** | 3 | Marketing y creatividad |
| **Ventas** | 6 | Ventas y CRM |

### 3. Roles que Usan Preguntas de CEO

Los siguientes roles usan preguntas de CEO (exclusivo_rol_id = 1):
- CFO, Finanzas, Contabilidad
- RRHH, Operaciones, Compras
- Gerencia Media
- Freelancer, Consultor

### 4. Roles que Usan Preguntas de CTO

Los siguientes roles usan preguntas de CTO (exclusivo_rol_id = 2):
- Gerente de TI, Analista de TI
- Desarrollador, Programador
- Especialista TI

## Verificación

Después de ejecutar el SQL, verifica que:

```sql
SELECT 
    exclusivo_rol_id,
    COUNT(*) as total_preguntas,
    COUNT(CASE WHEN bloque = 'Adopción' THEN 1 END) as adopcion,
    COUNT(CASE WHEN bloque = 'Conocimiento' THEN 1 END) as conocimiento
FROM "public"."preguntas" 
WHERE "section" = 'Cuestionario' 
    AND "exclusivo_rol_id" IN (1, 2, 3, 6)
GROUP BY "exclusivo_rol_id"
ORDER BY "exclusivo_rol_id";
```

**Resultado esperado**:
```
exclusivo_rol_id | total_preguntas | adopcion | conocimiento
-----------------|-----------------|----------|-------------
1                | 12              | 6        | 6
2                | 12              | 6        | 6
3                | 12              | 6        | 6
6                | 12              | 6        | 6
```

## Pruebas

### Para CTO/CIO:
1. Completa el perfil con `cargo_titulo = "CTO/CIO"`
2. Accede al cuestionario
3. Debería mostrar 12 preguntas de tecnología:
   - A1: "¿Con qué frecuencia utiliza asistentes de código..."
   - C1: "¿Qué es la ventana de contexto en un LLM?"

### Para Gerente Programador:
1. Completa el perfil con `cargo_titulo = "Gerente de TI"`
2. Accede al cuestionario
3. Debería mostrar 12 preguntas de tecnología (mismas que CTO)

### Para Ventas:
1. Completa el perfil con `cargo_titulo = "Director de Ventas"`
2. Accede al cuestionario
3. Debería mostrar 12 preguntas de ventas:
   - A1: "¿Con qué frecuencia utiliza Gen-AI para calificación y scoring de leads..."
   - C1: "¿Cuál es la mejor práctica para integrar Gen-AI en un CRM..."

### Para Marketing:
1. Completa el perfil con `cargo_titulo = "Director de Marketing"`
2. Accede al cuestionario
3. Debería mostrar 12 preguntas de marketing:
   - A1: "¿Con qué frecuencia usa Gen-AI para ideación y copy..."
   - C1: "Práctica que mejora la coherencia del tono de marca"

## Archivos Modificados

1. ✅ `docs/database/FIX_ALL_QUESTIONS.sql` - Corrección de la base de datos
2. ✅ `apps/web/src/app/questionnaire/direct/page.tsx` - Mapeo de roles corregido
3. ✅ `apps/web/src/app/statistics/page.tsx` - Mapeo de roles corregido
4. ✅ `docs/database/ANALISIS_MAPEO_ROLES.md` - Análisis del problema
5. ✅ `docs/database/INSTRUCCIONES_IMPLEMENTACION.md` - Esta guía

## Resultado Final

Después de implementar esta solución:

- ✅ **CEO**: 12 preguntas de estrategia y gobernanza
- ✅ **CTO/CIO**: 12 preguntas de tecnología y desarrollo
- ✅ **Marketing**: 12 preguntas de marketing y creatividad
- ✅ **Ventas**: 12 preguntas de ventas y CRM
- ✅ **Gerente Programador**: 12 preguntas de tecnología (como CTO)
- ✅ **Otros roles**: 12 preguntas de CEO (estratégicas)

¡El sistema funcionará correctamente para todos los roles! 🎉
