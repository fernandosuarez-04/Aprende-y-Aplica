import { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';

export interface OrganizationStyles {
  panel: StyleConfig | null;
  userDashboard: StyleConfig | null;
  login: StyleConfig | null;
  selectedTheme: string | null;
}

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
  modal_opacity?: number;
  card_opacity?: number;
  sidebar_opacity?: number;
}

export function useOrganizationStyles() {
  const { user } = useAuth();
  const [styles, setStyles] = useState<OrganizationStyles | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchStyles = async () => {
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

        setStyles(data.styles);
      } catch (err: any) {
        console.error('Error fetching organization styles:', err);
        setError(err.message || 'Error al obtener estilos');
        setStyles(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStyles();
  }, [user]);

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

      setStyles(data.styles);
      return true;
    } catch (err: any) {
      console.error('Error applying theme:', err);
      setError(err.message || 'Error al aplicar tema');
      return false;
    }
  };

  return {
    styles,
    loading,
    error,
    updateStyles,
    applyTheme,
    refetch: async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const response = await fetch('/api/business/settings/styles', {
          credentials: 'include',
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Error al obtener estilos');
        }

        setStyles(data.styles);
      } catch (err: any) {
        console.error('Error refetching styles:', err);
        setError(err.message || 'Error al obtener estilos');
      } finally {
        setLoading(false);
      }
    },
  };
}
