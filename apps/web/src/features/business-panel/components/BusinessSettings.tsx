'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Building2,
  CreditCard,
  Settings as SettingsIcon,
  Save,
  Loader2,
  XCircle,
  CheckCircle,
  Calendar,
  Users,
  Globe,
  Mail,
  Phone,
  Image as ImageIcon,
  Info,
  AlertCircle,
  Upload,
  X,
  Palette,
  Type,
  Bell,
  Link as LinkIcon,
  Copy,
  Check,
  FileText,
  ChevronDown,
  MoreVertical,
  Sparkles
} from 'lucide-react'
import { useBusinessSettings, OrganizationData } from '../hooks/useBusinessSettings'
import { BusinessNotificationsSettings } from './BusinessNotificationsSettings'
import { BusinessThemeCustomizer } from './BusinessThemeCustomizer'
import { Button } from '@aprende-y-aplica/ui'
import Image from 'next/image'
import { ImageUpload } from '../../admin/components/ImageUpload'
import { CloudArrowUpIcon } from '@heroicons/react/24/outline'
import { useSubscriptionFeatures } from '../hooks/useSubscriptionFeatures'
import { useOrganizationStylesContext } from '../contexts/OrganizationStylesContext'
import { useBranding } from '../hooks/useBranding'
import { BrandingColorPicker } from './BrandingColorPicker'

