import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Cliente con service role key para operaciones administrativas
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

interface CertificateData {
  studentName: string
  courseName: string
  instructorName: string
  instructorSignatureUrl?: string | null
  instructorSignatureName?: string | null
  issueDate: string
  certificateHash?: string
}

interface GenerateCertificateResult {
  certificate_id: string
  certificate_url: string
  certificate_hash: string
}

/**
 * Verifica que el curso esté 100% completo
 */
async function verifyCourseCompletion(
  enrollmentId: string,
  courseId: string,
  userId: string
): Promise<{ isValid: boolean; error?: string }> {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll() {
          // Server Component - ignore
        },
      },
    }
  )

  // Verificar enrollment
  const { data: enrollment, error: enrollmentError } = await supabase
    .from('user_course_enrollments')
    .select('overall_progress_percentage, enrollment_status')
    .eq('enrollment_id', enrollmentId)
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .single()

  if (enrollmentError || !enrollment) {
    return { isValid: false, error: 'Enrollment no encontrado' }
  }

  // Verificar que el progreso sea 100%
  if (enrollment.overall_progress_percentage !== 100) {
    return { 
      isValid: false, 
      error: `El curso no está completo. Progreso actual: ${enrollment.overall_progress_percentage}%` 
    }
  }

  // Verificar que todas las lecciones publicadas estén completadas
  const { data: modules } = await supabase
    .from('course_modules')
    .select('module_id')
    .eq('course_id', courseId)
    .eq('is_published', true)

  if (!modules || modules.length === 0) {
    return { isValid: false, error: 'El curso no tiene módulos publicados' }
  }

  // Obtener todas las lecciones publicadas
  const { data: allLessons } = await supabase
    .from('course_lessons')
    .select('lesson_id')
    .in('module_id', modules.map((m: { module_id: string }) => m.module_id))
    .eq('is_published', true)

  if (!allLessons || allLessons.length === 0) {
    return { isValid: false, error: 'El curso no tiene lecciones publicadas' }
  }

  // Verificar que todas las lecciones estén completadas
  const { data: progress } = await supabase
    .from('user_lesson_progress')
    .select('lesson_id, is_completed')
    .eq('enrollment_id', enrollmentId)
    .in('lesson_id', allLessons.map((l: { lesson_id: string }) => l.lesson_id))

  const completedLessons = progress?.filter((p: { is_completed: boolean }) => p.is_completed) || []
  const allLessonsCompleted = completedLessons.length === allLessons.length

  if (!allLessonsCompleted) {
    return { 
      isValid: false, 
      error: `Faltan lecciones por completar. Completadas: ${completedLessons.length}/${allLessons.length}` 
    }
  }

  return { isValid: true }
}

/**
 * Obtiene los datos necesarios para generar el certificado
 */
