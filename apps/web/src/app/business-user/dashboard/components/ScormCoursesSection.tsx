'use client'

import { motion } from 'framer-motion'
import { Package, BookOpen } from 'lucide-react'
import { ScormCard3D } from './ScormCard3D'
import { StyleConfig } from '@/features/business-panel/hooks/useOrganizationStyles'
import { AssignedScormPackage } from '@/features/scorm'

interface ScormCoursesSectionProps {
  packages: AssignedScormPackage[]
  isLoading: boolean
  styles?: StyleConfig | null
  onPackageClick: (packageId: string) => void
}

// Skeleton para loading
function ScormCardSkeleton({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="rounded-xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-sm overflow-hidden"
    >
      <div className="h-48 bg-gradient-to-br from-slate-700/50 to-slate-600/50 animate-pulse" />
      <div className="p-6 space-y-4">
        <div className="h-6 bg-slate-700/50 rounded animate-pulse w-3/4" />
        <div className="h-4 bg-slate-700/50 rounded animate-pulse w-1/2" />
        <div className="h-3 bg-slate-700/50 rounded-full animate-pulse" />
        <div className="h-12 bg-slate-700/50 rounded-lg animate-pulse" />
      </div>
    </motion.div>
  )
}

// Estado vacío
function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center mb-6">
        <Package className="w-10 h-10 text-slate-400" />
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">
        No hay cursos SCORM disponibles
      </h3>
      <p className="text-slate-400 max-w-md">
        Cuando tu organización suba paquetes SCORM, aparecerán aquí para que puedas acceder a ellos.
      </p>
    </motion.div>
  )
}

export function ScormCoursesSection({
  packages,
  isLoading,
  styles,
  onPackageClick
}: ScormCoursesSectionProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[0, 1, 2, 3].map((index) => (
          <ScormCardSkeleton key={index} index={index} />
        ))}
      </div>
    )
  }

  // Empty state
  if (packages.length === 0) {
    return <EmptyState />
  }

  // Packages grid
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {packages.map((pkg, index) => (
        <ScormCard3D
          key={pkg.id}
          package_={pkg}
          index={index}
          onClick={() => onPackageClick(pkg.id)}
          styles={styles}
        />
      ))}
    </div>
  )
}
