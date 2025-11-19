'use client';

import { useState } from 'react';
import { supabaseStorageService, AttachmentData } from '../../../core/services/supabaseStorage';

export interface ProcessedAttachment {
  attachment_url: string | null;
  attachment_type: string;
  attachment_data: any;
}

export function useAttachments() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processAttachment = async (attachmentData: AttachmentData): Promise<ProcessedAttachment | null> => {
    setIsProcessing(true);
    setError(null);

    try {
      // console.log('🎥 [YOUTUBE] Processing attachment - TIPO INICIAL:', attachmentData.type, attachmentData);
      
      // Si es YouTube, obtener información adicional
      if (attachmentData.type === 'youtube' && attachmentData.url) {
        // console.log('🎥 [YOUTUBE] Procesando YouTube URL:', attachmentData.url);
        const videoId = supabaseStorageService.extractYouTubeVideoId(attachmentData.url);
        // console.log('🎥 [YOUTUBE] Video ID extraído:', videoId);
        
        if (videoId) {
          try {
            const videoInfo = await supabaseStorageService.getYouTubeVideoInfo(videoId);
            // console.log('🎥 [YOUTUBE] Información del video:', videoInfo);
            attachmentData = {
              ...attachmentData,
              videoId,
              title: videoInfo.title,
              thumbnail: videoInfo.thumbnail
            };
          } catch (error) {
            // console.warn('🎥 [YOUTUBE] Error obteniendo info del video, usando datos básicos:', error);
            // Si falla la API, usar datos básicos
            attachmentData = {
              ...attachmentData,
              videoId,
              title: 'Video de YouTube',
              thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
            };
          }
        } else {
          // console.warn('🎥 [YOUTUBE] No se pudo extraer videoId de la URL');
        }
      }

      const result = await supabaseStorageService.processAttachment(attachmentData);
      // console.log('🎥 [YOUTUBE] Attachment processed successfully:', result);
      
      // Log específico para YouTube
      if (attachmentData.type === 'youtube') {
        // console.log('🎥 [YOUTUBE] Resultado final:', {
        //   attachment_url: result.attachment_url,
        //   attachment_type: result.attachment_type,
        //   attachment_data: result.attachment_data
        // });
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al procesar adjunto';
      setError(errorMessage);
      // console.error('Error processing attachment:', err);
      // console.error('Attachment data that caused error:', attachmentData);
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  const createPostWithAttachment = async (
    communitySlug: string,
    content: string,
    attachmentsData?: AttachmentData | AttachmentData[]
  ) => {
    setIsProcessing(true);
    setError(null);

    try {
      let processedAttachments: ProcessedAttachment[] = [];

      // Procesar adjuntos si existen
      if (attachmentsData) {
        const attachmentsArray = Array.isArray(attachmentsData) ? attachmentsData : [attachmentsData];
        
        // Procesar todos los adjuntos en paralelo
        const processingPromises = attachmentsArray.map(async (att, index) => {
          try {
            return await processAttachment(att);
          } catch (error) {
            console.error(`Error procesando adjunto ${index + 1}:`, error);
            return null;
          }
        });
        const results = await Promise.all(processingPromises);
        
        // Filtrar los adjuntos que se procesaron correctamente
        processedAttachments = results.filter((att): att is ProcessedAttachment => att !== null);
        
        if (processedAttachments.length === 0 && attachmentsArray.length > 0) {
          throw new Error('Error al procesar los adjuntos. Ningún adjunto se pudo procesar correctamente.');
        }
        
        // Si algunos adjuntos fallaron pero otros no, continuar con los que funcionaron
        if (processedAttachments.length < attachmentsArray.length) {
          console.warn(`Algunos adjuntos fallaron. Procesados: ${processedAttachments.length}/${attachmentsArray.length}`);
        }
      }

      // Si hay múltiples adjuntos, almacenarlos como array en attachment_data
      // Si hay un solo adjunto, mantener la estructura original para compatibilidad
      let attachment_url: string | null = null;
      let attachment_type: string | null = null;
      let attachment_data: any = null;

      if (processedAttachments.length === 1) {
        // Un solo adjunto: mantener estructura original
        attachment_url = processedAttachments[0].attachment_url;
        attachment_type = processedAttachments[0].attachment_type;
        attachment_data = processedAttachments[0].attachment_data;
      } else if (processedAttachments.length > 1) {
        // Múltiples adjuntos: almacenar como array en attachment_data
        // Usar el tipo del primer adjunto, pero asegurarse de que sea válido para la BD
        // Tipos válidos según BD: 'image', 'video', 'document', 'link', 'poll'
        const firstType = processedAttachments[0].attachment_type;
        const validTypes = ['image', 'video', 'document', 'link', 'poll'];
        
        // Si el tipo no es válido (ej: 'youtube'), usar 'image' como fallback
        attachment_type = validTypes.includes(firstType) ? firstType : 'image';
        
        attachment_data = {
          isMultiple: true,
          attachments: processedAttachments.map(att => ({
            attachment_url: att.attachment_url,
            attachment_type: att.attachment_type,
            attachment_data: att.attachment_data
          }))
        };
        // Para múltiples adjuntos, usar la URL del primero como principal (para compatibilidad)
        attachment_url = processedAttachments[0]?.attachment_url || null;
      }

      // Crear el post
      const postData: any = {
        content: content.trim(),
        title: null,
        attachment_url,
        attachment_type,
        attachment_data
      };

      // Validar que postData sea serializable
      try {
        JSON.stringify(postData);
      } catch (error) {
        console.error('Error serializando postData:', error);
        throw new Error('Error al preparar los datos del post. Los adjuntos pueden contener datos no válidos.');
      }

      const response = await fetch(`/api/communities/${communitySlug}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido al crear el post' }));
        console.error('Error response:', errorData);
        throw new Error(errorData.error || errorData.details || 'Error al crear el post');
      }

      const result = await response.json();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al crear el post';
      setError(errorMessage);
      // console.error('Error creating post:', err);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    processAttachment,
    createPostWithAttachment,
    isProcessing,
    error,
    clearError: () => setError(null)
  };
}
