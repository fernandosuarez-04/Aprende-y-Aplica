'use client'

import React from 'react'

interface ListSkeletonProps {
  count?: number
  showHeader?: boolean
}

export const ListSkeleton = React.memo(function ListSkeleton({
  count = 6,
  showHeader = true
}: ListSkeletonProps) {
  return (
    <div className="min-h-screen bg-[var(--color-bg-dark)] animate-pulse">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {showHeader && (
          <div className="mb-8">
            <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-64 mb-4"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-96"></div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: count }).map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700"
            >
              {/* Image skeleton */}
              <div className="h-48 bg-gray-300 dark:bg-gray-700"></div>

              {/* Content skeleton */}
              <div className="p-6">
                <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-5/6 mb-4"></div>
                <div className="flex items-center justify-between">
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-20"></div>
                  <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-24"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
})
