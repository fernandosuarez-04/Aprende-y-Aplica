'use client'

import { useState } from 'react'
import { 
  XMarkIcon,
  UserIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  PhoneIcon,
  MapPinIcon,
  LinkIcon,
  DocumentTextIcon,
  GlobeAltIcon,
  StarIcon,
  FlagIcon,
  PlusIcon
} from '@heroicons/react/24/outline'

interface AddUserModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (userData: any) => Promise<void>
}

export function AddUserModal({ isOpen, onClose, onSave }: AddUserModalProps) {
  // Estilos consistentes para los campos - Respetan el tema
  const fieldStyles = {
    container: "group",
    label: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 group-hover:text-gray-900 dark:group-hover:text-white transition-colors",
    inputContainer: "relative",
    icon: "absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors",
    input: "w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white dark:focus:bg-gray-700 transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500",
    inputNoIcon: "w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white dark:focus:bg-gray-700 transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500",
    textarea: "w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white dark:focus:bg-gray-700 transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 resize-none"
  }

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    display_name: '',
    cargo_rol: 'Usuario',
    type_rol: '',
    phone: '',
    bio: '',
    location: '',
    profile_picture_url: '',
    curriculum_url: '',
    linkedin_url: '',
    github_url: '',
    website_url: '',
    role_zoom: '',
    points: 0,
    country_code: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      await onSave(formData)
      // Reset form
      setFormData({
        username: '',
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        display_name: '',
        cargo_rol: 'Usuario',
        type_rol: '',
        phone: '',
        bio: '',
        location: '',
        profile_picture_url: '',
        curriculum_url: '',
        linkedin_url: '',
        github_url: '',
        website_url: '',
        role_zoom: '',
        points: 0,
        country_code: ''
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear usuario')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-gray-900/50 dark:bg-gray-600/75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-2xl max-w-5xl w-full border border-gray-200 dark:border-gray-600 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="relative bg-gradient-to-r from-green-500 to-blue-500 dark:from-green-600 dark:to-blue-600 rounded-t-2xl p-6">
            <div className="absolute inset-0 bg-black/10 dark:bg-black/20 rounded-t-2xl"></div>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <PlusIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    Agregar Nuevo Usuario
                  </h3>
                  <p className="text-green-50 dark:text-green-100 text-sm">
                    Crear un nuevo usuario en la plataforma
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg backdrop-blur-sm transition-all duration-200 text-white hover:scale-105"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-6">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Información Básica */}
            <div className="mb-8">
              <div className="bg-green-50 dark:bg-gradient-to-r dark:from-green-500/10 dark:to-blue-500/10 rounded-xl p-4 mb-6 border border-green-200 dark:border-green-500/20">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                  <div className="p-2 bg-green-100 dark:bg-green-500/20 rounded-lg mr-3">
                    <UserIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  Información Básica
                </h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm ml-11">
                  Datos esenciales para crear la cuenta del usuario
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Username */}
                <div className={fieldStyles.container}>
                  <label className={fieldStyles.label}>
                    Nombre de usuario *
                  </label>
                  <div className={fieldStyles.inputContainer}>
                    <UserIcon className={fieldStyles.icon} />
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      className={fieldStyles.input}
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div className={fieldStyles.container}>
                  <label className={fieldStyles.label}>
                    Email *
                  </label>
                  <div className={fieldStyles.inputContainer}>
                    <EnvelopeIcon className={fieldStyles.icon} />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={fieldStyles.input}
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div className={fieldStyles.container}>
                  <label className={fieldStyles.label}>
                    Contraseña *
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={fieldStyles.inputNoIcon}
                    required
                    minLength={6}
                  />
                </div>

                {/* Role */}
                <div className={fieldStyles.container}>
                  <label className={fieldStyles.label}>
                    Rol *
                  </label>
                  <div className={fieldStyles.inputContainer}>
                    <ShieldCheckIcon className={fieldStyles.icon} />
                    <select
                      name="cargo_rol"
                      value={formData.cargo_rol}
                      onChange={handleChange}
                      className={fieldStyles.input}
                    >
                      <option value="Usuario">Usuario</option>
                      <option value="Instructor">Instructor</option>
                      <option value="Administrador">Administrador</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Información Personal */}
            <div className="mb-8">
              <div className="bg-blue-50 dark:bg-gradient-to-r dark:from-blue-500/10 dark:to-purple-500/10 rounded-xl p-4 mb-6 border border-blue-200 dark:border-blue-500/20">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                  <div className="p-2 bg-blue-100 dark:bg-blue-500/20 rounded-lg mr-3">
                    <UserIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  Información Personal
                </h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm ml-11">
                  Datos personales del usuario (opcional)
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* First Name */}
                <div className={fieldStyles.container}>
                  <label className={fieldStyles.label}>
                    Nombre
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    className={fieldStyles.inputNoIcon}
                  />
                </div>

                {/* Last Name */}
                <div className={fieldStyles.container}>
                  <label className={fieldStyles.label}>
                    Apellido
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    className={fieldStyles.inputNoIcon}
                  />
                </div>

                {/* Display Name */}
                <div className={fieldStyles.container}>
                  <label className={fieldStyles.label}>
                    Nombre para mostrar
                  </label>
                  <input
                    type="text"
                    name="display_name"
                    value={formData.display_name}
                    onChange={handleChange}
                    className={fieldStyles.inputNoIcon}
                  />
                </div>

                {/* Phone */}
                <div className={fieldStyles.container}>
                  <label className={fieldStyles.label}>
                    Teléfono
                  </label>
                  <div className={fieldStyles.inputContainer}>
                    <PhoneIcon className={fieldStyles.icon} />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className={fieldStyles.input}
                    />
                  </div>
                </div>

                {/* Location */}
                <div className={fieldStyles.container}>
                  <label className={fieldStyles.label}>
                    Ubicación
                  </label>
                  <div className={fieldStyles.inputContainer}>
                    <MapPinIcon className={fieldStyles.icon} />
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      className={fieldStyles.input}
                    />
                  </div>
                </div>

                {/* Country Code */}
                <div className={fieldStyles.container}>
                  <label className={fieldStyles.label}>
                    Código de país
                  </label>
                  <div className={fieldStyles.inputContainer}>
                    <FlagIcon className={fieldStyles.icon} />
                    <input
                      type="text"
                      name="country_code"
                      value={formData.country_code}
                      onChange={handleChange}
                      placeholder="MX, US, etc."
                      className={fieldStyles.input}
                    />
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div className="mt-6">
                <label className={fieldStyles.label}>
                  Biografía
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows={3}
                  className={fieldStyles.textarea}
                  placeholder="Escribe una breve descripción del usuario..."
                />
              </div>
            </div>

            {/* Información Adicional */}
            <div className="mb-8">
              <div className="bg-purple-50 dark:bg-gradient-to-r dark:from-purple-500/10 dark:to-pink-500/10 rounded-xl p-4 mb-6 border border-purple-200 dark:border-purple-500/20">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                  <div className="p-2 bg-purple-100 dark:bg-purple-500/20 rounded-lg mr-3">
                    <LinkIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  Información Adicional
                </h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm ml-11">
                  Enlaces y configuraciones opcionales
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Type Role */}
                <div className={fieldStyles.container}>
                  <label className={fieldStyles.label}>
                    Tipo de rol
                  </label>
                  <input
                    type="text"
                    name="type_rol"
                    value={formData.type_rol}
                    onChange={handleChange}
                    className={fieldStyles.inputNoIcon}
                  />
                </div>

                {/* Role Zoom */}
                <div className={fieldStyles.container}>
                  <label className={fieldStyles.label}>
                    Rol Zoom
                  </label>
                  <input
                    type="text"
                    name="role_zoom"
                    value={formData.role_zoom}
                    onChange={handleChange}
                    className={fieldStyles.inputNoIcon}
                  />
                </div>

                {/* Points */}
                <div className={fieldStyles.container}>
                  <label className={fieldStyles.label}>
                    Puntos iniciales
                  </label>
                  <div className={fieldStyles.inputContainer}>
                    <StarIcon className={fieldStyles.icon} />
                    <input
                      type="number"
                      name="points"
                      value={formData.points}
                      onChange={handleChange}
                      min="0"
                      className={fieldStyles.input}
                    />
                  </div>
                </div>

                {/* Profile Picture URL */}
                <div className={fieldStyles.container}>
                  <label className={fieldStyles.label}>
                    URL de foto de perfil
                  </label>
                  <input
                    type="url"
                    name="profile_picture_url"
                    value={formData.profile_picture_url}
                    onChange={handleChange}
                    className={fieldStyles.inputNoIcon}
                    placeholder="https://..."
                  />
                </div>

                {/* Curriculum URL */}
                <div className={fieldStyles.container}>
                  <label className={fieldStyles.label}>
                    URL de currículum
                  </label>
                  <div className={fieldStyles.inputContainer}>
                    <DocumentTextIcon className={fieldStyles.icon} />
                    <input
                      type="url"
                      name="curriculum_url"
                      value={formData.curriculum_url}
                      onChange={handleChange}
                      className={fieldStyles.input}
                      placeholder="https://..."
                    />
                  </div>
                </div>

                {/* LinkedIn URL */}
                <div className={fieldStyles.container}>
                  <label className={fieldStyles.label}>
                    URL de LinkedIn
                  </label>
                  <input
                    type="url"
                    name="linkedin_url"
                    value={formData.linkedin_url}
                    onChange={handleChange}
                    className={fieldStyles.inputNoIcon}
                    placeholder="https://linkedin.com/in/..."
                  />
                </div>

                {/* GitHub URL */}
                <div className={fieldStyles.container}>
                  <label className={fieldStyles.label}>
                    URL de GitHub
                  </label>
                  <input
                    type="url"
                    name="github_url"
                    value={formData.github_url}
                    onChange={handleChange}
                    className={fieldStyles.inputNoIcon}
                    placeholder="https://github.com/..."
                  />
                </div>

                {/* Website URL */}
                <div className={`${fieldStyles.container} col-span-2`}>
                  <label className={fieldStyles.label}>
                    URL de sitio web
                  </label>
                  <div className={fieldStyles.inputContainer}>
                    <GlobeAltIcon className={fieldStyles.icon} />
                    <input
                      type="url"
                      name="website_url"
                      value={formData.website_url}
                      onChange={handleChange}
                      className={fieldStyles.input}
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Aviso de Protección de Datos */}
            <div className="mb-6 p-6 bg-blue-50 dark:bg-gradient-to-r dark:from-blue-900/30 dark:to-purple-900/30 border border-blue-200 dark:border-blue-500/30 rounded-xl">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-500/20 rounded-lg">
                  <ShieldCheckIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h5 className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-2">
                    Protección de Datos Personales
                  </h5>
                  <p className="text-xs text-blue-600 dark:text-blue-300 leading-relaxed">
                    Al crear este usuario, se está manejando información sensible protegida por la Ley Federal de Protección de Datos Personales (LFPDPPP) y las normas ISO 27001. 
                    La creación del usuario será registrada en el log de auditoría para cumplir con los requisitos de trazabilidad.
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-600">
              <button
                type="button"
                onClick={onClose}
                className="px-8 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-600/50 rounded-xl transition-all duration-200 hover:scale-105 border border-gray-300 dark:border-gray-600"
                disabled={isLoading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-8 py-3 bg-gradient-to-r from-green-500 to-blue-500 dark:from-green-600 dark:to-blue-600 hover:from-green-600 hover:to-blue-600 dark:hover:from-green-700 dark:hover:to-blue-700 text-white rounded-xl transition-all duration-200 disabled:opacity-50 hover:scale-105 shadow-lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Creando...</span>
                  </div>
                ) : (
                  'Crear Usuario'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
