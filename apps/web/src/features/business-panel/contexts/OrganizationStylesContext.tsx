'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useRef, useCallback } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { PRESET_THEMES, DEFAULT_THEME, getThemeStylesForMode } from '../config/preset-themes';
import { useThemeStore } from '@/core/stores/themeStore';

// Solo loguear en desarrollo
const isDev = process.env.NODE_ENV === 'development';
const log = isDev ? console.log : () => {};

export interface StyleConfig {
  background_type: 'image' | 'color' | 'gradient';
  background_value: string;
  primary_button_color: string;
  secondary_button_color: string;
  accent_color: string;
  sidebar_background: string;
  card_background: string;
  text_color?: string;
  border_color?: string;
  modal_opacity?: number; // 0 (transparente) a 1 (opaco)
  card_opacity?: number; // 0 (transparente) a 1 (opaco)
  sidebar_opacity?: number; // 0 (transparente) a 1 (opaco)
}

export interface OrganizationStyles {
  panel: StyleConfig | null;
  userDashboard: StyleConfig | null;
  login: StyleConfig | null;
  selectedTheme: string | null;
  // Indica si el tema actual soporta modo dual (claro/oscuro)
  supportsDualMode?: boolean;
}

interface OrganizationStylesContextType {
  styles: OrganizationStyles | null;
  // Estilos efectivos según el modo actual del usuario (light/dark)
  effectiveStyles: OrganizationStyles | null;
  loading: boolean;
  error: string | null;
  updateStyles: (panel?: StyleConfig, userDashboard?: StyleConfig, login?: StyleConfig) => Promise<boolean>;
  applyTheme: (themeId: string) => Promise<boolean>;
  refetch: () => Promise<void>;
}

const OrganizationStylesContext = createContext<OrganizationStylesContextType | undefined>(undefined);