async function getCertificateData(
  enrollmentId: string,
  courseId: string,
  userId: string
): Promise<{ data: CertificateData | null; error?: string }> {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll() {
          // Server Component - ignore
        },
      },
    }
  )

  // Obtener información del curso
  console.log('🔍 Obteniendo información del curso:', courseId)
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('id, title, instructor_id')
    .eq('id', courseId)
    .single()

  if (courseError || !course) {
    console.error('❌ Error obteniendo curso:', courseError)
    return { data: null, error: 'Curso no encontrado' }
  }

  console.log('✅ Curso obtenido:', {
    id: course.id,
    title: course.title || '(sin título)',
    instructor_id: course.instructor_id || '(sin instructor)'
  })

  // Obtener información del estudiante
  console.log('🔍 Obteniendo información del estudiante:', userId)
  const { data: student, error: studentError } = await supabase
    .from('users')
    .select('id, display_name, first_name, last_name, username')
    .eq('id', userId)
    .single()

  if (studentError || !student) {
    console.error('❌ Error obteniendo estudiante:', studentError)
    return { data: null, error: 'Estudiante no encontrado' }
  }

  console.log('✅ Estudiante obtenido:', {
    id: student.id,
    display_name: student.display_name || '(sin display_name)',
    first_name: student.first_name || '(sin first_name)',
    last_name: student.last_name || '(sin last_name)',
    username: student.username || '(sin username)'
  })

  // Obtener información del instructor
  let instructorName = 'Instructor'
  let instructorSignatureUrl: string | null = null
  let instructorSignatureName: string | null = null

  if (course.instructor_id) {
    console.log('🔍 Obteniendo información del instructor:', course.instructor_id)
    const { data: instructor, error: instructorError } = await supabase
      .from('users')
      .select('id, display_name, first_name, last_name, username, signature_url, signature_name')
      .eq('id', course.instructor_id)
      .single()

    if (instructorError) {
      console.error('❌ Error obteniendo instructor:', instructorError)
      console.warn('⚠️ Se usará "Instructor" como nombre por defecto')
    } else if (instructor) {
      console.log('✅ Instructor obtenido:', {
        id: instructor.id,
        display_name: instructor.display_name || '(sin display_name)',
        first_name: instructor.first_name || '(sin first_name)',
        last_name: instructor.last_name || '(sin last_name)',
        username: instructor.username || '(sin username)',
        signature_url: instructor.signature_url ? 'Configurada' : '(sin signature_url)',
        signature_name: instructor.signature_name || '(sin signature_name)'
      })

      instructorName = instructor.display_name ||
        (instructor.first_name && instructor.last_name
          ? `${instructor.first_name} ${instructor.last_name}`
          : instructor.username || 'Instructor')
      instructorSignatureUrl = instructor.signature_url
      instructorSignatureName = instructor.signature_name

      console.log('   Nombre calculado del instructor:', instructorName)
    }
  } else {
    console.warn('⚠️ El curso no tiene instructor_id asignado')
  }

  // Nombre del estudiante
  const studentName = student.display_name ||
    (student.first_name && student.last_name
      ? `${student.first_name} ${student.last_name}`
      : student.username || 'Estudiante')

  console.log('   Nombre calculado del estudiante:', studentName)

  // Fecha de emisión
  const issueDate = new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const certificateData = {
    studentName,
    courseName: course.title || 'Curso',
    instructorName,
    instructorSignatureUrl,
    instructorSignatureName,
    issueDate
  }

  console.log('✅ getCertificateData completado exitosamente')

  return {
    data: certificateData
  }
}

/**
 * Genera el HTML del certificado basado en la plantilla
 */
