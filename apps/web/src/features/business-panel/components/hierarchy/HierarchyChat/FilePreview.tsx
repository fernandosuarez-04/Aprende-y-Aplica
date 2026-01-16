import { X, File } from 'lucide-react'

interface FilePreviewProps {
  file: File
  preview: string | null
  onRemove: () => void
  primaryColor: string
  isDark: boolean
}

export function FilePreview({ file, preview, onRemove, primaryColor, isDark }: FilePreviewProps) {
  return (
    <div
      className="px-4 py-3 flex items-center gap-3 border-t"
      style={{
        backgroundColor: isDark ? '#1E2329' : '#F3F4F6',
        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
      }}
    >
      {preview ? (
        <img src={preview} alt="Preview" className="w-12 h-12 rounded-lg object-cover" />
      ) : (
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${primaryColor}20` }}
        >
          <File className="w-6 h-6" style={{ color: primaryColor }} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-medium truncate"
          style={{ color: isDark ? '#FFFFFF' : '#1E293B' }}
        >
          {file.name}
        </p>
        <p
          className="text-xs"
          style={{ color: isDark ? 'rgba(255,255,255,0.6)' : '#64748B' }}
        >
          {(file.size / 1024).toFixed(1)} KB
        </p>
      </div>
      <button
        onClick={onRemove}
        className="p-1.5 rounded-full hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
      >
        <X className="w-4 h-4 text-red-500" />
      </button>
    </div>
  )
}
