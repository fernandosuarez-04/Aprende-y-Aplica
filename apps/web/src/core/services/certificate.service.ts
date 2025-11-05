import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

// Import dinámico de jsPDF para evitar problemas en servidor
let jsPDF: any = null
async function getJsPDF() {
  if (!jsPDF) {
    jsPDF = (await import('jspdf')).default
  }
  return jsPDF
}

interface GenerateCertificateParams {
  userId: string
  courseId: string
  enrollmentId: string
  courseTitle: string
  instructorName: string
  userName: string
}

/**
 * Servicio para generar certificados automáticamente cuando un curso se completa
 */
export class CertificateService {
  /**
   * Genera un certificado PDF y lo guarda en Supabase Storage
   */
  static async generateCertificate(params: GenerateCertificateParams): Promise<string | null> {
    try {
      const { userId, courseId, enrollmentId, courseTitle, instructorName, userName } = params
      const supabase = await createClient()

      // Verificar si ya existe un certificado para este usuario y curso
      const { data: existingCertificate } = await supabase
        .from('user_course_certificates')
        .select('certificate_id, certificate_url')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .single()

      if (existingCertificate) {
        logger.log('Certificado ya existe para este usuario y curso:', existingCertificate.certificate_id)
        return existingCertificate.certificate_url
      }

      // Generar PDF del certificado
      const pdfBuffer = await this.createCertificatePDF({
        courseTitle,
        instructorName,
        userName,
        issueDate: new Date().toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      })

      // Generar nombre único para el archivo
      const timestamp = Date.now()
      const sanitizedCourseTitle = courseTitle
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 50)
      // El path debe ser relativo al bucket (no incluir el nombre del bucket)
      const filePath = `${userId}/${sanitizedCourseTitle}-${timestamp}.pdf`

      // Subir PDF al bucket de certificados
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('certificates')
        .upload(filePath, pdfBuffer, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'application/pdf'
        })

      if (uploadError) {
        logger.error('Error subiendo certificado a storage:', uploadError)
        // Intentar con otro nombre de bucket común
        const alternativeBuckets = ['certificate', 'certificados', 'certificate-files']
        let uploaded = false

        for (const bucketName of alternativeBuckets) {
          const { data: altData, error: altError } = await supabase.storage
            .from(bucketName)
            .upload(filePath, pdfBuffer, {
              cacheControl: '3600',
              upsert: false,
              contentType: 'application/pdf'
            })

          if (!altError && altData) {
            logger.log(`Certificado subido exitosamente al bucket: ${bucketName}`)
            uploaded = true
            const { data: urlData } = supabase.storage
              .from(bucketName)
              .getPublicUrl(filePath)
            
            if (urlData?.publicUrl) {
              return urlData.publicUrl
            }
          }
        }

        if (!uploaded) {
          throw new Error(`Error al subir certificado: ${uploadError.message}`)
        }
      }

      // Obtener URL pública del certificado
      const { data: urlData } = supabase.storage
        .from('certificates')
        .getPublicUrl(filePath)

      if (!urlData?.publicUrl) {
        throw new Error('Error al obtener URL pública del certificado')
      }

      logger.log('Certificado generado exitosamente:', urlData.publicUrl)
      return urlData.publicUrl
    } catch (error) {
      logger.error('Error generando certificado:', error)
      return null
    }
  }

  /**
   * Crea el PDF del certificado usando jsPDF
   */
  private static async createCertificatePDF(params: {
    courseTitle: string
    instructorName: string
    userName: string
    issueDate: string
  }): Promise<Buffer> {
    const { courseTitle, instructorName, userName, issueDate } = params

    // Importar jsPDF dinámicamente
    const jsPDFClass = await getJsPDF()
    
    // Crear documento PDF (A4: 210mm x 297mm)
    const doc = new jsPDFClass({
      orientation: 'landscape',
      unit: 'mm',
      format: [297, 210] // A4 landscape
    })

    // Configuración de colores
    const primaryColor = [59, 130, 246] // blue-500
    const textColor = [31, 41, 55] // gray-800
    const borderColor = [229, 231, 235] // gray-200

    // Fondo con borde decorativo
    doc.setDrawColor(...borderColor)
    doc.setLineWidth(2)
    doc.rect(10, 10, 277, 190)

    // Borde interno más fino
    doc.setLineWidth(0.5)
    doc.rect(15, 15, 267, 180)

    // Título principal
    doc.setFontSize(48)
    doc.setTextColor(...primaryColor)
    doc.setFont('helvetica', 'bold')
    doc.text('CERTIFICADO', 148.5, 50, { align: 'center' })

    // Texto de certificación
    doc.setFontSize(16)
    doc.setTextColor(...textColor)
    doc.setFont('helvetica', 'normal')
    doc.text('Este certificado acredita que', 148.5, 70, { align: 'center' })

    // Nombre del estudiante
    doc.setFontSize(28)
    doc.setTextColor(...primaryColor)
    doc.setFont('helvetica', 'bold')
    doc.text(userName.toUpperCase(), 148.5, 95, { align: 'center', maxWidth: 250 })

    // Texto intermedio
    doc.setFontSize(16)
    doc.setTextColor(...textColor)
    doc.setFont('helvetica', 'normal')
    doc.text('ha completado exitosamente el curso', 148.5, 115, { align: 'center' })

    // Nombre del curso
    doc.setFontSize(24)
    doc.setTextColor(...primaryColor)
    doc.setFont('helvetica', 'bold')
    doc.text(courseTitle, 148.5, 135, { align: 'center', maxWidth: 250 })

    // Línea de separación
    doc.setDrawColor(...borderColor)
    doc.setLineWidth(0.5)
    doc.line(50, 150, 247, 150)

    // Instructor
    doc.setFontSize(14)
    doc.setTextColor(...textColor)
    doc.setFont('helvetica', 'normal')
    doc.text('Instructor:', 60, 165)
    doc.setFont('helvetica', 'bold')
    doc.text(instructorName, 60, 175)

    // Fecha
    doc.setFont('helvetica', 'normal')
    doc.text('Fecha de emisión:', 180, 165)
    doc.setFont('helvetica', 'bold')
    doc.text(issueDate, 180, 175)

    // Convertir a Buffer
    const pdfOutput = doc.output('arraybuffer')
    return Buffer.from(pdfOutput)
  }

  /**
   * Crea el registro del certificado en la base de datos
   */
  static async createCertificateRecord(
    userId: string,
    courseId: string,
    enrollmentId: string,
    certificateUrl: string
  ): Promise<string | null> {
    try {
      const supabase = await createClient()

      // Verificar si ya existe un certificado
      const { data: existing } = await supabase
        .from('user_course_certificates')
        .select('certificate_id')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .single()

      if (existing) {
        logger.log('Certificado ya existe en BD:', existing.certificate_id)
        return existing.certificate_id
      }

      // Crear registro del certificado
      // El hash se generará automáticamente por la función certificate_hash_immutable
      const { data: certificate, error: insertError } = await supabase
        .from('user_course_certificates')
        .insert({
          user_id: userId,
          course_id: courseId,
          enrollment_id: enrollmentId,
          certificate_url: certificateUrl,
          issued_at: new Date().toISOString()
        })
        .select('certificate_id')
        .single()

      if (insertError) {
        logger.error('Error creando registro de certificado:', insertError)
        throw insertError
      }

      logger.log('Registro de certificado creado exitosamente:', certificate.certificate_id)
      return certificate.certificate_id
    } catch (error) {
      logger.error('Error creando registro de certificado:', error)
      return null
    }
  }
}

