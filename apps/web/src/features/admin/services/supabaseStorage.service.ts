import { createClient } from '../../../lib/supabase/client'
import { logger } from '../../../lib/logger'

export interface UploadResult {
  success: boolean
  url?: string
  error?: string
}

export class SupabaseStorageService {
  static async uploadCommunityImage(
    file: File,
    communityName: string
  ): Promise<UploadResult> {
    try {
      logger.info('Uploading community image', { fileName: file.name, communityName })
      
      // Usar la API del servidor para evitar problemas de RLS
      const formData = new FormData()
      formData.append('file', file)
      formData.append('communityName', communityName)

      const response = await fetch('/api/admin/upload/community-image', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()
      logger.debug('API response received', { success: result.success })

      if (!response.ok) {
        logger.error('Error in API response', { error: result.error })
        return {
          success: false,
          error: result.error || 'Error al subir la imagen'
        }
      }

      logger.info('Image uploaded successfully', { hasUrl: !!result.url })
      return {
        success: true,
        url: result.url
      }
    } catch (error) {
      logger.error('Error in SupabaseStorageService.uploadCommunityImage', { error: error instanceof Error ? error.message : String(error) })
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      }
    }
  }

  static async deleteCommunityImage(imageUrl: string): Promise<boolean> {
    try {
      const supabase = createClient()
      
      // Extraer el nombre del archivo de la URL
      const urlParts = imageUrl.split('/')
      const fileName = urlParts[urlParts.length - 1]
      
      // Eliminar el archivo del bucket
      const { error } = await supabase.storage
        .from('community-images')
        .remove([fileName])

      if (error) {
        logger.error('Error deleting file', { error: error.message })
        return false
      }

      return true
    } catch (error) {
      logger.error('Error in SupabaseStorageService.deleteCommunityImage', { error: error instanceof Error ? error.message : String(error) })
      return false
    }
  }

  static validateImageFile(file: File): { valid: boolean; error?: string } {
    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Solo se permiten archivos de imagen (JPEG, PNG, WebP, GIF)'
      }
    }

    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'El archivo no puede ser mayor a 5MB'
      }
    }

    return { valid: true }
  }
}