export function BusinessSettings() {
  const { data, isLoading, error, refetch, updateOrganization } = useBusinessSettings()
  const { plan, canUse, refetch: refetchSubscription } = useSubscriptionFeatures()
  const { refetch: refetchStyles } = useOrganizationStylesContext()
  const [activeTab, setActiveTab] = useState<'organization' | 'subscription' | 'branding' | 'personalization' | 'notifications'>('organization')
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Validar si puede acceder a tabs premium (recalcula cuando el plan cambia)
  const canUseBranding = canUse('corporate_branding')

  // Escuchar eventos de cambio de plan y refrescar características
  useEffect(() => {
    const handlePlanChange = () => {
      refetchSubscription()
      refetch()
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('subscription-plan-changed', handlePlanChange)
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('subscription-plan-changed', handlePlanChange)
      }
    }
  }, [refetchSubscription, refetch])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div
          className="w-16 h-16 border-4 rounded-full animate-spin"
          style={{
            borderColor: 'rgba(var(--org-primary-button-color-rgb, 59, 130, 246), 0.3)',
            borderTopColor: 'var(--org-primary-button-color, #3b82f6)'
          }}
        ></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <p className="text-red-400 text-lg mb-4">{error}</p>
        <button
          onClick={refetch}
          className="px-4 py-2 rounded-lg transition-colors"
          style={{
            backgroundColor: 'var(--org-primary-button-color, #3b82f6)',
            opacity: 0.2
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.3')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.2')}
        >
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      {/* Tabs */}
      <div className="rounded-xl border border-carbon-700 overflow-hidden backdrop-blur-md" style={{ backgroundColor: `rgba(var(--org-card-background-rgb, 30, 41, 59), var(--org-card-opacity, 1))` }}>
        <div className="flex border-b border-carbon-700 overflow-x-auto">
          <button
            onClick={() => setActiveTab('organization')}
            className={`px-6 py-4 font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'organization'
                ? 'border-b-2 bg-carbon-900'
                : 'text-carbon-400 hover:text-carbon-300 hover:bg-carbon-900/50'
            }`}
            style={activeTab === 'organization' ? {
              color: 'var(--org-primary-button-color, #3b82f6)',
              borderBottomColor: 'var(--org-primary-button-color, #3b82f6)'
            } : {}}
          >
            <Building2 className="w-5 h-5" />
            Datos de la Empresa
          </button>
          <button
            onClick={() => setActiveTab('subscription')}
            className={`px-6 py-4 font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'subscription'
                ? 'border-b-2 bg-carbon-900'
                : 'text-carbon-400 hover:text-carbon-300 hover:bg-carbon-900/50'
            }`}
            style={activeTab === 'subscription' ? {
              color: 'var(--org-primary-button-color, #3b82f6)',
              borderBottomColor: 'var(--org-primary-button-color, #3b82f6)'
            } : {}}
          >
            <CreditCard className="w-5 h-5" />
            Suscripción
          </button>
          {canUseBranding && (
            <button
              onClick={() => setActiveTab('branding')}
              className={`px-6 py-4 font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'branding'
                  ? 'border-b-2 bg-carbon-900'
                  : 'text-carbon-400 hover:text-carbon-300 hover:bg-carbon-900/50'
              }`}
              style={activeTab === 'branding' ? {
                color: 'var(--org-primary-button-color, #3b82f6)',
                borderBottomColor: 'var(--org-primary-button-color, #3b82f6)'
              } : {}}
            >
              <Palette className="w-5 h-5" />
              Branding
            </button>
          )}
          <button
            onClick={() => setActiveTab('personalization')}
            className={`px-6 py-4 font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'personalization'
                ? 'border-b-2 bg-carbon-900'
                : 'text-carbon-400 hover:text-carbon-300 hover:bg-carbon-900/50'
            }`}
            style={activeTab === 'personalization' ? {
              color: 'var(--org-primary-button-color, #3b82f6)',
              borderBottomColor: 'var(--org-primary-button-color, #3b82f6)'
            } : {}}
          >
            <Palette className="w-5 h-5" />
            Personalización
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-6 py-4 font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'notifications'
                ? 'border-b-2 bg-carbon-900'
                : 'text-carbon-400 hover:text-carbon-300 hover:bg-carbon-900/50'
            }`}
            style={activeTab === 'notifications' ? {
              color: 'var(--org-primary-button-color, #3b82f6)',
              borderBottomColor: 'var(--org-primary-button-color, #3b82f6)'
            } : {}}
          >
            <Bell className="w-5 h-5" />
            Notificaciones
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'organization' && (
            <OrganizationTab
              organization={data.organization}
              updateOrganization={updateOrganization}
              saveSuccess={saveSuccess}
              setSaveSuccess={setSaveSuccess}
              saveError={saveError}
              setSaveError={setSaveError}
            />
          )}
          {activeTab === 'subscription' && (
            <SubscriptionTab subscription={data.subscription} />
          )}
          {activeTab === 'branding' && canUseBranding && (
            <BrandingTab />
          )}
          {activeTab === 'branding' && !canUseBranding && (
            <div className="text-center py-20">
              <AlertCircle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
              <p className="text-yellow-400 text-lg mb-2">Branding Corporativo No Disponible</p>
              <p className="text-carbon-400 text-sm">Esta función solo está disponible en Enterprise. Actualiza tu plan para acceder a esta funcionalidad.</p>
            </div>
          )}
          {activeTab === 'personalization' && (
            <BusinessThemeCustomizer />
          )}
          {activeTab === 'notifications' && (
            <BusinessNotificationsSettings />
          )}
        </div>
      </div>
    </div>
  )
}

// Tab: Datos de la Empresa
function OrganizationTab({
  organization,
  updateOrganization,
  saveSuccess,
  setSaveSuccess,
  saveError,
  setSaveError
}: {
  organization: OrganizationData | null
  updateOrganization: (data: Partial<OrganizationData>) => Promise<boolean>
  saveSuccess: string | null
  setSaveSuccess: (msg: string | null) => void
  saveError: string | null
  setSaveError: (msg: string | null) => void
}) {
  const [formData, setFormData] = useState({
    name: organization?.name || '',
    description: organization?.description || '',
    contact_email: organization?.contact_email || '',
    contact_phone: organization?.contact_phone || '',
    website_url: organization?.website_url || '',
    logo_url: organization?.logo_url || '',
    max_users: organization?.max_users?.toString() || '10'
  })
  const [isSaving, setIsSaving] = useState(false)
  const [copiedFields, setCopiedFields] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (organization) {
      setFormData({
        name: organization.name || '',
        description: organization.description || '',
        contact_email: organization.contact_email || '',
        contact_phone: organization.contact_phone || '',
        website_url: organization.website_url || '',
        logo_url: organization.logo_url || '',
        max_users: organization.max_users?.toString() || '10'
      })
    }
  }, [organization])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))

    // Limpiar mensajes de éxito/error al cambiar datos
    if (saveSuccess) setSaveSuccess(null)
    if (saveError) setSaveError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setSaveError(null)
    setSaveSuccess(null)

    try {
      const updateData: Partial<OrganizationData> = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        contact_email: formData.contact_email.trim() || null,
        contact_phone: formData.contact_phone.trim() || null,
        website_url: formData.website_url.trim() || null,
        logo_url: formData.logo_url.trim() || null,
        max_users: parseInt(formData.max_users)
      }

      const success = await updateOrganization(updateData)

      if (success) {
        setSaveSuccess('Datos de la empresa actualizados correctamente')
        setTimeout(() => setSaveSuccess(null), 5000)
      } else {
        setSaveError('Error al actualizar los datos')
        setTimeout(() => setSaveError(null), 5000)
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Error al actualizar los datos')
      setTimeout(() => setSaveError(null), 5000)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDiscard = () => {
    if (organization) {
      setFormData({
        name: organization.name || '',
        description: organization.description || '',
        contact_email: organization.contact_email || '',
        contact_phone: organization.contact_phone || '',
        website_url: organization.website_url || '',
        logo_url: organization.logo_url || '',
        max_users: organization.max_users?.toString() || '10'
      })
      setSaveError(null)
      setSaveSuccess(null)
    }
  }

  const copyToClipboard = (text: string, field: string) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedFields(prev => ({ ...prev, [field]: true }))
        setTimeout(() => {
          setCopiedFields(prev => ({ ...prev, [field]: false }))
        }, 2000)
      }).catch(() => {
        const textArea = document.createElement('textarea')
        textArea.value = text
        textArea.style.position = 'fixed'
        textArea.style.opacity = '0'
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        setCopiedFields(prev => ({ ...prev, [field]: true }))
        setTimeout(() => {
          setCopiedFields(prev => ({ ...prev, [field]: false }))
        }, 2000)
      })
    }
  }

  if (!organization) {
  return (
      <div className="text-center py-12">
        <Info className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--org-text-color, #ffffff)' }} />
        <p style={{ color: 'var(--org-text-color, #ffffff)' }}>No hay información de organización disponible</p>
        </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Información Básica y Contacto - Grid de 2 columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Columna Izquierda: Información Básica */}
        <div className="rounded-lg p-6 border backdrop-blur-md space-y-4" style={{ 
          backgroundColor: `rgba(var(--org-card-background-rgb, 15, 23, 42), var(--org-card-opacity, 1))`,
          borderColor: 'var(--org-border-color, #334155)'
        }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--org-text-color, #ffffff)' }}>
          Información Básica
        </h3>

        <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2" style={{ color: 'var(--org-text-color, #ffffff)' }}>
            Nombre de la Empresa *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
              className="w-full px-4 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2"
              style={{
                backgroundColor: 'rgba(var(--org-card-background-rgb, 30, 41, 59), 0.5)',
                borderColor: 'var(--org-border-color, #334155)',
                color: 'var(--org-text-color, #ffffff)'
              }}
            placeholder="Nombre de tu empresa"
          />
        </div>

        <div>
            <label htmlFor="description" className="block text-sm font-medium mb-2" style={{ color: 'var(--org-text-color, #ffffff)' }}>
            Descripción
          </label>
            <div className="relative">
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
                maxLength={500}
                className="w-full px-4 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2 resize-none"
                style={{
                  backgroundColor: 'rgba(var(--org-card-background-rgb, 30, 41, 59), 0.5)',
                  borderColor: 'var(--org-border-color, #334155)',
                  color: 'var(--org-text-color, #ffffff)'
                }}
            placeholder="Describe tu empresa..."
          />
              <div className="absolute bottom-2 right-2 text-xs" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                {formData.description.length}/500
              </div>
        </div>
      </div>

          <div>
            <label htmlFor="contact_email" className="block text-sm font-medium mb-2" style={{ color: 'var(--org-text-color, #ffffff)' }}>
              Email de Contacto
            </label>
            <input
              type="email"
              id="contact_email"
              name="contact_email"
              value={formData.contact_email}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2"
              style={{
                backgroundColor: 'rgba(var(--org-card-background-rgb, 30, 41, 59), 0.5)',
                borderColor: 'var(--org-border-color, #334155)',
                color: 'var(--org-text-color, #ffffff)'
              }}
              placeholder="contacto@empresa.com"
            />
          </div>

          <div>
            <label htmlFor="website_url" className="block text-sm font-medium mb-2" style={{ color: 'var(--org-text-color, #ffffff)' }}>
            Sitio Web
          </label>
          <input
            type="url"
            id="website_url"
            name="website_url"
            value={formData.website_url}
            onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2"
              style={{
                backgroundColor: 'rgba(var(--org-card-background-rgb, 30, 41, 59), 0.5)',
                borderColor: 'var(--org-border-color, #334155)',
                color: 'var(--org-text-color, #ffffff)'
              }}
            placeholder="https://www.empresa.com"
          />
      </div>

        <div>
            <label htmlFor="max_users" className="block text-sm font-medium mb-2" style={{ color: 'var(--org-text-color, #ffffff)' }}>
              Límite de usuarios
          </label>
            <div className="flex items-center gap-2">
          <input
            type="number"
            id="max_users"
            name="max_users"
            value={formData.max_users}
            onChange={handleChange}
            min="1"
                className="flex-1 px-4 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: 'rgba(var(--org-card-background-rgb, 30, 41, 59), 0.5)',
                  borderColor: 'var(--org-border-color, #334155)',
                  color: 'var(--org-text-color, #ffffff)'
                }}
            placeholder="10"
          />
              <span className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>usuarios</span>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Información de Contacto */}
        <div className="space-y-6">
          <div className="rounded-lg p-6 border backdrop-blur-md space-y-4" style={{ 
            backgroundColor: `rgba(var(--org-card-background-rgb, 15, 23, 42), var(--org-card-opacity, 1))`,
            borderColor: 'var(--org-border-color, #334155)'
          }}>
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--org-text-color, #ffffff)' }}>
              Información de Contacto
            </h3>
            <p className="text-sm mb-4" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
              Información de contacto de tu organización
            </p>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--org-text-color, #ffffff)' }}>
                Nombre de Contacto
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.name}
                  readOnly
                  className="flex-1 px-4 py-2 rounded-lg border transition-colors"
                  style={{
                    backgroundColor: 'rgba(var(--org-card-background-rgb, 30, 41, 59), 0.5)',
                    borderColor: 'var(--org-border-color, #334155)',
                    color: 'var(--org-text-color, #ffffff)'
                  }}
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(formData.name, 'name')}
                  className="px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                  style={{
                    backgroundColor: 'var(--org-primary-button-color, #3b82f6)',
                    color: '#ffffff'
                  }}
                >
                  {copiedFields.name ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copiar
                    </>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--org-text-color, #ffffff)' }}>
                Descripción
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.description || ''}
                  readOnly
                  className="flex-1 px-4 py-2 rounded-lg border transition-colors"
                  style={{
                    backgroundColor: 'rgba(var(--org-card-background-rgb, 30, 41, 59), 0.5)',
                    borderColor: 'var(--org-border-color, #334155)',
                    color: 'var(--org-text-color, #ffffff)'
                  }}
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(formData.description || '', 'description')}
                  className="px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                  style={{
                    backgroundColor: 'var(--org-primary-button-color, #3b82f6)',
                    color: '#ffffff'
                  }}
                >
                  {copiedFields.description ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copiar
                    </>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--org-text-color, #ffffff)' }}>
                Email de Contacto
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={formData.contact_email || ''}
                  readOnly
                  className="flex-1 px-4 py-2 rounded-lg border transition-colors"
                  style={{
                    backgroundColor: 'rgba(var(--org-card-background-rgb, 30, 41, 59), 0.5)',
                    borderColor: 'var(--org-border-color, #334155)',
                    color: 'var(--org-text-color, #ffffff)'
                  }}
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(formData.contact_email || '', 'email')}
                  className="px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                  style={{
                    backgroundColor: 'var(--org-primary-button-color, #3b82f6)',
                    color: '#ffffff'
                  }}
                >
                  {copiedFields.email ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copiar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Link Personalizado de Login */}
          {organization?.slug && (
            <LoginPersonalizadoSection organization={organization} />
          )}
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
        <button
          type="button"
          onClick={handleDiscard}
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
          Descartar Cambios
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          style={{
            backgroundColor: 'var(--org-primary-button-color, #3b82f6)',
            color: '#ffffff'
          }}
          onMouseEnter={(e) => {
            if (!isSaving) e.currentTarget.style.opacity = '0.9'
          }}
          onMouseLeave={(e) => {
            if (!isSaving) e.currentTarget.style.opacity = '1'
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
    </form>
  )
}

// Componente: Link Personalizado de Login
function LoginPersonalizadoSection({ organization }: { organization: OrganizationData }) {
  const [copiedLogin, setCopiedLogin] = useState(false)
  const [copiedRegister, setCopiedRegister] = useState(false)
  const [baseUrl, setBaseUrl] = useState('')

  useEffect(() => {
    // Obtener URL base del navegador
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin)
    }
  }, [])

  const loginUrl = `${baseUrl}/auth/${organization.slug}`
  const registerUrl = `${baseUrl}/auth/${organization.slug}/register`

  const copyToClipboard = (text: string, type: 'login' | 'register') => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        if (type === 'login') {
          setCopiedLogin(true)
          setTimeout(() => setCopiedLogin(false), 2000)
        } else {
          setCopiedRegister(true)
          setTimeout(() => setCopiedRegister(false), 2000)
        }
      }).catch(() => {
        // Fallback para navegadores antiguos
        const textArea = document.createElement('textarea')
        textArea.value = text
        textArea.style.position = 'fixed'
        textArea.style.opacity = '0'
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        if (type === 'login') {
          setCopiedLogin(true)
          setTimeout(() => setCopiedLogin(false), 2000)
        } else {
          setCopiedRegister(true)
          setTimeout(() => setCopiedRegister(false), 2000)
        }
      })
    }
  }

  const canUseCustomLogin = () => {
    if (!organization.slug) return false
    const allowedPlans = ['team', 'business', 'enterprise']
    const activeStatuses = ['active', 'trial']
    return (
      allowedPlans.includes(organization.subscription_plan || '') &&
      activeStatuses.includes(organization.subscription_status || '') &&
      organization.is_active
    )
  }

  if (!canUseCustomLogin()) {
    return (
      <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-yellow-400 mb-2">
              Login Personalizado No Disponible
            </h3>
            <p className="text-yellow-300 text-sm">
              Para acceder a login personalizado, necesitas una suscripción activa (Team, Business o Enterprise).
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="rounded-lg p-6 border backdrop-blur-md" 
      style={{ 
        backgroundColor: `rgba(var(--org-card-background-rgb, 15, 23, 42), var(--org-card-opacity, 1))`,
        borderColor: 'var(--org-border-color, #334155)'
      }}
    >
      <h3 className="text-lg font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--org-text-color, #ffffff)' }}>
        <LinkIcon className="w-5 h-5" />
        Link Personalizado de Login
      </h3>
      <p className="text-sm mb-4" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
        Comparte estos links con tus empleados para que accedan directamente al login personalizado de tu organización.
      </p>

      {/* Link de Login */}
      <div className="space-y-3 mb-4">
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--org-text-color, #ffffff)' }}>
            Link de Login
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={loginUrl}
              readOnly
              className="flex-1 px-4 py-2 rounded-lg text-sm transition-colors focus:outline-none focus:ring-2"
              style={{
                backgroundColor: 'rgba(var(--org-card-background-rgb, 30, 41, 59), 0.5)',
                borderColor: 'var(--org-border-color, #334155)',
                color: 'var(--org-text-color, #ffffff)',
                border: '1px solid'
              }}
            />
            <button
              type="button"
              onClick={() => copyToClipboard(loginUrl, 'login')}
              className="px-4 py-2 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap"
              style={{
                backgroundColor: 'var(--org-primary-button-color, #3b82f6)',
                color: '#ffffff'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              title="Copiar link de login"
            >
              {copiedLogin ? (
                <>
                  <Check className="w-4 h-4" />
                  Copiado
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copiar
                </>
              )}
            </button>
          </div>
        </div>

        {/* Link de Registro */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--org-text-color, #ffffff)' }}>
            Link de Registro
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={registerUrl}
              readOnly
              className="flex-1 px-4 py-2 rounded-lg text-sm transition-colors focus:outline-none focus:ring-2"
              style={{
                backgroundColor: 'rgba(var(--org-card-background-rgb, 30, 41, 59), 0.5)',
                borderColor: 'var(--org-border-color, #334155)',
                color: 'var(--org-text-color, #ffffff)',
                border: '1px solid'
              }}
            />
            <button
              type="button"
              onClick={() => copyToClipboard(registerUrl, 'register')}
              className="px-4 py-2 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap"
              style={{
                backgroundColor: 'var(--org-primary-button-color, #3b82f6)',
                color: '#ffffff'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              title="Copiar link de registro"
            >
              {copiedRegister ? (
                <>
                  <Check className="w-4 h-4" />
                  Copiado
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copiar
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Información adicional */}
      <div className="rounded-lg p-4 border" style={{
        backgroundColor: 'rgba(var(--org-primary-button-color-rgb, 59, 130, 246), 0.1)',
        borderColor: 'rgba(var(--org-primary-button-color-rgb, 59, 130, 246), 0.3)'
      }}>
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 flex-shrink-0 mt-0.5" style={{
            color: 'var(--org-primary-button-color, #3b82f6)'
          }} />
          <div className="flex-1">
            <p className="text-sm" style={{
              color: 'var(--org-primary-button-color, #3b82f6)'
            }}>
              <strong>Nota:</strong> Los usuarios que accedan a estos links verán el login personalizado con tu logo y nombre de empresa.
              Si intentan acceder al login principal, serán redirigidos automáticamente a tu login personalizado.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Tab: Suscripción
function SubscriptionTab({ subscription }: { subscription: any }) {
  const router = useRouter()
  const [isCancelling, setIsCancelling] = useState(false)

  if (!subscription) {
    return (
      <div className="text-center py-12">
        <Info className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--org-text-color, #ffffff)' }} />
        <p style={{ color: 'var(--org-text-color, #ffffff)' }}>No hay información de suscripción disponible</p>
      </div>
    )
  }

  const planLabels: Record<string, string> = {
    team: 'Team',
    business: 'Business',
    enterprise: 'Enterprise',
    starter: 'Starter',
    pro: 'Pro'
  }

  const planDescriptions: Record<string, string> = {
    team: 'Tu Plan de Colaboración en Equipo',
    business: 'Tu Plan de Crecimiento Empresarial',
    enterprise: 'Tu Plan Premium de Liderazgo Digital',
    starter: 'Tu Plan de Inicio',
    pro: 'Tu Plan Profesional'
  }

  const statusLabels: Record<string, string> = {
    active: 'ACTIVA',
    expired: 'EXPIRADA',
    cancelled: 'CANCELADA',
    trial: 'EN PRUEBA',
    pending: 'PENDIENTE'
  }

  const formatDate = (date: string | null | undefined) => {
    if (!date) return 'No disponible'
    try {
      const dateObj = new Date(date)
      if (isNaN(dateObj.getTime())) return 'No disponible'
      return dateObj.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }).toUpperCase()
    } catch (error) {
      return 'No disponible'
    }
  }

  const calculateDaysUntilRenewal = () => {
    if (!subscription.end_date) return null
    const endDate = new Date(subscription.end_date)
    const today = new Date()
    const diffTime = endDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays : 0
  }

  const daysUntilRenewal = subscription.days_until_expiration ?? calculateDaysUntilRenewal()

  const getBenefits = () => {
    const plan = subscription.plan?.toLowerCase() || 'team'
    const benefits: Record<string, string[]> = {
      enterprise: [
        'Soporte 24/7 Prioritario',
        'Almacenamiento Ilimitado en Nube',
        'Analíticas Avanzadas de Equipo',
        'Integraciones Exclusivas',
        'Acceso a Funciones Beta',
        'Gestión Avanzada de Usuarios'
      ],
      business: [
        'Soporte Prioritario',
        'Almacenamiento Ampliado',
        'Analíticas de Equipo',
        'Integraciones Premium',
        'Gestión de Usuarios'
      ],
      team: [
        'Soporte por Email',
        'Almacenamiento Estándar',
        'Analíticas Básicas',
        'Integraciones Estándar'
      ],
      pro: [
        'Soporte Prioritario',
        'Almacenamiento Ampliado',
        'Analíticas Avanzadas',
        'Integraciones Premium'
      ],
      starter: [
        'Soporte por Email',
        'Almacenamiento Básico',
        'Analíticas Básicas'
      ]
    }
    return benefits[plan] || benefits.team
  }

  const handleChangePlan = () => {
    router.push('/business-panel/subscription/plans')
  }

  const handleCancelSubscription = async () => {
    if (!confirm('¿Estás seguro de que deseas cancelar tu suscripción? Esto afectará el acceso a los servicios.')) {
      return
    }

    setIsCancelling(true)
    try {
      alert('Funcionalidad de cancelación en desarrollo. Próximamente estarás disponible para cancelar tu suscripción.')
    } catch (error) {
      alert('Error al cancelar la suscripción. Por favor, intenta más tarde.')
    } finally {
      setIsCancelling(false)
    }
  }

  const planName = planLabels[subscription.plan?.toLowerCase() || 'team'] || subscription.plan || 'Team'
  const planDescription = planDescriptions[subscription.plan?.toLowerCase() || 'team'] || planDescriptions.team
  const status = statusLabels[subscription.status?.toLowerCase() || 'active'] || 'ACTIVA'
  const isActive = subscription.status?.toLowerCase() === 'active' && !subscription.is_expired

  return (
    <div className="space-y-6">
      {/* Card Principal */}
      <div 
        className="rounded-xl pt-6 pb-8 px-8 border backdrop-blur-md"
        style={{
          backgroundColor: `rgba(var(--org-card-background-rgb, 15, 23, 42), var(--org-card-opacity, 1))`,
          borderColor: 'var(--org-border-color, #334155)'
        }}
      >
        {/* Título y Estado */}
        <div className="flex items-start justify-between mb-6">
          <div>
            {subscription.plan?.toLowerCase() === 'enterprise' ? (
              <h2 className="text-3xl font-bold mb-2">
                <span style={{ color: 'var(--org-text-color, #ffffff)' }}>Suscripción </span>
                <span
                  className="relative inline-block"
                  style={{
                    background: `linear-gradient(135deg, var(--org-primary-button-color, #3b82f6), var(--org-secondary-button-color, #8b5cf6))`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    filter: 'drop-shadow(0 0 8px rgba(var(--org-primary-button-color-rgb, 59, 130, 246), 0.5))',
                    position: 'relative'
                  }}
                >
                  {planName}
                  <span
                    className="absolute inset-0 blur-lg opacity-60"
                    style={{
                      background: `linear-gradient(135deg, var(--org-primary-button-color, #3b82f6), var(--org-secondary-button-color, #8b5cf6))`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      zIndex: -1
                    }}
                  >
                    {planName}
            </span>
            </span>
              </h2>
            ) : (
              <h2 
                className="text-3xl font-bold mb-2"
                style={{ color: 'var(--org-text-color, #ffffff)' }}
              >
                Suscripción {planName}
              </h2>
            )}
            <p 
              className="text-base"
              style={{ color: 'rgba(255, 255, 255, 0.7)' }}
            >
              {planDescription}
            </p>
          </div>
          {isActive && (
            <div
              className="px-6 py-2.5 rounded-full font-bold text-sm uppercase shadow-lg"
              style={{
                background: `linear-gradient(135deg, var(--org-primary-button-color, #3b82f6), var(--org-secondary-button-color, #8b5cf6))`,
                color: '#ffffff',
                boxShadow: '0 4px 14px 0 rgba(var(--org-primary-button-color-rgb, 59, 130, 246), 0.4)'
              }}
            >
              {status}
        </div>
          )}
      </div>

        {/* Separador */}
        <div 
          className="h-px mb-6"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
        />

        {/* Detalles y Beneficios */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6">
          {/* Columna Izquierda: Detalles */}
          <div>
            <h3 
              className="text-xs font-semibold uppercase tracking-wider mb-4 text-center"
              style={{ color: 'rgba(255, 255, 255, 0.6)' }}
            >
              DETALLES DE LA SUSCRIPCIÓN
        </h3>
            <div className="space-y-4 text-center">
              <div>
                <p 
                  className="text-sm mb-1"
                  style={{ color: 'rgba(255, 255, 255, 0.7)' }}
                >
                  Inicio: {formatDate(subscription.start_date)}
                </p>
                <p 
                  className="text-sm"
                  style={{ color: 'rgba(255, 255, 255, 0.7)' }}
                >
                  Fin: {formatDate(subscription.end_date)}
                </p>
          </div>
              {daysUntilRenewal !== null && daysUntilRenewal > 0 && (
                <div>
                  <p 
                    className="text-4xl font-bold mb-1"
                    style={{ color: 'var(--org-text-color, #ffffff)' }}
                  >
                    {daysUntilRenewal}
                  </p>
                  <p 
                    className="text-sm"
                    style={{ color: 'rgba(255, 255, 255, 0.6)' }}
                  >
                    DÍAS para renovación automática
                  </p>
            </div>
          )}
        </div>
      </div>

          {/* Columna Derecha: Beneficios */}
          <div>
            <h3 
              className="text-xs font-semibold uppercase tracking-wider mb-4"
              style={{ color: 'rgba(255, 255, 255, 0.6)' }}
            >
              BENEFICIOS EXCLUSIVOS
            </h3>
            <div className="space-y-3">
              {getBenefits().map((benefit, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      backgroundColor: 'var(--org-primary-button-color, #3b82f6)'
                    }}
                  >
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  <p 
                    className="text-sm"
                    style={{ color: 'var(--org-text-color, #ffffff)' }}
                  >
                    {benefit}
            </p>
          </div>
              ))}
        </div>
          </div>
        </div>

        {/* Separador */}
        <div 
          className="h-px mb-6"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
        />

      {/* Botones de Acción */}
        <div className="flex flex-wrap gap-4">
          <button
            onClick={handleChangePlan}
            disabled={isCancelling}
            className="px-6 py-3 rounded-lg font-bold text-sm uppercase transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            style={{
              background: `linear-gradient(135deg, var(--org-primary-button-color, #3b82f6), var(--org-secondary-button-color, #8b5cf6))`,
              color: '#ffffff',
              boxShadow: '0 4px 14px 0 rgba(var(--org-primary-button-color-rgb, 59, 130, 246), 0.3)'
            }}
            onMouseEnter={(e) => {
              if (!isCancelling) {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 6px 20px 0 rgba(var(--org-primary-button-color-rgb, 59, 130, 246), 0.4)'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 14px 0 rgba(var(--org-primary-button-color-rgb, 59, 130, 246), 0.3)'
            }}
          >
            Cambiar de Plan
          </button>
          <button
            onClick={handleCancelSubscription}
            disabled={isCancelling || subscription.status === 'cancelled'}
            className="px-6 py-3 rounded-lg font-bold text-sm uppercase transition-all disabled:opacity-50 disabled:cursor-not-allowed border-2"
            style={{
              backgroundColor: 'transparent',
              borderColor: 'var(--org-primary-button-color, #3b82f6)',
              color: 'var(--org-text-color, #ffffff)'
            }}
            onMouseEnter={(e) => {
              if (!isCancelling && subscription.status !== 'cancelled') {
                e.currentTarget.style.backgroundColor = 'rgba(var(--org-primary-button-color-rgb, 59, 130, 246), 0.1)'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            {isCancelling ? (
              <>
                <Loader2 className="w-4 h-4 inline-block mr-2 animate-spin" />
                Cancelando...
              </>
            ) : (
              'Cancelar Suscripción'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// Tab: Branding
function BrandingTab() {
  const { branding, isLoading, error, updateBranding, detectColors } = useBranding()
  const { refetch: refetchStyles } = useOrganizationStylesContext()
  const [isSaving, setIsSaving] = useState(false)
  const [isDetecting, setIsDetecting] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [localBranding, setLocalBranding] = useState({
    favicon_url: '',
    banner_url: '',
    color_primary: '#3b82f6',
    color_secondary: '#10b981',
    color_accent: '#8b5cf6'
  })
  const isInitialLoad = useRef(true)
  const previousBannerUrl = useRef<string>('')

  // Sincronizar estado local cuando se carga el branding
  useEffect(() => {
    if (branding) {
      setLocalBranding({
        favicon_url: branding.favicon_url || '',
        banner_url: branding.banner_url || '',
        color_primary: branding.color_primary,
        color_secondary: branding.color_secondary,
        color_accent: branding.color_accent
      })
      previousBannerUrl.current = branding.banner_url || ''
      isInitialLoad.current = false
    }
  }, [branding])

  // Detectar colores automáticamente cuando se sube un nuevo banner
  useEffect(() => {
    // No detectar en la carga inicial
    if (isInitialLoad.current) return
    
    // Solo detectar si el banner_url cambió y no es vacío
    if (localBranding.banner_url && 
        localBranding.banner_url !== previousBannerUrl.current &&
        localBranding.banner_url.trim() !== '') {
      
      // Actualizar la referencia
      previousBannerUrl.current = localBranding.banner_url
      
      // Detectar colores automáticamente
      const autoDetectColors = async () => {
        setIsDetecting(true)
        setSaveError(null)
        setSaveSuccess(null)

        try {
          const colors = await detectColors(localBranding.banner_url)
          
          if (colors && colors.color_primary && colors.color_secondary && colors.color_accent) {
            setLocalBranding(prev => ({
              ...prev,
              color_primary: colors.color_primary,
              color_secondary: colors.color_secondary,
              color_accent: colors.color_accent
            }))
            setSaveSuccess('Colores detectados automáticamente')
            setTimeout(() => setSaveSuccess(null), 5000)
          }
        } catch (err) {
          console.error('Error detectando colores automáticamente:', err)
          // No mostrar error si falla la detección automática, solo loguear
        } finally {
          setIsDetecting(false)
        }
      }

      // Pequeño delay para asegurar que la imagen esté cargada
      setTimeout(() => {
        autoDetectColors()
      }, 500)
    }
  }, [localBranding.banner_url, detectColors])

  const handleSave = async () => {
    setIsSaving(true)
    setSaveError(null)
    setSaveSuccess(null)

    try {
      const success = await updateBranding(localBranding)
      
      if (success) {
        setSaveSuccess('Branding actualizado correctamente')
        setTimeout(() => setSaveSuccess(null), 5000)
        // Refrescar estilos para aplicar cambios
        await refetchStyles()
      } else {
        setSaveError('Error al actualizar el branding')
        setTimeout(() => setSaveError(null), 5000)
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Error al actualizar el branding')
      setTimeout(() => setSaveError(null), 5000)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDetectColors = async () => {
    if (!localBranding.banner_url) {
      setSaveError('Primero debes subir un banner')
      setTimeout(() => setSaveError(null), 5000)
      return
    }

    setIsDetecting(true)
    setSaveError(null)
    setSaveSuccess(null)

    try {
      // Validar que la URL del banner sea válida
      if (!localBranding.banner_url || typeof localBranding.banner_url !== 'string') {
        throw new Error('URL del banner inválida')
      }

      // Usar la función de detección de colores del hook (ahora es cliente)
      const colors = await detectColors(localBranding.banner_url)
      
      if (colors && colors.color_primary && colors.color_secondary && colors.color_accent) {
        setLocalBranding(prev => ({
          ...prev,
          color_primary: colors.color_primary,
          color_secondary: colors.color_secondary,
          color_accent: colors.color_accent
        }))
        setSaveSuccess('Colores detectados automáticamente')
        setTimeout(() => setSaveSuccess(null), 5000)
      } else {
        throw new Error('No se pudieron detectar colores del banner. Asegúrate de que la imagen sea accesible.')
      }
    } catch (err) {
      console.error('Error detectando colores:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error al detectar colores'
      setSaveError(errorMessage)
      setTimeout(() => setSaveError(null), 5000)
    } finally {
      setIsDetecting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div
          className="w-16 h-16 border-4 rounded-full animate-spin"
          style={{
            borderColor: 'rgba(var(--org-primary-button-color-rgb, 59, 130, 246), 0.3)',
            borderTopColor: 'var(--org-primary-button-color, #3b82f6)'
          }}
        ></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <XCircle className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--org-primary-button-color, #3b82f6)' }} />
        <p className="text-lg mb-4" style={{ color: 'var(--org-text-color, #ffffff)' }}>{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Sección: Logotipos */}
      <div
        className="rounded-lg p-6 border backdrop-blur-md"
        style={{
          backgroundColor: `rgba(var(--org-card-background-rgb, 15, 23, 42), var(--org-card-opacity, 1))`,
          borderColor: 'var(--org-border-color, #334155)'
        }}
      >
        <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--org-text-color, #ffffff)' }}>
          Logotipos
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Banner - Izquierda */}
          <div className="lg:col-span-9 space-y-4">
            {/* Preview del banner - Sin fondo */}
            {localBranding.banner_url && (
              <div className="flex justify-center">
                <img
                  src={localBranding.banner_url}
                  alt="Banner preview"
                  className="max-w-full max-h-64 object-contain rounded-lg border"
                  style={{ borderColor: 'var(--org-border-color, #334155)' }}
                />
              </div>
            )}
            
            {/* Área de upload - Siempre visible con drag & drop */}
            <div
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
                    formData.append('folder', 'Logo-Empresa')
                    
                    try {
                      const response = await fetch('/api/upload', {
                        method: 'POST',
                        body: formData
                      })
                      const result = await response.json()
                      if (result.success && result.url) {
                        // Actualizar banner_url - el useEffect detectará colores automáticamente
                        setLocalBranding(prev => ({ ...prev, banner_url: result.url }))
                      }
                    } catch (err) {
                      setSaveError('Error al subir la imagen')
                      setTimeout(() => setSaveError(null), 5000)
                    }
                  }
                }
                input.click()
              }}
              onDragOver={(e) => {
                e.preventDefault()
                e.stopPropagation()
                e.currentTarget.style.borderColor = 'var(--org-primary-button-color, #3b82f6)'
              }}
              onDragLeave={(e) => {
                e.preventDefault()
                e.currentTarget.style.borderColor = 'var(--org-border-color, #334155)'
              }}
              onDrop={async (e) => {
                e.preventDefault()
                e.stopPropagation()
                e.currentTarget.style.borderColor = 'var(--org-border-color, #334155)'
                const file = e.dataTransfer.files[0]
                if (file && file.type.startsWith('image/')) {
                  const formData = new FormData()
                  formData.append('file', file)
                  formData.append('bucket', 'Panel-Business')
                  formData.append('folder', 'Logo-Empresa')
                  
                  try {
                    const response = await fetch('/api/upload', {
                      method: 'POST',
                      body: formData
                    })
                    const result = await response.json()
                    if (result.success && result.url) {
                      // Actualizar banner_url - el useEffect detectará colores automáticamente
                      setLocalBranding(prev => ({ ...prev, banner_url: result.url }))
                    }
                  } catch (err) {
                    setSaveError('Error al subir la imagen')
                    setTimeout(() => setSaveError(null), 5000)
                  }
                }
              }}
              className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors"
              style={{
                borderColor: 'var(--org-border-color, #334155)',
                backgroundColor: 'rgba(var(--org-card-background-rgb, 30, 41, 59), 0.3)'
              }}
            >
              <div className="flex flex-col items-center gap-2">
                <CloudArrowUpIcon className="w-8 h-8" style={{ color: 'var(--org-text-color, #ffffff)' }} />
                <p className="text-sm" style={{ color: 'var(--org-text-color, #ffffff)' }}>
                  Arrastra y suelta tu logo aquí o haz clic para subir
                </p>
              </div>
            </div>
          </div>

          {/* Favicon - Derecha */}
          <div className="lg:col-span-3 space-y-3">
            {/* Preview del favicon - Sin fondo */}
            {localBranding.favicon_url && (
              <div className="flex justify-center">
                <img
                  src={localBranding.favicon_url}
                  alt="Favicon preview"
                  className="w-32 h-32 object-contain rounded-lg border"
                  style={{ borderColor: 'var(--org-border-color, #334155)' }}
                />
              </div>
            )}
            
            {/* Botón Editar - Siempre visible */}
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
                    formData.append('folder', 'Favicon')
                    
                    try {
                      const response = await fetch('/api/upload', {
                        method: 'POST',
                        body: formData
                      })
                      const result = await response.json()
                      if (result.success && result.url) {
                        setLocalBranding(prev => ({ ...prev, favicon_url: result.url }))
                      }
                    } catch (err) {
                      setSaveError('Error al subir la imagen')
                      setTimeout(() => setSaveError(null), 5000)
                    }
                  }
                }
                input.click()
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border transition-colors hover:opacity-80"
              style={{
                borderColor: 'var(--org-border-color, #334155)',
                backgroundColor: 'rgba(var(--org-card-background-rgb, 30, 41, 59), 0.5)',
                color: 'var(--org-text-color, #ffffff)'
              }}
            >
              <FileText className="w-4 h-4" />
              <span className="text-sm font-medium">Editar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sección: Colores */}
      <div
        className="rounded-lg p-6 border backdrop-blur-md"
        style={{
          backgroundColor: `rgba(var(--org-card-background-rgb, 15, 23, 42), var(--org-card-opacity, 1))`,
          borderColor: 'var(--org-border-color, #334155)'
        }}
      >
        <div className="space-y-5">
          <BrandingColorPicker
            label="Color Primario"
            value={localBranding.color_primary}
            onChange={(color) => setLocalBranding(prev => ({ ...prev, color_primary: color }))}
          />
          
          <BrandingColorPicker
            label="Color Secundario"
            value={localBranding.color_secondary}
            onChange={(color) => setLocalBranding(prev => ({ ...prev, color_secondary: color }))}
          />
        </div>

        {/* Vista previa de colores */}
        <div className="mt-6">
          <p className="text-sm font-medium mb-3" style={{ color: 'var(--org-text-color, #ffffff)' }}>
            Vista previa de colores
          </p>
          <div className="flex rounded-md overflow-hidden" style={{ border: '1px solid var(--org-border-color, #334155)' }}>
            <div
              className="flex-1 h-14"
              style={{ backgroundColor: localBranding.color_primary }}
              title={`Primario: ${localBranding.color_primary}`}
            />
            <div
              className="flex-1 h-14"
              style={{ backgroundColor: localBranding.color_secondary }}
              title={`Secundario: ${localBranding.color_secondary}`}
            />
            <div
              className="flex-1 h-14 bg-white"
              title="Blanco"
            />
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

      {/* Botón Guardar Cambios */}
      <div className="flex justify-end">
        <motion.button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="px-8 py-3 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
          style={{
            backgroundColor: localBranding.color_secondary || 'var(--org-primary-button-color, #3b82f6)'
          }}
          whileHover={!isSaving ? { scale: 1.02 } : {}}
          whileTap={!isSaving ? { scale: 0.98 } : {}}
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
        </motion.button>
      </div>
    </div>
  )
}

