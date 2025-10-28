import { NextRequest, NextResponse } from 'next/server'
import { FavoritesService } from '../../../features/courses/services/favorites.service'
import { formatApiError, logError } from '@/core/utils/api-errors'

// GET - Obtener favoritos de un usuario
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId es requerido' },
        { status: 400 }
      )
    }

    const favorites = await FavoritesService.getUserFavorites(userId)
    return NextResponse.json(favorites)
  } catch (error) {
    logError('GET /api/favorites', error)
    return NextResponse.json(
      formatApiError(error, 'Error al obtener favoritos'),
      { status: 500 }
    )
  }
}

// POST - Agregar/remover favorito
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, courseId } = body

    if (!userId || !courseId) {
      return NextResponse.json(
        { error: 'userId y courseId son requeridos' },
        { status: 400 }
      )
    }

    const isFavorite = await FavoritesService.toggleFavorite(userId, courseId)

    return NextResponse.json({
      success: true,
      isFavorite,
      message: isFavorite ? 'Agregado a favoritos' : 'Removido de favoritos'
    })
  } catch (error) {
    logError('POST /api/favorites', error)
    return NextResponse.json(
      formatApiError(error, 'Error al gestionar favoritos'),
      { status: 500 }
    )
  }
}
