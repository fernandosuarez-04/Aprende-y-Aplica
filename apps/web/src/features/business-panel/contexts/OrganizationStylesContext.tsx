'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { PRESET_THEMES, DEFAULT_THEME, getThemeStylesForMode } from '../config/preset-themes';
import { useThemeStore } from '@/core/stores/themeStore';

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

  // Calcular estilos efectivos basados en el modo de tema actual
  const effectiveStyles = useMemo<OrganizationStyles | null>(() => {
    if (!styles) return null;
    
    // Si el tema soporta modo dual, obtener los estilos para el modo actual
    if (styles.supportsDualMode && styles.selectedTheme) {
      const modeStyles = getThemeStylesForMode(styles.selectedTheme, resolvedTheme);
      if (modeStyles) {
        return {
          ...styles,
          panel: modeStyles.panel,
          userDashboard: modeStyles.userDashboard,
          login: modeStyles.login,
        };
      }
    }
    
    // Si no soporta modo dual, retornar los estilos tal cual
    return styles;
  }, [styles, resolvedTheme]);

  const fetchStyles = async () => {
    console.log('🔍 [OrganizationStylesContext] fetchStyles iniciado, user:', {
      userId: user?.id,
      organizationId: user?.organization_id,
      role: user?.cargo_rol
    });

    // Si es Administrador sin organización, usar tema por defecto sin llamar a la API
    const normalizedRole = user?.cargo_rol?.toLowerCase().trim() || '';
    const isAdmin = normalizedRole === 'administrador';
    
    if (isAdmin && !user?.organization_id) {
      console.log('👑 [OrganizationStylesContext] Usuario Administrador sin organización, aplicando tema por defecto');
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
      console.log('⚠️ [OrganizationStylesContext] No hay organization_id, aplicando tema por defecto');
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

      console.log('📡 [OrganizationStylesContext] Fetching styles from API...');
      const response = await fetch('/api/business/settings/styles', {
        credentials: 'include',
      });

      const data = await response.json();
      console.log('📥 [OrganizationStylesContext] Response:', data);

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al obtener estilos');
      }

      console.log('✅ [OrganizationStylesContext] Estilos obtenidos:', {
        panel: data.styles?.panel,
        selectedTheme: data.styles?.selectedTheme
      });

      // Si los estilos están vacíos, usar tema por defecto
      if (!data.styles?.panel && !data.styles?.selectedTheme) {
        console.log('🎨 [OrganizationStylesContext] Sin estilos configurados, aplicando tema por defecto:', DEFAULT_THEME);
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
          console.error('Error guardando tema en localStorage:', e);
        }
      }
    } catch (err: any) {
      console.error('❌ [OrganizationStylesContext] Error fetching styles:', err);
      setError(err.message || 'Error al obtener estilos');

      // Intentar cargar desde localStorage como fallback
      if (typeof window !== 'undefined' && user?.organization_id) {
        try {
          const cached = localStorage.getItem(`business-theme-${user.organization_id}`);
          if (cached) {
            console.log('📦 [OrganizationStylesContext] Usando estilos desde localStorage');
            setStyles(JSON.parse(cached));
          } else {
            // No hay cache, usar tema por defecto
            console.log('🎨 [OrganizationStylesContext] Sin cache, aplicando tema por defecto');
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
  };

  useEffect(() => {
    console.log('🔄 [OrganizationStylesContext] useEffect triggered, organization_id:', user?.organization_id);
    fetchStyles();
  }, [user?.organization_id]);

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

