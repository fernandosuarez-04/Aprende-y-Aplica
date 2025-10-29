'use client'

import { useState } from 'react'
import { FeaturedReel } from '../services/reels.service'
import { Play, Eye, Heart, Share2, MessageCircle, Clock } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface FeaturedReelsSectionProps {
  reels: FeaturedReel[]
  loading: boolean
  error: string | null
}

export function FeaturedReelsSection({ reels, loading, error }: FeaturedReelsSectionProps) {
  const router = useRouter()
  const [hoveredReel, setHoveredReel] = useState<string | null>(null)

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num.toString()
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden animate-pulse">
            <div className="aspect-video bg-gray-200 dark:bg-gray-700"></div>
            <div className="p-4">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <div className="w-24 h-24 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Play className="w-12 h-12 text-red-500" />
        </div>
        <h3 className="text-2xl font-bold text-text-primary mb-4">Error al cargar reels</h3>
        <p className="text-text-secondary mb-8 max-w-md mx-auto">
          Hubo un problema al cargar los reels destacados. Por favor, intenta de nuevo.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-8 py-3 bg-primary text-white rounded-xl hover:bg-primary/80 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/30"
        >
          Reintentar
        </button>
      </div>
    )
  }

  if (reels.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Play className="w-12 h-12 text-primary/70" />
        </div>
        <h3 className="text-2xl font-bold text-text-primary mb-4">No hay reels disponibles</h3>
        <p className="text-text-secondary mb-8 max-w-md mx-auto">
          Los reels aparecerán aquí una vez que se suban videos a la plataforma.
        </p>
        <button
          onClick={() => router.push('/reels')}
          className="px-8 py-3 bg-primary text-white rounded-xl hover:bg-primary/80 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/30 flex items-center gap-2 mx-auto"
        >
          <Play className="w-5 h-5" />
          Ir a Reels
        </button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {reels.map((reel) => (
        <div
          key={reel.id}
          className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer group"
          onMouseEnter={() => setHoveredReel(reel.id)}
          onMouseLeave={() => setHoveredReel(null)}
          onClick={() => router.push(`/reels`)}
        >
          {/* Thumbnail */}
          <div className="relative aspect-video overflow-hidden">
            <img
              src={reel.thumbnail_url}
              alt={reel.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                <Play className="w-8 h-8 text-white" />
              </div>
            </div>

            {/* Duration */}
            <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded-md text-xs flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDuration(reel.duration_seconds)}
            </div>

            {/* Category Badge */}
            <div className="absolute top-2 left-2 bg-primary/90 text-white px-2 py-1 rounded-md text-xs font-medium">
              {reel.category}
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            <h3 className="font-bold text-text-primary mb-2 line-clamp-2 group-hover:text-primary transition-colors">
              {reel.title}
            </h3>
            <p className="text-text-secondary text-sm line-clamp-2 mb-3">
              {reel.description}
            </p>

            {/* Stats */}
            <div className="flex items-center justify-between text-sm text-text-secondary">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  <span>{formatNumber(reel.view_count)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Heart className="w-4 h-4" />
                  <span>{formatNumber(reel.like_count)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="w-4 h-4" />
                  <span>{formatNumber(reel.comment_count)}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Share2 className="w-4 h-4" />
                <span>{formatNumber(reel.share_count)}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
