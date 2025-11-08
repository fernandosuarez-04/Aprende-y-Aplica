'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { CheckCircle, XCircle, Loader2, Calendar, User, BookOpen, Award, Shield, Copy } from 'lucide-react'
import Image from 'next/image'

interface CertificateValidation {
  valid: boolean
  expired: boolean
  certificate: {
    id: string
    userId: string
    courseTitle: string
    username: string
    issuedAt: string
    expiresAt: string | null
    blockchainHash: string
  }
}

export default function CertificateVerifyPage() {
  const params = useParams()
  const hash = params.hash as string
  const [loading, setLoading] = useState(true)
  const [validation, setValidation] = useState<CertificateValidation | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (hash && hash !== '[hash]') {
      validateCertificate(hash)
    } else {
      setError('Hash de certificado no válido')
      setLoading(false)
    }
  }, [hash])

  const validateCertificate = async (certificateHash: string) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/certificates/verify/${certificateHash}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al validar el certificado')
      }

      const data = await response.json()
      setValidation(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido al validar el certificado')
    } finally {
      setLoading(false)
    }
  }

  const copyHash = () => {
    if (validation?.certificate.blockchainHash) {
      navigator.clipboard.writeText(validation.certificate.blockchainHash)
      alert('Hash copiado al portapapeles')
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-6 md:mb-8">
          <div className="flex justify-center mb-4">
            <Image
              src="/icono.png"
              alt="Aprende y Aplica"
              width={80}
              height={80}
              className="w-16 h-16 md:w-20 md:h-20 object-contain"
            />
          </div>
          <h1 className="text-2xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2 px-4">
            Validación de Certificado
          </h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 px-4">
            Verifica la autenticidad de un certificado emitido por Aprende y Aplica
          </p>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {loading && (
            <div className="p-8 md:p-12 text-center">
              <Loader2 className="w-10 h-10 md:w-12 md:h-12 animate-spin text-blue-600 dark:text-blue-400 mx-auto mb-4" />
              <p className="text-base md:text-lg text-gray-600 dark:text-gray-400">Validando certificado...</p>
            </div>
          )}

          {error && !loading && (
            <div className="p-8 md:p-12 text-center">
              <XCircle className="w-12 h-12 md:w-16 md:h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Error de Validación
              </h2>
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mb-6 px-4 break-words">{error}</p>
              {hash && hash !== '[hash]' && (
                <button
                  onClick={() => validateCertificate(hash)}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Reintentar
                </button>
              )}
            </div>
          )}

          {validation && !loading && !error && (
            <div className="p-6 md:p-8">
              {/* Estado de Validación */}
              <div className={`mb-6 md:mb-8 p-4 md:p-6 rounded-lg md:rounded-xl border-2 ${
                validation.valid && !validation.expired
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-500 dark:border-green-600'
                  : 'bg-red-50 dark:bg-red-900/20 border-red-500 dark:border-red-600'
              }`}>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 text-center sm:text-left">
                  {validation.valid && !validation.expired ? (
                    <>
                      <CheckCircle className="w-10 h-10 md:w-12 md:h-12 text-green-600 dark:text-green-400 flex-shrink-0" />
                      <div>
                        <h2 className="text-xl md:text-2xl font-bold text-green-900 dark:text-green-100 mb-1">
                          Certificado Válido
                        </h2>
                        <p className="text-sm md:text-base text-green-700 dark:text-green-300">
                          Este certificado ha sido verificado y es auténtico
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-10 h-10 md:w-12 md:h-12 text-red-600 dark:text-red-400 flex-shrink-0" />
                      <div>
                        <h2 className="text-xl md:text-2xl font-bold text-red-900 dark:text-red-100 mb-1">
                          {validation.expired ? 'Certificado Expirado' : 'Certificado Inválido'}
                        </h2>
                        <p className="text-sm md:text-base text-red-700 dark:text-red-300">
                          {validation.expired 
                            ? 'Este certificado ha expirado'
                            : 'Este certificado no es válido o no existe'}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Información del Certificado */}
              {validation.valid && (
                <div className="space-y-4 md:space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    {/* Estudiante */}
                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 md:p-6 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                        <User className="w-5 h-5 md:w-6 md:h-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                        <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">
                          Estudiante
                        </h3>
                      </div>
                      <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 font-medium break-words">
                        {validation.certificate.username}
                      </p>
                    </div>

                    {/* Curso */}
                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 md:p-6 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                        <BookOpen className="w-5 h-5 md:w-6 md:h-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                        <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">
                          Curso
                        </h3>
                      </div>
                      <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 font-medium break-words">
                        {validation.certificate.courseTitle}
                      </p>
                    </div>

                    {/* Fecha de Emisión */}
                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 md:p-6 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                        <Calendar className="w-5 h-5 md:w-6 md:h-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                        <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">
                          Fecha de Emisión
                        </h3>
                      </div>
                      <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 font-medium">
                        {formatDate(validation.certificate.issuedAt)}
                      </p>
                    </div>

                    {/* Fecha de Expiración */}
                    {validation.certificate.expiresAt && (
                      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 md:p-6 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                          <Calendar className="w-5 h-5 md:w-6 md:h-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                          <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">
                            Fecha de Expiración
                          </h3>
                        </div>
                        <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 font-medium">
                          {formatDate(validation.certificate.expiresAt)}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Hash Blockchain */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 md:p-6 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                      <Shield className="w-5 h-5 md:w-6 md:h-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                      <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">
                        Hash Blockchain
                      </h3>
                      <button
                        onClick={copyHash}
                        className="ml-auto p-2 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-colors"
                        title="Copiar hash"
                        aria-label="Copiar hash"
                      >
                        <Copy className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </button>
                    </div>
                    <p className="text-xs md:text-sm font-mono text-gray-700 dark:text-gray-300 break-all bg-white dark:bg-gray-800 p-2 md:p-3 rounded border border-blue-200 dark:border-blue-800">
                      {validation.certificate.blockchainHash}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                      Este hash único garantiza la autenticidad del certificado mediante tecnología blockchain
                    </p>
                  </div>

                  {/* Información adicional */}
                  <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 md:p-6 border border-amber-200 dark:border-amber-800">
                    <div className="flex items-start gap-2 md:gap-3">
                      <Award className="w-5 h-5 md:w-6 md:h-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="text-xs md:text-sm font-semibold text-amber-900 dark:text-amber-100 mb-1">
                          Información de Seguridad
                        </h3>
                        <p className="text-xs md:text-sm text-amber-800 dark:text-amber-200">
                          Este certificado está protegido por tecnología blockchain. El hash único garantiza que no ha sido modificado ni falsificado.
                          Puedes compartir este hash con terceros para verificar la autenticidad del certificado.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6 md:mt-8">
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 px-4">
            ¿Tienes un certificado? Escanea el código QR para validarlo automáticamente
          </p>
        </div>
      </div>
    </div>
  )
}

