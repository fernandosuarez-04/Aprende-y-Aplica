/**
 * Script para generar un certificado de prueba
 * Este script genera un PDF de ejemplo con datos de prueba
 * 
 * Uso: node scripts/generate-test-certificate.js
 * 
 * Nota: Este script debe ejecutarse desde el directorio raíz del proyecto
 * y requiere que jsPDF esté instalado en apps/web
 */

const fs = require('fs');
const path = require('path');
const { createRequire } = require('module');

// Función auxiliar para dibujar círculos
function drawCircle(doc, x, y, radius, style = 'FD') {
  try {
    if (typeof doc.ellipse === 'function') {
      doc.ellipse(x, y, radius, radius, style);
      return;
    }
  } catch (e) {
    // Continuar con método alternativo
  }
  
  const sides = 64;
  const step = (2 * Math.PI) / sides;
  const points = [];
  
  for (let i = 0; i <= sides; i++) {
    const angle = i * step;
    points.push([x + radius * Math.cos(angle), y + radius * Math.sin(angle)]);
  }
  
  if (style.includes('D')) {
    for (let i = 0; i < points.length - 1; i++) {
      doc.line(points[i][0], points[i][1], points[i + 1][0], points[i + 1][1]);
    }
  }
  
  if (style.includes('F')) {
    for (let r = radius; r > 0; r -= 0.3) {
      const currentPoints = [];
      for (let i = 0; i <= sides; i++) {
        const angle = i * step;
        currentPoints.push([x + r * Math.cos(angle), y + r * Math.sin(angle)]);
      }
      for (let i = 0; i < currentPoints.length - 1; i++) {
        doc.line(currentPoints[i][0], currentPoints[i][1], currentPoints[i + 1][0], currentPoints[i + 1][1]);
      }
    }
  }
}

function drawCircleSimple(doc, x, y, radius) {
  doc.rect(x - radius, y - radius, radius * 2, radius * 2, 'F');
}

