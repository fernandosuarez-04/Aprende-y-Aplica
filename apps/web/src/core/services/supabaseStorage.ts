import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
});

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
  path?: string;
}

export interface AttachmentData {
  type: string;
  url?: string;
  name?: string;
  size?: number;
  mimeType?: string;
  // Para encuestas
  question?: string;
  options?: string[];
  duration?: number;
  // Para YouTube
  videoId?: string;
  title?: string;
  thumbnail?: string;
}

class SupabaseStorageService {
  /**
   * Sube un archivo a Supabase Storage usando API de Next.js
   */
  async uploadFile(
    file: File, 
    bucket: string, 
    folder: string = '', 
    fileName?: string
  ): Promise<UploadResult> {
    try {
      // Crear FormData para la subida
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', bucket);
      formData.append('folder', folder);

      // Subir archivo usando nuestra API de Next.js
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error uploading file:', errorData);
        return { success: false, error: errorData.error || 'Error al subir archivo' };
      }

      const result = await response.json();
      
      return {
        success: true,
        url: result.url,
        path: result.path
      };
    } catch (error) {
      console.error('Error in uploadFile:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      };
    }
  }

  /**
   * Determina el bucket correcto según el tipo de archivo
   */
  getBucketForType(type: string): string {
    // Todos los archivos van al bucket Community-thinks
    return 'Community-thinks';
  }

  /**
   * Determina el tipo de archivo basado en el MIME type
   */
  private getFileTypeFromMimeType(mimeType: string): string {
    if (mimeType.startsWith('image/')) {
      return 'image';
    } else if (mimeType.startsWith('video/')) {
      return 'video';
    } else if (mimeType.startsWith('audio/')) {
      return 'document'; // Tratar audio como documento
    } else {
      return 'document'; // Todo lo demás como documento
    }
  }

  /**
   * Procesa diferentes tipos de adjuntos
   */
  async processAttachment(attachmentData: AttachmentData): Promise<{
    attachment_url: string | null;
    attachment_type: string;
    attachment_data: any;
  }> {
    const { type } = attachmentData;
    console.log('🎥 [YOUTUBE] SupabaseStorage.processAttachment - TIPO RECIBIDO:', type, attachmentData);

    switch (type) {
      case 'image':
      case 'document':
      case 'video':
        // Para archivos, necesitamos subirlos primero
        if (attachmentData.url && attachmentData.name) {
          // Convertir data URL a File si es necesario
          const file = await this.dataURLToFile(attachmentData.url, attachmentData.name);
          
          // Determinar el tipo real basado en el MIME type del archivo
          const actualType = attachmentData.mimeType 
            ? this.getFileTypeFromMimeType(attachmentData.mimeType)
            : type;
          
          const bucket = this.getBucketForType(actualType);
          const folder = actualType === 'image' ? 'images' : actualType === 'video' ? 'videos' : 'documents';
          
          const uploadResult = await this.uploadFile(file, bucket, folder);
          
          if (uploadResult.success) {
            return {
              attachment_url: uploadResult.url!,
              attachment_type: actualType,
              attachment_data: {
                name: attachmentData.name,
                size: attachmentData.size,
                mimeType: attachmentData.mimeType,
                path: uploadResult.path
              }
            };
          } else {
            throw new Error(uploadResult.error || 'Error al subir archivo');
          }
        }
        break;

      case 'youtube':
        console.log('🎥 [YOUTUBE] Procesando caso YouTube:', attachmentData);
        const result = {
          attachment_url: attachmentData.url || null,
          attachment_type: 'youtube',
          attachment_data: {
            videoId: attachmentData.videoId,
            title: attachmentData.title,
            thumbnail: attachmentData.thumbnail,
            url: attachmentData.url
          }
        };
        console.log('🎥 [YOUTUBE] Resultado del caso YouTube:', result);
        return result;

      case 'link':
        return {
          attachment_url: attachmentData.url || null,
          attachment_type: 'link',
          attachment_data: {
            url: attachmentData.url,
            title: attachmentData.title
          }
        };

      case 'poll':
        // Inicializar la estructura votes con arrays vacíos para cada opción
        const initialVotes: { [key: string]: string[] } = {};
        if (attachmentData.options) {
          attachmentData.options.forEach((option: string) => {
            initialVotes[option] = [];
          });
        }

        return {
          attachment_url: null,
          attachment_type: 'poll',
          attachment_data: {
            question: attachmentData.question,
            options: attachmentData.options,
            duration: attachmentData.duration,
            votes: initialVotes,      // ✅ Inicializar votes
            userVotes: {}             // ✅ Inicializar userVotes
          }
        };

      default:
        throw new Error(`Tipo de adjunto no soportado: ${type}`);
    }

    throw new Error('Datos de adjunto inválidos');
  }

  /**
   * Convierte data URL a File
   */
  private async dataURLToFile(dataURL: string, fileName: string): Promise<File> {
    const response = await fetch(dataURL);
    const blob = await response.blob();
    return new File([blob], fileName, { type: blob.type });
  }

  /**
   * Extrae video ID de URL de YouTube
   */
  extractYouTubeVideoId(url: string): string | null {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }

  /**
   * Obtiene información de un video de YouTube
   */
  async getYouTubeVideoInfo(videoId: string): Promise<{
    title: string;
    thumbnail: string;
  }> {
    try {
      // Usar la API pública de YouTube para obtener información
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${process.env.NEXT_PUBLIC_YOUTUBE_API_KEY}&part=snippet`
      );
      
      if (!response.ok) {
        throw new Error('Error al obtener información del video');
      }

      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        const video = data.items[0];
        return {
          title: video.snippet.title,
          thumbnail: video.snippet.thumbnails.maxres?.url || video.snippet.thumbnails.high?.url
        };
      }

      throw new Error('Video no encontrado');
    } catch (error) {
      console.error('Error getting YouTube video info:', error);
      return {
        title: 'Video de YouTube',
        thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
      };
    }
  }
}

export const supabaseStorageService = new SupabaseStorageService();
