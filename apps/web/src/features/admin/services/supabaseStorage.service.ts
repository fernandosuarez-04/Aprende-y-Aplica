import { createClient } from '../../../lib/supabase/client'

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
      console.log('🔄 Intentando subir imagen...', { fileName: file.name, communityName })
      
      // Usar la API del servidor para evitar problemas de RLS
      const formData = new FormData()
      formData.append('file', file)
      formData.append('communityName', communityName)

      const response = await fetch('/api/admin/upload/community-image', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()
      console.log('📡 Respuesta de la API:', result)

      if (!response.ok) {
        console.error('❌ Error en la respuesta:', result)
        return {
          success: false,
          error: result.error || 'Error al subir la imagen'
        }
      }

      console.log('✅ Imagen subida exitosamente:', result.url)
      return {
        success: true,
        url: result.url
      }
    } catch (error) {
      console.error('💥 Error in SupabaseStorageService.uploadCommunityImage:', error)
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
        console.error('Error deleting file:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in SupabaseStorageService.deleteCommunityImage:', error)
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
