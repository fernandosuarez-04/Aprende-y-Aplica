# Checklist de Pruebas: Flujo de Asignación con LIA

## ✅ Pruebas Funcionales

### Flujo Básico
- [ ] El botón "Sugerir con LIA" abre el modal LIA
- [ ] El modal muestra las 3 opciones de enfoque con iconos correctos
- [ ] Al seleccionar un enfoque, se muestran las sugerencias calculadas
- [ ] Las fechas sugeridas son diferentes para cada enfoque
- [ ] Al seleccionar una sugerencia, se muestra la pantalla de confirmación
- [ ] El selector de fecha de inicio funciona correctamente
- [ ] Al confirmar, el modal LIA se cierra
- [ ] Los datos se transfieren correctamente al modal principal
- [ ] La asignación se completa con éxito

### Validaciones
- [ ] No se puede asignar con `start_date` > `due_date`
- [ ] El mensaje de error es claro cuando las fechas son inválidas
- [ ] Solo admins/owners pueden acceder a la API de sugerencias
- [ ] Error 403 si usuario sin permisos intenta acceder

### Cálculos
- [ ] Curso corto (< 2 horas): Sugerencias respetan mínimos
- [ ] Curso normal (10-20 horas): Sugerencias son razonables
- [ ] Curso largo (> 50 horas): Sugerencias incluyen factor de escala
- [ ] Curso con muchas actividades: Sugerencias ajustadas +15%
- [ ] Curso con muchos materiales: Sugerencias ajustadas +10%

### UX/UI
- [ ] El modal LIA tiene animaciones suaves
- [ ] Los colores respetan el tema de la organización
- [ ] El modal es responsive en mobile
- [ ] El modal es responsive en tablet
- [ ] El modal es responsive en desktop
- [ ] Hay feedback visual durante la carga
- [ ] Los botones "Volver" funcionan correctamente
- [ ] El botón "X" cierra el modal

### Navegación
- [ ] Paso 1 → Paso 2: Funciona correctamente
- [ ] Paso 2 → Paso 3: Funciona correctamente
- [ ] Paso 3 → Volver a Paso 2: Funciona correctamente
- [ ] Paso 2 → Volver a Paso 1: Funciona correctamente
- [ ] Cerrar modal en cualquier paso: Resetea estados

## 🔍 Pruebas de Edge Cases

### Fechas
- [ ] Fecha de inicio en el pasado: Se permite (para asignaciones retroactivas)
- [ ] Fecha de inicio = fecha límite: Se permite
- [ ] Fecha de inicio > fecha límite: Se rechaza con error claro
- [ ] Zona horaria diferente: Fechas se muestran correctamente

### Cursos
- [ ] Curso sin lecciones: Usa valores por defecto
- [ ] Curso sin actividades: Usa valores por defecto
- [ ] Curso sin materiales: Usa valores por defecto
- [ ] Curso sin `duration_total_minutes`: Usa 10 horas por defecto

### Permisos
- [ ] Usuario member intenta acceder: Error 403
- [ ] Usuario no autenticado: Error 401
- [ ] Admin de otra organización: No puede acceder

## 📊 Pruebas de Integración

### Base de Datos
- [ ] `start_date` se guarda correctamente en UTC
- [ ] `approach` se guarda correctamente
- [ ] Constraint `check_start_before_due` funciona
- [ ] Índice `idx_org_course_assignments_start_date` existe

### API
- [ ] GET `/deadline-suggestions` retorna 200 con datos correctos
- [ ] GET `/deadline-suggestions` con `start_date` custom funciona
- [ ] POST `/assign` acepta `start_date` y `approach`
- [ ] POST `/assign` valida fechas correctamente

### Frontend
- [ ] Modal LIA se integra sin conflictos con modal principal
- [ ] Estados se resetean al cerrar modal
- [ ] No hay memory leaks al abrir/cerrar modal múltiples veces

## 🚀 Pruebas de Performance

- [ ] API `/deadline-suggestions` responde en < 500ms
- [ ] Cálculo de metadata no causa timeout
- [ ] Modal LIA se abre sin lag
- [ ] Animaciones son fluidas (60fps)

## ♿ Pruebas de Accesibilidad

- [ ] Modal es navegable con Tab
- [ ] Enter selecciona opciones
- [ ] Esc cierra el modal
- [ ] Los botones tienen labels descriptivos
- [ ] Contraste de colores es suficiente (WCAG AA)

## 📱 Pruebas por Dispositivo

### Mobile (< 640px)
- [ ] Modal ocupa todo el ancho disponible
- [ ] Texto es legible
- [ ] Botones son fáciles de presionar
- [ ] Scroll funciona correctamente

### Tablet (640px - 1024px)
- [ ] Layout se adapta correctamente
- [ ] Panel izquierdo se oculta si es necesario

### Desktop (> 1024px)
- [ ] Panel izquierdo se muestra
- [ ] Layout de 2 columnas funciona bien

## 🔄 Pruebas de Regresión

- [ ] Asignación manual (sin LIA) sigue funcionando
- [ ] Asignaciones existentes no se ven afectadas
- [ ] Reportes de cursos asignados funcionan
- [ ] Notificaciones de asignación funcionan

---

## 📝 Notas de Prueba

### Datos de Prueba Recomendados

**Curso Corto:**
- Título: "Introducción rápida a IA"
- Duración: 1 hora
- Lecciones: 3
- Actividades: 5

**Curso Normal:**
- Título: "Fundamentos de Machine Learning"
- Duración: 12 horas
- Lecciones: 15
- Actividades: 30

**Curso Largo:**
- Título: "Máster en Deep Learning"
- Duración: 60 horas
- Lecciones: 50
- Actividades: 100

### Usuarios de Prueba

- **Admin:** Usuario con rol 'admin' en organización
- **Owner:** Usuario con rol 'owner' en organización
- **Member:** Usuario con rol 'member' (sin permisos)

---

## ✅ Criterios de Aceptación

Para considerar la implementación completa y lista para producción:

1. ✓ Todas las pruebas funcionales pasan
2. ✓ Todos los edge cases están manejados
3. ✓ Performance es aceptable (< 500ms)
4. ✓ Accesibilidad cumple WCAG AA
5. ✓ Responsive en todos los dispositivos
6. ✓ No hay regresiones en funcionalidad existente

---

**Fecha de creación:** 2025-12-27  
**Última actualización:** 2025-12-27
