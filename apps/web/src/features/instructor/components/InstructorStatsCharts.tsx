'use client'

import { useState, useEffect } from 'react'
import { ResponsiveChoropleth } from '@nivo/geo'
import { ResponsiveCalendar } from '@nivo/calendar'
import { ResponsiveLine } from '@nivo/line'
import { ResponsivePie } from '@nivo/pie'
import { ResponsiveBar } from '@nivo/bar'
import { useTheme } from '@/core/hooks/useTheme'

// Colores para las gráficas
const CHART_COLORS = {
  primary: '#8b5cf6',
  secondary: '#ec4899',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
}

// Helper para obtener colores según el tema
function getChartTheme(isDark: boolean) {
  return {
    background: isDark ? '#1f2937' : '#ffffff',
    text: {
      fontSize: 12,
      fill: isDark ? '#e5e7eb' : '#374151',
      outlineWidth: 0,
      outlineColor: 'transparent',
    },
    axis: {
      domain: {
        line: {
          stroke: isDark ? '#4b5563' : '#e5e7eb',
          strokeWidth: 1,
        },
      },
      legend: {
        text: {
          fontSize: 12,
          fill: isDark ? '#e5e7eb' : '#374151',
          outlineWidth: 0,
          outlineColor: 'transparent',
        },
      },
      ticks: {
        line: {
          stroke: isDark ? '#4b5563' : '#e5e7eb',
          strokeWidth: 1,
        },
        text: {
          fontSize: 11,
          fill: isDark ? '#9ca3af' : '#6b7280',
          outlineWidth: 0,
          outlineColor: 'transparent',
        },
      },
    },
    grid: {
      line: {
        stroke: isDark ? '#374151' : '#e5e7eb',
        strokeWidth: 1,
      },
    },
    tooltip: {
      container: {
        background: isDark ? '#1f2937' : '#ffffff',
        color: isDark ? '#e5e7eb' : '#374151',
        fontSize: 12,
        border: `1px solid ${isDark ? '#4b5563' : '#e5e7eb'}`,
        borderRadius: '8px',
        padding: '8px 12px',
      },
    },
  }
}

interface ChoroplethChartProps {
  data: Array<{ country: string; count: number }>
  height?: number
  title?: string
}

export function ChoroplethChart({ data, height = 400, title }: ChoroplethChartProps) {
  const { isDark } = useTheme()

  // Transformar datos al formato que Nivo espera
  const chartData = data.map(item => ({
    id: item.country,
    value: item.count,
  }))

  // Cargar GeoJSON desde un CDN público
  const [worldMap, setWorldMap] = useState<any>(null)
  const [mapLoading, setMapLoading] = useState(true)

  useEffect(() => {
    // Cargar GeoJSON desde un CDN público
    fetch('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson')
      .then(res => res.json())
      .then(data => {
        setWorldMap(data)
        setMapLoading(false)
      })
      .catch(err => {
        console.error('Error loading world map:', err)
        setMapLoading(false)
      })
  }, [])

  if (!chartData || chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <p className="text-gray-500 dark:text-gray-400">No hay datos disponibles</p>
      </div>
    )
  }

  if (mapLoading) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <p className="text-gray-500 dark:text-gray-400">Cargando mapa...</p>
      </div>
    )
  }

  if (!worldMap || !worldMap.features || worldMap.features.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <p className="text-gray-500 dark:text-gray-400">Error al cargar el mapa</p>
      </div>
    )
  }

  // Mapear los códigos de país del formato ISO alpha-2 a ISO alpha-3 que usa el GeoJSON
  const countryCodeMap: Record<string, string> = {
    'MEX': 'MEX', 'USA': 'USA', 'ESP': 'ESP', 'ARG': 'ARG', 'COL': 'COL', 'CHL': 'CHL',
    'PER': 'PER', 'VEN': 'VEN', 'ECU': 'ECU', 'GTM': 'GTM', 'CUB': 'CUB', 'BOL': 'BOL',
    'DOM': 'DOM', 'HND': 'HND', 'PRY': 'PRY', 'SLV': 'SLV', 'NIC': 'NIC', 'CRI': 'CRI',
    'PAN': 'PAN', 'URY': 'URY', 'BRA': 'BRA', 'PRT': 'PRT', 'FRA': 'FRA', 'DEU': 'DEU',
    'ITA': 'ITA', 'GBR': 'GBR', 'CAN': 'CAN', 'AUS': 'AUS', 'NZL': 'NZL', 'JPN': 'JPN',
    'CHN': 'CHN', 'IND': 'IND', 'KOR': 'KOR', 'RUS': 'RUS', 'ZAF': 'ZAF', 'EGY': 'EGY',
  }

  // Transformar datos para que coincidan con el formato ISO alpha-3 del GeoJSON
  const transformedData = chartData.map(item => {
    // Si el país ya está en formato ISO alpha-3, usarlo directamente
    // Si no, intentar mapearlo
    const countryCode = item.country.length === 3 ? item.country : countryCodeMap[item.country] || item.country
    return {
      id: countryCode,
      value: item.count
    }
  })

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
      )}
      <div style={{ height: `${height}px` }}>
        <ResponsiveChoropleth
          data={transformedData}
          features={worldMap.features}
          margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
          colors="purples"
          domain={[0, Math.max(...transformedData.map(d => d.value), 1)]}
          unknownColor={isDark ? '#374151' : '#e5e7eb'}
          label="properties.NAME"
          valueFormat=".2s"
          projectionTranslation={[0.5, 0.5]}
          projectionRotation={[0, 0, 0]}
          projectionScale={100}
          enableGraticule={true}
          graticuleLineColor={isDark ? '#4b5563' : '#d1d5db'}
          borderWidth={0.5}
          borderColor={isDark ? '#1f2937' : '#ffffff'}
          theme={getChartTheme(isDark)}
          legends={[
            {
              anchor: 'bottom-left',
              direction: 'column',
              justify: true,
              translateX: 20,
              translateY: -40,
              itemsSpacing: 0,
              itemWidth: 94,
              itemHeight: 18,
              itemDirection: 'left-to-right',
              itemOpacity: 0.85,
              symbolSize: 18,
              effects: [
                {
                  on: 'hover',
                  style: {
                    itemTextColor: isDark ? '#fff' : '#000',
                    itemOpacity: 1,
                  },
                },
              ],
            },
          ]}
        />
      </div>
    </div>
  )
}

