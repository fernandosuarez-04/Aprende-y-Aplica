# ✅ Checklist de Mejoras - Sistema rrweb

## 🔥 Prioridad Alta (Hacer Primero)

### 1. Actualizar Versiones
- [ ] Actualizar `rrweb-player` a `^2.0.0-alpha.18` en `package.json`
- [ ] Ejecutar `npm install`
- [ ] Verificar que no hay errores de compatibilidad
- [ ] Probar grabación y reproducción

**Comando**:
```bash
npm install rrweb-player@^2.0.0-alpha.18
```

---

### 2. Centralizar Carga de Módulos
- [ ] Crear archivo `lib/rrweb/rrweb-loader.ts`
- [ ] Mover lógica de `loadRrweb()` al nuevo archivo
- [ ] Agregar función `loadRrwebPlayer()` al loader
- [ ] Actualizar `session-recorder.ts` para usar el loader
- [ ] Actualizar `SessionPlayer.tsx` para usar importación dinámica
- [ ] Eliminar cargas duplicadas en hooks

**Archivo a crear**: `apps/web/src/lib/rrweb/rrweb-loader.ts`

---

### 3. Corregir Race Condition en useGlobalRecorder
- [ ] Revisar `useGlobalRecorder.ts` línea 52-61
- [ ] Implementar buffer circular o reinicio más seguro
- [ ] Agregar manejo de errores en el intervalo
- [ ] Probar que no se pierden eventos durante reinicio

**Opción A - Buffer Circular**:
```typescript
// Usar CircularEventBuffer en lugar de reiniciar
```

**Opción B - Reinicio Seguro**:
```typescript
// Esperar confirmación antes de reiniciar
await recorder.stop();
await new Promise(resolve => setTimeout(resolve, 500));
await recorder.startRecording();
```

---

## ⚡ Prioridad Media

### 4. Simplificar Patch de MutationRecord
- [ ] Evaluar si aún es necesario (verificar versión más reciente de rrweb)
- [ ] Si se mantiene, simplificar el Proxy
- [ ] Reducir capas de manejo de errores
- [ ] Documentar por qué es necesario
- [ ] Considerar alternativa: actualizar a versión estable de rrweb

**Decisión necesaria**: ¿Mantener patch o actualizar rrweb?

---

### 5. Balancear Configuración de Sampling
- [ ] Revisar `session-recorder.ts` línea 327-344
- [ ] Ajustar `mousemoveCallback` según entorno (dev vs prod)
- [ ] Habilitar eventos importantes para debugging (MouseUp, MouseDown)
- [ ] Eliminar `ignoreCSSAttributes` (no existe en API)
- [ ] Probar que la grabación sigue siendo útil

**Configuración sugerida**:
```typescript
const isDev = process.env.NODE_ENV === 'development';
sampling: {
  mousemoveCallback: isDev ? 200 : 500,
  mouseInteraction: {
    Click: true,
    DblClick: true,
    ...(isDev && { MouseUp: true, MouseDown: true }),
  },
}
```

---

### 6. Mejorar SessionPlayer
- [ ] Cambiar importación estática a dinámica
- [ ] Agregar validación de eventos antes de reproducir
- [ ] Mejorar manejo de errores con retry
- [ ] Agregar cleanup completo del player
- [ ] Probar en diferentes navegadores

**Cambio necesario**:
```typescript
// De:
import rrwebPlayer from 'rrweb-player';

// A:
const rrwebPlayer = await import('rrweb-player');
```

---

## 📝 Prioridad Baja

### 7. Gestión de Memoria
- [ ] Implementar `CircularEventBuffer` (ver ejemplo en análisis)
- [ ] Agregar limpieza automática de eventos antiguos
- [ ] Destruir players correctamente en cleanup
- [ ] Limpiar snapshots cuando no se necesiten
- [ ] Agregar límites de memoria

---

### 8. Validación y Testing
- [ ] Agregar validación de estructura de eventos
- [ ] Crear tests unitarios para `SessionRecorder`
- [ ] Crear tests de integración para `SessionPlayer`
- [ ] Testear el patch de MutationRecord
- [ ] Agregar tests E2E para flujo completo

---

### 9. Monitoreo y Métricas
- [ ] Agregar logging estructurado
- [ ] Implementar métricas de rendimiento
- [ ] Contar errores de MutationRecord (debería ser 0)
- [ ] Monitorear tamaño de sesiones
- [ ] Alertas si el recorder falla frecuentemente

---

## 🧪 Testing Checklist

Después de cada cambio, verificar:

- [ ] La grabación inicia correctamente
- [ ] Los eventos se capturan sin errores
- [ ] La reproducción funciona correctamente
- [ ] No hay errores en consola
- [ ] El tamaño de las sesiones es razonable
- [ ] No hay memory leaks (verificar con DevTools)
- [ ] Funciona en Chrome, Firefox, Safari
- [ ] Funciona en móvil y desktop

---

## 📋 Verificación Final

Antes de considerar completado:

- [ ] Todas las versiones están actualizadas y son compatibles
- [ ] No hay cargas duplicadas de módulos
- [ ] No hay race conditions
- [ ] La configuración está balanceada
- [ ] El código está documentado
- [ ] Los tests pasan
- [ ] No hay errores en producción

---

## 🔗 Referencias

- **Análisis completo**: `docs/ANALISIS_RRWEB.md`
- **Resumen ejecutivo**: `docs/RESUMEN_RRWEB.md`
- **Documentación del error**: `docs/RRWEB_MUTATIONRECORD_ERROR.md`

---

*Última actualización: Diciembre 2024*

