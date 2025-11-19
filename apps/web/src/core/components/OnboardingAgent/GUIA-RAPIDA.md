# 🚀 Guía Rápida: Onboarding Agent

## ¿Qué es?

Un asistente de bienvenida estilo JARVIS que aparece la primera vez que un usuario accede a `/dashboard`. Presenta una esfera 3D animada con síntesis de voz que guía al usuario por la plataforma.

## ✨ Características

- 🎨 Esfera 3D con anillos orbitales animados
- 🔊 Síntesis de voz en español
- 📱 5 pasos interactivos de onboarding
- 💾 Solo se muestra una vez por usuario
- 🎯 Acciones directas a secciones clave

## 🧪 Testing en Desarrollo

### Opción 1: Botón Visual (Recomendado)
Busca el botón naranja "🔄 Reset Onboarding" en la esquina inferior izquierda (solo visible en desarrollo).

### Opción 2: Consola del Navegador
```javascript
localStorage.removeItem('has-seen-onboarding');
location.reload();
```

### Opción 3: Código
```typescript
import { resetOnboarding } from '@/core/components/OnboardingAgent';
resetOnboarding();
```

## 📝 Los 5 Pasos

1. **Bienvenida** - Presentación del asistente
2. **Conoce a LIA** - Introducción al asistente AI
3. **Explora el Contenido** - Cursos, talleres, comunidades
4. **Directorio de Prompts** - Herramienta de creación de prompts
5. **¡Estás Listo!** - Mensaje final y comienzo

## 🎛️ Controles de Usuario

- **X** (esquina superior derecha) - Cerrar onboarding
- **🔊/🔇** - Activar/desactivar audio
- **Anterior** - Volver al paso previo
- **Siguiente** - Avanzar al siguiente paso
- **Saltar introducción** - Omitir todo el onboarding
- **Acciones directas** - Botones para explorar cada sección

## 🔧 Personalización

### Cambiar los Pasos

Edita `ONBOARDING_STEPS` en `OnboardingAgent.tsx`:

```typescript
{
  id: 6,
  title: 'Nuevo Paso',
  description: 'Descripción para el usuario',
  speech: 'Texto narrado en voz',
  action: {
    label: 'Ir a Nueva Sección',
    path: '/nueva-seccion'
  }
}
```

### Modificar Voz

En la función `speakText`:

```typescript
utterance.lang = 'es-ES';  // Idioma
utterance.rate = 0.9;      // Velocidad (0.1-10)
utterance.pitch = 1;       // Tono (0-2)
utterance.volume = 1;      // Volumen (0-1)
```

### Cambiar Página de Activación

En `OnboardingAgent.tsx`, línea ~75:

```typescript
if (!hasSeenOnboarding && pathname === '/dashboard') {
  // Cambiar '/dashboard' por tu página preferida
}
```

## 🌐 Compatibilidad de Voz

| Navegador | Soporte |
|-----------|---------|
| Chrome    | ✅ Completo |
| Edge      | ✅ Completo |
| Safari    | ✅ Completo |
| Firefox   | ⚠️ Limitado |
| IE        | ❌ No soportado |

## 💡 Tips

1. **Audio por defecto**: El audio está activado por defecto
2. **Skip recomendado**: Siempre incluye opción de saltar
3. **Progreso visual**: La barra superior muestra el progreso
4. **Primer acceso**: Solo aparece cuando `localStorage` no tiene la clave
5. **Z-index alto**: Aparece sobre todo el contenido (9998-9999)

## 🐛 Problemas Comunes

### No aparece el onboarding
- Verifica que estés en `/dashboard`
- Limpia localStorage
- Recarga la página

### Sin voz
- Verifica compatibilidad del navegador
- Revisa volumen del sistema
- Usa Chrome/Edge

### Botón de reset no visible
- Solo aparece en modo desarrollo
- Verifica `process.env.NODE_ENV`

## 📦 Archivos

```
OnboardingAgent/
├── OnboardingAgent.tsx      # Componente principal
├── DevResetButton.tsx       # Botón de reset para desarrollo
├── utils.tsx                # Utilidades
├── index.ts                 # Exports
├── README.md                # Documentación completa
└── GUIA-RAPIDA.md          # Esta guía
```

## 🎯 Próximos Pasos

1. Prueba el onboarding en `/dashboard`
2. Personaliza los pasos según tu necesidad
3. Ajusta colores y animaciones
4. Traduce a otros idiomas si es necesario

---

**¿Necesitas más ayuda?** Consulta el [README completo](./README.md)
