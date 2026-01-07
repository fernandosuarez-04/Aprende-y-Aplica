# PRD 05 - Diseño y UX - Chat-Bot-LIA

## 5. Diseño, Interfaz de Usuario y Experiencia

Este documento detalla la identidad visual, paleta de colores, tipografía, componentes de UI, patrones de diseño y principios de experiencia de usuario del sistema Chat-Bot-LIA.

---

## 5.1 Identidad Visual y Filosofía de Diseño

### Filosofía de Diseño
El diseño de Chat-Bot-LIA se basa en los siguientes principios fundamentales:

1. **Minimalismo Tecnológico**: Interfaces limpias que priorizan el contenido educativo
2. **Claridad Visual**: Jerarquía clara y elementos fácilmente identificables
3. **Consistencia**: Patrones de diseño consistentes en toda la plataforma
4. **Accesibilidad**: Cumplimiento WCAG 2.1 AA en todos los componentes
5. **Modernidad**: Estética contemporánea con efectos sutiles de glassmorphism

### Inspiración
- **Estética**: Plataformas educativas modernas (Coursera, edX)
- **Interacción**: Interfaces conversacionales (ChatGPT, Claude)
- **Visual**: Diseño minimalista con acentos tecnológicos

---

## 5.2 Paleta de Colores Oficial

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

#### Éxito (`#10B981`)
- **Uso**: Mensajes de éxito, confirmaciones, progreso completado
- **Contraste**: 4.8:1 sobre blanco (AA)

#### Advertencia (`#F59E0B`)
- **Uso**: Alertas, advertencias, acciones que requieren atención
- **Contraste**: 3.5:1 sobre blanco (AA para texto grande)

#### Error (`#EF4444`)
- **Uso**: Mensajes de error, validaciones fallidas, acciones destructivas
- **Contraste**: 5.1:1 sobre blanco (AA)

#### Información (`#3B82F6`)
- **Uso**: Mensajes informativos, tooltips, ayuda contextual
- **Contraste**: 4.9:1 sobre blanco (AA)

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

**Aplicaciones**:
- Modales y overlays
- Navigation bars flotantes
- Tarjetas sobre fondos complejos
- Tooltips y popovers

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

## 5.3 Tipografía

### Familias Tipográficas

#### Montserrat (Headings)
- **Uso**: Títulos H1, H2, elementos destacados
- **Pesos disponibles**: 700 (Bold), 800 (ExtraBold)
- **Variable CSS**: `--font-heading`
- **Fuente**: Google Fonts
- **Fallback**: `Arial, Helvetica, sans-serif`

**Características**:
- Geométrica y moderna
- Alta legibilidad en tamaños grandes
- Excelente para jerarquía visual
- Espaciado de letras optimizado

#### Inter (Body)
- **Uso**: Texto de cuerpo, párrafos, UI elements
- **Pesos disponibles**: 400 (Regular), 500 (Medium)
- **Variable CSS**: `--font-body`
- **Fuente**: Google Fonts
- **Fallback**: `Arial, Helvetica, sans-serif`

**Características**:
- Optimizada para pantallas
- Excelente legibilidad en tamaños pequeños
- Espaciado uniforme
- Soporte completo de caracteres

### Jerarquía Tipográfica

#### H1 - Títulos Principales
```css
font-family: 'Montserrat', Arial, Helvetica, sans-serif;
font-weight: 800;  /* ExtraBold */
font-size: 32px;   /* Fijo, no responsivo */
line-height: 1.5;
letter-spacing: 0.3px;
color: #FFFFFF;
```

**Uso**: Títulos de página, headers principales, hero sections

#### H2 - Subtítulos
```css
font-family: 'Montserrat', Arial, Helvetica, sans-serif;
font-weight: 800;  /* ExtraBold */
font-size: 24px;   /* Fijo, no responsivo */
line-height: 1.5;
letter-spacing: 0.3px;
color: #FFFFFF;
```

**Uso**: Secciones principales, títulos de módulos, headers de tarjetas

