'use client'

import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  Activity,
  Award,
  Filter,
  FileSpreadsheet,
  Download,
  Calendar,
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon,
  RefreshCw,
  Eye,
  X
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
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

// ============================================
// TIPOS Y CONSTANTES
// ============================================
// Los colores se definirán dinámicamente basados en el accent color de la organización
const getReportTypes = (accentColor: string) => [
  { value: 'users' as ReportType, label: 'Usuarios', icon: Users, description: 'Información detallada de usuarios', color: accentColor },
  { value: 'activity' as ReportType, label: 'Actividad', icon: Activity, description: 'Seguimiento de actividad reciente', color: '#10b981' },
  { value: 'certificates' as ReportType, label: 'Certificados', icon: Award, description: 'Certificados emitidos', color: '#8b5cf6' }
]

const getChartColors = (accentColor: string) => [accentColor, '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899']

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export function BusinessReports() {
  const { styles } = useOrganizationStylesContext()
  const panelStyles = styles?.panel
  const hasFetched = useRef(false)

  const cardBg = panelStyles?.card_background || 'rgba(30, 41, 59, 0.8)'
  const cardBorder = panelStyles?.border_color || 'rgba(51, 65, 85, 0.3)'
  const textColor = panelStyles?.text_color || '#f8fafc'
  const accentColor = panelStyles?.accent_color || '#00D4B3'
  const primaryColor = panelStyles?.primary_button_color || '#0A2540'
  const secondaryColor = panelStyles?.secondary_button_color || '#10b981'

  // Colores dinámicos basados en el accent de la organización
  const REPORT_TYPES = getReportTypes(accentColor)
  const CHART_COLORS = getChartColors(accentColor)

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

  // Fetch inicial solo una vez por tipo de reporte
  const handleReportTypeChange = useCallback((type: ReportType) => {
    setReportType(type)
    hasFetched.current = false
  }, [setReportType])

  // Generar reporte manualmente
  const handleGenerateReport = useCallback(() => {
    fetchReport(reportType, {
      ...filters,
      start_date: localStartDate || undefined,
      end_date: localEndDate || undefined
    })
    hasFetched.current = true
  }, [filters, localStartDate, localEndDate, fetchReport, reportType])

  // Auto-fetch cuando cambia el tipo (solo si no se ha hecho fetch)
  if (!hasFetched.current && reportType && !isLoading && !reportData) {
    fetchReport(reportType, filters)
    hasFetched.current = true
  }

  // Exportar a Excel
  const handleExportExcel = async () => {
    if (!reportData?.data) {
      alert('No hay datos para exportar.')
      return
    }
    try {
      const XLSX = await import('xlsx')
      const workbook = XLSX.utils.book_new()
      let worksheet: any
      let filename = `reporte_${reportType}_${new Date().toISOString().split('T')[0]}.xlsx`

      switch (reportType) {
        case 'users':
          worksheet = XLSX.utils.json_to_sheet(
            (reportData.data.users || []).map((u: any) => ({
              'Username': u.username,
              'Email': u.email,
              'Nombre': u.display_name,
              'Tipo de Rol': u.type_rol || 'No especificado',
              'Estado': u.status,
              'Fecha de Ingreso': u.joined_at ? new Date(u.joined_at).toLocaleDateString('es-ES') : '',
              'Última Conexión': u.last_login_at ? new Date(u.last_login_at).toLocaleDateString('es-ES') : 'Nunca',
              'Total Cursos': u.progress?.total_courses || 0,
              'Cursos Completados': u.progress?.completed_courses || 0,
              'Progreso Promedio': `${u.progress?.average_progress?.toFixed(1) || 0}%`
            }))
          )
          break
        case 'activity':
          worksheet = XLSX.utils.json_to_sheet(
            (reportData.data.activities || []).map((a: any) => ({
              'Usuario': a.user_name || a.user_id,
              'Email': a.user_email || '',
              'Curso': a.course_title || a.course_id,
              'Estado': a.enrollment_status,
              'Fecha Inscripción': a.enrolled_at || '',
              'Último Acceso': a.last_accessed_at || ''
            }))
          )
          break
        case 'certificates':
          worksheet = XLSX.utils.json_to_sheet(
            (reportData.data.certificates || []).map((c: any) => ({
              'Usuario': c.user_name || c.user_id,
              'Email': c.user_email || '',
              'Curso': c.course_title || c.course_id,
              'Categoría': c.course_category || '',
              'Fecha Emisión': c.issued_at || ''
            }))
          )
          break
        default:
          return
      }

      XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos')
      XLSX.writeFile(workbook, filename)
    } catch (err) {
      console.error('Error al exportar Excel:', err)
      alert('Error al exportar el reporte.')
    }
  }

  return (
    <div className="w-full space-y-6" style={{ color: textColor }}>
      {/* Header Premium */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl p-8"
        style={{ 
          background: `linear-gradient(135deg, ${primaryColor}20 0%, ${secondaryColor}10 100%)`,
          border: `1px solid ${cardBorder}`
        }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10"
          style={{ background: `radial-gradient(circle, ${primaryColor} 0%, transparent 70%)` }}
        />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl" style={{ backgroundColor: `${primaryColor}20` }}>
              <BarChart3 className="w-6 h-6" style={{ color: primaryColor }} />
            </div>
            <span className="text-sm font-medium uppercase tracking-wider opacity-70">Centro de Reportes</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">Reportes y Análisis</h1>
          <p className="text-sm opacity-70 max-w-xl">
            Genera reportes detallados de usuarios, actividad y certificados. Exporta los datos en formato Excel.
          </p>
        </div>
      </motion.div>

      {/* Selector de Tipo de Reporte */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {REPORT_TYPES.map((type, index) => {
          const Icon = type.icon
          const isSelected = reportType === type.value
          return (
            <motion.button
              key={type.value}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => handleReportTypeChange(type.value)}
              disabled={isLoading}
              className="relative group p-6 rounded-2xl border-2 text-left transition-all overflow-hidden"
              style={{
                backgroundColor: isSelected ? `${type.color}15` : cardBg,
                borderColor: isSelected ? type.color : cardBorder
              }}
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
            >
              {isSelected && (
                <motion.div
                  layoutId="activeReport"
                  className="absolute inset-0 rounded-2xl"
                  style={{ backgroundColor: `${type.color}10` }}
                />
              )}
              <div className="relative z-10">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${type.color}20` }}
                >
                  <Icon className="w-6 h-6" style={{ color: type.color }} />
                </div>
                <h3 className="font-bold text-lg mb-1">{type.label}</h3>
                <p className="text-sm opacity-60">{type.description}</p>
              </div>
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-4 right-4 w-3 h-3 rounded-full"
                  style={{ backgroundColor: type.color }}
                />
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Barra de Acciones */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl border"
        style={{ backgroundColor: cardBg, borderColor: cardBorder }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all hover:opacity-80"
            style={{
              backgroundColor: showFilters ? `${accentColor}20` : 'transparent',
              borderColor: showFilters ? accentColor : cardBorder,
              color: showFilters ? accentColor : textColor
            }}
          >
            <Filter className="w-4 h-4" />
            Filtros
            {showFilters && <X className="w-4 h-4" />}
          </button>
          <button
            onClick={handleGenerateReport}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all hover:opacity-80 disabled:opacity-50"
            style={{
              backgroundColor: 'transparent',
              borderColor: cardBorder,
              color: textColor
            }}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Generando...' : 'Actualizar'}
          </button>
        </div>
        <div className="flex items-center gap-2">
          {reportData && (
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-90 text-white"
              style={{
                background: `linear-gradient(135deg, ${accentColor} 0%, ${secondaryColor} 100%)`,
                boxShadow: `0 4px 14px 0 ${accentColor}40`
              }}
            >
              <FileSpreadsheet className="w-4 h-4" />
              Exportar Excel
            </button>
          )}
        </div>
      </motion.div>

      {/* Panel de Filtros */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div
              className="p-6 rounded-2xl border space-y-4"
              style={{ backgroundColor: cardBg, borderColor: cardBorder }}
            >
              <h3 className="font-semibold flex items-center gap-2">
                <Calendar className="w-4 h-4" style={{ color: accentColor }} />
                Filtros de Fecha y Estado
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 opacity-70">Fecha Inicio</label>
                  <input
                    type="date"
                    value={localStartDate}
                    onChange={(e) => setLocalStartDate(e.target.value)}
                    className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 transition-all"
                    style={{ 
                      borderColor: cardBorder,
                      backgroundColor: `${cardBg}CC`,
                      color: textColor
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 opacity-70">Fecha Fin</label>
                  <input
                    type="date"
                    value={localEndDate}
                    onChange={(e) => setLocalEndDate(e.target.value)}
                    className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 transition-all"
                    style={{ 
                      borderColor: cardBorder,
                      backgroundColor: `${cardBg}CC`,
                      color: textColor
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 opacity-70">Rol</label>
                  <PremiumSelect
                    value={filters.role || 'all'}
                    onValueChange={(value) => setFilters({ ...filters, role: value as any })}
                    placeholder="Seleccionar rol..."
                    options={[
                      { value: 'all', label: 'Todos' },
                      { value: 'owner', label: 'Owner' },
                      { value: 'admin', label: 'Admin' },
                      { value: 'member', label: 'Miembro' }
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 opacity-70">Estado</label>
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
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleGenerateReport}
                  disabled={isLoading}
                  className="px-4 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-90 text-white disabled:opacity-50"
                  style={{ background: `linear-gradient(135deg, ${accentColor} 0%, ${secondaryColor} 100%)` }}
                >
                  Aplicar Filtros
                </button>
                <button
                  onClick={() => { resetFilters(); setLocalStartDate(''); setLocalEndDate('') }}
                  className="px-4 py-2 rounded-xl border text-sm font-medium transition-all hover:opacity-80"
                  style={{ borderColor: cardBorder, color: textColor }}
                >
                  Limpiar
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Estado de Carga */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-12 rounded-2xl border text-center"
          style={{ backgroundColor: cardBg, borderColor: cardBorder }}
        >
          <div className="inline-flex items-center gap-3">
            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: primaryColor, borderTopColor: 'transparent' }} />
            <span className="opacity-70">Generando reporte...</span>
          </div>
        </motion.div>
      )}

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 rounded-2xl border bg-red-500/10 border-red-500/30"
        >
          <p className="text-red-400">{error}</p>
        </motion.div>
      )}

      {/* Contenido del Reporte */}
      {reportData && !isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <ReportContent reportType={reportType} data={reportData.data} />
        </motion.div>
      )}
    </div>
  )
}

// ============================================
// COMPONENTE DE CONTENIDO DEL REPORTE
// ============================================
function ReportContent({ reportType, data }: { reportType: ReportType; data: any }) {
  switch (reportType) {
    case 'users':
      return <UsersReport data={data} />
    case 'activity':
      return <ActivityReport data={data} />
    case 'certificates':
      return <CertificatesReport data={data} />
    default:
      return <div className="opacity-70">Tipo de reporte no disponible</div>
  }
}

// ============================================
// REPORTE DE USUARIOS
// ============================================
function UsersReport({ data }: { data: any }) {
  const { styles } = useOrganizationStylesContext()
  const panelStyles = styles?.panel
  const textColor = panelStyles?.text_color || '#f8fafc'
  const accentColor = panelStyles?.accent_color || '#00D4B3'
  const cardBg = panelStyles?.card_background || 'rgba(30, 41, 59, 0.8)'
  const cardBorder = panelStyles?.border_color || 'rgba(51, 65, 85, 0.3)'
  
  const CHART_COLORS = [accentColor, '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899']

  const roleData = Object.entries(data.summary?.by_type_rol || {}).map(([name, value]) => ({
    name: name || 'Sin especificar',
    value: value as number
  }))

  const statusData = Object.entries(data.summary?.by_status || {}).map(([name, value]) => ({
    name: name === 'active' ? 'Activos' : name === 'invited' ? 'Invitados' : name === 'suspended' ? 'Suspendidos' : name,
    value: value as number
  }))

  const columns: ColumnDef<any>[] = [
    { accessorKey: 'username', header: 'Username' },
    { accessorKey: 'email', header: 'Email' },
    { accessorKey: 'display_name', header: 'Nombre' },
    { accessorKey: 'type_rol', header: 'Rol', cell: (info) => (
      <span className="px-2 py-1 rounded-lg text-xs" style={{ backgroundColor: `${accentColor}20`, color: accentColor }}>
        {(info.getValue() as string) || 'No especificado'}
      </span>
    )},
    { accessorKey: 'status', header: 'Estado', cell: (info) => {
      const status = info.getValue() as string
      const colors: Record<string, string> = { active: '#10b981', invited: '#f59e0b', suspended: '#ef4444' }
      return (
        <span className="px-2 py-1 rounded-lg text-xs" style={{ backgroundColor: `${colors[status] || '#6b7280'}20`, color: colors[status] || '#6b7280' }}>
          {status}
        </span>
      )
    }},
    { accessorKey: 'joined_at', header: 'Ingreso', cell: (info) => info.getValue() ? new Date(info.getValue() as string).toLocaleDateString('es-ES') : '-' }
  ]

  return (
    <div className="space-y-6">
      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Total Usuarios" value={data.total_users || 0} icon={Users} color={accentColor} />
        <StatCard label="Usuarios Activos" value={data.summary?.by_status?.active || 0} icon={TrendingUp} color="#10b981" />
        <StatCard label="Roles Diferentes" value={Object.keys(data.summary?.by_type_rol || {}).length} icon={Award} color="#8b5cf6" />
      </div>

      {/* Gráficos */}
      {(roleData.length > 0 || statusData.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {roleData.length > 0 && (
            <ChartCard title="Distribución por Rol">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={roleData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                    {roleData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          )}
          {statusData.length > 0 && (
            <ChartCard title="Distribución por Estado">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={statusData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={cardBorder} opacity={0.3} />
                  <XAxis dataKey="name" tick={{ fill: textColor, fontSize: 12 }} axisLine={{ stroke: cardBorder }} />
                  <YAxis tick={{ fill: textColor, fontSize: 12 }} axisLine={{ stroke: cardBorder }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: cardBg, 
                      border: `1px solid ${cardBorder}`,
                      borderRadius: '8px',
                      color: textColor
                    }}
                    labelStyle={{ color: textColor }}
                  />
                  <Bar dataKey="value" fill={accentColor} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}
        </div>
      )}

      {/* Tabla */}
      <ReportTable data={data.users || []} columns={columns} />
    </div>
  )
}

// ============================================
// REPORTE DE ACTIVIDAD
// ============================================
function ActivityReport({ data }: { data: any }) {
  const { styles } = useOrganizationStylesContext()
  const panelStyles = styles?.panel
  const textColor = panelStyles?.text_color || '#f8fafc'
  const accentColor = panelStyles?.accent_color || '#00D4B3'
  const cardBg = panelStyles?.card_background || 'rgba(30, 41, 59, 0.8)'
  const cardBorder = panelStyles?.border_color || 'rgba(51, 65, 85, 0.3)'
  
  const CHART_COLORS = [accentColor, '#8b5cf6', '#10b981', '#f59e0b', '#ef4444']

  const statusData = [
    { name: 'Activos', value: data.active_count || 0 },
    { name: 'Completados', value: data.completed_count || 0 },
    { name: 'Inactivos', value: data.inactive_count || 0 }
  ].filter(s => s.value > 0)

  const columns: ColumnDef<any>[] = [
    { accessorKey: 'user_name', header: 'Usuario' },
    { accessorKey: 'course_title', header: 'Curso' },
    { accessorKey: 'enrollment_status', header: 'Estado', cell: (info) => {
      const status = info.getValue() as string
      const colors: Record<string, string> = { active: '#10b981', completed: accentColor, inactive: '#6b7280' }
      return (
        <span className="px-2 py-1 rounded-lg text-xs" style={{ backgroundColor: `${colors[status] || '#6b7280'}20`, color: colors[status] || '#6b7280' }}>
          {status === 'active' ? 'Activo' : status === 'completed' ? 'Completado' : 'Inactivo'}
        </span>
      )
    }},
    { accessorKey: 'enrolled_at', header: 'Inscripción', cell: (info) => info.getValue() ? new Date(info.getValue() as string).toLocaleDateString('es-ES') : '-' },
    { accessorKey: 'last_accessed_at', header: 'Último Acceso', cell: (info) => info.getValue() ? new Date(info.getValue() as string).toLocaleDateString('es-ES') : '-' }
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Total Actividades" value={data.total_activities || 0} icon={Activity} color={accentColor} />
        <StatCard label="Usuarios" value={data.total_users || 0} icon={Users} color="#8b5cf6" />
        <StatCard label="Activos" value={data.active_count || 0} icon={TrendingUp} color="#10b981" />
        <StatCard label="Completados" value={data.completed_count || 0} icon={Award} color="#f59e0b" />
      </div>

      {statusData.length > 0 && (
        <ChartCard title="Estado de Actividades">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                {statusData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: cardBg, 
                  border: `1px solid ${cardBorder}`,
                  borderRadius: '8px',
                  color: textColor
                }}
              />
              <Legend wrapperStyle={{ color: textColor }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      <ReportTable data={data.activities || []} columns={columns} />
    </div>
  )
}

// ============================================
// REPORTE DE CERTIFICADOS
// ============================================
function CertificatesReport({ data }: { data: any }) {
  const { styles } = useOrganizationStylesContext()
  const panelStyles = styles?.panel
  const textColor = panelStyles?.text_color || '#f8fafc'
  const accentColor = panelStyles?.accent_color || '#00D4B3'
  const cardBg = panelStyles?.card_background || 'rgba(30, 41, 59, 0.8)'
  const cardBorder = panelStyles?.border_color || 'rgba(51, 65, 85, 0.3)'

  const courseCertData = (data.certificates_by_course || []).slice(0, 8).map((c: any) => ({
    name: (c.course_title || 'Curso').substring(0, 15),
    certificados: c.count || 0
  }))

  const columns: ColumnDef<any>[] = [
    { accessorKey: 'user_name', header: 'Usuario' },
    { accessorKey: 'course_title', header: 'Curso' },
    { accessorKey: 'course_category', header: 'Categoría', cell: (info) => info.getValue() || '-' },
    { accessorKey: 'issued_at', header: 'Fecha Emisión', cell: (info) => info.getValue() ? new Date(info.getValue() as string).toLocaleDateString('es-ES') : '-' },
    { id: 'actions', header: 'Ver', cell: (info) => {
      const url = info.row.original.certificate_url
      return url ? (
        <button onClick={() => window.open(url, '_blank')} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
          <Eye className="w-4 h-4" style={{ color: accentColor }} />
        </button>
      ) : <span className="opacity-50 text-xs">-</span>
    }}
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Total Certificados" value={data.total_certificates || 0} icon={Award} color="#8b5cf6" />
        <StatCard label="Usuarios Certificados" value={data.total_users_with_certificates || 0} icon={Users} color={accentColor} />
        <StatCard label="Promedio por Usuario" value={data.total_users_with_certificates > 0 ? (data.total_certificates / data.total_users_with_certificates).toFixed(1) : '0'} icon={TrendingUp} color="#10b981" />
      </div>

      {courseCertData.length > 0 && (
        <ChartCard title="Certificados por Curso">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={courseCertData}>
              <CartesianGrid strokeDasharray="3 3" stroke={cardBorder} opacity={0.3} />
              <XAxis dataKey="name" tick={{ fill: textColor, fontSize: 10 }} angle={-45} textAnchor="end" height={80} axisLine={{ stroke: cardBorder }} />
              <YAxis tick={{ fill: textColor, fontSize: 12 }} axisLine={{ stroke: cardBorder }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: cardBg, 
                  border: `1px solid ${cardBorder}`,
                  borderRadius: '8px',
                  color: textColor
                }}
                labelStyle={{ color: textColor }}
              />
              <Bar dataKey="certificados" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      <ReportTable data={data.certificates || []} columns={columns} />
    </div>
  )
}

// ============================================
// COMPONENTES AUXILIARES
// ============================================
function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color: string }) {
  const { styles } = useOrganizationStylesContext()
  const panelStyles = styles?.panel
  const cardBg = panelStyles?.card_background || 'rgba(30, 41, 59, 0.8)'
  const cardBorder = panelStyles?.border_color || 'rgba(51, 65, 85, 0.3)'

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02, y: -2 }}
      className="p-5 rounded-2xl border backdrop-blur-sm"
      style={{ backgroundColor: cardBg, borderColor: cardBorder }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="p-2 rounded-xl" style={{ backgroundColor: `${color}20` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>
      <p className="text-3xl font-bold mb-1">{typeof value === 'number' ? value.toLocaleString() : value}</p>
      <p className="text-sm opacity-60">{label}</p>
    </motion.div>
  )
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  const { styles } = useOrganizationStylesContext()
  const panelStyles = styles?.panel
  const cardBg = panelStyles?.card_background || 'rgba(30, 41, 59, 0.8)'
  const cardBorder = panelStyles?.border_color || 'rgba(51, 65, 85, 0.3)'
  const accentColor = panelStyles?.accent_color || '#00D4B3'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-5 rounded-2xl border backdrop-blur-sm"
      style={{ backgroundColor: cardBg, borderColor: cardBorder }}
    >
      <div className="flex items-center gap-2 mb-4">
        <PieChartIcon className="w-4 h-4" style={{ color: accentColor }} />
        <h3 className="font-semibold">{title}</h3>
      </div>
      {children}
    </motion.div>
  )
}

