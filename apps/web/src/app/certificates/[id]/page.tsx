'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Award,
  Calendar,
  Download,
  ExternalLink,
  Shield,
  User,
  BookOpen,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Copy,
  Share2
} from 'lucide-react'
import { getFullUrl } from '@/lib/env'
import { CertificateDisplay } from '@/core/components/CertificateDisplay/CertificateDisplay'
import { generateCertificatePDF } from '@/core/utils/certificatePDF'

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
  instructor_signature_url?: string | null
  instructor_signature_name?: string | null
  user_name?: string
}

export default function CertificateDetailPage() {
  const params = useParams()
  const router = useRouter()
  const certificateId = params.id as string
  const [certificate, setCertificate] = useState<Certificate | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (certificateId) {
      fetchCertificate()
    }
  }, [certificateId])

  const fetchCertificate = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/certificates', {
        credentials: 'include'
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Error al cargar certificado')
      }

      const data = await response.json()
      
      if (data.success && data.certificates) {
        const foundCertificate = data.certificates.find(
          (cert: Certificate) => cert.certificate_id === certificateId
        )
        
        if (foundCertificate) {
          setCertificate(foundCertificate)
        } else {
          throw new Error('Certificado no encontrado')
        }
      } else {
        throw new Error(data.error || 'Error al obtener certificado')
      }
    } catch (err) {
      // console.error('Error fetching certificate:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

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

  const handleDownload = async () => {
    if (!certificate) return

    try {
      // Generar PDF desde el componente HTML renderizado
      const fileName = `${certificate.course_title.replace(/[^a-z0-9]/gi, '_')}_certificado.pdf`
      await generateCertificatePDF('certificate-display', fileName)
    } catch (err) {
      console.error('Error generando PDF:', err)
      alert(err instanceof Error ? err.message : 'Error al generar el certificado PDF')
    }
  }

  const handleVerify = () => {
    if (certificate) {
      router.push(`/certificates/verify/${certificate.certificate_hash}`)
    }
  }

  const copyHash = () => {
    if (certificate) {
      navigator.clipboard.writeText(certificate.certificate_hash)
      alert('Hash copiado al portapapeles')
    }
  }

  const shareCertificate = () => {
    if (certificate) {
      const verifyUrl = getFullUrl(`/certificates/verify/${certificate.certificate_hash}`)
      if (navigator.share) {
        navigator.share({
          title: `Certificado: ${certificate.course_title}`,
          text: `He completado el curso "${certificate.course_title}" y obtuve este certificado.`,
          url: verifyUrl
        }).catch(err => {/* console.error('Error sharing:', err) */})
      } else {
        navigator.clipboard.writeText(verifyUrl)
        alert('Enlace de verificación copiado al portapapeles')
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <p className="text-gray-600 dark:text-gray-400 text-lg">Cargando certificado...</p>
        </div>
      </div>
    )
  }

  if (error || !certificate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Error</h2>
          <p className="text-gray-600 dark:text-gray-400">{error || 'Certificado no encontrado'}</p>
          <button
            onClick={() => router.push('/certificates')}
            className="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Volver a Certificados
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Back Button */}
        <button
          onClick={() => router.push('/certificates')}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Volver a Certificados</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Certificate Image */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <div className="w-full bg-white p-8 flex items-center justify-center overflow-auto">
                <div className="w-full max-w-4xl" style={{ maxWidth: '816px' }}>
                  <div id="certificate-display">
                    <CertificateDisplay
                      studentName={certificate.user_name || 'Estudiante'}
                      courseName={certificate.course_title}
                      issueDate={formatDate(certificate.issued_at)}
                      instructorSignatureUrl={certificate.instructor_signature_url}
                      instructorSignatureName={certificate.instructor_signature_name}
                      instructorDisplayName={certificate.instructor_name}
                      certificateHash={certificate.certificate_hash}
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleDownload}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
                  >
                    <Download className="w-5 h-5" />
                    Descargar
                  </button>
                  <button
                    onClick={handleVerify}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <Shield className="w-5 h-5" />
                    Verificar
                  </button>
                  <button
                    onClick={shareCertificate}
                    className="col-span-2 flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border border-gray-200 dark:border-gray-700"
                  >
                    <Share2 className="w-5 h-5" />
                    Compartir Certificado
                  </button>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Certificate Info */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 space-y-6"
            >
              {/* Status Badge */}
              <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                <div>
                  <p className="text-sm font-semibold text-green-900 dark:text-green-100">
                    Certificado Válido
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-300">
                    Verificado y autenticado
                  </p>
                </div>
              </div>

              {/* Course Info */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  {certificate.course_title}
                </h2>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Instructor</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {certificate.instructor_name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Fecha de Emisión</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {formatDate(certificate.issued_at)}
                      </p>
                    </div>
                  </div>

                  {certificate.expires_at && (
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-orange-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Fecha de Expiración</p>
                        <p className="font-medium text-orange-600 dark:text-orange-400">
                          {formatDate(certificate.expires_at)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Hash Blockchain */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      Hash Blockchain
                    </p>
                  </div>
                  <button
                    onClick={copyHash}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                    title="Copiar hash"
                  >
                    <Copy className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
                <p className="text-xs font-mono text-gray-600 dark:text-gray-400 break-all bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                  {certificate.certificate_hash}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Este hash único garantiza la autenticidad del certificado mediante tecnología blockchain
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}

