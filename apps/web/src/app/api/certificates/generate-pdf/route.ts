import { NextRequest, NextResponse } from 'next/server'
// @ts-ignore - pdfkit no tiene tipos disponibles
import PDFDocument from 'pdfkit'
import { Readable } from 'stream'

export const runtime = 'nodejs'
export const maxDuration = 30

interface CertificateData {
  studentName: string
  courseName: string
  instructorName: string
  instructorSignatureUrl?: string | null
  instructorSignatureName?: string | null
  issueDate: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { certificateData, certificateHash }: { certificateData: CertificateData; certificateHash: string } = body

    if (!certificateData || !certificateHash) {
      return NextResponse.json(
        { error: 'Datos del certificado requeridos' },
        { status: 400 }
      )
    }

    // Crear un buffer para el PDF
    const buffers: Buffer[] = []
    const doc = new PDFDocument({
      size: [842, 595], // A4 landscape (297mm x 210mm en puntos)
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
      // Usar fuentes estándar que no requieren archivos .afm
      font: 'Helvetica'
    })

    // Colores del certificado
    const primaryColor = '#1e3a8a'
    const secondaryColor = '#60a5fa'
    const accentColor = '#d4af37'
    // Usar NEXT_PUBLIC_SITE_URL en producción, evitar localhost en QR codes
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('supabase.co', 'aprendeyaplica.ai') || 'https://aprendeyaplica.ai'
    const verifyUrl = `${baseUrl}/certificates/verify/${certificateHash}`

    // Recopilar datos del buffer
    doc.on('data', (chunk: Buffer) => buffers.push(chunk))
    
    // Generar el PDF
    // Bordes decorativos
    doc.rect(0, 0, 842, 595).strokeColor(primaryColor).lineWidth(32).stroke()
    doc.rect(8, 8, 826, 579).strokeColor(secondaryColor).lineWidth(16).stroke()
    doc.rect(16, 16, 810, 563).strokeColor(accentColor).lineWidth(8).stroke()

    // Esquinas decorativas
    doc.moveTo(0, 0).lineTo(64, 0).lineTo(64, 64).lineTo(0, 64).closePath().strokeColor(accentColor).lineWidth(4).stroke()
    doc.moveTo(842, 0).lineTo(778, 0).lineTo(778, 64).lineTo(842, 64).closePath().strokeColor(accentColor).lineWidth(4).stroke()
    doc.moveTo(0, 595).lineTo(64, 595).lineTo(64, 531).lineTo(0, 531).closePath().strokeColor(accentColor).lineWidth(4).stroke()
    doc.moveTo(842, 595).lineTo(778, 595).lineTo(778, 531).lineTo(842, 531).closePath().strokeColor(accentColor).lineWidth(4).stroke()

    // Logo y nombre de plataforma
    doc.fontSize(48)
      .fillColor(primaryColor)
      .text('Aprende y Aplica', 421, 100, { align: 'center', width: 800 })
    
    // Línea decorativa
    doc.moveTo(293, 150)
      .lineTo(549, 150)
      .strokeColor(accentColor)
      .lineWidth(4)
      .stroke()

    // Texto del certificado
    doc.fontSize(18)
      .fillColor('#374151')
      .text('El presente certifica que', 421, 200, { align: 'center', width: 800 })

    // Nombre del estudiante
    const studentName = certificateData.studentName || 'Estudiante'
    doc.fontSize(64)
      .fillColor(secondaryColor)
      .font('Helvetica-Bold')
      .text(studentName, 421, 250, { align: 'center', width: 700 })
    
    // Rectángulo alrededor del nombre del estudiante
    const studentNameWidth = doc.widthOfString(studentName, { width: 700 })
    const studentNameX = (842 - studentNameWidth - 48) / 2
    doc.rect(studentNameX - 12, 240, studentNameWidth + 48, 60)
      .strokeColor(primaryColor)
      .lineWidth(16)
      .stroke()

