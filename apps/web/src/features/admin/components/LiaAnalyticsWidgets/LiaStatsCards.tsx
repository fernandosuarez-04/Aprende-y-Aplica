'use client';

import {
  CurrencyDollarIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  BoltIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';

interface LiaAnalyticsSummary {
  totalConversations: number;
  totalMessages: number;
  totalTokens: number;
  totalCostUsd: number;
  avgResponseTimeMs: number;
  completedActivities: number;
}

interface TodayStats {
  cost: number;
  tokens: number;
  messages: number;
  costChange: number;
}

interface LiaStatsCardsProps {
  summary: LiaAnalyticsSummary;
  today: TodayStats;
  projectedMonthlyCost: number;
  isLoading?: boolean;
}

export function LiaStatsCards({ summary, today, projectedMonthlyCost, isLoading }: LiaStatsCardsProps) {
  const formatCurrency = (value: number) => {
    if (value < 0.01) return `$${value.toFixed(4)}`;
    if (value < 1) return `$${value.toFixed(3)}`;
    return `$${value.toFixed(2)}`;
  };

  const formatNumber = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const stats = [
    {
      name: 'Costo Hoy',
      value: formatCurrency(today.cost),
      change: today.costChange,
      changeLabel: today.costChange >= 0 ? 'vs ayer' : 'vs ayer',
      icon: CurrencyDollarIcon,
      iconColor: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
    {
      name: 'Costo Total (Período)',
      value: formatCurrency(summary.totalCostUsd),
      subValue: `Proyección mensual: ${formatCurrency(projectedMonthlyCost)}`,
      icon: CurrencyDollarIcon,
      iconColor: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      name: 'Tokens Consumidos',
      value: formatNumber(summary.totalTokens),
      subValue: `${formatNumber(today.tokens)} hoy`,
      icon: BoltIcon,
      iconColor: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
    {
      name: 'Conversaciones',
      value: formatNumber(summary.totalConversations),
      subValue: `${formatNumber(summary.totalMessages)} mensajes`,
      icon: ChatBubbleLeftRightIcon,
      iconColor: 'text-violet-500',
      bgColor: 'bg-violet-500/10',
    },
    {
      name: 'Tiempo Promedio',
      value: formatTime(summary.avgResponseTimeMs),
      subValue: 'de respuesta',
      icon: ClockIcon,
      iconColor: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10',
    },
    {
      name: 'Actividades',
      value: formatNumber(summary.completedActivities),
      subValue: 'completadas',
      icon: BoltIcon,
      iconColor: 'text-rose-500',
      bgColor: 'bg-rose-500/10',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 animate-pulse"
          >
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-3"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.name}
          className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-200"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {stat.name}
            </span>
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stat.value}
              </p>
              {stat.change !== undefined && (
                <div className="flex items-center mt-1">
                  {stat.change >= 0 ? (
                    <ArrowTrendingUpIcon className="w-4 h-4 text-red-500 mr-1" />
                  ) : (
                    <ArrowTrendingDownIcon className="w-4 h-4 text-green-500 mr-1" />
                  )}
                  <span
                    className={`text-sm font-medium ${
                      stat.change >= 0 ? 'text-red-500' : 'text-green-500'
                    }`}
                  >
                    {Math.abs(stat.change)}%
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                    {stat.changeLabel}
                  </span>
                </div>
              )}
              {stat.subValue && !stat.change && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {stat.subValue}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

