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
        {/* Backdrop premium */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-xl"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="relative backdrop-blur-xl rounded-3xl shadow-2xl border w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col z-10"
          style={{ 
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            borderColor: 'rgba(51, 65, 85, 0.3)'
          }}
        >
          {/* Header */}
          <div className="relative border-b p-6 backdrop-blur-sm" style={{ 
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            borderColor: 'rgba(51, 65, 85, 0.3)'
          }}>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.div
                  initial={{ scale: 0.9, rotate: -5 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.1, type: 'spring' }}
                  className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-success flex items-center justify-center shadow-lg"
                >
                  <Upload className="w-6 h-6 text-white" />
                </motion.div>
                <div>
                  <h2 className="text-heading text-2xl font-bold text-white tracking-tight">
                    Importar Usuarios
                  </h2>
                  <p className="text-body text-sm text-carbon-400 mt-1">
                    Importa múltiples usuarios desde un archivo CSV
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleClose}
                disabled={isImporting}
                className="p-2 rounded-xl transition-all duration-200 hover:bg-carbon-700/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="w-5 h-5 text-carbon-400 hover:text-white transition-colors" />
              </motion.button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Descargar plantilla */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="flex items-center justify-between p-5 rounded-xl border backdrop-blur-sm" style={{
                backgroundColor: 'rgba(15, 23, 42, 0.5)',
                borderColor: 'rgba(51, 65, 85, 0.3)'
              }}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-body text-sm font-heading font-semibold text-white">Plantilla CSV</p>
                  <p className="text-body text-xs text-carbon-400 mt-0.5">Descarga el formato necesario para importar usuarios</p>
                </div>
              </div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={handleDownloadTemplate}
                  variant="outline"
                  className="flex items-center gap-2 font-heading text-sm transition-all duration-200"
                >
                  <Download className="w-4 h-4" />
                  Descargar Plantilla
                </Button>
              </motion.div>
            </motion.div>

            {/* Error message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="p-4 rounded-xl text-red-400 flex items-center gap-3 border backdrop-blur-sm"
                  style={{ 
                    backgroundColor: 'rgba(127, 29, 29, 0.2)',
                    borderColor: 'rgba(220, 38, 38, 0.3)'
                  }}
                >
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-body text-sm">{error}</span>
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
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-5 rounded-xl border backdrop-blur-sm" style={{
                    backgroundColor: 'rgba(15, 23, 42, 0.5)',
                    borderColor: 'rgba(51, 65, 85, 0.3)'
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-heading text-lg font-semibold text-white">Resumen de Importación</h3>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 text-green-400">
                        <CheckCircle className="w-5 h-5" />
                        <span className="text-body font-heading font-semibold">{importResult.imported} exitosos</span>
                      </div>
                      {importResult.errors > 0 && (
                        <div className="flex items-center gap-2 text-red-400">
                          <XCircle className="w-5 h-5" />
                          <span className="text-body font-heading font-semibold">{importResult.errors} errores</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-body text-sm text-carbon-400">
                    Total procesado: {importResult.total} usuarios
                  </p>
                </motion.div>

                {/* Detalles de errores */}
                {importResult.errors > 0 && importResult.details.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="space-y-3"
                  >
                    <h4 className="text-body text-sm font-heading font-semibold text-white">Detalles de errores:</h4>
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {importResult.details.slice(0, 10).map((detail, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="p-3 rounded-xl border text-sm backdrop-blur-sm"
                          style={{
                            backgroundColor: 'rgba(127, 29, 29, 0.2)',
                            borderColor: 'rgba(220, 38, 38, 0.3)'
                          }}
                        >
                          <p className="text-body text-red-400 font-heading font-medium">Fila {detail.row}: {detail.error}</p>
                          {detail.data?.username && (
                            <p className="text-body text-red-300 text-xs mt-1">
                              Usuario: {detail.data.username} | Email: {detail.data.email || 'N/A'}
                            </p>
                          )}
                        </motion.div>
                      ))}
                      {importResult.details.length > 10 && (
                        <p className="text-body text-xs text-carbon-400 text-center py-2">
                          Y {importResult.details.length - 10} errores más...
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Zona de carga */}
            {!importResult && (
              <motion.div
                ref={dropAreaRef}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1,
                  borderColor: isDragging ? 'rgba(59, 130, 246, 0.5)' : 'rgba(51, 65, 85, 0.5)',
                  backgroundColor: isDragging ? 'rgba(59, 130, 246, 0.1)' : 'rgba(15, 23, 42, 0.3)'
                }}
                whileHover={{ scale: 1.01 }}
                transition={{ duration: 0.2 }}
                className="relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer backdrop-blur-sm"
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
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-5"
                  >
                    <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto"></div>
                    <div>
                      <p className="text-body text-white font-heading font-semibold">Importando usuarios...</p>
                      <p className="text-body text-carbon-400 text-sm mt-1.5">Por favor espera, esto puede tardar unos momentos</p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-5"
                  >
                    <motion.div
                      animate={isDragging ? { scale: 1.1, rotate: 5 } : { scale: 1, rotate: 0 }}
                      transition={{ duration: 0.2 }}
                      className="w-20 h-20 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center mx-auto"
                    >
                      <Upload className="w-10 h-10 text-primary" />
                    </motion.div>
                    <div>
                      <p className="text-body text-white font-heading font-semibold text-lg">
                        {isDragging ? 'Suelta el archivo aquí' : 'Arrastra un archivo CSV aquí'}
                      </p>
                      <p className="text-body text-carbon-400 text-sm mt-2">
                        o haz clic para seleccionar un archivo
                      </p>
                      <p className="text-body text-carbon-500 text-xs mt-4">
                        Solo se aceptan archivos CSV (.csv)
                      </p>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Instrucciones */}
            {!importResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="p-5 rounded-xl border backdrop-blur-sm" style={{
                  backgroundColor: 'rgba(15, 23, 42, 0.5)',
                  borderColor: 'rgba(51, 65, 85, 0.3)'
                }}
              >
                <h4 className="text-body text-sm font-heading font-semibold text-white mb-4">Instrucciones:</h4>
                <ul className="space-y-2.5 text-body text-sm text-carbon-400">
                  <li className="flex items-start gap-2.5">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Descarga la plantilla CSV para ver el formato correcto</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Los campos <strong className="text-white font-heading">username</strong>, <strong className="text-white font-heading">email</strong> y <strong className="text-white font-heading">password</strong> son obligatorios</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-primary mt-0.5">•</span>
                    <span>El campo <strong className="text-white font-heading">password</strong> debe tener al menos 6 caracteres</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-primary mt-0.5">•</span>
                    <span>El campo <strong className="text-white font-heading">org_role</strong> puede ser: member, admin u owner</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-primary mt-0.5">•</span>
                    <span>No se pueden importar usuarios que ya existan (mismo email o username)</span>
                  </li>
                </ul>
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t p-6 backdrop-blur-sm" style={{ 
            backgroundColor: 'rgba(30, 41, 59, 0.8)',
            borderColor: 'rgba(51, 65, 85, 0.3)'
          }}>
            <div className="flex items-center justify-end gap-3">
              {importResult ? (
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    className="min-w-[120px] font-heading text-sm transition-all duration-200"
                  >
                    Importar Otro
                  </Button>
                </motion.div>
              ) : (
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={handleClose}
                    variant="outline"
                    disabled={isImporting}
                    className="min-w-[120px] font-heading text-sm transition-all duration-200"
                  >
                    Cancelar
                  </Button>
                </motion.div>
              )}
              {importResult && (
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={handleClose}
                    variant="gradient"
                    className="min-w-[120px] font-heading text-sm transition-all duration-200"
                  >
                    Cerrar
                  </Button>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

