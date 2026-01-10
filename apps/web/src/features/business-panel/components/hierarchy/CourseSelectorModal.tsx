import { useState } from 'react'
import { Dialog } from '@headlessui/react'
import { X, Search, BookOpen, Check } from 'lucide-react'
import { BusinessCourse, useBusinessCourses } from '@/features/business-panel/hooks/useBusinessCourses'

interface CourseSelectorModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (courseIds: string[]) => void
  isLoading?: boolean
  title?: string
}

export function CourseSelectorModal({
  isOpen,
  onClose,
  onSelect,
  isLoading = false,
  title = 'Añadir Cursos'
}: CourseSelectorModalProps) {
  const { courses, isLoading: isLoadingCourses } = useBusinessCourses()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')

  const filteredCourses = courses.filter(course => 
    course.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const handleConfirm = () => {
    onSelect(Array.from(selectedIds))
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-[#1E2329] rounded-2xl border border-white/10 w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-white/10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              placeholder="Buscar cursos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:border-white/20"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {isLoadingCourses ? (
            <div className="text-center py-8 text-white/40">Cargando cursos...</div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-8 text-white/40">No se encontraron cursos</div>
          ) : (
            filteredCourses.map(course => (
              <div
                key={course.id}
                onClick={() => toggleSelection(course.id)}
                className={`
                  relative flex items-center gap-4 p-3 rounded-xl border cursor-pointer transition-all
                  ${selectedIds.has(course.id) 
                    ? 'bg-blue-500/10 border-blue-500/50' 
                    : 'bg-white/5 border-white/5 hover:border-white/20'}
                `}
              >
                <div className="w-12 h-12 rounded-lg bg-neutral-800 flex items-center justify-center shrink-0 overflow-hidden">
                  {course.thumbnail_url ? (
                    <img src={course.thumbnail_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <BookOpen className="w-6 h-6 text-white/40" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-white truncate">{course.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-white/50 mt-1">
                    <span>{course.level || 'General'}</span>
                    <span>•</span>
                    <span>{course.category || 'Sin categoría'}</span>
                  </div>
                </div>

                <div className={`
                  w-6 h-6 rounded-full border flex items-center justify-center transition-colors
                  ${selectedIds.has(course.id)
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : 'border-white/20 text-transparent'}
                `}>
                  <Check className="w-4 h-4" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading || selectedIds.size === 0}
            className="px-6 py-2 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Añadiendo...' : `Añadir ${selectedIds.size} Cursos`}
          </button>
        </div>

      </div>
    </div>
  )
}