#### H3-H6 - Subtítulos Menores
```css
font-family: 'Montserrat', Arial, Helvetica, sans-serif;
font-weight: 700;  /* Bold */
line-height: 1.5;
color: #FFFFFF;
```

**Uso**: Subsecciones, títulos de componentes, labels destacados

#### Body - Texto de Cuerpo
```css
font-family: 'Inter', Arial, Helvetica, sans-serif;
font-weight: 400;  /* Regular */
font-size: 16px;   /* Base */
line-height: 1.5;
color: #FFFFFF;
```

**Uso**: Párrafos, descripciones, contenido general

#### Body Medium - Texto Destacado
```css
font-family: 'Inter', Arial, Helvetica, sans-serif;
font-weight: 500;  /* Medium */
font-size: 16px;
line-height: 1.5;
color: #FFFFFF;
```

**Uso**: Labels, botones, elementos de navegación

#### Small - Texto Pequeño
```css
font-family: 'Inter', Arial, Helvetica, sans-serif;
font-weight: 400;
font-size: 14px;
line-height: 1.5;
color: #F2F2F2;  /* Gris Neblina */
```

**Uso**: Metadatos, timestamps, texto secundario

#### Large - Texto Grande
```css
font-family: 'Inter', Arial, Helvetica, sans-serif;
font-weight: 500;
font-size: 18px;
line-height: 1.5;
color: #FFFFFF;
```

**Uso**: Leads, introducciones, CTAs textuales

### Reglas de Uso Tipográfico

1. **No Responsive**: Todos los tamaños son fijos, no cambian con viewport
2. **Interlineado**: Siempre 1.5 para óptima legibilidad
3. **Letter Spacing**: 0.3px para headings, normal para body
4. **Contraste**: Mínimo 4.5:1 para texto normal, 3:1 para texto grande
5. **Jerarquía**: Máximo 3 niveles de jerarquía por página

---

## 5.4 Espaciado y Layout

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

### Grid System

#### Ancho Fijo
- **Ancho mínimo del body**: 1280px
- **Diseño no responsivo**: Scroll horizontal cuando sea necesario
- **Filosofía**: Similar a SAES, prioriza diseño de escritorio

#### Contenedores

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

### Reglas de Layout

1. **Ancho Fijo**: Todos los contenedores principales tienen 1280px de ancho
2. **Scroll Horizontal**: Permitido cuando el viewport es menor
3. **No Breakpoints**: No hay media queries para responsive
4. **Centrado**: Contenido centrado horizontalmente
5. **Padding Consistente**: Usar variables de espaciado

---

## 5.5 Componentes de UI

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

