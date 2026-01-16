import { motion, AnimatePresence } from 'framer-motion'
import { X, Download } from 'lucide-react'

interface ImageModalProps {
  url: string
  name: string
  onClose: () => void
  onDownload: (url: string, name: string) => void
}

export function ImageModal({ url, name, onClose, onDownload }: ImageModalProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/95"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="relative w-full h-full flex items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Botón de cerrar */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-3 rounded-full backdrop-blur-sm transition-colors hover:bg-white/20 bg-black/70"
            title="Cerrar (ESC)"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* Botón de descargar */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDownload(url, name)
            }}
            className="absolute top-4 right-20 z-10 p-3 rounded-full backdrop-blur-sm transition-colors hover:bg-white/20 bg-black/70"
            title="Descargar imagen"
          >
            <Download className="w-6 h-6 text-white" />
          </button>

          {/* Imagen */}
          <img
            src={url}
            alt={name}
            className="max-w-[95vw] max-h-[90vh] w-auto h-auto object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Nombre del archivo */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg backdrop-blur-sm bg-black/70">
            <p className="text-sm text-white text-center whitespace-nowrap max-w-[80vw] truncate">
              {name}
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
