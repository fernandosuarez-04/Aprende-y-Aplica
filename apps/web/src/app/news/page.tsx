'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Newspaper, 
  Eye, 
  Calendar,
  Grid3X3,
  List,
  Filter,
  Search,
  TrendingUp,
  Users,
  BookOpen,
  ArrowRight,
  Loader2,
  Video,
  Play
} from 'lucide-react'
import { useNews, useNewsStats, useFeaturedNews } from '../../features/news/hooks/useNews'
import { NewsWithMetrics } from '../../features/news/services/news.service'
import { useFeaturedReels } from '../../features/reels/hooks/useFeaturedReels'
import { FeaturedReelsSection } from '../../features/reels/components/FeaturedReelsSection'
import { useRouter } from 'next/navigation'

export default function NewsPage() {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [mounted, setMounted] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [activeTab, setActiveTab] = useState<'news' | 'reels'>('news')
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set())
  
  // Cargar el modo de vista guardado después del montaje
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('news-view-mode')
    if (saved === 'grid' || saved === 'list') {
      setViewMode(saved)
    }
  }, []);
  
  // Guardar el modo de vista en localStorage cuando cambie
  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      localStorage.setItem('news-view-mode', viewMode)
    }
  }, [viewMode, mounted])
  
  const { news, loading, error, loadMore, hasMore } = useNews({
    language: selectedCategory === 'all' ? undefined : selectedCategory
  })
  const { stats, loading: statsLoading } = useNewsStats()
  const { featuredNews, loading: featuredLoading } = useFeaturedNews(3)
  const { reels: featuredReels, loading: reelsLoading, error: reelsError } = useFeaturedReels(6)
  const navigationTabs = [
    { key: 'news', label: 'Noticias', icon: Newspaper, caption: 'Artículos curados' },
    { key: 'reels', label: 'Reels', icon: Video, caption: 'Clips en tendencia' }
  ] as const
  const viewOptions = [
    { key: 'grid', label: 'Tarjetas', icon: Grid3X3 },
    { key: 'list', label: 'Lista', icon: List }
  ] as const

  const filteredNews = news.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.intro?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleNewsClick = (slug: string) => {
    router.push(`/news/${slug}`)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

const formatStatValue = (value: number) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1).replace(/\.0$/, '')}M`
  if (value >= 1000) return `${(value / 1000).toFixed(1).replace(/\.0$/, '')}K`
  return value
}

const getCategoryLabel = (item: NewsWithMetrics) => {
  if ('category' in item && typeof item.category === 'string' && item.category.length > 0) {
    return item.category
  }
  if ('category_name' in item && typeof (item as any).category_name === 'string') {
    return (item as any).category_name
  }
  if ('topic' in item && typeof (item as any).topic === 'string') {
    return (item as any).topic
  }
  return item.language || 'IA'
}

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-carbon-950 dark:via-carbon-900 dark:to-carbon-800">
      {/* Header Section */}
      <motion.section
        className="relative overflow-hidden px-6 pt-16 pb-12 lg:px-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="absolute inset-0">
          <div className="absolute -left-32 top-0 w-96 h-96 bg-primary/20 blur-[140px] rounded-full" />
          <div className="absolute right-0 bottom-0 w-[28rem] h-[28rem] bg-primary/10 blur-[180px] rounded-full" />
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-primary/5 opacity-60" />
        </div>
        <div className="relative mx-auto max-w-6xl rounded-[2.5rem] border border-black/5 dark:border-white/10 bg-gradient-to-br from-white via-slate-50 to-blue-50 dark:from-gray-900/70 dark:via-gray-900/40 dark:to-primary/10 shadow-[0_35px_120px_rgba(15,15,20,0.15)] dark:shadow-[0_35px_120px_rgba(10,10,10,0.45)] backdrop-blur-3xl overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.2),transparent_55%)] dark:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_55%)] opacity-80" />
          <div className="relative grid gap-10 lg:grid-cols-2 p-8 lg:p-12 items-center">
            <div>
              <motion.p
                className="inline-flex items-center gap-2 rounded-full border border-black/5 dark:border-white/15 bg-gray-100/80 dark:bg-white/5 px-4 py-1 text-xs uppercase tracking-[0.3em] text-gray-700 dark:text-gray-200"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                Tendencias IA · Tiempo real
              </motion.p>
              <motion.h1
                className="mt-4 text-4xl font-bold text-gray-900 dark:text-white leading-tight lg:text-5xl"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                Noticias y Actualizaciones
              </motion.h1>
              <motion.p
                className="mt-6 text-lg text-gray-600 dark:text-gray-300 leading-relaxed"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Mantente al día con las novedades más relevantes en inteligencia artificial,
                adopción tecnológica y todo lo relacionado con Chat-Bot-LIA para tu aprendizaje.
              </motion.p>

              {/* Stats */}
              {!statsLoading && stats && (
                <motion.div
                  className="mt-8 grid gap-4 sm:grid-cols-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                >
                  {[
                    { label: 'Noticias', value: stats.totalNews },
                    { label: 'Categorías', value: stats.totalCategories },
                    { label: 'Visualizaciones', value: stats.totalViews }
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="relative overflow-hidden rounded-2xl border border-black/5 dark:border-white/15 bg-white/80 dark:bg-white/5 px-4 py-5 text-center shadow-[0_20px_60px_rgba(15,15,20,0.2)] dark:shadow-[0_20px_60px_rgba(10,10,10,0.4)]"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-transparent to-transparent opacity-80 dark:from-white/10" />
                      <div className="relative">
                        <p className="text-sm uppercase tracking-[0.18em] text-gray-500 dark:text-gray-300 break-words leading-tight">
                          {stat.label}
                        </p>
                        <p className="mt-3 text-3xl font-bold text-gray-900 dark:text-white">
                          {formatStatValue(stat.value)}
                        </p>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </div>

            {/* Right Content - Animated Orb */}
            <motion.div
              className="relative flex items-center justify-center"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25 }}
            >
              <div className="absolute inset-0 rounded-[2rem] border border-black/5 dark:border-white/10 bg-gradient-to-br from-blue-200/50 to-blue-100/30 dark:from-primary/20 dark:to-primary/5 blur-3xl" />
              <motion.div
                className="relative w-full max-w-sm rounded-[2rem] bg-gradient-to-br from-white via-blue-50 to-blue-200 dark:from-primary dark:to-blue-500 p-1 shadow-[0_30px_80px_rgba(37,99,235,0.25)] dark:shadow-[0_30px_80px_rgba(37,99,235,0.45)]"
                animate={{ rotate: [0, 1.5, -1.5, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div className="rounded-[1.8rem] bg-gradient-to-br from-white to-blue-100 dark:from-blue-600 dark:to-primary/80 p-10 text-center text-gray-900 dark:text-white">
                  <motion.div
                    animate={{ scale: [1, 1.05, 1], opacity: [0.9, 1, 0.9] }}
                    transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <BookOpen className="mx-auto h-24 w-24 drop-shadow-2xl text-primary dark:text-white" />
                    <p className="mt-6 text-base text-gray-600 dark:text-white/70">
                      Actualizado cada semana con insights y aprendizajes accionables.
                    </p>
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Navigation Tabs */}
      <motion.div 
        className="px-6 lg:px-8 -mt-6"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <div className="mx-auto max-w-5xl">
          <div className="relative rounded-3xl border border-white/40 dark:border-white/5 bg-white/80 dark:bg-gray-900/70 shadow-[0_20px_60px_rgba(10,10,10,0.35)] backdrop-blur-2xl p-2 flex flex-col gap-2 sm:flex-row">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-primary/10 via-transparent to-primary/10 opacity-60" />
            <div className="relative flex flex-col gap-2 sm:flex-row w-full">
              {navigationTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className="relative flex-1 overflow-hidden rounded-2xl px-5 py-4 text-left transition-all duration-300 focus:outline-none"
                >
                  {activeTab === tab.key && (
                    <motion.span
                      layoutId="news-tabs-highlight"
                      className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary to-primary/60 shadow-lg shadow-primary/30"
                      transition={{ type: 'spring', stiffness: 250, damping: 25 }}
                    />
                  )}
                  <div className="relative flex items-center justify-between gap-3 text-gray-700 dark:text-gray-200">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-2xl grid place-items-center bg-gradient-to-br ${
                        activeTab === tab.key
                          ? 'from-white/30 to-white/10 text-white'
                          : 'from-gray-100 to-gray-200 dark:from-white/5 dark:to-white/10 text-primary'
                      }`}>
                        <tab.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-base">{tab.label}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{tab.caption}</p>
                      </div>
                    </div>
                    <ArrowRight className={`w-4 h-4 transition-transform duration-300 ${
                      activeTab === tab.key ? 'translate-x-1 text-white' : 'text-gray-400'
                    }`} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Reels Section */}
      {activeTab === 'reels' && (
        <motion.section 
          className="px-6 py-16 lg:px-8"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          <div className="mx-auto max-w-7xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Reels</h2>
              <p className="text-gray-600 dark:text-gray-400">Videos cortos con las últimas noticias y tendencias</p>
            </div>
            
            {/* Featured Reels */}
            <FeaturedReelsSection 
              reels={featuredReels}
              loading={reelsLoading}
              error={reelsError}
            />
          </div>
        </motion.section>
      )}

      {/* Featured News Section */}
      {activeTab === 'news' && !featuredLoading && featuredNews.length > 0 && (
        <motion.section 
          className="px-6 py-16 lg:px-8"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <div className="mx-auto max-w-7xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Noticias Destacadas</h2>
              <p className="text-gray-600 dark:text-gray-400">Las noticias más importantes y relevantes del momento</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredNews.map((item, index) => (
                <motion.div
                  key={item.id}
                  className="group cursor-pointer h-full"
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.1 * index }}
                  onClick={() => handleNewsClick(item.slug)}
                >
                  <div className="relative overflow-hidden rounded-[1.8rem] border border-black/5 dark:border-white/10 bg-white shadow-[0_25px_80px_rgba(15,15,20,0.15)] dark:bg-white/5 dark:shadow-[0_25px_80px_rgba(15,15,15,0.45)] transition-all duration-300 group-hover:-translate-y-2 group-hover:border-primary/50 flex flex-col h-full">
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="h-full w-full bg-gradient-to-br from-primary/10 via-transparent to-blue-500/20 blur-3xl dark:from-primary/20 dark:to-blue-500/30" />
                    </div>
                    {/* Hero Image */}
                    <div className="relative h-48 overflow-hidden rounded-t-[1.8rem] bg-gradient-to-br from-blue-200 to-blue-100 dark:from-primary/30 dark:to-primary/10 flex items-center justify-center">
                      {item.hero_image_url && !imageErrors.has(item.id) ? (
                        <Image 
                          src={item.hero_image_url} 
                          alt={item.title}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover"
                          loading="lazy"
                          quality={80}
                          unoptimized={item.hero_image_url?.includes('supabase')}
                          onError={() => setImageErrors(prev => new Set(prev).add(item.id))}
                        />
                      ) : (
                        <Newspaper className="w-16 h-16 text-primary" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent dark:from-gray-950/90 dark:via-gray-950/20" />
                      <div className="absolute top-4 left-4 rounded-full border border-black/10 bg-white/80 text-gray-900 dark:border-white/30 dark:bg-white/20 px-4 py-1 text-xs font-semibold uppercase tracking-[0.25em] dark:text-white">
                        Destacado
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="relative p-6 flex flex-col flex-1">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="px-3 py-1 bg-blue-50 text-blue-700 dark:bg-white/10 dark:text-white text-xs font-medium rounded-full border border-blue-100 dark:border-white/15">
                          {item.language}
                        </span>
                        <span className="text-gray-500 dark:text-gray-300 text-sm">
                          {formatDate(item.published_at || item.created_at)}
                        </span>
                      </div>
                      
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 group-hover:text-primary/80 transition-colors">
                        {truncateText(item.title, 80)}
                      </h3>
                      
                      {item.intro && (
                        <p className="text-gray-600 dark:text-gray-300/90 text-sm mb-5 line-clamp-3 flex-1">
                          {truncateText(item.intro, 120)}
                        </p>
                      )}
                      
                      <div className="mt-auto flex items-center justify-between text-sm text-gray-500 dark:text-gray-300">
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4 text-primary/80" />
                          <span>{item.view_count || 0}</span>
                        </div>
                        <div className="flex items-center gap-2 text-primary/80">
                          Leer más
                          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>
      )}

      {/* Main News Section */}
      {activeTab === 'news' && (
        <motion.section 
          className="px-6 py-16 lg:px-8"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
        <div className="mx-auto max-w-7xl">
          {/* Controls */}
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] mb-12">
            {/* Search */}
            <motion.div 
              className="flex-1 bg-white/80 dark:bg-gray-900/70 border border-white/40 dark:border-white/5 rounded-3xl shadow-[0_20px_60px_rgba(15,15,15,0.35)] backdrop-blur-xl p-1.5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-300 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar noticias..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent border-none pl-12 pr-4 py-4 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none text-base font-medium"
                />
              </div>
            </motion.div>

            {/* View Mode Toggle */}
            <motion.div 
              className="bg-white/80 dark:bg-gray-900/70 border border-white/40 dark:border-white/5 rounded-3xl shadow-[0_20px_60px_rgba(15,15,15,0.35)] backdrop-blur-xl p-2 flex items-center gap-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {viewOptions.map((option) => (
                <button
                  key={option.key}
                  onClick={() => setViewMode(option.key)}
                  className="relative flex-1 overflow-hidden rounded-2xl px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300 transition-all"
                >
                  {viewMode === option.key && (
                    <motion.span
                      layoutId="news-view-highlight"
                      className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary to-primary/70 shadow-lg shadow-primary/30"
                      transition={{ type: 'spring', stiffness: 250, damping: 25 }}
                    />
                  )}
                  <div className="relative flex items-center justify-center gap-2">
                    <option.icon className={`w-4 h-4 ${viewMode === option.key ? 'text-white' : ''}`} />
                    <span className={viewMode === option.key ? 'text-white' : ''}>{option.label}</span>
                  </div>
                </button>
              ))}
            </motion.div>
          </div>

          {/* News Grid/List */}
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <p className="text-gray-600 dark:text-gray-400">Error al cargar las noticias: {error}</p>
            </div>
          ) : filteredNews.length === 0 ? (
            <div className="text-center py-16">
              <Newspaper className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No se encontraron noticias</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={viewMode}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className={viewMode === 'grid' 
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'
                  : 'space-y-6'
                }
              >
                {filteredNews.map((item, index) => (
                  <motion.div
                    key={item.id}
                    className={`group cursor-pointer ${viewMode === 'grid' ? 'h-full' : ''}`}
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.1 * index }}
                    onClick={() => handleNewsClick(item.slug)}
                  >
                    <div className={`group relative overflow-hidden rounded-[1.5rem] border border-black/5 dark:border-white/10 bg-white shadow-[0_20px_60px_rgba(15,15,20,0.15)] dark:bg-white/[0.04] dark:shadow-[0_20px_60px_rgba(10,10,10,0.35)] backdrop-blur-xl transition-all duration-300 hover:border-primary/40 hover:-translate-y-1 flex ${
                      viewMode === 'list' ? 'flex-col md:flex-row' : 'flex-col'
                    }`}>
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                        <div className="h-full w-full bg-gradient-to-br from-primary/10 via-transparent to-blue-500/20 blur-3xl dark:from-primary/15" />
                      </div>
                      {/* Hero Image */}
                      <div className={`${viewMode === 'list' ? 'md:w-56 h-48 md:h-48' : 'h-48'} relative overflow-hidden rounded-t-[1.5rem] md:rounded-tr-none md:rounded-l-[1.5rem] bg-gradient-to-br from-blue-100 to-blue-50 dark:from-primary/30 dark:to-primary/10 flex items-center justify-center flex-shrink-0`}>
                        {item.hero_image_url && !imageErrors.has(item.id) ? (
                          <Image 
                            src={item.hero_image_url} 
                            alt={item.title}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="object-cover"
                            loading="lazy"
                            quality={75}
                            unoptimized={item.hero_image_url?.includes('supabase')}
                            onError={() => setImageErrors(prev => new Set(prev).add(item.id))}
                          />
                        ) : (
                          <Newspaper className="w-10 h-10 text-white/80" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-950/90 via-gray-950/30 to-transparent" />
                        <span className="absolute top-4 left-4 rounded-full bg-black/10 text-gray-800 dark:bg-black/40 dark:text-white/80 px-3 py-1 text-[11px] tracking-[0.25em] uppercase">
                          {getCategoryLabel(item)}
                        </span>
                      </div>
                      
                      {/* Content */}
                      <div className="relative p-6 flex-1 flex flex-col">
                        <div className="flex flex-wrap items-center gap-2 mb-3 text-sm text-gray-500 dark:text-gray-400">
                          <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100 text-xs font-medium dark:bg-white/10 dark:text-white dark:border-white/10">
                            {item.language}
                          </span>
                          <span className="text-gray-500 dark:text-gray-400">{formatDate(item.published_at || item.created_at)}</span>
                        </div>
                        
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 group-hover:text-primary/80 transition-colors">
                          {truncateText(item.title, viewMode === 'list' ? 100 : 80)}
                        </h3>
                        
                        {item.intro && (
                          <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3 flex-1">
                            {truncateText(item.intro, viewMode === 'list' ? 200 : 120)}
                          </p>
                        )}
                        
                        <div className="mt-auto flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                              <Eye className="w-4 h-4 text-primary/80" />
                              <span>{item.view_count || 0}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-primary/70">
                            Leer artículo
                            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          )}

          {/* Load More Button */}
          {hasMore && !loading && (
            <motion.div 
              className="text-center mt-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <button
                onClick={loadMore}
                className="group relative inline-flex items-center gap-2 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-primary to-blue-500 px-10 py-4 text-white shadow-[0_20px_60px_rgba(37,99,235,0.35)] transition-all duration-300 hover:translate-y-[-2px]"
              >
                <span className="relative z-10 font-semibold">Cargar más noticias</span>
                <ArrowRight className="relative z-10 w-5 h-5 transition-transform group-hover:translate-x-1" />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/20" />
              </button>
            </motion.div>
          )}
        </div>
        </motion.section>
      )}

      {/* AI Chat Agent - Ahora está en el layout principal (ConditionalAIChatAgent) para persistencia entre páginas */}
    </div>
  )
}
