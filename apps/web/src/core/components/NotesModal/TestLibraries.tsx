'use client';

import React, { useState } from 'react';

export const TestLibraries: React.FC = () => {
  const [testResult, setTestResult] = useState<string>('');

  const testLibraries = async () => {
    try {
      setTestResult('Probando librerías...');
      
      // Probar jsPDF
      const { default: jsPDF } = await import('jspdf');
      const pdf = new jsPDF();
      pdf.text('Test PDF', 10, 10);
      const pdfData = pdf.output('datauristring');
      
      // Probar html2canvas
      const html2canvas = await import('html2canvas');
      const testDiv = document.createElement('div');
      testDiv.innerHTML = '<div style="width: 100px; height: 100px; background: red;">Test</div>';
      document.body.appendChild(testDiv);
      
      const canvas = await html2canvas.default(testDiv);
      const canvasData = canvas.toDataURL();
      
      document.body.removeChild(testDiv);
      
      setTestResult('✅ Ambas librerías funcionan correctamente!\n\n' +
        'jsPDF: ' + (pdfData ? 'OK' : 'Error') + '\n' +
        'html2canvas: ' + (canvasData ? 'OK' : 'Error'));
        
    } catch (error) {
      setTestResult('❌ Error al probar las librerías:\n' + (error as Error).message);
    }
  };

  return (
    <div className="p-4 bg-slate-800 rounded-lg">
      <h3 className="text-white text-lg font-semibold mb-4">Test de Librerías PDF</h3>
      <button
        onClick={testLibraries}
        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg mb-4"
      >
        Probar Librerías
      </button>
      {testResult && (
        <pre className="text-green-400 text-sm whitespace-pre-wrap bg-slate-900 p-3 rounded">
          {testResult}
        </pre>
      )}
    </div>
  );
};
