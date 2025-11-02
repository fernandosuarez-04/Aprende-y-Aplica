'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Award,
  Save,
  Plus,
  Trash2,
  Edit2,
  Eye,
  Palette,
  Type,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  Upload
} from 'lucide-react'
import { Button } from '@aprende-y-aplica/ui'
import Image from 'next/image'

interface CertificateTemplate {
  id?: string
  name: string
  description?: string | null
  design_config: {
    layout?: string
    colors?: {
      primary: string
      secondary: string
      text: string
      background: string
    }
    fonts?: {
      title: string
      body: string
    }
    elements?: {
      show_logo: boolean
      show_signature: boolean
      show_date: boolean
      show_code: boolean
    }
    logo_url?: string
    signature_url?: string
  }
  is_default: boolean
  is_active: boolean
}

export function BusinessCertificateCustomizer() {
  const [templates, setTemplates] = useState<CertificateTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<CertificateTemplate | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewMode, setPreviewMode] = useState(false)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/business/certificates/templates', {
        credentials: 'include'
      })

      const data = await response.json()

      if (data.success) {
        setTemplates(data.templates || [])
        if (data.templates && data.templates.length > 0) {
          const defaultTemplate = data.templates.find((t: CertificateTemplate) => t.is_default) || data.templates[0]
          setSelectedTemplate(defaultTemplate)
        } else if (data.default_template) {
          setTemplates([data.default_template])
          setSelectedTemplate(data.default_template)
        }
      } else {
        setError(data.error || 'Error al cargar templates')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar templates')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!selectedTemplate) return

    try {
      setIsSaving(true)
      setError(null)
      setSaveSuccess(false)

      const endpoint = selectedTemplate.id
        ? `/api/business/certificates/templates?id=${selectedTemplate.id}`
        : '/api/business/certificates/templates'

      const response = await fetch(endpoint, {
        method: selectedTemplate.id ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          name: selectedTemplate.name,
          description: selectedTemplate.description,
          design_config: selectedTemplate.design_config,
          is_default: selectedTemplate.is_default
        })
      })

      const data = await response.json()

      if (data.success) {
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
        setIsEditing(false)
        await fetchTemplates()
        if (data.template) {
          setSelectedTemplate(data.template)
        }
      } else {
        setError(data.error || 'Error al guardar template')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar template')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCreateNew = () => {
    const newTemplate: CertificateTemplate = {
      name: `Template ${templates.length + 1}`,
      description: '',
      design_config: {
        layout: 'modern',
        colors: {
          primary: '#8b5cf6',
          secondary: '#6366f1',
          text: '#1f2937',
          background: '#ffffff'
        },
        fonts: {
          title: 'Inter',
          body: 'Inter'
        },
        elements: {
          show_logo: true,
          show_signature: true,
          show_date: true,
          show_code: true
        },
        logo_url: '',
        signature_url: ''
      },
      is_default: false,
      is_active: true
    }
    setSelectedTemplate(newTemplate)
    setIsEditing(true)
  }

  const updateDesignConfig = (path: string[], value: any) => {
    if (!selectedTemplate) return

    const config = { ...selectedTemplate.design_config }
    let current: any = config

    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]] = { ...current[path[i]] }
    }

    current[path[path.length - 1]] = value

    setSelectedTemplate({
      ...selectedTemplate,
      design_config: config
    })
  }

  const handleDelete = async (templateId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este template?')) {
      return
    }

    try {
      const response = await fetch(`/api/business/certificates/templates?id=${templateId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      const data = await response.json()

      if (data.success) {
        await fetchTemplates()
        if (selectedTemplate?.id === templateId) {
          const remaining = templates.filter(t => t.id !== templateId)
          setSelectedTemplate(remaining.length > 0 ? remaining[0] : null)
        }
      } else {
        setError(data.error || 'Error al eliminar template')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar template')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Award className="w-6 h-6 text-primary" />
            Personalizar Certificados
          </h2>
          <p className="text-carbon-400 mt-1">
            Crea y personaliza templates de certificados con el branding de tu organización
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saveSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 flex items-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              <span>Guardado exitosamente</span>
            </motion.div>
          )}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 flex items-center gap-2"
            >
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </motion.div>
          )}
          <Button
            variant="outline"
            onClick={() => setPreviewMode(!previewMode)}
            className="flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            {previewMode ? 'Editar' : 'Vista Previa'}
          </Button>
          {!isEditing && selectedTemplate && (
            <Button
              variant="gradient"
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2"
            >
              <Edit2 className="w-4 h-4" />
              Editar
            </Button>
          )}
          {isEditing && (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false)
                  fetchTemplates()
                }}
                className="flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancelar
              </Button>
              <Button
                variant="gradient"
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Guardar
                  </>
                )}
              </Button>
            </>
          )}
          <Button
            variant="gradient"
            onClick={handleCreateNew}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nuevo Template
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar - Lista de Templates */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-carbon-900 rounded-lg p-4 border border-carbon-700">
            <h3 className="text-lg font-semibold text-white mb-4">Templates</h3>
            <div className="space-y-2">
              {templates.map(template => (
                <button
                  key={template.id || 'new'}
                  onClick={() => {
                    setSelectedTemplate(template)
                    setIsEditing(false)
                    setPreviewMode(false)
                  }}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedTemplate?.id === template.id
                      ? 'bg-primary/20 border-primary text-primary'
                      : 'bg-carbon-800 border-carbon-700 text-carbon-300 hover:border-carbon-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{template.name}</p>
                      {template.is_default && (
                        <span className="text-xs text-primary">Por Defecto</span>
                      )}
                    </div>
                    {template.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(template.id!)
                        }}
                        className="p-1 hover:bg-red-500/20 rounded text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content - Editor o Preview */}
        <div className="lg:col-span-2">
          {selectedTemplate ? (
            previewMode ? (
              <CertificatePreview template={selectedTemplate} />
            ) : isEditing ? (
              <CertificateEditor
                template={selectedTemplate}
                onUpdate={(updated) => setSelectedTemplate(updated)}
                updateDesignConfig={updateDesignConfig}
              />
            ) : (
              <div className="bg-carbon-900 rounded-lg p-6 border border-carbon-700">
                <p className="text-carbon-400 text-center py-12">
                  Haz clic en "Editar" para personalizar este template
                </p>
              </div>
            )
          ) : (
            <div className="bg-carbon-900 rounded-lg p-6 border border-carbon-700">
              <p className="text-carbon-400 text-center py-12">
                No hay templates. Crea uno nuevo para comenzar.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function CertificateEditor({
  template,
  onUpdate,
  updateDesignConfig
}: {
  template: CertificateTemplate
  onUpdate: (template: CertificateTemplate) => void
  updateDesignConfig: (path: string[], value: any) => void
}) {
  const fontOptions = ['Inter', 'Montserrat', 'Roboto', 'Open Sans', 'Lato', 'Poppins', 'Raleway', 'Georgia', 'Times New Roman']

  return (
    <div className="space-y-6">
      {/* Información Básica */}
      <div className="bg-carbon-900 rounded-lg p-6 border border-carbon-700 space-y-4">
        <h3 className="text-lg font-semibold text-white mb-4">Información del Template</h3>
        <div>
          <label className="block text-sm font-medium text-carbon-300 mb-2">
            Nombre del Template
          </label>
          <input
            type="text"
            value={template.name}
            onChange={(e) => onUpdate({ ...template, name: e.target.value })}
            className="w-full px-4 py-2 bg-carbon-800 border border-carbon-700 rounded-lg text-white placeholder-carbon-500 focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Nombre del template"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-carbon-300 mb-2">
            Descripción
          </label>
          <textarea
            value={template.description || ''}
            onChange={(e) => onUpdate({ ...template, description: e.target.value })}
            rows={3}
            className="w-full px-4 py-2 bg-carbon-800 border border-carbon-700 rounded-lg text-white placeholder-carbon-500 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            placeholder="Descripción del template"
          />
        </div>
      </div>

      {/* Colores */}
      <div className="bg-carbon-900 rounded-lg p-6 border border-carbon-700 space-y-4">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Palette className="w-5 h-5 text-primary" />
          Colores
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-carbon-300 mb-2">
              Color Principal
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={template.design_config.colors?.primary || '#8b5cf6'}
                onChange={(e) => updateDesignConfig(['colors', 'primary'], e.target.value)}
                className="w-16 h-10 rounded-lg border border-carbon-700 cursor-pointer"
              />
              <input
                type="text"
                value={template.design_config.colors?.primary || '#8b5cf6'}
                onChange={(e) => updateDesignConfig(['colors', 'primary'], e.target.value)}
                className="flex-1 px-4 py-2 bg-carbon-800 border border-carbon-700 rounded-lg text-white placeholder-carbon-500 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-carbon-300 mb-2">
              Color Secundario
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={template.design_config.colors?.secondary || '#6366f1'}
                onChange={(e) => updateDesignConfig(['colors', 'secondary'], e.target.value)}
                className="w-16 h-10 rounded-lg border border-carbon-700 cursor-pointer"
              />
              <input
                type="text"
                value={template.design_config.colors?.secondary || '#6366f1'}
                onChange={(e) => updateDesignConfig(['colors', 'secondary'], e.target.value)}
                className="flex-1 px-4 py-2 bg-carbon-800 border border-carbon-700 rounded-lg text-white placeholder-carbon-500 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-carbon-300 mb-2">
              Color de Texto
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={template.design_config.colors?.text || '#1f2937'}
                onChange={(e) => updateDesignConfig(['colors', 'text'], e.target.value)}
                className="w-16 h-10 rounded-lg border border-carbon-700 cursor-pointer"
              />
              <input
                type="text"
                value={template.design_config.colors?.text || '#1f2937'}
                onChange={(e) => updateDesignConfig(['colors', 'text'], e.target.value)}
                className="flex-1 px-4 py-2 bg-carbon-800 border border-carbon-700 rounded-lg text-white placeholder-carbon-500 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-carbon-300 mb-2">
              Color de Fondo
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={template.design_config.colors?.background || '#ffffff'}
                onChange={(e) => updateDesignConfig(['colors', 'background'], e.target.value)}
                className="w-16 h-10 rounded-lg border border-carbon-700 cursor-pointer"
              />
              <input
                type="text"
                value={template.design_config.colors?.background || '#ffffff'}
                onChange={(e) => updateDesignConfig(['colors', 'background'], e.target.value)}
                className="flex-1 px-4 py-2 bg-carbon-800 border border-carbon-700 rounded-lg text-white placeholder-carbon-500 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Fuentes */}
      <div className="bg-carbon-900 rounded-lg p-6 border border-carbon-700 space-y-4">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Type className="w-5 h-5 text-primary" />
          Tipografía
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-carbon-300 mb-2">
              Fuente del Título
            </label>
            <select
              value={template.design_config.fonts?.title || 'Inter'}
              onChange={(e) => updateDesignConfig(['fonts', 'title'], e.target.value)}
              className="w-full px-4 py-2 bg-carbon-800 border border-carbon-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {fontOptions.map(font => (
                <option key={font} value={font}>{font}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-carbon-300 mb-2">
              Fuente del Cuerpo
            </label>
            <select
              value={template.design_config.fonts?.body || 'Inter'}
              onChange={(e) => updateDesignConfig(['fonts', 'body'], e.target.value)}
              className="w-full px-4 py-2 bg-carbon-800 border border-carbon-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {fontOptions.map(font => (
                <option key={font} value={font}>{font}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Elementos */}
      <div className="bg-carbon-900 rounded-lg p-6 border border-carbon-700 space-y-4">
        <h3 className="text-lg font-semibold text-white mb-4">Elementos Visibles</h3>
        <div className="space-y-3">
          {[
            { key: 'show_logo', label: 'Mostrar Logo' },
            { key: 'show_signature', label: 'Mostrar Firma' },
            { key: 'show_date', label: 'Mostrar Fecha' },
            { key: 'show_code', label: 'Mostrar Código de Verificación' }
          ].map(element => (
            <label key={element.key} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={template.design_config.elements?.[element.key as keyof typeof template.design_config.elements] || false}
                onChange={(e) => updateDesignConfig(['elements', element.key], e.target.checked)}
                className="w-5 h-5 rounded border-carbon-600 bg-carbon-800 text-primary focus:ring-primary focus:ring-2"
              />
              <span className="text-carbon-300">{element.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* URLs de Imágenes */}
      <div className="bg-carbon-900 rounded-lg p-6 border border-carbon-700 space-y-4">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-primary" />
          Imágenes
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-carbon-300 mb-2">
              URL del Logo
            </label>
            <input
              type="url"
              value={template.design_config.logo_url || ''}
              onChange={(e) => updateDesignConfig(['logo_url'], e.target.value)}
              placeholder="https://ejemplo.com/logo.png"
              className="w-full px-4 py-2 bg-carbon-800 border border-carbon-700 rounded-lg text-white placeholder-carbon-500 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-carbon-300 mb-2">
              URL de la Firma
            </label>
            <input
              type="url"
              value={template.design_config.signature_url || ''}
              onChange={(e) => updateDesignConfig(['signature_url'], e.target.value)}
              placeholder="https://ejemplo.com/firma.png"
              className="w-full px-4 py-2 bg-carbon-800 border border-carbon-700 rounded-lg text-white placeholder-carbon-500 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function CertificatePreview({ template }: { template: CertificateTemplate }) {
  const colors = template.design_config.colors || {
    primary: '#8b5cf6',
    secondary: '#6366f1',
    text: '#1f2937',
    background: '#ffffff'
  }

  const fonts = template.design_config.fonts || {
    title: 'Inter',
    body: 'Inter'
  }

  const elements = template.design_config.elements || {
    show_logo: true,
    show_signature: true,
    show_date: true,
    show_code: true
  }

  return (
    <div className="bg-carbon-900 rounded-lg p-6 border border-carbon-700">
      <h3 className="text-lg font-semibold text-white mb-4">Vista Previa del Certificado</h3>
      <div
        className="w-full aspect-[4/3] rounded-lg border-4 shadow-2xl p-8"
        style={{
          backgroundColor: colors.background,
          color: colors.text,
          fontFamily: fonts.body
        }}
      >
        <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
          {/* Logo */}
          {elements.show_logo && template.design_config.logo_url && (
            <div className="w-32 h-32 relative mb-4">
              <Image
                src={template.design_config.logo_url}
                alt="Logo"
                fill
                className="object-contain"
              />
            </div>
          )}

          {/* Título */}
          <div style={{ fontFamily: fonts.title }}>
            <h1
              className="text-4xl font-bold mb-2"
              style={{ color: colors.primary }}
            >
              Certificado de Completación
            </h1>
            <p className="text-xl" style={{ color: colors.text }}>
              Se certifica que
            </p>
          </div>

          {/* Nombre del Estudiante */}
          <div className="my-4">
            <h2
              className="text-5xl font-bold"
              style={{ color: colors.primary }}
            >
              Juan Pérez
            </h2>
          </div>

          {/* Descripción */}
          <div style={{ fontFamily: fonts.body }}>
            <p className="text-lg" style={{ color: colors.text }}>
              ha completado exitosamente el curso
            </p>
            <p
              className="text-2xl font-semibold mt-2"
              style={{ color: colors.secondary }}
            >
              Introducción a React
            </p>
          </div>

          {/* Fecha y Código */}
          <div className="mt-8 flex items-center justify-between w-full">
            {elements.show_date && (
              <div>
                <p className="text-sm" style={{ color: colors.text }}>
                  Fecha: {new Date().toLocaleDateString('es-ES')}
                </p>
              </div>
            )}
            {elements.show_code && (
              <div>
                <p className="text-xs font-mono" style={{ color: colors.secondary }}>
                  Código: ABC123XYZ
                </p>
              </div>
            )}
          </div>

          {/* Firma */}
          {elements.show_signature && template.design_config.signature_url && (
            <div className="mt-8">
              <div className="w-32 h-16 relative mx-auto">
                <Image
                  src={template.design_config.signature_url}
                  alt="Firma"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

