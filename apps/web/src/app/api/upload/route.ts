import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { createClient } from '@supabase/supabase-js';
import { 
  validateFile, 
  sanitizePath, 
  validateBucket, 
  generateSafeFileName,
  UPLOAD_CONFIG 
} from '@/lib/upload/validation';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Cliente con service role key para bypass de RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const bucket = formData.get('bucket') as string;
    const folder = formData.get('folder') as string || '';

    // ✅ Validación 1: Archivo presente
    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó archivo' }, { status: 400 });
    }

    // ✅ Validación 2: Bucket presente
    if (!bucket) {
      return NextResponse.json({ error: 'No se proporcionó bucket' }, { status: 400 });
    }

    // ✅ Validación 3: Bucket válido (whitelist)
    const bucketValidation = validateBucket(bucket);
    if (!bucketValidation.valid) {
      logger.warn('Intento de upload a bucket no permitido', { bucket });
      return NextResponse.json({ error: bucketValidation.error }, { status: 400 });
    }

    // ✅ Validación 4: Archivo válido (tamaño, tipo, extensión)
    const fileValidation = validateFile(file, {
      allowedTypes: UPLOAD_CONFIG.allowedMimeTypes.all,
      allowedExtensions: UPLOAD_CONFIG.allowedExtensions.all,
      maxSize: UPLOAD_CONFIG.maxFileSize
    });

    if (!fileValidation.valid) {
      logger.warn('Intento de upload de archivo inválido', { 
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        error: fileValidation.error
      });
      return NextResponse.json({ error: fileValidation.error }, { status: 400 });
    }

    // ✅ Validación 5: Sanitizar folder (prevenir path traversal)
    const sanitizedFolder = sanitizePath(folder);
    
    // Log de seguridad si el folder fue modificado
    if (sanitizedFolder !== folder && folder) {
      logger.warn('Path traversal attempt detected', {
        originalFolder: folder,
        sanitizedFolder: sanitizedFolder
      });
    }

    // ✅ Generar nombre único y seguro para el archivo
    const fileName = generateSafeFileName(file.name);
    const filePath = sanitizedFolder ? `${sanitizedFolder}/${fileName}` : fileName;

    // ✅ Log de seguridad: Registrar intento de upload exitoso
    logger.info('Upload attempt validated successfully', {
      originalFileName: file.name,
      generatedFileName: fileName,
      originalFolder: folder,
      sanitizedFolder: sanitizedFolder,
      fileType: file.type,
      fileSize: file.size,
      bucket: bucket,
      filePath: filePath
    });

    // Subir archivo usando service role key
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      logger.error('Error uploading file to Supabase:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // ✅ Log de seguridad: Upload completado
    logger.info('File uploaded successfully', {
      fileName: fileName,
      filePath: filePath,
      bucket: bucket
    });

    // Obtener URL pública
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      path: filePath,
      name: file.name,
      size: file.size,
      type: file.type,
      // ✅ Información adicional de seguridad
      validation: {
        sanitized: sanitizedFolder !== folder,
        bucket: bucket,
        maxSizeAllowed: UPLOAD_CONFIG.maxFileSize
      }
    });

  } catch (error) {
    logger.error('Error in upload API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' }, 
      { status: 500 }
    );
  }
}

