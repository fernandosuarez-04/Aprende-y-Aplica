'use client'

import { AdminStats } from './AdminStats'
import { AdminRecentActivity } from './AdminRecentActivity'

export function AdminDashboard() {
  return (
    <div className="p-6 w-full">
      <div className="w-full space-y-8">
        {/* Welcome Section */}
        <div className="bg-gray-700 rounded-lg shadow-sm border border-gray-600 p-6">
          <h1 className="text-3xl font-bold text-white mb-2">
            Bienvenido al Panel de Administración
          </h1>
          <p className="text-gray-400">
            Gestiona todos los aspectos de la plataforma desde aquí
          </p>
        </div>

        {/* Stats Cards */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">
            Estadísticas Generales
          </h2>
          <AdminStats />
        </div>


        {/* Recent Activity */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">
            Actividad Reciente
          </h2>
          <AdminRecentActivity />
        </div>
      </div>
    </div>
  )
}
