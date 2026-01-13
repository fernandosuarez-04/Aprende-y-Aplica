# Guía de Pruebas - Sistema de Contexto Dinámico de LIA

## 📋 Resumen

Esta guía te ayudará a probar las **Fases 1, 2 y 3** del nuevo sistema de contexto dinámico de LIA. El sistema está **ACTIVADO** mediante el feature flag `USE_NEW_CONTEXT_SYSTEM = true`.

## 🎯 Objetivo de las Pruebas

Verificar que:
1. **Fase 1**: El sistema básico funciona (UserContextProvider)
2. **Fase 2**: Los providers adicionales funcionan (Course, Platform) y el caché funciona
3. **Fase 3**: El BugReportContextProvider detecta bugs y proporciona contexto relevante

---

## 🚀 Preparación

### 1. Verificar que el Feature Flag está Activado

El feature flag está en: `apps/web/src/app/api/lia/chat/route.ts` (línea ~1023)

```typescript
const USE_NEW_CONTEXT_SYSTEM = true; // ✅ Debe estar en true
```

### 2. Iniciar el Servidor de Desarrollo

```bash
cd apps/web
npm run dev
```

### 3. Acceder a la Plataforma

1. Inicia sesión en la plataforma
2. Asegúrate de estar en una página donde LIA esté disponible (cualquier página excepto `/` o `/auth/*`)

### 4. Abrir la Consola del Navegador

- Presiona `F12` o `Ctrl+Shift+I` (Windows/Linux) / `Cmd+Option+I` (Mac)
- Ve a la pestaña **Console**
- Filtra por "Contexto" o "LIA" para ver los logs

### 5. Abrir la Consola del Servidor

- En la terminal donde corre `npm run dev`
- Busca logs que empiecen con `✅ Contexto construido con nuevo sistema:`

---

## 🧪 Pruebas por Fase

## FASE 1: UserContextProvider

### Objetivo
Verificar que LIA tiene acceso al contexto del usuario (nombre, rol, organización).

### Pruebas

#### Prueba 1.1: Verificar Contexto de Usuario Básico

**Pasos:**
1. Abre el chat de LIA (botón flotante en la esquina inferior derecha)
2. Envía el mensaje: `"¿Quién soy?"` o `"¿Cuál es mi información?"`

**Resultado Esperado:**
- LIA debería mencionar tu nombre, rol y organización
- En la consola del servidor deberías ver:
  ```
  ✅ Contexto construido con nuevo sistema: {
    providers: ['user', ...],
    fragments: 1,
    ...
  }
  ```

**Verificación en Consola:**
- Busca: `✅ Providers de contexto registrados: ['user', 'course', 'platform', 'bug-report']`
- Busca: `✅ Contexto construido con nuevo sistema:`

#### Prueba 1.2: Verificar Caché de Usuario

**Pasos:**
1. Envía un mensaje a LIA
2. Espera 10 segundos
3. Envía otro mensaje diferente

**Resultado Esperado:**
- El segundo mensaje debería ser más rápido (caché hit)
- En los logs deberías ver `cacheHits: 1` en el segundo mensaje

---

## FASE 2: CourseContextProvider y PlatformContextProvider

### Objetivo
Verificar que LIA tiene acceso a información de cursos y estadísticas de la plataforma.

### Pruebas

#### Prueba 2.1: Verificar Contexto de Cursos

**Pasos:**
1. Asegúrate de tener cursos asignados en tu cuenta
2. Abre el chat de LIA
3. Envía: `"¿Qué cursos tengo asignados?"` o `"Muéstrame mi progreso"`

**Resultado Esperado:**
- LIA debería mencionar tus cursos asignados
- Debería mencionar tu progreso en lecciones
- En la consola deberías ver `providers: ['user', 'course', ...]`

**Verificación en Consola:**
- Busca: `✅ Contexto construido con nuevo sistema: { providers: ['user', 'course', ...] }`

#### Prueba 2.2: Verificar Contexto de Lección Actual

**Pasos:**
1. Ve a una página de curso: `/courses/[slug]/learn`
2. Abre el chat de LIA (debería estar integrado en el panel lateral)
3. Envía: `"¿Sobre qué lección estoy?"` o `"Resúmeme esta lección"`

**Resultado Esperado:**
- LIA debería mencionar la lección actual
- Si hay transcripción disponible, debería poder responder preguntas sobre el contenido
- En la consola deberías ver contexto de lección incluido