function generateCertificateHTML(data: CertificateData, certificateHash: string): string {
  const primaryColor = '#1e3a8a'
  const secondaryColor = '#60a5fa'
  const accentColor = '#d4af37'
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://aprendeyaplica.ai'
  const verifyUrl = `${baseUrl}/certificates/verify/${certificateHash}`

  // Renderizar firma del instructor
  let signatureHTML = ''
  if (data.instructorSignatureName && !data.instructorSignatureUrl) {
    signatureHTML = `
      <div style="text-align: center; margin-bottom: 12px; font-size: 16px; font-weight: bold; color: ${primaryColor};">
        ${data.instructorSignatureName.trim()}
      </div>
      <div style="width: 160px; height: 1px; border-bottom: 4px solid ${primaryColor}; margin: 0 auto 12px;"></div>
      <div style="font-size: 12px; color: #666;">Instructor</div>
    `
  } else if (data.instructorSignatureUrl) {
    signatureHTML = `
      <div style="margin-bottom: 12px; display: flex; justify-content: center;">
        <img src="${data.instructorSignatureUrl}" alt="Firma del instructor" style="height: 80px; width: 192px; object-fit: contain;" />
      </div>
      <div style="width: 160px; height: 1px; border-bottom: 4px solid ${primaryColor}; margin: 0 auto 12px;"></div>
      <div style="text-align: center; font-size: 16px; font-weight: bold; color: ${primaryColor};">
        ${data.instructorName}
      </div>
    `
  } else {
    signatureHTML = `
      <div style="height: 64px; width: 160px; border-bottom: 4px solid ${primaryColor}; margin: 0 auto 12px;"></div>
      <div style="font-size: 14px; font-weight: 600; margin-bottom: 4px; color: ${primaryColor};">
        [Firma del Instructor]
      </div>
      <div style="font-size: 12px; color: #666;">Instructor</div>
    `
  }

  // Generar QR code usando una API externa (qrcode.tec-it.com)
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(verifyUrl)}`

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      size: A4 landscape;
      margin: 0;
    }
    body {
      margin: 0;
      padding: 0;
      font-family: 'Arial', sans-serif;
      background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%);
    }
    .certificate {
      width: 297mm;
      height: 210mm;
      position: relative;
      background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%);
      box-sizing: border-box;
    }
    /* Bordes decorativos */
    .border-outer {
      position: absolute;
      inset: 0;
      border: 32px solid ${primaryColor};
    }
    .border-middle {
      position: absolute;
      inset: 8px;
      border: 16px solid ${secondaryColor};
    }
    .border-inner {
      position: absolute;
      inset: 16px;
      border: 8px solid ${accentColor};
    }
    /* Esquinas decorativas */
    .corner {
      position: absolute;
      width: 64px;
      height: 64px;
      border: 4px solid ${accentColor};
    }
    .corner-tl {
      top: 0;
      left: 0;
      border-right: none;
      border-bottom: none;
    }
    .corner-tr {
      top: 0;
      right: 0;
      border-left: none;
      border-bottom: none;
    }
    .corner-bl {
      bottom: 0;
      left: 0;
      border-right: none;
      border-top: none;
    }
    .corner-br {
      bottom: 0;
      right: 0;
      border-left: none;
      border-top: none;
    }
    /* Contenido */
    .content {
      position: relative;
      z-index: 10;
      padding: 48px;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      text-align: center;
    }
    .logo-section {
      margin-bottom: 24px;
    }
    .logo {
      width: 80px;
      height: 80px;
      margin: 0 auto;
      position: relative;
    }
    .logo-blur {
      position: absolute;
      inset: 0;
      background-color: ${primaryColor};
      opacity: 0.3;
      filter: blur(16px);
    }
    .logo-img {
      width: 80px;
      height: 80px;
      object-fit: contain;
      position: relative;
      z-index: 10;
    }
    .platform-name {
      font-size: 48px;
      font-weight: bold;
      color: ${primaryColor};
      margin-bottom: 32px;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
      letter-spacing: 2px;
    }
    .decorative-line {
      width: 256px;
      height: 4px;
      margin: 0 auto 40px;
      background: linear-gradient(to right, transparent, ${accentColor}, transparent);
    }
    .certificate-text {
      font-size: 18px;
      color: #374151;
      margin-bottom: 24px;
      max-width: 768px;
      font-weight: 500;
      line-height: 1.6;
    }
    .student-name {
      font-size: 64px;
      font-weight: bold;
      color: ${secondaryColor};
      margin-bottom: 24px;
      padding: 12px 24px;
      border: 16px solid ${primaryColor};
      border-radius: 8px;
      background-color: rgba(30, 58, 138, 0.05);
      display: inline-block;
    }
    .course-name {
      font-size: 32px;
      font-weight: 600;
      color: ${primaryColor};
      margin-bottom: 48px;
      padding: 12px 24px;
      border: 8px solid ${secondaryColor};
      border-radius: 4px;
      background-color: rgba(96, 165, 250, 0.1);
      display: inline-block;
    }
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      margin-top: 24px;
      padding-top: 24px;
      border-top: 2px solid ${accentColor};
    }
    .footer-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .signature-section {
      text-align: center;
    }
    .qr-section {
      flex-shrink: 0;
      margin: 0 32px;
    }
    .qr-code {
      background: white;
      padding: 12px;
      border-radius: 8px;
      border: 2px solid ${primaryColor};
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .qr-code img {
      width: 110px;
      height: 110px;
      display: block;
    }
    .date-section {
      text-align: center;
    }
    .date-label {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 12px;
      color: ${primaryColor};
    }
    .date-value {
      font-size: 16px;
      font-weight: 500;
      color: #374151;
      border: 2px solid ${secondaryColor};
      border-radius: 4px;
      padding: 8px 16px;
      display: inline-block;
    }
    /* Decoraciones laterales */
    .side-decoration {
      position: absolute;
      width: 48px;
      height: 128px;
      opacity: 0.2;
    }
    .side-decoration-left {
      left: 32px;
      top: 50%;
      transform: translateY(-50%);
      border-left: 4px solid ${accentColor};
    }
    .side-decoration-right {
      right: 32px;
      top: 50%;
      transform: translateY(-50%);
      border-right: 4px solid ${accentColor};
    }
  </style>
</head>
<body>
  <div class="certificate">
    <!-- Bordes decorativos -->
    <div class="border-outer"></div>
    <div class="border-middle"></div>
    <div class="border-inner"></div>
    
    <!-- Esquinas decorativas -->
    <div class="corner corner-tl"></div>
    <div class="corner corner-tr"></div>
    <div class="corner corner-bl"></div>
    <div class="corner corner-br"></div>
    
    <!-- Decoraciones laterales -->
    <div class="side-decoration side-decoration-left"></div>
    <div class="side-decoration side-decoration-right"></div>
    
    <!-- Contenido principal -->
    <div class="content">
      <!-- Logo y nombre de plataforma -->
      <div class="logo-section">
        <div class="logo">
          <div class="logo-blur"></div>
          <img src="${baseUrl}/icono.png" alt="Aprende y Aplica" class="logo-img" />
        </div>
        <div class="platform-name">Aprende y Aplica</div>
        <div class="decorative-line"></div>
      </div>
      
      <!-- Texto del certificado -->
      <div>
        <div class="certificate-text">
          El presente certifica que
        </div>
        <div class="student-name">
          ${data.studentName}
        </div>
        <div class="certificate-text">
          ha completado exitosamente el curso
        </div>
        <div class="course-name">
          ${data.courseName}
        </div>
      </div>
      
      <!-- Footer con firma, QR y fecha -->
      <div class="footer">
        <!-- Firma del Instructor -->
        <div class="footer-section signature-section">
          ${signatureHTML}
        </div>
        
        <!-- QR Code -->
        <div class="footer-section qr-section">
          <div class="qr-code">
            <img src="${qrCodeUrl}" alt="QR Code de validación" />
          </div>
        </div>
        
        <!-- Fecha -->
        <div class="footer-section date-section">
          <div class="date-label">Fecha de Emisión</div>
          <div class="date-value">${data.issueDate}</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `
}

