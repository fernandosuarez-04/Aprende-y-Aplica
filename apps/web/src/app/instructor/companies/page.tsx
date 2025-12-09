'use client'

import { BuildingOffice2Icon } from '@heroicons/react/24/outline'

export default function InstructorCompaniesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <BuildingOffice2Icon className="h-8 w-8 text-purple-400" />
            <h1 className="text-3xl font-bold text-white">Empresas</h1>
          </div>
          <p className="text-gray-400">
            Gestiona las empresas asociadas a la plataforma
          </p>
        </div>

        {/* Content Placeholder */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-12">
          <div className="text-center">
            <BuildingOffice2Icon className="h-24 w-24 text-purple-400 mx-auto mb-6 opacity-50" />
            <h2 className="text-2xl font-bold text-white mb-4">Próximamente</h2>
            <p className="text-gray-400 max-w-md mx-auto">
              Esta sección estará disponible próximamente. Aquí podrás gestionar todas las empresas registradas en la plataforma.
            </p>
          </div>
        </div>

        {/* Future Features Preview */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-6">
            <h3 className="text-white font-semibold mb-2">Lista de Empresas</h3>
            <p className="text-gray-400 text-sm">
              Visualiza y administra todas las empresas registradas
            </p>
          </div>
          <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-6">
            <h3 className="text-white font-semibold mb-2">Usuarios por Empresa</h3>
            <p className="text-gray-400 text-sm">
              Consulta los usuarios asociados a cada empresa
            </p>
          </div>
          <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-6">
            <h3 className="text-white font-semibold mb-2">Estadísticas</h3>
            <p className="text-gray-400 text-sm">
              Analiza métricas y estadísticas por empresa
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
