'use client'

import React from 'react'

export const DashboardSkeleton = React.memo(function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-dark)] animate-pulse">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header skeleton */}
        <div className="mb-8">
          <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-64 mb-4"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-96"></div>
        </div>

        {/* Stats cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-24 mb-4"></div>
              <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-16 mb-2"></div>
              <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-32"></div>
            </div>
          ))}
        </div>

        {/* Recent activity skeleton */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-48 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-300 dark:bg-gray-700 rounded-lg flex-shrink-0"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
})
