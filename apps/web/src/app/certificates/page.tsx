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
  FileText,
  X
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
      <div className="min-h-screen bg-white dark:bg-[#0F1419] flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-[#0A2540] dark:text-[#00D4B3] animate-spin" />
          <p className="text-[#6C757D] dark:text-gray-400 text-lg">Cargando certificados...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0F1419] flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500" />
          <h2 className="text-2xl font-bold text-[#0A2540] dark:text-white">Error</h2>
          <p className="text-[#6C757D] dark:text-gray-400">{error}</p>
          <button
            onClick={fetchCertificates}
            className="px-6 py-3 bg-[#0A2540] dark:bg-[#0A2540] text-white rounded-lg font-medium hover:bg-[#0d2f4d] dark:hover:bg-[#0d2f4d] transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0F1419]">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-[#0A2540]/10 dark:bg-[#0A2540]/20 rounded-lg">
              <Award className="w-6 h-6 text-[#0A2540] dark:text-[#00D4B3]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#0A2540] dark:text-white">
                Mis Certificados
              </h1>
              <p className="text-[#6C757D] dark:text-gray-400 mt-1 text-sm">
                {certificates.length} {certificates.length === 1 ? 'certificado' : 'certificados'} obtenidos
              </p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        {certificates.length > 0 && (
          <div className="mb-6 flex justify-center">
            <div className="relative w-full max-w-2xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6C757D] dark:text-[#6C757D]" />
              <input
                type="text"
                placeholder="Buscar por curso o instructor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-[#1E2329] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl text-sm font-normal text-[#0A2540] dark:text-white placeholder-[#6C757D] dark:placeholder-[#6C757D] focus:outline-none focus:ring-2 focus:ring-[#00D4B3] focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md"
                style={{ fontFamily: 'Inter, sans-serif' }}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-[#E9ECEF] dark:hover:bg-[#1E2329] rounded-full transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-[#6C757D] dark:text-[#6C757D]" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Certificates Grid */}
        {filteredCertificates.length === 0 ? (
          <div className="text-center py-16">
            <div className="flex flex-col items-center gap-4">
              <div className="p-6 bg-[#E9ECEF]/50 dark:bg-[#0A2540]/20 rounded-full">
                <Award className="w-12 h-12 text-[#6C757D] dark:text-gray-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[#0A2540] dark:text-white mb-2">
                  {certificates.length === 0 ? 'No tienes certificados aún' : 'No se encontraron certificados'}
                </h2>
                <p className="text-[#6C757D] dark:text-gray-400">
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
                  className="bg-white dark:bg-[#1E2329] rounded-xl shadow-sm border border-[#E9ECEF] dark:border-[#6C757D]/30 overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Certificate Image/Thumbnail */}
                  <div className="relative h-48 bg-[#0A2540]/5 dark:bg-[#0A2540]/10 flex items-center justify-center">
                    {certificate.course_thumbnail ? (
                      <Image
                        src={certificate.course_thumbnail}
                        alt={certificate.course_title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="p-8">
                        <Award className="w-20 h-20 text-[#0A2540] dark:text-[#00D4B3]" />
                      </div>
                    )}
                    <div className="absolute top-4 right-4">
                      <div className="bg-white dark:bg-[#1E2329] rounded-full p-2 shadow-sm border border-[#E9ECEF] dark:border-[#6C757D]/30">
                        <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
                      </div>
                    </div>
                  </div>

                  {/* Certificate Info */}
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-[#0A2540] dark:text-white mb-3 line-clamp-2">
                      {certificate.course_title}
                    </h3>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-[#6C757D] dark:text-gray-400">
                        <User className="w-4 h-4" />
                        <span>{certificate.instructor_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-[#6C757D] dark:text-gray-400">
                        <Calendar className="w-4 h-4" />
                        <span>Emitido el {formatDate(certificate.issued_at)}</span>
                      </div>
                      {certificate.expires_at && (
                        <div className="flex items-center gap-2 text-sm text-[#F59E0B] dark:text-[#F59E0B]">
                          <AlertCircle className="w-4 h-4" />
                          <span>Expira el {formatDate(certificate.expires_at)}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleViewCertificate(certificate.certificate_id)}
                        className="flex items-center justify-center gap-2 px-3 py-2 bg-[#0A2540] dark:bg-[#0A2540] text-white rounded-lg font-medium hover:bg-[#0d2f4d] dark:hover:bg-[#0d2f4d] transition-colors text-sm"
                      >
                        <Eye className="w-4 h-4" />
                        Ver
                      </button>
                      <button
                        onClick={() => handleDownload(certificate.certificate_id, certificate.course_title)}
                        className="flex items-center justify-center gap-2 px-3 py-2 bg-[#E9ECEF] dark:bg-[#0F1419] text-[#0A2540] dark:text-gray-300 rounded-lg font-medium hover:bg-[#6C757D]/20 dark:hover:bg-[#0A2540]/30 transition-colors text-sm border border-[#E9ECEF] dark:border-[#6C757D]/30"
                      >
                        <Download className="w-4 h-4" />
                        Descargar
                      </button>
                      <button
                        onClick={() => handleVerify(certificate.certificate_hash)}
                        className="col-span-2 flex items-center justify-center gap-2 px-3 py-2 bg-[#E9ECEF]/50 dark:bg-[#0A2540]/10 text-[#0A2540] dark:text-gray-300 rounded-lg font-medium hover:bg-[#E9ECEF] dark:hover:bg-[#0A2540]/20 transition-colors text-sm border border-[#E9ECEF] dark:border-[#6C757D]/30"
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

