'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Palette,
  Monitor,
  User,
  LogIn,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  Image as ImageIcon,
  Droplet,
  Layers,
  X
} from 'lucide-react';
import { useOrganizationStylesContext } from '../contexts/OrganizationStylesContext';
import type { StyleConfig } from '../contexts/OrganizationStylesContext';
import { PRESET_THEMES, getAllThemes, ThemeConfig } from '../config/preset-themes';
import { ImageUpload } from '../../admin/components/ImageUpload';
import { ImageAdjustmentModal, type ImageAdjustments } from './ImageAdjustmentModal';
import { isValidHexColor } from '../utils/styles';

type ActivePanel = 'panel' | 'userDashboard' | 'login';

export function BusinessThemeCustomizer() {
  const { styles, loading, error, updateStyles, applyTheme, refetch } = useOrganizationStylesContext();
  const [activePanel, setActivePanel] = useState<ActivePanel>('panel');
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Función para obtener estilo por defecto
  const getDefaultStyle = (): StyleConfig => ({
    background_type: 'gradient',
    background_value: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #1e40af 100%)',
    primary_button_color: '#3b82f6',
    secondary_button_color: '#2563eb',
    accent_color: '#60a5fa',
    sidebar_background: '#1e293b',
    card_background: '#1e293b',
    text_color: '#f8fafc',
    border_color: '#334155',
    modal_opacity: 0.95,
    card_opacity: 1,
    sidebar_opacity: 1
  });

  // Estados locales para cada panel
  const [panelStyles, setPanelStyles] = useState<StyleConfig | null>(() => getDefaultStyle());
  const [userDashboardStyles, setUserDashboardStyles] = useState<StyleConfig | null>(() => getDefaultStyle());
  const [loginStyles, setLoginStyles] = useState<StyleConfig | null>(() => getDefaultStyle());

  // Cargar estilos cuando se obtengan
  useEffect(() => {
    if (styles) {
      setPanelStyles(styles.panel || getDefaultStyle());
      setUserDashboardStyles(styles.userDashboard || getDefaultStyle());
      setLoginStyles(styles.login || getDefaultStyle());
    }
  }, [styles]);

  const handleApplyTheme = async (themeId: string) => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      const success = await applyTheme(themeId);
      if (success) {
        setSaveSuccess('Tema aplicado correctamente');
        setTimeout(() => setSaveSuccess(null), 3000);
        // Refrescar estilos para asegurar que todos los componentes se actualicen
        await refetch();
      } else {
        setSaveError('Error al aplicar tema');
        setTimeout(() => setSaveError(null), 3000);
      }
    } catch (err: any) {
      setSaveError(err.message || 'Error al aplicar tema');
      setTimeout(() => setSaveError(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      // console.log('💾 Guardando estilos:', { panelStyles, userDashboardStyles, loginStyles });
      
      const success = await updateStyles(
        panelStyles || undefined,
        userDashboardStyles || undefined,
        loginStyles || undefined
      );

      if (success) {
        setSaveSuccess('Estilos guardados correctamente');
        setTimeout(() => setSaveSuccess(null), 3000);
        // console.log('✅ Estilos guardados exitosamente, refrescando...');
        // Refrescar estilos para asegurar que todos los componentes se actualicen
        await refetch();
      } else {
        setSaveError('Error al guardar estilos');
        setTimeout(() => setSaveError(null), 3000);
      }
    } catch (err: any) {
      // console.error('❌ Error al guardar estilos:', err);
      setSaveError(err.message || 'Error al guardar estilos');
      setTimeout(() => setSaveError(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const updateStyle = (panel: ActivePanel, field: keyof StyleConfig, value: any) => {
    switch (panel) {
      case 'panel':
        setPanelStyles((prev) => {
          const current = prev || getDefaultStyle();
          return { ...current, [field]: value };
        });
        break;
      case 'userDashboard':
        setUserDashboardStyles((prev) => {
          const current = prev || getDefaultStyle();
          return { ...current, [field]: value };
        });
        break;
      case 'login':
        setLoginStyles((prev) => {
          const current = prev || getDefaultStyle();
          return { ...current, [field]: value };
        });
        break;
    }

    // Limpiar mensajes al cambiar
    setSaveSuccess(null);
    setSaveError(null);
  };

  // Obtener estilos actuales del panel activo (ANTES de cualquier return condicional)
  const currentStyles = useMemo(() => {
    let defaultStyle = getDefaultStyle();
    if (activePanel === 'panel') {
      return panelStyles || defaultStyle;
    } else if (activePanel === 'userDashboard') {
      return userDashboardStyles || defaultStyle;
    } else {
      return loginStyles || defaultStyle;
    }
  }, [activePanel, panelStyles, userDashboardStyles, loginStyles]);

  const allThemes = getAllThemes();

  // Returns condicionales DESPUÉS de todos los hooks
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div 
          className="w-16 h-16 border-4 rounded-full animate-spin"
          style={{
            borderColor: 'var(--org-primary-button-color, #3b82f6)33',
            borderTopColor: 'var(--org-primary-button-color, #3b82f6)'
          }}
        ></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-6 text-center">
        <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Selector de Temas Predefinidos */}
      <div className="rounded-lg p-6 border border-carbon-700 backdrop-blur-md" style={{ backgroundColor: `rgba(var(--org-card-background-rgb, 15, 23, 42), var(--org-card-opacity, 1))` }}>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--org-text-color, #ffffff)' }}>
          <Palette className="w-5 h-5" />
          Temas Predefinidos
        </h3>
        <p className="text-sm text-carbon-400 mb-4">
          Selecciona un tema predefinido para aplicar estilos automáticamente
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allThemes.map((theme) => (
            <motion.button
              key={theme.id}
              onClick={() => handleApplyTheme(theme.id)}
              disabled={isSaving}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`
                p-4 rounded-lg border-2 transition-all text-left
                ${styles?.selectedTheme === theme.id
                  ? ''
                  : 'border-carbon-700 bg-carbon-800 hover:border-carbon-600'
                }
                ${isSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
              style={styles?.selectedTheme === theme.id ? {
                borderColor: 'var(--org-primary-button-color, #3b82f6)',
                backgroundColor: 'var(--org-primary-button-color, #3b82f6)1a'
              } : {}}
            >
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-8 h-8 rounded-lg"
                  style={{
                    background: theme.panel.background_value
                  }}
                />
                <div>
                  <h4 className="font-medium" style={{ color: 'var(--org-text-color, #ffffff)' }}>{theme.name}</h4>
                  <p className="text-xs text-carbon-400">{theme.description}</p>
                </div>
              </div>
              {styles?.selectedTheme === theme.id && (
                <div className="flex items-center gap-1 text-xs mt-2" style={{ color: 'var(--org-primary-button-color, #3b82f6)' }}>
                  <CheckCircle className="w-3 h-3" />
                  <span>Seleccionado</span>
                </div>
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Pestañas de Paneles */}
      <div className="rounded-lg border border-carbon-700 overflow-hidden backdrop-blur-md" style={{ backgroundColor: `rgba(var(--org-card-background-rgb, 15, 23, 42), var(--org-card-opacity, 1))` }}>
        <div className="flex border-b border-carbon-700 overflow-x-auto">
          <button
            onClick={() => setActivePanel('panel')}
            className={`px-6 py-4 font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
              activePanel === 'panel'
                ? 'border-b-2 bg-carbon-800'
                : 'text-carbon-400 hover:text-carbon-300 hover:bg-carbon-800/50'
            }`}
            style={activePanel === 'panel' ? {
              color: 'var(--org-primary-button-color, #3b82f6)',
              borderBottomColor: 'var(--org-primary-button-color, #3b82f6)'
            } : {}}
          >
            <Monitor className="w-5 h-5" />
            Panel Business
          </button>
          <button
            onClick={() => setActivePanel('userDashboard')}
            className={`px-6 py-4 font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
              activePanel === 'userDashboard'
                ? 'border-b-2 bg-carbon-800'
                : 'text-carbon-400 hover:text-carbon-300 hover:bg-carbon-800/50'
            }`}
            style={activePanel === 'userDashboard' ? {
              color: 'var(--org-primary-button-color, #3b82f6)',
              borderBottomColor: 'var(--org-primary-button-color, #3b82f6)'
            } : {}}
          >
            <User className="w-5 h-5" />
            Dashboard Usuario
          </button>
          <button
            onClick={() => setActivePanel('login')}
            className={`px-6 py-4 font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
              activePanel === 'login'
                ? 'border-b-2 bg-carbon-800'
                : 'text-carbon-400 hover:text-carbon-300 hover:bg-carbon-800/50'
            }`}
            style={activePanel === 'login' ? {
              color: 'var(--org-primary-button-color, #3b82f6)',
              borderBottomColor: 'var(--org-primary-button-color, #3b82f6)'
            } : {}}
          >
            <LogIn className="w-5 h-5" />
            Login
          </button>
        </div>

        {/* Contenido del Panel Activo */}
        <div className="p-6">
          <StyleEditor
            key={activePanel}
            style={currentStyles}
            panel={activePanel}
            onChange={(field, value) => updateStyle(activePanel, field, value)}
          />
        </div>
      </div>

      {/* Mensajes de Éxito/Error */}
      {saveSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 flex items-center gap-3"
        >
          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
          <p className="text-green-400">{saveSuccess}</p>
        </motion.div>
      )}

      {saveError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 flex items-center gap-3"
        >
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-red-400">{saveError}</p>
        </motion.div>
      )}

      {/* Botón Guardar */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-3 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          style={{
            backgroundColor: 'var(--org-primary-button-color, #3b82f6)'
          }}
          onMouseEnter={(e) => {
            if (!isSaving) {
              (e.target as HTMLButtonElement).style.opacity = '0.9';
            }
          }}
          onMouseLeave={(e) => {
            if (!isSaving) {
              (e.target as HTMLButtonElement).style.opacity = '1';
            }
          }}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Guardar Cambios
            </>
          )}
        </button>
      </div>
    </div>
  );
}

interface StyleEditorProps {
  style: StyleConfig;
  panel: ActivePanel;
  onChange: (field: keyof StyleConfig, value: any) => void;
}

function StyleEditor({ style, onChange }: StyleEditorProps) {
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string>(
    style.background_type === 'image' ? style.background_value : ''
  );
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [imageAdjustments, setImageAdjustments] = useState<ImageAdjustments>({
    position: { x: 0, y: 0 },
    zoom: 1,
    rotation: 0,
    objectFit: 'cover'
  });

  // Actualizar backgroundImageUrl cuando cambie el tipo de fondo
  useEffect(() => {
    if (style.background_type === 'image' && style.background_value) {
      setBackgroundImageUrl(style.background_value);
    } else if (style.background_type !== 'image') {
      setBackgroundImageUrl('');
    }
  }, [style.background_type, style.background_value]);

  const handleSaveAdjustments = (adjustments: ImageAdjustments) => {
    setImageAdjustments(adjustments);
    // Los ajustes se guardarán en el estado pero la imagen URL permanece igual
    // console.log('Ajustes guardados:', adjustments);
  };

  return (
    <div className="space-y-6">
      {/* Selector de Tipo de Fondo */}
      <div>
        <label className="block text-sm font-medium text-carbon-300 mb-2">
          Tipo de Fondo
        </label>
        <div className="flex gap-4">
          <button
            onClick={() => {
              onChange('background_type', 'color');
              onChange('background_value', '#1e293b');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              style.background_type === 'color'
                ? 'bg-primary text-white'
                : 'bg-carbon-800 text-carbon-300 hover:bg-carbon-700'
            }`}
          >
            <Droplet className="w-4 h-4" />
            Color
          </button>
          <button
            onClick={() => {
              onChange('background_type', 'gradient');
              onChange('background_value', 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              style.background_type === 'gradient'
                ? 'bg-primary text-white'
                : 'bg-carbon-800 text-carbon-300 hover:bg-carbon-700'
            }`}
          >
            <Layers className="w-4 h-4" />
            Gradiente
          </button>
          <button
            onClick={() => onChange('background_type', 'image')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              style.background_type === 'image'
                ? 'bg-primary text-white'
                : 'bg-carbon-800 text-carbon-300 hover:bg-carbon-700'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            Imagen
          </button>
        </div>
      </div>

      {/* Selector de Fondo según Tipo */}
      {style.background_type === 'image' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-carbon-300 mb-2">
              Imagen de Fondo
            </label>
            <ImageUpload
              value={backgroundImageUrl}
              onChange={(url) => {
                setBackgroundImageUrl(url);
                onChange('background_value', url);
              }}
              bucket="Panel-Business"
              folder="Background"
              className="w-full"
            />
          </div>
          
          {backgroundImageUrl && (
            <>
              <div className="p-4 border border-carbon-700 rounded-lg space-y-3">
                <p className="text-sm text-carbon-400">Previsualización:</p>
                <div
                  className="w-full h-32 rounded-md transition-all"
                  style={{ 
                    backgroundImage: `url(${backgroundImageUrl})`,
                    backgroundSize: imageAdjustments.objectFit,
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    transform: `scale(${imageAdjustments.zoom}) rotate(${imageAdjustments.rotation}deg)`
                  }}
                ></div>
                <button
                  onClick={() => setShowAdjustmentModal(true)}
                  className="w-full px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <ImageIcon className="w-4 h-4" />
                  Ajustar Imagen
                </button>
              </div>

              <ImageAdjustmentModal
                isOpen={showAdjustmentModal}
                onClose={() => setShowAdjustmentModal(false)}
                imageUrl={backgroundImageUrl}
                onSave={handleSaveAdjustments}
                initialAdjustments={imageAdjustments}
              />
            </>
          )}
        </div>
      )}

      {style.background_type === 'color' && (
        <div>
          <label className="block text-sm font-medium text-carbon-300 mb-2">
            Color de Fondo
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={style.background_value || '#1e293b'}
              onChange={(e) => {
                const color = e.target.value;
                onChange('background_value', color);
              }}
              className="w-16 h-10 rounded cursor-pointer"
            />
            <input
              type="text"
              value={style.background_value || '#1e293b'}
              onChange={(e) => {
                const color = e.target.value;
                onChange('background_value', color);
              }}
              onBlur={(e) => {
                const color = e.target.value;
                if (!isValidHexColor(color)) {
                  onChange('background_value', '#1e293b');
                }
              }}
              className="flex-1 px-4 py-2 bg-carbon-800 border border-carbon-700 rounded-lg text-white focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': 'var(--org-primary-button-color, #3b82f6)' } as React.CSSProperties}
              placeholder="#1e293b"
            />
          </div>
        </div>
      )}

      {style.background_type === 'gradient' && (
        <div>
          <label className="block text-sm font-medium text-carbon-300 mb-2">
            Gradiente CSS
          </label>
          <input
            type="text"
            value={style.background_value || ''}
            onChange={(e) => onChange('background_value', e.target.value)}
            className="w-full px-4 py-2 bg-carbon-800 border border-carbon-700 rounded-lg text-white focus:outline-none focus:ring-2"
            style={{ '--tw-ring-color': 'var(--org-primary-button-color, #3b82f6)' } as React.CSSProperties}
            placeholder="linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)"
          />
        </div>
      )}

      {/* Colores de Botones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-carbon-300 mb-2">
            Color Botón Principal
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={style.primary_button_color || '#3b82f6'}
              onChange={(e) => {
                const color = e.target.value;
                onChange('primary_button_color', color);
              }}
              className="w-16 h-10 rounded cursor-pointer"
            />
            <input
              type="text"
              value={style.primary_button_color || '#3b82f6'}
              onChange={(e) => {
                const color = e.target.value;
                // Permitir cambios mientras se escribe, validar solo al perder foco o guardar
                onChange('primary_button_color', color);
              }}
              onBlur={(e) => {
                // Validar al perder foco y revertir si no es válido
                const color = e.target.value;
                if (!isValidHexColor(color)) {
                  onChange('primary_button_color', '#3b82f6');
                }
              }}
              className="flex-1 px-4 py-2 bg-carbon-800 border border-carbon-700 rounded-lg text-white focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': 'var(--org-primary-button-color, #3b82f6)' } as React.CSSProperties}
              placeholder="#3b82f6"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-carbon-300 mb-2">
            Color Botón Secundario
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={style.secondary_button_color || '#2563eb'}
              onChange={(e) => {
                const color = e.target.value;
                onChange('secondary_button_color', color);
              }}
              className="w-16 h-10 rounded cursor-pointer"
            />
            <input
              type="text"
              value={style.secondary_button_color || '#2563eb'}
              onChange={(e) => {
                const color = e.target.value;
                onChange('secondary_button_color', color);
              }}
              onBlur={(e) => {
                const color = e.target.value;
                if (!isValidHexColor(color)) {
                  onChange('secondary_button_color', '#2563eb');
                }
              }}
              className="flex-1 px-4 py-2 bg-carbon-800 border border-carbon-700 rounded-lg text-white focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': 'var(--org-primary-button-color, #3b82f6)' } as React.CSSProperties}
              placeholder="#2563eb"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-carbon-300 mb-2">
            Color de Acento
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={style.accent_color || '#60a5fa'}
              onChange={(e) => {
                const color = e.target.value;
                onChange('accent_color', color);
              }}
              className="w-16 h-10 rounded cursor-pointer"
            />
            <input
              type="text"
              value={style.accent_color || '#60a5fa'}
              onChange={(e) => {
                const color = e.target.value;
                onChange('accent_color', color);
              }}
              onBlur={(e) => {
                const color = e.target.value;
                if (!isValidHexColor(color)) {
                  onChange('accent_color', '#60a5fa');
                }
              }}
              className="flex-1 px-4 py-2 bg-carbon-800 border border-carbon-700 rounded-lg text-white focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': 'var(--org-primary-button-color, #3b82f6)' } as React.CSSProperties}
              placeholder="#60a5fa"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-carbon-300 mb-2">
            Fondo de Sidebar
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={style.sidebar_background?.replace(/^url\(|\)$/g, '') || '#1e293b'}
              onChange={(e) => onChange('sidebar_background', e.target.value)}
              className="w-16 h-10 rounded cursor-pointer"
              disabled={style.sidebar_background?.startsWith('url(')}
            />
            <input
              type="text"
              value={style.sidebar_background || '#1e293b'}
              onChange={(e) => onChange('sidebar_background', e.target.value)}
              className="flex-1 px-4 py-2 bg-carbon-800 border border-carbon-700 rounded-lg text-white focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': 'var(--org-primary-button-color, #3b82f6)' } as React.CSSProperties}
              placeholder="#1e293b"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-carbon-300 mb-2">
            Color de Texto Principal
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={style.text_color || '#f8fafc'}
              onChange={(e) => onChange('text_color', e.target.value)}
              className="w-16 h-10 rounded cursor-pointer"
            />
            <input
              type="text"
              value={style.text_color || '#f8fafc'}
              onChange={(e) => onChange('text_color', e.target.value)}
              className="flex-1 px-4 py-2 bg-carbon-800 border border-carbon-700 rounded-lg text-white focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': 'var(--org-primary-button-color, #3b82f6)' } as React.CSSProperties}
              placeholder="#f8fafc"
            />
          </div>
          <p className="text-xs text-carbon-500 mt-1">
            Color del texto en sidebar, menús y headers
          </p>
        </div>
      </div>

      {/* Controles de Opacidad */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-carbon-300">Transparencia</h3>
        
        <div>
          <label className="block text-sm font-medium text-carbon-300 mb-2 flex items-center justify-between">
            <span>Opacidad de Modales: {((style.modal_opacity || 0.95) * 100).toFixed(0)}%</span>
            <button
              onClick={() => onChange('modal_opacity', 0.95)}
              className="text-xs px-2 py-1 text-white rounded transition-colors"
              style={{ backgroundColor: 'var(--org-secondary-button-color, #2563eb)' }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              Resetear
            </button>
          </label>
          <input
            type="range"
            min={0.3}
            max={1}
            step={0.05}
            value={style.modal_opacity || 0.95}
            onChange={(e) => onChange('modal_opacity', Number(e.target.value))}
            className="w-full h-2 bg-carbon-700 rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <div className="flex justify-between text-xs text-carbon-500 mt-1">
            <span>Transparente</span>
            <span>Opaco</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-carbon-300 mb-2 flex items-center justify-between">
            <span>Opacidad de Tarjetas: {((style.card_opacity || 1) * 100).toFixed(0)}%</span>
            <button
              onClick={() => onChange('card_opacity', 1)}
              className="text-xs px-2 py-1 text-white rounded transition-colors"
              style={{ backgroundColor: 'var(--org-secondary-button-color, #2563eb)' }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              Resetear
            </button>
          </label>
          <input
            type="range"
            min={0.3}
            max={1}
            step={0.05}
            value={style.card_opacity || 1}
            onChange={(e) => onChange('card_opacity', Number(e.target.value))}
            className="w-full h-2 bg-carbon-700 rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <div className="flex justify-between text-xs text-carbon-500 mt-1">
            <span>Transparente</span>
            <span>Opaco</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-carbon-300 mb-2 flex items-center justify-between">
            <span>Opacidad del Sidebar: {((style.sidebar_opacity || 1) * 100).toFixed(0)}%</span>
            <button
              onClick={() => onChange('sidebar_opacity', 1)}
              className="text-xs px-2 py-1 text-white rounded transition-colors"
              style={{ backgroundColor: 'var(--org-secondary-button-color, #2563eb)' }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              Resetear
            </button>
          </label>
          <input
            type="range"
            min={0.3}
            max={1}
            step={0.05}
            value={style.sidebar_opacity || 1}
            onChange={(e) => onChange('sidebar_opacity', Number(e.target.value))}
            className="w-full h-2 bg-carbon-700 rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <div className="flex justify-between text-xs text-carbon-500 mt-1">
            <span>Transparente</span>
            <span>Opaco</span>
          </div>
        </div>

        <div className="bg-carbon-900 rounded-lg p-4 border border-carbon-700">
          <p className="text-xs text-carbon-400">
            💡 <span className="font-medium">Consejo:</span> Si usas una imagen de fondo, reduce la opacidad de modales, tarjetas y sidebar para que se vean mejor sobre la imagen.
          </p>
        </div>
      </div>

      {/* Vista Previa */}
      <div className="bg-carbon-800 rounded-lg p-4 border border-carbon-700">
        <label className="block text-sm font-medium text-carbon-300 mb-3">
          Vista Previa
        </label>
        <div
          className="h-32 rounded-lg border-2 border-carbon-700 transition-all"
          style={{
            ...(style.background_type === 'image' && style.background_value
              ? {
                  backgroundImage: `url(${style.background_value})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                }
              : style.background_type === 'gradient' && style.background_value
              ? {
                  background: style.background_value,
                }
              : style.background_type === 'color' && style.background_value
              ? {
                  backgroundColor: style.background_value,
                }
              : {}),
          }}
        >
          <div className="h-full flex items-center justify-center gap-3 p-4">
            <button
              key={`preview-primary-${style.primary_button_color}`}
              className="px-4 py-2 rounded-lg font-medium text-white transition-colors"
              style={{ 
                backgroundColor: style.primary_button_color || '#3b82f6'
              }}
            >
              Botón Principal
            </button>
            <button
              key={`preview-secondary-${style.secondary_button_color}`}
              className="px-4 py-2 rounded-lg font-medium text-white transition-colors"
              style={{ 
                backgroundColor: style.secondary_button_color || '#2563eb'
              }}
            >
              Botón Secundario
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

