# 🔔 Sistema de Notificaciones - Frontend

Este directorio contiene la implementación del frontend del sistema de notificaciones.

## 📁 Estructura

```
features/notifications/
├── context/
│   └── NotificationContext.tsx      # Contexto global de notificaciones
├── hooks/
│   └── useNotifications.ts          # Hook para usar notificaciones
├── services/
│   └── notification.service.ts     # Servicio backend
└── README.md                        # Este archivo

core/components/
└── NotificationBell/
    ├── NotificationBell.tsx         # Componente de campana con dropdown
    └── index.ts                     # Exports
```

## 🎯 Uso Global

### 1. Provider Global

El `NotificationProvider` está integrado en el layout principal (`app/layout.tsx`), por lo que está disponible en toda la aplicación.

```tsx
// app/layout.tsx
<NotificationProvider>
  {children}
</NotificationProvider>
```

### 2. Hook useNotifications

Usa el hook en cualquier componente para acceder a las notificaciones:

```tsx
import { useNotifications } from '@/features/notifications/hooks/useNotifications'

function MyComponent() {
  const {
    notifications,      // Lista de notificaciones no leídas
    unreadCount,       // Contador total
    criticalCount,     // Contador de críticas
    highCount,         // Contador de altas
    isLoading,         // Estado de carga
    markAsRead,        // Marcar como leída
    markAllAsRead,     // Marcar todas como leídas
    archiveNotification, // Archivar
    deleteNotification,  // Eliminar
    refreshNotifications // Refrescar manualmente
  } = useNotifications()

  return (
    <div>
      <p>Tienes {unreadCount} notificaciones sin leer</p>
    </div>
  )
}
```

### 3. Componente NotificationBell

Componente reutilizable que muestra la campana con badge y dropdown:

```tsx
import { NotificationBell } from '@/core/components/NotificationBell'

function MyNavbar() {
  return (
    <nav>
      <NotificationBell 
        iconSize="md"      // 'sm' | 'md' | 'lg'
        showPulse={true}   // Animación de pulso para críticas
        variant="default"  // 'default' | 'compact'
      />
    </nav>
  )
}
```

## ✅ Componentes Actualizados

### DashboardNavbar
- ✅ Reemplazado botón hardcodeado con `NotificationBell`
- ✅ Badge dinámico con contador real
- ✅ Animación de pulso para notificaciones críticas

### AdminNotifications
- ✅ Actualizado para usar `NotificationBell`
- ✅ Ahora usa datos reales del contexto global
- ✅ Mantiene compatibilidad con código existente

## 🔄 Actualización Automática

El sistema se actualiza automáticamente cada 30 segundos (configurable) usando SWR:

- **Polling automático:** Cada 30 segundos
- **Revalidación al enfocar:** Cuando vuelves a la pestaña
- **Revalidación al reconectar:** Cuando recuperas conexión
- **Deduplicación:** Evita requests duplicados en 2 segundos

## 📊 Datos Disponibles

### Notificaciones
- Lista de últimas 10 no leídas (ordenadas por prioridad)
- Filtrado automático de expiradas
- Ordenamiento por prioridad y fecha

### Contadores
- `unreadCount`: Total de no leídas
- `criticalCount`: Notificaciones críticas
- `highCount`: Notificaciones de alta prioridad

## 🎨 Características del Componente

### NotificationBell
- ✅ Badge con contador dinámico
- ✅ Animación de pulso para críticas
- ✅ Dropdown con últimas notificaciones
- ✅ Acciones rápidas (marcar como leída, archivar, eliminar)
- ✅ Navegación a URLs de acción
- ✅ Formato de fecha relativa (ej: "hace 5 minutos")
- ✅ Indicadores de prioridad por color
- ✅ Responsive y accesible

## 🔧 Configuración

### Polling Interval

Puedes cambiar el intervalo de polling en el Provider:

```tsx
<NotificationProvider pollingInterval={60000}> {/* 60 segundos */}
  {children}
</NotificationProvider>
```

Set a `0` para desactivar polling automático:

```tsx
<NotificationProvider pollingInterval={0}>
  {children}
</NotificationProvider>
```

## 📝 Próximos Pasos

1. ✅ Crear página completa de notificaciones (`/dashboard/notifications`)
2. ✅ Agregar filtros avanzados (por tipo, fecha, etc.)
3. ✅ Implementar WebSocket para tiempo real
4. ✅ Agregar sonidos para notificaciones críticas

---

**Última actualización:** Diciembre 2024  
**Versión:** 1.0

