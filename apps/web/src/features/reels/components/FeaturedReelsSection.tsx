'use client'

import { useState, useRef, useEffect } from 'react'
import { FeaturedReel } from '../services/reels.service'
import { Play, Eye, Heart, Share2, MessageCircle, Clock, Copy, X as XIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

interface FeaturedReelsSectionProps {
  reels: FeaturedReel[]
  loading: boolean
  error: string | null
}

// Componente ShareModal para compartir reel
function ShareModal({ reel, onClose }: { reel: FeaturedReel; onClose: () => void }) {
  const [copied, setCopied] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  const reelUrl = `${window.location.origin}/reels?id=${reel.id}`

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(reelUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      // console.error('Error copying to clipboard:', err)
    }
  }

  const handleShareTwitter = () => {
    const text = `Mira este reel: ${reel.title}`
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(reelUrl)}`
    window.open(twitterUrl, '_blank', 'width=600,height=400')
  }

  const handleShareFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(reelUrl)}`
    window.open(facebookUrl, '_blank', 'width=600,height=400')
  }

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: reel.title,
          text: reel.description,
          url: reelUrl
        })
      } catch (err) {
        // console.log('Error sharing:', err)
      }
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        ref={modalRef}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Compartir Reel</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <XIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-3">
          {/* Copiar enlace */}
          <button
            onClick={handleCopyLink}
            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
          >
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Copy className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-900 dark:text-white">
                {copied ? '¡Enlace copiado!' : 'Copiar enlace'}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Comparte el enlace directo
              </div>
            </div>
            {copied && (
              <div className="text-green-500">✓</div>
            )}
          </button>

          {/* Web Share API (si está disponible) */}
          {navigator.share && (
            <button
              onClick={handleNativeShare}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
            >
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Share2 className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-white">Compartir</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Usar opciones del dispositivo
                </div>
              </div>
            </button>
          )}

          {/* Twitter */}
          <button
            onClick={handleShareTwitter}
            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
          >
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
              </svg>
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-900 dark:text-white">Twitter</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Compartir en Twitter
              </div>
            </div>
          </button>

          {/* Facebook */}
          <button
            onClick={handleShareFacebook}
            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
          >
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-900 dark:text-white">Facebook</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Compartir en Facebook
              </div>
            </div>
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export function FeaturedReelsSection({ reels, loading, error }: FeaturedReelsSectionProps) {
  const router = useRouter()
  const [hoveredReel, setHoveredReel] = useState<string | null>(null)
  const [shareModalReel, setShareModalReel] = useState<FeaturedReel | null>(null)

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
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShareModalReel(reel)
                }}
                className="flex items-center gap-1 hover:text-primary transition-colors"
              >
                <Share2 className="w-4 h-4" />
                <span>{formatNumber(reel.share_count)}</span>
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Share Modal */}
      <AnimatePresence>
        {shareModalReel && (
          <ShareModal
            reel={shareModalReel}
            onClose={() => setShareModalReel(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
