const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// console.log('📦 Instalando librerías para exportación PDF...');

try {
  // Verificar si estamos en el directorio correcto
  const packageJsonPath = path.join(__dirname, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    // console.error('❌ No se encontró package.json. Asegúrate de estar en el directorio correcto.');
    process.exit(1);
  }

  // Instalar las librerías
  // console.log('🔧 Instalando jspdf...');
  execSync('npm install jspdf@latest', { stdio: 'inherit', cwd: __dirname });
  
  // console.log('🔧 Instalando html2canvas...');
  execSync('npm install html2canvas@latest', { stdio: 'inherit', cwd: __dirname });
  
  // console.log('🔧 Instalando tipos de TypeScript...');
  execSync('npm install --save-dev @types/jspdf', { stdio: 'inherit', cwd: __dirname });

  // console.log('✅ Librerías instaladas correctamente!');
  // console.log('📋 Librerías instaladas:');
  // console.log('   - jspdf: Para generar PDFs');
  // console.log('   - html2canvas: Para convertir HTML a canvas');
  // console.log('   - @types/jspdf: Tipos de TypeScript para jspdf');
  
  // console.log('\n🚀 Ahora puedes usar el componente NotesModalWithLibraries.tsx');
  // console.log('   que incluye la funcionalidad de exportación a PDF con las librerías.');
  
} catch (error) {
  // console.error('❌ Error al instalar las librerías:', error.message);
  process.exit(1);
}