interface CalendarChartProps {
  data: Array<{ date: string; count: number }>
  height?: number
  title?: string
}

export function CalendarChart({ data, height = 400, title }: CalendarChartProps) {
  const { isDark } = useTheme()

  // Transformar datos al formato que Nivo espera
  const chartData = data.map(item => ({
    day: item.date,
    value: item.count,
  }))

  if (!chartData || chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <p className="text-gray-500 dark:text-gray-400">No hay datos disponibles</p>
      </div>
    )
  }

  // Obtener rango de fechas
  const dates = chartData.map(d => d.day).sort()
  const from = dates[0] || new Date().toISOString().split('T')[0]
  const to = dates[dates.length - 1] || new Date().toISOString().split('T')[0]

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
      )}
      <div style={{ height: `${height}px` }}>
        <ResponsiveCalendar
          data={chartData}
          from={from}
          to={to}
          emptyColor={isDark ? '#1f2937' : '#f3f4f6'}
          colors={isDark 
            ? ['#3b0764', '#581c87', '#7c3aed', '#8b5cf6', '#a78bfa', '#c4b5fd']
            : ['#ede9fe', '#ddd6fe', '#c4b5fd', '#a78bfa', '#8b5cf6', '#7c3aed']
          }
          margin={{ top: 40, right: 40, bottom: 40, left: 40 }}
          yearSpacing={40}
          monthBorderColor={isDark ? '#374151' : '#e5e7eb'}
          dayBorderWidth={1.5}
          dayBorderColor={isDark ? '#374151' : '#e5e7eb'}
          theme={getChartTheme(isDark)}
          legends={[
            {
              anchor: 'bottom-right',
              direction: 'row',
              translateY: 36,
              itemCount: 4,
              itemWidth: 42,
              itemHeight: 36,
              itemsSpacing: 14,
              itemDirection: 'right-to-left',
            },
          ]}
        />
      </div>
    </div>
  )
}

interface LineChartProps {
  data: Array<{ x: string | number; y: number }>
  height?: number
  title?: string
  xLabel?: string
  yLabel?: string
  color?: string
}

