'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';

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
}

interface OrganizationStylesContextType {
  styles: OrganizationStyles | null;
  loading: boolean;
  error: string | null;
  updateStyles: (panel?: StyleConfig, userDashboard?: StyleConfig, login?: StyleConfig) => Promise<boolean>;
  applyTheme: (themeId: string) => Promise<boolean>;
  refetch: () => Promise<void>;
}

const OrganizationStylesContext = createContext<OrganizationStylesContextType | undefined>(undefined);

export function OrganizationStylesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [styles, setStyles] = useState<OrganizationStyles | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStyles = async () => {
    if (!user?.organization_id) {
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

      console.log('🎨 Estilos cargados desde API:', data.styles);
      setStyles(data.styles);
    } catch (err: any) {
      console.error('Error fetching organization styles:', err);
      setError(err.message || 'Error al obtener estilos');
      setStyles(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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

      console.log('📤 Enviando actualización de estilos:', updateData);

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

      console.log('✅ Estilos actualizados:', data.styles);
      setStyles(data.styles);
      return true;
    } catch (err: any) {
      console.error('Error updating styles:', err);
      setError(err.message || 'Error al actualizar estilos');
      return false;
    }
  };

  const applyTheme = async (themeId: string): Promise<boolean> => {
    try {
      console.log('🎨 Aplicando tema:', themeId);

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

      console.log('✅ Tema aplicado:', data.styles);
      setStyles(data.styles);
      return true;
    } catch (err: any) {
      console.error('Error applying theme:', err);
      setError(err.message || 'Error al aplicar tema');
      return false;
    }
  };

  const refetch = async () => {
    console.log('🔄 Refrescando estilos...');
    await fetchStyles();
  };

  return (
    <OrganizationStylesContext.Provider value={{ styles, loading, error, updateStyles, applyTheme, refetch }}>
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

