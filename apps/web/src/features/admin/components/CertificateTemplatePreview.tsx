'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { QRCodeSVG } from 'qrcode.react'
import { X, Check, Maximize2, ArrowLeft } from 'lucide-react'

interface CertificateTemplate {
  id: string
  name: string
  description: string
  preview: {
    primaryColor: string
    secondaryColor: string
    accentColor: string
    style: 'default'
  }
}

const templates: CertificateTemplate[] = [
  {
    id: 'default',
    name: 'Plantilla Clásica',
    description: 'Diseño profesional con bordes decorativos y elementos ornamentales elegantes',
    preview: {
      primaryColor: '#1e3a8a',
      secondaryColor: '#60a5fa',
      accentColor: '#d4af37',
      style: 'default'
    }
  }
]

interface CertificateTemplatePreviewProps {
  isOpen: boolean
  onClose: () => void
  selectedTemplate: string
  onSelectTemplate: (templateId: string) => void
  instructorSignatureUrl?: string | null
  instructorSignatureName?: string | null
  instructorDisplayName?: string | null
  certificateHash?: string | null
  studentName?: string
  courseName?: string
  issueDate?: string
}

export function CertificateTemplatePreview({
  isOpen,
  onClose,
  selectedTemplate,
  onSelectTemplate,
  instructorSignatureUrl,
  instructorSignatureName,
  instructorDisplayName,
  certificateHash,
  studentName = '[Nombre del Estudiante]',
  courseName = '[Nombre del Curso]',
  issueDate = '[Fecha]'
}: CertificateTemplatePreviewProps) {
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null)

  // Debug: Log cuando cambian los props
  useEffect(() => {
    if (isOpen) {
      console.log('CertificateTemplatePreview - Props updated:', {
        studentName,
        courseName,
        instructorSignatureUrl,
        instructorSignatureName,
        instructorDisplayName,
        hasSignatureName: !!instructorSignatureName,
        hasSignatureUrl: !!instructorSignatureUrl,
        willShowName: !!(instructorSignatureName && instructorSignatureName.trim() && (!instructorSignatureUrl || !instructorSignatureUrl.trim()))
      })
    }
  }, [isOpen, studentName, courseName, instructorSignatureUrl, instructorSignatureName, instructorDisplayName])
  
  if (!isOpen) return null

  const renderTemplatePreview = (template: CertificateTemplate, isExpanded: boolean = false) => {
    const isSelected = selectedTemplate === template.id
    const { primaryColor, secondaryColor, accentColor, style } = template.preview

    // Función auxiliar para renderizar la firma del instructor
    const renderInstructorSignature = () => {
      const hasSignatureName = instructorSignatureName && typeof instructorSignatureName === 'string' && instructorSignatureName.trim().length > 0
      const hasSignatureUrl = instructorSignatureUrl && typeof instructorSignatureUrl === 'string' && instructorSignatureUrl.trim().length > 0
      const hasDisplayName = instructorDisplayName && typeof instructorDisplayName === 'string' && instructorDisplayName.trim().length > 0
      
      console.log('Rendering instructor signature:', { hasSignatureName, hasSignatureUrl, hasDisplayName, instructorSignatureName, instructorSignatureUrl, instructorDisplayName })
      
      if (hasSignatureName && !hasSignatureUrl) {
        // Mostrar nombre arriba de la línea
        return (
          <>
            <div className="text-base font-bold mb-3 px-2" style={{ color: primaryColor }}>
              {instructorSignatureName.trim()}
            </div>
            <div className="h-1 w-40 border-b-4 mx-auto mb-3" style={{ borderColor: primaryColor }}></div>
            <div className="text-xs text-gray-600">Instructor</div>
          </>
        )
      } else if (hasSignatureUrl) {
        // Mostrar imagen de firma
        return (
          <>
            <div className="mb-3 flex justify-center">
              <img
                src={instructorSignatureUrl.trim()}
                alt="Firma del instructor"
                className="h-20 w-48 object-contain"
                onError={(e) => {
                  console.error('Error loading signature image:', instructorSignatureUrl)
                  e.currentTarget.style.display = 'none'
                }}
              />
            </div>
            <div className="h-1 w-40 border-b-4 mx-auto mb-3" style={{ borderColor: primaryColor }}></div>
            {hasDisplayName ? (
              <div className="text-base font-bold px-2" style={{ color: primaryColor }}>
                {instructorDisplayName.trim()}
              </div>
            ) : (
              <div className="text-xs text-gray-600">Instructor</div>
            )}
          </>
        )
      } else if (hasDisplayName) {
        // Mostrar nombre del instructor si no hay firma
        return (
          <>
            <div className="text-base font-bold mb-3 px-2" style={{ color: primaryColor }}>
              {instructorDisplayName.trim()}
            </div>
            <div className="h-1 w-40 border-b-4 mx-auto mb-3" style={{ borderColor: primaryColor }}></div>
            <div className="text-xs text-gray-600">Instructor</div>
          </>
        )
      } else {
        // No hay firma configurada
        return (
          <>
            <div className="h-16 w-40 border-b-4 mx-auto mb-3" style={{ borderColor: primaryColor }}></div>
            <div className="text-sm font-semibold mb-1" style={{ color: primaryColor }}>
              [Firma del Instructor]
            </div>
            <div className="text-xs text-gray-600">Instructor</div>
          </>
        )
      }
    }

    const certificateContent = (
      <div
        className={`relative transition-all duration-200 ${
          isExpanded ? 'w-full' : isSelected ? 'ring-4 ring-blue-500 ring-offset-2' : ''
        } ${!isExpanded ? 'cursor-pointer' : ''}`}
        onClick={() => !isExpanded && onSelectTemplate(template.id)}
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 transition-colors">
          {/* Preview del Certificado */}
          <div className={`relative overflow-hidden ${isExpanded ? 'w-full h-[800px]' : 'aspect-[4/3]'}`}>
            {/* Certificado Clásico - Diseño Profesional con Bordes Decorativos */}
            {style === 'default' && (
              <div className={`w-full ${isExpanded ? 'h-[800px]' : 'h-full'} flex relative bg-gradient-to-br from-gray-50 to-white`}>
                {/* Bordes decorativos externos */}
                <div className="absolute inset-0 border-8" style={{ borderColor: primaryColor }}></div>
                <div className="absolute inset-2 border-4" style={{ borderColor: secondaryColor }}></div>
                <div className="absolute inset-4 border-2" style={{ borderColor: accentColor }}></div>
                
                {/* Esquinas decorativas ornamentales */}
                <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4" style={{ borderColor: accentColor }}></div>
                <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4" style={{ borderColor: accentColor }}></div>
                <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4" style={{ borderColor: accentColor }}></div>
                <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4" style={{ borderColor: accentColor }}></div>
                
                {/* Contenido principal */}
                <div className="flex-1 p-12 flex flex-col relative z-10">
                  {/* Contenido del certificado */}
                  <div className="flex flex-col justify-between items-center text-center h-full">
                    {/* Logo de Aprende y Aplica */}
                    <div className="flex justify-center mb-6">
                      <div className="relative">
                        <div className="absolute inset-0 blur-md opacity-30" style={{ backgroundColor: primaryColor }}></div>
                        <Image
                          src="/icono.png"
                          alt="Aprende y Aplica"
                          width={100}
                          height={100}
                          className="w-20 h-20 object-contain relative z-10"
                        />
                      </div>
                    </div>

                    {/* Nombre de la plataforma */}
                    <div className="text-3xl font-bold mb-8 tracking-wide" style={{ 
                      color: primaryColor,
                      textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
                    }}>
                      Aprende y Aplica
                    </div>
                    
                    {/* Línea decorativa */}
                    <div className="w-64 h-1 mb-10 mx-auto" style={{ 
                      background: `linear-gradient(to right, transparent, ${accentColor}, transparent)`
                    }}></div>
                    
                    {/* Texto del certificado */}
                    <div className="text-lg mb-6 text-gray-700 max-w-3xl font-medium leading-relaxed px-8">
                      El presente certifica que
                    </div>
                    
                    <div className="text-4xl font-bold mb-6 px-6 py-3 border-4 rounded-lg" style={{ 
                      color: secondaryColor,
                      borderColor: primaryColor,
                      backgroundColor: 'rgba(30, 58, 138, 0.05)'
                    }}>
                      {studentName && studentName !== '[Nombre del Estudiante]' ? studentName : 'Nombre del Estudiante'}
                    </div>
                    
                    <div className="text-lg mb-6 text-gray-700 max-w-3xl font-medium leading-relaxed px-8">
                      ha completado exitosamente el curso
                    </div>
                    
                    <div className="text-2xl font-semibold mb-12 px-6 py-3 border-2 rounded" style={{ 
                      color: primaryColor,
                      borderColor: secondaryColor,
                      backgroundColor: 'rgba(96, 165, 250, 0.1)'
                    }}>
                      {courseName && courseName !== '[Nombre del Curso]' ? courseName : 'Nombre del Curso'}
                    </div>

                    {/* Firmas, QR Code y Fecha - Footer */}
                    <div className="flex justify-between items-center w-full mt-6 px-8 pb-4 border-t-2 pt-6" style={{ borderColor: accentColor }}>
                      {/* Firma del Instructor - Izquierda */}
                      <div className="text-center flex-1 flex flex-col items-center justify-center">
                        {renderInstructorSignature()}
                      </div>
                      
                      {/* QR Code - Centro */}
                      <div className="flex-shrink-0 mx-8 flex flex-col items-center justify-center">
                        <div className="bg-white p-3 rounded-lg border-2 shadow-lg" style={{ borderColor: primaryColor }}>
                          <QRCodeSVG
                            value={certificateHash 
                              ? `${process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://aprendeyaplica.ai')}/certificates/verify/${certificateHash}`
                              : `${process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://aprendeyaplica.ai')}/certificates/verify/[hash]`
                            }
                            size={110}
                            level="H"
                            includeMargin={true}
                            fgColor={primaryColor}
                            bgColor="#ffffff"
                          />
                        </div>
                      </div>
                      
                      {/* Fecha - Derecha */}
                      <div className="text-center flex-1 flex flex-col items-center justify-center">
                        <div className="text-sm font-semibold mb-3" style={{ color: primaryColor }}>
                          Fecha de Emisión
                        </div>
                        <div className="text-base font-medium text-gray-700 border-2 rounded px-4 py-2 inline-block" style={{ borderColor: secondaryColor }}>
                          {issueDate}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Decoraciones laterales */}
                  <div className="absolute left-8 top-1/2 transform -translate-y-1/2 w-12 h-32 opacity-20">
                    <div className="w-full h-full border-l-4" style={{ borderColor: accentColor }}></div>
                  </div>
                  <div className="absolute right-8 top-1/2 transform -translate-y-1/2 w-12 h-32 opacity-20">
                    <div className="w-full h-full border-r-4" style={{ borderColor: accentColor }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Botón para expandir */}
          {!isExpanded && (
            <div className="absolute top-4 right-4">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setExpandedTemplate(template.id)
                }}
                className="p-2 rounded-lg bg-white/90 hover:bg-white backdrop-blur-sm shadow-lg transition-colors"
                title="Ver certificado completo"
              >
                <Maximize2 className="w-5 h-5 text-gray-700" />
              </button>
            </div>
          )}
        </div>
      </div>
    )

    if (isExpanded) {
      return (
        <div className="fixed inset-0 bg-black/80 dark:bg-black/90 backdrop-blur-sm flex items-center justify-center z-[60] p-4" onClick={onClose}>
          <div className="bg-transparent rounded-2xl w-full max-w-5xl max-h-[95vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Botón de cerrar simple */}
            <div className="flex justify-end mb-4">
              <button
                onClick={onClose}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* Certificado completo */}
            <div className="p-6 overflow-auto flex-1 flex items-center justify-center">
              <div className="w-full max-w-4xl">
                {certificateContent}
              </div>
            </div>
          </div>
        </div>
      )
    }

    return certificateContent
  }

  // Si hay una plantilla expandida, mostrar solo la vista expandida
  if (expandedTemplate) {
    const template = templates.find(t => t.id === expandedTemplate)
    if (template) {
      return renderTemplatePreview(template, true)
    }
  }

  // Vista inicial: mostrar directamente la plantilla expandida
  const defaultTemplate = templates.find(t => t.id === selectedTemplate) || templates[0]
  if (defaultTemplate) {
    return renderTemplatePreview(defaultTemplate, true)
  }

  return null
}

