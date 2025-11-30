'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  Bell,
  Save,
  Mail,
  Smartphone,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Loader2,
  Info,
  Lock
} from 'lucide-react'
import { Button } from '@aprende-y-aplica/ui'
import { useSubscriptionFeatures } from '../hooks/useSubscriptionFeatures'

interface NotificationSetting {
  id?: string
  event_type: string
  enabled: boolean
  channels: string[]
  template?: string | null
}

interface EventType {
  value: string
  label: string
  description: string
}

export function BusinessNotificationsSettings() {
  const { 
    plan, 
    canUse, 
    getAllowedChannels, 
    getMessage, 
    loading: subscriptionLoading, 
    refetch 
  } = useSubscriptionFeatures()
  
  const [settings, setSettings] = useState<NotificationSetting[]>([])
  const [eventTypes, setEventTypes] = useState<EventType[]>([])
  const [availableChannels, setAvailableChannels] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const hasLoadedOnceRef = useRef(false)
  const previousPlanRef = useRef<string | null>(null)

  // Función para actualizar canales disponibles
  const updateAvailableChannels = useCallback(() => {
    // getAllowedChannels siempre está definido gracias al hook, pero validamos por seguridad
    if (typeof getAllowedChannels !== 'function') {
      return
    }
    const channels = getAllowedChannels()
    if (channels && channels.length > 0) {
      setAvailableChannels(channels)
      // Limpiar canales no permitidos de los settings cuando hay downgrade
      setSettings(prevSettings => {
        return prevSettings.map(setting => ({
          ...setting,
          channels: setting.channels.filter(channel => channels.includes(channel))
        }))
      })
    }
  }, [getAllowedChannels])

  // fetchSettings estabilizado con useCallback
  const fetchSettings = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/business/notifications/settings', {
        credentials: 'include',
        cache: 'no-store' // Forzar actualización de datos
      })

      const data = await response.json()

      if (data.success) {
        // Obtener canales permitidos según el plan actual
        // getAllowedChannels siempre está definido, pero validamos por seguridad
        const channelsFromHook = typeof getAllowedChannels === 'function' 
          ? getAllowedChannels() 
          : ['email']
        const validChannels = channelsFromHook && channelsFromHook.length > 0 ? channelsFromHook : ['email']
        setAvailableChannels(validChannels)

        // Filtrar configuraciones para remover canales no permitidos
        const filteredSettings = (data.settings || []).map((setting: NotificationSetting) => ({
          ...setting,
          channels: setting.channels.filter((channel: string) => validChannels.includes(channel))
        }))

        setSettings(filteredSettings)
        setEventTypes(data.event_types || [])
        hasLoadedOnceRef.current = true
        previousPlanRef.current = plan || null
      } else {
        setError(data.error || 'Error al cargar configuración')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar configuración')
    } finally {
      setIsLoading(false)
    }
  }, [getAllowedChannels, plan])

  // Efecto principal: cargar settings solo una vez cuando el plan esté disponible
  useEffect(() => {
    // Solo cargar settings cuando el plan esté disponible y no se haya cargado antes
    // Evitar reiniciar si subscriptionLoading cambia pero ya tenemos datos
    // getAllowedChannels siempre está definido, pero validamos por seguridad
    if (!subscriptionLoading && plan && !hasLoadedOnceRef.current && typeof getAllowedChannels === 'function') {
      fetchSettings()
    }
  }, [plan, subscriptionLoading, fetchSettings, getAllowedChannels])

  // Efecto para actualizar canales cuando el plan cambia realmente (después de la carga inicial)
  useEffect(() => {
    // Solo actualizar canales si ya se cargó una vez y el plan cambió
    if (hasLoadedOnceRef.current && plan && previousPlanRef.current !== plan) {
      previousPlanRef.current = plan
      updateAvailableChannels()
    }
  }, [plan, updateAvailableChannels])

  // Escuchar eventos de cambio de plan - solo actualizar canales, no recargar todo
  useEffect(() => {
    const handlePlanChange = () => {
      // Solo actualizar canales disponibles sin recargar todo el componente
      // No llamar refetch() aquí para evitar reinicios
      updateAvailableChannels()
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('subscription-plan-changed', handlePlanChange)
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('subscription-plan-changed', handlePlanChange)
      }
    }
  }, [updateAvailableChannels])

  const handleSave = async () => {
    try {
      setIsSaving(true)
      setError(null)
      setSaveSuccess(false)

      const response = await fetch('/api/business/notifications/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          settings: settings
        })
      })

      const data = await response.json()

      if (data.success) {
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
      } else {
        setError(data.error || 'Error al guardar configuración')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar configuración')
    } finally {
      setIsSaving(false)
    }
  }

  const updateSetting = (eventType: string, field: 'enabled' | 'channels', value: boolean | string[]) => {
    setSettings(prevSettings => {
      const existing = prevSettings.find(s => s.event_type === eventType)
      if (existing) {
        return prevSettings.map(s =>
          s.event_type === eventType
            ? { ...s, [field]: value }
            : s
        )
      } else {
        return [
          ...prevSettings,
          {
            event_type: eventType,
            enabled: field === 'enabled' ? (value as boolean) : true,
            channels: field === 'channels' ? (value as string[]) : ['email'],
            template: null
          }
        ]
      }
    })
  }

  const toggleChannel = (eventType: string, channel: string) => {
    const setting = settings.find(s => s.event_type === eventType)
    const currentChannels = setting?.channels || ['email']
    
    if (currentChannels.includes(channel)) {
      // No permitir quitar email si es el único canal
      if (channel === 'email' && currentChannels.length === 1) {
        return
      }
      updateSetting(eventType, 'channels', currentChannels.filter(c => c !== channel))
    } else {
      updateSetting(eventType, 'channels', [...currentChannels, channel])
    }
  }

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email':
        return Mail
      case 'push':
        return Smartphone
      case 'sms':
        return MessageSquare
      default:
        return Bell
    }
  }

  const getChannelLabel = (channel: string) => {
    switch (channel) {
      case 'email':
        return 'Email'
      case 'push':
        return 'Push Notification'
      case 'sms':
        return 'SMS'
      default:
        return channel
    }
  }

  // Mostrar loading si el hook aún no está listo o si estamos cargando datos
  // getAllowedChannels siempre está definido, pero validamos por seguridad durante la carga inicial
  if (subscriptionLoading || isLoading || typeof getAllowedChannels !== 'function') {
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
            <Bell className="w-6 h-6 text-primary" />
            Notificaciones Automáticas
          </h2>
          <p className="text-carbon-400 mt-1">
            Configura cuándo y cómo recibir notificaciones sobre eventos importantes
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
                Guardar Cambios
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Info sobre canales disponibles según plan */}
      <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-primary font-medium mb-1">Canales Disponibles</p>
          <div className="text-carbon-300 text-sm">
            {availableChannels.includes('email') && (
              <span className="inline-flex items-center gap-1 mr-4">
                <Mail className="w-4 h-4" />
                Email (todos los planes)
              </span>
            )}
            {availableChannels.includes('push') && (
              <span className="inline-flex items-center gap-1 mr-4">
                <Smartphone className="w-4 h-4" />
                Push (Business y Enterprise)
              </span>
            )}
            {availableChannels.includes('sms') && (
              <span className="inline-flex items-center gap-1">
                <MessageSquare className="w-4 h-4" />
                SMS (Enterprise)
              </span>
            )}
          </div>
          {typeof canUse === 'function' && typeof getMessage === 'function' && !canUse('notification_sms') && (
            <div className="mt-2 pt-2 border-t border-primary/20">
              <p className="text-yellow-400 text-xs">
                {getMessage('notification_sms')}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Lista de Eventos */}
      <div className="space-y-4">
        {eventTypes.map((eventType) => {
          const setting = settings.find(s => s.event_type === eventType.value)
          const isEnabled = setting?.enabled !== false
          const channels = setting?.channels || ['email']

          return (
            <motion.div
              key={eventType.value}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-carbon-900 rounded-lg p-6 border border-carbon-700"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <input
                      type="checkbox"
                      id={`event-${eventType.value}`}
                      checked={isEnabled}
                      onChange={(e) => updateSetting(eventType.value, 'enabled', e.target.checked)}
                      className="w-5 h-5 rounded border-carbon-600 bg-carbon-800 text-primary focus:ring-primary focus:ring-2"
                    />
                    <label
                      htmlFor={`event-${eventType.value}`}
                      className="text-lg font-semibold text-white cursor-pointer"
                    >
                      {eventType.label}
                    </label>
                  </div>
                  <p className="text-carbon-400 text-sm mb-4 ml-8">
                    {eventType.description}
                  </p>
                </div>
              </div>

              {isEnabled && (
                <div className="ml-8 space-y-3">
                  <p className="text-carbon-300 text-sm font-medium">Canales de notificación:</p>
                  <div className="flex flex-wrap gap-3">
                    {availableChannels.map((channel) => {
                      const Icon = getChannelIcon(channel)
                      const isSelected = channels.includes(channel)
                      const isSMS = channel === 'sms'
                      const canUseSMS = typeof canUse === 'function' ? canUse('notification_sms') : false
                      const isDisabled = (channel === 'email' && channels.length === 1) || (isSMS && !canUseSMS)

                      return (
                        <button
                          key={channel}
                          onClick={() => {
                            if (!isDisabled) {
                              toggleChannel(eventType.value, channel)
                            }
                          }}
                          disabled={isDisabled}
                          title={isSMS && !canUseSMS && typeof getMessage === 'function' ? getMessage('notification_sms') : undefined}
                          className={`px-4 py-2 rounded-lg border transition-colors flex items-center gap-2 relative ${
                            isSelected
                              ? 'bg-primary/20 border-primary text-primary'
                              : 'bg-carbon-800 border-carbon-700 text-carbon-400 hover:border-carbon-600'
                          } ${
                            isDisabled
                              ? 'opacity-50 cursor-not-allowed'
                              : 'cursor-pointer'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="text-sm font-medium">{getChannelLabel(channel)}</span>
                          {isSMS && !canUseSMS && (
                            <Lock className="w-3 h-3 text-yellow-400 ml-1" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                  {channels.length === 1 && channels.includes('email') && (
                    <p className="text-carbon-500 text-xs mt-2">
                      El email debe estar siempre activo
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

