import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager, FileState } from '@google/generative-ai/server';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import os from 'os';

export const runtime = 'nodejs'; // Required for file system operations
export const maxDuration = 300; // 5 minutes max for processing

export async function POST(req: NextRequest) {
  try {
    const { videoUrl } = await req.json();

    if (!videoUrl) {
      return NextResponse.json(
        { error: 'Se requiere la URL del video' },
        { status: 400 }
      );
    }

    const googleApiKey = process.env.GOOGLE_API_KEY;
    if (!googleApiKey) {
      return NextResponse.json(
        { error: 'GOOGLE_API_KEY no configurada' },
        { status: 500 }
      );
    }

    console.log('🤖 Iniciando análisis de video con IA...');
    console.log('📹 URL:', videoUrl);

    // 1. Descargar el video temporalmente
    const tempDir = os.tmpdir();
    const fileName = `temp-video-${Date.now()}.mp4`;
    const filePath = join(tempDir, fileName);

    console.log('⬇️ Descargando video a:', filePath);
    
    const videoResponse = await fetch(videoUrl);
    if (!videoResponse.ok) {
      throw new Error(`Error al descargar video: ${videoResponse.statusText}`);
    }

    const videoBuffer = await videoResponse.arrayBuffer();
    await writeFile(filePath, Buffer.from(videoBuffer));

    // 2. Subir a Gemini File API
    const fileManager = new GoogleAIFileManager(googleApiKey);
    
    console.log('⬆️ Subiendo video a Gemini...');
    const uploadResult = await fileManager.uploadFile(filePath, {
      mimeType: 'video/mp4',
      displayName: 'Lesson Video',
    });

    const fileUri = uploadResult.file.uri;
    const uploadName = uploadResult.file.name;
    console.log('✅ Video subido a Gemini:', uploadName, fileUri);

    // 3. Esperar a que se procese
    let file = await fileManager.getFile(uploadName);
    while (file.state === FileState.PROCESSING) {
      console.log('⏳ Procesando video en Gemini...');
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Esperar 2s
      file = await fileManager.getFile(uploadName);
    }

    if (file.state === FileState.FAILED) {
      throw new Error('El procesamiento del video en Gemini falló.');
    }

    console.log('✅ Video listo para análisis.');

    // 4. Generar Transcripción y Resumen
    const genAI = new GoogleGenerativeAI(googleApiKey);
    const model = genAI.getGenerativeModel({ 
      model: process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp',
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const prompt = `
      Actúa como un asistente educativo experto encargado de procesar material didáctico.
      
      Analiza el video y la pista de audio proporcionada EXHAUSTIVAMENTE.
      
      Debes generar un objeto JSON con dos campos obligatorios:
      
      1. "transcript": La transcripción COMPLETA de todo lo que se dice en el video.
         - IMPORTANTE: No devuelvas un solo bloque masivo de texto.
         - Divide el texto en párrafos lógicos y legibles usando doble salto de línea (\\n\\n).
         - La lectura debe ser fluida y natural visualmente.
      
      2. "summary": Un resumen educativo, rico y MUY BIEN ESTRUCTURADO. 
         - EL FORMATO ES CRÍTICO: Usa Markdown para dar estructura visual.
         - Usa Títulos (###) para separar secciones (ej: Introducción, Conceptos Clave, Conclusión).
         - Usa **Negritas** para resaltar términos importantes.
         - Usa listas con viñetas (-) para enumerar características o pasos.
         - Debe ser un material de estudio listo para leer, no solo texto plano.

      Respuesta JSON esperada:
      {
        "transcript": "Párrafo 1...\\n\\nPárrafo 2...",
        "summary": "### Introducción\\nTexto...\\n\\n### Puntos Clave\\n- Item 1\\n- Item 2"
      }
    `;

    const result = await model.generateContent([
      { fileData: { mimeType: file.mimeType, fileUri: file.uri } },
      { text: prompt },
    ]);

    const responseText = result.response.text();
    const data = JSON.parse(responseText);

    // 5. Limpieza
    await fileManager.deleteFile(uploadName);
    await unlink(filePath);
    console.log('🧹 Archivos temporales eliminados.');

    return NextResponse.json({
      success: true,
      transcript: data.transcript,
      summary: data.summary,
    });

  } catch (error) {
    console.error('❌ Error processing video:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 }
    );
  }
}
