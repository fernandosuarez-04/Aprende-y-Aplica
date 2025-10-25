# Análisis Completo de Perfiles

## Perfiles en la Interfaz (19 total)

### Nivel Directivo (Dirección)
1. **CEO (personal)**
2. **CTO/CIO**
3. **Dirección de Ventas**
4. **Dirección de Marketing**
5. **Dirección de Operaciones**
6. **Dirección de Finanzas (CFO)**
7. **Dirección de RRHH**
8. **Dirección/Jefatura de Contabilidad**
9. **Dirección de Compras / Supply**

### Nivel Operativo (Miembros)
10. **Miembros de Ventas**
11. **Miembros de Marketing**
12. **Miembros de Operaciones**
13. **Miembros de Finanzas**
14. **Miembros de RRHH**
15. **Miembros de Contabilidad**
16. **Miembros de Compras**

### Roles Especializados
17. **Gerencia Media**
18. **Freelancer**
19. **Consultor**

## Perfiles en la Base de Datos (10 total)

| id | slug | nombre | area_id |
|----|------|--------|---------|
| 1 | ceo | CEO | NULL |
| 2 | cmo | CMO / Director(a) de Marketing | 3 |
| 3 | cto | CTO / Director(a) de Tecnología | 9 |
| 4 | gerente-marketing | Gerente de Marketing | 3 |
| 5 | gerente-ti | Gerente de TI | 9 |
| 6 | lider-ventas | Líder/Gerente de Ventas | 2 |
| 7 | analista-ti | Analista/Especialista TI | 9 |
| 8 | academia-investigacion | Academia/Investigación | 9 |
| 9 | educacion-docentes | Educación/Docentes | 10 |
| 10 | diseno-industrias-creativas | Diseño/Industrias Creativas | 11 |

## Perfiles Faltantes en la Base de Datos (9 total)

### Nivel Directivo Faltante
- **Dirección de Ventas** (solo existe "Líder/Gerente de Ventas")
- **Dirección de Operaciones**
- **Dirección de Finanzas (CFO)**
- **Dirección de RRHH**
- **Dirección/Jefatura de Contabilidad**
- **Dirección de Compras / Supply**

### Nivel Operativo Faltante
- **Miembros de Ventas**
- **Miembros de Marketing**
- **Miembros de Operaciones**
- **Miembros de Finanzas**
- **Miembros de RRHH**
- **Miembros de Contabilidad**
- **Miembros de Compras**

### Roles Especializados Faltantes
- **Gerencia Media**
- **Freelancer**
- **Consultor**

## Problema de Diferenciación Jerárquica

### Mismo Rol, Diferentes Niveles
- **Dirección de Ventas** vs **Miembros de Ventas**
- **Dirección de Marketing** vs **Miembros de Marketing**
- **Dirección de Operaciones** vs **Miembros de Operaciones**
- **Dirección de Finanzas** vs **Miembros de Finanzas**
- **Dirección de RRHH** vs **Miembros de RRHH**
- **Dirección de Contabilidad** vs **Miembros de Contabilidad**
- **Dirección de Compras** vs **Miembros de Compras**

### Necesidad de Preguntas Diferenciadas

**Nivel Directivo (Dirección)**:
- Preguntas estratégicas
- Toma de decisiones
- Gestión de equipos
- Presupuestos y recursos
- Gobernanza y políticas

**Nivel Operativo (Miembros)**:
- Preguntas operativas
- Uso diario de herramientas
- Implementación de procesos
- Colaboración en equipo
- Aplicación práctica

## Solución Requerida

### 1. Crear Perfiles Faltantes
- Agregar 9 perfiles faltantes a la tabla `roles`
- Asignar `area_id` apropiado para cada uno

### 2. Crear Preguntas Diferenciadas
- **Preguntas para Dirección**: Enfoque estratégico y de gestión
- **Preguntas para Miembros**: Enfoque operativo y práctico
- **Preguntas para Roles Especializados**: Enfoque específico del área

### 3. Actualizar Mapeo
- Mapear cada perfil a su `exclusivo_rol_id` correspondiente
- Diferenciar entre niveles jerárquicos
- Incluir roles especializados

## Resultado Esperado

Cada uno de los 19 perfiles debería tener:
- **12 preguntas específicas** (6 Adopción + 6 Conocimiento)
- **Preguntas apropiadas** para su nivel jerárquico
- **Preguntas relevantes** para su área de especialización
