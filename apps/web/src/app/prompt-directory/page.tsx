'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Sparkles, Clock, Star, Eye, Download, ChevronDown, X, Plus, Wand2, Heart } from 'lucide-react';
import { Button } from '@aprende-y-aplica/ui';
import { PromptCard } from '../../features/ai-directory/components/PromptCard';
import { CategoryFilter } from '../../features/ai-directory/components/CategoryFilter';
import { SearchBar } from '../../features/ai-directory/components/SearchBar';
import { AdvancedFilters } from '../../features/ai-directory/components/AdvancedFilters';
import { LoadingSpinner } from '../../features/ai-directory/components/LoadingSpinner';
import { usePrompts } from '../../features/ai-directory/hooks/usePrompts';
import { useCategories } from '../../features/ai-directory/hooks/useCategories';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { PromptFavoritesProvider } from '../../features/ai-directory/context/PromptFavoritesContext';

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

export default function PromptDirectoryPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [showFeatured, setShowFeatured] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Asegurar que el componente esté montado antes de renderizar contenido dependiente del cliente
  useEffect(() => {
    setMounted(true);
  }, []);

  const { prompts, loading, error, pagination, refetch } = usePrompts({
    search: searchQuery,
    category: selectedCategory,
    difficulty: selectedDifficulty,
    featured: showFeatured,
    favorites: showFavorites,
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

  const handleDifficultyChange = (difficulty: string | null) => {
    setSelectedDifficulty(difficulty);
  };

  const handleFeaturedToggle = () => {
    setShowFeatured(!showFeatured);
  };

  const handleFavoritesToggle = () => {
    setShowFavorites(!showFavorites);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory(null);
    setSelectedDifficulty(null);
    setShowFeatured(false);
    setShowFavorites(false);
  };

  const hasActiveFilters = searchQuery || selectedCategory || selectedDifficulty || showFeatured || showFavorites;

  return (
    <PromptFavoritesProvider>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
      {/* Hero Section */}
      <motion.div
        className="relative pt-24 pb-16 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 relative z-10" suppressHydrationWarning>
          <motion.div
            className="text-center max-w-4xl mx-auto"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            suppressHydrationWarning
          >
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 dark:bg-purple-500/10 border border-purple-500/20 dark:border-purple-500/20 mb-6"
              variants={itemVariants}
            >
              <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Prompt Directory</span>
            </motion.div>

            <motion.h1
              className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-purple-700 to-pink-700 dark:from-white dark:via-purple-200 dark:to-pink-200 bg-clip-text text-transparent"
              variants={itemVariants}
            >
              Colección de Prompts
            </motion.h1>

            <motion.p
              className="text-xl text-gray-700 dark:text-gray-300 mb-8 max-w-2xl mx-auto"
              variants={itemVariants}
            >
              Descubre y utiliza los mejores prompts de IA para maximizar tu productividad y creatividad
            </motion.p>

            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8"
              variants={itemVariants}
            >
              <Button
                onClick={() => router.push('/prompt-directory/create')}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Wand2 className="w-5 h-5 mr-2" />
                Crear Prompt con IA
              </Button>
              
              <div className="text-sm text-gray-600 dark:text-gray-400">
                o explora nuestra colección
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <SearchBar
                onSearch={handleSearch}
                placeholder="Buscar prompts por nombre, categoría o descripción..."
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
        <div className="bg-white/80 dark:bg-gray-900/50 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
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
            {/* Difficulty Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Dificultad:</span>
              <select
                value={selectedDifficulty || ''}
                onChange={(e) => handleDifficultyChange(e.target.value || null)}
                className="px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Todas</option>
                <option value="beginner">Principiante</option>
                <option value="intermediate">Intermedio</option>
                <option value="advanced">Avanzado</option>
              </select>
            </div>

            {/* Featured Toggle */}
            <button
              onClick={handleFeaturedToggle}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                showFeatured
                  ? 'bg-purple-500/20 dark:bg-purple-500/20 border-purple-500 dark:border-purple-500 text-purple-700 dark:text-purple-300'
                  : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
              }`}
            >
              <Star className="w-4 h-4" />
              <span className="text-sm">Destacados</span>
            </button>

            {/* Favorites Toggle */}
            {mounted && (
              <button
                onClick={handleFavoritesToggle}
                disabled={!user}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                  !user
                    ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-500'
                    : showFavorites
                    ? 'bg-red-500/20 dark:bg-red-500/20 border-red-500 dark:border-red-500 text-red-700 dark:text-red-300'
                    : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
                }`}
                title={!user ? 'Inicia sesión para ver tus favoritos' : showFavorites ? 'Ocultar favoritos' : 'Mostrar favoritos'}
              >
                <Heart className={`w-4 h-4 ${showFavorites ? 'fill-current' : ''}`} />
                <span className="text-sm">Favoritos</span>
              </button>
            )}

            {/* Advanced Filters */}
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 transition-all"
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
                className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700"
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
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {loading ? 'Cargando...' : `${pagination?.total || 0} Prompts Encontrados`}
            </h2>
            {hasActiveFilters && (
              <p className="text-gray-600 dark:text-gray-400">
                Filtros aplicados: {searchQuery && `"${searchQuery}"`} 
                {selectedCategory && ` • Categoría: ${categories.find(c => c.category_id === selectedCategory)?.name}`}
                {selectedDifficulty && ` • Dificultad: ${selectedDifficulty}`}
                {showFeatured && ' • Destacados'}
                {showFavorites && ' • Favoritos'}
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
            <div className="text-red-400 mb-4">Error al cargar los prompts</div>
            <Button onClick={() => refetch()} variant="primary">
              Reintentar
            </Button>
          </div>
        )}

        {/* Prompts Grid */}
        {!loading && !error && (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {prompts.map((prompt, index) => (
              <motion.div
                key={prompt.prompt_id}
                variants={itemVariants}
                custom={index}
              >
                <PromptCard prompt={prompt} />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Empty State */}
        {!loading && !error && prompts.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <Search className="w-12 h-12 text-gray-600 dark:text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No se encontraron prompts</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Intenta ajustar tus filtros de búsqueda o explorar diferentes categorías
            </p>
            <Button onClick={clearFilters} variant="primary">
              Limpiar Filtros
            </Button>
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && prompts.length > 0 && pagination && pagination.totalPages > 1 && (
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
    </PromptFavoritesProvider>
  );
}
