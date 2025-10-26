'use client'

import { useState, useRef } from 'react'
import { 
  PhotoIcon, 
  XMarkIcon, 
  CloudArrowUpIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { SupabaseStorageService } from '../services/supabaseStorage.service'

interface ImageUploadProps {
  value: string
  onChange: (url: string) => void
  onError?: (error: string) => void
  communityName?: string
  disabled?: boolean
}

export function ImageUpload({ 
  value, 
  onChange, 
  onError, 
  communityName = 'comunidad',
  disabled = false 
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(value || null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (file: File) => {
    // Validar archivo
    const validation = SupabaseStorageService.validateImageFile(file)
    if (!validation.valid) {
      onError?.(validation.error!)
      return
    }

    setIsUploading(true)
    
    try {
      // Crear preview local
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)

      // Subir a Supabase
      const result = await SupabaseStorageService.uploadCommunityImage(file, communityName)
      
      if (result.success && result.url) {
        onChange(result.url)
      } else {
        onError?.(result.error || 'Error al subir la imagen')
        setPreview(null)
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      onError?.('Error inesperado al subir la imagen')
      setPreview(null)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (disabled || isUploading) return

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled && !isUploading) {
      setDragActive(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleRemoveImage = () => {
    setPreview(null)
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
    <div className="space-y-3">
      {/* Input oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled}
      />

      {/* Área de subida */}
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200
          ${dragActive 
            ? 'border-blue-400 bg-blue-50/10' 
            : 'border-gray-600 hover:border-gray-500'
          }
          ${disabled || isUploading 
            ? 'opacity-50 cursor-not-allowed' 
            : 'hover:bg-gray-700/20'
          }
        `}
      >
        {preview ? (
          // Preview de imagen
          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-32 object-cover rounded-lg"
            />
            {!disabled && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleRemoveImage()
                }}
                className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
                type="button"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        ) : (
          // Estado vacío
          <div className="space-y-3">
            <div className="mx-auto w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
              {isUploading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
              ) : (
                <PhotoIcon className="h-6 w-6 text-gray-400" />
              )}
            </div>
            
            <div>
              <p className="text-sm font-medium text-white">
                {isUploading ? 'Subiendo imagen...' : 'Subir imagen de la comunidad'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Arrastra una imagen aquí o haz clic para seleccionar
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PNG, JPG, WebP, GIF hasta 5MB
              </p>
            </div>
          </div>
        )}

        {/* Indicador de drag */}
        {dragActive && (
          <div className="absolute inset-0 bg-blue-500/10 rounded-xl flex items-center justify-center">
            <div className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
              <CloudArrowUpIcon className="h-5 w-5" />
              <span className="text-sm font-medium">Suelta la imagen aquí</span>
            </div>
          </div>
        )}
      </div>

      {/* URL actual (solo para mostrar) */}
      {value && (
        <div className="bg-gray-700/30 rounded-lg p-3">
          <p className="text-xs text-gray-400 mb-1">URL de la imagen:</p>
          <p className="text-xs text-gray-300 break-all font-mono">
            {value}
          </p>
        </div>
      )}
    </div>
  )
}
