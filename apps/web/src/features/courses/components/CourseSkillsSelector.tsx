'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Star, CheckCircle, Search } from 'lucide-react'

export interface Skill {
  skill_id: string
  name: string
  slug: string
  description?: string
  category: string
  icon_url?: string
  icon_type?: string
  icon_name?: string
  color?: string
  level?: string
}

export interface CourseSkill extends Skill {
  id?: string
  is_primary?: boolean
  is_required?: boolean
  proficiency_level?: string
  display_order?: number
}

interface CourseSkillsSelectorProps {
  courseId: string
  selectedSkills: CourseSkill[]
  onSkillsChange: (skills: CourseSkill[]) => void
  disabled?: boolean
}

export function CourseSkillsSelector({
  courseId,
  selectedSkills,
  onSkillsChange,
  disabled = false
}: CourseSkillsSelectorProps) {
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    fetchAvailableSkills()
  }, [])

  useEffect(() => {
    if (courseId) {
      fetchCourseSkills()
    }
  }, [courseId])

  const fetchAvailableSkills = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/skills?is_active=true')
      const data = await response.json()

      if (data.success) {
        setAvailableSkills(data.skills || [])
      }
    } catch (error) {
      console.error('Error fetching skills:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCourseSkills = async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}/skills`)
      const data = await response.json()

      if (data.success && data.skills) {
        onSkillsChange(data.skills)
      }
    } catch (error) {
      console.error('Error fetching course skills:', error)
    }
  }

  const filteredSkills = availableSkills.filter(skill => {
    const matchesSearch = skill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         skill.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || skill.category === selectedCategory
    const notSelected = !selectedSkills.some(ss => ss.skill_id === skill.skill_id)
    return matchesSearch && matchesCategory && notSelected
  })

  const categories = Array.from(new Set(availableSkills.map(s => s.category)))

  const handleAddSkill = (skill: Skill) => {
    const newSkill: CourseSkill = {
      ...skill,
      is_primary: false,
      is_required: true,
      proficiency_level: 'beginner',
      display_order: selectedSkills.length
    }
    onSkillsChange([...selectedSkills, newSkill])
    setSearchTerm('')
  }

  const handleRemoveSkill = (skillId: string) => {
    onSkillsChange(selectedSkills.filter(s => s.skill_id !== skillId))
  }

  const handleTogglePrimary = (skillId: string) => {
    onSkillsChange(
      selectedSkills.map(s =>
        s.skill_id === skillId
          ? { ...s, is_primary: !s.is_primary }
          : { ...s, is_primary: false } // Solo una skill puede ser primaria
      )
    )
  }

  const handleUpdateSkill = (skillId: string, updates: Partial<CourseSkill>) => {
    onSkillsChange(
      selectedSkills.map(s =>
        s.skill_id === skillId ? { ...s, ...updates } : s
      )
    )
  }

  const getSkillIcon = (skill: Skill) => {
    if (skill.icon_url) {
      return (
        <img
          src={skill.icon_url}
          alt={skill.name}
          className="w-6 h-6 rounded"
        />
      )
    }
    if (skill.icon_name) {
      return (
        <div
          className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold"
          style={{ backgroundColor: skill.color || '#3b82f6', color: '#fff' }}
        >
          {skill.icon_name.substring(0, 2).toUpperCase()}
        </div>
      )
    }
    return (
      <div
        className="w-6 h-6 rounded flex items-center justify-center"
        style={{ backgroundColor: skill.color || '#3b82f6' }}
      >
        <CheckCircle className="w-4 h-4 text-white" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Skills seleccionadas */}
      {selectedSkills.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Skills del Curso ({selectedSkills.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {selectedSkills.map((skill, index) => (
              <motion.div
                key={skill.skill_id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="group relative flex items-center gap-2 px-3 py-2 rounded-lg border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
              >
                {getSkillIcon(skill)}
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {skill.name}
                </span>
                {skill.is_primary && (
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                )}
                {!disabled && (
                  <button
                    onClick={() => handleRemoveSkill(skill.skill_id)}
                    className="ml-1 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <X className="w-3 h-3 text-gray-500" />
                  </button>
                )}
                {!disabled && (
                  <div className="absolute top-full left-0 mt-1 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                    <div className="space-y-2 min-w-[200px]">
                      <label className="flex items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          checked={skill.is_primary || false}
                          onChange={() => handleTogglePrimary(skill.skill_id)}
                          className="rounded"
                        />
                        <span>Skill Principal</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          checked={skill.is_required !== false}
                          onChange={(e) => handleUpdateSkill(skill.skill_id, { is_required: e.target.checked })}
                          className="rounded"
                        />
                        <span>Requerida</span>
                      </label>
                      <div>
                        <label className="text-xs block mb-1">Nivel de Proficiencia</label>
                        <select
                          value={skill.proficiency_level || 'beginner'}
                          onChange={(e) => handleUpdateSkill(skill.skill_id, { proficiency_level: e.target.value })}
                          className="w-full text-xs px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                        >
                          <option value="beginner">Principiante</option>
                          <option value="intermediate">Intermedio</option>
                          <option value="advanced">Avanzado</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Botón para agregar skills */}
      {!disabled && (
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Agregar Skills
        </button>
      )}

      {/* Modal para agregar skills */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Seleccionar Skills
                </h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Filtros */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar skills..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  />
                </div>
                <div className="flex gap-2 overflow-x-auto">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`px-3 py-1 rounded-lg text-sm whitespace-nowrap transition-colors ${
                      selectedCategory === 'all'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Todas
                  </button>
                  {categories.map(category => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-3 py-1 rounded-lg text-sm whitespace-nowrap transition-colors ${
                        selectedCategory === category
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lista de skills */}
              <div className="flex-1 overflow-y-auto p-4">
                {isLoading ? (
                  <div className="text-center py-8 text-gray-500">Cargando skills...</div>
                ) : filteredSkills.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {searchTerm || selectedCategory !== 'all'
                      ? 'No se encontraron skills'
                      : 'Todas las skills ya están seleccionadas'}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {filteredSkills.map(skill => (
                      <motion.button
                        key={skill.skill_id}
                        onClick={() => {
                          handleAddSkill(skill)
                          setShowAddModal(false)
                        }}
                        className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {getSkillIcon(skill)}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 dark:text-white truncate">
                            {skill.name}
                          </div>
                          {skill.description && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {skill.description}
                            </div>
                          )}
                          <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {skill.category} • {skill.level}
                          </div>
                        </div>
                        <Plus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