export function OrganizationStylesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const resolvedTheme = useThemeStore((state) => state.resolvedTheme);
  const [styles, setStyles] = useState<OrganizationStyles | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cache para evitar recálculos innecesarios
  const effectiveStylesCache = useRef<{
    styles: OrganizationStyles | null;
    theme: string;
    result: OrganizationStyles | null;
  }>({ styles: null, theme: '', result: null });

  // Calcular estilos efectivos basados en el modo de tema actual
  // OPTIMIZADO: Usa cache para evitar crear nuevos objetos innecesariamente
  const effectiveStyles = useMemo<OrganizationStyles | null>(() => {
    if (!styles) return null;

    // Verificar si podemos usar el cache
    const cache = effectiveStylesCache.current;
    if (cache.styles === styles && cache.theme === resolvedTheme && cache.result) {
      return cache.result;
    }

    let result: OrganizationStyles;

    // Si el tema soporta modo dual, obtener los estilos para el modo actual
    if (styles.supportsDualMode && styles.selectedTheme) {
      const modeStyles = getThemeStylesForMode(styles.selectedTheme, resolvedTheme);
      if (modeStyles) {
        result = {
          ...styles,
          panel: modeStyles.panel,
          userDashboard: modeStyles.userDashboard,
          login: modeStyles.login,
        };
      } else {
        result = styles;
      }
    } else {
      // Si no soporta modo dual, retornar los estilos tal cual
      result = styles;
    }

    // Actualizar cache
    effectiveStylesCache.current = { styles, theme: resolvedTheme, result };
    return result;
  }, [styles, resolvedTheme]);

  // Memoizar fetchStyles para evitar recreaciones
  const fetchStyles = useCallback(async () => {
    // Si es Administrador sin organización, usar tema por defecto sin llamar a la API
    const normalizedRole = user?.cargo_rol?.toLowerCase().trim() || '';
    const isAdmin = normalizedRole === 'administrador';

    if (isAdmin && !user?.organization_id) {
      const defaultTheme = PRESET_THEMES[DEFAULT_THEME];
      if (defaultTheme) {
        setStyles({
          panel: defaultTheme.panel,
          userDashboard: defaultTheme.userDashboard,
          login: defaultTheme.login,
          selectedTheme: DEFAULT_THEME,
          supportsDualMode: defaultTheme.supportsDualMode
        });
      }
      setLoading(false);
      return;
    }

    if (!user?.organization_id) {
      // Aplicar tema por defecto cuando no hay organization_id
      const defaultTheme = PRESET_THEMES[DEFAULT_THEME];
      if (defaultTheme) {
        setStyles({
          panel: defaultTheme.panel,
          userDashboard: defaultTheme.userDashboard,
          login: defaultTheme.login,
          selectedTheme: DEFAULT_THEME,
          supportsDualMode: defaultTheme.supportsDualMode
        });
      }
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/business/settings/styles', {
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al obtener estilos');
      }

      // Si los estilos están vacíos, usar tema por defecto
      if (!data.styles?.panel && !data.styles?.selectedTheme) {
        const defaultTheme = PRESET_THEMES[DEFAULT_THEME];
        if (defaultTheme) {
          const defaultStyles: OrganizationStyles = {
            panel: defaultTheme.panel,
            userDashboard: defaultTheme.userDashboard,
            login: defaultTheme.login,
            selectedTheme: DEFAULT_THEME,
            supportsDualMode: defaultTheme.supportsDualMode
          };
          setStyles(defaultStyles);
          return;
        }
      }

      setStyles(data.styles);

      // Guardar en localStorage como respaldo
      if (typeof window !== 'undefined' && data.styles) {
        try {
          localStorage.setItem(
            `business-theme-${user.organization_id}`,
            JSON.stringify(data.styles)
          );
        } catch (e) {
          // Silenciar error de localStorage
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error al obtener estilos');

      // Intentar cargar desde localStorage como fallback
      if (typeof window !== 'undefined' && user?.organization_id) {
        try {
          const cached = localStorage.getItem(`business-theme-${user.organization_id}`);
          if (cached) {
            setStyles(JSON.parse(cached));
          } else {
            // No hay cache, usar tema por defecto
            const defaultTheme = PRESET_THEMES[DEFAULT_THEME];
            if (defaultTheme) {
              setStyles({
                panel: defaultTheme.panel,
                userDashboard: defaultTheme.userDashboard,
                login: defaultTheme.login,
                selectedTheme: DEFAULT_THEME,
                supportsDualMode: defaultTheme.supportsDualMode
              });
            } else {
              setStyles(null);
            }
          }
        } catch (e) {
          // Error parseando cache, usar tema por defecto
          const defaultTheme = PRESET_THEMES[DEFAULT_THEME];
          if (defaultTheme) {
            setStyles({
              panel: defaultTheme.panel,
              userDashboard: defaultTheme.userDashboard,
              login: defaultTheme.login,
              selectedTheme: DEFAULT_THEME,
              supportsDualMode: defaultTheme.supportsDualMode
            });
          } else {
            setStyles(null);
          }
        }
      } else {
        // Sin organization_id, usar tema por defecto
        const defaultTheme = PRESET_THEMES[DEFAULT_THEME];
        if (defaultTheme) {
          setStyles({
            panel: defaultTheme.panel,
            userDashboard: defaultTheme.userDashboard,
            login: defaultTheme.login,
            selectedTheme: DEFAULT_THEME,
            supportsDualMode: defaultTheme.supportsDualMode
          });
        } else {
          setStyles(null);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [user?.organization_id, user?.cargo_rol]);

  useEffect(() => {
    fetchStyles();
  }, [fetchStyles]);

  const updateStyles = async (
    panel?: StyleConfig,
    userDashboard?: StyleConfig,
    login?: StyleConfig
  ): Promise<boolean> => {
    try {
      const updateData: any = {};
      if (panel !== undefined) updateData.panel = panel;
      if (userDashboard !== undefined) updateData.userDashboard = userDashboard;
      if (login !== undefined) updateData.login = login;

      // console.log('📤 Enviando actualización de estilos:', updateData);

      const response = await fetch('/api/business/settings/styles', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al actualizar estilos');
      }

      // console.log('✅ Estilos actualizados:', data.styles);
      setStyles(data.styles);

      // Guardar en localStorage
      if (typeof window !== 'undefined' && user?.organization_id && data.styles) {
        try {
          localStorage.setItem(
            `business-theme-${user.organization_id}`,
            JSON.stringify(data.styles)
          );
        } catch (e) {
          console.error('Error guardando tema en localStorage:', e);
        }
      }

      return true;
    } catch (err: any) {
      // console.error('Error updating styles:', err);
      setError(err.message || 'Error al actualizar estilos');
      return false;
    }
  };

  const applyTheme = async (themeId: string): Promise<boolean> => {
    try {
      // console.log('🎨 Aplicando tema:', themeId);

      const response = await fetch('/api/business/settings/styles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ themeId }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al aplicar tema');
      }

      // console.log('✅ Tema aplicado:', data.styles);
      setStyles(data.styles);

      // Guardar en localStorage
      if (typeof window !== 'undefined' && user?.organization_id && data.styles) {
        try {
          localStorage.setItem(
            `business-theme-${user.organization_id}`,
            JSON.stringify(data.styles)
          );
        } catch (e) {
          console.error('Error guardando tema en localStorage:', e);
        }
      }

      return true;
    } catch (err: any) {
      // console.error('Error applying theme:', err);
      setError(err.message || 'Error al aplicar tema');
      return false;
    }
  };

  const refetch = async () => {
    // console.log('🔄 Refrescando estilos...');
    await fetchStyles();
  };

  return (
    <OrganizationStylesContext.Provider value={{ styles, effectiveStyles, loading, error, updateStyles, applyTheme, refetch }}>
      {children}
    </OrganizationStylesContext.Provider>
  );
}

export function useOrganizationStylesContext() {
  const context = useContext(OrganizationStylesContext);
  if (context === undefined) {
    throw new Error('useOrganizationStylesContext must be used within OrganizationStylesProvider');
  }
  return context;
}

