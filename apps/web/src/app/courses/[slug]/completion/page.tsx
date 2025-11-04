'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Trophy, Download, ArrowLeft, CheckCircle2, Share2 } from 'lucide-react'
import { CertificateTemplatePreview } from '@/features/admin/components/CertificateTemplatePreview'
import { QRCodeSVG } from 'qrcode.react'

interface Certificate {
  id: string
  url: string
  hash: string
  issuedAt: string
}

interface CertificateData {
  certificate: Certificate
  student: {
    name: string
  }
  instructor: {
    name: string
    signatureUrl?: string | null
    signatureName?: string | null
  }
  course: {
    title: string
  }
}

export default function CourseCompletionPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params?.slug as string

  const [loading, setLoading] = useState(true)
  const [certificate, setCertificate] = useState<Certificate | null>(null)
  const [courseName, setCourseName] = useState<string>('')
  const [studentName, setStudentName] = useState<string>('')
  const [instructorName, setInstructorName] = useState<string>('')
  const [instructorSignatureUrl, setInstructorSignatureUrl] = useState<string | null>(null)
  const [instructorSignatureName, setInstructorSignatureName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    const loadCertificate = async () => {
      try {
        setLoading(true)
        
        // Obtener certificado con datos completos
        const certResponse = await fetch(`/api/courses/${slug}/certificate`)
        const certData = await certResponse.json()
        
        // Manejar diferentes códigos de respuesta
        if (certResponse.status === 202) {
          // Certificado en proceso de generación
          setError(certData.error || 'El certificado está en proceso de generación. Por favor, intenta nuevamente en unos momentos.')
          return
        }
        
        if (!certResponse.ok) {
          // Si no existe, intentar generarlo automáticamente
          if (certResponse.status === 404) {
            console.log('Certificado no encontrado, intentando generar...')
            try {
              const generateResponse = await fetch(`/api/courses/${slug}/certificate/generate`, {
                method: 'POST'
              })
              
              if (generateResponse.ok) {
                // Recargar el certificado después de generarlo
                const generateData = await generateResponse.json()
                if (generateData.success && generateData.certificate) {
                  setCertificate(generateData.certificate)
                  setCourseName(generateData.course?.title || 'Curso')
                  setStudentName(generateData.student?.name || 'Estudiante')
                  setInstructorName(generateData.instructor?.name || 'Instructor')
                  setInstructorSignatureUrl(generateData.instructor?.signatureUrl || null)
                  setInstructorSignatureName(generateData.instructor?.signatureName || null)
                  return
                }
              }
            } catch (generateErr) {
              console.error('Error generando certificado:', generateErr)
            }
          }
          
          throw new Error(certData.error || 'Certificado no encontrado')
        }
        
        if (certData.success && certData.certificate) {
          setCertificate(certData.certificate)
          setCourseName(certData.course?.title || 'Curso')
          setStudentName(certData.student?.name || 'Estudiante')
          setInstructorName(certData.instructor?.name || 'Instructor')
          setInstructorSignatureUrl(certData.instructor?.signatureUrl || null)
          setInstructorSignatureName(certData.instructor?.signatureName || null)
        } else {
          throw new Error(certData.error || 'Certificado no encontrado')
        }
      } catch (err) {
        console.error('Error cargando certificado:', err)
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }

    if (slug) {
      loadCertificate()
    }
  }, [slug])

  const handleDownload = () => {
    if (certificate?.url) {
      // Descargar el PDF
      const link = document.createElement('a')
      link.href = certificate.url
      link.download = `certificado-${slug}-${Date.now()}.pdf`
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const handleShare = () => {
    if (certificate?.hash) {
      const verifyUrl = `${window.location.origin}/certificates/verify/${certificate.hash}`
      if (navigator.share) {
        navigator.share({
          title: `Certificado de ${courseName}`,
          text: `He completado el curso ${courseName} en Aprende y Aplica`,
          url: verifyUrl
        }).catch(err => console.error('Error compartiendo:', err))
      } else {
        // Copiar al portapapeles
        navigator.clipboard.writeText(verifyUrl).then(() => {
          alert('URL de verificación copiada al portapapeles')
        }).catch(err => console.error('Error copiando:', err))
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando certificado...</p>
        </div>
      </div>
    )
  }

  if (error || !certificate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-red-500 mb-4">
            <Trophy className="w-16 h-16 mx-auto" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Certificado no encontrado
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error || 'No se encontró un certificado para este curso. Asegúrate de haber completado el 100% del curso.'}
          </p>
          <button
            onClick={() => router.push(`/courses/${slug}`)}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Volver al Curso
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header de Felicitaciones */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-yellow-400 rounded-full blur-2xl opacity-50"></div>
              <Trophy className="w-24 h-24 text-yellow-500 relative z-10" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            ¡Felicitaciones!
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-2">
            Has completado exitosamente el curso
          </p>
          <p className="text-2xl font-semibold text-blue-600 dark:text-blue-400">
            {courseName}
          </p>
          <div className="flex items-center justify-center gap-2 mt-6 text-green-600 dark:text-green-400">
            <CheckCircle2 className="w-6 h-6" />
            <span className="font-medium">Certificado generado</span>
          </div>
        </div>

        {/* Información del Certificado */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Tu Certificado
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Fecha de Emisión</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {new Date(certificate.issuedAt).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Código de Verificación</p>
              <p className="text-lg font-mono text-gray-900 dark:text-white break-all">
                {certificate.hash.substring(0, 16)}...
              </p>
            </div>
          </div>

          {/* QR Code de Verificación */}
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6 mb-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Escanea este código para verificar tu certificado
            </p>
            <div className="flex justify-center">
              <div className="bg-white p-4 rounded-lg border-2 border-blue-600">
                <QRCodeSVG
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/certificates/verify/${certificate.hash}`}
                  size={150}
                  level="H"
                  includeMargin={true}
                />
              </div>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleDownload}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <Download className="w-5 h-5" />
              Descargar Certificado PDF
            </button>
            <button
              onClick={() => setShowPreview(true)}
              className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors"
            >
              Ver Vista Previa
            </button>
            <button
              onClick={handleShare}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors"
            >
              <Share2 className="w-5 h-5" />
              Compartir
            </button>
          </div>
        </div>

        {/* Botones de Navegación */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => router.push(`/courses/${slug}`)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-medium transition-colors shadow-lg"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver al Curso
          </button>
          <button
            onClick={() => router.push('/courses')}
            className="flex-1 px-6 py-3 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-medium transition-colors shadow-lg"
          >
            Ver Más Cursos
          </button>
        </div>
      </div>

      {/* Modal de Vista Previa */}
      {showPreview && certificate && (
        <CertificateTemplatePreview
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          selectedTemplate="default"
          onSelectTemplate={() => {}}
          certificateHash={certificate.hash}
          studentName={studentName}
          courseName={courseName}
          instructorDisplayName={instructorName}
          instructorSignatureUrl={instructorSignatureUrl}
          instructorSignatureName={instructorSignatureName}
          issueDate={new Date(certificate.issuedAt).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        />
      )}
    </div>
  )
}