export function LineChart({ data, height = 300, title, xLabel, yLabel, color = CHART_COLORS.primary }: LineChartProps) {
  const { isDark } = useTheme()

  // Transformar datos al formato que Nivo espera
  const chartData = [
    {
      id: 'value',
      data: data.map(item => ({
        x: item.x,
        y: item.y,
      })),
    },
  ]

  if (!chartData[0].data || chartData[0].data.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <p className="text-gray-500 dark:text-gray-400">No hay datos disponibles</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
      )}
      <div style={{ height: `${height}px` }}>
        <ResponsiveLine
          data={chartData}
          margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
          xScale={{ type: 'point' }}
          yScale={{
            type: 'linear',
            min: 'auto',
            max: 'auto',
            stacked: false,
            reverse: false,
          }}
          yFormat=" >-.2f"
          axisTop={null}
          axisRight={null}
          axisBottom={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: xLabel,
            legendOffset: 36,
            legendPosition: 'middle',
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: yLabel,
            legendOffset: -40,
            legendPosition: 'middle',
          }}
          pointSize={10}
          pointColor={color}
          pointBorderWidth={2}
          pointBorderColor={{ from: 'serieColor' }}
          pointLabelYOffset={-12}
          useMesh={true}
          theme={getChartTheme(isDark)}
          colors={[color]}
          legends={[]}
        />
      </div>
    </div>
  )
}

interface PieChartProps {
  data: Array<{ id: string; value: number; label?: string }>
  height?: number
  title?: string
}

export function PieChart({ data, height = 300, title }: PieChartProps) {
  const { isDark } = useTheme()

  // Transformar datos al formato que Nivo espera
  const chartData = data.map(item => ({
    id: item.label || item.id,
    value: item.value,
    label: item.label || item.id,
  }))

  if (!chartData || chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <p className="text-gray-500 dark:text-gray-400">No hay datos disponibles</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
      )}
      <div style={{ height: `${height}px` }}>
        <ResponsivePie
          data={chartData}
          margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
          innerRadius={0.5}
          padAngle={0.7}
          cornerRadius={3}
          activeOuterRadiusOffset={8}
          borderWidth={1}
          borderColor={{
            from: 'color',
            modifiers: [['darker', 0.2]],
          }}
          arcLinkLabelsSkipAngle={10}
          arcLinkLabelsTextColor={isDark ? '#e5e7eb' : '#374151'}
          arcLinkLabelsThickness={2}
          arcLinkLabelsColor={{ from: 'color' }}
          arcLabelsSkipAngle={10}
          arcLabelsTextColor={{
            from: 'color',
            modifiers: [['darker', 2]],
          }}
          theme={getChartTheme(isDark)}
          colors={[CHART_COLORS.primary, CHART_COLORS.secondary, CHART_COLORS.success, CHART_COLORS.warning, CHART_COLORS.info, CHART_COLORS.danger]}
          legends={[
            {
              anchor: 'bottom',
              direction: 'row',
              justify: false,
              translateX: 0,
              translateY: 56,
              itemsSpacing: 0,
              itemWidth: 100,
              itemHeight: 18,
              itemTextColor: isDark ? '#9ca3af' : '#6b7280',
              itemDirection: 'left-to-right',
              itemOpacity: 1,
              symbolSize: 18,
              symbolShape: 'circle',
            },
          ]}
        />
      </div>
    </div>
  )
}

interface BarChartProps {
  data: Array<{ id: string; value: number; label?: string }>
  height?: number
  title?: string
  xLabel?: string
  yLabel?: string
}

export function BarChart({ data, height = 300, title, xLabel, yLabel }: BarChartProps) {
  const { isDark } = useTheme()

  // Transformar datos al formato que Nivo espera
  const chartData = data.map(item => ({
    id: item.label || item.id,
    value: item.value,
  }))

  if (!chartData || chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <p className="text-gray-500 dark:text-gray-400">No hay datos disponibles</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
      )}
      <div style={{ height: `${height}px` }}>
        <ResponsiveBar
          data={chartData}
          keys={['value']}
          indexBy="id"
          margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
          padding={0.3}
          valueScale={{ type: 'linear' }}
          indexScale={{ type: 'band', round: true }}
          colors={CHART_COLORS.primary}
          axisTop={null}
          axisRight={null}
          axisBottom={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: -45,
            legend: xLabel,
            legendPosition: 'middle',
            legendOffset: 46,
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: yLabel,
            legendPosition: 'middle',
            legendOffset: -40,
          }}
          labelSkipWidth={12}
          labelSkipHeight={12}
          labelTextColor={{
            from: 'color',
            modifiers: [['darker', 1.6]],
          }}
          theme={getChartTheme(isDark)}
          legends={[
            {
              dataFrom: 'keys',
              anchor: 'bottom-right',
              direction: 'column',
              justify: false,
              translateX: 120,
              translateY: 0,
              itemsSpacing: 2,
              itemWidth: 100,
              itemHeight: 20,
              itemDirection: 'left-to-right',
              itemOpacity: 0.85,
              symbolSize: 20,
              effects: [
                {
                  on: 'hover',
                  style: {
                    itemOpacity: 1,
                  },
                },
              ],
            },
          ]}
        />
      </div>
    </div>
  )
}

