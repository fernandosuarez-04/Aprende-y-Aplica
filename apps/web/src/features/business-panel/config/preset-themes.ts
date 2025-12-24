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
  // SOFIA Predeterminado (Sistema de Diseño Oficial)
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
  }
};

export const DEFAULT_THEME = 'sofia-predeterminado';

export function getThemeById(themeId: string): ThemeConfig | null {
  return PRESET_THEMES[themeId] || null;
}

export function getAllThemes(): ThemeConfig[] {
  return Object.values(PRESET_THEMES);
}
