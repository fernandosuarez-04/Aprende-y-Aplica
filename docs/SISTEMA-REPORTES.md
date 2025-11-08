# Sistema de Reporte de Problemas 🐛

Sistema completo para que los usuarios reporten bugs, sugerencias y problemas de la plataforma.

## 📋 Características Implementadas

### ✅ Opción 3: Implementación Híbrida Completa

1. **Botón Flotante Independiente** 🔴
   - Siempre visible en la esquina inferior derecha
   - Ícono de bug con animación de pulso
   - Tooltip descriptivo

2. **Integración con Lia** 💬
   - Opción "Reportar Problema" en el menú de Lia (botón ⋮)
   - Acceso rápido desde el chat de IA

3. **Formulario Completo** 📝
   - 6 categorías: Bug, Sugerencia, Contenido, Performance, UI-UX, Otro
   - 4 niveles de prioridad: Baja, Media, Alta, Crítica
   - Campos obligatorios: Título, Descripción, Categoría
   - Campos opcionales: Pasos para reproducir, Comportamiento esperado

4. **Captura de Pantalla** 📸
   - Botón para capturar pantalla automáticamente
   - Se oculta el modal temporalmente para captura limpia
   - Preview de la imagen antes de enviar
   - Subida a Supabase Storage

5. **Contexto Automático** 🔍
   - URL de la página
   - Pathname
   - User agent
   - Resolución de pantalla
   - Navegador
   - Información del usuario

6. **Base de Datos** 💾
   - Tabla `reportes_problemas` con todos los campos
   - RLS (Row Level Security) configurado
   - Vista `reportes_con_usuario` con joins
   - Función de estadísticas
   - Índices optimizados

7. **Sistema de Estados** 📊
   - Pendiente
   - En revisión
   - En progreso
   - Resuelto
   - Rechazado
   - Duplicado

## 🗂️ Estructura de Archivos

```
database-fixes/
  └── create-reportes-problemas.sql          # Schema completo de BD

apps/web/src/
  ├── core/components/
  │   ├── ReporteProblema/
  │   │   └── ReporteProblema.tsx            # Componente modal principal
  │   ├── ReportButton/
  │   │   └── ReportButton.tsx               # Botón flotante independiente
  │   └── AIChatAgent/
  │       └── AIChatAgent.tsx                # Integrado menú en Lia
  └── app/
      ├── layout.tsx                          # ReportButton agregado globalmente
      └── api/
          └── reportes/
              └── route.ts                    # API endpoints (POST/GET)
```

## 🚀 Instalación

### 1. Ejecutar SQL en Supabase

```sql
-- Ejecuta el archivo: database-fixes/create-reportes-problemas.sql
```

Este script crea:
- Tabla `reportes_problemas`
- Vista `reportes_con_usuario`
- Función `get_reportes_stats()`
- Políticas RLS
- Índices
- Triggers

### 2. Crear Bucket de Storage (Opcional)

Si quieres habilitar capturas de pantalla:

1. Ve a Supabase Dashboard → Storage
2. Crea un nuevo bucket llamado: `reportes-screenshots`
3. Configura como público
4. Establece políticas:

```sql
-- Permitir subida autenticada
CREATE POLICY "Usuarios pueden subir screenshots"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'reportes-screenshots');

-- Permitir lectura pública
CREATE POLICY "Screenshots públicos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'reportes-screenshots');
```

### 3. Dependencias ya instaladas ✅

- `html2canvas` - Para captura de pantalla
- `framer-motion` - Animaciones
- `lucide-react` - Iconos

## 📱 Uso

### Para Usuarios

**Opción 1: Botón Flotante**
1. Haz clic en el botón rojo con ícono de bug (esquina inferior derecha)
2. Llena el formulario
3. (Opcional) Captura pantalla
4. Envía el reporte

**Opción 2: Desde Lia**
1. Abre el chat de Lia
2. Haz clic en el menú (⋮) en la esquina superior derecha
3. Selecciona "Reportar Problema"
4. Completa el formulario

### Para Administradores

Los reportes se pueden consultar mediante:

**API Endpoint:**
```typescript
GET /api/reportes?estado=pendiente&categoria=bug&limit=50&offset=0
```

**Query Directa en Supabase:**
```sql
-- Ver todos los reportes con información del usuario
SELECT * FROM reportes_con_usuario
ORDER BY created_at DESC;

-- Ver estadísticas
SELECT * FROM get_reportes_stats();

-- Reportes pendientes de alta prioridad
SELECT * FROM reportes_con_usuario
WHERE estado = 'pendiente' AND prioridad IN ('alta', 'critica')
ORDER BY created_at DESC;
```

