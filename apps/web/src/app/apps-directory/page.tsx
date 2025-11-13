'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Grid3X3, Star, List } from 'lucide-react';
import { Button } from '@aprende-y-aplica/ui';
import { AppCard } from '../../features/ai-directory/components/AppCard';
import { SearchBar } from '../../features/ai-directory/components/SearchBar';
import { LoadingSpinner } from '../../features/ai-directory/components/LoadingSpinner';
import { useApps } from '../../features/ai-directory/hooks/useApps';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
};

export default function AppsDirectoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFeatured, setShowFeatured] = useState(false);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { apps, loading, error, pagination, refetch } = useApps({
    search: searchQuery,
    featured: showFeatured,
    sortBy,
    sortOrder
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleFeaturedToggle = () => {
    setShowFeatured(!showFeatured);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setShowFeatured(false);
  };

  const hasActiveFilters = searchQuery || showFeatured;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 relative pb-12">
      {/* Background Effects - Applied to entire page */}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 z-0" />
      <div className="fixed inset-0 bg-[url('/grid.svg')] bg-center opacity-20 dark:opacity-10 pointer-events-none z-0" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full blur-3xl pointer-events-none z-0" />
      
      {/* Hero Section */}
      <motion.div
        className="relative pt-24 pb-16 overflow-hidden z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            className="text-center max-w-4xl mx-auto"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 dark:bg-blue-500/10 border border-blue-500/20 dark:border-blue-500/20 mb-6"
              variants={itemVariants}
            >
              <Grid3X3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Apps Directory</span>
            </motion.div>

            <motion.h1
              className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-blue-700 to-cyan-700 dark:from-white dark:via-blue-200 dark:to-cyan-200 bg-clip-text text-transparent"
              variants={itemVariants}
            >
              Herramientas de IA
            </motion.h1>

            <motion.p
              className="text-xl text-gray-700 dark:text-gray-300 mb-8 max-w-2xl mx-auto"
              variants={itemVariants}
            >
              Descubre las mejores herramientas de inteligencia artificial para potenciar tu productividad y creatividad
            </motion.p>

            <motion.div 
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4 items-center justify-center max-w-3xl mx-auto"
            >
              <div className="flex-1 w-full">
                <SearchBar
                  onSearch={handleSearch}
                  placeholder="Buscar herramientas de IA por nombre, categoría o descripción..."
                  className="w-full"
                />
              </div>
              
              <div className="flex gap-3">
                {/* Featured Toggle */}
                <button
                  onClick={handleFeaturedToggle}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all whitespace-nowrap ${
                    showFeatured
                      ? 'bg-blue-500/20 dark:bg-blue-500/20 border-blue-500 dark:border-blue-500 text-blue-700 dark:text-blue-300'
                      : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                >
                  <Star className="w-4 h-4" />
                  <span className="text-sm">Destacados</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>


      {/* Results Section */}
      <motion.div
        className="container mx-auto px-4 relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        {/* Results Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {loading ? 'Cargando...' : `${pagination?.total || 0} Herramientas Encontradas`}
            </h2>
            {hasActiveFilters && (
              <p className="text-gray-600 dark:text-gray-400">
                Filtros aplicados: {searchQuery && `"${searchQuery}"`} 
                {showFeatured && ' • Destacados'}
              </p>
            )}
          </div>
          
          {/* View Mode Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-3 rounded-xl transition-all ${
                viewMode === 'grid' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-700'
              }`}
            >
              <Grid3X3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-3 rounded-xl transition-all ${
                viewMode === 'list' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-700'
              }`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <div className="text-red-400 mb-4">Error al cargar las herramientas</div>
            <Button onClick={() => refetch()} variant="primary">
              Reintentar
            </Button>
          </div>
        )}

        {/* Apps Grid/List */}
        {!loading && !error && (
          <AnimatePresence mode="wait">
            <motion.div
              key={viewMode}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className={viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12 items-stretch'
                : 'space-y-6 mb-12'
              }
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {apps.map((app, index) => (
                <motion.div
                  key={app.app_id}
                  variants={itemVariants}
                  custom={index}
                  className={viewMode === 'list' ? 'w-full' : 'h-full'}
                >
                  <AppCard app={app} viewMode={viewMode} />
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Empty State */}
        {!loading && !error && apps.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <Search className="w-12 h-12 text-gray-600 dark:text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No se encontraron herramientas</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Intenta ajustar tus filtros de búsqueda o explorar diferentes herramientas
            </p>
            <Button onClick={clearFilters} variant="primary">
              Limpiar Filtros
            </Button>
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && apps.length > 0 && pagination && pagination.totalPages > 1 && (
          <div className="flex justify-center">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                disabled={pagination.page === 1}
                onClick={() => {
                  // Handle previous page
                }}
              >
                Anterior
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <Button
                      key={page}
                      variant={pagination.page === page ? "primary" : "ghost"}
                      size="sm"
                      onClick={() => {
                        // Handle page change
                      }}
                    >
                      {page}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="ghost"
                disabled={pagination.page === pagination.totalPages}
                onClick={() => {
                  // Handle next page
                }}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
