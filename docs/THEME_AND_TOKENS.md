# 🎨 Theme and Tokens - Aprende y Aplica

Este documento define la identidad visual, paleta de colores, tipografía y tokens de diseño para la plataforma "Aprende y Aplica - Chat-Bot-LIA".

## 📋 Tabla de Contenidos

1. [Paleta de Colores](#-paleta-de-colores)
2. [Tipografía](#-tipografía)
3. [Espaciado y Layout](#-espaciado-y-layout)
4. [Componentes UI](#-componentes-ui)
5. [Variables CSS](#-variables-css)
6. [Configuración Tailwind](#-configuración-tailwind)

---

## 🎨 Paleta de Colores

### Colores Primarios

#### Turquesa IA (`#44E5FF`)
- **Uso**: CTA principales, iconos destacados, links, elementos interactivos
- **Variable CSS**: `--color-primary`
- **RGB**: `rgb(68, 229, 255)`
- **HSL**: `hsl(191, 100%, 63%)`
- **Contraste sobre oscuro**: 10.5:1 (AAA)
- **Contraste sobre claro**: 2.1:1 (AA para texto grande)

**Aplicaciones**:
- Botones primarios
- Enlaces de navegación
- Iconos de acciones principales
- Indicadores de progreso
- Badges de estado activo

#### Carbón Digital (`#0A0A0A`)
- **Uso**: Fondos principales, headers, footer, texto de titulares sobre claro
- **Variable CSS**: `--color-bg-dark`
- **RGB**: `rgb(10, 10, 10)`
- **HSL**: `hsl(0, 0%, 4%)`
- **Contraste con blanco**: 19.8:1 (AAA)

**Aplicaciones**:
- Fondo principal de la aplicación
- Headers y navigation bars
- Modales y overlays
- Tarjetas de contenido
- Fondos de chat

#### Gris Neblina (`#F2F2F2`)
- **Uso**: Secciones de respiro, superficies claras, texto secundario
- **Variable CSS**: `--color-bg-light`
- **RGB**: `rgb(242, 242, 242)`
- **HSL**: `hsl(0, 0%, 95%)`
- **Contraste con oscuro**: 18.5:1 (AAA)

**Aplicaciones**:
- Fondos de secciones alternativas
- Inputs y formularios
- Separadores visuales
- Texto secundario sobre oscuro
- Placeholders

#### Blanco Puro (`#FFFFFF`)
- **Uso**: Texto sobre oscuro, tarjetas elevadas, superficies principales
- **Variable CSS**: `--color-contrast`
- **RGB**: `rgb(255, 255, 255)`
- **HSL**: `hsl(0, 0%, 100%)`
- **Contraste con Carbón**: 21:1 (AAA)

**Aplicaciones**:
- Texto principal sobre fondos oscuros
- Tarjetas de contenido
- Modales y diálogos
- Botones secundarios
- Iconos sobre oscuro

#### Azul Profundo (`#0077A6`)
- **Uso**: Hover de links, badges, estados activos, acentos secundarios
- **Variable CSS**: `--color-accent` / `--color-secondary`
- **RGB**: `rgb(0, 119, 166)`
- **HSL**: `hsl(197, 100%, 33%)`
- **Contraste sobre blanco**: 5.2:1 (AA)

**Aplicaciones**:
- Estados hover de elementos interactivos
- Badges de categorías
- Indicadores de estado activo
- Bordes de elementos seleccionados
- Fondos de notificaciones informativas

### Colores Semánticos

```css
/* Éxito */
--color-success: #10B981;    /* Contraste: 4.8:1 sobre blanco (AA) */

/* Advertencia */
--color-warning: #F59E0B;    /* Contraste: 3.5:1 sobre blanco (AA para texto grande) */

/* Error */
--color-error: #EF4444;      /* Contraste: 5.1:1 sobre blanco (AA) */

/* Información */
--color-info: #3B82F6;       /* Contraste: 4.9:1 sobre blanco (AA) */
```

### Colores de Estado

```css
/* Estados de módulos */
--status-locked: #6B7280;        /* Gris - módulo bloqueado */
--status-not-started: #9CA3AF;   /* Gris claro - no iniciado */
--status-in-progress: #44E5FF;   /* Turquesa - en progreso */
--status-completed: #10B981;     /* Verde - completado */

/* Estados de sesión */
--session-active: #10B981;       /* Verde - sesión activa */
--session-scheduled: #F59E0B;    /* Amarillo - programada */
--session-ended: #6B7280;        /* Gris - finalizada */
```

### Transparencias y Glassmorphism

```css
--glass: rgba(10, 10, 10, 0.6);          /* Fondo glass suave */
--glass-strong: rgba(10, 10, 10, 0.8);   /* Fondo glass intenso */
--glass-light: rgba(242, 242, 242, 0.1); /* Glass sobre oscuro */
```

### Gradientes

```css
/* Gradiente principal de fondo */
background: linear-gradient(160deg, #0A0A0A 0%, #0A0A0A 100%);

/* Glow effect turquesa */
background: radial-gradient(circle, rgba(68,229,255,0.18), transparent 60%);

/* Gradiente de botón primario */
background: linear-gradient(135deg, #44E5FF 0%, #0077A6 100%);

/* Gradiente de hover */
background: linear-gradient(135deg, #9ef3ff 0%, #44E5FF 100%);
```

---

## 🔤 Tipografía

### Familias Tipográficas

#### Montserrat (Headings)
- **Uso**: Títulos H1, H2, elementos destacados
- **Pesos disponibles**: 700 (Bold), 800 (ExtraBold)
- **Variable CSS**: `--font-heading`
- **Fuente**: Google Fonts
- **Fallback**: `Arial, Helvetica, sans-serif`

#### Inter (Body)
- **Uso**: Texto de cuerpo, párrafos, UI elements
- **Pesos disponibles**: 400 (Regular), 500 (Medium)
- **Variable CSS**: `--font-body`
- **Fuente**: Google Fonts
- **Fallback**: `Arial, Helvetica, sans-serif`

### Escala Tipográfica

#### H1 - Títulos Principales
```css
font-family: 'Montserrat', Arial, Helvetica, sans-serif;
font-weight: 800;  /* ExtraBold */
font-size: 32px;   /* Fijo, no responsivo */
line-height: 1.5;
letter-spacing: 0.3px;
color: #FFFFFF;
```

#### H2 - Subtítulos
```css
font-family: 'Montserrat', Arial, Helvetica, sans-serif;
font-weight: 800;  /* ExtraBold */
font-size: 24px;   /* Fijo, no responsivo */
line-height: 1.5;
letter-spacing: 0.3px;
color: #FFFFFF;
```

#### H3-H6 - Subtítulos Menores
```css
font-family: 'Montserrat', Arial, Helvetica, sans-serif;
font-weight: 700;  /* Bold */
line-height: 1.5;
color: #FFFFFF;
```

#### Body - Texto de Cuerpo
```css
font-family: 'Inter', Arial, Helvetica, sans-serif;
font-weight: 400;  /* Regular */
font-size: 16px;   /* Base */
line-height: 1.5;
color: #FFFFFF;
```

#### Body Medium - Texto Destacado
```css
font-family: 'Inter', Arial, Helvetica, sans-serif;
font-weight: 500;  /* Medium */
font-size: 16px;
line-height: 1.5;
color: #FFFFFF;
```

#### Small - Texto Pequeño
```css
font-family: 'Inter', Arial, Helvetica, sans-serif;
font-weight: 400;
font-size: 14px;
line-height: 1.5;
color: #F2F2F2;  /* Gris Neblina */
```

#### Large - Texto Grande
```css
font-family: 'Inter', Arial, Helvetica, sans-serif;
font-weight: 500;
font-size: 18px;
line-height: 1.5;
color: #FFFFFF;
```

---

## 📏 Espaciado y Layout

### Sistema de Espaciado

El sistema utiliza espaciado fijo (no responsivo) basado en múltiplos de 8px:

```css
--spacing-xs: 8px;    /* Espaciado mínimo */
--spacing-sm: 12px;   /* Espaciado pequeño */
--spacing-md: 16px;   /* Espaciado medio (base) */
--spacing-lg: 24px;   /* Espaciado grande */
--spacing-xl: 32px;   /* Espaciado extra grande */
--spacing-xxl: 48px;  /* Espaciado máximo */
```

### Breakpoints

```css
--breakpoint-sm: 640px;
--breakpoint-md: 768px;
--breakpoint-lg: 1024px;
--breakpoint-xl: 1280px;
--breakpoint-2xl: 1536px;
```

### Grid System

#### Ancho Fijo
- **Ancho mínimo del body**: 1280px
- **Diseño no responsivo**: Scroll horizontal cuando sea necesario
- **Filosofía**: Similar a SAES, prioriza diseño de escritorio

```css
.main-container {
    width: 1280px;
    margin: 0 auto;
    padding: var(--spacing-lg);
}

.hero-section,
.features-section,
.stats-section {
    min-width: 1280px;
}
```

---

## 🧩 Componentes UI

### Botones

#### Botón Primario
```css
.btn-primary {
    background: linear-gradient(135deg, #44E5FF 0%, #0077A6 100%);
    color: #FFFFFF;
    font-family: 'Inter', sans-serif;
    font-weight: 500;
    font-size: 16px;
    padding: 12px 24px;
    border-radius: 12px;
    border: none;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 2px 8px rgba(68, 229, 255, 0.3);
}
```

#### Botón Secundario
```css
.btn-secondary {
    background: transparent;
    color: #44E5FF;
    border: 2px solid #44E5FF;
    font-family: 'Inter', sans-serif;
    font-weight: 500;
    font-size: 16px;
    padding: 10px 22px;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
}
```

### Tarjetas (Cards)
```css
.card {
    background: rgba(10, 10, 10, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
    transition: all 0.3s ease;
}
```

### Inputs y Formularios
```css
.input-text {
    background: rgba(242, 242, 242, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 12px 16px;
    font-family: 'Inter', sans-serif;
    font-size: 16px;
    color: #FFFFFF;
    width: 100%;
    transition: all 0.3s ease;
}
```

---

## 🎭 Variables CSS

### Variables Principales

```css
:root {
  /* Colores primarios */
  --color-primary: #44E5FF;
  --color-bg-dark: #0A0A0A;
  --color-bg-light: #F2F2F2;
  --color-contrast: #FFFFFF;
  --color-accent: #0077A6;
  
  /* Colores semánticos */
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-error: #EF4444;
  --color-info: #3B82F6;
  
  /* Tipografías */
  --font-heading: 'Montserrat', Arial, Helvetica, sans-serif;
  --font-body: 'Inter', Arial, Helvetica, sans-serif;
  
  /* Espaciado */
  --spacing-xs: 8px;
  --spacing-sm: 12px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  --spacing-xxl: 48px;
  
  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-base: 12px;
  
  /* Sombras */
  --shadow-glass: 0 2px 8px rgba(0, 0, 0, 0.12);
  --shadow-glass-hover: 0 4px 16px rgba(68, 229, 255, 0.2);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.15);
  
  /* Transiciones */
  --duration-base: 0.3s;
  --easing-base: ease;
  
  /* Glassmorphism */
  --glass: rgba(10, 10, 10, 0.6);
  --glass-strong: rgba(10, 10, 10, 0.8);
  --glass-light: rgba(242, 242, 242, 0.1);
}
```

---

## ⚙️ Configuración Tailwind

### tailwind.config.js

```javascript
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--color-primary)',
          50: 'var(--color-primary)',
          500: 'var(--color-primary)',
          600: 'var(--color-accent)',
          900: 'var(--color-bg-dark)',
        },
        dark: 'var(--color-bg-dark)',
        light: 'var(--color-bg-light)',
        white: 'var(--color-contrast)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        error: 'var(--color-error)',
        info: 'var(--color-info)',
      },
      fontFamily: {
        heading: ['var(--font-heading)'],
        body: ['var(--font-body)'],
      },
      fontSize: {
        'h1': ['32px', { lineHeight: '1.5', letterSpacing: '0.3px' }],
        'h2': ['24px', { lineHeight: '1.5', letterSpacing: '0.3px' }],
      },
      spacing: {
        'xs': 'var(--spacing-xs)',
        'sm': 'var(--spacing-sm)',
        'md': 'var(--spacing-md)',
        'lg': 'var(--spacing-lg)',
        'xl': 'var(--spacing-xl)',
        'xxl': 'var(--spacing-xxl)',
      },
      borderRadius: {
        'sm': 'var(--radius-sm)',
        'md': 'var(--radius-md)',
        'lg': 'var(--radius-lg)',
        'xl': 'var(--radius-xl)',
      },
      boxShadow: {
        'glass': 'var(--shadow-glass)',
        'glass-hover': 'var(--shadow-glass-hover)',
      },
      backdropBlur: {
        'glass': '8px',
      },
    },
  },
  plugins: [],
}
```

---

## 📝 Notas Importantes

### Reglas de Diseño

1. **No Responsive**: Todos los tamaños son fijos, no cambian con viewport
2. **Interlineado**: Siempre 1.5 para óptima legibilidad
3. **Letter Spacing**: 0.3px para headings, normal para body
4. **Contraste**: Mínimo 4.5:1 para texto normal, 3:1 para texto grande
5. **Jerarquía**: Máximo 3 niveles de jerarquía por página

### Layout

1. **Ancho Fijo**: Todos los contenedores principales tienen 1280px de ancho
2. **Scroll Horizontal**: Permitido cuando el viewport es menor
3. **No Breakpoints**: No hay media queries para responsive
4. **Centrado**: Contenido centrado horizontalmente
5. **Padding Consistente**: Usar variables de espaciado

---

**Archivo**: docs/THEME_AND_TOKENS.md  
**Versión**: 1.0  
**Fecha**: Enero 2025  
**Proyecto**: Aprende y Aplica - Chat-Bot-LIA

