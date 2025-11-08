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
  TrendingUp
} from 'lucide-react'
import { useAuth } from '../../features/auth/hooks/useAuth'
import { useProfile, UserProfile, UpdateProfileRequest } from '../../features/profile/hooks/useProfile'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
  const router = useRouter()
  const { user } = useAuth()
  const { 
    profile, 
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
    <div className="min-h-screen bg-carbon">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-carbon-900 border-b border-carbon-700"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <motion.button
                onClick={() => router.back()}
                className="flex items-center space-x-2 px-4 py-2 text-text-secondary hover:text-primary transition-colors rounded-lg hover:bg-carbon-800"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver</span>
              </motion.button>
            </div>

            <div className="text-center">
              <h1 className="text-2xl font-bold text-text-primary">Mi Perfil</h1>
              <p className="text-sm text-text-tertiary">Gestiona tu información personal</p>
            </div>

            <motion.button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center space-x-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
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
            <div className="bg-carbon-800 rounded-xl p-6 space-y-6">
              {/* Avatar y info básica */}
              <div className="text-center">
                <motion.div
                  className="relative w-24 h-24 mx-auto mb-4"
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="w-full h-full bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center shadow-lg overflow-hidden">
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
                    accept="image/jpeg,image/png,image/webp"
                    onChange={async (e) => {
                      if (e.target.files && e.target.files[0]) {
                        try {
                          await uploadProfilePicture(e.target.files[0])
                        } catch (error) {
                          // console.error('Error uploading profile picture:', error)
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
                
                <h3 className="text-lg font-semibold text-text-primary">
                  {profile.display_name}
                </h3>
                <p className="text-sm text-text-tertiary">
                  {profile.type_rol}
                </p>
              </div>

              {/* Stats */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-carbon-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                      <Award className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-sm text-text-secondary">Puntos</span>
                  </div>
                  <span className="text-lg font-semibold text-text-primary">
                    {profile.points.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-carbon-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <Check className="w-4 h-4 text-green-500" />
                    </div>
                    <span className="text-sm text-text-secondary">Completados</span>
                  </div>
                  <span className="text-lg font-semibold text-text-primary">8</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-carbon-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-blue-500" />
                    </div>
                    <span className="text-sm text-text-secondary">Progreso</span>
                  </div>
                  <span className="text-lg font-semibold text-text-primary">75%</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-carbon-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center">
                      <Clock className="w-4 h-4 text-orange-500" />
                    </div>
                    <span className="text-sm text-text-secondary">Tiempo</span>
                  </div>
                  <span className="text-lg font-semibold text-text-primary">24h</span>
                </div>
              </div>

              {/* Info del sistema */}
              <div className="pt-4 border-t border-carbon-700">
                <div className="space-y-2 text-xs text-text-tertiary">
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
                className="bg-carbon-800 rounded-xl p-6"
              >
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-text-primary">Información Personal</h2>
                    <p className="text-sm text-text-tertiary">Detalles personales y profesionales</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      value={formData.first_name || ''}
                      onChange={(e) => handleInputChange('first_name', e.target.value)}
                      className="w-full px-4 py-3 bg-carbon-700 border border-carbon-600 rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-colors"
                      placeholder="Nombre"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Apellido *
                    </label>
                    <input
                      type="text"
                      value={formData.last_name || ''}
                      onChange={(e) => handleInputChange('last_name', e.target.value)}
                      className="w-full px-4 py-3 bg-carbon-700 border border-carbon-600 rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-colors"
                      placeholder="Apellido"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Nombre de Usuario *
                    </label>
                    <input
                      type="text"
                      value={formData.username || ''}
                      onChange={(e) => handleInputChange('username', e.target.value)}
                      className="w-full px-4 py-3 bg-carbon-700 border border-carbon-600 rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-colors"
                      placeholder="usuario"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Rol en la Empresa
                    </label>
                    <input
                      type="text"
                      value={formData.type_rol || ''}
                      onChange={(e) => handleInputChange('type_rol', e.target.value)}
                      className="w-full px-4 py-3 bg-carbon-700 border border-carbon-600 rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-colors"
                      placeholder="Ej: CEO, CTO/CIO, Desarrollador UX/UI, Gerencia Media..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={formData.phone || ''}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full px-4 py-3 bg-carbon-700 border border-carbon-600 rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-colors"
                      placeholder="+52 55 1234 5678"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Ubicación
                    </label>
                    <input
                      type="text"
                      value={formData.location || ''}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      className="w-full px-4 py-3 bg-carbon-700 border border-carbon-600 rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-colors"
                      placeholder="Ciudad, País"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Biografía
                    </label>
                    <textarea
                      value={formData.bio || ''}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 bg-carbon-700 border border-carbon-600 rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-colors resize-none"
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
                className="bg-carbon-800 rounded-xl p-6"
              >
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <Mail className="w-4 h-4 text-green-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-text-primary">Seguridad</h2>
                    <p className="text-sm text-text-tertiary">Gestiona tu email y contraseña</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Correo Electrónico *
                    </label>
                    <input
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full px-4 py-3 bg-carbon-700 border border-carbon-600 rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-colors"
                      placeholder="tu@email.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Nueva Contraseña
                    </label>
                    <input
                      type="password"
                      className="w-full px-4 py-3 bg-carbon-700 border border-carbon-600 rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-colors"
                      placeholder="Mínimo 8 caracteres"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Contraseña Actual
                    </label>
                    <input
                      type="password"
                      className="w-full px-4 py-3 bg-carbon-700 border border-carbon-600 rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-colors"
                      placeholder="Ingresa tu contraseña actual"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Confirmar Nueva Contraseña
                    </label>
                    <input
                      type="password"
                      className="w-full px-4 py-3 bg-carbon-700 border border-carbon-600 rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-colors"
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
                className="bg-carbon-800 rounded-xl p-6"
              >
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-blue-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-text-primary">Documentos y Links</h2>
                    <p className="text-sm text-text-tertiary">Gestiona tu curriculum y perfiles profesionales</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
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
                            } catch (error) {
                              // console.error('Error uploading curriculum:', error)
                            }
                          }
                        }}
                      />
                      <label 
                        htmlFor="curriculum-upload" 
                        className="flex items-center space-x-2 px-4 py-3 bg-carbon-700 border border-carbon-600 rounded-lg hover:bg-carbon-600 transition-colors cursor-pointer"
                      >
                        <Upload className="w-4 h-4 text-text-secondary" />
                        <span className="text-text-secondary">
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
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Portafolio/Sitio Web
                    </label>
                    <input
                      type="url"
                      value={formData.website_url || ''}
                      onChange={(e) => handleInputChange('website_url', e.target.value)}
                      className="w-full px-4 py-3 bg-carbon-700 border border-carbon-600 rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-colors"
                      placeholder="https://tu-portafolio.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      LinkedIn
                    </label>
                    <div className="relative">
                      <Linkedin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                      <input
                        type="url"
                        value={formData.linkedin_url || ''}
                        onChange={(e) => handleInputChange('linkedin_url', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-carbon-700 border border-carbon-600 rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-colors"
                        placeholder="https://linkedin.com/in/tu-perfil"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      GitHub
                    </label>
                    <div className="relative">
                      <Github className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                      <input
                        type="url"
                        value={formData.github_url || ''}
                        onChange={(e) => handleInputChange('github_url', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-carbon-700 border border-carbon-600 rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-colors"
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