.btn-primary:hover {
    background: linear-gradient(135deg, #9ef3ff 0%, #44E5FF 100%);
    box-shadow: 0 4px 16px rgba(68, 229, 255, 0.5);
    transform: translateY(-2px);
}

.btn-primary:active {
    transform: translateY(0);
    box-shadow: 0 2px 8px rgba(68, 229, 255, 0.3);
}

.btn-primary:disabled {
    background: #6B7280;
    cursor: not-allowed;
    box-shadow: none;
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

.btn-secondary:hover {
    background: rgba(68, 229, 255, 0.1);
    border-color: #9ef3ff;
    color: #9ef3ff;
}
```

#### Botón de Texto
```css
.btn-text {
    background: none;
    border: none;
    color: #44E5FF;
    font-family: 'Inter', sans-serif;
    font-weight: 500;
    font-size: 16px;
    padding: 8px 16px;
    cursor: pointer;
    transition: color 0.3s ease;
}

.btn-text:hover {
    color: #9ef3ff;
    text-decoration: underline;
}
```

### Tarjetas (Cards)

#### Tarjeta Básica
```css
.card {
    background: rgba(10, 10, 10, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
    transition: all 0.3s ease;
}

.card:hover {
    border-color: rgba(68, 229, 255, 0.3);
    box-shadow: 0 4px 16px rgba(68, 229, 255, 0.2);
    transform: translateY(-4px);
}
```

#### Tarjeta de Módulo
```css
.module-card {
    background: rgba(10, 10, 10, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    padding: 20px;
    display: flex;
    align-items: center;
    gap: 16px;
    transition: all 0.3s ease;
}

.module-card.locked {
    opacity: 0.6;
    cursor: not-allowed;
}

.module-card.in-progress {
    border-color: #44E5FF;
    box-shadow: 0 0 20px rgba(68, 229, 255, 0.2);
}

.module-card.completed {
    border-color: #10B981;
}
```

### Inputs y Formularios

#### Input de Texto
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

.input-text:focus {
    outline: none;
    border-color: #44E5FF;
    box-shadow: 0 0 0 3px rgba(68, 229, 255, 0.1);
}

.input-text::placeholder {
    color: #9CA3AF;
}

.input-text:disabled {
    background: rgba(107, 114, 128, 0.1);
    cursor: not-allowed;
}
```

#### Textarea
```css
.textarea {
    background: rgba(242, 242, 242, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 12px 16px;
    font-family: 'Inter', sans-serif;
    font-size: 16px;
    color: #FFFFFF;
    width: 100%;
    min-height: 120px;
    resize: vertical;
    transition: all 0.3s ease;
}

.textarea:focus {
    outline: none;
    border-color: #44E5FF;
    box-shadow: 0 0 0 3px rgba(68, 229, 255, 0.1);
}
```

#### Select
```css
.select {
    background: rgba(242, 242, 242, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 12px 16px;
    font-family: 'Inter', sans-serif;
    font-size: 16px;
    color: #FFFFFF;
    width: 100%;
    cursor: pointer;
    transition: all 0.3s ease;
}

.select:focus {
    outline: none;
    border-color: #44E5FF;
    box-shadow: 0 0 0 3px rgba(68, 229, 255, 0.1);
}
```

### Badges y Tags

#### Badge de Estado
```css
.badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 20px;
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    font-weight: 500;
}

.badge-success {
    background: rgba(16, 185, 129, 0.2);
    color: #10B981;
    border: 1px solid #10B981;
}

.badge-warning {
    background: rgba(245, 158, 11, 0.2);
    color: #F59E0B;
    border: 1px solid #F59E0B;
}

.badge-error {
    background: rgba(239, 68, 68, 0.2);
    color: #EF4444;
    border: 1px solid #EF4444;
}

.badge-info {
    background: rgba(68, 229, 255, 0.2);
    color: #44E5FF;
    border: 1px solid #44E5FF;
}
```

### Modales y Diálogos

#### Modal
```css
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(10, 10, 10, 0.8);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.modal {
    background: #0A0A0A;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    padding: 32px;
    max-width: 600px;
    width: 90%;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
}

.modal-title {
    font-family: 'Montserrat', sans-serif;
    font-size: 24px;
    font-weight: 800;
    color: #FFFFFF;
}

.modal-close {
    background: none;
    border: none;
    color: #F2F2F2;
    font-size: 24px;
    cursor: pointer;
    padding: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    transition: all 0.3s ease;
}

.modal-close:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #FFFFFF;
}
```

### Tooltips

```css
.tooltip {
    position: relative;
    display: inline-block;
}

.tooltip-content {
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(10, 10, 10, 0.95);
    color: #FFFFFF;
    padding: 8px 12px;
    border-radius: 8px;
    font-size: 14px;
    white-space: nowrap;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s ease;
    margin-bottom: 8px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

.tooltip:hover .tooltip-content {
    opacity: 1;
}

.tooltip-content::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 6px solid transparent;
    border-top-color: rgba(10, 10, 10, 0.95);
}
```

### Barras de Progreso

#### Barra de Progreso Lineal
```css
.progress-bar {
    width: 100%;
    height: 8px;
    background: rgba(242, 242, 242, 0.1);
    border-radius: 4px;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #44E5FF 0%, #0077A6 100%);
    border-radius: 4px;
    transition: width 0.5s ease;
}

.progress-bar-thick {
    height: 12px;
}

.progress-bar-thin {
    height: 4px;
}
```

#### Barra de Progreso Circular
```css
.progress-circle {
    position: relative;
    width: 120px;
    height: 120px;
}

.progress-circle-svg {
    transform: rotate(-90deg);
}

.progress-circle-bg {
    fill: none;
    stroke: rgba(242, 242, 242, 0.1);
    stroke-width: 8;
}

.progress-circle-fill {
    fill: none;
    stroke: url(#gradient);
    stroke-width: 8;
    stroke-linecap: round;
    transition: stroke-dashoffset 0.5s ease;
}

.progress-circle-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-family: 'Montserrat', sans-serif;
    font-size: 24px;
    font-weight: 800;
    color: #FFFFFF;
}
```

### Navegación

#### Navbar Global
```css
.navbar {
    position: sticky;
    top: 0;
    background: rgba(10, 10, 10, 0.95);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    padding: 16px 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    z-index: 100;
}

.navbar-brand {
    font-family: 'Montserrat', sans-serif;
    font-size: 24px;
    font-weight: 800;
    color: #44E5FF;
    text-decoration: none;
}

.navbar-menu {
    display: flex;
    gap: 24px;
    list-style: none;
}

.navbar-item {
    font-family: 'Inter', sans-serif;
    font-size: 16px;
    font-weight: 500;
    color: #F2F2F2;
    text-decoration: none;
    transition: color 0.3s ease;
}

.navbar-item:hover,
.navbar-item.active {
    color: #44E5FF;
}
```

#### Tabs
```css
.tabs {
    display: flex;
    gap: 8px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    margin-bottom: 24px;
}

.tab {
    padding: 12px 24px;
    font-family: 'Inter', sans-serif;
    font-size: 16px;
    font-weight: 500;
    color: #F2F2F2;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    cursor: pointer;
    transition: all 0.3s ease;
}

.tab:hover {
    color: #44E5FF;
}

.tab.active {
    color: #44E5FF;
    border-bottom-color: #44E5FF;
}
```

### Alertas y Notificaciones

#### Alert
```css
.alert {
    padding: 16px 20px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    gap: 12px;
    font-family: 'Inter', sans-serif;
    font-size: 16px;
}

.alert-success {
    background: rgba(16, 185, 129, 0.1);
    border: 1px solid #10B981;
    color: #10B981;
}

.alert-warning {
    background: rgba(245, 158, 11, 0.1);
    border: 1px solid #F59E0B;
    color: #F59E0B;
}

.alert-error {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid #EF4444;
    color: #EF4444;
}

.alert-info {
    background: rgba(68, 229, 255, 0.1);
    border: 1px solid #44E5FF;
    color: #44E5FF;
}
```

#### Toast Notification
```css
.toast {
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: rgba(10, 10, 10, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 16px 20px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 300px;
    animation: slideIn 0.3s ease;
    z-index: 2000;
}

@keyframes slideIn {
    from {
        transform: translateX(400px);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}
```

---

## 5.6 Iconografía

### Sistema de Iconos
- **Librería**: Font Awesome 6 o SVG custom
- **Tamaños**: 16px, 20px, 24px, 32px
- **Estilo**: Outline (líneas) para consistencia
- **Color**: Hereda del texto padre o `--color-primary`

### Iconos Principales

#### Navegación
- Home: `🏠` o `fa-home`
- Cursos: `📚` o `fa-book`
- Comunidad: `👥` o `fa-users`
- Perfil: `👤` o `fa-user`
- Chat: `💬` o `fa-comment`

#### Acciones
- Editar: `✏️` o `fa-edit`
- Eliminar: `🗑️` o `fa-trash`
- Guardar: `💾` o `fa-save`
- Compartir: `🔗` o `fa-share`
- Descargar: `⬇️` o `fa-download`

#### Estados
- Completado: `✅` o `fa-check-circle`
- En Progreso: `⏳` o `fa-clock`
- Bloqueado: `🔒` o `fa-lock`
- Advertencia: `⚠️` o `fa-exclamation-triangle`
- Error: `❌` o `fa-times-circle`

---

## 5.7 Animaciones y Transiciones

### Principios de Animación

1. **Sutileza**: Animaciones suaves y no intrusivas
2. **Propósito**: Cada animación tiene una función clara
3. **Duración**: 200-400ms para interacciones, 500-800ms para transiciones de página
4. **Easing**: `ease` o `cubic-bezier` para naturalidad

### Transiciones Estándar

```css
/* Transición general */
transition: all 0.3s ease;

/* Transición de color */
transition: color 0.3s ease;

/* Transición de transformación */
transition: transform 0.3s ease, box-shadow 0.3s ease;

/* Transición de opacidad */
transition: opacity 0.3s ease;
```

### Animaciones Clave

#### Fade In
```css
@keyframes fadeIn {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}

.fade-in {
    animation: fadeIn 0.5s ease;
}
```

#### Slide In
```css
@keyframes slideIn {
    from {
        transform: translateY(20px);
        opacity: 0;
    }
    to {
        transform: translateY(0);
        opacity: 1;
    }
}

.slide-in {
    animation: slideIn 0.5s ease;
}
```

#### Pulse (para notificaciones)
```css
@keyframes pulse {
    0%, 100% {
        transform: scale(1);
    }
    50% {
        transform: scale(1.05);
    }
}

.pulse {
    animation: pulse 2s infinite;
}
```

#### Shimmer (loading)
```css
@keyframes shimmer {
    0% {
        background-position: -1000px 0;
    }
    100% {
        background-position: 1000px 0;
    }
}

.shimmer {
    background: linear-gradient(
        90deg,
        rgba(242, 242, 242, 0.1) 0%,
        rgba(242, 242, 242, 0.2) 50%,
        rgba(242, 242, 242, 0.1) 100%
    );
    background-size: 1000px 100%;
    animation: shimmer 2s infinite;
}
```

---

## 5.8 Patrones de Diseño

### Loading States

#### Skeleton Screen
```html
<div class="skeleton-card">
    <div class="skeleton-line skeleton-title"></div>
    <div class="skeleton-line skeleton-text"></div>
    <div class="skeleton-line skeleton-text"></div>
</div>
```

```css
.skeleton-line {
    height: 16px;
    background: rgba(242, 242, 242, 0.1);
    border-radius: 4px;
    margin-bottom: 12px;
    animation: shimmer 2s infinite;
}

.skeleton-title {
    height: 24px;
    width: 60%;
}

.skeleton-text {
    width: 100%;
}
```

#### Spinner
```css
.spinner {
    width: 40px;
    height: 40px;
    border: 4px solid rgba(242, 242, 242, 0.1);
    border-top-color: #44E5FF;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}
```

### Empty States

```html
<div class="empty-state">
    <div class="empty-icon">📭</div>
    <h3 class="empty-title">No hay contenido aún</h3>
    <p class="empty-description">Cuando agregues contenido, aparecerá aquí.</p>
    <button class="btn-primary">Agregar Contenido</button>
</div>
```

```css
.empty-state {
    text-align: center;
    padding: 64px 32px;
}

.empty-icon {
    font-size: 64px;
    margin-bottom: 24px;
    opacity: 0.5;
}

.empty-title {
    font-family: 'Montserrat', sans-serif;
    font-size: 24px;
    font-weight: 800;
    color: #FFFFFF;
    margin-bottom: 12px;
}

.empty-description {
    color: #F2F2F2;
    margin-bottom: 24px;
}
```

### Error States

```html
<div class="error-state">
    <div class="error-icon">⚠️</div>
    <h3 class="error-title">Algo salió mal</h3>
    <p class="error-description">No pudimos cargar el contenido. Por favor, intenta de nuevo.</p>
    <button class="btn-primary">Reintentar</button>
</div>
```

---

## 5.9 Responsive Behavior (Limitado)

### Filosofía No Responsiva
Chat-Bot-LIA utiliza un diseño **no responsivo** similar a SAES:

- **Ancho fijo**: 1280px mínimo
- **Scroll horizontal**: Permitido en viewports menores
- **Sin breakpoints**: No hay media queries
- **Optimizado para escritorio**: Experiencia principal en desktop

### Excepciones Responsivas

Solo algunos elementos críticos tienen comportamiento adaptativo:

```css
/* Solo para elementos muy específicos */
@media (max-width: 1280px) {
    .navbar {
        padding: 12px 16px;
    }
    
    .modal {
        width: 95%;
    }
}
```

---

## 5.10 Accesibilidad (WCAG 2.1 AA)

### Contraste de Colores

Todos los colores cumplen con WCAG 2.1 AA:

- **Texto normal**: Mínimo 4.5:1
- **Texto grande**: Mínimo 3:1
- **Elementos UI**: Mínimo 3:1

### Navegación por Teclado

- **Tab**: Navegación entre elementos
- **Enter/Space**: Activar botones y links
- **Esc**: Cerrar modales
- **Arrow keys**: Navegación en listas y tabs

### ARIA Labels

```html
<!-- Botones con aria-label -->
<button aria-label="Cerrar modal" class="modal-close">×</button>

<!-- Inputs con aria-describedby -->
<input
    type="text"
    aria-describedby="email-help"
    placeholder="Email"
/>
<span id="email-help">Ingresa tu email institucional</span>

<!-- Estados con aria-live -->
<div aria-live="polite" aria-atomic="true">
    Progreso actualizado: 75%
</div>
```

### Focus Visible

```css
*:focus-visible {
    outline: 2px solid #44E5FF;
    outline-offset: 2px;
}

button:focus-visible,
a:focus-visible {
    box-shadow: 0 0 0 3px rgba(68, 229, 255, 0.3);
}
```

---

## 5.11 Temas (Dark/Light Mode)

### Tema Oscuro (Por Defecto)

El tema oscuro es el tema principal y por defecto de la plataforma.

### Tema Claro (Opcional)

```css
[data-theme="light"] {
    --color-bg-dark: #FFFFFF;
    --color-bg-light: #F2F2F2;
    --color-contrast: #0A0A0A;
    --text-on-dark: #0A0A0A;
    --text-muted: #6B7280;
}
```

### Toggle de Tema

```html
<button class="theme-toggle" aria-label="Cambiar tema">
    <span class="theme-icon">🌙</span>
</button>
```

```javascript
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}
```

---

## 5.12 Guía de Uso de Componentes

### Jerarquía de Botones

1. **Un solo botón primario** por sección
2. **Botones secundarios** para acciones alternativas
3. **Botones de texto** para acciones terciarias

### Uso de Colores

1. **Turquesa**: Acciones principales y elementos interactivos
2. **Azul Profundo**: Estados hover y acentos
3. **Verde**: Éxito y completado
4. **Amarillo**: Advertencias
5. **Rojo**: Errores y acciones destructivas

### Espaciado Consistente

- **Entre secciones**: 48px (--spacing-xxl)
- **Entre elementos**: 24px (--spacing-lg)
- **Padding de tarjetas**: 24px
- **Padding de botones**: 12px 24px

---

## Resumen de Diseño

### Paleta de Colores
- **5 colores principales**: Turquesa IA, Carbón Digital, Gris Neblina, Blanco Puro, Azul Profundo
- **4 colores semánticos**: Éxito, Advertencia, Error, Información
- **Contraste WCAG AA**: Todos los colores cumplen

### Tipografía
- **2 familias**: Montserrat (headings), Inter (body)
- **Jerarquía clara**: H1 32px, H2 24px, Body 16px
- **No responsiva**: Tamaños fijos

### Layout
- **Ancho fijo**: 1280px mínimo
- **No responsivo**: Scroll horizontal permitido
- **Espaciado**: Sistema de 8px

### Componentes
- **10+ componentes**: Botones, tarjetas, inputs, modales, etc.
- **Consistencia**: Estilos unificados
- **Accesibilidad**: WCAG 2.1 AA completo

---

**Documento:** PRD 05 - Diseño y UX  
**Versión:** 1.0  
**Fecha:** Enero 2025  
**Autor:** Equipo de Desarrollo Chat-Bot-LIA
