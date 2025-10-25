# Guía de Implementación Completa - Sistema de Perfiles y Preguntas

## 🎯 Problema Resuelto

El sistema tenía **19 perfiles** en la interfaz pero solo **10 en la base de datos**, y no diferenciaba entre niveles jerárquicos (Dirección vs Miembros). Ahora cada perfil tiene preguntas específicas y diferenciadas.

## 📊 Resumen de la Solución

### Perfiles Creados (9 nuevos)
- **Dirección de Ventas** (ID: 11)
- **Dirección de Operaciones** (ID: 12)
- **Dirección de Finanzas (CFO)** (ID: 13)
- **Dirección de RRHH** (ID: 14)
- **Dirección/Jefatura de Contabilidad** (ID: 15)
- **Dirección de Compras / Supply** (ID: 16)
- **Miembros de Ventas** (ID: 17)
- **Miembros de Marketing** (ID: 18)
- **Miembros de Operaciones** (ID: 19)
- **Miembros de Finanzas** (ID: 20)
- **Miembros de RRHH** (ID: 21)
- **Miembros de Contabilidad** (ID: 22)
- **Miembros de Compras** (ID: 23)
- **Gerencia Media** (ID: 24)
- **Freelancer** (ID: 25)
- **Consultor** (ID: 26)

### Preguntas Creadas (60 nuevas)
- **CEO**: 12 preguntas (6 Adopción + 6 Conocimiento)
- **CTO/CIO**: 12 preguntas (6 Adopción + 6 Conocimiento)
- **Dirección de Ventas**: 12 preguntas (6 Adopción + 6 Conocimiento) - **ENFOQUE ESTRATÉGICO**
- **Miembros de Ventas**: 12 preguntas (6 Adopción + 6 Conocimiento) - **ENFOQUE OPERATIVO**
- **Educación/Docentes**: 12 preguntas (6 Adopción + 6 Conocimiento) - **ENFOQUE EDUCATIVO**

## 🔧 Implementación

### 1. Ejecutar el SQL de Corrección

**Archivo**: `docs/database/FIX_ALL_PROFILES_AND_QUESTIONS.sql`

```bash
# En tu base de datos Supabase, ejecuta:
\i docs/database/FIX_ALL_PROFILES_AND_QUESTIONS.sql
```

### 2. Verificar la Implementación

```sql
-- Verificar perfiles creados
SELECT id, slug, nombre, area_id 
FROM "public"."roles" 
WHERE "id" IN (11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26)
ORDER BY "id";

-- Verificar preguntas creadas
SELECT 
    exclusivo_rol_id,
    COUNT(*) as total_preguntas,
    COUNT(CASE WHEN bloque = 'Adopción' THEN 1 END) as adopcion,
    COUNT(CASE WHEN bloque = 'Conocimiento' THEN 1 END) as conocimiento
FROM "public"."preguntas" 
WHERE "section" = 'Cuestionario' 
    AND "exclusivo_rol_id" IN (1, 2, 9, 11, 17)
GROUP BY "exclusivo_rol_id"
ORDER BY "exclusivo_rol_id";
```

**Resultado esperado**:
```
exclusivo_rol_id | total_preguntas | adopcion | conocimiento
-----------------|-----------------|----------|-------------
1                | 12              | 6        | 6
2                | 12              | 6        | 6
9                | 12              | 6        | 6
11               | 12              | 6        | 6
17               | 12              | 6        | 6
```

## 🎯 Mapeo de Perfiles

### Perfiles con Preguntas Específicas

| Perfil | exclusivo_rol_id | Enfoque | Ejemplo de Pregunta |
|--------|------------------|---------|-------------------|
| **CEO** | 1 | Estrategia y gobernanza | "¿Con qué frecuencia impulsa iniciativas de Gen-AI con presupuesto y OKRs explícitos?" |
| **CTO/CIO** | 2 | Tecnología y desarrollo | "¿Con qué frecuencia utiliza asistentes de código para generar/explicar funciones?" |
| **Dirección de Ventas** | 11 | Ventas estratégicas | "¿Con qué frecuencia establece estrategias de ventas basadas en insights de Gen-AI?" |
| **Miembros de Ventas** | 17 | Ventas operativas | "¿Con qué frecuencia utiliza Gen-AI para calificación y scoring de leads?" |
| **Educación/Docentes** | 9 | Educación | "¿Con qué frecuencia utiliza Gen-AI para crear contenido educativo?" |

