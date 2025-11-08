'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { 
  Award,
  Calendar,
  Download,
  ExternalLink,
  Eye,
  Search,
  Shield,
  User,
  BookOpen,
  Loader2,
  AlertCircle,
  CheckCircle2,
  FileText
} from 'lucide-react'
import Image from 'next/image'

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

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const router = useRouter()

  useEffect(() => {
    fetchCertificates()
  }, [])

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
      // console.error('Error fetching certificates:', err)
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

      // Si la respuesta es una redirección, abrir en nueva ventana
      if (response.redirected) {
        window.open(response.url, '_blank')
      } else {
        // Descargar el archivo
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
      // console.error('Error downloading certificate:', err)
      alert(err instanceof Error ? err.message : 'Error al descargar certificado')
    }
  }

  const handleViewCertificate = (certificateId: string) => {
    router.push(`/certificates/${certificateId}`)
  }

  const handleVerify = (certificateHash: string) => {
    router.push(`/certificates/verify/${certificateHash}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <p className="text-gray-600 dark:text-gray-400 text-lg">Cargando certificados...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Error</h2>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
          <button
            onClick={fetchCertificates}
            className="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-primary to-blue-600 rounded-xl shadow-lg">
              <Award className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                Mis Certificados
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {certificates.length} {certificates.length === 1 ? 'certificado' : 'certificados'} obtenidos
              </p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        {certificates.length > 0 && (
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por curso o instructor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
        )}

        {/* Certificates Grid */}
        {filteredCertificates.length === 0 ? (
          <div className="text-center py-16">
            <div className="flex flex-col items-center gap-4">
              <div className="p-6 bg-gray-200 dark:bg-gray-700 rounded-full">
                <Award className="w-12 h-12 text-gray-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {certificates.length === 0 ? 'No tienes certificados aún' : 'No se encontraron certificados'}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
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
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-shadow"
                >
                  {/* Certificate Image/Thumbnail */}
                  <div className="relative h-48 bg-gradient-to-br from-primary/10 to-blue-600/10 dark:from-primary/20 dark:to-blue-600/20 flex items-center justify-center">
                    {certificate.course_thumbnail ? (
                      <Image
                        src={certificate.course_thumbnail}
                        alt={certificate.course_title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="p-8">
                        <Award className="w-20 h-20 text-primary" />
                      </div>
                    )}
                    <div className="absolute top-4 right-4">
                      <div className="bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      </div>
                    </div>
                  </div>

                  {/* Certificate Info */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
                      {certificate.course_title}
                    </h3>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <User className="w-4 h-4" />
                        <span>{certificate.instructor_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Calendar className="w-4 h-4" />
                        <span>Emitido el {formatDate(certificate.issued_at)}</span>
                      </div>
                      {certificate.expires_at && (
                        <div className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400">
                          <AlertCircle className="w-4 h-4" />
                          <span>Expira el {formatDate(certificate.expires_at)}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleViewCertificate(certificate.certificate_id)}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors text-sm"
                      >
                        <Eye className="w-4 h-4" />
                        Ver
                      </button>
                      <button
                        onClick={() => handleDownload(certificate.certificate_id, certificate.course_title)}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
                      >
                        <Download className="w-4 h-4" />
                        Descargar
                      </button>
                      <button
                        onClick={() => handleVerify(certificate.certificate_hash)}
                        className="col-span-2 flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm border border-gray-200 dark:border-gray-700"
                      >
                        <Shield className="w-4 h-4" />
                        Verificar Certificado
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}

