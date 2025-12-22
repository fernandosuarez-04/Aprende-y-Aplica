export interface ThemeStyle {
  background_type: 'image' | 'color' | 'gradient';
  background_value: string;
  primary_button_color: string;
  secondary_button_color: string;
  accent_color: string;
  sidebar_background: string;
  card_background: string;
  text_color?: string;
  border_color?: string;
  modal_opacity?: number;
  card_opacity?: number;
  sidebar_opacity?: number;
}

export interface ThemeConfig {
  id: string;
  name: string;
  description: string;
  panel: ThemeStyle;
  userDashboard: ThemeStyle;
  login: ThemeStyle;
}

export interface BrandingColors {
  color_primary: string;
  color_secondary: string;
  color_accent: string;
}

/**
 * Función auxiliar para oscurecer un color hexadecimal
 */
function darkenColor(hex: string, percent: number): string {
  // Remover el # si existe
  hex = hex.replace('#', '');

  // Convertir a RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Oscurecer
  const newR = Math.floor(r * (1 - percent));
  const newG = Math.floor(g * (1 - percent));
  const newB = Math.floor(b * (1 - percent));

  // Convertir de vuelta a hex
  const toHex = (n: number) => {
    const hex = n.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
}

/**
 * Genera un tema automáticamente desde los colores de Branding
 */
export function generateBrandingTheme(branding: BrandingColors): ThemeConfig {
  const darkPrimary = darkenColor(branding.color_primary, 0.7);
  const mediumPrimary = darkenColor(branding.color_primary, 0.5);
  const lightPrimary = darkenColor(branding.color_primary, 0.3);

  return {
    id: 'branding-personalizado',
    name: 'Branding Personalizado',
    description: 'Tema generado automáticamente con los colores de tu marca',
    panel: {
      background_type: 'gradient',
      background_value: `linear-gradient(135deg, ${darkPrimary} 0%, ${mediumPrimary} 50%, ${lightPrimary} 100%)`,
      primary_button_color: branding.color_primary,
      secondary_button_color: branding.color_secondary,
      accent_color: branding.color_accent,
      sidebar_background: darkPrimary,
      card_background: darkPrimary,
      text_color: '#ffffff',
      border_color: '#334155',
      modal_opacity: 0.95,
      card_opacity: 0.95,
      sidebar_opacity: 0.98
    },
    userDashboard: {
      background_type: 'gradient',
      background_value: `linear-gradient(135deg, ${darkPrimary} 0%, ${mediumPrimary} 50%, ${lightPrimary} 100%)`,
      primary_button_color: branding.color_primary,
      secondary_button_color: branding.color_secondary,
      accent_color: branding.color_accent,
      sidebar_background: darkPrimary,
      card_background: darkPrimary,
      text_color: '#ffffff',
      border_color: '#334155',
      modal_opacity: 0.95,
      card_opacity: 0.95,
      sidebar_opacity: 0.98
    },
    login: {
      background_type: 'gradient',
      background_value: `linear-gradient(135deg, ${darkPrimary} 0%, ${lightPrimary} 100%)`,
      primary_button_color: branding.color_primary,
      secondary_button_color: branding.color_secondary,
      accent_color: branding.color_accent,
      sidebar_background: 'transparent',
      card_background: `rgba(30, 41, 59, 0.95)`,
      text_color: '#ffffff',
      border_color: '#334155',
      modal_opacity: 0.95,
      card_opacity: 0.95,
      sidebar_opacity: 1
    }
  };
}

export const PRESET_THEMES: Record<string, ThemeConfig> = {
  // 1. Corporativo Azul (Mantener sin cambios)
  'corporativo-azul': {
    id: 'corporativo-azul',
    name: 'Corporativo Azul',
    description: 'Tema profesional con azul corporativo',
    panel: {
      background_type: 'gradient',
      background_value: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
      primary_button_color: '#0ea5e9',
      secondary_button_color: '#0284c7',
      accent_color: '#38bdf8',
      sidebar_background: '#0c1821',
      card_background: '#0c1821',
      text_color: '#e0f2fe',
      border_color: '#334155',
      modal_opacity: 0.95,
      card_opacity: 0.95,
      sidebar_opacity: 0.98
    },
    userDashboard: {
      background_type: 'gradient',
      background_value: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
      primary_button_color: '#0ea5e9',
      secondary_button_color: '#0284c7',
      accent_color: '#38bdf8',
      sidebar_background: '#0c1821',
      card_background: '#0c1821',
      text_color: '#e0f2fe',
      border_color: '#334155',
      modal_opacity: 0.95,
      card_opacity: 0.95,
      sidebar_opacity: 0.98
    },
    login: {
      background_type: 'gradient',
      background_value: 'linear-gradient(135deg, #0f2027 0%, #2c5364 100%)',
      primary_button_color: '#0ea5e9',
      secondary_button_color: '#0284c7',
      accent_color: '#38bdf8',
      sidebar_background: 'transparent',
      card_background: 'rgba(30, 41, 59, 0.95)',
      text_color: '#e0f2fe',
      border_color: '#334155',
      modal_opacity: 0.95,
      card_opacity: 0.95,
      sidebar_opacity: 1
    }
  },

  // 2. Ejecutivo Oscuro (Mantener sin cambios)
  'ejecutivo-oscuro': {
    id: 'ejecutivo-oscuro',
    name: 'Ejecutivo Oscuro',
    description: 'Tema oscuro elegante para ejecutivos',
    panel: {
      background_type: 'gradient',
      background_value: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #2a2a2a 100%)',
      primary_button_color: '#a78bfa',
      secondary_button_color: '#8b5cf6',
      accent_color: '#c4b5fd',
      sidebar_background: '#050505',
      card_background: '#050505',
      text_color: '#fafafa',
      border_color: '#404040',
      modal_opacity: 0.95,
      card_opacity: 0.95,
      sidebar_opacity: 0.98
    },
    userDashboard: {
      background_type: 'gradient',
      background_value: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #2a2a2a 100%)',
      primary_button_color: '#a78bfa',
      secondary_button_color: '#8b5cf6',
      accent_color: '#c4b5fd',
      sidebar_background: '#050505',
      card_background: '#050505',
      text_color: '#fafafa',
      border_color: '#404040',
      modal_opacity: 0.95,
      card_opacity: 0.95,
      sidebar_opacity: 0.98
    },
    login: {
      background_type: 'color',
      background_value: '#0a0a0a',
      primary_button_color: '#a78bfa',
      secondary_button_color: '#8b5cf6',
      accent_color: '#c4b5fd',
      sidebar_background: 'transparent',
      card_background: 'rgba(26, 26, 26, 0.95)',
      text_color: '#fafafa',
      border_color: '#404040',
      modal_opacity: 0.95,
      card_opacity: 0.95,
      sidebar_opacity: 1
    }
  },

  // 3. Premium Dorado (MEJORADO - sin café)
  'premium-dorado': {
    id: 'premium-dorado',
    name: 'Premium Dorado',
    description: 'Tema de lujo con detalles dorados sobre fondo oscuro elegante',
    panel: {
      background_type: 'gradient',
      background_value: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #2d2d2d 100%)',
      primary_button_color: '#fbbf24',
      secondary_button_color: '#f59e0b',
      accent_color: '#fb923c',
      sidebar_background: '#0f0f0f',
      card_background: '#0f0f0f',
      text_color: '#fef3c7',
      border_color: '#78716c',
      modal_opacity: 0.95,
      card_opacity: 0.95,
      sidebar_opacity: 0.98
    },
    userDashboard: {
      background_type: 'gradient',
      background_value: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #2d2d2d 100%)',
      primary_button_color: '#fbbf24',
      secondary_button_color: '#f59e0b',
      accent_color: '#fb923c',
      sidebar_background: '#0f0f0f',
      card_background: '#0f0f0f',
      text_color: '#fef3c7',
      border_color: '#78716c',
      modal_opacity: 0.95,
      card_opacity: 0.95,
      sidebar_opacity: 0.98
    },
    login: {
      background_type: 'gradient',
      background_value: 'linear-gradient(135deg, #0a0a0a 0%, #2d2d2d 100%)',
      primary_button_color: '#fbbf24',
      secondary_button_color: '#f59e0b',
      accent_color: '#fb923c',
      sidebar_background: 'transparent',
      card_background: 'rgba(26, 26, 26, 0.95)',
      text_color: '#fef3c7',
      border_color: '#78716c',
      modal_opacity: 0.95,
      card_opacity: 0.95,
      sidebar_opacity: 1
    }
  },

  // 4. SOFIA Predeterminado (Sistema de Diseño Oficial)
  'sofia-predeterminado': {
    id: 'sofia-predeterminado',
    name: 'SOFIA Predeterminado',
    description: 'Tema oficial basado en el Sistema de Diseño SOFIA (Modo Oscuro)',
    panel: {
      background_type: 'color',
      background_value: '#0F1419',
      primary_button_color: '#0A2540',
      secondary_button_color: '#334155',
      accent_color: '#00D4B3',
      sidebar_background: '#0F1419',
      card_background: '#1E2329',
      text_color: '#FFFFFF',
      border_color: '#334155',
      modal_opacity: 0.95,
      card_opacity: 0.95,
      sidebar_opacity: 0.98
    },
    userDashboard: {
      background_type: 'color',
      background_value: '#0F1419',
      primary_button_color: '#0A2540',
      secondary_button_color: '#334155',
      accent_color: '#00D4B3',
      sidebar_background: '#0F1419',
      card_background: '#1E2329',
      text_color: '#FFFFFF',
      border_color: '#334155',
      modal_opacity: 0.95,
      card_opacity: 0.95,
      sidebar_opacity: 0.98
    },
    login: {
      background_type: 'color',
      background_value: '#0F1419',
      primary_button_color: '#0A2540',
      secondary_button_color: '#334155',
      accent_color: '#00D4B3',
      sidebar_background: 'transparent',
      card_background: '#1E2329',
      text_color: '#FFFFFF',
      border_color: '#334155',
      modal_opacity: 0.95,
      card_opacity: 0.95,
      sidebar_opacity: 1
    }
  },

  // 5. Empresarial Verde (NUEVO)
  'empresarial-verde': {
    id: 'empresarial-verde',
    name: 'Empresarial Verde',
    description: 'Tema profesional con tonos verdes corporativos',
    panel: {
      background_type: 'gradient',
      background_value: 'linear-gradient(135deg, #064e3b 0%, #047857 50%, #059669 100%)',
      primary_button_color: '#10b981',
      secondary_button_color: '#34d399',
      accent_color: '#6ee7b7',
      sidebar_background: '#064e3b',
      card_background: '#064e3b',
      text_color: '#d1fae5',
      border_color: '#334155',
      modal_opacity: 0.95,
      card_opacity: 0.95,
      sidebar_opacity: 0.98
    },
    userDashboard: {
      background_type: 'gradient',
      background_value: 'linear-gradient(135deg, #064e3b 0%, #047857 50%, #059669 100%)',
      primary_button_color: '#10b981',
      secondary_button_color: '#34d399',
      accent_color: '#6ee7b7',
      sidebar_background: '#064e3b',
      card_background: '#064e3b',
      text_color: '#d1fae5',
      border_color: '#334155',
      modal_opacity: 0.95,
      card_opacity: 0.95,
      sidebar_opacity: 0.98
    },
    login: {
      background_type: 'gradient',
      background_value: 'linear-gradient(135deg, #064e3b 0%, #059669 100%)',
      primary_button_color: '#10b981',
      secondary_button_color: '#34d399',
      accent_color: '#6ee7b7',
      sidebar_background: 'transparent',
      card_background: 'rgba(30, 41, 59, 0.95)',
      text_color: '#d1fae5',
      border_color: '#334155',
      modal_opacity: 0.95,
      card_opacity: 0.95,
      sidebar_opacity: 1
    }
  },

  // 6. Financiero Premium (NUEVO)
  'financiero-premium': {
    id: 'financiero-premium',
    name: 'Financiero Premium',
    description: 'Tema profesional para sector financiero con azules elegantes',
    panel: {
      background_type: 'gradient',
      background_value: 'linear-gradient(135deg, #0c4a6e 0%, #0369a1 50%, #0284c7 100%)',
      primary_button_color: '#0ea5e9',
      secondary_button_color: '#06b6d4',
      accent_color: '#38bdf8',
      sidebar_background: '#0c4a6e',
      card_background: '#0c4a6e',
      text_color: '#e0f2fe',
      border_color: '#334155',
      modal_opacity: 0.95,
      card_opacity: 0.95,
      sidebar_opacity: 0.98
    },
    userDashboard: {
      background_type: 'gradient',
      background_value: 'linear-gradient(135deg, #0c4a6e 0%, #0369a1 50%, #0284c7 100%)',
      primary_button_color: '#0ea5e9',
      secondary_button_color: '#06b6d4',
      accent_color: '#38bdf8',
      sidebar_background: '#0c4a6e',
      card_background: '#0c4a6e',
      text_color: '#e0f2fe',
      border_color: '#334155',
      modal_opacity: 0.95,
      card_opacity: 0.95,
      sidebar_opacity: 0.98
    },
    login: {
      background_type: 'gradient',
      background_value: 'linear-gradient(135deg, #0c4a6e 0%, #0284c7 100%)',
      primary_button_color: '#0ea5e9',
      secondary_button_color: '#06b6d4',
      accent_color: '#38bdf8',
      sidebar_background: 'transparent',
      card_background: 'rgba(30, 41, 59, 0.95)',
      text_color: '#e0f2fe',
      border_color: '#334155',
      modal_opacity: 0.95,
      card_opacity: 0.95,
      sidebar_opacity: 1
    }
  },

  // 7. Industrial Gris (NUEVO)
  'industrial-gris': {
    id: 'industrial-gris',
    name: 'Industrial Gris',
    description: 'Tema neutro y profesional con tonos grises industriales',
    panel: {
      background_type: 'gradient',
      background_value: 'linear-gradient(135deg, #18181b 0%, #27272a 50%, #3f3f46 100%)',
      primary_button_color: '#71717a',
      secondary_button_color: '#a1a1aa',
      accent_color: '#64748b',
      sidebar_background: '#18181b',
      card_background: '#18181b',
      text_color: '#fafafa',
      border_color: '#52525b',
      modal_opacity: 0.95,
      card_opacity: 0.95,
      sidebar_opacity: 0.98
    },
    userDashboard: {
      background_type: 'gradient',
      background_value: 'linear-gradient(135deg, #18181b 0%, #27272a 50%, #3f3f46 100%)',
      primary_button_color: '#71717a',
      secondary_button_color: '#a1a1aa',
      accent_color: '#64748b',
      sidebar_background: '#18181b',
      card_background: '#18181b',
      text_color: '#fafafa',
      border_color: '#52525b',
      modal_opacity: 0.95,
      card_opacity: 0.95,
      sidebar_opacity: 0.98
    },
    login: {
      background_type: 'gradient',
      background_value: 'linear-gradient(135deg, #18181b 0%, #3f3f46 100%)',
      primary_button_color: '#71717a',
      secondary_button_color: '#a1a1aa',
      accent_color: '#64748b',
      sidebar_background: 'transparent',
      card_background: 'rgba(39, 39, 42, 0.95)',
      text_color: '#fafafa',
      border_color: '#52525b',
      modal_opacity: 0.95,
      card_opacity: 0.95,
      sidebar_opacity: 1
    }
  },

  // 8. Tecnológico Cyan (NUEVO)
  'tecnologico-cyan': {
    id: 'tecnologico-cyan',
    name: 'Tecnológico Cyan',
    description: 'Tema moderno con tonos cyan y teal tecnológicos',
    panel: {
      background_type: 'gradient',
      background_value: 'linear-gradient(135deg, #134e4a 0%, #155e75 50%, #0891b2 100%)',
      primary_button_color: '#06b6d4',
      secondary_button_color: '#14b8a6',
      accent_color: '#22d3ee',
      sidebar_background: '#134e4a',
      card_background: '#134e4a',
      text_color: '#ccfbf1',
      border_color: '#334155',
      modal_opacity: 0.95,
      card_opacity: 0.95,
      sidebar_opacity: 0.98
    },
    userDashboard: {
      background_type: 'gradient',
      background_value: 'linear-gradient(135deg, #134e4a 0%, #155e75 50%, #0891b2 100%)',
      primary_button_color: '#06b6d4',
      secondary_button_color: '#14b8a6',
      accent_color: '#22d3ee',
      sidebar_background: '#134e4a',
      card_background: '#134e4a',
      text_color: '#ccfbf1',
      border_color: '#334155',
      modal_opacity: 0.95,
      card_opacity: 0.95,
      sidebar_opacity: 0.98
    },
    login: {
      background_type: 'gradient',
      background_value: 'linear-gradient(135deg, #134e4a 0%, #0891b2 100%)',
      primary_button_color: '#06b6d4',
      secondary_button_color: '#14b8a6',
      accent_color: '#22d3ee',
      sidebar_background: 'transparent',
      card_background: 'rgba(30, 41, 59, 0.95)',
      text_color: '#ccfbf1',
      border_color: '#334155',
      modal_opacity: 0.95,
      card_opacity: 0.95,
      sidebar_opacity: 1
    }
  }
};

export const DEFAULT_THEME = 'corporativo-azul';

export function getThemeById(themeId: string): ThemeConfig | null {
  return PRESET_THEMES[themeId] || null;
}

export function getAllThemes(): ThemeConfig[] {
  return Object.values(PRESET_THEMES);
}
