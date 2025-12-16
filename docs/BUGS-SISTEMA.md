# Documentacion de Bugs del Sistema

**Fecha:** 2025-12-16
**Proyecto:** Aprende y Aplica

---

## Resumen

| Categoria | Cantidad | Prioridad |
|-----------|----------|-----------|
| Faciles (1-2h) | 5 | Baja-Media |
| Media (2-4h) | 7 | Media |
| Dificiles (4h+) | 6 | Alta |
| Backend API | 5 | CRITICA |
| Memory Leaks | 5 | Alta |
| Config/Deps | 4 | CRITICA |
| **TOTAL** | **32+** | - |

---

## BUGS FACILES (1-2 horas)

### 1. Console.logs en produccion
**Archivos afectados:** 478 archivos con 2962 ocurrencias
**Impacto:** Performance, seguridad (expone info)
**Fix:** Configurar regla ESLint `no-console` y remover logs

### 2. Uso excesivo de `as any` (Type Safety)
**Archivos afectados:** 81 archivos
**Principales:**
- `apps/web/src/app/study-planner/dashboard/page.tsx`
- `apps/web/src/features/study-planner/components/StudyPlannerLIA.tsx`
- `apps/web/src/core/components/AIChatAgent/AIChatAgent.tsx`
- `apps/web/src/app/courses/[slug]/learn/page.tsx`

**Fix:** Crear tipos apropiados para cada caso

### 3. TODOs sin implementar criticos
**Archivo:Linea - Descripcion:**
- `core/stores/authStore.ts:35` - API de login no implementada
- `features/profile/hooks/useProfile.ts:392` - Cambio de contrasena no implementado
- `features/admin/hooks/useAdminNews.ts:42` - ID admin hardcodeado
- `app/api/subscriptions/personal/subscribe/route.ts:104` - Integracion pagos faltante

### 4. Alertas nativas en lugar de sistema de notificaciones
**Archivos:**
- `app/profile/page.tsx:280` - usa `alert()` nativo
- `app/profile/page.tsx:840` - usa `alert()` nativo

**Fix:** Implementar sistema de toast/notificaciones

### 5. eslint-disable para hooks
**Archivos con dependencias faltantes en useEffect:**
- `core/components/AIChatAgent/AIChatAgent.tsx:729,1823`
- `features/admin/components/AdminNotifications.tsx:150`
- `features/business-panel/components/BusinessReports.tsx:102`
- `features/business-panel/components/BusinessThemeCustomizer.tsx:90,311`
- `app/dashboard/notifications/page.tsx:68`
- `features/auth/components/AuthTabs/AuthTabs.tsx:82`

**Riesgo:** Bugs de estado desactualizado, re-renders infinitos

---

## BUGS DE SEVERIDAD MEDIA (2-4 horas)

### 6. Archivos de Storage no se eliminan
**Archivo:** `features/admin/services/adminMaterials.service.ts:209`
```typescript
// TODO: Eliminar archivo de Supabase Storage si existe file_url
```
**Impacto:** Storage de Supabase se llena de archivos huerfanos

### 7. Servicio de email no implementado
**Archivos:**
- `features/business-panel/services/businessUsers.server.service.ts:230`
- `features/business-panel/services/businessUsers.server.service.ts:434`

**Impacto:** Usuarios no reciben emails de invitacion/notificacion

### 8. Contador de vistas deshabilitado
**Archivos:**
- `app/api/ai-directory/prompts/[slug]/route.ts:35`
- `app/api/ai-directory/apps/[slug]/route.ts:35`
```typescript
// TODO: Increment view count when types are fixed
```
**Impacto:** Analytics de vistas no funcionan

### 9. Verificacion de admin faltante
**Archivo:** `app/api/admin/rate-limit/stats/route.ts:11`
```typescript
// TODO: Verificar que sea admin
```
**Impacto:** Endpoint de admin accesible sin autorizacion

### 10. Funcionalidades de Reels incompletas
**Archivo:** `features/reels/components/CommentItem.tsx`
- Linea 73: Edicion de comentarios no implementada
- Linea 87: UI no se actualiza despues de accion
- Linea 100: Reporte de comentarios no implementado

