# Error de MutationRecord en rrweb

## Problema

El error `Cannot set property attributeName of #<MutationRecord> which has only a getter` ocurre cuando `rrweb` (versión alpha) intenta modificar propiedades de solo lectura en objetos `MutationRecord` del navegador.

## ¿Qué pasa si NO se resuelve?

### Consecuencias Inmediatas:
1. **Error visible en consola**: El usuario verá un error rojo en la consola del navegador
2. **Interrupción de la experiencia**: El error puede interrumpir la navegación hacia atrás
3. **Session Recorder puede fallar**: La grabación de sesiones puede dejar de funcionar correctamente
4. **Posible pérdida de datos**: Si el recorder falla, no se capturarán eventos importantes para debugging

### Consecuencias a Largo Plazo:
1. **Rendimiento degradado**: Los errores repetidos pueden afectar el rendimiento
2. **Problemas de memoria**: Si los errores se acumulan, pueden causar memory leaks
3. **Experiencia de usuario negativa**: Los errores visibles generan desconfianza
4. **Debugging más difícil**: Sin el session recorder funcionando, es más difícil diagnosticar problemas

## Soluciones Implementadas

### 1. Proxy Robusto para MutationRecord (Actual - Mejorado)
- **Aplicación automática**: El patch se aplica automáticamente al cargar el módulo, ANTES de que rrweb se inicialice
- **Interceptación completa**: Usa Proxy con `Reflect` para interceptar TODAS las operaciones (get, set, has, ownKeys, getOwnPropertyDescriptor, defineProperty)
- **Permite escritura**: Hace mutables las propiedades `attributeName`, `attributeNamespace` y `oldValue` que son de solo lectura
- **Mantiene compatibilidad**: No rompe el código existente ni afecta otros usos de MutationObserver

### 2. Handler Global de Errores Mejorado
- **Captura errores no manejados**: Intercepta errores de MutationRecord que escapan del Proxy
- **Manejo de promesas**: También captura errores de promesas rechazadas relacionadas con MutationRecord
- **Silencioso en producción**: Solo muestra warnings en desarrollo para evitar ruido en producción

### 3. Try-Catch en emit handler
- Captura errores de MutationRecord en el handler de eventos de rrweb
- Previene que los errores rompan la aplicación
- Ignora específicamente errores relacionados con propiedades de solo lectura

### 4. Aplicación Temprana del Patch
- El patch se aplica inmediatamente al importar el módulo `session-recorder.ts`
- Se ejecuta ANTES de importar `rrweb`, asegurando que MutationObserver esté parcheado antes de su uso
- Evita condiciones de carrera donde rrweb podría usar MutationObserver antes del patch

## Soluciones Alternativas

### Opción A: Actualizar rrweb
```bash
npm install rrweb@latest
```
**Riesgo**: Puede tener breaking changes o requerir actualizar código

### Opción B: Deshabilitar recorder en páginas específicas
```typescript
// En la página de learn
if (typeof window !== 'undefined') {
  sessionRecorder.stop();
}
```
**Riesgo**: Se pierde la capacidad de grabar sesiones en esa página

### Opción C: Usar versión estable de rrweb
```bash
npm install rrweb@^1.0.0
```
**Riesgo**: Puede requerir cambios en el código

## Recomendación

La solución actual (Proxy) debería resolver el problema. Si persiste, considerar:
1. Actualizar a una versión más reciente de rrweb
2. Deshabilitar temporalmente el recorder hasta que se actualice rrweb
3. Reportar el bug a los mantenedores de rrweb

