'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Palette,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  Image as ImageIcon,
  Sparkles,
  Copy,
  Check,
  RotateCcw
} from 'lucide-react';
import { useOrganizationStylesContext } from '../contexts/OrganizationStylesContext';
import type { StyleConfig } from '../contexts/OrganizationStylesContext';
import { PRESET_THEMES, getAllThemes, ThemeConfig, generateBrandingTheme, BrandingColors } from '../config/preset-themes';

type ActivePanel = 'panel' | 'userDashboard' | 'login';

export function BusinessThemeCustomizer() {
  const { styles, loading, error, updateStyles, applyTheme, refetch } = useOrganizationStylesContext();
  const [activePanel, setActivePanel] = useState<ActivePanel>('panel');
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [brandingColors, setBrandingColors] = useState<BrandingColors | null>(null);
  const [loadingBranding, setLoadingBranding] = useState(true);

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

  // Cargar estilos cuando se obtengan o cambien
  // IMPORTANTE: No usar condicional 'if (styles)' para que siempre se sincronice,
  // incluso cuando styles pasa de null a un objeto cargado desde la BD
  useEffect(() => {

    // Siempre actualizar el estado local cuando el contexto cambie
    // Esto asegura que los valores de la BD se carguen correctamente
    setPanelStyles(styles?.panel || getDefaultStyle());
    setUserDashboardStyles(styles?.userDashboard || getDefaultStyle());
    setLoginStyles(styles?.login || getDefaultStyle());
    
    // Parsear gradiente existente si existe (solo cuando cambie el panel activo)
    const currentBgValue = activePanel === 'panel' 
      ? (styles?.panel || getDefaultStyle()).background_value || ''
      : activePanel === 'userDashboard'
      ? (styles?.userDashboard || getDefaultStyle()).background_value || ''
      : (styles?.login || getDefaultStyle()).background_value || ''
      
    if (currentBgValue && currentBgValue.includes('linear-gradient')) {
      const match = currentBgValue.match(/linear-gradient\((\d+)deg,\s*(.+)\)/)
      if (match) {
        const angle = parseInt(match[1]) || 135
        const colorsStr = match[2]
        const colorMatches = colorsStr.match(/#[0-9a-fA-F]{6}/g)
        if (colorMatches && colorMatches.length >= 2) {
          setGradientAngle(angle)
          setGradientColors(colorMatches)
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [styles, activePanel]);

  // Cargar colores de branding para generar tema automático
  useEffect(() => {
    const fetchBrandingColors = async () => {
      try {
        setLoadingBranding(true);
        const response = await fetch('/api/business/settings/branding', {
          credentials: 'include'
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.branding) {
            setBrandingColors({
              color_primary: result.branding.color_primary,
              color_secondary: result.branding.color_secondary,
              color_accent: result.branding.color_accent
            });
          }
        }
      } catch (err) {
        console.error('Error fetching branding colors:', err);
      } finally {
        setLoadingBranding(false);
      }
    };

    fetchBrandingColors();
  }, []);

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

  // Generar todos los temas disponibles (8 predefinidos + 1 automático si hay branding)
  const allThemes = useMemo(() => {
    const presetThemes = getAllThemes();

    // Si ya cargamos los colores de branding, generar el tema automático
    if (brandingColors && !loadingBranding) {
      const brandingTheme = generateBrandingTheme(brandingColors);
      return [...presetThemes, brandingTheme];
    }

    return presetThemes;
  }, [brandingColors, loadingBranding]);

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

  const [copiedGradient, setCopiedGradient] = useState(false)
  const [discardChanges, setDiscardChanges] = useState(false)
  
  // Estado para el selector visual de gradiente
  const [gradientColors, setGradientColors] = useState<string[]>(['#1e3a8a', '#1e40af'])
  const [gradientAngle, setGradientAngle] = useState<number>(135)

  const handleDiscard = () => {
    if (styles) {
      setPanelStyles(styles.panel || getDefaultStyle())
      setUserDashboardStyles(styles.userDashboard || getDefaultStyle())
      setLoginStyles(styles.login || getDefaultStyle())
      setSaveError(null)
      setSaveSuccess(null)
    }
  }

  const handleReset = () => {
    const defaultStyle = getDefaultStyle()
    setPanelStyles(defaultStyle)
    setUserDashboardStyles(defaultStyle)
    setLoginStyles(defaultStyle)
    setSaveError(null)
    setSaveSuccess(null)
  }

  const copyGradientToClipboard = () => {
    const gradient = generateGradientCSS()
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(gradient).then(() => {
        setCopiedGradient(true)
        setTimeout(() => setCopiedGradient(false), 2000)
      })
    }
  }

  // Generar CSS del gradiente basado en los colores y ángulo
  const generateGradientCSS = (): string => {
    if (gradientColors.length < 2) return 'linear-gradient(135deg, #1e3a8a, #1e40af)'
    const colorsWithStops = gradientColors.map((color, index) => {
      const stop = (index / (gradientColors.length - 1)) * 100
      return `${color} ${stop}%`
    }).join(', ')
    return `linear-gradient(${gradientAngle}deg, ${colorsWithStops})`
  }

  // Actualizar gradiente cuando cambien los colores o el ángulo
  useEffect(() => {
    if (currentStyles.background_type === 'gradient' && gradientColors.length >= 2) {
      const newGradient = generateGradientCSS()
      const currentGradient = currentStyles.background_value || ''
      // Solo actualizar si el gradiente es diferente al actual
      if (newGradient !== currentGradient) {
        updateStyle(activePanel, 'background_value', newGradient)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gradientColors, gradientAngle, activePanel])

  // Agregar color al gradiente
  const addGradientColor = () => {
    if (gradientColors.length < 5) {
      setGradientColors([...gradientColors, '#3b82f6'])
    }
  }

  // Eliminar color del gradiente
  const removeGradientColor = (index: number) => {
    if (gradientColors.length > 2) {
      setGradientColors(gradientColors.filter((_, i) => i !== index))
    }
  }

  // Actualizar color del gradiente
  const updateGradientColor = (index: number, color: string) => {
    const newColors = [...gradientColors]
    newColors[index] = color
    setGradientColors(newColors)
  }

  // Obtener icono para cada tema
  const getThemeIcon = (themeId: string) => {
    const icons: Record<string, string> = {
      'corporativo-azul': 'A',
      'ejecutivo-oscuro': 'D',
      'premium-dorado': 'B',
      'elite-plateado': 'X',
      'flexibilidad-verde': 'E',
      'tecnologia-verde': 'B',
      'financiero-proceso': 'B',
      'recursos-procesado': 'K',
      'branding-personalizado': '★'
    }
    return icons[themeId] || 'T'
  }

  // Obtener color de fondo para cada tema
  const getThemeColor = (theme: ThemeConfig) => {
    if (theme.id === 'branding-personalizado') {
      return 'linear-gradient(135deg, #fbbf24, #f59e0b)'
    }
    return theme.panel.background_value
  }

  return (
    <div className="space-y-6">
      {/* Temas Predefinidos */}
      <div 
        className="rounded-lg p-6 border backdrop-blur-md"
        style={{
          backgroundColor: `rgba(var(--org-card-background-rgb, 15, 23, 42), var(--org-card-opacity, 1))`,
          borderColor: 'var(--org-border-color, #334155)'
        }}
      >
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--org-text-color, #ffffff)' }}>
          Temas Predefinidos
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {allThemes.map((theme) => (
            <motion.button
              key={theme.id}
              onClick={() => handleApplyTheme(theme.id)}
              disabled={isSaving}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`
                p-4 rounded-lg border-2 transition-all text-left relative
                ${styles?.selectedTheme === theme.id
                  ? ''
                  : ''
                }
                ${isSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
              style={styles?.selectedTheme === theme.id ? {
                borderColor: 'var(--org-primary-button-color, #3b82f6)',
                backgroundColor: 'rgba(var(--org-primary-button-color-rgb, 59, 130, 246), 0.1)'
              } : {
                borderColor: 'var(--org-border-color, #334155)',
                backgroundColor: 'rgba(var(--org-card-background-rgb, 30, 41, 59), 0.5)'
              }}
            >
              <div
                className="w-full h-20 rounded-lg mb-3 flex items-center justify-center text-2xl font-bold"
                  style={{
                  background: getThemeColor(theme)
                  }}
                >
                {getThemeIcon(theme.id)}
                </div>
              <h4 className="font-medium text-sm mb-1" style={{ color: 'var(--org-text-color, #ffffff)' }}>
                {theme.name}
              </h4>
              <p className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                {theme.description}
              </p>
              {theme.id === 'recursos-procesado' && (
                <span className="absolute top-2 right-2 text-xs px-1.5 py-0.5 rounded bg-yellow-500 text-black font-bold">
                  NEW
                      </span>
                    )}
              {styles?.selectedTheme === theme.id && (
                <div className="absolute top-2 right-2">
                  <CheckCircle className="w-4 h-4" style={{ color: 'var(--org-primary-button-color, #3b82f6)' }} />
                </div>
              )}
            </motion.button>
          ))}
        </div>
        <p className="text-sm mt-4" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
          Tu tema actual
        </p>
      </div>

      {/* Layout de 2 columnas: Controles y Vista Previa */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda: Controles de Estilo */}
        <div className="lg:col-span-2 space-y-6">
          <div 
            className="rounded-lg p-6 border backdrop-blur-md"
            style={{
              backgroundColor: `rgba(var(--org-card-background-rgb, 15, 23, 42), var(--org-card-opacity, 1))`,
              borderColor: 'var(--org-border-color, #334155)'
            }}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--org-text-color, #ffffff)' }}>
              Controles de Estilo
            </h3>

            {/* Gradient Selector Visual */}
            {currentStyles.background_type === 'gradient' && (
              <div className="mb-6">
                <label className="block text-sm font-medium mb-3" style={{ color: 'var(--org-text-color, #ffffff)' }}>
                  Gradiente
                </label>
                <div className="space-y-4">
                  {/* Selector de Ángulo */}
                  <div>
                    <label className="block text-xs mb-2" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      Ángulo: {gradientAngle}°
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      step="1"
                      value={gradientAngle}
                      onChange={(e) => setGradientAngle(Number(e.target.value))}
                      className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                      style={{
                        accentColor: 'var(--org-primary-button-color, #3b82f6)'
                      }}
                      title={`Ángulo del gradiente: ${gradientAngle}°`}
                      aria-label={`Ángulo del gradiente: ${gradientAngle}°`}
                    />
                  </div>

                  {/* Selectores de Colores */}
                  <div className="space-y-3">
                    <label className="block text-xs" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      Colores del Gradiente
                    </label>
                    <div className="flex flex-wrap gap-3">
                      {gradientColors.map((color, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="relative">
                            <input
                              type="color"
                              value={color}
                              onChange={(e) => updateGradientColor(index, e.target.value)}
                              className="w-16 h-16 rounded-lg cursor-pointer border-2"
                              style={{ 
                                borderColor: 'var(--org-border-color, #334155)'
                              }}
                              title={`Color ${index + 1} del gradiente: ${color}`}
                              aria-label={`Color ${index + 1} del gradiente: ${color}`}
                            />
                            {gradientColors.length > 2 && (
                              <button
                                type="button"
                                onClick={() => removeGradientColor(index)}
                                className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center hover:bg-red-600 transition-colors"
                                style={{ fontSize: '10px' }}
                              >
                                ×
                              </button>
                            )}
                          </div>
                          <input
                            type="text"
                            value={color}
                            onChange={(e) => {
                              const newColor = e.target.value
                              if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(newColor) || newColor === '') {
                                updateGradientColor(index, newColor)
                              }
                            }}
                            className="w-20 px-2 py-1 rounded border text-sm"
                            style={{
                              backgroundColor: 'rgba(var(--org-card-background-rgb, 30, 41, 59), 0.5)',
                              borderColor: 'var(--org-border-color, #334155)',
                              color: 'var(--org-text-color, #ffffff)'
                            }}
                            placeholder="#000000"
                          />
                        </div>
                      ))}
                      {gradientColors.length < 5 && (
                        <button
                          type="button"
                          onClick={addGradientColor}
                          className="w-16 h-16 rounded-lg border-2 border-dashed flex items-center justify-center transition-colors hover:border-solid"
                          style={{
                            borderColor: 'var(--org-border-color, #334155)',
                            color: 'var(--org-text-color, #ffffff)'
                          }}
                        >
                          <span className="text-2xl">+</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Vista Previa del Gradiente */}
                  <div>
                    <label className="block text-xs mb-2" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      Vista Previa
                    </label>
                    <div className="relative h-12 rounded-lg overflow-hidden border-2" style={{ borderColor: 'var(--org-border-color, #334155)' }}>
                      <div
                        className="absolute inset-0"
                        style={{
                          background: generateGradientCSS()
                        }}
                      />
                    </div>
                  </div>

                  {/* Botones de Acción */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={copyGradientToClipboard}
                      className="px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                      style={{
                        backgroundColor: 'var(--org-primary-button-color, #3b82f6)',
                        color: '#ffffff'
                      }}
                    >
                      {copiedGradient ? (
                        <>
                          <Check className="w-4 h-4" />
                          Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copiar Código
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.createElement('input')
                        input.type = 'file'
                        input.accept = 'image/*'
                        input.onchange = async (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0]
                          if (file) {
                            const formData = new FormData()
                            formData.append('file', file)
                            formData.append('bucket', 'Panel-Business')
                            formData.append('folder', 'Background')
                            
                            try {
                              const response = await fetch('/api/upload', {
                                method: 'POST',
                                body: formData
                              })
                              const result = await response.json()
                              if (result.success && result.url) {
                                updateStyle(activePanel, 'background_type', 'image')
                                updateStyle(activePanel, 'background_value', result.url)
                              }
                            } catch (err) {
                              setSaveError('Error al subir la imagen')
                              setTimeout(() => setSaveError(null), 5000)
                            }
                          }
                        }
                        input.click()
                      }}
                      className="px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 border"
                      style={{
                        borderColor: 'var(--org-border-color, #334155)',
                        backgroundColor: 'rgba(var(--org-card-background-rgb, 30, 41, 59), 0.5)',
                        color: 'var(--org-text-color, #ffffff)'
                      }}
                    >
                      <ImageIcon className="w-4 h-4" />
                      Usar Imagen
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Colores UI */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold" style={{ color: 'var(--org-text-color, #ffffff)' }}>
                Colores UI
              </h4>

              {/* Botón Fondo */}
        <div>
                <label className="block text-sm font-medium mb-2 flex items-center justify-between" style={{ color: 'var(--org-text-color, #ffffff)' }}>
                  <span>Botón Fondo</span>
                  <button
                    type="button"
                    onClick={() => updateStyle(activePanel, 'primary_button_color', '#3b82f6')}
                    className="text-xs px-2 py-1 rounded transition-colors"
                    style={{
                      backgroundColor: 'var(--org-secondary-button-color, #8b5cf6)',
                      color: '#ffffff'
                    }}
                  >
                    Restablecer
                  </button>
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
                    value={currentStyles.primary_button_color || '#3b82f6'}
                    onChange={(e) => updateStyle(activePanel, 'primary_button_color', e.target.value)}
                    className="w-12 h-12 rounded cursor-pointer border"
                    style={{ borderColor: 'var(--org-border-color, #334155)' }}
                    title="Color del botón principal"
                    aria-label="Color del botón principal"
            />
            <input
              type="text"
                    value={currentStyles.primary_button_color || '#3b82f6'}
              onChange={(e) => {
                      const color = e.target.value
                      if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color) || color === '') {
                        updateStyle(activePanel, 'primary_button_color', color)
                      }
                    }}
                    className="flex-1 px-3 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2"
                    style={{
                      backgroundColor: 'rgba(var(--org-card-background-rgb, 30, 41, 59), 0.5)',
                      borderColor: 'var(--org-border-color, #334155)',
                      color: 'var(--org-text-color, #ffffff)'
                    }}
                    placeholder="#FF7723"
            />
          </div>
        </div>

              {/* Botón Principal */}
        <div>
                <label className="block text-sm font-medium mb-2 flex items-center justify-between" style={{ color: 'var(--org-text-color, #ffffff)' }}>
                  <span>Botón Principal</span>
                  <button
                    type="button"
                    onClick={() => updateStyle(activePanel, 'text_color', '#ffffff')}
                    className="text-xs px-2 py-1 rounded transition-colors"
                    style={{
                      backgroundColor: 'var(--org-secondary-button-color, #8b5cf6)',
                      color: '#ffffff'
                    }}
                  >
                    Restablecer
                  </button>
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
                    value={currentStyles.text_color || '#ffffff'}
                    onChange={(e) => updateStyle(activePanel, 'text_color', e.target.value)}
                    className="w-12 h-12 rounded cursor-pointer border"
                    style={{ borderColor: 'var(--org-border-color, #334155)' }}
                    title="Color del texto"
                    aria-label="Color del texto"
            />
            <input
              type="text"
                    value={currentStyles.text_color || '#ffffff'}
              onChange={(e) => {
                      const color = e.target.value
                      if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color) || color === '') {
                        updateStyle(activePanel, 'text_color', color)
                      }
                    }}
                    className="flex-1 px-3 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2"
                    style={{
                      backgroundColor: 'rgba(var(--org-card-background-rgb, 30, 41, 59), 0.5)',
                      borderColor: 'var(--org-border-color, #334155)',
                      color: 'var(--org-text-color, #ffffff)'
                    }}
                    placeholder="#FFFFFF"
            />
          </div>
        </div>

              {/* Botón Secundario */}
        <div>
                <label className="block text-sm font-medium mb-2 flex items-center justify-between" style={{ color: 'var(--org-text-color, #ffffff)' }}>
                  <span>Botón Secundario</span>
                  <button
                    type="button"
                    onClick={() => updateStyle(activePanel, 'secondary_button_color', '#8b5cf6')}
                    className="text-xs px-2 py-1 rounded transition-colors"
                    style={{
                      backgroundColor: 'var(--org-secondary-button-color, #8b5cf6)',
                      color: '#ffffff'
                    }}
                  >
                    Restablecer
                  </button>
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
                    value={currentStyles.secondary_button_color || '#8b5cf6'}
                    onChange={(e) => updateStyle(activePanel, 'secondary_button_color', e.target.value)}
                    className="w-12 h-12 rounded cursor-pointer border"
                    style={{ borderColor: 'var(--org-border-color, #334155)' }}
                    title="Color del botón secundario"
                    aria-label="Color del botón secundario"
            />
            <input
              type="text"
                    value={currentStyles.secondary_button_color || '#8b5cf6'}
              onChange={(e) => {
                      const color = e.target.value
                      if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color) || color === '') {
                        updateStyle(activePanel, 'secondary_button_color', color)
                      }
                    }}
                    className="flex-1 px-3 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2"
                    style={{
                      backgroundColor: 'rgba(var(--org-card-background-rgb, 30, 41, 59), 0.5)',
                      borderColor: 'var(--org-border-color, #334155)',
                      color: 'var(--org-text-color, #ffffff)'
                    }}
                    placeholder="#9977FF"
            />
          </div>
        </div>

              {/* Opacidad Modales */}
        <div>
                <label className="block text-sm font-medium mb-2 flex items-center justify-between" style={{ color: 'var(--org-text-color, #ffffff)' }}>
                  <span>Opacidad Modales</span>
            <button
                    type="button"
                    onClick={() => updateStyle(activePanel, 'modal_opacity', 0.95)}
                    className="text-xs px-2 py-1 rounded transition-colors"
                    style={{
                      backgroundColor: 'var(--org-secondary-button-color, #8b5cf6)',
                      color: '#ffffff'
                    }}
                  >
                    Restablecer
            </button>
          </label>
          <input
            type="range"
                  min="0.3"
                  max="1"
                  step="0.05"
                  value={currentStyles.modal_opacity || 0.95}
                  onChange={(e) => updateStyle(activePanel, 'modal_opacity', Number(e.target.value))}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                  style={{
                    accentColor: 'var(--org-primary-button-color, #3b82f6)'
                  }}
                  title={`Opacidad del modal: ${((currentStyles.modal_opacity || 0.95) * 100).toFixed(0)}%`}
                  aria-label={`Opacidad del modal: ${((currentStyles.modal_opacity || 0.95) * 100).toFixed(0)}%`}
          />
        </div>

              {/* Opacidad Subtítulos */}
        <div>
                <label className="block text-sm font-medium mb-2 flex items-center justify-between" style={{ color: 'var(--org-text-color, #ffffff)' }}>
                  <span>Opacidad Subtítulos</span>
            <button
                    type="button"
                    onClick={() => updateStyle(activePanel, 'card_opacity', 1)}
                    className="text-xs px-2 py-1 rounded transition-colors"
                    style={{
                      backgroundColor: 'var(--org-secondary-button-color, #8b5cf6)',
                      color: '#ffffff'
                    }}
                  >
                    Restablecer
            </button>
          </label>
          <input
            type="range"
                  min="0.3"
                  max="1"
                  step="0.05"
                  value={currentStyles.card_opacity || 1}
                  onChange={(e) => updateStyle(activePanel, 'card_opacity', Number(e.target.value))}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                  style={{
                    accentColor: 'var(--org-primary-button-color, #3b82f6)'
                  }}
                  title={`Opacidad de las tarjetas: ${((currentStyles.card_opacity || 1) * 100).toFixed(0)}%`}
                  aria-label={`Opacidad de las tarjetas: ${((currentStyles.card_opacity || 1) * 100).toFixed(0)}%`}
          />
          </div>
        </div>
          </div>
        </div>

        {/* Columna Derecha: Vista Previa */}
        <div className="lg:col-span-1">
          <div 
            className="rounded-lg p-6 border backdrop-blur-md sticky top-6"
            style={{
              backgroundColor: `rgba(var(--org-card-background-rgb, 15, 23, 42), var(--org-card-opacity, 1))`,
              borderColor: 'var(--org-border-color, #334155)'
            }}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--org-text-color, #ffffff)' }}>
          Vista Previa
            </h3>
        <div
              className="rounded-lg border-2 overflow-hidden"
          style={{
                borderColor: 'var(--org-border-color, #334155)',
                backgroundColor: currentStyles.background_type === 'gradient' 
                  ? currentStyles.background_value 
                  : currentStyles.background_type === 'color'
                  ? currentStyles.background_value
                  : 'rgba(var(--org-card-background-rgb, 15, 23, 42), var(--org-card-opacity, 1))',
                minHeight: '400px'
              }}
            >
              {/* Mini Sidebar Preview */}
              <div className="p-3 border-b" style={{ borderColor: 'var(--org-border-color, #334155)' }}>
                <div className="flex gap-2 text-xs">
                  <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Dashboard</span>
                  <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Usuarios</span>
                  <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Cursos</span>
                </div>
              </div>
              {/* Preview Content */}
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded border text-xs" style={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderColor: 'var(--org-border-color, #334155)',
                    color: 'var(--org-text-color, #ffffff)'
                  }}>
                    PMM
                  </div>
                  <div className="p-2 rounded border text-xs" style={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderColor: 'var(--org-border-color, #334155)',
                    color: 'var(--org-text-color, #ffffff)'
                  }}>
                    Tesis Completa
                  </div>
                  <div className="p-2 rounded border text-xs" style={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderColor: 'var(--org-border-color, #334155)',
                    color: 'var(--org-text-color, #ffffff)'
                  }}>
                    Nuevos Usuarios
                  </div>
                  <div className="p-2 rounded border text-xs" style={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderColor: 'var(--org-border-color, #334155)',
                    color: 'var(--org-text-color, #ffffff)'
                  }}>
                    Cursos Activos
                  </div>
                </div>
                <div className="p-2 rounded border text-xs" style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderColor: 'var(--org-border-color, #334155)',
                  color: 'var(--org-text-color, #ffffff)'
                }}>
                  Progreso
                </div>
                {/* Preview Buttons */}
                <div className="flex gap-2 mt-4">
            <button
                    className="px-3 py-1.5 rounded text-xs font-medium text-white"
              style={{ 
                      backgroundColor: currentStyles.primary_button_color || '#3b82f6'
              }}
            >
              Botón Principal
            </button>
            <button
                    className="px-3 py-1.5 rounded text-xs font-medium text-white"
              style={{ 
                      backgroundColor: currentStyles.secondary_button_color || '#8b5cf6'
              }}
            >
              Botón Secundario
            </button>
          </div>
        </div>
            </div>
          </div>
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

      {/* Botones de Acción */}
      <div className="flex justify-between">
        <div className="flex gap-4">
          <button
            onClick={handleDiscard}
            className="px-6 py-3 rounded-lg font-medium transition-colors border"
            style={{
              backgroundColor: 'transparent',
              borderColor: 'var(--org-secondary-button-color, #8b5cf6)',
              color: 'var(--org-text-color, #ffffff)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(var(--org-secondary-button-color-rgb, 139, 92, 246), 0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            Descartar Cambios
          </button>
          <button
            onClick={handleReset}
            className="px-6 py-3 rounded-lg font-medium transition-colors border"
            style={{
              backgroundColor: 'rgba(var(--org-card-background-rgb, 30, 41, 59), 0.5)',
              borderColor: 'var(--org-border-color, #334155)',
              color: 'var(--org-text-color, #ffffff)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(var(--org-card-background-rgb, 30, 41, 59), 0.7)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(var(--org-card-background-rgb, 30, 41, 59), 0.5)'
            }}
          >
            <RotateCcw className="w-4 h-4 inline-block mr-2" />
            Restablecer
          </button>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          style={{
            backgroundColor: 'var(--org-primary-button-color, #3b82f6)',
            color: '#ffffff'
          }}
          onMouseEnter={(e) => {
            if (!isSaving) {
              (e.target as HTMLButtonElement).style.opacity = '0.9'
            }
          }}
          onMouseLeave={(e) => {
            if (!isSaving) {
              (e.target as HTMLButtonElement).style.opacity = '1'
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

