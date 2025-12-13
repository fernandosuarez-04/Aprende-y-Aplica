'use client'

import { DocumentTextIcon } from '@heroicons/react/24/outline'

export default function InstructorReportesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <DocumentTextIcon className="h-8 w-8 text-purple-400" />
            <h1 className="text-3xl font-bold text-white">Reportes</h1>
          </div>
          <p className="text-gray-400">
            Genera y descarga reportes detallados de la plataforma
          </p>
        </div>

        {/* Content Placeholder */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-12">
          <div className="text-center">
            <DocumentTextIcon className="h-24 w-24 text-purple-400 mx-auto mb-6 opacity-50" />
            <h2 className="text-2xl font-bold text-white mb-4">Próximamente</h2>
            <p className="text-gray-400 max-w-md mx-auto">
              Esta sección estará disponible próximamente. Aquí podrás generar reportes personalizados de usuarios, cursos, comunidades y más.
            </p>
          </div>
        </div>

        {/* Future Features Preview */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-6">
            <h3 className="text-white font-semibold mb-2">Reportes de Usuarios</h3>
            <p className="text-gray-400 text-sm">
              Genera reportes detallados de actividad de usuarios
            </p>
          </div>
          <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-6">
            <h3 className="text-white font-semibold mb-2">Reportes de Cursos</h3>
            <p className="text-gray-400 text-sm">
              Analiza el rendimiento y participación en cursos
            </p>
          </div>
          <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-6">
            <h3 className="text-white font-semibold mb-2">Exportar Datos</h3>
            <p className="text-gray-400 text-sm">
              Descarga reportes en formatos Excel, PDF y CSV
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
