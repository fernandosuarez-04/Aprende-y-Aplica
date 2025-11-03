'use client'

import { useState } from 'react'
import { Youtube, Video, Link as LinkIcon } from 'lucide-react'

interface VideoProviderSelectorProps {
  provider: 'youtube' | 'vimeo' | 'direct' | 'custom'
  videoProviderId: string
  onProviderChange: (provider: 'youtube' | 'vimeo' | 'direct' | 'custom') => void
  onVideoIdChange: (id: string) => void
  disabled?: boolean
}

export function VideoProviderSelector({
  provider,
  videoProviderId,
  onProviderChange,
  onVideoIdChange,
  disabled = false
}: VideoProviderSelectorProps) {
  const [uploading, setUploading] = useState(false)

  const handleFileUpload = async (file: File) => {
    if (!file) return

    // Validar tipo de video
    const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg']
    if (!allowedTypes.includes(file.type)) {
      alert('Tipo de video no válido. Solo se permiten MP4, WebM y OGG')
      return
    }

    // Validar tamaño (máximo 1GB)
    const maxSize = 1024 * 1024 * 1024 // 1GB
    if (file.size > maxSize) {
      alert('El video excede el tamaño máximo de 1GB')
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/admin/upload/course-videos', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Error al subir el video')
      }

      const result = await response.json()
      onVideoIdChange(result.url)
    } catch (err) {
      console.error('Error uploading video:', err)
      alert('Error al subir el video')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Selector de Proveedor */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Proveedor de Video
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onProviderChange('youtube')}
            disabled={disabled}
            className={`
              flex items-center space-x-2 p-3 rounded-lg border-2 transition-colors
              ${provider === 'youtube'
                ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <Youtube className="h-5 w-5 text-red-600 dark:text-red-400" />
            <span className="text-sm font-medium">YouTube</span>
          </button>

          <button
            type="button"
            onClick={() => onProviderChange('vimeo')}
            disabled={disabled}
            className={`
              flex items-center space-x-2 p-3 rounded-lg border-2 transition-colors
              ${provider === 'vimeo'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <Video className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium">Vimeo</span>
          </button>

          <button
            type="button"
            onClick={() => onProviderChange('direct')}
            disabled={disabled}
            className={`
              flex items-center space-x-2 p-3 rounded-lg border-2 transition-colors
              ${provider === 'direct'
                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <Video className="h-5 w-5 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium">Subir Video</span>
          </button>

          <button
            type="button"
            onClick={() => onProviderChange('custom')}
            disabled={disabled}
            className={`
              flex items-center space-x-2 p-3 rounded-lg border-2 transition-colors
              ${provider === 'custom'
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <LinkIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-medium">URL Personalizada</span>
          </button>
        </div>
      </div>

      {/* Input según el proveedor */}
      <div>
        {provider === 'youtube' && (
          <>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              ID o URL de YouTube
            </label>
            <input
              type="text"
              value={videoProviderId}
              onChange={(e) => onVideoIdChange(e.target.value)}
              placeholder="Ej: dQw4w9WgXcQ o https://www.youtube.com/watch?v=dQw4w9WgXcQ"
              disabled={disabled}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </>
        )}

        {provider === 'vimeo' && (
          <>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              ID o URL de Vimeo
            </label>
            <input
              type="text"
              value={videoProviderId}
              onChange={(e) => onVideoIdChange(e.target.value)}
              placeholder="Ej: 123456789 o https://vimeo.com/123456789"
              disabled={disabled}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </>
        )}

        {provider === 'direct' && (
          <>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Subir Video
            </label>
            <input
              type="file"
              accept="video/mp4,video/webm,video/ogg"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileUpload(file)
              }}
              disabled={disabled || uploading}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
            {uploading && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Subiendo video...
              </p>
            )}
          </>
        )}

        {provider === 'custom' && (
          <>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              URL del Video
            </label>
            <input
              type="url"
              value={videoProviderId}
              onChange={(e) => onVideoIdChange(e.target.value)}
              placeholder="https://ejemplo.com/video.mp4"
              disabled={disabled}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </>
        )}
      </div>
    </div>
  )
}

