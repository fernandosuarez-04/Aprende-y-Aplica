'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'
import { useUserStats } from '../hooks/useUserStats'
import { 
  Users, 
  HelpCircle, 
  MessageSquare, 
  TrendingUp, 
  BarChart3,
  PieChart,
  Activity,
  Globe,
  Building,
  UserCheck,
  Filter,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Download
} from 'lucide-react'
import { QuestionsManagement } from './QuestionsManagement'
import { AnswersManagement } from './AnswersManagement'
import { GenAIAdoptionManagement } from './GenAIAdoptionManagement'

const ViewProfileModal = dynamic(() => import('./ViewProfileModal').then(mod => ({ default: mod.ViewProfileModal })), {
  ssr: false
})
const EditProfileModal = dynamic(() => import('./EditProfileModal').then(mod => ({ default: mod.EditProfileModal })), {
  ssr: false
})
const DeleteProfileModal = dynamic(() => import('./DeleteProfileModal').then(mod => ({ default: mod.DeleteProfileModal })), {
  ssr: false
})
// Colores para las gráficas - Más vibrantes
const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#06B6D4', '#84CC16']

// Componente para gráfica de barras - Usando flexbox simple como en statistics/results
const BarChartComponent = ({ data, dataKey, nameKey }: { data: any[], dataKey: string, nameKey: string }) => {
  const validData = data.filter(d => d && d[dataKey] != null)
  const maxValue = validData.length > 0 ? Math.max(...validData.map(d => d[dataKey])) : 1
  
  return (
    <div className="space-y-2">
      {validData.slice(0, 10).map((item, index) => {
        const percentage = maxValue > 0 ? ((item[dataKey] / maxValue) * 100) : 0
        const displayName = item[nameKey]?.length > 30 ? item[nameKey].substring(0, 30) + '...' : item[nameKey]
        
        return (
          <div
            key={index}
            className="group flex items-center gap-4 p-2 rounded-lg hover:bg-white/5 transition-all duration-300 cursor-pointer"
          >
            <div className="w-32 text-right flex-shrink-0">
              <span className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">
                {displayName}
              </span>
            </div>
            <div className="flex-1 bg-white/10 rounded-full h-6 overflow-hidden relative">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ delay: index * 0.05, duration: 1 }}
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 relative overflow-hidden group-hover:brightness-125 transition-all duration-300"
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
                {item[dataKey]}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Componente para gráfica de pastel con SVG real
const PieChartComponent = ({ data, dataKey, nameKey }: { data: any[], dataKey: string, nameKey: string }) => {
  // console.log('🎨 PieChartComponent - Datos recibidos:', { data, dataKey, nameKey })
  
  const validData = data.filter(d => d && d[dataKey] != null)
  // console.log('🎨 PieChartComponent - Datos válidos:', validData)
  
  const total = validData.reduce((sum, item) => sum + item[dataKey], 0)
  // console.log('🎨 PieChartComponent - Total:', total)
  
  if (total === 0 || validData.length === 0) {
    // console.log('🎨 PieChartComponent - No hay datos suficientes')
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <p>No hay datos para mostrar</p>
      </div>
    )
  }
  
  let currentAngle = 0
  const radius = 80
  const centerX = 100
  const centerY = 100
  
  // console.log('🎨 PieChartComponent - Renderizando SVG con', validData.length, 'segmentos')
  
  return (
    <div className="flex items-center justify-center gap-6">
      {/* Gráfica de Pastel SVG */}
      <div className="flex-shrink-0">
        <svg width="200" height="200" viewBox="0 0 200 200" className="transform -rotate-90">
          {/* Círculo de fondo */}
          <circle
            cx={centerX}
            cy={centerY}
            r={radius}
            fill="rgba(255, 255, 255, 0.1)"
            stroke="rgba(255, 255, 255, 0.2)"
            strokeWidth="1"
          />
          
          {/* Texto en el centro si hay solo un segmento */}
          {validData.length === 1 && (
            <text
              x={centerX}
              y={centerY}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="white"
              fontSize="14"
              fontWeight="bold"
              className="transform rotate-90"
            >
              {validData[0][dataKey]}
            </text>
          )}
          
          {/* Segmentos del pastel */}
          {validData.map((item, index) => {
            const percentage = (item[dataKey] / total) * 100
            const angle = (percentage / 100) * 360
            
            // Para un círculo completo (100%), usar un círculo simple
            if (percentage >= 99.9) {
              return (
                <motion.circle
                  key={index}
                  cx={centerX}
                  cy={centerY}
                  r={radius}
                  fill={COLORS[index % COLORS.length]}
                  className="hover:opacity-80 transition-opacity cursor-pointer"
                  title={`${item[nameKey]}: ${item[dataKey]} (${percentage.toFixed(1)}%)`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1, duration: 0.8 }}
                  stroke="white"
                  strokeWidth="2"
                />
              )
            }
            
            // Para segmentos parciales, usar el cálculo normal
            const startAngle = currentAngle
            const endAngle = currentAngle + angle
            
            const x1 = centerX + radius * Math.cos((startAngle * Math.PI) / 180)
            const y1 = centerY + radius * Math.sin((startAngle * Math.PI) / 180)
            const x2 = centerX + radius * Math.cos((endAngle * Math.PI) / 180)
            const y2 = centerY + radius * Math.sin((endAngle * Math.PI) / 180)
            
            const largeArcFlag = angle > 180 ? 1 : 0
            
            const pathData = [
              `M ${centerX} ${centerY}`,
              `L ${x1} ${y1}`,
              `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
              'Z'
            ].join(' ')
            
            currentAngle += angle
            
            // console.log(`🎨 Segmento ${index}:`, {
            //   item: item[nameKey],
            //   count: item[dataKey],
            //   percentage: percentage.toFixed(1),
            //   angle: angle.toFixed(1),
            //   color: COLORS[index % COLORS.length],
            //   pathData,
            //   isFullCircle: percentage >= 99.9
            // })
            
// 
            return (
              <motion.path
                key={index}
                d={pathData}
                fill={COLORS[index % COLORS.length]}
                className="hover:opacity-80 transition-opacity cursor-pointer"
                title={`${item[nameKey]}: ${item[dataKey]} (${percentage.toFixed(1)}%)`}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: index * 0.1, duration: 0.8 }}
                stroke="white"
                strokeWidth="2"
              />
            )
          })}
        </svg>
      </div>
      
// 
      {/* Leyenda */}
      <div className="flex flex-col justify-center gap-3 flex-shrink-0">
        {validData.map((item, index) => {
          const percentage = (item[dataKey] / total) * 100
          return (
            <div key={index} className="flex items-center gap-3 text-sm">
              <div 
                className="w-4 h-4 rounded-full flex-shrink-0" 
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-gray-300 min-w-0 flex-1">{item[nameKey]}</span>
              <span className="text-white font-semibold">{item[dataKey]}</span>
              <span className="text-gray-400 text-xs">({percentage.toFixed(1)}%)</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// 
export function AdminUserStatsPage() {
  const {
    userProfiles,
    questions,
    answers,
    genAIAdoption,
    userStats,
    questionStats,
    answerStats,
    genAIStats,
    loading,
    error,
    updateUserProfile,
    deleteUserProfile
  } = useUserStats()

// 
  // Debug: Log de datos
  useEffect(() => {
    // console.log('📊 User Stats:', userStats)
    // console.log('📊 Users by Role:', userStats?.usersByRole)
    // console.log('📊 Users by Area:', userStats?.usersByArea)
    // console.log('❓ Question Stats:', questionStats)
    // console.log('🌍 GenAI Stats:', genAIStats)
  }, [userStats, questionStats, genAIStats])

// 
  // Estados para modales
  const [viewingProfile, setViewingProfile] = useState<any>(null)
  const [editingProfile, setEditingProfile] = useState<any>(null)
  const [deletingProfile, setDeletingProfile] = useState<any>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

// 
  const [activeTab, setActiveTab] = useState<'overview' | 'profiles' | 'questions' | 'answers' | 'genai'>('overview')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFilter, setSelectedFilter] = useState<string>('all')

// 
  // Funciones para manejar acciones
  const handleViewProfile = (profile: any) => {
    setViewingProfile(profile)
    setIsViewModalOpen(true)
  }

// 
  const handleEditProfile = (profile: any) => {
    setEditingProfile(profile)
    setIsEditModalOpen(true)
  }

// 
  const handleDeleteProfile = (profile: any) => {
    setDeletingProfile(profile)
    setIsDeleteModalOpen(true)
  }

// 
  const handleSaveProfile = async (data: any) => {
    if (editingProfile) {
      await updateUserProfile(editingProfile.id, data)
    }
  }

// 
  const handleConfirmDelete = async (profileId: string) => {
    await deleteUserProfile(profileId)
  }

// 
  const closeModals = () => {
    setIsViewModalOpen(false)
    setIsEditModalOpen(false)
    setIsDeleteModalOpen(false)
    setViewingProfile(null)
    setEditingProfile(null)
    setDeletingProfile(null)
  }

// 
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

// 
  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
        <p className="text-red-400">Error: {error}</p>
      </div>
    )
  }

// 
  return (
    <div className="p-6 w-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Estadísticas de Usuarios</h1>
          <p className="text-gray-400">Administra la personalización de experiencia del usuario</p>
        </div>
      </div>

// 
      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-700 p-1 rounded-lg">
        {[
          { id: 'overview', label: 'Resumen', icon: BarChart3 },
          { id: 'profiles', label: 'Perfiles', icon: Users },
          { id: 'questions', label: 'Preguntas', icon: HelpCircle },
          { id: 'answers', label: 'Respuestas', icon: MessageSquare },
          { id: 'genai', label: 'Adopción GenAI', icon: TrendingUp }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === id
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-600'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

// 
      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Usuarios</p>
                  <p className="text-2xl font-bold text-white">{userStats?.totalUsers || 0}</p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            
// 
            <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Preguntas</p>
                  <p className="text-2xl font-bold text-white">{questionStats?.totalQuestions || 0}</p>
                </div>
                <HelpCircle className="w-8 h-8 text-green-500" />
              </div>
            </div>
            
// 
            <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Respuestas</p>
                  <p className="text-2xl font-bold text-white">{answerStats?.totalAnswers || 0}</p>
                </div>
                <MessageSquare className="w-8 h-8 text-purple-500" />
              </div>
            </div>
            
// 
            <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Índice AIPI Promedio</p>
                  <p className="text-2xl font-bold text-white">{genAIStats?.averageAIPIIndex?.toFixed(2) || '0.00'}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-yellow-500" />
              </div>
            </div>
          </div>

// 
          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Users by Role - Gráfica de Pastel */}
            <div className="bg-gray-700 rounded-lg p-6 border border-gray-600 min-h-[400px]">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                Usuarios por Rol
              </h3>
              {userStats?.usersByRole && userStats.usersByRole.length > 0 ? (
                <PieChartComponent 
                  data={userStats.usersByRole} 
                  dataKey="count"
                  nameKey="role"
                />
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-400">
                  No hay datos disponibles
                </div>
              )}
            </div>

// 
            {/* Users by Area - Gráfica de Pastel */}
            <div className="bg-gray-700 rounded-lg p-6 border border-gray-600 min-h-[400px]">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Usuarios por Área
              </h3>
              {userStats?.usersByArea && userStats.usersByArea.length > 0 ? (
                <PieChartComponent 
                  data={userStats.usersByArea} 
                  dataKey="count"
                  nameKey="area"
                />
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-400">
                  No hay datos disponibles
                </div>
              )}
            </div>

// 
            {/* Questions by Type - Gráfica de Barras */}
            <div className="bg-gray-700 rounded-lg p-6 border border-gray-600 min-h-[400px]">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Preguntas por Tipo
              </h3>
              {questionStats?.questionsByType && questionStats.questionsByType.length > 0 ? (
                <BarChartComponent 
                  data={questionStats.questionsByType}
                  dataKey="count"
                  nameKey="type"
                />
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-400">
                  No hay datos disponibles
                </div>
              )}
            </div>

// 
            {/* Top Countries - Gráfica de Barras */}
            <div className="bg-gray-700 rounded-lg p-6 border border-gray-600 min-h-[400px]">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Países con Mayor Índice AIPI
              </h3>
              {genAIStats?.topCountries && genAIStats.topCountries.length > 0 ? (
                <BarChartComponent 
                  data={genAIStats.topCountries}
                  dataKey="index"
                  nameKey="country"
                />
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-400">
                  No hay datos disponibles
                </div>
              )}
            </div>
          </div>
        </div>
      )}

// 
      {/* Profiles Tab */}
      {activeTab === 'profiles' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Buscar perfiles..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
                <Plus className="w-4 h-4" />
                Agregar Perfil
              </button>
            </div>
          </div>

// 
          {/* Profiles Table */}
          <div className="bg-gray-700 rounded-lg border border-gray-600 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-600">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Cargo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Rol
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Área
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      País
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-600">
                  {userProfiles.slice(0, 10).map((profile) => (
                    <tr key={profile.id} className="hover:bg-gray-600/50">
                      <td className="px-4 py-4">
                        <div className="flex items-center">
                          {profile.users?.profile_picture_url ? (
                            <img 
                              src={profile.users.profile_picture_url} 
                              alt={profile.users.username || 'Usuario'}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                              <UserCheck className="w-4 h-4 text-white" />
                            </div>
                          )}
                          <div className="ml-3">
                            <p className="text-sm font-medium text-white">
                              {profile.users?.username || profile.user_id.slice(0, 8) + '...'}
                            </p>
                            {profile.users?.email && (
                              <p className="text-xs text-gray-400">
                                {profile.users.email}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-gray-300">{profile.cargo_titulo}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {profile.roles?.nombre || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {profile.areas?.nombre || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-gray-300">{profile.pais}</span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => handleViewProfile(profile)}
                            className="text-blue-400 hover:text-blue-300 transition-colors"
                            title="Ver detalles"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleEditProfile(profile)}
                            className="text-yellow-400 hover:text-yellow-300 transition-colors"
                            title="Editar perfil"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteProfile(profile)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                            title="Eliminar perfil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

// 
      {/* Questions Tab */}
      {activeTab === 'questions' && (
        <QuestionsManagement />
      )}

// 
      {/* Answers Tab */}
      {activeTab === 'answers' && <AnswersManagement />}

// 
      {/* GenAI Tab */}
      {activeTab === 'genai' && <GenAIAdoptionManagement />}

// 
      {/* Modales */}
      {viewingProfile && (
        <ViewProfileModal
          profile={viewingProfile}
          isOpen={isViewModalOpen}
          onClose={closeModals}
        />
      )}

// 
      {editingProfile && (
        <EditProfileModal
          profile={editingProfile}
          isOpen={isEditModalOpen}
          onClose={closeModals}
          onSave={handleSaveProfile}
        />
      )}

// 
      {deletingProfile && (
        <DeleteProfileModal
          profile={deletingProfile}
          isOpen={isDeleteModalOpen}
          onClose={closeModals}
          onDelete={handleConfirmDelete}
        />
      )}
    </div>
  )
}
// 