'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Newspaper, 
  Eye, 
  MessageCircle, 
  Calendar,
  Grid3X3,
  List,
  Filter,
  Search,
  TrendingUp,
  Users,
  BookOpen,
  ArrowRight,
  Loader2
} from 'lucide-react'
import { useNews, useNewsStats, useFeaturedNews } from '../../features/news/hooks/useNews'
import { NewsWithMetrics } from '../../features/news/services/news.service'
import { useRouter } from 'next/navigation'
import { DashboardNavbar } from '../../core/components/DashboardNavbar'

export default function NewsPage() {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  
  const { news, loading, error, loadMore, hasMore } = useNews({
    language: selectedCategory === 'all' ? undefined : selectedCategory
  })
  const { stats, loading: statsLoading } = useNewsStats()
  const { featuredNews, loading: featuredLoading } = useFeaturedNews(3)

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-carbon-950 via-carbon-900 to-carbon-800">
      {/* Dashboard Navbar */}
      <DashboardNavbar activeItem="news" />
      
      {/* Header Section */}
      <motion.div 
        className="relative overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent" />
        <div className="relative px-6 py-16 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left Content */}
              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <h1 className="text-4xl lg:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/70 mb-6">
                  Noticias y Actualizaciones
                </h1>
                <p className="text-xl text-text-secondary mb-8 leading-relaxed">
                  Mantente al día con las últimas novedades en inteligencia artificial, 
                  tecnología educativa y todo lo relacionado con Chat-Bot-LIA
                </p>
                
                {/* Stats */}
                {!statsLoading && stats && (
                  <motion.div 
                    className="grid grid-cols-3 gap-6"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                  >
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary mb-2">{stats.totalNews}</div>
                      <div className="text-sm text-text-tertiary">NOTICIAS</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary mb-2">{stats.totalCategories}</div>
                      <div className="text-sm text-text-tertiary">CATEGORÍAS</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary mb-2">{stats.totalViews}</div>
                      <div className="text-sm text-text-tertiary">VISUALIZACIONES</div>
                    </div>
                  </motion.div>
                )}
              </motion.div>

              {/* Right Content - Animated Brain */}
              <motion.div
                className="flex justify-center lg:justify-end"
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                <motion.div
                  className="relative w-64 h-64 lg:w-80 lg:h-80"
                  animate={{ 
                    rotate: [0, 5, -5, 0],
                    scale: [1, 1.05, 1]
                  }}
                  transition={{ 
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/70 rounded-full blur-3xl opacity-30" />
                  <div className="relative w-full h-full bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center shadow-2xl">
                    <motion.div
                      animate={{ 
                        scale: [1, 1.1, 1],
                        opacity: [0.8, 1, 0.8]
                      }}
                      transition={{ 
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <BookOpen className="w-32 h-32 lg:w-40 lg:h-40 text-white" />
                    </motion.div>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Featured News Section */}
      {!featuredLoading && featuredNews.length > 0 && (
        <motion.section 
          className="px-6 py-16 lg:px-8"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <div className="mx-auto max-w-7xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-text-primary mb-4">Noticias Destacadas</h2>
              <p className="text-text-secondary">Las noticias más importantes y relevantes del momento</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredNews.map((item, index) => (
                <motion.div
                  key={item.id}
                  className="group cursor-pointer"
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.1 * index }}
                  onClick={() => handleNewsClick(item.slug)}
                >
                  <div className="bg-carbon-800/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-carbon-700/50 hover:border-primary/50 transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl group-hover:shadow-primary/20">
                    {/* Hero Image */}
                    <div className="relative h-48 bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                      {item.hero_image_url ? (
                        <img 
                          src={item.hero_image_url} 
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Newspaper className="w-16 h-16 text-primary/70" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-carbon-900/80 to-transparent" />
                    </div>
                    
                    {/* Content */}
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-3 py-1 bg-primary/20 text-primary text-xs font-medium rounded-full">
                          {item.language}
                        </span>
                        <span className="text-text-tertiary text-sm">
                          {formatDate(item.published_at || item.created_at)}
                        </span>
                      </div>
                      
                      <h3 className="text-lg font-semibold text-text-primary mb-3 group-hover:text-primary transition-colors">
                        {truncateText(item.title, 80)}
                      </h3>
                      
                      {item.intro && (
                        <p className="text-text-secondary text-sm mb-4 line-clamp-3">
                          {truncateText(item.intro, 120)}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-text-tertiary text-sm">
                          <div className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            <span>{item.view_count || 0}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageCircle className="w-4 h-4" />
                            <span>{item.comment_count || 0}</span>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-primary group-hover:translate-x-1 transition-transform" />
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
      <motion.section 
        className="px-6 py-16 lg:px-8"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.6 }}
      >
        <div className="mx-auto max-w-7xl">
          {/* Controls */}
          <div className="flex flex-col lg:flex-row gap-6 mb-12">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-tertiary w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar noticias..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-carbon-800/50 border border-carbon-700/50 rounded-xl text-text-primary placeholder-text-tertiary focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-3 rounded-xl transition-all ${
                  viewMode === 'grid' 
                    ? 'bg-primary text-white' 
                    : 'bg-carbon-800/50 text-text-tertiary hover:text-text-primary'
                }`}
              >
                <Grid3X3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-3 rounded-xl transition-all ${
                  viewMode === 'list' 
                    ? 'bg-primary text-white' 
                    : 'bg-carbon-800/50 text-text-tertiary hover:text-text-primary'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* News Grid/List */}
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <p className="text-text-secondary">Error al cargar las noticias: {error}</p>
            </div>
          ) : filteredNews.length === 0 ? (
            <div className="text-center py-16">
              <Newspaper className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
              <p className="text-text-secondary">No se encontraron noticias</p>
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
                    className="group cursor-pointer"
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.1 * index }}
                    onClick={() => handleNewsClick(item.slug)}
                  >
                    <div className={`bg-carbon-800/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-carbon-700/50 hover:border-primary/50 transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl group-hover:shadow-primary/20 ${
                      viewMode === 'list' ? 'flex' : ''
                    }`}>
                      {/* Hero Image */}
                      <div className={`${viewMode === 'list' ? 'w-48 h-32' : 'h-48'} bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0`}>
                        {item.hero_image_url ? (
                          <img 
                            src={item.hero_image_url} 
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Newspaper className="w-8 h-8 text-primary/70" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-carbon-900/80 to-transparent" />
                      </div>
                      
                      {/* Content */}
                      <div className="p-6 flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="px-3 py-1 bg-primary/20 text-primary text-xs font-medium rounded-full">
                            {item.language}
                          </span>
                          <span className="text-text-tertiary text-sm">
                            {formatDate(item.published_at || item.created_at)}
                          </span>
                        </div>
                        
                        <h3 className="text-lg font-semibold text-text-primary mb-3 group-hover:text-primary transition-colors">
                          {truncateText(item.title, viewMode === 'list' ? 100 : 80)}
                        </h3>
                        
                        {item.intro && (
                          <p className="text-text-secondary text-sm mb-4 line-clamp-3">
                            {truncateText(item.intro, viewMode === 'list' ? 200 : 120)}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-text-tertiary text-sm">
                            <div className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              <span>{item.view_count || 0}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageCircle className="w-4 h-4" />
                              <span>{item.comment_count || 0}</span>
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-primary group-hover:translate-x-1 transition-transform" />
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
                className="px-8 py-3 bg-primary text-white rounded-xl hover:bg-primary/80 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/30"
              >
                Cargar más noticias
              </button>
            </motion.div>
          )}
        </div>
      </motion.section>

      {/* Newsletter Section */}
      <motion.section 
        className="px-6 py-16 lg:px-8"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.7 }}
      >
        <div className="mx-auto max-w-4xl">
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-3xl p-8 lg:p-12 text-center border border-primary/20">
            <h2 className="text-3xl font-bold text-text-primary mb-4">
              ¡No te pierdas nada!
            </h2>
            <p className="text-text-secondary mb-8 text-lg">
              Suscríbete a nuestro boletín para recibir las últimas noticias y actualizaciones 
              directamente en tu correo electrónico.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Tu correo electrónico"
                className="flex-1 px-4 py-3 bg-carbon-800/50 border border-carbon-700/50 rounded-xl text-text-primary placeholder-text-tertiary focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
              />
              <button className="px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/80 transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2">
                <span>Suscribirse</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            
            <p className="text-text-tertiary text-sm mt-4">
              No spam, solo contenido relevante. Puedes cancelar en cualquier momento.
            </p>
          </div>
        </div>
      </motion.section>
    </div>
  )
}