async function generateTestCertificate() {
  try {
    console.log('📄 Generando certificado de prueba...');
    
    // Obtener la ruta al node_modules de apps/web
    const webNodeModulesPath = path.join(__dirname, '..', 'apps', 'web', 'node_modules');
    const requireWeb = createRequire(path.join(webNodeModulesPath, '..'));
    
    // Importar jsPDF desde apps/web/node_modules
    let jsPDF;
    try {
      jsPDF = requireWeb('jspdf');
    } catch (e) {
      console.error('❌ Error: No se pudo importar jsPDF. Asegúrate de que esté instalado en apps/web');
      console.error('   Ejecuta: cd apps/web && npm install jspdf');
      process.exit(1);
    }
    
    // Si es un módulo ES, obtener el default
    if (jsPDF.default) {
      jsPDF = jsPDF.default;
    }
    
    // Datos de prueba
    const params = {
      courseTitle: 'Introducción a la Inteligencia Artificial',
      instructorName: 'Dr. Juan Pérez',
      userName: 'María García López',
      issueDate: new Date().toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    };

    const { courseTitle, instructorName, userName, issueDate } = params;

    // Crear documento PDF (A4: 210mm x 297mm)
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [297, 210] // A4 landscape
    });

    // Configuración de colores mejorados
    const primaryColor = [37, 99, 235]; // blue-600
    const secondaryColor = [59, 130, 246]; // blue-500
    const accentColor = [99, 102, 241]; // indigo-500
    const textColor = [30, 41, 59]; // slate-800
    const lightGray = [241, 245, 249]; // slate-100
    const borderColor = [203, 213, 225]; // slate-300

    // Fondo con gradiente simulado
    doc.setFillColor(...lightGray);
    doc.rect(0, 0, 297, 210, 'F');

    // Borde exterior decorativo
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(3);
    doc.rect(8, 8, 281, 194);

    // Borde medio con patrón decorativo
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(1.5);
    doc.rect(12, 12, 273, 186);

    // Borde interno fino
    doc.setDrawColor(...accentColor);
    doc.setLineWidth(0.5);
    doc.rect(16, 16, 265, 178);

    // Decoraciones en las esquinas
    const cornerSize = 15;
    const cornerOffset = 20;
    
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(2);
    doc.line(cornerOffset, cornerOffset, cornerOffset + cornerSize, cornerOffset);
    doc.line(cornerOffset, cornerOffset, cornerOffset, cornerOffset + cornerSize);
    
    doc.line(297 - cornerOffset - cornerSize, cornerOffset, 297 - cornerOffset, cornerOffset);
    doc.line(297 - cornerOffset, cornerOffset, 297 - cornerOffset, cornerOffset + cornerSize);
    
    doc.line(cornerOffset, 210 - cornerOffset, cornerOffset + cornerSize, 210 - cornerOffset);
    doc.line(cornerOffset, 210 - cornerOffset - cornerSize, cornerOffset, 210 - cornerOffset);
    
    doc.line(297 - cornerOffset - cornerSize, 210 - cornerOffset, 297 - cornerOffset, 210 - cornerOffset);
    doc.line(297 - cornerOffset, 210 - cornerOffset - cornerSize, 297 - cornerOffset, 210 - cornerOffset);

    // Líneas decorativas horizontales superiores
    doc.setDrawColor(...accentColor);
    doc.setLineWidth(0.5);
    doc.line(50, 35, 247, 35);
    doc.line(55, 38, 242, 38);

    // Sello decorativo circular
    const sealX = 148.5;
    const sealY = 180;
    const sealRadius = 12;
    
    doc.setDrawColor(...primaryColor);
    doc.setFillColor(...lightGray);
    doc.setLineWidth(2);
    drawCircle(doc, sealX, sealY, sealRadius, 'FD');
    
    doc.setFontSize(8);
    doc.setTextColor(...primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text('APRENDE', sealX, sealY - 3, { align: 'center' });
    doc.text('Y APLICA', sealX, sealY + 1, { align: 'center' });
    doc.text('✓', sealX, sealY + 5, { align: 'center' });

    // Título principal con sombra simulada
    doc.setFontSize(52);
    doc.setTextColor(...primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text('CERTIFICADO', 148.5, 52, { align: 'center' });
    
    // Sombra del título
    doc.setFontSize(52);
    doc.setTextColor(200, 200, 200);
    doc.text('CERTIFICADO', 149, 52.5, { align: 'center' });

    // Línea decorativa bajo el título
    doc.setDrawColor(...secondaryColor);
    doc.setLineWidth(1);
    doc.line(60, 58, 237, 58);
    
    // Puntos decorativos
    doc.setFillColor(...secondaryColor);
    drawCircleSimple(doc, 65, 58, 1.5);
    drawCircleSimple(doc, 232, 58, 1.5);

    // Texto de certificación
    doc.setFontSize(14);
    doc.setTextColor(...textColor);
    doc.setFont('helvetica', 'italic');
    doc.text('Este certificado acredita que', 148.5, 72, { align: 'center' });

    // Nombre del estudiante
    doc.setFontSize(32);
    doc.setTextColor(...primaryColor);
    doc.setFont('helvetica', 'bold');
    
    // Líneas decorativas alrededor del nombre
    doc.setDrawColor(...accentColor);
    doc.setLineWidth(0.5);
    doc.line(40, 85, 257, 85);
    doc.line(40, 105, 257, 105);
    
    doc.text(userName.toUpperCase(), 148.5, 97, { align: 'center', maxWidth: 220 });

    // Texto intermedio
    doc.setFontSize(14);
    doc.setTextColor(...textColor);
    doc.setFont('helvetica', 'italic');
    doc.text('ha completado exitosamente el curso', 148.5, 115, { align: 'center' });

    // Nombre del curso
    doc.setFontSize(22);
    doc.setTextColor(...primaryColor);
    doc.setFont('helvetica', 'bold');
    
    // Fondo sutil para el nombre del curso
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...lightGray);
    doc.setLineWidth(0.5);
    doc.rect(40, 123, 217, 15, 'FD');
    
    doc.text(courseTitle, 148.5, 133, { align: 'center', maxWidth: 210 });

    // Línea de separación decorativa
    doc.setDrawColor(...secondaryColor);
    doc.setLineWidth(1);
    doc.line(50, 145, 100, 145);
    doc.line(197, 145, 247, 145);
    
    // Ornamentos en los extremos
    doc.setFillColor(...accentColor);
    drawCircleSimple(doc, 52, 145, 1.5);
    drawCircleSimple(doc, 98, 145, 1.5);
    drawCircleSimple(doc, 199, 145, 1.5);
    drawCircleSimple(doc, 245, 145, 1.5);

    // Sección de información inferior
    const infoY = 160;
    
    // Fondo para información del instructor
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.5);
    doc.rect(30, infoY, 110, 25, 'FD');
    
    // Fondo para información de fecha
    doc.rect(157, infoY, 110, 25, 'FD');

    // Instructor
    doc.setFontSize(11);
    doc.setTextColor(...textColor);
    doc.setFont('helvetica', 'normal');
    doc.text('Instructor del Curso', 85, infoY + 6, { align: 'center' });
    
    doc.setFontSize(13);
    doc.setTextColor(...primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text(instructorName, 85, infoY + 15, { align: 'center', maxWidth: 100 });

    // Fecha
    doc.setFontSize(11);
    doc.setTextColor(...textColor);
    doc.setFont('helvetica', 'normal');
    doc.text('Fecha de Emisión', 212, infoY + 6, { align: 'center' });
    
    doc.setFontSize(13);
    doc.setTextColor(...primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text(issueDate, 212, infoY + 15, { align: 'center', maxWidth: 100 });

    // Líneas decorativas inferiores
    doc.setDrawColor(...accentColor);
    doc.setLineWidth(0.5);
    doc.line(50, 195, 247, 195);
    doc.line(55, 198, 242, 198);

    // Texto de autenticación
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    doc.text('Este certificado puede ser verificado mediante su código único', 148.5, 202, { align: 'center' });

    // Guardar el PDF
    const outputDir = path.join(__dirname, '..');
    const outputPath = path.join(outputDir, 'certificado-prueba.pdf');
    
    // Asegurar que el directorio existe
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Guardar el PDF usando el método save que funciona en Node.js
    try {
      // Método alternativo: usar output y guardar manualmente
      const pdfOutput = doc.output('arraybuffer');
      fs.writeFileSync(outputPath, Buffer.from(pdfOutput));
      console.log(`✅ Archivo guardado correctamente`);
    } catch (error) {
      console.error('Error al guardar con arraybuffer, intentando método alternativo...');
      // Método alternativo
      const pdfBlob = doc.output('blob');
      if (pdfBlob) {
        const arrayBuffer = await pdfBlob.arrayBuffer();
        fs.writeFileSync(outputPath, Buffer.from(arrayBuffer));
      } else {
        // Último método: usar el método toString
        const pdfBase64 = doc.output('datauristring');
        const base64Data = pdfBase64.replace(/^data:application\/pdf;base64,/, '');
        fs.writeFileSync(outputPath, base64Data, 'base64');
      }
    }
    
    console.log('✅ Certificado generado exitosamente!');
    console.log(`📁 Archivo guardado en: ${outputPath}`);
    console.log(`\n📋 Datos del certificado de prueba:`);
    console.log(`   - Estudiante: ${userName}`);
    console.log(`   - Curso: ${courseTitle}`);
    console.log(`   - Instructor: ${instructorName}`);
    console.log(`   - Fecha: ${issueDate}`);
    
  } catch (error) {
    console.error('❌ Error al generar certificado:', error);
    process.exit(1);
  }
}

// Ejecutar el script
generateTestCertificate();

