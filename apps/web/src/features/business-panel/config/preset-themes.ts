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

export const PRESET_THEMES: Record<string, ThemeConfig> = {
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
  'profesional-verde': {
    id: 'profesional-verde',
    name: 'Profesional Verde',
    description: 'Tema empresarial con tonos verde esmeralda',
    panel: {
      background_type: 'gradient',
      background_value: 'linear-gradient(135deg, #0a4d3c 0%, #0d5943 50%, #0f6b4a 100%)',
      primary_button_color: '#10b981',
      secondary_button_color: '#059669',
      accent_color: '#34d399',
      sidebar_background: '#064e3b',
      card_background: '#064e3b',
      text_color: '#dcfce7',
      border_color: '#334155',
      modal_opacity: 0.95,
      card_opacity: 0.95,
      sidebar_opacity: 0.98
    },
    userDashboard: {
      background_type: 'gradient',
      background_value: 'linear-gradient(135deg, #0a4d3c 0%, #0d5943 50%, #0f6b4a 100%)',
      primary_button_color: '#10b981',
      secondary_button_color: '#059669',
      accent_color: '#34d399',
      sidebar_background: '#064e3b',
      card_background: '#064e3b',
      text_color: '#dcfce7',
      border_color: '#334155',
      modal_opacity: 0.95,
      card_opacity: 0.95,
      sidebar_opacity: 0.98
    },
    login: {
      background_type: 'gradient',
      background_value: 'linear-gradient(135deg, #064e3b 0%, #0f6b4a 100%)',
      primary_button_color: '#10b981',
      secondary_button_color: '#059669',
      accent_color: '#34d399',
      sidebar_background: 'transparent',
      card_background: 'rgba(30, 41, 59, 0.95)',
      text_color: '#dcfce7',
      border_color: '#334155',
      modal_opacity: 0.95,
      card_opacity: 0.95,
      sidebar_opacity: 1
    }
  },
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
  'tecnologico': {
    id: 'tecnologico',
    name: 'Tecnológico',
    description: 'Tema moderno con tonos tecnológicos cian y azul',
    panel: {
      background_type: 'gradient',
      background_value: 'linear-gradient(135deg, #134e4a 0%, #155e75 50%, #0c4a6e 100%)',
      primary_button_color: '#06b6d4',
      secondary_button_color: '#0891b2',
      accent_color: '#22d3ee',
      sidebar_background: '#0a3a40',
      card_background: '#0a3a40',
      text_color: '#cffafe',
      border_color: '#334155',
      modal_opacity: 0.95,
      card_opacity: 0.95,
      sidebar_opacity: 0.98
    },
    userDashboard: {
      background_type: 'gradient',
      background_value: 'linear-gradient(135deg, #134e4a 0%, #155e75 50%, #0c4a6e 100%)',
      primary_button_color: '#06b6d4',
      secondary_button_color: '#0891b2',
      accent_color: '#22d3ee',
      sidebar_background: '#0a3a40',
      card_background: '#0a3a40',
      text_color: '#cffafe',
      border_color: '#334155',
      modal_opacity: 0.95,
      card_opacity: 0.95,
      sidebar_opacity: 0.98
    },
    login: {
      background_type: 'gradient',
      background_value: 'linear-gradient(135deg, #0a3a40 0%, #0c4a6e 100%)',
      primary_button_color: '#06b6d4',
      secondary_button_color: '#0891b2',
      accent_color: '#22d3ee',
      sidebar_background: 'transparent',
      card_background: 'rgba(30, 41, 59, 0.95)',
      text_color: '#cffafe',
      border_color: '#334155',
      modal_opacity: 0.95,
      card_opacity: 0.95,
      sidebar_opacity: 1
    }
  },
  'financiero': {
    id: 'financiero',
    name: 'Financiero',
    description: 'Tema profesional para sector financiero',
    panel: {
      background_type: 'gradient',
      background_value: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #3730a3 100%)',
      primary_button_color: '#3b82f6',
      secondary_button_color: '#2563eb',
      accent_color: '#60a5fa',
      sidebar_background: '#1e1b4b',
      card_background: '#1e1b4b',
      text_color: '#dbeafe',
      border_color: '#334155',
      modal_opacity: 0.95,
      card_opacity: 0.95,
      sidebar_opacity: 0.98
    },
    userDashboard: {
      background_type: 'gradient',
      background_value: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #3730a3 100%)',
      primary_button_color: '#3b82f6',
      secondary_button_color: '#2563eb',
      accent_color: '#60a5fa',
      sidebar_background: '#1e1b4b',
      card_background: '#1e1b4b',
      text_color: '#dbeafe',
      border_color: '#334155',
      modal_opacity: 0.95,
      card_opacity: 0.95,
      sidebar_opacity: 0.98
    },
    login: {
      background_type: 'gradient',
      background_value: 'linear-gradient(135deg, #1e1b4b 0%, #3730a3 100%)',
      primary_button_color: '#3b82f6',
      secondary_button_color: '#2563eb',
      accent_color: '#60a5fa',
      sidebar_background: 'transparent',
      card_background: 'rgba(30, 41, 59, 0.95)',
      text_color: '#dbeafe',
      border_color: '#334155',
      modal_opacity: 0.95,
      card_opacity: 0.95,
      sidebar_opacity: 1
    }
  },
  'premium-dorado': {
    id: 'premium-dorado',
    name: 'Premium Dorado',
    description: 'Tema de lujo con detalles dorados',
    panel: {
      background_type: 'gradient',
      background_value: 'linear-gradient(135deg, #1c1917 0%, #292524 50%, #44403c 100%)',
      primary_button_color: '#f59e0b',
      secondary_button_color: '#d97706',
      accent_color: '#fbbf24',
      sidebar_background: '#0c0a09',
      card_background: '#0c0a09',
      text_color: '#fef9c3',
      border_color: '#78716c',
      modal_opacity: 0.95,
      card_opacity: 0.95,
      sidebar_opacity: 0.98
    },
    userDashboard: {
      background_type: 'gradient',
      background_value: 'linear-gradient(135deg, #1c1917 0%, #292524 50%, #44403c 100%)',
      primary_button_color: '#f59e0b',
      secondary_button_color: '#d97706',
      accent_color: '#fbbf24',
      sidebar_background: '#0c0a09',
      card_background: '#0c0a09',
      text_color: '#fef9c3',
      border_color: '#78716c',
      modal_opacity: 0.95,
      card_opacity: 0.95,
      sidebar_opacity: 0.98
    },
    login: {
      background_type: 'gradient',
      background_value: 'linear-gradient(135deg, #0c0a09 0%, #44403c 100%)',
      primary_button_color: '#f59e0b',
      secondary_button_color: '#d97706',
      accent_color: '#fbbf24',
      sidebar_background: 'transparent',
      card_background: 'rgba(28, 25, 23, 0.95)',
      text_color: '#fef9c3',
      border_color: '#78716c',
      modal_opacity: 0.95,
      card_opacity: 0.95,
      sidebar_opacity: 1
    }
  },
  'salud-wellness': {
    id: 'salud-wellness',
    name: 'Salud & Wellness',
    description: 'Tema suave y relajante para sector salud y bienestar',
    panel: {
      background_type: 'gradient',
      background_value: 'linear-gradient(135deg, #14532d 0%, #15803d 50%, #16a34a 100%)',
      primary_button_color: '#22c55e',
      secondary_button_color: '#16a34a',
      accent_color: '#4ade80',
      sidebar_background: '#14532d',
      card_background: '#14532d',
      text_color: '#dcfce7',
      border_color: '#334155',
      modal_opacity: 0.95,
      card_opacity: 0.95,
      sidebar_opacity: 0.98
    },
    userDashboard: {
      background_type: 'gradient',
      background_value: 'linear-gradient(135deg, #14532d 0%, #15803d 50%, #16a34a 100%)',
      primary_button_color: '#22c55e',
      secondary_button_color: '#16a34a',
      accent_color: '#4ade80',
      sidebar_background: '#14532d',
      card_background: '#14532d',
      text_color: '#dcfce7',
      border_color: '#334155',
      modal_opacity: 0.95,
      card_opacity: 0.95,
      sidebar_opacity: 0.98
    },
    login: {
      background_type: 'gradient',
      background_value: 'linear-gradient(135deg, #14532d 0%, #16a34a 100%)',
      primary_button_color: '#22c55e',
      secondary_button_color: '#16a34a',
      accent_color: '#4ade80',
      sidebar_background: 'transparent',
      card_background: 'rgba(30, 41, 59, 0.95)',
      text_color: '#dcfce7',
      border_color: '#334155',
      modal_opacity: 0.95,
      card_opacity: 0.95,
      sidebar_opacity: 1
    }
  },
  'creativo-magenta': {
    id: 'creativo-magenta',
    name: 'Creativo Magenta',
    description: 'Tema vibrante y creativo con tonos magenta y rosa',
    panel: {
      background_type: 'gradient',
      background_value: 'linear-gradient(135deg, #701a75 0%, #86198f 50%, #a21caf 100%)',
      primary_button_color: '#d946ef',
      secondary_button_color: '#c026d3',
      accent_color: '#e879f9',
      sidebar_background: '#581c87',
      card_background: '#581c87',
      text_color: '#fae8ff',
      border_color: '#334155',
      modal_opacity: 0.95,
      card_opacity: 0.95,
      sidebar_opacity: 0.98
    },
    userDashboard: {
      background_type: 'gradient',
      background_value: 'linear-gradient(135deg, #701a75 0%, #86198f 50%, #a21caf 100%)',
      primary_button_color: '#d946ef',
      secondary_button_color: '#c026d3',
      accent_color: '#e879f9',
      sidebar_background: '#581c87',
      card_background: '#581c87',
      text_color: '#fae8ff',
      border_color: '#334155',
      modal_opacity: 0.95,
      card_opacity: 0.95,
      sidebar_opacity: 0.98
    },
    login: {
      background_type: 'gradient',
      background_value: 'linear-gradient(135deg, #581c87 0%, #a21caf 100%)',
      primary_button_color: '#d946ef',
      secondary_button_color: '#c026d3',
      accent_color: '#e879f9',
      sidebar_background: 'transparent',
      card_background: 'rgba(30, 41, 59, 0.95)',
      text_color: '#fae8ff',
      border_color: '#334155',
      modal_opacity: 0.95,
      card_opacity: 0.95,
      sidebar_opacity: 1
    }
  },
  'minimalista-claro': {
    id: 'minimalista-claro',
    name: 'Minimalista Claro',
    description: 'Tema limpio y minimalista con tonos claros',
    panel: {
      background_type: 'color',
      background_value: '#f8fafc',
      primary_button_color: '#0f172a',
      secondary_button_color: '#475569',
      accent_color: '#64748b',
      sidebar_background: '#e2e8f0',
      card_background: '#ffffff',
      text_color: '#0f172a',
      border_color: '#cbd5e1',
      modal_opacity: 0.98,
      card_opacity: 0.95,
      sidebar_opacity: 0.98
    },
    userDashboard: {
      background_type: 'color',
      background_value: '#f8fafc',
      primary_button_color: '#0f172a',
      secondary_button_color: '#475569',
      accent_color: '#64748b',
      sidebar_background: '#e2e8f0',
      card_background: '#ffffff',
      text_color: '#0f172a',
      border_color: '#cbd5e1',
      modal_opacity: 0.98,
      card_opacity: 0.95,
      sidebar_opacity: 0.98
    },
    login: {
      background_type: 'color',
      background_value: '#f8fafc',
      primary_button_color: '#0f172a',
      secondary_button_color: '#475569',
      accent_color: '#64748b',
      sidebar_background: 'transparent',
      card_background: '#ffffff',
      text_color: '#0f172a',
      border_color: '#cbd5e1',
      modal_opacity: 0.98,
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
