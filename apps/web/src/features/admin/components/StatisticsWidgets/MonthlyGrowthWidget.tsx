'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { CalendarIcon } from '@heroicons/react/24/outline'

// Lazy load Nivo components
const ResponsiveLine = dynamic(() => import('@nivo/line').then(mod => mod.ResponsiveLine), { ssr: false })

interface MonthlyGrowthData {
  month: string
  monthNumber: number
  year: number
  users: number
  courses: number
  communities: number
  prompts: number
  aiApps: number
}

interface MonthlyGrowthWidgetProps {
  period?: number
  metrics?: string[]
}

export function MonthlyGrowthWidget({ period = 8, metrics = ['users'] }: MonthlyGrowthWidgetProps) {
  const [data, setData] = useState<MonthlyGrowthData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const response = await fetch(`/api/admin/statistics/monthly-growth?period=${period}`)
        const result = await response.json()
        
        if (result.success) {
          setData(result.data)
        } else {
          setError(result.error || 'Error al cargar datos')
        }
      } catch (err) {
        setError('Error al cargar datos de crecimiento mensual')
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [period])

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    )
  }

  // Preparar datos para Nivo
  const chartData = metrics.map(metric => {
    const colorMap: Record<string, string> = {
      users: '#3b82f6',
      courses: '#10b981',
      communities: '#8b5cf6',
      prompts: '#f97316',
      aiApps: '#ec4899'
    }

    const labelMap: Record<string, string> = {
      users: 'Usuarios',
      courses: 'Talleres',
      communities: 'Comunidades',
      prompts: 'Prompts',
      aiApps: 'Apps de IA'
    }

    return {
      id: labelMap[metric] || metric,
      color: colorMap[metric] || '#3b82f6',
      data: data.map(item => ({
        x: item.month,
        y: item[metric as keyof MonthlyGrowthData] as number
      }))
    }
  })

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Crecimiento Mensual
        </h3>
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
          <CalendarIcon className="h-4 w-4 mr-1" />
          Últimos {period} meses
        </div>
      </div>
      
      <div className="h-64">
        <ResponsiveLine
          data={chartData}
          margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
          xScale={{ type: 'point' }}
          yScale={{
            type: 'linear',
            min: 0,
            max: 'auto',
            stacked: false,
            reverse: false
          }}
          yFormat=" >-.0f"
          axisTop={null}
          axisRight={null}
          axisBottom={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: 'Mes',
            legendOffset: 36,
            legendPosition: 'middle'
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: 'Cantidad',
            legendOffset: -40,
            legendPosition: 'middle'
          }}
          pointSize={8}
          pointColor={{ theme: 'background' }}
          pointBorderWidth={2}
          pointBorderColor={{ from: 'serieColor' }}
          pointLabelYOffset={-12}
          useMesh={true}
          legends={[
            {
              anchor: 'bottom-right',
              direction: 'column',
              justify: false,
              translateX: 100,
              translateY: 0,
              itemsSpacing: 0,
              itemDirection: 'left-to-right',
              itemWidth: 80,
              itemHeight: 20,
              itemOpacity: 0.75,
              symbolSize: 12,
              symbolShape: 'circle',
              effects: [
                {
                  on: 'hover',
                  style: {
                    itemBackground: 'rgba(0, 0, 0, .03)',
                    itemOpacity: 1
                  }
                }
              ]
            }
          ]}
          theme={{
            axis: {
              domain: {
                line: {
                  stroke: '#777777',
                  strokeWidth: 1
                }
              },
              legend: {
                text: {
                  fill: '#777777',
                  fontSize: 12
                }
              },
              ticks: {
                line: {
                  stroke: '#777777',
                  strokeWidth: 1
                },
                text: {
                  fill: '#777777',
                  fontSize: 11
                }
              }
            },
            grid: {
              line: {
                stroke: '#dddddd',
                strokeWidth: 1
              }
            },
            legends: {
              text: {
                fill: '#777777',
                fontSize: 11
              }
            },
            tooltip: {
              container: {
                background: '#ffffff',
                color: '#333333',
                fontSize: 12
              }
            }
          }}
        />
      </div>
    </div>
  )
}

