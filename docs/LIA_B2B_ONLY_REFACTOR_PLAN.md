# Plan de Refactorización: LIA Solo para Usuarios B2B

## Resumen Ejecutivo

Este documento detalla el plan para simplificar el flujo de LIA en el planificador de estudios, eliminando toda la lógica relacionada con usuarios B2C y enfocándose exclusivamente en el flujo B2B.

---

## ✅ Cambios Implementados

### 1. `StudyPlannerLIA.tsx` - Componente Principal

#### A. Estado y Types (Líneas ~190-210)
- ✅ Cambiado `userType: 'b2b' | 'b2c' | null` a `userType: 'b2b' | null`
- ✅ Agregado `workTeams: Array<{ name: string; role: string }> | null` al estado
- ✅ Ahora se obtienen TODOS los cursos asignados (no solo los con fecha límite)

#### B. Carga de Datos (Líneas ~540-584)
- ✅ Se extraen los equipos de trabajo (`workTeams`) del usuario
- ✅ Se establece `userType: 'b2b'` directamente en lugar de leerlo del API
- ✅ Se ordenan cursos: primero los con fecha límite, luego los sin fecha

#### C. Mensaje de Bienvenida (Nuevo Flujo)
- ✅ **Nuevo mensaje estructurado:**
  - "¡Bienvenido al Planificador de Estudios! Soy LIA..."
  - "He analizado tu información inicial:"
    - Rol del usuario (si está disponible)
    - Organización/empresa
    - Equipos de trabajo (si pertenece a alguno)
    - Lista de cursos asignados con fechas límite
  - "Para comenzar, dime qué tipo de sesiones te gustaría"
  - Abre automáticamente el modal de tipo de sesiones

#### D. Selección de Tipo de Sesiones (`handleApproachSelection`)
- ✅ **Nuevo flujo después de seleccionar tipo de sesión:**
  - Confirmación de selección con beneficios
  - Muestra fecha límite del curso si existe
  - **Mensaje persuasivo para conectar calendario:**
    - "¿Por qué conectar tu calendario?"
    - Evito conflictos
    - Encuentro tus mejores horarios
    - Personalizo tu experiencia
    - Maximizo tu productividad
  - Nota de privacidad
  - Abre modal de calendario si no está conectado

#### E. Mensaje de Confirmación Final (Línea ~5409)
- ✅ Cambiado de "¿Te sirven estos horarios?" a:
  - "Con este horario puedes completar tus cursos en el tiempo designado por tu administrador."
  - "¿Te parece bien esta recomendación o te gustaría cambiar alguna fecha u hora?"

#### F. Lógica de Lecciones Pendientes (Líneas 5275-5307)
- ✅ Eliminada rama `else` para B2C
- ✅ Simplificado: ahora siempre muestra mensajes B2B

---

## Flujo B2B Implementado

```
1. MENSAJE DE BIENVENIDA
   ├── "¡Bienvenido al Planificador de Estudios! 👋"
   ├── "Soy LIA, tu asistente de aprendizaje personalizado"
   ├── "He analizado tu información inicial:"
   │   ├── Rol: [rol del usuario]
   │   ├── Empresa: [nombre de organización]
   │   ├── Equipo: [nombre del equipo] (si aplica)
   │   └── Cursos asignados:
   │       ├── [Curso 1] (fecha límite: X)
   │       └── [Curso 2] (fecha límite: Y)
   └── "Para comenzar, dime qué tipo de sesiones te gustaría"
       └── [Abre Modal de Tipo de Sesiones]

2. SELECCIÓN DE TIPO DE SESIÓN
   ├── Usuario selecciona: Rápidas / Normales / Largas
   └── LIA responde:
       ├── "¡Excelente elección! ✨"
       ├── "Has seleccionado [tipo de sesiones]"
       ├── "[Beneficio del tipo seleccionado]"
       ├── "Tu organización ha establecido fecha límite: [fecha]"
       ├── "---"
       ├── "¿Por qué conectar tu calendario? 🗓️"
       │   ├── Evito conflictos
       │   ├── Encuentro tus mejores horarios
       │   ├── Personalizo tu experiencia
       │   └── Maximizo tu productividad
       ├── "Solo veré información necesaria 🔒"
       └── "¿Te gustaría conectar tu calendario?"
           └── [Abre Modal de Calendario si no está conectado]

3. ANÁLISIS DE CALENDARIO
   └── Si calendario conectado:
       ├── Analiza eventos y disponibilidad
       └── Genera recomendaciones de horarios

4. RECOMENDACIONES DE HORARIOS
   ├── Lista de slots de estudio sugeridos
   ├── Metas semanales calculadas
   └── "Con este horario puedes completar tus cursos en el tiempo designado"
       └── "¿Te parece bien o te gustaría cambiar alguna fecha u hora?"

5. CONFIRMACIÓN Y GUARDADO
   └── Usuario confirma o ajusta
       └── Se guarda el plan de estudios
```

---

## ⬜ Cambios Pendientes (Opcionales)

### Archivos por Revisar para Eliminar Referencias B2C:

| Archivo | Estado | Descripción |
|---------|--------|-------------|
| `lia-context.service.ts` | ⬜ Pendiente | Tiene instrucciones específicas para B2C en prompts |
| `user-context.service.ts` | ⬜ Pendiente | Tiene método `getB2CCoursePurchases` |
| `user-context.types.ts` | ⬜ Pendiente | Tiene interfaz `B2CCoursePurchase` |
| `useStudyPlannerLIA.ts` | ⬜ Pendiente | Tiene default `'b2c'` en línea 398 |

### Consideraciones:
- Los cambios principales del flujo ya están implementados
- La eliminación de tipos y servicios B2C es para limpieza de código
- El flujo funcional ya es 100% B2B

---

## Testing Manual Sugerido

1. **Acceder al planificador como usuario B2B**
   - Verificar que el mensaje de bienvenida muestre rol, empresa y equipos
   - Verificar que los cursos asignados se listen correctamente

2. **Seleccionar tipo de sesiones**
   - Verificar que el modal se abra automáticamente
   - Verificar el mensaje persuasivo sobre conexión de calendario

3. **Conectar calendario**
   - Si ya está conectado, debe detectarlo y continuar
   - Si no está conectado, debe abrir modal

4. **Revisar recomendaciones**
   - Verificar que muestre horarios sugeridos
   - Verificar mensaje de confirmación final

---

**Fecha de Última Actualización:** 2025-12-20
**Autor:** Claude (Asistente de Código)
**Estado:** Implementación Principal Completada
