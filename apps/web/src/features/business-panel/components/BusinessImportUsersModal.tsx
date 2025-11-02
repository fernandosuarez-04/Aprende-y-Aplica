'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Upload, Download, FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { Button } from '@aprende-y-aplica/ui'

interface BusinessImportUsersModalProps {
  isOpen: boolean
  onClose: () => void
  onImportComplete: () => void
}

interface ImportResult {
  imported: number
  errors: number
  total: number
  details: Array<{ row: number; error: string; data: any }>
}

export function BusinessImportUsersModal({ isOpen, onClose, onImportComplete }: BusinessImportUsersModalProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropAreaRef = useRef<HTMLDivElement>(null)

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch('/api/business/users/template', {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Error al descargar la plantilla')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'plantilla-importacion-usuarios.csv'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al descargar la plantilla')
    }
  }

  const handleFileSelect = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setError('El archivo debe ser un CSV (.csv)')
      return
    }

    await processFile(file)
  }

  const processFile = async (file: File) => {
    setIsImporting(true)
    setError(null)
    setImportResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/business/users/import', {
        method: 'POST',
        credentials: 'include',
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al importar usuarios')
      }

      if (data.success && data.result) {
        setImportResult(data.result)
        if (data.result.imported > 0) {
          onImportComplete()
        }
      } else {
        throw new Error('Error en la respuesta del servidor')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al importar usuarios')
    } finally {
      setIsImporting(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleReset = () => {
    setError(null)
    setImportResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleClose = () => {
    handleReset()
    onClose()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop con blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 bg-carbon-900/80 backdrop-blur-md"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', duration: 0.3 }}
          className="relative rounded-2xl shadow-2xl border w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col z-10"
          style={{ 
            backgroundColor: '#1e293b',
            borderColor: '#334155'
          }}
        >
          {/* Header */}
          <div className="relative border-b p-6" style={{ 
            backgroundColor: '#0f172a',
            borderColor: '#334155'
          }}>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-success flex items-center justify-center shadow-lg">
                  <Upload className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Importar Usuarios
                  </h2>
                  <p className="text-sm text-gray-300 mt-0.5">
                    Importa múltiples usuarios desde un archivo CSV
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={isImporting}
                className="p-2 rounded-lg transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ 
                  backgroundColor: 'transparent'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1e293b'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <X className="w-5 h-5 text-gray-400 hover:text-white transition-colors" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Descargar plantilla */}
            <div className="flex items-center justify-between p-4 rounded-xl border" style={{
              backgroundColor: '#0f172a',
              borderColor: '#334155'
            }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Plantilla CSV</p>
                  <p className="text-xs text-gray-400">Descarga el formato necesario para importar usuarios</p>
                </div>
              </div>
              <Button
                onClick={handleDownloadTemplate}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Descargar Plantilla
              </Button>
            </div>

            {/* Error message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-4 rounded-xl text-red-400 flex items-center gap-3 border"
                  style={{ 
                    backgroundColor: '#7f1d1d',
                    borderColor: '#dc2626'
                  }}
                >
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Resultado de importación */}
            {importResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Resumen */}
                <div className="p-4 rounded-xl border" style={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155'
                }}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Resumen de Importación</h3>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 text-green-400">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-semibold">{importResult.imported} exitosos</span>
                      </div>
                      {importResult.errors > 0 && (
                        <div className="flex items-center gap-2 text-red-400">
                          <XCircle className="w-5 h-5" />
                          <span className="font-semibold">{importResult.errors} errores</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-400">
                    Total procesado: {importResult.total} usuarios
                  </p>
                </div>

                {/* Detalles de errores */}
                {importResult.errors > 0 && importResult.details.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-white">Detalles de errores:</h4>
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {importResult.details.slice(0, 10).map((detail, index) => (
                        <div
                          key={index}
                          className="p-3 rounded-lg border text-sm"
                          style={{
                            backgroundColor: '#7f1d1d',
                            borderColor: '#dc2626'
                          }}
                        >
                          <p className="text-red-400 font-medium">Fila {detail.row}: {detail.error}</p>
                          {detail.data?.username && (
                            <p className="text-red-300 text-xs mt-1">
                              Usuario: {detail.data.username} | Email: {detail.data.email || 'N/A'}
                            </p>
                          )}
                        </div>
                      ))}
                      {importResult.details.length > 10 && (
                        <p className="text-xs text-gray-400 text-center py-2">
                          Y {importResult.details.length - 10} errores más...
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Zona de carga */}
            {!importResult && (
              <div
                ref={dropAreaRef}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
                  isDragging ? 'border-primary bg-primary/10' : 'border-gray-600 hover:border-primary'
                }`}
                style={{
                  backgroundColor: isDragging ? 'rgba(59, 130, 246, 0.1)' : '#0f172a'
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileInputChange}
                  className="hidden"
                  disabled={isImporting}
                />

                {isImporting ? (
                  <div className="space-y-4">
                    <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto"></div>
                    <div>
                      <p className="text-white font-semibold">Importando usuarios...</p>
                      <p className="text-gray-400 text-sm mt-1">Por favor espera, esto puede tardar unos momentos</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                      <Upload className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-lg">
                        {isDragging ? 'Suelta el archivo aquí' : 'Arrastra un archivo CSV aquí'}
                      </p>
                      <p className="text-gray-400 text-sm mt-2">
                        o haz clic para seleccionar un archivo
                      </p>
                      <p className="text-gray-500 text-xs mt-4">
                        Solo se aceptan archivos CSV (.csv)
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Instrucciones */}
            {!importResult && (
              <div className="p-4 rounded-xl border" style={{
                backgroundColor: '#0f172a',
                borderColor: '#334155'
              }}>
                <h4 className="text-sm font-semibold text-white mb-3">Instrucciones:</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Descarga la plantilla CSV para ver el formato correcto</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Los campos <strong className="text-white">username</strong>, <strong className="text-white">email</strong> y <strong className="text-white">password</strong> son obligatorios</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>El campo <strong className="text-white">password</strong> debe tener al menos 6 caracteres</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>El campo <strong className="text-white">org_role</strong> puede ser: member, admin u owner</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>No se pueden importar usuarios que ya existan (mismo email o username)</span>
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t p-6" style={{ 
            backgroundColor: '#1e293b',
            borderColor: '#334155'
          }}>
            <div className="flex items-center justify-end gap-4">
              {importResult ? (
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="min-w-[120px]"
                >
                  Importar Otro
                </Button>
              ) : (
                <Button
                  onClick={handleClose}
                  variant="outline"
                  disabled={isImporting}
                  className="min-w-[120px]"
                >
                  Cancelar
                </Button>
              )}
              {importResult && (
                <Button
                  onClick={handleClose}
                  variant="gradient"
                  className="min-w-[120px]"
                >
                  Cerrar
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

