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
    attachmentData?: AttachmentData
  ) => {
    setIsProcessing(true);
    setError(null);

    try {
      let processedAttachment = null;

      // Procesar adjunto si existe
      if (attachmentData) {
        processedAttachment = await processAttachment(attachmentData);
        if (!processedAttachment) {
          throw new Error('Error al procesar el adjunto');
        }
      }

      // Crear el post
      const postData: any = {
        content: content.trim(),
        title: null,
        attachment_url: processedAttachment?.attachment_url || null,
        attachment_type: processedAttachment?.attachment_type || null,
        attachment_data: processedAttachment?.attachment_data || null
      };

      const response = await fetch(`/api/communities/${communitySlug}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear el post');
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
