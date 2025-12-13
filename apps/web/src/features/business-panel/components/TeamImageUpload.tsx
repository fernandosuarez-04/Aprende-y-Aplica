'use client'

import { useState, useRef } from 'react'
import { Upload, Image as ImageIcon, X, AlertCircle, Info } from 'lucide-react'
import { motion } from 'framer-motion'

interface TeamImageUploadProps {
  value?: string
  onChange: (url: string) => void
  disabled?: boolean
  primaryColor?: string
  modalBg?: string
  modalBorder?: string
  textColor?: string
  sectionBg?: string
}

// Dimensiones recomendadas para imágenes de equipos
const RECOMMENDED_WIDTH = 512
const RECOMMENDED_HEIGHT = 512
const MIN_WIDTH = 256
const MIN_HEIGHT = 256
const MAX_WIDTH = 2048
const MAX_HEIGHT = 2048

export function TeamImageUpload({ 
  value, 
  onChange, 
  disabled = false,
  primaryColor = '#3b82f6',
  modalBg = 'rgba(15, 23, 42, 0.95)',
  modalBorder = 'rgba(51, 65, 85, 0.3)',
  textColor = '#f8fafc',
  sectionBg = 'rgba(15, 23, 42, 0.8)'
}: TeamImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const objectUrl = URL.createObjectURL(file)
      
      img.onload = () => {
        URL.revokeObjectURL(objectUrl)
        resolve({ width: img.width, height: img.height })
      }
      
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl)
        reject(new Error('No se pudo leer las dimensiones de la imagen'))
      }
      
      img.src = objectUrl
    })
  }

  const handleFileSelect = async (file: File) => {
    if (!file) return

    // Validar tipo de archivo
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setError('Tipo de archivo no válido. Solo se permiten imágenes (PNG, JPEG, JPG, GIF, WebP)')
      return
    }

    // Validar tamaño (máximo 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      setError('El archivo es demasiado grande. Máximo 10MB')
      return
    }

    setError(null)
    setIsUploading(true)
    setUploadProgress(10)

    try {
      // Validar dimensiones de la imagen
      const dimensions = await getImageDimensions(file)
      setUploadProgress(20)

      // Validar dimensiones mínimas
      if (dimensions.width < MIN_WIDTH || dimensions.height < MIN_HEIGHT) {
        setError(
          `La imagen es demasiado pequeña. Mínimo recomendado: ${MIN_WIDTH}x${MIN_HEIGHT}px. ` +
          `Tu imagen: ${dimensions.width}x${dimensions.height}px`
        )
        setIsUploading(false)
        setUploadProgress(0)
        return
      }

      // Validar dimensiones máximas
      if (dimensions.width > MAX_WIDTH || dimensions.height > MAX_HEIGHT) {
        setError(
          `La imagen es demasiado grande. Máximo permitido: ${MAX_WIDTH}x${MAX_HEIGHT}px. ` +
          `Tu imagen: ${dimensions.width}x${dimensions.height}px`
        )
        setIsUploading(false)
        setUploadProgress(0)
        return
      }

      // Validar que la imagen sea aproximadamente cuadrada (ratio entre 0.8 y 1.2)
      const aspectRatio = dimensions.width / dimensions.height
      const isSquare = aspectRatio >= 0.8 && aspectRatio <= 1.2

      if (!isSquare) {
        setError(
          `La imagen debe ser aproximadamente cuadrada (ratio 1:1). Recomendado: ${RECOMMENDED_WIDTH}x${RECOMMENDED_HEIGHT}px. ` +
          `Tu imagen: ${dimensions.width}x${dimensions.height}px`
        )
        setIsUploading(false)
        setUploadProgress(0)
        return
      }

      // Mostrar advertencia si no es el tamaño recomendado (pero permitir)
      const isRecommendedSize = 
        dimensions.width >= RECOMMENDED_WIDTH * 0.9 && 
        dimensions.width <= RECOMMENDED_WIDTH * 1.1 &&
        dimensions.height >= RECOMMENDED_HEIGHT * 0.9 && 
        dimensions.height <= RECOMMENDED_HEIGHT * 1.1

      if (!isRecommendedSize) {
        console.warn(
          `Dimensiones no óptimas. Recomendado: ${RECOMMENDED_WIDTH}x${RECOMMENDED_HEIGHT}px. ` +
          `Tu imagen: ${dimensions.width}x${dimensions.height}px`
        )
      }

      setUploadProgress(30)

      // Usar API route que tiene service role key para bypass RLS
      const formData = new FormData()
      formData.append('file', file)
      formData.append('bucket', 'Panel-Business')
      formData.append('folder', 'Teams')

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      setUploadProgress(70)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al subir la imagen')
      }

      const result = await response.json()

      if (!result.success || !result.url) {
        throw new Error('Error al obtener la URL de la imagen')
      }

      setUploadProgress(100)
      onChange(result.url)
      
      // Resetear progreso después de un momento
      setTimeout(() => {
        setIsUploading(false)
        setUploadProgress(0)
      }, 1000)

    } catch (err: any) {
      setError(err.message || 'Error al subir la imagen')
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleRemoveImage = () => {
    onChange('')
    setError(null)
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
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-2">
        <label className="block font-body text-sm font-semibold" style={{ color: textColor }}>
          Imagen o Icono del Equipo
        </label>
        <div className="group relative">
          <Info className="w-4 h-4 opacity-60 cursor-help" style={{ color: textColor }} />
          <div className="absolute right-0 top-full mt-2 w-72 p-3 rounded-lg border text-xs font-body opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 pointer-events-none" 
            style={{
              backgroundColor: modalBg,
              borderColor: modalBorder,
              color: textColor,
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
            }}>
            <p className="font-semibold mb-2">Especificaciones de la imagen:</p>
            <p className="mb-1">✅ <strong>Recomendado:</strong> {RECOMMENDED_WIDTH}x{RECOMMENDED_HEIGHT}px</p>
            <p className="mb-1">📏 <strong>Formato:</strong> Cuadrado (1:1)</p>
            <p className="mb-1">📐 <strong>Mínimo:</strong> {MIN_WIDTH}x{MIN_HEIGHT}px</p>
            <p className="mb-1">📐 <strong>Máximo:</strong> {MAX_WIDTH}x{MAX_HEIGHT}px</p>
            <p className="mt-2 text-xs opacity-75">La imagen se mostrará en formato cuadrado</p>
          </div>
        </div>
      </div>
      
      {/* Input oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {/* Área de carga o preview */}
      {!value ? (
        <div
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer
            ${disabled || isUploading
              ? 'opacity-50 cursor-not-allowed'
              : dragActive
              ? 'scale-[1.02]'
              : 'hover:scale-[1.01]'
            }
          `}
          style={{
            borderColor: dragActive ? primaryColor : modalBorder,
            backgroundColor: dragActive ? `${primaryColor}10` : sectionBg,
            color: textColor
          }}
        >
          {isUploading ? (
            <div className="space-y-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="mx-auto"
                style={{ width: '48px', height: '48px' }}
              >
                <Upload className="w-12 h-12 mx-auto" style={{ color: primaryColor }} />
              </motion.div>
              <div className="text-sm font-body">
                <div className="mb-2" style={{ color: textColor }}>Subiendo imagen...</div>
                <div className="w-full rounded-full h-2" style={{ backgroundColor: `${modalBorder}80` }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    transition={{ duration: 0.3 }}
                    className="h-2 rounded-full transition-all"
                    style={{ backgroundColor: primaryColor }}
                  />
                </div>
                <div className="text-xs mt-1 opacity-70">{uploadProgress}%</div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <Upload className={`w-12 h-12 mx-auto ${dragActive ? '' : 'opacity-70'}`} style={{ color: dragActive ? primaryColor : textColor }} />
              <div className="text-sm font-body">
                <div className="font-medium opacity-90">
                  {dragActive ? 'Suelta la imagen aquí' : 'Arrastra una imagen aquí o haz clic para seleccionar'}
                </div>
                <div className="text-xs mt-1 opacity-60 space-y-1">
                  <div>PNG, JPG, GIF, WebP (máximo 10MB)</div>
                  <div className="font-semibold">
                    Dimensiones recomendadas: {RECOMMENDED_WIDTH}x{RECOMMENDED_HEIGHT}px (cuadrado)
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Preview de imagen */
        <div className="relative group">
          <div className="relative rounded-xl overflow-hidden border bg-gray-800/30" style={{ borderColor: modalBorder }}>
            <div className="relative w-full flex items-center justify-center" style={{ aspectRatio: '1 / 1', maxHeight: '200px', minHeight: '150px' }}>
              <img
                src={value}
                alt="Preview del equipo"
                className="max-w-full max-h-full w-auto h-auto object-contain"
                style={{ maxWidth: '100%', maxHeight: '100%' }}
              />
            </div>
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  type="button"
                  onClick={handleClick}
                  disabled={disabled || isUploading}
                  className="px-4 py-2 rounded-lg text-sm font-body font-medium text-white transition-colors disabled:opacity-50"
                  style={{ backgroundColor: primaryColor }}
                >
                  Cambiar
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  type="button"
                  onClick={handleRemoveImage}
                  disabled={disabled || isUploading}
                  className="px-4 py-2 rounded-lg text-sm font-body font-medium text-white transition-colors disabled:opacity-50 bg-red-600 hover:bg-red-700"
                >
                  Eliminar
                </motion.button>
              </div>
            </div>
          </div>
          {/* Indicador de imagen subida */}
          <div className="absolute top-2 right-2 p-2 rounded-lg backdrop-blur-sm" style={{ backgroundColor: `${primaryColor}80` }}>
            <ImageIcon className="w-4 h-4 text-white" />
          </div>
        </div>
      )}

      {/* Mostrar error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-3 rounded-xl text-sm font-body border backdrop-blur-sm"
          style={{
            backgroundColor: 'rgba(127, 29, 29, 0.2)',
            borderColor: 'rgba(220, 38, 38, 0.3)',
            color: '#fca5a5'
          }}
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </motion.div>
      )}
    </div>
  )
}