    // Texto "ha completado exitosamente el curso"
    doc.fontSize(18)
      .fillColor('#374151')
      .font('Helvetica')
      .text('ha completado exitosamente el curso', 421, 320, { align: 'center', width: 800 })

    // Nombre del curso
    const courseName = certificateData.courseName || 'Curso'
    doc.fontSize(32)
      .fillColor(primaryColor)
      .font('Helvetica-Bold')
      .text(courseName, 421, 370, { align: 'center', width: 700 })
    
    // Rectángulo alrededor del nombre del curso
    const courseNameWidth = doc.widthOfString(courseName, { width: 700 })
    const courseNameX = (842 - courseNameWidth - 48) / 2
    doc.rect(courseNameX - 12, 360, courseNameWidth + 48, 40)
      .strokeColor(secondaryColor)
      .lineWidth(8)
      .stroke()

    // Footer con firma, QR y fecha
    const footerY = 480
    doc.moveTo(100, footerY)
      .lineTo(742, footerY)
      .strokeColor(accentColor)
      .lineWidth(2)
      .stroke()

    // Firma del instructor (izquierda)
    const signatureX = 150
    if (certificateData.instructorSignatureName && !certificateData.instructorSignatureUrl) {
      doc.fontSize(16)
        .fillColor(primaryColor)
        .font('Helvetica-Bold')
        .text(certificateData.instructorSignatureName.trim(), signatureX, footerY + 20, { align: 'center', width: 200 })
    } else if (certificateData.instructorSignatureUrl) {
      // Aquí podrías cargar y mostrar la imagen de la firma
      // Por ahora, solo mostramos el nombre del instructor
      doc.fontSize(16)
        .fillColor(primaryColor)
        .font('Helvetica-Bold')
        .text(certificateData.instructorName, signatureX, footerY + 60, { align: 'center', width: 200 })
    }
    
    doc.moveTo(signatureX - 40, footerY + 40)
      .lineTo(signatureX + 40, footerY + 40)
      .strokeColor(primaryColor)
      .lineWidth(4)
      .stroke()
    
    doc.fontSize(12)
      .fillColor('#666666')
      .font('Helvetica')
      .text('Instructor', signatureX, footerY + 50, { align: 'center', width: 200 })

    // QR Code (centro) - Usar una API externa para generar el QR
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(verifyUrl)}`
    const qrX = 371
    
    // Rectángulo para el QR code
    doc.rect(qrX, footerY + 10, 110, 110)
      .strokeColor(primaryColor)
      .lineWidth(2)
      .stroke()
    
    // Nota: pdfkit no puede cargar imágenes desde URLs directamente
    // Necesitarías descargar la imagen primero o usar una librería adicional
    // Por ahora, solo dibujamos el rectángulo

    // Fecha (derecha)
    const dateX = 650
    doc.fontSize(14)
      .fillColor(primaryColor)
      .font('Helvetica-Bold')
      .text('Fecha de Emisión', dateX, footerY + 20, { align: 'center', width: 150 })
    
    doc.fontSize(16)
      .fillColor('#374151')
      .font('Helvetica')
      .text(certificateData.issueDate, dateX, footerY + 40, { align: 'center', width: 150 })
    
    // Rectángulo alrededor de la fecha
    doc.rect(dateX - 30, footerY + 35, 120, 30)
      .strokeColor(secondaryColor)
      .lineWidth(2)
      .stroke()

    // Finalizar el PDF
    doc.end()

    // Esperar a que se complete la generación
    await new Promise<void>((resolve) => {
      doc.on('end', () => resolve())
    })

    // Combinar todos los buffers
    const pdfBuffer = Buffer.concat(buffers)

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="certificado.pdf"`,
      },
    })
  } catch (error) {
    console.error('Error generando PDF:', error)
    return NextResponse.json(
      { 
        error: 'Error al generar el PDF',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}