### 11. Cursos de rutas de aprendizaje no cargan
**Archivo:** `features/study-planner/services/user-context.service.ts:778`
```typescript
courses: [], // TODO: Cargar cursos de la ruta
```

### 12. Falta campo 'country' en BD
**Archivo:** `features/study-planner/components/StudyPlannerLIA.tsx:3251`
```typescript
// TODO: Obtener desde userContext cuando se agregue el campo 'country' a la BD
```

---

## BUGS DIFICILES (4+ horas)

### 13. Sistema de pagos no integrado
**Archivos afectados:**
- `app/api/subscriptions/personal/subscribe/route.ts:78,104`
- `app/api/business/settings/subscription/change-plan/route.ts:184,203`
- `features/subscriptions/hooks/usePersonalSubscriptions.ts:94,122`
- `features/subscriptions/components/PersonalSubscriptionPlans.tsx:45`

**Problema:** Toda la logica de suscripciones esta incompleta sin integracion de Stripe/PayPal

### 14. Backend API es placeholder
**Archivo:** `apps/api/src/index.ts`

El backend Express completo son endpoints placeholder que retornan "Coming soon". Toda la logica real esta en el frontend con Supabase directo.

**Riesgo:**
- Sin capa de seguridad adicional
- Sin validacion centralizada
- Sin rate limiting real por usuario

### 15. Memoria leaks potenciales - Timers/Listeners
**Patron problematico encontrado en multiples archivos:**
- `setInterval` sin cleanup en 50+ ubicaciones
- `setTimeout` sin cleanup
- `addEventListener` sin `removeEventListener`

**Archivos principales:**
- `lib/rrweb/session-recorder.ts`
- `core/components/AIChatAgent/AIChatAgent.tsx`
- `features/study-planner/components/StudyPlannerLIA.tsx`

### 16. Cache y dependencia de query no implementada
**Archivo:** `app/api/courses/[slug]/learn-data/route.ts:589`
```typescript
// TODO: Implementar query directa para evitar dependencia de servicio
```

### 17. Sistema de auditoria incompleto
**Archivo:** `app/api/admin/communities/[id]/invite-user/route.ts:118`
```typescript
// TODO: Registrar en log de auditoria
```

### 18. Notificaciones a admins no implementadas
**Archivo:** `app/api/reportes/route.ts:177`
```typescript
// TODO: Enviar notificacion a administradores (opcional)
```

---

## PROBLEMAS DE ARQUITECTURA

### A1. contentService.ts usa datos mock
**Archivo:** `core/services/contentService.ts:669,711`
```typescript
// TODO: Reemplazar con llamada real a la API
```

### A2. Tipos de Supabase incompletos
Multiples archivos hacen cast a `any` porque los tipos generados de Supabase no coinciden con la estructura real de la BD.

### A3. Rate Limiting basico
`lib/rate-limit.ts` tiene implementacion basica. Endpoint `/api/admin/rate-limit/stats` no valida admin.

---

## RECOMENDACIONES DE PRIORIZACION

### INMEDIATO (Seguridad/Estabilidad)
1. **C1**: Conflicto React 18 vs 19 - puede causar crashes
2. **B4**: Secretos hardcodeados en desarrollo
3. **Bug #9**: Endpoint admin sin verificacion
4. **B3**: JWT sin validacion de estructura

### ALTA PRIORIDAD (1-2 dias)
5. **M1-M5**: Memory leaks - degradan performance
6. **B1-B2**: Backend API mal configurado
7. **C3**: Actualizar Axios vulnerable
8. **Bug #5**: useEffect dependencies incorrectas

### MEDIA PRIORIDAD (1 semana)
9. **Bug #1**: Remover console.logs (2962 ocurrencias)
10. **Bug #2**: Type safety (81 archivos con `as any`)
11. **Bug #4**: Reemplazar alertas nativas
12. **Bug #6**: Cleanup de Storage

