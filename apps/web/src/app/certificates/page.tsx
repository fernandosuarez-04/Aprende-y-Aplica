'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { 
  Award,
  Calendar,
  Download,
  Eye,
  Search,
  Shield,
  User,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  ArrowLeft
} from 'lucide-react'
import Image from 'next/image'
import { useOrganizationStyles } from '@/features/business-panel/hooks/useOrganizationStyles'
import { getBackgroundStyle, generateCSSVariables } from '@/features/business-panel/utils/styles'
import { LiaSidePanel } from '@/core/components/LiaSidePanel'
import { LiaFloatingButton } from '@/core/components/LiaSidePanel/LiaFloatingButton'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { ModernNavbar } from '../business-user/dashboard/components/ModernNavbar'
import { useCallback, Suspense } from 'react'

interface Certificate {
  certificate_id: string
  certificate_url: string
  certificate_hash: string
  issued_at: string
  expires_at: string | null
  created_at: string
  course_id: string
  enrollment_id: string
  course_title: string
  course_slug: string
  course_thumbnail: string | null
  instructor_name: string
  instructor_username: string | null
}


interface Organization {
  id: string
  name: string
  logo_url?: string | null
  favicon_url?: string | null
}

export default function CertificatesPage() {
  const { user, logout } = useAuth()
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const router = useRouter()
  
  // Organization Styles
  const { styles } = useOrganizationStyles()
  const userDashboardStyles = styles?.userDashboard
  const backgroundStyle = getBackgroundStyle(userDashboardStyles)
  const cssVariables = generateCSSVariables(userDashboardStyles)

  const colors = {
    primary: userDashboardStyles?.primary_button_color || '#0A2540',
    accent: userDashboardStyles?.accent_color || '#00D4B3',
    text: userDashboardStyles?.text_color || '#FFFFFF',
    cardBg: userDashboardStyles?.card_background || '#1E2329',
    buttonText: '#FFFFFF'
  }

  useEffect(() => {
    fetchCertificates()
    fetchOrganization()
  }, [])

  const fetchOrganization = async () => {
    try {
      const response = await fetch('/api/auth/me', { credentials: 'include' })
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.user?.organization) {
          setOrganization(data.user.organization)
        }
      }
    } catch (error) {
      // Silent fail
    }
  }

  const handleLogout = useCallback(async () => {
    await logout()
    router.push('/auth')
  }, [logout, router])

  const handleProfileClick = useCallback(() => {
    router.push('/profile')
  }, [router])

  const getDisplayName = useCallback(() => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`
    }
    return user?.display_name || user?.username || 'Usuario'
  }, [user])

  const getInitials = useCallback(() => {
    const firstName = user?.first_name || ''
    const lastName = user?.last_name || ''
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
    }
    return (user?.username || 'U').charAt(0).toUpperCase()
  }, [user])

  const fetchCertificates = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/certificates', {
        credentials: 'include'
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Error al cargar certificados')
      }

      const data = await response.json()
      
      if (data.success) {
        setCertificates(data.certificates || [])
      } else {
        throw new Error(data.error || 'Error al obtener certificados')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  const filteredCertificates = certificates.filter(cert => {
    const matchesSearch = 
      cert.course_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.instructor_name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  const handleDownload = async (certificateId: string, courseTitle: string) => {
    try {
      const response = await fetch(`/api/certificates/${certificateId}/download`, {
        credentials: 'include'
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Error al descargar certificado')
      }

      if (response.redirected) {
        window.open(response.url, '_blank')
      } else {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${courseTitle.replace(/[^a-z0-9]/gi, '_')}_certificado.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al descargar certificado')
    }
  }

  const handleViewCertificate = (certificateId: string) => {
    router.push(`/certificates/${certificateId}`)
  }

  const handleVerify = (certificateHash: string) => {
    router.push(`/certificates/verify/${certificateHash}`)
  }

  const handleBackToDashboard = () => {
    router.push('/business-user/dashboard')
  }

  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-6"
        style={{
          ...cssVariables as React.CSSProperties,
          background: backgroundStyle?.background || backgroundStyle?.backgroundColor || '#0F1419'
        }}
      >
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin" style={{ color: colors.accent }} />
          <p className="text-lg" style={{ color: colors.text }}>Cargando certificados...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-6"
        style={{
          ...cssVariables as React.CSSProperties,
          background: backgroundStyle?.background || backgroundStyle?.backgroundColor || '#0F1419'
        }}
      >
        <div className="flex flex-col items-center gap-4 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500" />
          <h2 className="text-2xl font-bold" style={{ color: colors.text }}>Error</h2>
          <p style={{ color: colors.text, opacity: 0.7 }}>{error}</p>
          <button
            onClick={fetchCertificates}
            className="px-6 py-3 rounded-lg font-medium transition-colors"
            style={{ backgroundColor: colors.primary, color: colors.buttonText }}
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="min-h-screen"
      style={{
        ...cssVariables as React.CSSProperties,
        background: backgroundStyle?.background || backgroundStyle?.backgroundColor || '#0F1419'
      }}
    >
      <Suspense fallback={<div className="h-16 w-full" />}>
        <ModernNavbar
          organization={organization}
          user={user}
          getDisplayName={getDisplayName}
          getInitials={getInitials}
          onProfileClick={handleProfileClick}
          onLogout={handleLogout}
          styles={userDashboardStyles}
        />
      </Suspense>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header & Navigation */}
        <div className="mb-8">
           <button 
            onClick={handleBackToDashboard}
            className="flex items-center gap-2 mb-6 px-4 py-2 rounded-lg transition-colors hover:bg-white/5"
            style={{ color: colors.text }}
           >
            <ArrowLeft className="w-5 h-5" />
            <span>Volver al Panel</span>
           </button>

          <div className="flex items-center gap-4 mb-3">
            <div 
              className="p-3 rounded-xl"
              style={{ background: `linear-gradient(135deg, ${colors.primary}20, ${colors.accent}10)` }}
            >
              <Award className="w-8 h-8" style={{ color: colors.accent }} />
            </div>
            <div>
              <h1 className="text-3xl font-bold" style={{ color: colors.text }}>
                Mis Certificados
              </h1>
              <p className="mt-1 text-sm opacity-70" style={{ color: colors.text }}>
                {certificates.length} {certificates.length === 1 ? 'certificado' : 'certificados'} obtenidos
              </p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        {certificates.length > 0 && (
          <div className="mb-8 flex justify-center">
            <div className="relative w-full max-w-2xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" style={{ color: colors.text }} />
              <input
                type="text"
                placeholder="Buscar por curso o instructor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-3 rounded-xl text-sm font-normal border shadow-sm transition-all duration-200 focus:ring-2 focus:ring-opacity-50"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                  color: colors.text,
                  // @ts-ignore
                  '--tw-ring-color': colors.accent
                }}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-3.5 h-3.5 opacity-50" style={{ color: colors.text }} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Certificates Grid */}
        {filteredCertificates.length === 0 ? (
          <div className="text-center py-20">
            <div className="flex flex-col items-center gap-6">
              <div 
                className="p-8 rounded-full"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
              >
                <Award className="w-16 h-16 opacity-30" style={{ color: colors.text }} />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2" style={{ color: colors.text }}>
                  {certificates.length === 0 ? 'No tienes certificados aún' : 'No se encontraron certificados'}
                </h2>
                <p className="opacity-60" style={{ color: colors.text }}>
                  {certificates.length === 0 
                    ? 'Completa cursos para obtener certificados'
                    : 'Intenta con otros términos de búsqueda'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredCertificates.map((certificate, index) => (
                <motion.div
                  key={certificate.certificate_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="rounded-xl shadow-lg border overflow-hidden hover:shadow-xl transition-all duration-300 group"
                  style={{
                    backgroundColor: colors.cardBg,
                    borderColor: 'rgba(255, 255, 255, 0.1)'
                  }}
                >
                  {/* Certificate Image/Thumbnail */}
                  <div className="relative h-48 flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 opacity-10" style={{ backgroundColor: colors.primary }} />
                    
                    {certificate.course_thumbnail ? (
                      <Image
                        src={certificate.course_thumbnail}
                        alt={certificate.course_title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="p-8">
                        <Award className="w-20 h-20" style={{ color: colors.accent }} />
                      </div>
                    )}
                    
                    <div className="absolute top-4 right-4">
                      <div 
                        className="rounded-full p-2 shadow-sm backdrop-blur-md"
                        style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
                      >
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      </div>
                    </div>
                  </div>

                  {/* Certificate Info */}
                  <div className="p-5">
                    <h3 className="text-lg font-bold mb-3 line-clamp-2" style={{ color: colors.text }}>
                      {certificate.course_title}
                    </h3>
                    
                    <div className="space-y-2 mb-6">
                      <div className="flex items-center gap-2 text-sm opacity-70" style={{ color: colors.text }}>
                        <User className="w-4 h-4" />
                        <span>{certificate.instructor_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm opacity-70" style={{ color: colors.text }}>
                        <Calendar className="w-4 h-4" />
                        <span>Emitido el {formatDate(certificate.issued_at)}</span>
                      </div>
                      {certificate.expires_at && (
                        <div className="flex items-center gap-2 text-sm text-amber-500">
                          <AlertCircle className="w-4 h-4" />
                          <span>Expira el {formatDate(certificate.expires_at)}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => handleViewCertificate(certificate.certificate_id)}
                        className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg font-medium transition-colors text-sm"
                        style={{ backgroundColor: colors.primary, color: colors.buttonText }}
                      >
                        <Eye className="w-4 h-4" />
                        Ver
                      </button>
                      <button
                        onClick={() => handleDownload(certificate.certificate_id, certificate.course_title)}
                        className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg font-medium transition-colors text-sm border"
                        style={{ 
                          backgroundColor: 'transparent', 
                          borderColor: 'rgba(255, 255, 255, 0.2)',
                          color: colors.text
                        }}
                      >
                        <Download className="w-4 h-4" />
                        Descargar
                      </button>
                      <button
                        onClick={() => handleVerify(certificate.certificate_hash)}
                        className="col-span-2 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg font-medium transition-colors text-sm border hover:bg-white/5"
                        style={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.03)',
                          borderColor: 'rgba(255, 255, 255, 0.1)',
                          color: colors.text
                        }}
                      >
                        <Shield className="w-4 h-4 opacity-70" />
                        Verificar Validez
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* LIA Integration */}
      <LiaSidePanel />
      <LiaFloatingButton />
    </div>
  )
}

