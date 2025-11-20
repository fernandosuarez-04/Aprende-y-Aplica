'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, 
  Save, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  FileText, 
  ExternalLink,
  Upload,
  Check,
  Clock,
  Calendar,
  Globe,
  Github,
  Linkedin,
  Award,
  Target,
  TrendingUp,
  BookOpen,
  GraduationCap,
  PlayCircle,
  CreditCard,
  Crown,
  Zap
} from 'lucide-react'
import { useAuth } from '../../features/auth/hooks/useAuth'
import { useProfile, UserProfile, UpdateProfileRequest } from '../../features/profile/hooks/useProfile'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
  const router = useRouter()
  const { user } = useAuth()
  const { 
    profile, 
    stats,
    loading, 
    error, 
    saving, 
    updateProfile, 
    uploadProfilePicture, 
    uploadCurriculum 
  } = useProfile()
  const [formData, setFormData] = useState<UpdateProfileRequest>({})

  // Sincronizar formData con profile
  useEffect(() => {
    if (profile) {
      setFormData(profile)
    }
  }, [profile])

  const handleInputChange = (field: keyof UpdateProfileRequest, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = async () => {
    try {
      await updateProfile(formData)
    } catch (error) {
      // console.error('Error saving profile:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getCountryName = (code: string) => {
    const countries: Record<string, string> = {
      'MX': 'México',
      'US': 'Estados Unidos',
      'ES': 'España',
      'AR': 'Argentina',
      'CO': 'Colombia'
    }
    return countries[code] || code
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-carbon flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/70">Cargando perfil...</p>
        </motion.div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-carbon flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/70">Error al cargar el perfil</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-carbon">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/90 dark:bg-carbon-900 border-b border-gray-200 dark:border-carbon-700 backdrop-blur-sm shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <motion.button
                onClick={() => router.back()}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-text-secondary hover:text-primary transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-carbon-800"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver</span>
              </motion.button>
            </div>

            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-text-primary">Mi Perfil</h1>
              <p className="text-sm text-gray-500 dark:text-text-tertiary">Gestiona tu información personal</p>
            </div>

            <motion.button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center space-x-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-md"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{saving ? 'Guardando...' : 'Guardar'}</span>
            </motion.button>
          </div>
        </div>
      </motion.header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1"
          >
            <div className="bg-white dark:bg-carbon-800 rounded-2xl p-6 space-y-6 shadow-lg border border-gray-200 dark:border-carbon-700">
              {/* Avatar y info básica */}
              <div className="text-center">
                <motion.div
                  className="relative w-24 h-24 mx-auto mb-4"
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="w-full h-full bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center shadow-lg overflow-hidden ring-4 ring-white dark:ring-transparent">
                    {profile.profile_picture_url ? (
                      <img
                        src={profile.profile_picture_url}
                        alt="Profile"
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-12 h-12 text-white" />
                    )}
                  </div>
                  <input 
                    type="file" 
                    id="profile-picture-upload" 
                    className="hidden" 
                    accept="image/jpeg,image/jpg,image/png,image/gif"
                    onChange={async (e) => {
                      if (e.target.files && e.target.files[0]) {
                        try {
                          await uploadProfilePicture(e.target.files[0])
                          // Mostrar mensaje de éxito (opcional: puedes agregar un toast aquí)
                        } catch (error) {
                          const errorMessage = error instanceof Error ? error.message : 'Error al subir la imagen'
                          alert(errorMessage) // TODO: Reemplazar con sistema de notificaciones/toast
                          console.error('Error uploading profile picture:', error)
                        }
                      }
                    }}
                  />
                  <motion.label
                    htmlFor="profile-picture-upload"
                    className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary rounded-full flex items-center justify-center hover:bg-primary-dark transition-colors cursor-pointer"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    title="Cambiar foto de perfil"
                  >
                    <Upload className="w-4 h-4 text-white" />
                  </motion.label>
                </motion.div>
                
                <h3 className="text-lg font-semibold text-gray-900 dark:text-text-primary">
                  {profile.display_name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-text-tertiary">
                  {profile.type_rol}
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-xl border border-primary/20 dark:border-primary/30 hover:shadow-lg transition-all duration-300">
                  <div className="w-12 h-12 bg-primary/20 dark:bg-primary/30 rounded-xl flex items-center justify-center mb-2">
                    <Award className="w-6 h-6 text-primary" />
                  </div>
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 text-center">Puntos</span>
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {profile.points.toLocaleString()}
                  </span>
                </div>

                <div className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-green-500/10 to-green-500/5 dark:from-green-500/20 dark:to-green-500/10 rounded-xl border border-green-500/20 dark:border-green-500/30 hover:shadow-lg transition-all duration-300">
                  <div className="w-12 h-12 bg-green-500/20 dark:bg-green-500/30 rounded-xl flex items-center justify-center mb-2">
                    <Check className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 text-center">Cursos Completados</span>
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats?.completedCourses ?? 0}
                  </span>
                </div>

                <div className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-blue-500/10 to-blue-500/5 dark:from-blue-500/20 dark:to-blue-500/10 rounded-xl border border-blue-500/20 dark:border-blue-500/30 hover:shadow-lg transition-all duration-300">
                  <div className="w-12 h-12 bg-blue-500/20 dark:bg-blue-500/30 rounded-xl flex items-center justify-center mb-2">
                    <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 text-center">Lecciones Completadas</span>
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats?.completedLessons ?? 0}
                  </span>
                </div>

                <div className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-purple-500/10 to-purple-500/5 dark:from-purple-500/20 dark:to-purple-500/10 rounded-xl border border-purple-500/20 dark:border-purple-500/30 hover:shadow-lg transition-all duration-300">
                  <div className="w-12 h-12 bg-purple-500/20 dark:bg-purple-500/30 rounded-xl flex items-center justify-center mb-2">
                    <GraduationCap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 text-center">Certificados</span>
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats?.certificates ?? 0}
                  </span>
                </div>
              </div>

              {/* Cursos en progreso - Card adicional */}
              {stats && stats.coursesInProgress > 0 && (
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-500/10 to-orange-500/5 dark:from-orange-500/20 dark:to-orange-500/10 rounded-xl border border-orange-500/20 dark:border-orange-500/30">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-orange-500/20 dark:bg-orange-500/30 rounded-lg flex items-center justify-center">
                      <PlayCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white block">Cursos en Progreso</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Continuando tu aprendizaje</span>
                    </div>
                  </div>
                  <span className="text-xl font-bold text-orange-600 dark:text-orange-400">
                    {stats.coursesInProgress}
                  </span>
                </div>
              )}

              {/* Suscripciones */}
              {stats && stats.subscriptions && stats.subscriptions.length > 0 && (
                <div className="pt-4 border-t border-gray-200 dark:border-carbon-700">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 uppercase tracking-wide">
                    Suscripciones
                  </h3>
                  <div className="space-y-2">
                    {stats.subscriptions.map((subscription) => {
                      const getStatusColor = (status: string) => {
                        switch (status) {
                          case 'active':
                            return 'text-green-600 dark:text-green-400 bg-green-500/10 dark:bg-green-500/20 border-green-500/20 dark:border-green-500/30'
                          case 'paused':
                            return 'text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 dark:bg-yellow-500/20 border-yellow-500/20 dark:border-yellow-500/30'
                          case 'cancelled':
                            return 'text-red-600 dark:text-red-400 bg-red-500/10 dark:bg-red-500/20 border-red-500/20 dark:border-red-500/30'
                          case 'expired':
                            return 'text-gray-600 dark:text-gray-400 bg-gray-500/10 dark:bg-gray-500/20 border-gray-500/20 dark:border-gray-500/30'
                          default:
                            return 'text-gray-600 dark:text-gray-400 bg-gray-500/10 dark:bg-gray-500/20 border-gray-500/20 dark:border-gray-500/30'
                        }
                      }

                      const getStatusLabel = (status: string) => {
                        switch (status) {
                          case 'active':
                            return 'Activa'
                          case 'paused':
                            return 'Pausada'
                          case 'cancelled':
                            return 'Cancelada'
                          case 'expired':
                            return 'Expirada'
                          default:
                            return status
                        }
                      }

                      const getTypeLabel = (type: string) => {
                        switch (type) {
                          case 'monthly':
                            return 'Mensual'
                          case 'yearly':
                            return 'Anual'
                          case 'lifetime':
                            return 'Vitalicia'
                          case 'course_access':
                            return 'Acceso a Curso'
                          default:
                            return type
                        }
                      }

                      const formatPrice = (cents: number) => {
                        return `$${(cents / 100).toFixed(2)}`
                      }

                      const formatDate = (dateString: string | null) => {
                        if (!dateString) return 'N/A'
                        return new Date(dateString).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })
                      }

                      return (
                        <div
                          key={subscription.subscription_id}
                          className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-primary/20 dark:bg-primary/30 rounded-lg flex items-center justify-center">
                                {subscription.subscription_type === 'lifetime' ? (
                                  <Crown className="w-4 h-4 text-primary" />
                                ) : subscription.subscription_type === 'course_access' ? (
                                  <BookOpen className="w-4 h-4 text-primary" />
                                ) : (
                                  <CreditCard className="w-4 h-4 text-primary" />
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {getTypeLabel(subscription.subscription_type)}
                                </p>
                                {subscription.course_title && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {subscription.course_title}
                                  </p>
                                )}
                              </div>
                            </div>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(subscription.subscription_status)}`}>
                              {getStatusLabel(subscription.subscription_status)}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400">
                            <div>
                              <span className="font-medium">Precio:</span> {formatPrice(subscription.price_cents)}
                            </div>
                            {subscription.next_billing_date && subscription.subscription_status === 'active' && (
                              <div>
                                <span className="font-medium">Próximo pago:</span> {formatDate(subscription.next_billing_date)}
                              </div>
                            )}
                            {subscription.end_date && (
                              <div>
                                <span className="font-medium">Vence:</span> {formatDate(subscription.end_date)}
                              </div>
                            )}
                            <div>
                              <span className="font-medium">Inicio:</span> {formatDate(subscription.start_date)}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Info del sistema */}
              <div className="pt-4 border-t border-gray-200 dark:border-carbon-700">
                <div className="space-y-2 text-xs text-gray-500 dark:text-text-tertiary">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-3 h-3" />
                    <span>Miembro desde {formatDate(profile.created_at)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Globe className="w-3 h-3" />
                    <span>{getCountryName(profile.country_code)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="w-3 h-3 text-green-500" />
                    <span>Email verificado</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Contenido principal */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-3"
          >
            <div className="space-y-6">
              {/* Información Personal */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white dark:bg-carbon-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-carbon-700"
              >
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-text-primary">Información Personal</h2>
                    <p className="text-sm text-gray-500 dark:text-text-tertiary">Detalles personales y profesionales</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-text-secondary mb-2">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      value={formData.first_name || ''}
                      onChange={(e) => handleInputChange('first_name', e.target.value)}
                      className="w-full px-4 py-3 bg-white dark:bg-carbon-700 border border-gray-300 dark:border-carbon-600 rounded-lg text-gray-900 dark:text-text-primary placeholder-gray-400 dark:placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-colors"
                      placeholder="Nombre"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-text-secondary mb-2">
                      Apellido *
                    </label>
                    <input
                      type="text"
                      value={formData.last_name || ''}
                      onChange={(e) => handleInputChange('last_name', e.target.value)}
                      className="w-full px-4 py-3 bg-white dark:bg-carbon-700 border border-gray-300 dark:border-carbon-600 rounded-lg text-gray-900 dark:text-text-primary placeholder-gray-400 dark:placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-colors"
                      placeholder="Apellido"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-text-secondary mb-2">
                      Nombre de Usuario *
                    </label>
                    <input
                      type="text"
                      value={formData.username || ''}
                      onChange={(e) => handleInputChange('username', e.target.value)}
                      className="w-full px-4 py-3 bg-white dark:bg-carbon-700 border border-gray-300 dark:border-carbon-600 rounded-lg text-gray-900 dark:text-text-primary placeholder-gray-400 dark:placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-colors"
                      placeholder="usuario"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-text-secondary mb-2">
                      Rol en la Empresa
                    </label>
                    <input
                      type="text"
                      value={formData.type_rol || ''}
                      onChange={(e) => handleInputChange('type_rol', e.target.value)}
                      className="w-full px-4 py-3 bg-white dark:bg-carbon-700 border border-gray-300 dark:border-carbon-600 rounded-lg text-gray-900 dark:text-text-primary placeholder-gray-400 dark:placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-colors"
                      placeholder="Ej: CEO, CTO/CIO, Desarrollador UX/UI, Gerencia Media..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-text-secondary mb-2">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={formData.phone || ''}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full px-4 py-3 bg-white dark:bg-carbon-700 border border-gray-300 dark:border-carbon-600 rounded-lg text-gray-900 dark:text-text-primary placeholder-gray-400 dark:placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-colors"
                      placeholder="+52 55 1234 5678"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-text-secondary mb-2">
                      Ubicación
                    </label>
                    <input
                      type="text"
                      value={formData.location || ''}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      className="w-full px-4 py-3 bg-white dark:bg-carbon-700 border border-gray-300 dark:border-carbon-600 rounded-lg text-gray-900 dark:text-text-primary placeholder-gray-400 dark:placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-colors"
                      placeholder="Ciudad, País"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-600 dark:text-text-secondary mb-2">
                      Biografía
                    </label>
                    <textarea
                      value={formData.bio || ''}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 bg-white dark:bg-carbon-700 border border-gray-300 dark:border-carbon-600 rounded-lg text-gray-900 dark:text-text-primary placeholder-gray-400 dark:placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-colors resize-none"
                      placeholder="Cuéntanos sobre ti, tus intereses y objetivos de aprendizaje..."
                    />
                  </div>
                </div>
              </motion.div>

              {/* Seguridad */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white dark:bg-carbon-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-carbon-700"
              >
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <Mail className="w-4 h-4 text-green-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-text-primary">Seguridad</h2>
                    <p className="text-sm text-gray-500 dark:text-text-tertiary">Gestiona tu email y contraseña</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-text-secondary mb-2">
                      Correo Electrónico *
                    </label>
                    <input
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full px-4 py-3 bg-white dark:bg-carbon-700 border border-gray-300 dark:border-carbon-600 rounded-lg text-gray-900 dark:text-text-primary placeholder-gray-400 dark:placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-colors"
                      placeholder="tu@email.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-text-secondary mb-2">
                      Nueva Contraseña
                    </label>
                    <input
                      type="password"
                      className="w-full px-4 py-3 bg-white dark:bg-carbon-700 border border-gray-300 dark:border-carbon-600 rounded-lg text-gray-900 dark:text-text-primary placeholder-gray-400 dark:placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-colors"
                      placeholder="Mínimo 8 caracteres"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-text-secondary mb-2">
                      Contraseña Actual
                    </label>
                    <input
                      type="password"
                      className="w-full px-4 py-3 bg-white dark:bg-carbon-700 border border-gray-300 dark:border-carbon-600 rounded-lg text-gray-900 dark:text-text-primary placeholder-gray-400 dark:placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-colors"
                      placeholder="Ingresa tu contraseña actual"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-text-secondary mb-2">
                      Confirmar Nueva Contraseña
                    </label>
                    <input
                      type="password"
                      className="w-full px-4 py-3 bg-white dark:bg-carbon-700 border border-gray-300 dark:border-carbon-600 rounded-lg text-gray-900 dark:text-text-primary placeholder-gray-400 dark:placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-colors"
                      placeholder="Confirma tu nueva contraseña"
                    />
                  </div>
                </div>
              </motion.div>

              {/* Documentos y Links */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white dark:bg-carbon-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-carbon-700"
              >
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-blue-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-text-primary">Documentos y Links</h2>
                    <p className="text-sm text-gray-500 dark:text-text-tertiary">Gestiona tu curriculum y perfiles profesionales</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-text-secondary mb-2">
                      Curriculum Vitae
                    </label>
                    <div className="space-y-3">
                      <input 
                        type="file" 
                        id="curriculum-upload" 
                        className="hidden" 
                        accept=".pdf,.doc,.docx"
                        onChange={async (e) => {
                          if (e.target.files && e.target.files[0]) {
                            try {
                              await uploadCurriculum(e.target.files[0])
                              // Mostrar mensaje de éxito (opcional: puedes agregar un toast aquí)
                            } catch (error) {
                              const errorMessage = error instanceof Error ? error.message : 'Error al subir el curriculum'
                              alert(errorMessage) // TODO: Reemplazar con sistema de notificaciones/toast
                              console.error('Error uploading curriculum:', error)
                            }
                          }
                        }}
                      />
                      <label 
                        htmlFor="curriculum-upload" 
                        className="flex items-center space-x-2 px-4 py-3 bg-gray-100 dark:bg-carbon-700 border border-gray-300 dark:border-carbon-600 rounded-lg hover:bg-gray-200 dark:hover:bg-carbon-600 transition-colors cursor-pointer"
                      >
                        <Upload className="w-4 h-4 text-gray-600 dark:text-text-secondary" />
                        <span className="text-gray-700 dark:text-text-secondary">
                          {profile.curriculum_url ? 'Cambiar CV' : 'Subir CV'}
                        </span>
                      </label>
                      {profile.curriculum_url && (
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-green-500 flex items-center space-x-1">
                            <Check className="w-4 h-4" />
                            <span>Curriculum cargado</span>
                          </span>
                          <a 
                            href={profile.curriculum_url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-sm text-primary hover:text-primary-dark transition-colors flex items-center space-x-1"
                          >
                            <ExternalLink className="w-4 h-4" />
                            <span>Ver CV</span>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-text-secondary mb-2">
                      Portafolio/Sitio Web
                    </label>
                    <input
                      type="url"
                      value={formData.website_url || ''}
                      onChange={(e) => handleInputChange('website_url', e.target.value)}
                      className="w-full px-4 py-3 bg-white dark:bg-carbon-700 border border-gray-300 dark:border-carbon-600 rounded-lg text-gray-900 dark:text-text-primary placeholder-gray-400 dark:placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-colors"
                      placeholder="https://tu-portafolio.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-text-secondary mb-2">
                      LinkedIn
                    </label>
                    <div className="relative">
                      <Linkedin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-text-tertiary" />
                      <input
                        type="url"
                        value={formData.linkedin_url || ''}
                        onChange={(e) => handleInputChange('linkedin_url', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white dark:bg-carbon-700 border border-gray-300 dark:border-carbon-600 rounded-lg text-gray-900 dark:text-text-primary placeholder-gray-400 dark:placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-colors"
                        placeholder="https://linkedin.com/in/tu-perfil"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-text-secondary mb-2">
                      GitHub
                    </label>
                    <div className="relative">
                      <Github className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-text-tertiary" />
                      <input
                        type="url"
                        value={formData.github_url || ''}
                        onChange={(e) => handleInputChange('github_url', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white dark:bg-carbon-700 border border-gray-300 dark:border-carbon-600 rounded-lg text-gray-900 dark:text-text-primary placeholder-gray-400 dark:placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-colors"
                        placeholder="https://github.com/tu-usuario"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
