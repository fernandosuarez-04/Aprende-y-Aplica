'use client'

import { useState, useRef } from 'react'
import { PhotoIcon, XMarkIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline'
import { createClient } from '../../../lib/supabase/client'

interface ImageUploadProps {
  value?: string
  onChange: (url: string) => void
  bucket?: string
  folder?: string
  className?: string
  disabled?: boolean
}

export function ImageUpload({ 
  value, 
  onChange, 
  bucket = 'news', 
  folder = 'hero-images',
  className = '',
  disabled = false 
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      setError('Solo se permiten archivos de imagen')
      return
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen debe ser menor a 5MB')
      return
    }

    setError(null)
    setIsUploading(true)
    setUploadProgress(0)

    try {
      const supabase = createClient()
      
      // Generar nombre único para el archivo
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${folder}/${fileName}`

      // Subir archivo a Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        throw uploadError
      }

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath)

      setUploadProgress(100)
      onChange(publicUrl)
      
    } catch (err: any) {
      console.error('Error uploading image:', err)
      setError(err.message || 'Error al subir la imagen')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleRemoveImage = () => {
    onChange('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleClick = () => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click()
    }
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Input oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {/* Área de carga */}
      {!value ? (
        <div
          onClick={handleClick}
          className={`
            relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${disabled || isUploading 
              ? 'border-gray-600 bg-gray-800 cursor-not-allowed' 
              : 'border-gray-500 bg-gray-800 hover:border-blue-500 hover:bg-gray-750'
            }
          `}
        >
          {isUploading ? (
            <div className="space-y-3">
              <CloudArrowUpIcon className="mx-auto h-12 w-12 text-blue-500 animate-pulse" />
              <div className="text-sm text-gray-300">
                <div className="mb-2">Subiendo imagen...</div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <div className="text-xs text-gray-400 mt-1">{uploadProgress}%</div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
              <div className="text-sm text-gray-300">
                <div className="font-medium">Hacer clic para subir imagen</div>
                <div className="text-xs text-gray-400 mt-1">
                  PNG, JPG, GIF hasta 5MB
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Preview de imagen */
        <div className="relative">
          <img
            src={value}
            alt="Preview"
            className="w-full h-48 object-cover rounded-lg border border-gray-600"
          />
          <button
            type="button"
            onClick={handleRemoveImage}
            disabled={disabled || isUploading}
            className="absolute top-2 right-2 p-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded-full transition-colors"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
          
          {/* Botón para cambiar imagen */}
          <button
            type="button"
            onClick={handleClick}
            disabled={disabled || isUploading}
            className="absolute bottom-2 right-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white text-sm rounded transition-colors"
          >
            Cambiar
          </button>
        </div>
      )}

      {/* Mostrar error */}
      {error && (
        <div className="text-sm text-red-400 bg-red-900/20 border border-red-800 rounded p-2">
          {error}
        </div>
      )}
    </div>
  )
}