## 🎨 Categorías Disponibles

| Categoría | Descripción | Ícono |
|-----------|-------------|-------|
| `bug` | Errores o funcionamiento incorrecto | 🔴 AlertCircle |
| `sugerencia` | Ideas de mejora o nuevas funcionalidades | 💡 Lightbulb |
| `contenido` | Problemas con el contenido educativo | 📄 FileText |
| `performance` | Lentitud o problemas de rendimiento | ⚡ Zap |
| `ui-ux` | Problemas de diseño o experiencia de usuario | 🎨 Palette |
| `otro` | Otros temas | ❓ HelpCircle |

## 🔐 Seguridad (RLS)

- **Usuarios:** Solo pueden ver y editar sus propios reportes pendientes
- **Administradores:** Pueden ver, editar y eliminar todos los reportes
- **Asignación:** Solo admins pueden asignar reportes a otros admins

## 📊 Estados del Reporte

```
pendiente → en_revision → en_progreso → resuelto
                ↓
            rechazado / duplicado
```

## 🔔 Notificaciones (Pendiente)

El sistema está preparado para agregar notificaciones. En `route.ts` línea 144:

```typescript
// TODO: Enviar notificación a administradores (opcional)
// Puedes agregar aquí lógica para notificar por email o sistema de notificaciones
```

Sugerencias de implementación:
- Email a admins cuando llega reporte crítico
- Notificación push en el panel de administración
- Webhook a Slack/Discord
- Actualización en tiempo real con Supabase Realtime

## 🎯 Panel de Administración (Próximo)

Para crear un panel de administración, puedes crear:

```typescript
// apps/web/src/app/admin/reportes/page.tsx

export default function AdminReportesPage() {
  // Consumir GET /api/reportes
  // Mostrar tabla con filtros
  // Permitir cambiar estado, asignar, agregar notas
}
```

## 🧪 Pruebas

### Prueba Manual

1. **Como Usuario:**
   ```
   - Click en botón flotante
   - Selecciona categoría "Bug"
   - Título: "Error al cargar curso"
   - Descripción: "La página se queda en blanco"
   - Captura pantalla
   - Enviar
   ```

2. **Verificar en Supabase:**
   ```sql
   SELECT * FROM reportes_problemas ORDER BY created_at DESC LIMIT 1;
   ```

3. **Como Administrador:**
   ```
   - Verificar que aparece en GET /api/reportes
   - Cambiar estado a "en_revision"
   - Agregar notas_admin
   ```

### Logs en Consola

El sistema genera logs detallados:

```javascript
📝 Creando reporte de problema: { user_id, categoria, prioridad }
📸 Screenshot subido: URL
✅ Reporte creado exitosamente: ID
```

## 🐛 Troubleshooting

### Error: "No autenticado"
- Verificar que el usuario está logueado
- Verificar cookies de sesión

### Error: "Error al crear el reporte"
- Revisar que la tabla existe en Supabase
- Verificar políticas RLS
- Revisar logs en consola del navegador

### Screenshot no se sube
- Verificar que el bucket `reportes-screenshots` existe
- Verificar políticas del bucket
- El sistema continúa funcionando sin screenshot

### Botón flotante no aparece
- Verificar que está en `layout.tsx`
- Comprobar z-index conflicts
- Verificar en páginas que no sean `/learn`

## 📈 Métricas y Analytics

Puedes consultar estadísticas con:

```sql
SELECT * FROM get_reportes_stats();
```

Retorna:
- Total de reportes
- Por estado (pendientes, en revisión, en progreso, resueltos)
- Por categoría
- Tiempo promedio de resolución

## 🎉 ¡Listo para Producción!

El sistema está completamente implementado y listo para usar. Los usuarios ya pueden reportar problemas desde dos puntos de acceso diferentes, con captura de pantalla automática y toda la metadata necesaria para debugging.

### Próximos Pasos Sugeridos:

1. ✅ Crear panel de administración para gestionar reportes
2. ✅ Implementar notificaciones push/email a admins
3. ✅ Agregar sistema de comentarios/conversación en reportes
4. ✅ Dashboard de métricas y KPIs
5. ✅ Exportación de reportes a CSV/Excel
6. ✅ Integración con sistema de tickets (Jira, Trello, etc.)

---

**Desarrollado con ❤️ para mejorar la experiencia del usuario**
