import { useState, useEffect } from 'react'
import { ReportType, ReportFilters } from '@/app/api/business/reports/data/route'

export interface ReportData {
  report_type: ReportType
  filters: ReportFilters
  data: any
  generated_at: string
}

export function useBusinessReports() {
  const [reportType, setReportType] = useState<ReportType>('users')
  const [filters, setFilters] = useState<Partial<ReportFilters>>({
    start_date: undefined,
    end_date: undefined,
    user_ids: undefined,
    course_ids: undefined,
    role: 'all',
    status: 'all'
  })
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchReport = async (type?: ReportType, customFilters?: Partial<ReportFilters>) => {
    try {
      setIsLoading(true)
      setError(null)

      const typeToFetch = type || reportType
      const filtersToUse = { ...filters, ...customFilters }

      // console.log('📡 Fetching report:', typeToFetch, 'with filters:', filtersToUse)

      const params = new URLSearchParams({
        type: typeToFetch
      })

      if (filtersToUse.start_date) {
        params.append('start_date', filtersToUse.start_date)
      }
      if (filtersToUse.end_date) {
        params.append('end_date', filtersToUse.end_date)
      }
      if (filtersToUse.user_ids?.length) {
        params.append('user_ids', filtersToUse.user_ids.join(','))
      }
      if (filtersToUse.course_ids?.length) {
        params.append('course_ids', filtersToUse.course_ids.join(','))
      }
      if (filtersToUse.role && filtersToUse.role !== 'all') {
        params.append('role', filtersToUse.role)
      }
      if (filtersToUse.status && filtersToUse.status !== 'all') {
        params.append('status', filtersToUse.status)
      }

      const url = `/api/business/reports/data?${params.toString()}`
      // console.log('🌐 Fetching URL:', url)

      const response = await fetch(url, {
        credentials: 'include'
      })

      // console.log('📥 Response status:', response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        // console.error('❌ Error response:', errorText)
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      // console.log('✅ Response data:', data)

      if (data.success && data.data) {
        setReportData({
          report_type: data.report_type,
          filters: data.filters,
          data: data.data,
          generated_at: data.generated_at
        })
        // console.log('✅ Report data set successfully')
      } else {
        throw new Error(data.error || 'Error al obtener el reporte')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al cargar el reporte'
      setError(errorMessage)
      // console.error('❌ Error fetching report:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const updateFilters = (newFilters: Partial<ReportFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  const updateReportType = (type: ReportType) => {
    setReportType(type)
    setReportData(null) // Limpiar datos al cambiar tipo
  }

  const resetFilters = () => {
    setFilters({
      start_date: undefined,
      end_date: undefined,
      user_ids: undefined,
      course_ids: undefined,
      role: 'all',
      status: 'all'
    })
    setReportData(null)
  }

  return {
    reportType,
    setReportType: updateReportType,
    filters,
    setFilters: updateFilters,
    reportData,
    isLoading,
    error,
    fetchReport,
    resetFilters
  }
}