### BAJA PRIORIDAD (Backlog)
13. **Bug #13**: Sistema de pagos
14. **Bug #7**: Servicio de emails
15. **Bug #14**: Implementar backend real

---

## BUGS CRITICOS DE BACKEND API

### B1. Endpoints aceptan cualquier metodo HTTP
**Archivo:** `apps/api/src/index.ts:64-78`
- `app.use()` acepta GET, POST, PUT, DELETE sin control
- Deberian usar `app.get()`, `app.post()`, etc.

### B2. Handler 404 inalcanzable
**Archivo:** `apps/api/src/index.ts:84-98`
- El handler 404 esta despues de errorHandler (linea 81)
- errorHandler no llama a `next()`, codigo nunca se ejecuta

### B3. JWT sin validacion de estructura
**Archivo:** `apps/api/src/middlewares/auth.ts:37,88`
```typescript
// Uso de 'as any' elimina validacion de tipos
```

### B4. Secretos hardcodeados en desarrollo
**Archivo:** `apps/api/src/config/env.ts:108`
- Fallback a `'dev-secret-key-change-in-production'`
- App inicia con credenciales inseguras sin advertencia

### B5. Validacion de entrada deficiente
**Archivo:** `apps/api/src/shared/utils/index.ts`
- Linea 58: `parseInt()` sin validacion puede dar NaN
- Linea 107-116: Regex de email/password no valida longitud maxima (ReDoS)

---

## BUGS DE MEMORY LEAK (FRONTEND)

### M1. setInterval sin cleanup
**Archivo:** `app/study-planner/dashboard/page.tsx:301-316`
- `checkClosed` interval no se limpia si componente desmonta antes

### M2. Hooks con dependencias stale
**Archivo:** `lib/rrweb/use-session-recorder.ts:69`
- `startRecording`/`stopRecording` en deps pero definidos despues como useCallback

### M3. useGlobalRecorder sin cleanup
**Archivo:** `lib/rrweb/useGlobalRecorder.ts:53`
- setInterval de 180s sin cleanup
- setTimeout linea 80 sin cleanup

### M4. Race conditions en useStudyPlannerDashboardLIA
**Archivo:** `features/study-planner/hooks/useStudyPlannerDashboardLIA.ts`
- Linea 127-140: Missing dependency `loadActivePlan`
- Linea 320: Promise sin await en setState callback

### M5. useParallax causa re-renders infinitos
**Archivo:** `shared/hooks/useParallax.ts:31`
- Dependencia `speeds` (array) no memoizada

---

## BUGS DE CONFIGURACION/DEPENDENCIAS

### C1. CRITICO: Conflicto React 18 vs 19
**Ubicacion:** `packages/ui/node_modules/`
- UI package tiene React 19.2.0
- Proyecto requiere React 18.3.1
- **Fix:** `rm -rf packages/ui/node_modules && npm install`

### C2. Cookie dependency desactualizada
**Archivo:** `apps/web/package.json:68`
- Tiene `"cookie": "^0.6.0"`
- Commit reciente dice actualizar a 0.7.2
- package.json no se actualizo

### C3. Axios vulnerable
**Archivo:** `apps/web/package.json`
- Version 1.6.7 tiene vulnerabilidades conocidas
- Actualizar a 1.6.8+

### C4. tsconfig inconsistente entre workspaces
- API usa `module: "commonjs"`
- Base usa `module: "ESNext"`
- Puede causar problemas de importacion

---

## COMANDOS UTILES PARA DEBUGGING

```bash
# Encontrar todos los TODOs
grep -r "// TODO" apps/web/src --include="*.ts" --include="*.tsx"

# Encontrar console.logs
grep -rn "console\." apps/web/src --include="*.ts" --include="*.tsx" | wc -l

# Encontrar 'as any'
grep -rn "as any" apps/web/src --include="*.ts" --include="*.tsx"

# Encontrar eslint-disable
grep -rn "eslint-disable" apps/web/src

# Verificar conflictos de dependencias
npm list react react-dom next

# Limpiar node_modules de packages/ui
rm -rf packages/ui/node_modules && npm install
```