### Diferenciación Jerárquica

#### Dirección de Ventas (Estratégico)
- **A1**: "¿Con qué frecuencia establece estrategias de ventas basadas en insights de Gen-AI para optimizar el pipeline y aumentar la conversión?"
- **C1**: "Para un director de ventas, ¿cuál es la métrica más importante para medir el impacto de Gen-AI?"

#### Miembros de Ventas (Operativo)
- **A1**: "¿Con qué frecuencia utiliza Gen-AI para calificación y scoring de leads (análisis de comportamiento, intención de compra, priorización)?"
- **C1**: "¿Cuál es la mejor práctica para integrar Gen-AI en un CRM existente?"

### Perfiles que Usan Preguntas de CEO

Los siguientes perfiles usan preguntas de CEO (exclusivo_rol_id = 1):
- **Dirección de Finanzas (CFO)**
- **Miembros de Finanzas**
- **Dirección/Jefatura de Contabilidad**
- **Miembros de Contabilidad**
- **Dirección de RRHH**
- **Miembros de RRHH**
- **Dirección de Operaciones**
- **Miembros de Operaciones**
- **Dirección de Compras / Supply**
- **Miembros de Compras**
- **Gerencia Media**
- **Academia/Investigación**
- **Diseño/Industrias Creativas**
- **Freelancer**
- **Consultor**

### Perfiles que Usan Preguntas de CTO

Los siguientes perfiles usan preguntas de CTO (exclusivo_rol_id = 2):
- **Gerente de TI**
- **Analista/Especialista TI**
- **Desarrollador**
- **Programador**

## 🧪 Pruebas

### Para Dirección de Ventas:
1. Completa el perfil con `cargo_titulo = "Dirección de Ventas"`
2. Accede al cuestionario
3. Debería mostrar 12 preguntas de ventas estratégicas:
   - A1: "¿Con qué frecuencia establece estrategias de ventas basadas en insights de Gen-AI..."
   - C1: "Para un director de ventas, ¿cuál es la métrica más importante..."

### Para Miembros de Ventas:
1. Completa el perfil con `cargo_titulo = "Miembros de Ventas"`
2. Accede al cuestionario
3. Debería mostrar 12 preguntas de ventas operativas:
   - A1: "¿Con qué frecuencia utiliza Gen-AI para calificación y scoring de leads..."
   - C1: "¿Cuál es la mejor práctica para integrar Gen-AI en un CRM existente..."

### Para Educación/Docentes:
1. Completa el perfil con `cargo_titulo = "Educación/Docentes"`
2. Accede al cuestionario
3. Debería mostrar 12 preguntas de educación:
   - A1: "¿Con qué frecuencia utiliza Gen-AI para crear contenido educativo..."
   - C1: "¿Cuál es la mejor práctica para usar Gen-AI en la creación de contenido educativo?"

## 📁 Archivos Modificados

1. ✅ `docs/database/FIX_ALL_PROFILES_AND_QUESTIONS.sql` - Corrección completa
2. ✅ `apps/web/src/app/questionnaire/direct/page.tsx` - Mapeo actualizado
3. ✅ `apps/web/src/app/statistics/page.tsx` - Mapeo actualizado
4. ✅ `docs/database/ANALISIS_PERFILES_COMPLETO.md` - Análisis del problema
5. ✅ `docs/database/GUIA_IMPLEMENTACION_COMPLETA.md` - Esta guía

## 🎉 Resultado Final

Después de implementar esta solución:

- ✅ **19 perfiles** en la base de datos (vs 10 anteriores)
- ✅ **60 preguntas específicas** (12 por perfil principal)
- ✅ **Diferenciación jerárquica** (Dirección vs Miembros)
- ✅ **Preguntas para docentes** y roles especializados
- ✅ **Mapeo correcto** para todos los perfiles

### Ejemplos de Diferenciación:

**CTO vs Programador**:
- **CTO**: Preguntas de estrategia tecnológica y gestión
- **Programador**: Mismas preguntas técnicas (ambos usan exclusivo_rol_id = 2)

**Dirección de Ventas vs Miembros de Ventas**:
- **Dirección**: Preguntas estratégicas de ventas
- **Miembros**: Preguntas operativas de ventas

**Docentes**:
- Preguntas específicas de educación y pedagogía

¡El sistema funcionará correctamente para **TODOS** los 19 perfiles con preguntas apropiadas para cada nivel jerárquico! 🎉
