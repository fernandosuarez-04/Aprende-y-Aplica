'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Grid3X3, Clock, Star, Eye, ExternalLink, ChevronDown, X } from 'lucide-react';
import { Button } from '@aprende-y-aplica/ui';
import { AppCard } from '../../features/ai-directory/components/AppCard';
import { CategoryFilter } from '../../features/ai-directory/components/CategoryFilter';
import { SearchBar } from '../../features/ai-directory/components/SearchBar';
import { AdvancedFilters } from '../../features/ai-directory/components/AdvancedFilters';
import { LoadingSpinner } from '../../features/ai-directory/components/LoadingSpinner';
import { useApps } from '../../features/ai-directory/hooks/useApps';
import { useCategories } from '../../features/ai-directory/hooks/useCategories';

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
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPricing, setSelectedPricing] = useState<string | null>(null);
  const [showFeatured, setShowFeatured] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { apps, loading, error, pagination, refetch } = useApps({
    search: searchQuery,
    category: selectedCategory,
    pricing: selectedPricing,
    featured: showFeatured,
    sortBy,
    sortOrder
  });

  const { categories } = useCategories();

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleCategoryChange = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
  };

  const handlePricingChange = (pricing: string | null) => {
    setSelectedPricing(pricing);
  };

  const handleFeaturedToggle = () => {
    setShowFeatured(!showFeatured);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory(null);
    setSelectedPricing(null);
    setShowFeatured(false);
  };

  const hasActiveFilters = searchQuery || selectedCategory || selectedPricing || showFeatured;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Hero Section */}
      <motion.div
        className="relative pt-24 pb-16 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            className="text-center max-w-4xl mx-auto"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6"
              variants={itemVariants}
            >
              <Grid3X3 className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-blue-300">Apps Directory</span>
            </motion.div>

            <motion.h1
              className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-blue-200 to-cyan-200 bg-clip-text text-transparent"
              variants={itemVariants}
            >
              Herramientas de IA
            </motion.h1>

            <motion.p
              className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto"
              variants={itemVariants}
            >
              Descubre las mejores herramientas de inteligencia artificial para potenciar tu productividad y creatividad
            </motion.p>

            <motion.div variants={itemVariants}>
              <SearchBar
                onSearch={handleSearch}
                placeholder="Buscar herramientas de IA por nombre, categoría o descripción..."
                className="max-w-2xl mx-auto"
              />
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Filters Section */}
      <motion.div
        className="container mx-auto px-4 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <div className="bg-gray-900/50 backdrop-blur-md border border-gray-700 rounded-2xl p-6">
          {/* Category Filters */}
          <div className="mb-6">
            <CategoryFilter
              categories={categories}
              selectedCategory={selectedCategory}
              onCategoryChange={handleCategoryChange}
            />
          </div>

          {/* Additional Filters */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Pricing Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Precio:</span>
              <select
                value={selectedPricing || ''}
                onChange={(e) => handlePricingChange(e.target.value || null)}
                className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos</option>
                <option value="free">Gratuito</option>
                <option value="freemium">Freemium</option>
                <option value="paid">De Pago</option>
                <option value="subscription">Suscripción</option>
              </select>
            </div>

            {/* Featured Toggle */}
            <button
              onClick={handleFeaturedToggle}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                showFeatured
                  ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                  : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-500'
              }`}
            >
              <Star className="w-4 h-4" />
              <span className="text-sm">Destacados</span>
            </button>

            {/* Advanced Filters */}
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-600 text-gray-300 hover:border-gray-500 transition-all"
            >
              <Filter className="w-4 h-4" />
              <span className="text-sm">Filtros Avanzados</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
            </button>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-500/50 text-red-400 hover:border-red-500 transition-all"
              >
                <X className="w-4 h-4" />
                <span className="text-sm">Limpiar Filtros</span>
              </button>
            )}
          </div>

          {/* Advanced Filters Panel */}
          <AnimatePresence>
            {showAdvancedFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-6 pt-6 border-t border-gray-700"
              >
                <AdvancedFilters
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSortByChange={setSortBy}
                  onSortOrderChange={setSortOrder}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Results Section */}
      <motion.div
        className="container mx-auto px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        {/* Results Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {loading ? 'Cargando...' : `${pagination?.total || 0} Herramientas Encontradas`}
            </h2>
            {hasActiveFilters && (
              <p className="text-gray-400">
                Filtros aplicados: {searchQuery && `"${searchQuery}"`} 
                {selectedCategory && ` • Categoría: ${categories.find(c => c.category_id === selectedCategory)?.name}`}
                {selectedPricing && ` • Precio: ${selectedPricing}`}
                {showFeatured && ' • Destacados'}
              </p>
            )}
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

        {/* Apps Grid */}
        {!loading && !error && (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {apps.map((app, index) => (
              <motion.div
                key={app.app_id}
                variants={itemVariants}
                custom={index}
              >
                <AppCard app={app} />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Empty State */}
        {!loading && !error && apps.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-800 flex items-center justify-center">
              <Search className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No se encontraron herramientas</h3>
            <p className="text-gray-400 mb-6">
              Intenta ajustar tus filtros de búsqueda o explorar diferentes categorías
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
