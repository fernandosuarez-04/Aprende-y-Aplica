'use client'

import { useState } from 'react'
import { useCommunitiesPaginated } from '../hooks/useAdminCommunities'

/**
 * ✅ ISSUE #19: Componente de ejemplo para paginación infinita de comunidades
 * 
 * Este componente muestra cómo usar el hook useCommunitiesPaginated
 * para implementar scroll infinito o botón "Cargar más"
 * 
 * Características:
 * - Cursor-based pagination (ultra rápido)
 * - Búsqueda en tiempo real
 * - Filtros por visibilidad y estado
 * - Muestra total de resultados
 * - Botón "Cargar más" con estado de carga
 * 
 * Para usar en tu página:
 * import { CommunitiesPaginatedExample } from '@/features/admin/components/CommunitiesPaginatedExample'
 */
export function CommunitiesPaginatedExample() {
  const [search, setSearch] = useState('')
  const [visibility, setVisibility] = useState<string>('')
  const [isActive, setIsActive] = useState<boolean | undefined>(undefined)

  const {
    communities,
    total,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    error,
    fetchNextPage,
    refetch
  } = useCommunitiesPaginated({
    search,
    visibility: visibility || undefined,
    isActive,
    limit: 20
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="ml-4 text-gray-600">Cargando comunidades...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800 font-semibold">Error al cargar comunidades</p>
        <p className="text-red-600 text-sm mt-1">{error}</p>
        <button
          onClick={refetch}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Comunidades</h1>
        <div className="text-sm text-gray-600">
          Mostrando <span className="font-semibold">{communities.length}</span> de{' '}
          <span className="font-semibold">{total}</span> comunidades
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Búsqueda */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar
            </label>
            <input
              type="text"
              placeholder="Buscar por nombre o descripción..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filtro por visibilidad */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Visibilidad
            </label>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todas</option>
              <option value="public">Públicas</option>
              <option value="private">Privadas</option>
            </select>
          </div>

          {/* Filtro por estado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              value={isActive === undefined ? '' : String(isActive)}
              onChange={(e) => 
                setIsActive(
                  e.target.value === '' 
                    ? undefined 
                    : e.target.value === 'true'
                )
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todas</option>
              <option value="true">Activas</option>
              <option value="false">Inactivas</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={refetch}
            className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition"
          >
            🔄 Refrescar
          </button>
        </div>
      </div>

      {/* Lista de comunidades */}
      {communities.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-12 text-center">
          <p className="text-gray-600 text-lg">
            {search || visibility || isActive !== undefined
              ? 'No se encontraron comunidades con los filtros aplicados'
              : 'No hay comunidades para mostrar'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {communities.map((community) => (
              <div
                key={community.id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden"
              >
                {/* Imagen de la comunidad */}
                {community.image_url && (
                  <img
                    src={community.image_url}
                    alt={community.name}
                    className="w-full h-48 object-cover"
                  />
                )}

                {/* Contenido */}
                <div className="p-4">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {community.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {community.description}
                  </p>

                  {/* Estadísticas */}
                  <div className="grid grid-cols-3 gap-2 text-center border-t pt-3">
                    <div>
                      <p className="text-2xl font-bold text-blue-600">
                        {community.stats?.members_count || community.member_count || 0}
                      </p>
                      <p className="text-xs text-gray-500">Miembros</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600">
                        {community.stats?.posts_count || community.posts_count || 0}
                      </p>
                      <p className="text-xs text-gray-500">Posts</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-purple-600">
                        {community.stats?.videos_count || community.videos_count || 0}
                      </p>
                      <p className="text-xs text-gray-500">Videos</p>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-2 mt-3">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        community.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {community.is_active ? 'Activa' : 'Inactiva'}
                    </span>
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                      {community.visibility === 'public' ? 'Pública' : 'Privada'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Botón "Cargar más" */}
          {hasNextPage && (
            <div className="flex justify-center mt-8">
              <button
                onClick={fetchNextPage}
                disabled={isFetchingNextPage}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
              >
                {isFetchingNextPage ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Cargando más...</span>
                  </>
                ) : (
                  <>
                    <span>Cargar más comunidades</span>
                    <span className="text-blue-200">(+20)</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Mensaje de fin */}
          {!hasNextPage && communities.length > 0 && (
            <div className="text-center py-6">
              <p className="text-gray-500">
                ✅ Has visto todas las comunidades
                {search || visibility || isActive !== undefined
                  ? ' que coinciden con los filtros'
                  : ''}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
