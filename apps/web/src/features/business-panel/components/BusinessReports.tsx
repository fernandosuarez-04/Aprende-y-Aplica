'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  Activity,
  Award,
  Filter,
  FileSpreadsheet,
  Download,
  X,
  Calendar,
  ChevronDown,
  Eye,
  ExternalLink
} from 'lucide-react'
import { Button } from '@aprende-y-aplica/ui'
import { useBusinessReports } from '../hooks/useBusinessReports'
import { ReportType } from '@/app/api/business/reports/data/route'
import { useOrganizationStylesContext } from '../contexts/OrganizationStylesContext'
import { PremiumSelect } from './PremiumSelect'
import { ReportTable } from './ReportTable'
import type { ColumnDef } from '@tanstack/react-table'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts'

interface BusinessReportsProps {}

const REPORT_TYPES: Array<{ value: ReportType; label: string; icon: any; description: string }> = [
  { value: 'users', label: 'Usuarios', icon: Users, description: 'Reporte de usuarios de la organización' },
  { value: 'activity', label: 'Actividad', icon: Activity, description: 'Actividad reciente de usuarios' },
  { value: 'certificates', label: 'Certificados', icon: Award, description: 'Certificados obtenidos' }
]

export function BusinessReports({}: BusinessReportsProps) {
  const { styles } = useOrganizationStylesContext()
  const panelStyles = styles?.panel

  const cardBg = panelStyles?.card_background || 'rgba(30, 41, 59, 0.8)'
  const cardBorder = panelStyles?.border_color || 'rgba(51, 65, 85, 0.3)'
  const textColor = panelStyles?.text_color || '#f8fafc'
  const primaryColor = panelStyles?.primary_button_color || '#3b82f6'
  const sectionBg = `${cardBg}CC`

  const {
    reportType,
    setReportType,
    filters,
    setFilters,
    reportData,
    isLoading,
    error,
    fetchReport,
    resetFilters
  } = useBusinessReports()

  const [showFilters, setShowFilters] = useState(false)
  const [localStartDate, setLocalStartDate] = useState('')
  const [localEndDate, setLocalEndDate] = useState('')

  useEffect(() => {
    if (showFilters) {
      setLocalStartDate(filters.start_date || '')
      setLocalEndDate(filters.end_date || '')
    }
  }, [showFilters, filters])

  const handleGenerateReport = () => {
    const filtersToUse = {
      ...filters,
      start_date: localStartDate || undefined,
      end_date: localEndDate || undefined
    }
    fetchReport(reportType, filtersToUse)
  }

  useEffect(() => {
    if (reportType) {
      const filtersToUse = {
        ...filters,
        start_date: localStartDate || undefined,
        end_date: localEndDate || undefined
      }
      fetchReport(reportType, filtersToUse)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportType])

  const handleExportExcel = async () => {
    if (!reportData?.data) {
      alert('No hay datos para exportar. Genera un reporte primero.')
      return
    }

    try {
      // Importación dinámica de xlsx para evitar problemas de SSR
      const XLSX = await import('xlsx')
      const workbook = XLSX.utils.book_new()
      let worksheet: XLSX.WorkSheet
      let filename = ''

      switch (reportType) {
        case 'users':
          worksheet = XLSX.utils.json_to_sheet(
            (reportData.data.users || []).map((u: any) => {
              const courses = (u.courses || []).map((c: any) => c.course_title).join('; ') || 'Sin cursos'
              const certificates = (u.certificates || []).map((c: any) => c.course_title).join('; ') || 'Sin certificados'
              const progress = u.progress || {}
              
              return {
                'Username': u.username,
                'Email': u.email,
                'Nombre': u.display_name,
                'Tipo de Rol': u.type_rol || 'No especificado',
                'Estado': u.status,
                'Fecha de Ingreso': u.joined_at ? new Date(u.joined_at).toLocaleDateString('es-ES') : '',
                'Última Conexión': u.last_login_at ? new Date(u.last_login_at).toLocaleDateString('es-ES') : 'Nunca',
                'Total Cursos': progress.total_courses || 0,
                'Cursos Completados': progress.completed_courses || 0,
                'Cursos en Progreso': progress.in_progress_courses || 0,
                'Progreso Promedio': `${progress.average_progress?.toFixed(1) || 0}%`,
                'Cursos': courses,
                'Total Certificados': (u.certificates || []).length,
                'Certificados': certificates
              }
            })
          )
          filename = `reporte_usuarios_${new Date().toISOString().split('T')[0]}.xlsx`
          break
        case 'activity':
          worksheet = XLSX.utils.json_to_sheet(
            (reportData.data.activities || []).map((a: any) => ({
              'Usuario': a.user_name || a.user_id,
              'Email': a.user_email || '',
              'Curso': a.course_title || a.course_id,
              'Categoría': a.course_category || '',
              'Estado': a.enrollment_status === 'active' ? 'Activo' : a.enrollment_status === 'completed' ? 'Completado' : 'Inactivo',
              'Fecha Inscripción': a.enrolled_at || '',
              'Último Acceso': a.last_accessed_at || ''
            }))
          )
          filename = `reporte_actividad_${new Date().toISOString().split('T')[0]}.xlsx`
          break
        case 'certificates':
          worksheet = XLSX.utils.json_to_sheet(
            (reportData.data.certificates || []).map((c: any) => ({
              'Usuario': c.user_name || c.user_id,
              'Email': c.user_email || '',
              'Curso': c.course_title || c.course_id,
              'Categoría': c.course_category || '',
              'Nivel': c.course_level || '',
              'Fecha Emisión': c.issued_at || ''
            }))
          )
          filename = `reporte_certificados_${new Date().toISOString().split('T')[0]}.xlsx`
          break
        default:
          alert('Tipo de reporte no soportado para exportación Excel')
          return
      }

      XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos')
      XLSX.writeFile(workbook, filename)
    } catch (err) {
      console.error('Error al exportar Excel:', err)
      alert('Error al exportar el reporte a Excel. Asegúrate de que el paquete xlsx esté instalado.')
    }
  }

  const handleExportCSV = () => {
    if (!reportData?.data) {
      alert('No hay datos para exportar. Genera un reporte primero.')
      return
    }

    try {
      let csvContent = ''
      let filename = ''

      switch (reportType) {
        case 'users':
          csvContent = exportUsersToCSV(reportData.data)
          filename = `reporte_usuarios_${new Date().toISOString().split('T')[0]}.csv`
          break
        case 'activity':
          csvContent = exportActivityToCSV(reportData.data)
          filename = `reporte_actividad_${new Date().toISOString().split('T')[0]}.csv`
          break
        case 'certificates':
          csvContent = exportCertificatesToCSV(reportData.data)
          filename = `reporte_certificados_${new Date().toISOString().split('T')[0]}.csv`
          break
        default:
          alert('Tipo de reporte no soportado para exportación CSV')
          return
      }

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', filename)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      console.error('Error al exportar CSV:', err)
      alert('Error al exportar el reporte a CSV')
    }
  }

  // Funciones de exportación CSV
  const exportUsersToCSV = (data: any) => {
    const headers = ['ID', 'Username', 'Email', 'Nombre Completo', 'Tipo de Rol', 'Estado', 'Fecha de Ingreso', 'Última Conexión', 'Total Cursos', 'Cursos Completados', 'Cursos en Progreso', 'Progreso Promedio', 'Cursos', 'Total Certificados', 'Certificados']
    const rows = [
      headers.join(','),
      ...(data.users || []).map((u: any) => {
        const courses = (u.courses || []).map((c: any) => c.course_title).join('; ') || 'Sin cursos'
        const certificates = (u.certificates || []).map((c: any) => c.course_title).join('; ') || 'Sin certificados'
        const progress = u.progress || {}
        
        return [
          u.user_id,
          `"${u.username}"`,
          `"${u.email}"`,
          `"${u.display_name}"`,
          `"${u.type_rol || 'No especificado'}"`,
          u.status,
          u.joined_at ? new Date(u.joined_at).toLocaleDateString('es-ES') : '',
          u.last_login_at ? new Date(u.last_login_at).toLocaleDateString('es-ES') : 'Nunca',
          progress.total_courses || 0,
          progress.completed_courses || 0,
          progress.in_progress_courses || 0,
          `${progress.average_progress?.toFixed(1) || 0}%`,
          `"${courses}"`,
          (u.certificates || []).length,
          `"${certificates}"`
        ].join(',')
      })
    ]
    return rows.join('\n')
  }

  const exportActivityToCSV = (data: any) => {
    const headers = ['Usuario', 'Email', 'Curso', 'Categoría', 'Estado', 'Fecha Inscripción', 'Último Acceso']
    const rows = [
      headers.join(','),
      ...(data.activities || []).map((a: any) => [
        `"${a.user_name || a.user_id}"`,
        `"${a.user_email || ''}"`,
        `"${a.course_title || a.course_id}"`,
        `"${a.course_category || ''}"`,
        a.enrollment_status === 'active' ? 'Activo' : a.enrollment_status === 'completed' ? 'Completado' : 'Inactivo',
        a.enrolled_at || '',
        a.last_accessed_at || ''
      ].join(','))
    ]
    return rows.join('\n')
  }

  const exportCertificatesToCSV = (data: any) => {
    const headers = ['Usuario', 'Email', 'Curso', 'Categoría', 'Nivel', 'Fecha Emisión']
    const rows = [
      headers.join(','),
      ...(data.certificates || []).map((c: any) => [
        `"${c.user_name || c.user_id}"`,
        `"${c.user_email || ''}"`,
        `"${c.course_title || c.course_id}"`,
        `"${c.course_category || ''}"`,
        `"${c.course_level || ''}"`,
        c.issued_at || ''
      ].join(','))
    ]
    return rows.join('\n')
  }

  return (
    <div className="w-full space-y-6" style={{ color: textColor }}>
      {/* Header con selector de tipo de reporte */}
      <div 
        className="p-6 rounded-3xl border backdrop-blur-sm"
        style={{ backgroundColor: cardBg, borderColor: cardBorder }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-heading font-semibold mb-2">Generar Reporte</h2>
            <p className="text-sm font-body opacity-70">Selecciona el tipo de reporte y configura los filtros</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="font-body"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </Button>
            {reportData && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleExportCSV}
                  className="font-body"
                >
                  <Download className="w-4 h-4 mr-2" />
                  CSV
                </Button>
                <Button
                  variant="gradient"
                  size="sm"
                  onClick={handleExportExcel}
                  className="font-body"
                  style={{
                    background: `linear-gradient(135deg, ${primaryColor} 0%, ${panelStyles?.secondary_button_color || '#8b5cf6'} 100%)`,
                    boxShadow: `0 4px 14px 0 ${primaryColor}40`
                  }}
                >
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Excel
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Selector de tipo de reporte */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {REPORT_TYPES.map((type) => {
            const Icon = type.icon
            const isSelected = reportType === type.value
            return (
              <motion.button
                key={type.value}
                onClick={() => setReportType(type.value)}
                disabled={isLoading}
                className={`p-4 rounded-2xl border-2 transition-all text-left ${
                  isSelected
                    ? 'border-opacity-100'
                    : 'border-opacity-30 hover:border-opacity-60'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                style={{
                  backgroundColor: isSelected ? `${primaryColor}20` : sectionBg,
                  borderColor: isSelected ? primaryColor : cardBorder,
                  color: textColor
                }}
                whileHover={isLoading ? {} : { scale: 1.02 }}
                whileTap={isLoading ? {} : { scale: 0.98 }}
              >
                <Icon className={`w-5 h-5 mb-2 ${isSelected ? '' : 'opacity-70'}`} style={{ color: isSelected ? primaryColor : textColor }} />
                <div className="font-heading font-semibold text-sm mb-1">{type.label}</div>
                <div className="text-xs font-body opacity-70">{type.description}</div>
              </motion.button>
            )
          })}
        </div>

        {/* Filtros */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t pt-4 mt-4 overflow-hidden"
              style={{ borderColor: cardBorder }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-body font-semibold mb-2" style={{ color: textColor }}>
                    Fecha Inicio
                  </label>
                  <input
                    type="date"
                    value={localStartDate}
                    onChange={(e) => setLocalStartDate(e.target.value)}
                    className="w-full px-4 py-2.5 border rounded-xl font-body focus:outline-none focus:ring-1 transition-all"
                    style={{ 
                      borderColor: cardBorder,
                      backgroundColor: sectionBg,
                      color: textColor
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-body font-semibold mb-2" style={{ color: textColor }}>
                    Fecha Fin
                  </label>
                  <input
                    type="date"
                    value={localEndDate}
                    onChange={(e) => setLocalEndDate(e.target.value)}
                    className="w-full px-4 py-2.5 border rounded-xl font-body focus:outline-none focus:ring-1 transition-all"
                    style={{ 
                      borderColor: cardBorder,
                      backgroundColor: sectionBg,
                      color: textColor
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-body font-semibold mb-2" style={{ color: textColor }}>
                    Rol
                  </label>
                  <PremiumSelect
                    value={filters.role || 'all'}
                    onValueChange={(value) => setFilters({ ...filters, role: value as any })}
                    placeholder="Seleccionar rol..."
                    options={[
                      { value: 'all', label: 'Todos' },
                      { value: 'owner', label: 'Owner' },
                      { value: 'admin', label: 'Admin' },
                      { value: 'member', label: 'Member' }
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-sm font-body font-semibold mb-2" style={{ color: textColor }}>
                    Estado
                  </label>
                  <PremiumSelect
                    value={filters.status || 'all'}
                    onValueChange={(value) => setFilters({ ...filters, status: value as any })}
                    placeholder="Seleccionar estado..."
                    options={[
                      { value: 'all', label: 'Todos' },
                      { value: 'active', label: 'Activo' },
                      { value: 'invited', label: 'Invitado' },
                      { value: 'suspended', label: 'Suspendido' }
                    ]}
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <Button 
                  onClick={handleGenerateReport} 
                  disabled={isLoading}
                  variant="gradient"
                  className="font-body"
                  style={{
                    background: `linear-gradient(135deg, ${primaryColor} 0%, ${panelStyles?.secondary_button_color || '#8b5cf6'} 100%)`,
                    boxShadow: `0 4px 14px 0 ${primaryColor}40`
                  }}
                >
                  {isLoading ? 'Generando...' : 'Aplicar Filtros y Regenerar'}
                </Button>
                <Button variant="secondary" onClick={resetFilters} className="font-body">
                  Limpiar Filtros
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Estados de carga y error */}
      {isLoading && (
        <div 
          className="p-12 rounded-2xl border backdrop-blur-sm text-center"
          style={{ backgroundColor: cardBg, borderColor: cardBorder }}
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: primaryColor }}></div>
          <p className="font-body opacity-70">Generando reporte...</p>
        </div>
      )}

      {error && (
        <div 
          className="p-4 rounded-2xl border backdrop-blur-sm"
          style={{ 
            backgroundColor: 'rgba(220, 38, 38, 0.2)',
            borderColor: 'rgba(220, 38, 38, 0.3)'
          }}
        >
          <p className="font-body text-red-400">{error}</p>
        </div>
      )}

      {/* Vista previa del reporte */}
      {reportData && !isLoading && (
        <div 
          className="p-6 rounded-3xl border backdrop-blur-sm"
          style={{ backgroundColor: cardBg, borderColor: cardBorder }}
        >
          <ReportPreview reportType={reportType} data={reportData.data} />
        </div>
      )}
    </div>
  )
}

// Componente de vista previa del reporte
function ReportPreview({ reportType, data }: { reportType: ReportType; data: any }) {
  switch (reportType) {
    case 'users':
      return <UsersReportPreview data={data} />
    case 'activity':
      return <ActivityReportPreview data={data} />
    case 'certificates':
      return <CertificatesReportPreview data={data} />
    default:
      return <div className="font-body opacity-70">Vista previa no disponible</div>
  }
}

// Componentes de vista previa específicos
function UsersReportPreview({ data }: { data: any }) {
  const { styles } = useOrganizationStylesContext()
  const panelStyles = styles?.panel
  const textColor = panelStyles?.text_color || '#f8fafc'
  const primaryColor = panelStyles?.primary_button_color || '#3b82f6'
  const cardBg = panelStyles?.card_background || 'rgba(30, 41, 59, 0.8)'
  const cardBorder = panelStyles?.border_color || 'rgba(51, 65, 85, 0.3)'
  const sectionBg = `${cardBg}CC`

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'username',
      header: 'Username',
      cell: (info) => <span className="font-body">{info.getValue() as string}</span>
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: (info) => <span className="font-body">{info.getValue() as string}</span>
    },
    {
      accessorKey: 'display_name',
      header: 'Nombre',
      cell: (info) => <span className="font-body">{info.getValue() as string}</span>
    },
    {
      accessorKey: 'type_rol',
      header: 'Tipo de Rol',
      cell: (info) => (
        <span 
          className="px-2 py-0.5 rounded-md text-xs font-body"
          style={{ 
            backgroundColor: `${primaryColor}15`,
            color: primaryColor
          }}
        >
          {info.getValue() as string || 'No especificado'}
        </span>
      )
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: (info) => {
        const status = info.getValue() as string
        const statusColors: Record<string, { bg: string; text: string }> = {
          active: { bg: 'rgba(34, 197, 94, 0.15)', text: '#22c55e' },
          invited: { bg: 'rgba(234, 179, 8, 0.15)', text: '#eab308' },
          suspended: { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444' }
        }
        const colors = statusColors[status] || { bg: 'rgba(107, 114, 128, 0.15)', text: '#6b7280' }
        return (
          <span 
            className="px-2 py-0.5 rounded-md text-xs font-body"
            style={{ 
              backgroundColor: colors.bg,
              color: colors.text
            }}
          >
            {status}
          </span>
        )
      }
    },
    {
      accessorKey: 'joined_at',
      header: 'Fecha Ingreso',
      cell: (info) => (
        <span className="font-body">
          {info.getValue() ? new Date(info.getValue() as string).toLocaleDateString('es-ES') : '-'}
        </span>
      )
    },
    {
      accessorKey: 'last_login_at',
      header: 'Última Conexión',
      cell: (info) => {
        const date = info.getValue() as string | null
        if (!date) return <span className="font-body text-sm opacity-50">Nunca</span>
        const loginDate = new Date(date)
        const now = new Date()
        const diff = now.getTime() - loginDate.getTime()
        const days = Math.floor(diff / (1000 * 60 * 60 * 24))
        const hours = Math.floor(diff / (1000 * 60 * 60))
        const minutes = Math.floor(diff / (1000 * 60))
        
        let relativeTime = ''
        if (days > 0) relativeTime = `Hace ${days} día${days > 1 ? 's' : ''}`
        else if (hours > 0) relativeTime = `Hace ${hours} hora${hours > 1 ? 's' : ''}`
        else if (minutes > 0) relativeTime = `Hace ${minutes} min`
        else relativeTime = 'Ahora'
        
        return (
          <span className="font-body text-sm" title={loginDate.toLocaleDateString('es-ES', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}>
            {relativeTime}
          </span>
        )
      }
    },
    {
      id: 'courses',
      header: 'Cursos',
      cell: (info) => {
        const row = info.row.original
        const courses = row.courses || []
        if (courses.length === 0) {
          return <span className="font-body text-sm opacity-50">-</span>
        }
        return (
          <span 
            className="font-body text-sm"
            style={{ color: primaryColor }}
            title={courses.map((c: any) => c.course_title).join(', ')}
          >
            {courses.length}
          </span>
        )
      }
    },
    {
      id: 'progress',
      header: 'Progreso',
      cell: (info) => {
        const row = info.row.original
        const progress = row.progress || {}
        const avgProgress = progress.average_progress || 0
        return (
          <div className="flex items-center gap-2">
            <span className="font-body text-sm font-semibold" style={{ color: primaryColor }}>
              {avgProgress.toFixed(0)}%
            </span>
            <div 
              className="h-1.5 rounded-full flex-1 max-w-[60px]"
              style={{ backgroundColor: `${cardBorder}50` }}
            >
              <div 
                className="h-full rounded-full transition-all"
                style={{ 
                  width: `${Math.min(avgProgress, 100)}%`,
                  backgroundColor: primaryColor
                }}
              />
            </div>
          </div>
        )
      }
    },
    {
      id: 'certificates',
      header: 'Certificados',
      cell: (info) => {
        const row = info.row.original
        const certificates = row.certificates || []
        if (certificates.length === 0) {
          return <span className="font-body text-sm opacity-50">-</span>
        }
        return (
          <span 
            className="font-body text-sm"
            style={{ color: panelStyles?.secondary_button_color || '#8b5cf6' }}
            title={certificates.map((c: any) => c.course_title).join(', ')}
          >
            {certificates.length}
          </span>
        )
      }
    }
  ]

  // Datos para gráficos - usar type_rol en lugar de role
  const roleData = Object.entries(data.summary?.by_type_rol || {}).map(([typeRol, count]) => ({
    name: typeRol || 'No especificado',
    value: count
  }))

  const statusData = Object.entries(data.summary?.by_status || {}).map(([status, count]) => ({
    name: status,
    value: count
  }))

  const COLORS = [primaryColor, panelStyles?.secondary_button_color || '#8b5cf6', '#10b981', '#f59e0b', '#ef4444']

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-heading font-semibold mb-4">Reporte de Usuarios</h3>
      
      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div 
          className="p-4 rounded-2xl border backdrop-blur-sm"
          style={{ backgroundColor: sectionBg, borderColor: cardBorder }}
        >
          <p className="text-sm font-body opacity-70 mb-1">Total Usuarios</p>
          <p className="text-2xl font-heading font-bold">{data.total_users || 0}</p>
        </div>
        <div 
          className="p-4 rounded-2xl border backdrop-blur-sm"
          style={{ backgroundColor: sectionBg, borderColor: cardBorder }}
        >
          <p className="text-sm font-body opacity-70 mb-1">Por Tipo de Rol</p>
          <div className="text-sm font-body mt-1 space-y-1">
            {Object.entries(data.summary?.by_type_rol || {}).map(([typeRol, count]: [string, any]) => (
              <div key={typeRol}>{typeRol || 'No especificado'}: {count}</div>
            ))}
          </div>
        </div>
        <div 
          className="p-4 rounded-2xl border backdrop-blur-sm"
          style={{ backgroundColor: sectionBg, borderColor: cardBorder }}
        >
          <p className="text-sm font-body opacity-70 mb-1">Por Estado</p>
          <div className="text-sm font-body mt-1 space-y-1">
            {Object.entries(data.summary?.by_status || {}).map(([status, count]: [string, any]) => (
              <div key={status}>{status}: {count}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Gráficos */}
      {(roleData.length > 0 || statusData.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roleData.length > 0 && (
            <div 
              className="p-4 rounded-2xl border backdrop-blur-sm"
              style={{ backgroundColor: sectionBg, borderColor: cardBorder }}
            >
              <p className="text-sm font-heading font-semibold mb-4">Distribución por Tipo de Rol</p>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={roleData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {roleData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          {statusData.length > 0 && (
            <div 
              className="p-4 rounded-2xl border backdrop-blur-sm"
              style={{ backgroundColor: sectionBg, borderColor: cardBorder }}
            >
              <p className="text-sm font-heading font-semibold mb-4">Distribución por Estado</p>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Tabla */}
      <ReportTable data={data.users || []} columns={columns} />
    </div>
  )
}

function ActivityReportPreview({ data }: { data: any }) {
  const { styles } = useOrganizationStylesContext()
  const panelStyles = styles?.panel
  const textColor = panelStyles?.text_color || '#f8fafc'
  const primaryColor = panelStyles?.primary_button_color || '#3b82f6'
  const cardBg = panelStyles?.card_background || 'rgba(30, 41, 59, 0.8)'
  const cardBorder = panelStyles?.border_color || 'rgba(51, 65, 85, 0.3)'
  const sectionBg = `${cardBg}CC`

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'user_name',
      header: 'Usuario',
      cell: (info) => <span className="font-body">{info.getValue() as string}</span>
    },
    {
      accessorKey: 'course_title',
      header: 'Curso',
      cell: (info) => <span className="font-body">{info.getValue() as string}</span>
    },
    {
      accessorKey: 'enrollment_status',
      header: 'Estado',
      cell: (info) => {
        const status = info.getValue() as string
        const statusColors: Record<string, string> = {
          active: 'bg-green-500/20 text-green-400',
          completed: 'bg-blue-500/20 text-blue-400',
          inactive: 'bg-gray-500/20 text-gray-400'
        }
        return (
          <span className={`px-2 py-1 rounded-lg text-xs font-body ${statusColors[status] || 'bg-gray-500/20 text-gray-400'}`}>
            {status === 'active' ? 'Activo' : status === 'completed' ? 'Completado' : 'Inactivo'}
          </span>
        )
      }
    },
    {
      accessorKey: 'enrolled_at',
      header: 'Fecha Inscripción',
      cell: (info) => (
        <span className="font-body">
          {info.getValue() ? new Date(info.getValue() as string).toLocaleDateString('es-ES') : '-'}
        </span>
      )
    },
    {
      accessorKey: 'last_accessed_at',
      header: 'Último Acceso',
      cell: (info) => (
        <span className="font-body">
          {info.getValue() ? new Date(info.getValue() as string).toLocaleDateString('es-ES') : '-'}
        </span>
      )
    }
  ]

  // Datos para gráficos
  const statusData = [
    { name: 'Activos', value: data.active_count || 0 },
    { name: 'Completados', value: data.completed_count || 0 },
    { name: 'Inactivos', value: data.inactive_count || 0 }
  ]

  const courseActivityData = (data.activity_by_course || []).slice(0, 10).map((c: any) => ({
    name: c.course_title?.substring(0, 20) || 'Curso',
    activos: c.active || 0,
    completados: c.completed || 0,
    inactivos: c.inactive || 0
  }))

  const COLORS = [primaryColor, panelStyles?.secondary_button_color || '#8b5cf6', '#10b981', '#f59e0b', '#ef4444']

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-heading font-semibold mb-4">Reporte de Actividad</h3>
      
      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div 
          className="p-4 rounded-2xl border backdrop-blur-sm"
          style={{ backgroundColor: sectionBg, borderColor: cardBorder }}
        >
          <p className="text-sm font-body opacity-70 mb-1">Total Actividades</p>
          <p className="text-2xl font-heading font-bold">{data.total_activities || 0}</p>
        </div>
        <div 
          className="p-4 rounded-2xl border backdrop-blur-sm"
          style={{ backgroundColor: sectionBg, borderColor: cardBorder }}
        >
          <p className="text-sm font-body opacity-70 mb-1">Total Usuarios</p>
          <p className="text-2xl font-heading font-bold">{data.total_users || 0}</p>
        </div>
        <div 
          className="p-4 rounded-2xl border backdrop-blur-sm"
          style={{ backgroundColor: sectionBg, borderColor: cardBorder }}
        >
          <p className="text-sm font-body opacity-70 mb-1">Activos</p>
          <p className="text-2xl font-heading font-bold">{data.active_count || 0}</p>
        </div>
        <div 
          className="p-4 rounded-2xl border backdrop-blur-sm"
          style={{ backgroundColor: sectionBg, borderColor: cardBorder }}
        >
          <p className="text-sm font-body opacity-70 mb-1">Completados</p>
          <p className="text-2xl font-heading font-bold">{data.completed_count || 0}</p>
        </div>
      </div>

      {/* Gráficos */}
      {statusData.some(s => s.value > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div 
            className="p-4 rounded-2xl border backdrop-blur-sm"
            style={{ backgroundColor: sectionBg, borderColor: cardBorder }}
          >
            <p className="text-sm font-heading font-semibold mb-4">Distribución por Estado</p>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={statusData.filter(s => s.value > 0)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.filter(s => s.value > 0).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {courseActivityData.length > 0 && (
            <div 
              className="p-4 rounded-2xl border backdrop-blur-sm"
              style={{ backgroundColor: sectionBg, borderColor: cardBorder }}
            >
              <p className="text-sm font-heading font-semibold mb-4">Actividad por Curso</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={courseActivityData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="name" tick={{ fill: textColor, fontSize: 10 }} angle={-45} textAnchor="end" height={80} />
                  <YAxis tick={{ fill: textColor, fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: cardBg, 
                      border: `1px solid ${cardBorder}`,
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="activos" fill={primaryColor} name="Activos" />
                  <Bar dataKey="completados" fill={panelStyles?.secondary_button_color || '#8b5cf6'} name="Completados" />
                  <Bar dataKey="inactivos" fill="#6b7280" name="Inactivos" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Tabla */}
      <ReportTable data={data.activities || []} columns={columns} />
    </div>
  )
}

function CertificatesReportPreview({ data }: { data: any }) {
  const { styles } = useOrganizationStylesContext()
  const panelStyles = styles?.panel
  const textColor = panelStyles?.text_color || '#f8fafc'
  const primaryColor = panelStyles?.primary_button_color || '#3b82f6'
  const cardBg = panelStyles?.card_background || 'rgba(30, 41, 59, 0.8)'
  const cardBorder = panelStyles?.border_color || 'rgba(51, 65, 85, 0.3)'
  const sectionBg = `${cardBg}CC`

  const handleViewCertificate = (certificateUrl?: string, certificateId?: string) => {
    if (certificateUrl) {
      // Si hay URL, abrir en nueva ventana
      window.open(certificateUrl, '_blank')
    } else if (certificateId) {
      // Si no hay URL pero hay ID, intentar obtener desde el endpoint
      window.open(`/api/business/certificates/${certificateId}/download`, '_blank')
    }
  }

  const handleDownloadCertificate = async (certificateUrl?: string, certificateId?: string, courseTitle?: string, userName?: string) => {
    try {
      // Si hay URL directa, descargar desde ahí
      if (certificateUrl) {
        const response = await fetch(certificateUrl)
        if (!response.ok) {
          throw new Error('Error al obtener el certificado')
        }
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        const fileName = `${(userName || 'Usuario').replace(/[^a-z0-9]/gi, '_')}_${(courseTitle || 'Certificado').replace(/[^a-z0-9]/gi, '_')}_certificado.pdf`
        a.download = fileName
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        return
      }

      // Si hay ID pero no URL, usar el endpoint de descarga para business
      if (certificateId) {
        const response = await fetch(`/api/business/certificates/${certificateId}/download`, {
          credentials: 'include'
        })

        if (!response.ok) {
          const data = await response.json().catch(() => ({}))
          throw new Error(data.error || 'Error al descargar certificado')
        }

        // Si la respuesta es una redirección, abrir en nueva ventana
        if (response.redirected) {
          window.open(response.url, '_blank')
        } else {
          // Descargar el archivo
          const blob = await response.blob()
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          const fileName = `${(userName || 'Usuario').replace(/[^a-z0-9]/gi, '_')}_${(courseTitle || 'Certificado').replace(/[^a-z0-9]/gi, '_')}_certificado.pdf`
          a.download = fileName
          document.body.appendChild(a)
          a.click()
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)
        }
      }
    } catch (err) {
      console.error('Error downloading certificate:', err)
      alert(err instanceof Error ? err.message : 'Error al descargar certificado')
    }
  }

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'user_name',
      header: 'Usuario',
      cell: (info) => <span className="font-body">{info.getValue() as string}</span>
    },
    {
      accessorKey: 'course_title',
      header: 'Curso',
      cell: (info) => <span className="font-body">{info.getValue() as string}</span>
    },
    {
      accessorKey: 'course_category',
      header: 'Categoría',
      cell: (info) => (
        <span className="font-body">
          {info.getValue() || '-'}
        </span>
      )
    },
    {
      accessorKey: 'issued_at',
      header: 'Fecha Emisión',
      cell: (info) => (
        <span className="font-body">
          {info.getValue() ? new Date(info.getValue() as string).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }) : '-'}
        </span>
      )
    },
    {
      id: 'certificate_preview',
      header: 'Vista Previa',
      cell: (info) => {
        const row = info.row.original
        const certificateUrl = row.certificate_url
        
        // Si es una imagen, mostrar vista previa
        if (certificateUrl && (certificateUrl.endsWith('.png') || certificateUrl.endsWith('.jpg') || certificateUrl.endsWith('.jpeg'))) {
          return (
            <div className="flex items-center">
              <img 
                src={certificateUrl} 
                alt="Vista previa del certificado" 
                className="w-16 h-12 object-cover rounded-lg border cursor-pointer hover:opacity-80 transition-opacity"
                style={{ borderColor: cardBorder }}
                onClick={() => window.open(certificateUrl, '_blank')}
                title="Haz clic para ver el certificado completo"
              />
            </div>
          )
        }
        
        // Si es PDF o no se puede determinar, mostrar icono
        return (
          <div className="flex items-center">
            <div 
              className="w-16 h-12 rounded-lg border flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
              style={{ borderColor: cardBorder, backgroundColor: sectionBg }}
              onClick={() => certificateUrl ? window.open(certificateUrl, '_blank') : null}
              title="Haz clic para ver el certificado"
            >
              <Award className="w-6 h-6" style={{ color: primaryColor }} />
            </div>
          </div>
        )
      }
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: (info) => {
        const row = info.row.original
        const certificateId = row.certificate_id
        const certificateUrl = row.certificate_url
        const courseTitle = row.course_title || 'Certificado'
        const userName = row.user_name || 'Usuario'
        
        return (
          <div className="flex items-center gap-2">
            {(certificateUrl || certificateId) && (
              <>
                <button
                  onClick={() => handleViewCertificate(certificateUrl, certificateId)}
                  className="p-2 rounded-lg border font-body text-sm transition-all hover:opacity-80"
                  style={{
                    borderColor: cardBorder,
                    backgroundColor: sectionBg,
                    color: textColor
                  }}
                  title="Ver certificado"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDownloadCertificate(certificateUrl, certificateId, courseTitle, userName)}
                  className="p-2 rounded-lg border font-body text-sm transition-all hover:opacity-80"
                  style={{
                    borderColor: cardBorder,
                    backgroundColor: sectionBg,
                    color: textColor
                  }}
                  title="Descargar certificado"
                >
                  <Download className="w-4 h-4" />
                </button>
              </>
            )}
            {!certificateUrl && !certificateId && (
              <span className="text-xs font-body opacity-50">No disponible</span>
            )}
          </div>
        )
      }
    }
  ]

  // Datos para gráficos
  const courseCertData = (data.certificates_by_course || []).map((c: any) => ({
    name: c.course_title?.substring(0, 20) || 'Curso',
    certificados: c.count || 0
  }))

  const userCertData = (data.certificates_by_user || []).slice(0, 10).map((u: any) => ({
    name: u.user_name?.substring(0, 15) || 'Usuario',
    certificados: u.count || 0
  }))

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-heading font-semibold mb-4">Reporte de Certificados</h3>
      
      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div 
          className="p-4 rounded-2xl border backdrop-blur-sm"
          style={{ backgroundColor: sectionBg, borderColor: cardBorder }}
        >
          <p className="text-sm font-body opacity-70 mb-1">Total Certificados</p>
          <p className="text-2xl font-heading font-bold">{data.total_certificates || 0}</p>
        </div>
        <div 
          className="p-4 rounded-2xl border backdrop-blur-sm"
          style={{ backgroundColor: sectionBg, borderColor: cardBorder }}
        >
          <p className="text-sm font-body opacity-70 mb-1">Usuarios con Certificados</p>
          <p className="text-2xl font-heading font-bold">{data.total_users_with_certificates || 0}</p>
        </div>
        <div 
          className="p-4 rounded-2xl border backdrop-blur-sm"
          style={{ backgroundColor: sectionBg, borderColor: cardBorder }}
        >
          <p className="text-sm font-body opacity-70 mb-1">Promedio por Usuario</p>
          <p className="text-2xl font-heading font-bold">
            {data.total_users_with_certificates > 0 
              ? (data.total_certificates / data.total_users_with_certificates).toFixed(1)
              : 0}
          </p>
        </div>
      </div>

      {/* Gráficos */}
      {(courseCertData.length > 0 || userCertData.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {courseCertData.length > 0 && (
            <div 
              className="p-4 rounded-2xl border backdrop-blur-sm"
              style={{ backgroundColor: sectionBg, borderColor: cardBorder }}
            >
              <p className="text-sm font-heading font-semibold mb-4">Certificados por Curso</p>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={courseCertData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="name" tick={{ fill: textColor, fontSize: 10 }} angle={-45} textAnchor="end" height={80} />
                  <YAxis tick={{ fill: textColor, fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: cardBg, 
                      border: `1px solid ${cardBorder}`,
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="certificados" fill={primaryColor} name="Certificados" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          {userCertData.length > 0 && (
            <div 
              className="p-4 rounded-2xl border backdrop-blur-sm"
              style={{ backgroundColor: sectionBg, borderColor: cardBorder }}
            >
              <p className="text-sm font-heading font-semibold mb-4">Certificados por Usuario</p>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={userCertData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="name" tick={{ fill: textColor, fontSize: 10 }} angle={-45} textAnchor="end" height={80} />
                  <YAxis tick={{ fill: textColor, fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: cardBg, 
                      border: `1px solid ${cardBorder}`,
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="certificados" fill={panelStyles?.secondary_button_color || '#8b5cf6'} name="Certificados" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Tabla */}
      <ReportTable data={data.certificates || []} columns={columns} />
    </div>
  )
}