/**
 * Genera un certificado PDF directamente usando pdfkit
 */
async function generateCertificatePDF(data: CertificateData, certificateHash: string): Promise<Buffer> {
  // Importar pdfkit dinámicamente
  const PDFDocument = require('pdfkit')
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
  const studentName = data.studentName || 'Estudiante'
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
  const courseName = data.courseName || 'Curso'
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
  if (data.instructorSignatureName && !data.instructorSignatureUrl) {
    doc.fontSize(16)
      .fillColor(primaryColor)
      .font('Helvetica-Bold')
      .text(data.instructorSignatureName.trim(), signatureX, footerY + 20, { align: 'center', width: 200 })
  } else if (data.instructorSignatureUrl) {
    // Nota: pdfkit no puede cargar imágenes desde URLs directamente
    // Por ahora, solo mostramos el nombre del instructor
    doc.fontSize(16)
      .fillColor(primaryColor)
      .font('Helvetica-Bold')
      .text(data.instructorName, signatureX, footerY + 60, { align: 'center', width: 200 })
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
    .text(data.issueDate, dateX, footerY + 40, { align: 'center', width: 150 })
  
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
  return Buffer.concat(buffers)
}

/**
 * Genera un certificado PDF y lo guarda en Supabase Storage
 */
export async function generateCertificate(
  enrollmentId: string,
  courseId: string,
  userId: string
): Promise<GenerateCertificateResult> {
  // Verificar que no exista un certificado previo
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll() {
          // Server Component - ignore
        },
      },
    }
  )
  
  const { data: existingCertificate } = await supabase
    .from('user_course_certificates')
    .select('certificate_id, certificate_url, certificate_hash')
    .eq('enrollment_id', enrollmentId)
    .single()

  if (existingCertificate) {
    // Verificar si el certificado existente tiene una URL placeholder
    const isPlaceholder = existingCertificate.certificate_url &&
                          existingCertificate.certificate_url.includes('placeholder-certificate')

    if (!isPlaceholder) {
      // El certificado existe y es válido, retornarlo
      console.log('✅ Certificado válido existente encontrado:', existingCertificate.certificate_id)
      return {
        certificate_id: existingCertificate.certificate_id,
        certificate_url: existingCertificate.certificate_url,
        certificate_hash: existingCertificate.certificate_hash || ''
      }
    }

    // Si tiene placeholder, continuaremos y regeneraremos el certificado
    // Nota: No podemos eliminar porque la tabla es append-only (certificate_ledger)
    console.log('⚠️ Certificado existente con URL placeholder detectado:', existingCertificate.certificate_id)
    console.log('   URL placeholder:', existingCertificate.certificate_url)
    console.log('   Regenerando certificado (actualizando registro existente)...')
  }

  // Verificar que el curso esté 100% completo
  const verification = await verifyCourseCompletion(enrollmentId, courseId, userId)
  if (!verification.isValid) {
    throw new Error(verification.error || 'El curso no está completo')
  }

  // Obtener datos para el certificado
  const { data: certificateData, error: dataError } = await getCertificateData(
    enrollmentId,
    courseId,
    userId
  )

  if (dataError || !certificateData) {
    throw new Error(dataError || 'Error al obtener datos del certificado')
  }

  // Logging detallado de los datos obtenidos
  console.log('📋 Datos del certificado obtenidos:')
  console.log('   - Estudiante:', certificateData.studentName)
  console.log('   - Curso:', certificateData.courseName)
  console.log('   - Instructor:', certificateData.instructorName)
  console.log('   - Firma URL:', certificateData.instructorSignatureUrl || 'No configurada')
  console.log('   - Firma Nombre:', certificateData.instructorSignatureName || 'No configurada')
  console.log('   - Fecha:', certificateData.issueDate)

  // Validar que los datos no sean placeholders
  const hasPlaceholderData =
    certificateData.courseName === 'Curso' ||
    certificateData.instructorName === 'Instructor' ||
    certificateData.studentName === 'Estudiante' ||
    !certificateData.courseName ||
    !certificateData.instructorName ||
    !certificateData.studentName

  if (hasPlaceholderData) {
    console.error('❌ ERROR: Datos del certificado contienen placeholders o están vacíos')
    console.error('   - Curso:', certificateData.courseName)
    console.error('   - Instructor:', certificateData.instructorName)
    console.error('   - Estudiante:', certificateData.studentName)
    throw new Error(
      'No se puede generar el certificado con datos incompletos. ' +
      'Verifica que el curso tenga un título configurado, ' +
      'que el instructor esté asignado correctamente, ' +
      'y que el estudiante tenga un nombre configurado en su perfil.'
    )
  }

  console.log('✅ Validación de datos del certificado exitosa')

  // Obtener plantilla por defecto (puede ser null si no existe)
  // Nota: certificate_templates requiere organization_id, así que puede que no haya plantillas
  // Por ahora, permitimos que template_id sea null
  let defaultTemplateId: string | null = null
  try {
    const { data: defaultTemplate } = await supabaseAdmin
      .from('certificate_templates')
      .select('id')
      .eq('is_default', true)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle()
    
    if (defaultTemplate) {
      defaultTemplateId = defaultTemplate.id
    }
  } catch (templateError) {
    console.warn('No se pudo obtener plantilla de certificado (puede que no exista):', templateError)
    // Continuar sin plantilla, template_id será null
  }

  // Preparar el nombre del archivo (path plano para evitar problemas con subdirectorios)
  const fileName = `${userId}-${courseId}-${Date.now()}.pdf`
  console.log('📁 Nombre del archivo para subir:', fileName)

  let certificate: any

  if (existingCertificate) {
    // Si ya existe un certificado (con placeholder), reutilizarlo
    console.log('Reutilizando registro de certificado existente:', existingCertificate.certificate_id)
    certificate = existingCertificate
  } else {
    // Insertar primero el registro del certificado con una URL temporal válida
    // Esto nos permite obtener el hash real generado por la BD
    // Usamos una URL placeholder que será actualizada después
    const tempUrl = `https://placeholder-certificate-${userId}-${courseId}.pdf`

    console.log('Insertando registro de certificado para obtener hash...')

    const { data: newCertificate, error: insertError } = await supabaseAdmin
      .from('user_course_certificates')
      .insert({
        user_id: userId,
        course_id: courseId,
        enrollment_id: enrollmentId,
        certificate_url: tempUrl, // URL temporal, se actualizará después
        template_id: defaultTemplateId,
      })
      .select('certificate_id, certificate_hash, certificate_url')
      .single()

    if (insertError || !newCertificate) {
      console.error('Error al crear registro de certificado:', insertError)
      throw new Error(`Error al crear certificado: ${insertError?.message || 'Error desconocido'}`)
    }

    certificate = newCertificate
  }

  // El hash se genera automáticamente por la función de la BD
  let realHash = certificate.certificate_hash || ''
  if (!realHash) {
    throw new Error('No se pudo generar el hash del certificado')
  }

  console.log('Hash del certificado obtenido:', realHash.substring(0, 16) + '...')

  // Generar el PDF con el hash real
  console.log('Generando PDF con hash real...')
  const pdfBuffer = await generateCertificatePDF(certificateData, realHash)
  
  // Validar que el PDF se generó correctamente
  if (!pdfBuffer || pdfBuffer.length === 0) {
    throw new Error('Error: El PDF generado está vacío')
  }
  
  if (pdfBuffer.length < 1000) {
    console.warn('Advertencia: El PDF generado es muy pequeño (' + pdfBuffer.length + ' bytes). Puede estar corrupto.')
  }
  
  console.log('PDF generado exitosamente. Tamaño:', pdfBuffer.length, 'bytes')
  console.log('Nombre del archivo:', fileName)
  
  // Verificar que el bucket existe antes de intentar subir
  console.log('Verificando que el bucket "certificates" existe...')
  const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets()
  
  if (bucketsError) {
    console.error('Error listando buckets:', bucketsError)
    throw new Error(`Error al verificar buckets: ${bucketsError.message}`)
  }
  
  const certificatesBucket = buckets?.find(b => b.name === 'certificates')
  if (!certificatesBucket) {
    throw new Error(
      'El bucket "certificates" no existe en Supabase Storage. ' +
      'Por favor, crea el bucket "certificates" en Supabase Storage con políticas de acceso público para lectura. ' +
      'Consulta docs/SETUP_CERTIFICATES_BUCKET.md para más información.'
    )
  }
  
  console.log('Bucket "certificates" encontrado. Id:', certificatesBucket.id, 'Public:', certificatesBucket.public)
  
  // Subir el PDF a Supabase Storage
  let finalUrl: string
  
  try {
    console.log('Iniciando subida del PDF a Supabase Storage...')
    console.log('📤 Path completo:', fileName)
    console.log('📦 Tamaño del buffer:', pdfBuffer.length, 'bytes')

    // Intentar subir el PDF al bucket 'certificates'
    const uploadResult = await supabaseAdmin.storage
      .from('certificates')
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: true  // Permite crear rutas automáticamente y sobrescribir en regeneración
      })
    
    if (uploadResult.error) {
      const error = uploadResult.error as any
      console.error('Error en uploadResult:', {
        error: uploadResult.error,
        message: error.message || uploadResult.error.message,
        statusCode: error.statusCode,
        name: error.name || uploadResult.error.name
      })
      throw uploadResult.error
    }
    
    if (!uploadResult.data) {
      throw new Error('Error: uploadResult.data es null o undefined')
    }
    
    console.log('PDF subido exitosamente. Path:', uploadResult.data.path)
    
    // Obtener URL pública del PDF
    const { data: urlData } = supabaseAdmin.storage
      .from('certificates')
      .getPublicUrl(fileName)
    
    if (!urlData?.publicUrl) {
      console.error('Error: No se pudo obtener la URL pública. urlData:', urlData)
      throw new Error('No se pudo obtener la URL pública del certificado')
    }
    
    finalUrl = urlData.publicUrl
    console.log('URL pública generada exitosamente:', finalUrl.substring(0, 100) + '...')
    
    // Actualizar el registro con la URL real
    // IMPORTANTE: Al actualizar la URL, el hash cambiará automáticamente porque se calcula usando la URL
    const { data: updatedCertificate, error: updateError } = await supabaseAdmin
      .from('user_course_certificates')
      .update({ certificate_url: finalUrl })
      .eq('certificate_id', certificate.certificate_id)
      .select('certificate_hash')
      .single()
    
    if (updateError || !updatedCertificate) {
      console.error('Error al actualizar URL del certificado:', updateError)
      // Intentar eliminar el archivo subido si falla la actualización
      try {
        await supabaseAdmin.storage
          .from('certificates')
          .remove([fileName])
      } catch (cleanupError) {
        console.error('Error al limpiar archivo subido:', cleanupError)
      }
      throw new Error(`Error al actualizar certificado: ${updateError?.message || 'Error desconocido'}`)
    }
    
    console.log('URL del certificado actualizada exitosamente:', finalUrl)
    
    // Obtener el hash actualizado (el hash cambió porque la URL cambió)
    const updatedHash = updatedCertificate.certificate_hash || ''
    
    // Si el hash cambió, regenerar el PDF con el hash correcto
    if (updatedHash !== realHash && updatedHash.length > 0) {
      console.log('Hash cambió después de actualizar URL, regenerando PDF con hash correcto...')
      try {
        // Regenerar el PDF con el hash correcto
        const correctPdfBuffer = await generateCertificatePDF(certificateData, updatedHash)
        
        // Validar que el PDF regenerado tiene contenido
        if (!correctPdfBuffer || correctPdfBuffer.length === 0) {
          console.warn('Error: El PDF regenerado está vacío. Continuando con el PDF original.')
        } else {
          console.log('PDF regenerado. Tamaño:', correctPdfBuffer.length, 'bytes')
          
          // Re-subir el PDF con el hash correcto (usar upload con upsert)
          const { error: updatePdfError, data: updateData } = await supabaseAdmin.storage
            .from('certificates')
            .upload(fileName, correctPdfBuffer, {
              contentType: 'application/pdf',
              cacheControl: '3600',
              upsert: true
            })
          
          if (updatePdfError) {
            const error = updatePdfError as any
            console.error('Error al actualizar el PDF con el hash correcto:', {
              error: updatePdfError,
              message: error.message || updatePdfError.message,
              statusCode: error.statusCode
            })
            // Continuar con el PDF original, el hash seguirá siendo correcto en la BD
          } else if (updateData) {
            console.log('✅ PDF regenerado exitosamente con hash correcto. Path:', updateData.path)
          } else {
            console.warn('Advertencia: updateData es null después de subir el PDF regenerado')
          }
        }
      } catch (regenerateError) {
        console.warn('Error al regenerar PDF con hash real:', regenerateError)
        // Continuar con el PDF original
      }
      
      // Usar el hash actualizado
      realHash = updatedHash
    }
    
  } catch (storageError: any) {
    console.error('❌ Error al subir PDF a Storage:', {
      error: storageError,
      message: storageError?.message,
      statusCode: storageError?.statusCode,
      name: storageError?.name,
      stack: storageError?.stack
    })
    
    // Determinar el tipo de error
    let errorMessage = 'Error al subir certificado PDF'
    let shouldDeleteRecord = true

    if (storageError?.message?.includes('Bucket not found') ||
        storageError?.statusCode === 404 ||
        storageError?.statusCode === 400 ||
        storageError?.message?.includes('not found')) {
      errorMessage =
        'El bucket "certificates" no existe en Supabase Storage. ' +
        'Por favor, crea el bucket "certificates" en Supabase Storage con políticas de acceso público para lectura. ' +
        'Consulta docs/SETUP_CERTIFICATES_BUCKET.md para más información.'
    } else if (storageError?.statusCode === 403 || storageError?.message?.includes('permission') || storageError?.message?.includes('forbidden')) {
      console.error('Error de permisos detectado. Verificando políticas RLS del bucket...')
      errorMessage =
        'Error de permisos al subir el certificado. ' +
        'Verifica que las políticas RLS del bucket "certificates" permitan la subida usando el service role key. ' +
        `Error: ${storageError?.message || 'Error desconocido'}`
    } else {
      errorMessage = `Error al subir certificado PDF: ${storageError?.message || 'Error desconocido'}`
    }

    // NOTA: No podemos eliminar el registro porque la tabla es append-only
    // El registro quedará con URL placeholder y será regenerado en el siguiente intento
    console.log('⚠️ El certificado quedará con URL placeholder y será regenerado en el siguiente intento')
    console.log('   (La tabla user_course_certificates es append-only, no permite DELETE)')

    throw new Error(errorMessage)
  }

  // Verificar que la URL final no sea un placeholder
  if (finalUrl.includes('placeholder-certificate')) {
    console.error('ERROR CRÍTICO: La URL del certificado sigue siendo un placeholder:', finalUrl)
    // NOTA: No podemos eliminar el registro porque la tabla es append-only
    // El registro quedará con URL placeholder y será regenerado en el siguiente intento
    console.log('⚠️ El certificado quedará con URL placeholder (tabla append-only, no permite DELETE)')
    throw new Error('Error al generar certificado: La URL del certificado no es válida. Verifica que el bucket "certificates" existe en Supabase Storage.')
  }

  console.log('Certificado generado exitosamente:', {
    certificate_id: certificate.certificate_id,
    hash: realHash.substring(0, 16) + '...',
    url: finalUrl.substring(0, 80) + '...'
  })

  return {
    certificate_id: certificate.certificate_id,
    certificate_url: finalUrl,
    certificate_hash: realHash
  }
}