#### Prueba 2.3: Verificar Contexto de Plataforma

**Pasos:**
1. Abre el chat de LIA
2. Envía: `"¿Cuántos usuarios hay en la plataforma?"` o `"Dame estadísticas de la plataforma"`

**Resultado Esperado:**
- LIA debería mencionar estadísticas generales (si tiene acceso)
- En la consola deberías ver `providers: [..., 'platform']`

**Nota:** El PlatformContextProvider tiene prioridad baja, así que puede no incluirse siempre.

#### Prueba 2.4: Verificar Caché de Cursos

**Pasos:**
1. Envía: `"¿Qué cursos tengo?"`
2. Espera 5 segundos
3. Envía: `"¿Cuál es mi progreso?"`

**Resultado Esperado:**
- El segundo mensaje debería usar caché (más rápido)
- En los logs deberías ver `cacheHits` incrementado

---

## FASE 3: BugReportContextProvider

### Objetivo
Verificar que LIA detecta intención de bug y proporciona contexto relevante.

### Pruebas

#### Prueba 3.1: Detectar Intención de Bug

**Pasos:**
1. Abre el chat de LIA
2. Envía un mensaje con palabras clave de bug:
   - `"Hay un error en la página"`
   - `"No funciona el botón de guardar"`
   - `"La página se cuelga"`
   - `"Hay un bug en el formulario"`

**Resultado Esperado:**
- En la consola del servidor deberías ver:
  ```
  ✅ Contexto construido con nuevo sistema: {
    providers: [..., 'bug-report'],
    ...
  }
  ```
- El `contextType` debería ser `'bug-report'` en lugar de `'general'`

**Verificación en Consola:**
- Busca: `providers: ['user', 'course', 'platform', 'bug-report']`
- Busca: `contextType: 'bug-report'`

#### Prueba 3.2: Verificar Contexto de Bugs Similares

**Prerequisito:** Debe haber bugs reportados anteriormente en la misma página.

**Pasos:**
1. Ve a una página donde se hayan reportado bugs antes (ej: `/courses/[slug]/learn`)
2. Abre el chat de LIA
3. Envía: `"Hay un error al cargar el video"` o `"El reproductor no funciona"`

**Resultado Esperado:**
- LIA debería mencionar si hay bugs similares reportados
- Debería sugerir revisar soluciones aplicadas a bugs similares
- En la consola deberías ver que se consultó la BD para bugs similares

**Verificación en Consola:**
- Busca logs de Supabase queries a `reportes_problemas`
- Busca: `bug-similar-` en las claves de caché

#### Prueba 3.3: Verificar Contexto de Bugs del Usuario

**Prerequisito:** Debes haber reportado bugs anteriormente.

**Pasos:**
1. Abre el chat de LIA
2. Envía: `"Hay un problema con la página"`

**Resultado Esperado:**
- Si has reportado bugs antes, LIA debería considerar si el bug actual está relacionado
- En la consola deberías ver consultas a bugs del usuario

**Verificación en Consola:**
- Busca: `bug-user-recent-` en las claves de caché

#### Prueba 3.4: Verificar Contexto Técnico (Componentes y Rutas)

**Pasos:**
1. Ve a diferentes páginas y reporta bugs:
   - `/courses/[slug]/learn` → `"Hay un error en el reproductor"`
   - `/study-planner` → `"El calendario no carga"`
   - `/communities` → `"Los posts no aparecen"`

**Resultado Esperado:**
- LIA debería inferir componentes posibles basados en la ruta
- Debería mencionar patrones de error comunes para ese tipo de página
- En la consola deberías ver `componentHints` y `errorPatterns`

**Verificación en Consola:**
- Busca en los logs del provider: `Componentes posibles en esta página:`
- Busca: `Patrones de error comunes en este tipo de página:`

#### Prueba 3.5: Verificar Reporte Automático de Bug

**Pasos:**
1. Abre el chat de LIA
2. Envía: `"Hay un bug: el botón de guardar no funciona"`
3. Observa la respuesta de LIA

**Resultado Esperado:**
- LIA debería generar un reporte automático usando el formato `[[BUG_REPORT:{...}]]`
- El reporte debería incluir información técnica relevante
- El reporte debería guardarse en la tabla `reportes_problemas`

