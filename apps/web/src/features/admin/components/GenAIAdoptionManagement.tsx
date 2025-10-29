'use client'

import { useState } from 'react'
import { 
  TrendingUp,
  Globe,
  Database,
  Calendar,
  Download,
  Eye
} from 'lucide-react'
import { useUserStats } from '@/features/admin/hooks/useUserStats'
import { motion } from 'framer-motion'

export function GenAIAdoptionManagement() {
  const { genAIAdoption, genAIStats, loading, error } = useUserStats()

  const [selectedCountry, setSelectedCountry] = useState<string | null>(null)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
        <p className="text-red-400">Error: {error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Adopción de GenAI</h3>
          <p className="text-gray-400">Visualiza estadísticas de adopción de IA generativa por país</p>
        </div>
        <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
          <Download className="w-4 h-4" />
          Exportar Datos
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Países Registrados</p>
              <p className="text-2xl font-bold text-white">{genAIStats?.totalCountries || 0}</p>
            </div>
            <Globe className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Índice AIPI Promedio</p>
              <p className="text-2xl font-bold text-white">{genAIStats?.averageAIPIIndex?.toFixed(2) || '0.00'}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Datos</p>
              <p className="text-2xl font-bold text-white">{genAIAdoption?.length || 0}</p>
            </div>
            <Database className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Top Countries Chart */}
      <div className="bg-gray-700 rounded-lg p-6 border border-gray-600">
        <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Países con Mayor Índice AIPI
        </h4>
        <div className="space-y-2">
          {genAIStats?.topCountries?.slice(0, 10).map((item, index) => {
            const maxValue = genAIStats?.topCountries?.[0]?.index || 1
            const percentage = maxValue > 0 ? ((item.index / maxValue) * 100) : 0
            
            return (
              <div
                key={index}
                className="group flex items-center gap-4 p-2 rounded-lg hover:bg-white/5 transition-all duration-300 cursor-pointer"
              >
                <div className="w-32 text-right flex-shrink-0">
                  <span className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">
                    {item.country}
                  </span>
                </div>
                <div className="flex-1 bg-white/10 rounded-full h-6 overflow-hidden relative">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ delay: index * 0.05, duration: 1 }}
                    className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-500 relative overflow-hidden group-hover:brightness-125 transition-all duration-300"
                  >
                    {/* Efecto de brillo */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                      initial={{ x: '-100%' }}
                      whileHover={{ x: '100%' }}
                      transition={{ duration: 0.8, ease: "easeInOut" }}
                    />
                  </motion.div>
                </div>
                <div className="w-16 text-left">
                  <span className="text-sm font-bold text-white/80 group-hover:text-white transition-colors">
                    {item.index?.toFixed(2)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Tabla de Datos */}
      <div className="bg-gray-700 rounded-lg border border-gray-600 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  País
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Índice AIPI
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Fuente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Fecha Fuente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-600">
              {genAIAdoption.map((item) => (
                <tr 
                  key={item.id} 
                  className={`hover:bg-gray-600 transition-colors cursor-pointer ${
                    selectedCountry === item.pais ? 'bg-gray-600' : ''
                  }`}
                  onClick={() => setSelectedCountry(item.pais)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-blue-400" />
                      <span className="text-sm text-white">{item.pais}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-400" />
                      <span className="text-sm font-medium text-white">
                        {item.indice_aipi?.toFixed(2)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-300">{item.fuente || 'N/A'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-300">{item.fecha_fuente || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedCountry(selectedCountry === item.pais ? null : item.pais)
                      }}
                      className="text-blue-400 hover:text-blue-300 transition-colors"
                      title="Ver detalles"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detalles del País Seleccionado */}
      {selectedCountry && (
        <div className="bg-gray-700 rounded-lg p-6 border border-gray-600">
          <h4 className="text-lg font-semibold text-white mb-4">Detalles de {selectedCountry}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {genAIAdoption
              .filter(item => item.pais === selectedCountry)
              .map((item, index) => (
                <div key={index} className="bg-gray-800 rounded p-4 border border-gray-600">
                  <div className="space-y-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Índice AIPI</label>
                      <p className="text-white text-lg font-semibold">{item.indice_aipi?.toFixed(2)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Fuente</label>
                      <p className="text-white">{item.fuente || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Fecha de Fuente</label>
                      <p className="text-white">{item.fecha_fuente || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
