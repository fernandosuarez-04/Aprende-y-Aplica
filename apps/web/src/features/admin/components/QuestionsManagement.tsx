'use client'

import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  MoreHorizontal,
  FileText,
  Hash,
  Tag,
  Globe,
  BarChart3,
  CheckCircle,
  Download,
  Upload,
  Trash
} from 'lucide-react'
import { useUserStats } from '@/features/admin/hooks/useUserStats'

const AddQuestionModal = dynamic(() => import('./AddQuestionModal').then(mod => ({ default: mod.AddQuestionModal })), {
  ssr: false
})
const EditQuestionModal = dynamic(() => import('./EditQuestionModal').then(mod => ({ default: mod.EditQuestionModal })), {
  ssr: false
})
const ViewQuestionModal = dynamic(() => import('./ViewQuestionModal').then(mod => ({ default: mod.ViewQuestionModal })), {
  ssr: false
})
const DeleteQuestionModal = dynamic(() => import('./DeleteQuestionModal').then(mod => ({ default: mod.DeleteQuestionModal })), {
  ssr: false
})

export function QuestionsManagement() {
  const {
    questions,
    loading,
    error,
    createQuestion,
    updateQuestion,
    deleteQuestion
  } = useUserStats()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('all')
  const [selectedAreaFilter, setSelectedAreaFilter] = useState('all')
  const [selectedSectionFilter, setSelectedSectionFilter] = useState('all')
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('all')
  const [lookupData, setLookupData] = useState({
    areas: [] as any[],
    roles: [] as any[],
    niveles: [] as any[]
  })
  const [viewingQuestion, setViewingQuestion] = useState<any>(null)
  const [editingQuestion, setEditingQuestion] = useState<any>(null)
  const [deletingQuestion, setDeletingQuestion] = useState<any>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Cargar datos de lookup tables
  useEffect(() => {
    const loadLookupData = async () => {
      try {
        const [areasRes, rolesRes, nivelesRes] = await Promise.all([
          fetch('/api/admin/user-stats/lookup/areas'),
          fetch('/api/admin/user-stats/lookup/roles'),
          fetch('/api/admin/user-stats/lookup/levels')
        ])

        const [areas, roles, niveles] = await Promise.all([
          areasRes.json(),
          rolesRes.json(),
          nivelesRes.json()
        ])

        setLookupData({
          areas: areas || [],
          roles: roles || [],
          niveles: niveles || []
        })
      } catch (error) {
        // console.error('Error loading lookup data:', error)
      }
    }

    loadLookupData()
  }, [])

  // Filtrar preguntas
  const filteredQuestions = questions.filter(question => {
    const matchesSearch = question.texto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         question.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         question.section?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesTypeFilter = selectedTypeFilter === 'all' || question.tipo === selectedTypeFilter
    const matchesAreaFilter = selectedAreaFilter === 'all' || question.area_id?.toString() === selectedAreaFilter
    const matchesSectionFilter = selectedSectionFilter === 'all' || question.section === selectedSectionFilter
    const matchesRoleFilter = selectedRoleFilter === 'all' || question.exclusivo_rol_id?.toString() === selectedRoleFilter

    return matchesSearch && matchesTypeFilter && matchesAreaFilter && matchesSectionFilter && matchesRoleFilter
  })

  // Obtener secciones únicas
  const uniqueSections = [...new Set(questions.map(q => q.section).filter(Boolean))]

  // Funciones para obtener nombres
  const getAreaName = (areaId: number) => {
    const area = lookupData.areas.find(a => a.id === areaId)
    return area?.nombre || `Área ${areaId}`
  }

  const getRoleName = (roleId: number) => {
    const role = lookupData.roles.find(r => r.id === roleId)
    return role?.nombre || `Rol ${roleId}`
  }

  // Funciones para manejar acciones
  const handleViewQuestion = (question: any) => {
    setViewingQuestion(question)
    setIsViewModalOpen(true)
  }

  const handleEditQuestion = (question: any) => {
    setEditingQuestion(question)
    setIsEditModalOpen(true)
  }

  const handleDeleteQuestion = (question: any) => {
    setDeletingQuestion(question)
    setIsDeleteModalOpen(true)
  }

  const handleSaveQuestion = async (data: any) => {
    if (editingQuestion) {
      await updateQuestion(editingQuestion.id, data)
    }
  }

  const handleConfirmDelete = async (questionId: string) => {
    await deleteQuestion(questionId)
  }

  const handleDeleteAllQuestions = async () => {
    try {
      // Llamar al endpoint que elimina todas las preguntas
      const response = await fetch('/api/admin/user-stats/questions', {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al eliminar todas las preguntas')
      }

      setIsDeleteAllModalOpen(false)
      // Recargar los datos
      window.location.reload()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al eliminar todas las preguntas')
    }
  }

  const closeModals = () => {
    setIsAddModalOpen(false)
    setIsViewModalOpen(false)
    setIsEditModalOpen(false)
    setIsDeleteModalOpen(false)
    setIsDeleteAllModalOpen(false)
    setViewingQuestion(null)
    setEditingQuestion(null)
    setDeletingQuestion(null)
  }

  const getQuestionTypeIcon = (tipo: string) => {
    switch (tipo) {
      case 'multiple_choice':
        return <CheckCircle className="w-4 h-4 text-blue-400" />
      case 'text':
        return <FileText className="w-4 h-4 text-green-400" />
      case 'scale':
        return <BarChart3 className="w-4 h-4 text-purple-400" />
      default:
        return <FileText className="w-4 h-4 text-gray-400" />
    }
  }

  const getQuestionTypeLabel = (tipo: string) => {
    switch (tipo) {
      case 'multiple_choice':
        return 'Opción Múltiple'
      case 'text':
        return 'Texto Libre'
      case 'scale':
        return 'Escala'
      default:
        return tipo
    }
  }

  // Función para exportar preguntas a CSV
  const handleExportCSV = () => {
    // Crear encabezados CSV
    const headers = [
      'Codigo',
      'Texto',
      'Tipo',
      'Seccion',
      'Bloque',
      'Area ID',
      'Exclusivo Rol ID',
      'Opciones (JSON)',
      'Escala (JSON)',
      'Scoring (JSON)',
      'Peso',
      'Respuesta Correcta',
      'Locale'
    ]

    // Convertir preguntas a CSV
    const csvRows = [
      headers.join(','),
      ...filteredQuestions.map(q => [
        q.codigo || '',
        `"${(q.texto || '').replace(/"/g, '""')}"`,
        q.tipo || '',
        q.section || '',
        q.bloque || '',
        q.area_id || '',
        q.exclusivo_rol_id || '',
        `"${JSON.stringify(q.opciones || {}).replace(/"/g, '""')}"`,
        `"${JSON.stringify(q.escala || {}).replace(/"/g, '""')}"`,
        `"${JSON.stringify(q.scoring || {}).replace(/"/g, '""')}"`,
        q.peso || '',
        `"${(q.respuesta_correcta || '').replace(/"/g, '""')}"`,
        q.locale || 'es'
      ].join(','))
    ]

    // Crear blob y descargar
    const csvContent = csvRows.join('\n')
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `preguntas_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Función para descargar plantilla CSV
  const handleDownloadTemplate = () => {
    const headers = [
      'Codigo',
      'Texto',
      'Tipo',
      'Seccion',
      'Bloque',
      'Area ID',
      'Exclusivo Rol ID',
      'Opciones (JSON)',
      'Escala (JSON)',
      'Scoring (JSON)',
      'Peso',
      'Respuesta Correcta',
      'Locale'
    ]

    const csvContent = headers.join(',') + '\n'
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', 'plantilla_preguntas.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Función para importar preguntas desde CSV
  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string
        const lines = text.split('\n').filter(line => line.trim())
        
        if (lines.length < 2) {
          alert('El archivo CSV está vacío o no tiene datos')
          return
        }

        // Procesar cada línea (omitir encabezados)
        const headers = lines[0].split(',')
        const rows = lines.slice(1)

        for (const row of rows) {
          if (!row.trim()) continue

          // Parsear CSV (considerando comillas)
          const values: string[] = []
          let currentValue = ''
          let inQuotes = false

          for (let i = 0; i < row.length; i++) {
            const char = row[i]
            
            if (char === '"') {
              inQuotes = !inQuotes
            } else if (char === ',' && !inQuotes) {
              values.push(currentValue)
              currentValue = ''
            } else {
              currentValue += char
            }
          }
          values.push(currentValue) // Último valor

          // Crear objeto de pregunta
          const questionData: any = {
            codigo: values[0] || '',
            texto: values[1]?.replace(/""/g, '"') || '',
            tipo: values[2] || 'text',
            section: values[3] || '',
            bloque: values[4] || '',
            area_id: values[5] ? parseInt(values[5]) : null,
            exclusivo_rol_id: values[6] ? parseInt(values[6]) : null,
            opciones: values[7] ? JSON.parse(values[7].replace(/""/g, '"')) : {},
            escala: values[8] ? JSON.parse(values[8].replace(/""/g, '"')) : {},
            scoring: values[9] ? JSON.parse(values[9].replace(/""/g, '"')) : {},
            peso: values[10] ? parseFloat(values[10]) : 1,
            respuesta_correcta: values[11]?.replace(/""/g, '"') || '',
            locale: values[12] || 'es'
          }

          // Crear pregunta
          try {
            await createQuestion(questionData)
          } catch (error) {
            // console.error('Error al crear pregunta:', error)
          }
        }

        alert(`Se importaron ${rows.length} preguntas exitosamente`)
        
        // Resetear input
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      } catch (error) {
        // console.error('Error al importar CSV:', error)
        alert('Error al importar el archivo CSV. Verifica el formato.')
      }
    }

    reader.readAsText(file, 'UTF-8')
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200"></div>
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent absolute top-0 left-0"></div>
        </div>
        <p className="mt-4 text-gray-500 dark:text-gray-400">Cargando preguntas...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-red-100 dark:bg-red-900/40 rounded-full">
            <FileText className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">
              Error al cargar preguntas
            </h3>
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gestión de Preguntas
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Administra las preguntas del cuestionario de personalización
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleDownloadTemplate}
            className="inline-flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
            title="Descargar plantilla CSV"
          >
            <Download className="w-4 h-4 mr-2" />
            Plantilla
          </button>
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
            title="Exportar preguntas a CSV"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </button>
          <label className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors cursor-pointer">
            <Upload className="w-4 h-4 mr-2" />
            Importar
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleImportCSV}
              className="hidden"
            />
          </label>
          {questions.length > 0 && (
            <button
              onClick={() => setIsDeleteAllModalOpen(true)}
              className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
              title="Eliminar todas las preguntas"
            >
              <Trash className="w-4 h-4 mr-2" />
              Borrar Todas
            </button>
          )}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva Pregunta
          </button>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por texto, código o sección..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Filtro por Tipo */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[140px]"
            >
              <option value="all">Todos los tipos</option>
              <option value="multiple_choice">Opción Múltiple</option>
              <option value="text">Texto Libre</option>
              <option value="scale">Escala</option>
            </select>
          </div>

          {/* Filtro por Área */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={selectedAreaFilter}
              onChange={(e) => setSelectedAreaFilter(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[140px]"
            >
              <option value="all">Todas las áreas</option>
              {lookupData.areas.map(area => (
                <option key={area.id} value={area.id}>
                  {area.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Sección */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={selectedSectionFilter}
              onChange={(e) => setSelectedSectionFilter(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[140px]"
            >
              <option value="all">Todas las secciones</option>
              {uniqueSections.map(section => (
                <option key={section} value={section}>
                  {section}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Rol Exclusivo */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={selectedRoleFilter}
              onChange={(e) => setSelectedRoleFilter(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[140px]"
            >
              <option value="all">Todos los roles</option>
              {lookupData.roles.map(role => (
                <option key={role.id} value={role.id}>
                  {role.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{questions.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Opción Múltiple</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {questions.filter(q => q.tipo === 'multiple_choice').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-lg">
              <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Escala</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {questions.filter(q => q.tipo === 'scale').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/40 rounded-lg">
              <FileText className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Texto Libre</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {questions.filter(q => q.tipo === 'text').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de preguntas */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Pregunta
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Código
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Sección
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Área
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Rol Exclusivo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredQuestions.map((question) => (
                <tr key={question.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700">
                  <td className="px-6 py-4">
                    <div className="max-w-xs">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {question.texto || 'Sin texto'}
                      </p>
                      {question.bloque && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Bloque: {question.bloque}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <Hash className="w-4 h-4 text-gray-400 mr-1" />
                      <span className="text-sm text-gray-900 dark:text-white font-mono">
                        {question.codigo || 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {getQuestionTypeIcon(question.tipo)}
                      <span className="ml-2 text-sm text-gray-900 dark:text-white">
                        {getQuestionTypeLabel(question.tipo)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                      {question.section || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900 dark:text-white">
                      {question.area_id ? getAreaName(question.area_id) : 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900 dark:text-white">
                      {question.exclusivo_rol_id ? getRoleName(question.exclusivo_rol_id) : 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleViewQuestion(question)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                        title="Ver detalles"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleEditQuestion(question)}
                        className="text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-300 transition-colors"
                        title="Editar pregunta"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteQuestion(question)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                        title="Eliminar pregunta"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredQuestions.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No se encontraron preguntas
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {searchTerm || selectedTypeFilter !== 'all' || selectedAreaFilter !== 'all' || selectedSectionFilter !== 'all' || selectedRoleFilter !== 'all'
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'Comienza creando tu primera pregunta'
              }
            </p>
            {!searchTerm && selectedTypeFilter === 'all' && selectedAreaFilter === 'all' && selectedSectionFilter === 'all' && selectedRoleFilter === 'all' && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Crear Primera Pregunta
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modales */}
      <AddQuestionModal
        isOpen={isAddModalOpen}
        onClose={closeModals}
        onSave={createQuestion}
      />

      {viewingQuestion && (
        <ViewQuestionModal
          question={viewingQuestion}
          isOpen={isViewModalOpen}
          onClose={closeModals}
        />
      )}

      {editingQuestion && (
        <EditQuestionModal
          question={editingQuestion}
          isOpen={isEditModalOpen}
          onClose={closeModals}
          onSave={handleSaveQuestion}
        />
      )}

      {deletingQuestion && (
        <DeleteQuestionModal
          question={deletingQuestion}
          isOpen={isDeleteModalOpen}
          onClose={closeModals}
          onDelete={handleConfirmDelete}
        />
      )}

      {/* Modal de confirmación para borrar todas las preguntas */}
      {isDeleteAllModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              ¿Eliminar todas las preguntas?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Esta acción eliminará permanentemente todas las {questions.length} preguntas. Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsDeleteAllModalOpen(false)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteAllQuestions}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Eliminar Todas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