**Verificación:**
- Revisa la tabla `reportes_problemas` en Supabase
- Busca el reporte reciente con `source: 'lia_chat_automatic'`

---

## 📊 Métricas a Observar

### En la Consola del Servidor

Busca estos logs después de cada mensaje:

```javascript
✅ Contexto construido con nuevo sistema: {
  providers: ['user', 'course', 'platform', 'bug-report'], // Providers usados
  fragments: 4, // Número de fragmentos de contexto
  totalTokens: 1234, // Tokens totales usados
  buildTime: 150, // Tiempo de construcción en ms
  cacheHits: 2, // Hits de caché
  cacheMisses: 2 // Misses de caché
}
```

### Métricas Esperadas

- **buildTime**: < 200ms (p95) ✅
- **cacheHits**: Debería aumentar en mensajes subsecuentes
- **totalTokens**: Debería ser razonable (< 4000 tokens típicamente)

---

## 🐛 Troubleshooting

### Problema: No veo logs del nuevo sistema

**Solución:**
1. Verifica que `USE_NEW_CONTEXT_SYSTEM = true`
2. Reinicia el servidor (`Ctrl+C` y `npm run dev` nuevamente)
3. Verifica que no hay errores en la consola del servidor

### Problema: LIA no detecta bugs

**Solución:**
1. Verifica que el mensaje contiene palabras clave (error, bug, falla, problema, etc.)
2. Revisa la función `detectBugIntent()` en el endpoint
3. Verifica los logs: deberías ver `contextType: 'bug-report'`

### Problema: No se obtienen bugs similares

**Solución:**
1. Verifica que hay bugs en la BD en la tabla `reportes_problemas`
2. Verifica que los bugs están en estado `'resuelto'` o `'en_progreso'`
3. Verifica que la URL de la página coincide con `pagina_url` en los bugs

### Problema: El caché no funciona

**Solución:**
1. Verifica que `ContextCacheService` está siendo usado correctamente
2. Revisa los logs de `cacheHits` y `cacheMisses`
3. Asegúrate de que el TTL no es muy corto

### Problema: Errores de TypeScript

**Solución:**
```bash
cd apps/web
npx tsc --noEmit
```

Si hay errores, revísalos y corrígelos.

---

## ✅ Checklist de Pruebas

### Fase 1
- [ ] LIA menciona información del usuario
- [ ] Se ve el provider `user` en los logs
- [ ] El caché funciona para datos de usuario

### Fase 2
- [ ] LIA menciona cursos asignados
- [ ] LIA menciona progreso en lecciones
- [ ] Se ve el provider `course` en los logs
- [ ] Se ve el provider `platform` en los logs (opcional)
- [ ] El caché funciona para datos de cursos

### Fase 3
- [ ] LIA detecta intención de bug
- [ ] Se ve el provider `bug-report` en los logs cuando hay intención de bug
- [ ] LIA menciona bugs similares (si existen)
- [ ] LIA menciona bugs recientes del usuario (si existen)
- [ ] LIA genera reportes automáticos de bugs
- [ ] Los reportes se guardan en la BD

---

## 📝 Notas Adicionales

### Logs Importantes a Buscar

1. **Al iniciar el servidor:**
   ```
   ✅ Providers de contexto registrados: ['user', 'course', 'platform', 'bug-report']
   ```

2. **En cada mensaje (si el nuevo sistema está activo):**
   ```
   ✅ Contexto construido con nuevo sistema: { ... }
   ```

3. **Si hay error:**
   ```
   ⚠️ Error construyendo contexto con nuevo sistema, usando sistema antiguo: ...
   ```

### Desactivar el Sistema

Si necesitas desactivar el nuevo sistema temporalmente:

```typescript
const USE_NEW_CONTEXT_SYSTEM = false; // Cambiar a false
```

El sistema automáticamente usará el sistema antiguo como fallback.

---

## 🎉 Próximos Pasos

Una vez que todas las pruebas pasen:

1. **Monitorear en producción:** Observar métricas de rendimiento
2. **Recopilar feedback:** Ver cómo LIA responde con el nuevo contexto
3. **Ajustar TTLs:** Optimizar tiempos de caché según uso real
4. **Fase 4:** Implementar priorización inteligente y optimizaciones

---

**Última actualización:** Diciembre 2024  
**Versión:** 1.0






