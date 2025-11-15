'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  ChartBarIcon,
  ClockIcon,
  FireIcon,
  ArrowTrendingUpIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';
import type { LearningMetrics, StudyHabitStats } from '@repo/shared/types';
import { ResponsiveLine } from '@nivo/line';
import { ResponsiveBar } from '@nivo/bar';
import { useTheme } from '@/core/hooks/useTheme';

interface LearningMetricsProps {
  metrics: LearningMetrics;
  habitStats?: StudyHabitStats;
  loading?: boolean;
}

// Helper para obtener tema de gráficos según el tema de la aplicación
function getChartTheme(isDark: boolean) {
  return {
    background: 'transparent',
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
  };
}

export function LearningMetricsComponent({
  metrics,
  habitStats,
  loading = false,
}: LearningMetricsProps) {
  const { isDark } = useTheme();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Preparar datos para gráficos
  const weeklyData = metrics.weeklyProgress.map((week) => ({
    x: week.week,
    planned: week.planned || 0,
    completed: week.completed || 0,
  }));

  const monthlyData = metrics.monthlyProgress.map((month) => ({
    x: month.month,
    planned: month.planned || 0,
    completed: month.completed || 0,
  }));

  const completionRate =
    metrics.totalSessions > 0
      ? Math.round((metrics.completedSessions / metrics.totalSessions) * 100)
      : 0;

  const hoursDifference = metrics.actualHours - metrics.plannedHours;
  const efficiencyRate =
    metrics.plannedHours > 0
      ? Math.round((metrics.actualHours / metrics.plannedHours) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={ChartBarIcon}
          title="Sesiones Completadas"
          value={`${metrics.completedSessions}/${metrics.totalSessions}`}
          subtitle={`${completionRate}% de completitud`}
          color="blue"
        />
        <MetricCard
          icon={ClockIcon}
          title="Horas Estudiadas"
          value={`${metrics.actualHours.toFixed(1)}h`}
          subtitle={`${metrics.plannedHours.toFixed(1)}h planificadas`}
          color="green"
        />
        <MetricCard
          icon={FireIcon}
          title="Racha Actual"
          value={`${metrics.currentStreak} días`}
          subtitle={`Récord: ${metrics.longestStreak} días`}
          color="orange"
        />
        <MetricCard
          icon={ArrowTrendingUpIcon}
          title="Eficiencia"
          value={`${efficiencyRate}%`}
          subtitle={
            hoursDifference >= 0
              ? `+${hoursDifference.toFixed(1)}h sobre lo planificado`
              : `${hoursDifference.toFixed(1)}h bajo lo planificado`
          }
          color="purple"
        />
      </div>

      {/* Estadísticas de hábitos */}
      {habitStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                {React.createElement(ClockIcon, { className: 'w-5 h-5 text-blue-600 dark:text-blue-400' })}
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Promedio Diario</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {habitStats.averageDailyMinutes} min
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                {React.createElement(CalendarDaysIcon, { className: 'w-5 h-5 text-green-600 dark:text-green-400' })}
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Tasa de Completitud</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {habitStats.completionRate.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                {React.createElement(ArrowTrendingUpIcon, { className: 'w-5 h-5 text-purple-600 dark:text-purple-400' })}
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Score de Consistencia</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {habitStats.consistencyScore}/100
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progreso Semanal */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Progreso Semanal
          </h3>
          <div className="h-64">
            {weeklyData.length > 0 ? (
              <ResponsiveBar
                data={weeklyData}
                keys={['planned', 'completed']}
                indexBy="x"
                margin={{ top: 20, right: 110, bottom: 50, left: 60 }}
                padding={0.3}
                valueScale={{ type: 'linear', min: 0 }}
                indexScale={{ type: 'band', round: true }}
                colors={['#f59e0b', '#10b981']}
                axisTop={null}
                axisRight={null}
                axisBottom={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: -45,
                  legend: 'Semana',
                  legendPosition: 'middle',
                  legendOffset: 45,
                }}
                axisLeft={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0,
                  legend: 'Horas',
                  legendPosition: 'middle',
                  legendOffset: -40,
                }}
                labelSkipWidth={12}
                labelSkipHeight={12}
                labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                legends={[
                  {
                    dataFrom: 'keys',
                    anchor: 'bottom-right',
                    direction: 'column',
                    justify: false,
                    translateX: 100,
                    translateY: 0,
                    itemsSpacing: 2,
                    itemWidth: 100,
                    itemHeight: 20,
                    itemDirection: 'left-to-right',
                    itemOpacity: 0.85,
                    symbolSize: 12,
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
                theme={getChartTheme(isDark)}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                No hay datos disponibles
              </div>
            )}
          </div>
        </div>

        {/* Progreso Mensual */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Progreso Mensual
          </h3>
          <div className="h-64">
            {monthlyData.length > 0 ? (
              <ResponsiveLine
                data={[
                  {
                    id: 'Planificado',
                    color: '#f59e0b',
                    data: monthlyData.map((d) => ({ x: d.x, y: d.planned })),
                  },
                  {
                    id: 'Completado',
                    color: '#10b981',
                    data: monthlyData.map((d) => ({ x: d.x, y: d.completed })),
                  },
                ]}
                margin={{ top: 20, right: 110, bottom: 50, left: 60 }}
                xScale={{ type: 'point' }}
                yScale={{
                  type: 'linear',
                  min: 0,
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
                  tickRotation: -45,
                  legend: 'Mes',
                  legendPosition: 'middle',
                  legendOffset: 45,
                }}
                axisLeft={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0,
                  legend: 'Horas',
                  legendPosition: 'middle',
                  legendOffset: -40,
                }}
                pointSize={8}
                pointColor={{ theme: 'background' }}
                pointBorderWidth={2}
                pointBorderColor={{ from: 'serieColor' }}
                pointLabelYOffset={-12}
                useMesh={true}
                colors={['#f59e0b', '#10b981']}
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
                          itemOpacity: 1,
                        },
                      },
                    ],
                  },
                ]}
                theme={getChartTheme(isDark)}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                No hay datos disponibles
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface MetricCardProps {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: string;
  value: string;
  subtitle: string;
  color: 'blue' | 'green' | 'orange' | 'purple';
}

function MetricCard({ icon, title, value, subtitle, color }: MetricCardProps) {
  const colorClasses = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
  };

  if (!icon) {
    return null;
  }

  // Renderizar el componente de icono usando React.createElement
  const IconElement = React.createElement(icon, { className: 'w-5 h-5' });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          {IconElement}
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
    </motion.div>
  );
}

