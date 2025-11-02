'use client'

import { useState, useEffect } from 'react'
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
  Award
} from 'lucide-react'
import { useBusinessSettings, OrganizationData } from '../hooks/useBusinessSettings'
import { BusinessNotificationsSettings } from './BusinessNotificationsSettings'
import { BusinessCertificateCustomizer } from './BusinessCertificateCustomizer'
import { Button } from '@aprende-y-aplica/ui'
import Image from 'next/image'

export function BusinessSettings() {
  const { data, isLoading, error, refetch, updateOrganization } = useBusinessSettings()
  const [activeTab, setActiveTab] = useState<'organization' | 'subscription' | 'branding' | 'notifications' | 'certificates' | 'advanced'>('organization')
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
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
          className="px-4 py-2 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors"
        >
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      {/* Tabs */}
      <div className="bg-carbon-800 rounded-xl border border-carbon-700 overflow-hidden">
        <div className="flex border-b border-carbon-700 overflow-x-auto">
          <button
            onClick={() => setActiveTab('organization')}
            className={`px-6 py-4 font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'organization'
                ? 'text-primary border-b-2 border-primary bg-carbon-900'
                : 'text-carbon-400 hover:text-carbon-300 hover:bg-carbon-900/50'
            }`}
          >
            <Building2 className="w-5 h-5" />
            Datos de la Empresa
          </button>
          <button
            onClick={() => setActiveTab('subscription')}
            className={`px-6 py-4 font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'subscription'
                ? 'text-primary border-b-2 border-primary bg-carbon-900'
                : 'text-carbon-400 hover:text-carbon-300 hover:bg-carbon-900/50'
            }`}
          >
            <CreditCard className="w-5 h-5" />
            Suscripción
          </button>
          <button
            onClick={() => setActiveTab('branding')}
            className={`px-6 py-4 font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'branding'
                ? 'text-primary border-b-2 border-primary bg-carbon-900'
                : 'text-carbon-400 hover:text-carbon-300 hover:bg-carbon-900/50'
            }`}
          >
            <Palette className="w-5 h-5" />
            Branding
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-6 py-4 font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'notifications'
                ? 'text-primary border-b-2 border-primary bg-carbon-900'
                : 'text-carbon-400 hover:text-carbon-300 hover:bg-carbon-900/50'
            }`}
          >
            <Bell className="w-5 h-5" />
            Notificaciones
          </button>
          <button
            onClick={() => setActiveTab('certificates')}
            className={`px-6 py-4 font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'certificates'
                ? 'text-primary border-b-2 border-primary bg-carbon-900'
                : 'text-carbon-400 hover:text-carbon-300 hover:bg-carbon-900/50'
            }`}
          >
            <Award className="w-5 h-5" />
            Certificados
          </button>
          <button
            onClick={() => setActiveTab('advanced')}
            className={`px-6 py-4 font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'advanced'
                ? 'text-primary border-b-2 border-primary bg-carbon-900'
                : 'text-carbon-400 hover:text-carbon-300 hover:bg-carbon-900/50'
            }`}
          >
            <SettingsIcon className="w-5 h-5" />
            Configuración Avanzada
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
          {activeTab === 'branding' && (
            <BrandingTab />
          )}
          {activeTab === 'notifications' && (
            <BusinessNotificationsSettings />
          )}
          {activeTab === 'certificates' && (
            <BusinessCertificateCustomizer />
          )}
          {activeTab === 'advanced' && (
            <AdvancedTab organization={data.organization} />
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
  const [logoPreview, setLogoPreview] = useState<string | null>(organization?.logo_url || null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))

    if (name === 'logo_url') {
      setLogoPreview(value || null)
    }

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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Logo */}
      <div className="bg-carbon-900 rounded-lg p-6 border border-carbon-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <ImageIcon className="w-5 h-5" />
          Logo de la Empresa
        </h3>
        <div className="flex items-start gap-6">
          <div className="flex-shrink-0">
            {logoPreview ? (
              <div className="relative w-32 h-32 rounded-xl overflow-hidden border-2 border-primary/30 bg-carbon-800">
                <Image
                  src={logoPreview}
                  alt="Logo preview"
                  fill
                  className="object-cover"
                  sizes="128px"
                  onError={() => setLogoPreview(null)}
                />
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, logo_url: '' }))
                    setLogoPreview(null)
                  }}
                  className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="w-32 h-32 rounded-xl border-2 border-dashed border-carbon-600 bg-carbon-800 flex items-center justify-center">
                <ImageIcon className="w-12 h-12 text-carbon-400" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <label htmlFor="logo_url" className="block text-sm font-medium text-carbon-300 mb-2">
              URL del Logo
            </label>
            <input
              type="url"
              id="logo_url"
              name="logo_url"
              value={formData.logo_url}
              onChange={handleChange}
              placeholder="https://ejemplo.com/logo.png"
              className="w-full px-4 py-2 bg-carbon-800 border border-carbon-700 rounded-lg text-white placeholder-carbon-500 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="mt-2 text-sm text-carbon-400">
              Ingresa la URL de la imagen del logo de tu empresa
            </p>
          </div>
        </div>
      </div>

      {/* Información Básica */}
      <div className="bg-carbon-900 rounded-lg p-6 border border-carbon-700 space-y-4">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Información Básica
        </h3>

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-carbon-300 mb-2">
            Nombre de la Empresa *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 bg-carbon-800 border border-carbon-700 rounded-lg text-white placeholder-carbon-500 focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Nombre de tu empresa"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-carbon-300 mb-2">
            Descripción
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className="w-full px-4 py-2 bg-carbon-800 border border-carbon-700 rounded-lg text-white placeholder-carbon-500 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            placeholder="Describe tu empresa..."
          />
        </div>
      </div>

      {/* Información de Contacto */}
      <div className="bg-carbon-900 rounded-lg p-6 border border-carbon-700 space-y-4">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Información de Contacto
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="contact_email" className="block text-sm font-medium text-carbon-300 mb-2 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email de Contacto
            </label>
            <input
              type="email"
              id="contact_email"
              name="contact_email"
              value={formData.contact_email}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-carbon-800 border border-carbon-700 rounded-lg text-white placeholder-carbon-500 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="contacto@empresa.com"
            />
          </div>

          <div>
            <label htmlFor="contact_phone" className="block text-sm font-medium text-carbon-300 mb-2 flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Teléfono de Contacto
            </label>
            <input
              type="tel"
              id="contact_phone"
              name="contact_phone"
              value={formData.contact_phone}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-carbon-800 border border-carbon-700 rounded-lg text-white placeholder-carbon-500 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="+1 234 567 8900"
            />
          </div>
        </div>

        <div>
          <label htmlFor="website_url" className="block text-sm font-medium text-carbon-300 mb-2 flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Sitio Web
          </label>
          <input
            type="url"
            id="website_url"
            name="website_url"
            value={formData.website_url}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-carbon-800 border border-carbon-700 rounded-lg text-white placeholder-carbon-500 focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="https://www.empresa.com"
          />
        </div>
      </div>

      {/* Configuración de Usuarios */}
      <div className="bg-carbon-900 rounded-lg p-6 border border-carbon-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Límite de Usuarios
        </h3>
        <div>
          <label htmlFor="max_users" className="block text-sm font-medium text-carbon-300 mb-2">
            Número Máximo de Usuarios
          </label>
          <input
            type="number"
            id="max_users"
            name="max_users"
            value={formData.max_users}
            onChange={handleChange}
            min="1"
            className="w-full px-4 py-2 bg-carbon-800 border border-carbon-700 rounded-lg text-white placeholder-carbon-500 focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="10"
          />
          <p className="mt-2 text-sm text-carbon-400">
            El número máximo de usuarios que puede tener tu organización
          </p>
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
          type="submit"
          disabled={isSaving}
          className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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

// Tab: Suscripción
function SubscriptionTab({ subscription }: { subscription: any }) {
  const router = useRouter()
  const [isCancelling, setIsCancelling] = useState(false)

  if (!subscription) {
    return (
      <div className="text-center py-12">
        <Info className="w-16 h-16 text-carbon-400 mx-auto mb-4" />
        <p className="text-carbon-400">No hay información de suscripción disponible</p>
      </div>
    )
  }

  const handleChangePlan = () => {
    // Redirigir a la página de planes de suscripción
    router.push('/business-panel/subscription/plans')
  }

  const handleCancelSubscription = async () => {
    if (!confirm('¿Estás seguro de que deseas cancelar tu suscripción? Esto afectará el acceso a los servicios.')) {
      return
    }

    setIsCancelling(true)
    try {
      // Aquí iría la lógica para cancelar la suscripción
      // Por ahora mostramos un alert
      alert('Funcionalidad de cancelación en desarrollo. Próximamente estarás disponible para cancelar tu suscripción.')
    } catch (error) {
      console.error('Error cancelling subscription:', error)
      alert('Error al cancelar la suscripción. Por favor, intenta más tarde.')
    } finally {
      setIsCancelling(false)
    }
  }

  const planLabels: Record<string, string> = {
    team: 'Team',
    business: 'Business',
    enterprise: 'Enterprise'
  }

  const statusLabels: Record<string, string> = {
    active: 'Activa',
    expired: 'Expirada',
    cancelled: 'Cancelada',
    trial: 'En Prueba',
    pending: 'Pendiente'
  }

  const statusColors: Record<string, string> = {
    active: 'text-green-400 bg-green-400/20 border-green-400/50',
    expired: 'text-red-400 bg-red-400/20 border-red-400/50',
    cancelled: 'text-red-400 bg-red-400/20 border-red-400/50',
    trial: 'text-yellow-400 bg-yellow-400/20 border-yellow-400/50',
    pending: 'text-blue-400 bg-blue-400/20 border-blue-400/50'
  }

  const formatDate = (date: string | null | undefined) => {
    if (!date) return 'No disponible'
    try {
      const dateObj = new Date(date)
      if (isNaN(dateObj.getTime())) return 'No disponible'
      return dateObj.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch (error) {
      console.error('Error formatting date:', error)
      return 'No disponible'
    }
  }

  return (
    <div className="space-y-6">
      {/* Plan Actual */}
      <div className="bg-carbon-900 rounded-lg p-6 border border-carbon-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Plan Actual
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-carbon-300">Plan:</span>
            <span className="text-white font-semibold text-lg">
              {planLabels[subscription.plan] || subscription.plan}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-carbon-300">Estado:</span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${statusColors[subscription.status] || statusColors.active}`}>
              {statusLabels[subscription.status] || subscription.status}
            </span>
          </div>
        </div>
      </div>

      {/* Fechas de Suscripción */}
      <div className="bg-carbon-900 rounded-lg p-6 border border-carbon-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Fechas de Suscripción
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-carbon-300">Fecha de Inicio:</span>
            <span className="text-white">{formatDate(subscription.start_date)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-carbon-300">Fecha de Fin:</span>
            <span className="text-white">{formatDate(subscription.end_date)}</span>
          </div>
          {subscription.days_until_expiration !== null && (
            <div className="flex items-center justify-between">
              <span className="text-carbon-300">Días hasta expiración:</span>
              <span className={`font-semibold ${subscription.is_expiring_soon ? 'text-yellow-400' : subscription.is_expired ? 'text-red-400' : 'text-green-400'}`}>
                {subscription.is_expired ? 'Expirada' : subscription.days_until_expiration + ' días'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Alertas */}
      {subscription.is_expiring_soon && !subscription.is_expired && (
        <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-yellow-400 font-medium mb-1">Suscripción por Vencer</p>
            <p className="text-yellow-300 text-sm">
              Tu suscripción expirará en {subscription.days_until_expiration} días. Considera renovar tu plan para mantener el acceso completo.
            </p>
          </div>
        </div>
      )}

      {subscription.is_expired && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-400 font-medium mb-1">Suscripción Expirada</p>
            <p className="text-red-300 text-sm">
              Tu suscripción ha expirado. Por favor, renueva tu plan para continuar usando todos los servicios.
            </p>
          </div>
        </div>
      )}

      {/* Botones de Acción */}
      <div className="bg-carbon-900 rounded-lg p-6 border border-carbon-700">
        <h3 className="text-lg font-semibold text-white mb-4">Acciones</h3>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={handleChangePlan}
            disabled={isCancelling}
            className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <CreditCard className="w-5 h-5" />
            Cambiar de Plan
          </button>
          <button
            onClick={handleCancelSubscription}
            disabled={isCancelling || subscription.status === 'cancelled'}
            className="px-6 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isCancelling ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Cancelando...
              </>
            ) : (
              <>
                <XCircle className="w-5 h-5" />
                Cancelar Suscripción
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// Tab: Branding
function BrandingTab() {
  const [branding, setBranding] = useState({
    logo_url: '',
    favicon_url: '',
    color_primary: '#3b82f6',
    color_secondary: '#10b981',
    color_accent: '#8b5cf6',
    font_family: 'Inter'
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null)

  useEffect(() => {
    fetchBranding()
  }, [])

  const fetchBranding = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/business/settings/branding', {
        credentials: 'include'
      })
      const data = await response.json()

      if (data.success && data.branding) {
        setBranding(data.branding)
        setLogoPreview(data.branding.logo_url)
        setFaviconPreview(data.branding.favicon_url)
      }
    } catch (error) {
      console.error('Error fetching branding:', error)
      setSaveError('Error al cargar configuración de branding')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setBranding(prev => ({ ...prev, [name]: value }))

    if (name === 'logo_url') {
      setLogoPreview(value || null)
    }
    if (name === 'favicon_url') {
      setFaviconPreview(value || null)
    }

    if (saveSuccess) setSaveSuccess(null)
    if (saveError) setSaveError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setSaveError(null)
    setSaveSuccess(null)

    try {
      const response = await fetch('/api/business/settings/branding', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(branding)
      })

      const data = await response.json()

      if (data.success) {
        setSaveSuccess('Configuración de branding actualizada correctamente')
        setTimeout(() => setSaveSuccess(null), 5000)
      } else {
        setSaveError(data.error || 'Error al actualizar branding')
        setTimeout(() => setSaveError(null), 5000)
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Error al actualizar branding')
      setTimeout(() => setSaveError(null), 5000)
    } finally {
      setIsSaving(false)
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Success/Error Messages */}
      {saveSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 flex items-center gap-3"
        >
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>{saveSuccess}</span>
        </motion.div>
      )}
      {saveError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 flex items-center gap-3"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{saveError}</span>
        </motion.div>
      )}

      {/* Logo y Favicon */}
      <div className="bg-carbon-900 rounded-lg p-6 border border-carbon-700 space-y-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <ImageIcon className="w-5 h-5" />
          Logo y Favicon
        </h3>

        {/* Logo */}
        <div className="flex items-start gap-6">
          <div className="flex-shrink-0">
            {logoPreview ? (
              <div className="relative w-32 h-32 rounded-xl overflow-hidden border-2 border-primary/30 bg-carbon-800">
                <Image
                  src={logoPreview}
                  alt="Logo preview"
                  fill
                  className="object-cover"
                  sizes="128px"
                  onError={() => setLogoPreview(null)}
                />
                <button
                  type="button"
                  onClick={() => {
                    setBranding(prev => ({ ...prev, logo_url: '' }))
                    setLogoPreview(null)
                  }}
                  className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="w-32 h-32 rounded-xl border-2 border-dashed border-carbon-600 bg-carbon-800 flex items-center justify-center">
                <ImageIcon className="w-12 h-12 text-carbon-400" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <label htmlFor="logo_url" className="block text-sm font-medium text-carbon-300 mb-2">
              URL del Logo
            </label>
            <input
              type="url"
              id="logo_url"
              name="logo_url"
              value={branding.logo_url}
              onChange={handleChange}
              placeholder="https://ejemplo.com/logo.png"
              className="w-full px-4 py-2 bg-carbon-800 border border-carbon-700 rounded-lg text-white placeholder-carbon-500 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Favicon */}
        <div className="flex items-start gap-6">
          <div className="flex-shrink-0">
            {faviconPreview ? (
              <div className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-primary/30 bg-carbon-800">
                <Image
                  src={faviconPreview}
                  alt="Favicon preview"
                  fill
                  className="object-cover"
                  sizes="64px"
                  onError={() => setFaviconPreview(null)}
                />
                <button
                  type="button"
                  onClick={() => {
                    setBranding(prev => ({ ...prev, favicon_url: '' }))
                    setFaviconPreview(null)
                  }}
                  className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="w-16 h-16 rounded-xl border-2 border-dashed border-carbon-600 bg-carbon-800 flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-carbon-400" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <label htmlFor="favicon_url" className="block text-sm font-medium text-carbon-300 mb-2">
              URL del Favicon
            </label>
            <input
              type="url"
              id="favicon_url"
              name="favicon_url"
              value={branding.favicon_url}
              onChange={handleChange}
              placeholder="https://ejemplo.com/favicon.ico"
              className="w-full px-4 py-2 bg-carbon-800 border border-carbon-700 rounded-lg text-white placeholder-carbon-500 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* Colores */}
      <div className="bg-carbon-900 rounded-lg p-6 border border-carbon-700 space-y-4">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Palette className="w-5 h-5" />
          Colores de la Marca
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="color_primary" className="block text-sm font-medium text-carbon-300 mb-2">
              Color Principal
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                id="color_primary"
                name="color_primary"
                value={branding.color_primary}
                onChange={handleChange}
                className="w-16 h-10 rounded-lg border border-carbon-700 cursor-pointer"
              />
              <input
                type="text"
                value={branding.color_primary}
                onChange={handleChange}
                name="color_primary"
                placeholder="#3b82f6"
                className="flex-1 px-4 py-2 bg-carbon-800 border border-carbon-700 rounded-lg text-white placeholder-carbon-500 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label htmlFor="color_secondary" className="block text-sm font-medium text-carbon-300 mb-2">
              Color Secundario
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                id="color_secondary"
                name="color_secondary"
                value={branding.color_secondary}
                onChange={handleChange}
                className="w-16 h-10 rounded-lg border border-carbon-700 cursor-pointer"
              />
              <input
                type="text"
                value={branding.color_secondary}
                onChange={handleChange}
                name="color_secondary"
                placeholder="#10b981"
                className="flex-1 px-4 py-2 bg-carbon-800 border border-carbon-700 rounded-lg text-white placeholder-carbon-500 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label htmlFor="color_accent" className="block text-sm font-medium text-carbon-300 mb-2">
              Color de Acento
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                id="color_accent"
                name="color_accent"
                value={branding.color_accent}
                onChange={handleChange}
                className="w-16 h-10 rounded-lg border border-carbon-700 cursor-pointer"
              />
              <input
                type="text"
                value={branding.color_accent}
                onChange={handleChange}
                name="color_accent"
                placeholder="#8b5cf6"
                className="flex-1 px-4 py-2 bg-carbon-800 border border-carbon-700 rounded-lg text-white placeholder-carbon-500 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Fuente */}
      <div className="bg-carbon-900 rounded-lg p-6 border border-carbon-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Type className="w-5 h-5" />
          Tipografía
        </h3>
        <div>
          <label htmlFor="font_family" className="block text-sm font-medium text-carbon-300 mb-2">
            Familia de Fuentes
          </label>
          <select
            id="font_family"
            name="font_family"
            value={branding.font_family}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-carbon-800 border border-carbon-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="Inter">Inter</option>
            <option value="Montserrat">Montserrat</option>
            <option value="Roboto">Roboto</option>
            <option value="Open Sans">Open Sans</option>
            <option value="Lato">Lato</option>
            <option value="Poppins">Poppins</option>
            <option value="Raleway">Raleway</option>
            <option value="Source Sans Pro">Source Sans Pro</option>
            <option value="Arial">Arial</option>
            <option value="Helvetica">Helvetica</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Georgia">Georgia</option>
          </select>
          <p className="mt-2 text-sm text-carbon-400">
            La fuente se aplicará en toda la plataforma del panel de administración
          </p>
        </div>
      </div>

      {/* Botón Guardar */}
      <div className="flex items-center justify-end gap-4 pt-4 border-t border-carbon-700">
        <Button
          type="submit"
          variant="gradient"
          disabled={isSaving}
          className="min-w-[160px]"
        >
          {isSaving ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Guardando...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              Guardar Cambios
            </span>
          )}
        </Button>
      </div>
    </form>
  )
}

// Tab: Configuración Avanzada
function AdvancedTab({ organization }: { organization: OrganizationData | null }) {
  return (
    <div className="space-y-6">
      <div className="bg-carbon-900 rounded-lg p-6 border border-carbon-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <SettingsIcon className="w-5 h-5" />
          Configuración Avanzada
        </h3>
        <p className="text-carbon-400">
          Próximamente: Más opciones de configuración estarán disponibles aquí.
        </p>
      </div>
    </div>
  )
}

